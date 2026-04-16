-- =============================================================================
-- compute_score_tree() — Database-driven score computation
-- =============================================================================
--
-- Computes the full score hierarchy for an admin area (or globally) by reading
-- scoring configuration from `scoring_config.*` tables and OSM data from
-- `public.osm_*` tables.
--
-- Returns a single composite `score_tree` row containing arrays for each
-- aggregation level: criteria → topics → sub-categories → top-level
-- categories → overall score. Callers (Observable notebooks, PL/pgSQL
-- wrappers, the TypeScript worker) can inspect or persist the results.
--
-- The function computes criterion scores exactly ONCE and aggregates upward
-- through a single CTE chain — no redundant OSM table scans.
--
-- This function does NOT write to the result tables.
--
-- Prerequisites:
--   - scoring_config schema exists and is seeded
--     (run docker/scoring-config-schema-and-seed.sql first)
--
-- Usage:
--   psql -h localhost -p <port> -U <user> -d <db> -f docker/compute-scores.sql
--
--   SELECT * FROM scoring_config.compute_score_tree(-62422);  -- Berlin
--
-- =============================================================================

BEGIN;

-- ─── Return types ───────────────────────────────────────────────────────────

DROP TYPE IF EXISTS scoring_config.criterion_score_row CASCADE;
CREATE TYPE scoring_config.criterion_score_row AS (
  sub_category_id     TEXT,
  topic_id            TEXT,
  criterion_id        TEXT,
  score               DOUBLE PRECISION,
  data_quality_factor DOUBLE PRECISION,
  tag_count           BIGINT,
  weight              DOUBLE PRECISION
);

DROP TYPE IF EXISTS scoring_config.topic_score_row CASCADE;
CREATE TYPE scoring_config.topic_score_row AS (
  sub_category_id     TEXT,
  topic_id            TEXT,
  score               DOUBLE PRECISION,
  data_quality_factor DOUBLE PRECISION,
  unadjusted_score    DOUBLE PRECISION
);

DROP TYPE IF EXISTS scoring_config.sub_category_score_row CASCADE;
CREATE TYPE scoring_config.sub_category_score_row AS (
  top_level_category_id TEXT,
  sub_category_id       TEXT,
  score                 DOUBLE PRECISION,
  data_quality_factor   DOUBLE PRECISION,
  weight                DOUBLE PRECISION
);

DROP TYPE IF EXISTS scoring_config.top_level_category_score_row CASCADE;
CREATE TYPE scoring_config.top_level_category_score_row AS (
  top_level_category_id TEXT,
  score                 DOUBLE PRECISION,
  data_quality_factor   DOUBLE PRECISION,
  weight                DOUBLE PRECISION
);

DROP TYPE IF EXISTS scoring_config.score_tree CASCADE;
CREATE TYPE scoring_config.score_tree AS (
  overall_score               DOUBLE PRECISION,
  overall_data_quality_factor DOUBLE PRECISION,
  criteria   scoring_config.criterion_score_row[],
  topics     scoring_config.topic_score_row[],
  sub_cats   scoring_config.sub_category_score_row[],
  top_cats   scoring_config.top_level_category_score_row[]
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- Helper: build a WHERE clause from scoring_sub_category_selectors for one sub-cat.
--
-- The selectors use disjunctive normal form (OR-of-ANDs):
--   Same filter_group → conditions are ANDed
--   Different filter_groups → groups are ORed
--
-- column_ref can be:
--   - a bare column name, e.g. "amenity"   → resolved as  tbl."amenity"
--   - "tags:key",       e.g. "tags:fountain" → resolved as  tbl.tags->'fountain'
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.build_selector_where(
  p_sub_category_id TEXT,
  p_table_alias     TEXT
)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_groups  INTEGER[];
  v_group   INTEGER;
  v_conds   TEXT[];
  v_or_parts TEXT[];
  rec       RECORD;
  v_col     TEXT;
BEGIN
  -- Collect distinct filter_groups for this sub-category
  SELECT array_agg(DISTINCT filter_group ORDER BY filter_group)
    INTO v_groups
    FROM scoring_config.scoring_sub_category_selectors
   WHERE sub_category_id = p_sub_category_id;

  IF v_groups IS NULL THEN
    RETURN 'TRUE';  -- no selectors → match everything (shouldn't happen)
  END IF;

  v_or_parts := ARRAY[]::TEXT[];

  FOR i IN 1..array_length(v_groups, 1) LOOP
    v_group := v_groups[i];
    v_conds := ARRAY[]::TEXT[];

    FOR rec IN
      SELECT column_ref, operator, value
        FROM scoring_config.scoring_sub_category_selectors
       WHERE sub_category_id = p_sub_category_id
         AND filter_group = v_group
    LOOP
      -- Resolve column_ref → SQL expression
      IF rec.column_ref LIKE 'tags:%' THEN
        v_col := p_table_alias || '.tags->''' || substring(rec.column_ref FROM 6) || '''';
      ELSE
        v_col := p_table_alias || '."' || rec.column_ref || '"';
      END IF;

      v_conds := v_conds || (v_col || ' ' || rec.operator || ' ''' || rec.value || '''');
    END LOOP;

    IF array_length(v_conds, 1) > 0 THEN
      v_or_parts := v_or_parts || ('(' || array_to_string(v_conds, ' AND ') || ')');
    END IF;
  END LOOP;

  IF array_length(v_or_parts, 1) = 0 THEN
    RETURN 'TRUE';
  END IF;

  RETURN '(' || array_to_string(v_or_parts, ' OR ') || ')';
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Helper: build a CASE expression from scoring_criterion_rules for one criterion.
--
-- Rules are evaluated in priority order (lowest first). For each rule:
--   match_type = 'exact'    →  tags->'key' = 'value'
--   match_type = 'present'  →  tags->'key' IS NOT NULL AND tags->'key' != ''
--   match_type = 'any_known' → tags->'key' IS NOT NULL AND tags->'key' != ''
--                               (catches any non-empty value not matched above)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.build_criterion_case(
  p_criterion_id TEXT,
  p_table_alias  TEXT
)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  rec    RECORD;
  v_when TEXT[];
  v_cond TEXT;
BEGIN
  v_when := ARRAY[]::TEXT[];

  FOR rec IN
    SELECT tag_key, match_type, tag_value, points
      FROM scoring_config.scoring_criterion_rules
     WHERE criterion_id = p_criterion_id
     ORDER BY priority
  LOOP
    CASE rec.match_type
      WHEN 'exact' THEN
        v_cond := p_table_alias || '.tags->''' || rec.tag_key || ''' = ''' || rec.tag_value || '''';
      WHEN 'present' THEN
        v_cond := '(' || p_table_alias || '.tags->''' || rec.tag_key || ''' IS NOT NULL AND '
                      || p_table_alias || '.tags->''' || rec.tag_key || ''' != '''')';
      WHEN 'any_known' THEN
        v_cond := '(' || p_table_alias || '.tags->''' || rec.tag_key || ''' IS NOT NULL AND '
                      || p_table_alias || '.tags->''' || rec.tag_key || ''' != '''')';
    END CASE;

    v_when := v_when || ('WHEN ' || v_cond || ' THEN ' || rec.points);
  END LOOP;

  IF array_length(v_when, 1) = 0 THEN
    RETURN '0';  -- no rules → score 0
  END IF;

  RETURN 'CASE ' || array_to_string(v_when, ' ') || ' ELSE 0 END';
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Helper: build a data-quality-factor expression for one criterion.
--
-- DQ = (tagged_count / total_count) * (1 - min_dq) + min_dq
--
-- "tagged" means the entity has one of the known DQ tag key/value combos.
-- tag_value = '*' means any non-empty value for that key counts.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.build_dq_expression(
  p_criterion_id TEXT,
  p_table_alias  TEXT,
  p_min_dq       DOUBLE PRECISION
)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  rec      RECORD;
  v_conds  TEXT[];
  v_cond   TEXT;
BEGIN
  v_conds := ARRAY[]::TEXT[];

  FOR rec IN
    SELECT tag_key, tag_value
      FROM scoring_config.scoring_criterion_dq_tags
     WHERE criterion_id = p_criterion_id
  LOOP
    IF rec.tag_value = '*' THEN
      -- Presence check: any non-empty value
      v_cond := '(' || p_table_alias || '.tags->''' || rec.tag_key || ''' IS NOT NULL AND '
                    || p_table_alias || '.tags->''' || rec.tag_key || ''' != '''')';
    ELSE
      v_cond := p_table_alias || '.tags->''' || rec.tag_key || ''' = ''' || rec.tag_value || '''';
    END IF;
    v_conds := v_conds || v_cond;
  END LOOP;

  IF array_length(v_conds, 1) = 0 THEN
    -- No DQ tags defined → assume full quality
    RETURN p_min_dq::TEXT;
  END IF;

  -- DQ = (SUM(CASE WHEN any_tag_matches THEN 1 ELSE 0 END) / COUNT(*)::float) * (1 - min_dq) + min_dq
  RETURN '(COALESCE(SUM(CASE WHEN ' || array_to_string(v_conds, ' OR ') || ' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0)::float, 0) * '
         || (1.0 - p_min_dq)::TEXT || ' + ' || p_min_dq::TEXT || ')';
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Helper: build a tag-count expression (how many entities match known DQ tags).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.build_tag_count_expression(
  p_criterion_id TEXT,
  p_table_alias  TEXT
)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  rec      RECORD;
  v_conds  TEXT[];
  v_cond   TEXT;
BEGIN
  v_conds := ARRAY[]::TEXT[];

  FOR rec IN
    SELECT tag_key, tag_value
      FROM scoring_config.scoring_criterion_dq_tags
     WHERE criterion_id = p_criterion_id
  LOOP
    IF rec.tag_value = '*' THEN
      v_cond := '(' || p_table_alias || '.tags->''' || rec.tag_key || ''' IS NOT NULL AND '
                    || p_table_alias || '.tags->''' || rec.tag_key || ''' != '''')';
    ELSE
      v_cond := p_table_alias || '.tags->''' || rec.tag_key || ''' = ''' || rec.tag_value || '''';
    END IF;
    v_conds := v_conds || v_cond;
  END LOOP;

  IF array_length(v_conds, 1) = 0 THEN
    RETURN '0';
  END IF;

  RETURN 'SUM(CASE WHEN ' || array_to_string(v_conds, ' OR ') || ' THEN 1 ELSE 0 END)';
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- compute_criterion_scores — Phase 1
--
-- For each (sub_category, topic, criterion) assignment, build and execute a
-- dynamic query against the appropriate OSM table. Returns one row per
-- assignment with the AVG score, data quality factor, and tag count.
--
-- The optional p_admin_osm_id parameter scopes computation to a single admin
-- area via ST_Intersects.
--
-- The optional parameter overrides let callers (e.g., Observable notebooks)
-- experiment with algorithm parameters without modifying the DB.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.compute_criterion_scores(
  p_admin_osm_id     BIGINT DEFAULT NULL,
  p_min_dq_override  DOUBLE PRECISION DEFAULT NULL
)
RETURNS SETOF scoring_config.criterion_score_row
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_min_dq       DOUBLE PRECISION;
  v_sub_cat      RECORD;
  v_assignment   RECORD;
  v_sql          TEXT;
  v_selects      TEXT[];
  v_where        TEXT;
  v_admin_join   TEXT;
  v_admin_where  TEXT;
  v_result       RECORD;
  v_table_alias  TEXT := 't';
  v_idx          INTEGER;
  v_topics       TEXT[];
  v_criteria     TEXT[];
  v_weights      TEXT[];
BEGIN
  -- Resolve algorithm parameters
  v_min_dq := COALESCE(
    p_min_dq_override,
    (SELECT value FROM scoring_config.scoring_params WHERE key = 'min_data_quality_factor')
  );

  -- Prepare admin area filter (if scoped)
  IF p_admin_osm_id IS NOT NULL THEN
    v_admin_join  := ' JOIN osm_admin a ON ST_Intersects(' || v_table_alias || '.geometry, a.geometry)';
    v_admin_where := ' AND a.osm_id = ' || p_admin_osm_id;
  ELSE
    v_admin_join  := '';
    v_admin_where := '';
  END IF;

  -- Process each sub-category: ONE query per sub-category (same as V1/V2)
  -- This batches all criterion aggregations into a single table scan.
  FOR v_sub_cat IN
    SELECT sc.id AS sub_category_id,
           sc.osm_source_table,
           sc.top_level_category_id
      FROM scoring_config.scoring_sub_categories sc
      JOIN scoring_config.scoring_top_level_categories tlc
        ON tlc.id = sc.top_level_category_id
     WHERE tlc.planned = false
     ORDER BY tlc.sort_order, sc.id
  LOOP
    -- Build the WHERE clause from selectors
    v_where := scoring_config.build_selector_where(v_sub_cat.sub_category_id, v_table_alias);

    -- Collect all score/dq/tag_count SELECT expressions into a single query
    -- that returns one row with numbered columns, then unnest into individual rows.
    v_selects  := ARRAY[]::TEXT[];
    v_topics   := ARRAY[]::TEXT[];
    v_criteria := ARRAY[]::TEXT[];
    v_weights  := ARRAY[]::TEXT[];
    v_idx      := 0;

    FOR v_assignment IN
      SELECT sa.topic_id, sa.criterion_id, sa.weight
        FROM scoring_config.scoring_assignments sa
       WHERE sa.sub_category_id = v_sub_cat.sub_category_id
       ORDER BY sa.topic_id, sa.criterion_id
    LOOP
      v_idx := v_idx + 1;
      v_topics   := v_topics   || quote_literal(v_assignment.topic_id);
      v_criteria := v_criteria || quote_literal(v_assignment.criterion_id);
      v_weights  := v_weights  || v_assignment.weight::text;

      -- Three aggregation expressions per assignment
      v_selects := v_selects || format(
        'CEIL(AVG(%s))::float AS s%s',
        scoring_config.build_criterion_case(v_assignment.criterion_id, v_table_alias),
        v_idx
      );
      v_selects := v_selects || format(
        '(%s)::float AS d%s',
        scoring_config.build_dq_expression(v_assignment.criterion_id, v_table_alias, v_min_dq),
        v_idx
      );
      v_selects := v_selects || format(
        '(%s)::bigint AS t%s',
        scoring_config.build_tag_count_expression(v_assignment.criterion_id, v_table_alias),
        v_idx
      );
    END LOOP;

    IF v_idx = 0 THEN
      CONTINUE;  -- no assignments for this sub-category
    END IF;

    -- Build a single batched query that scans the OSM table once
    -- and computes all criterion scores in one pass
    v_sql := format(
      'WITH agg AS (SELECT %s FROM %I %s %s WHERE %s %s), '
      || 'meta AS (SELECT '
      || '  unnest(ARRAY[%s]) AS topic_id, '
      || '  unnest(ARRAY[%s]) AS criterion_id, '
      || '  unnest(ARRAY[%s]::float[]) AS weight, '
      || '  generate_series(1, %s) AS idx '
      || ') '
      || 'SELECT %L::text AS sub_category_id, m.topic_id, m.criterion_id, '
      || '  CASE m.idx %s END AS score, '
      || '  CASE m.idx %s END AS data_quality_factor, '
      || '  CASE m.idx %s END AS tag_count, '
      || '  m.weight '
      || 'FROM agg, meta m',
      array_to_string(v_selects, ', '),
      v_sub_cat.osm_source_table,
      v_table_alias,
      v_admin_join,
      v_where,
      v_admin_where,
      array_to_string(v_topics, ', '),
      array_to_string(v_criteria, ', '),
      array_to_string(v_weights, ', '),
      v_idx,
      v_sub_cat.sub_category_id,
      -- Build CASE idx WHEN 1 THEN s1 WHEN 2 THEN s2 ... for score
      (SELECT string_agg(format(' WHEN %s THEN (SELECT s%s FROM agg)', i, i), '') FROM generate_series(1, v_idx) AS i),
      -- Build CASE idx WHEN 1 THEN d1 WHEN 2 THEN d2 ... for dq
      (SELECT string_agg(format(' WHEN %s THEN (SELECT d%s FROM agg)', i, i), '') FROM generate_series(1, v_idx) AS i),
      -- Build CASE idx WHEN 1 THEN t1 WHEN 2 THEN t2 ... for tag_count
      (SELECT string_agg(format(' WHEN %s THEN (SELECT t%s FROM agg)', i, i), '') FROM generate_series(1, v_idx) AS i)
    );

    FOR v_result IN EXECUTE v_sql LOOP
      RETURN NEXT v_result;
    END LOOP;
  END LOOP;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- compute_score_tree — Computes the complete score hierarchy
--
-- This is the main entry point. Returns a single composite row containing
-- arrays for each aggregation level, suitable for inspection in notebooks.
--
-- Computes criterion scores exactly ONCE via compute_criterion_scores(), then
-- aggregates upward through topics → sub-categories → TLCs → overall in a
-- single CTE chain — no redundant OSM table scans.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION scoring_config.compute_score_tree(
  p_admin_osm_id            BIGINT DEFAULT NULL,
  p_min_dq_override         DOUBLE PRECISION DEFAULT NULL,
  p_no_data_thresh_override DOUBLE PRECISION DEFAULT NULL,
  p_topic_score_w_override  DOUBLE PRECISION DEFAULT NULL,
  p_topic_dq_w_override     DOUBLE PRECISION DEFAULT NULL
)
RETURNS scoring_config.score_tree
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_tree              scoring_config.score_tree;
  v_min_dq            DOUBLE PRECISION;
  v_no_data_threshold DOUBLE PRECISION;
  v_topic_score_w     DOUBLE PRECISION;
  v_topic_dq_w        DOUBLE PRECISION;
BEGIN
  -- Resolve all algorithm parameters once
  v_min_dq := COALESCE(
    p_min_dq_override,
    (SELECT value FROM scoring_config.scoring_params WHERE key = 'min_data_quality_factor')
  );
  v_no_data_threshold := COALESCE(
    p_no_data_thresh_override,
    (SELECT value FROM scoring_config.scoring_params WHERE key = 'no_data_threshold')
  );
  v_topic_score_w := COALESCE(
    p_topic_score_w_override,
    (SELECT value FROM scoring_config.scoring_params WHERE key = 'topic_score_weight')
  );
  v_topic_dq_w := COALESCE(
    p_topic_dq_w_override,
    (SELECT value FROM scoring_config.scoring_params WHERE key = 'topic_dq_weight')
  );

  -- ── Compute the entire tree in a single CTE chain ──────────────────────────
  -- compute_criterion_scores() is called exactly ONCE; every subsequent
  -- aggregation level reads from the previous CTE, not from the OSM tables.

  WITH
  -- Phase 1: criterion scores (the only phase that touches OSM tables)
  crit AS (
    SELECT *
      FROM scoring_config.compute_criterion_scores(p_admin_osm_id, p_min_dq_override)
  ),

  -- Phase 2a: topic scores (aggregate criteria → topics)
  adjusted AS (
    SELECT
      c.sub_category_id, c.topic_id, c.criterion_id,
      c.score, c.data_quality_factor, c.tag_count, c.weight,
      c.weight * c.data_quality_factor AS adjusted_weight
    FROM crit c
  ),
  topic_weight_sums AS (
    SELECT sub_category_id, topic_id, SUM(adjusted_weight) AS sum_adj_w
      FROM adjusted
     GROUP BY sub_category_id, topic_id
  ),
  topic_raw AS (
    SELECT
      a.sub_category_id,
      a.topic_id,
      CASE WHEN tws.sum_adj_w > 0
        THEN SUM(a.score * a.adjusted_weight) / tws.sum_adj_w
        ELSE NULL
      END AS preliminary_score,
      CASE WHEN SUM(a.weight) > 0
        THEN SUM(a.score * a.weight) / SUM(a.weight)
        ELSE NULL
      END AS unadjusted_score,
      CASE WHEN SUM(a.weight) > 0
        THEN SUM(COALESCE(a.data_quality_factor, 1.0) * a.weight) / SUM(a.weight)
        ELSE v_min_dq
      END AS data_quality_factor
    FROM adjusted a
    JOIN topic_weight_sums tws
      ON tws.sub_category_id = a.sub_category_id AND tws.topic_id = a.topic_id
    GROUP BY a.sub_category_id, a.topic_id, tws.sum_adj_w
  ),
  topics AS (
    SELECT
      tr.sub_category_id,
      tr.topic_id,
      CASE WHEN tr.preliminary_score IS NOT NULL
        THEN CEIL(v_topic_score_w * tr.preliminary_score + v_topic_dq_w * (100.0 * tr.data_quality_factor))
        ELSE NULL
      END AS score,
      ROUND(tr.data_quality_factor::numeric, 3)::float AS data_quality_factor,
      CASE WHEN tr.unadjusted_score IS NOT NULL
        THEN CEIL(tr.unadjusted_score)
        ELSE NULL
      END AS unadjusted_score
    FROM topic_raw tr
  ),

  -- Phase 2b: sub-category scores (aggregate topics → sub-categories)
  sub_cats AS (
    SELECT
      sc.top_level_category_id,
      t.sub_category_id,
      sc.weight,
      CASE WHEN COUNT(t.score) > 0
        THEN CEIL(AVG(t.score))
        ELSE NULL
      END AS score,
      CASE WHEN COUNT(*) > 0
        THEN ROUND(AVG(COALESCE(t.data_quality_factor, v_min_dq))::numeric, 3)::float
        ELSE v_min_dq
      END AS data_quality_factor
    FROM topics t
    JOIN scoring_config.scoring_sub_categories sc ON sc.id = t.sub_category_id
    GROUP BY sc.top_level_category_id, t.sub_category_id, sc.weight
  ),

  -- Phase 2c: top-level category scores (aggregate sub-cats → TLCs)
  tlcs AS (
    SELECT
      sc.top_level_category_id,
      tlc.weight AS tlc_weight,
      CASE
        WHEN SUM(CASE WHEN sc.data_quality_factor > v_no_data_threshold THEN sc.weight ELSE 0 END) > 0
        THEN CEIL(
          SUM(CASE WHEN sc.data_quality_factor > v_no_data_threshold THEN sc.score * sc.weight ELSE 0 END)
          / SUM(CASE WHEN sc.data_quality_factor > v_no_data_threshold THEN sc.weight ELSE 0 END)
        )
        ELSE NULL
      END AS score,
      CASE
        WHEN SUM(sc.weight) > 0
        THEN ROUND((SUM(COALESCE(sc.data_quality_factor, v_min_dq) * sc.weight) / SUM(sc.weight))::numeric, 3)::float
        ELSE v_min_dq
      END AS data_quality_factor
    FROM sub_cats sc
    JOIN scoring_config.scoring_top_level_categories tlc ON tlc.id = sc.top_level_category_id
    WHERE tlc.planned = false
    GROUP BY sc.top_level_category_id, tlc.weight
  ),

  -- Phase 2d: overall score (aggregate TLCs → single score)
  overall AS (
    SELECT
      CASE WHEN SUM(t.tlc_weight) > 0
        THEN CEIL(SUM(COALESCE(t.score, 0) * t.tlc_weight) / SUM(t.tlc_weight))
        ELSE NULL
      END AS score,
      CASE WHEN SUM(t.tlc_weight) > 0
        THEN ROUND((SUM(COALESCE(t.data_quality_factor, v_min_dq) * t.tlc_weight) / SUM(t.tlc_weight))::numeric, 3)::float
        ELSE v_min_dq
      END AS data_quality_factor
    FROM tlcs t
  )

  -- Collect all levels into the composite return type in a single SELECT
  SELECT
    (SELECT o.score FROM overall o),
    (SELECT o.data_quality_factor FROM overall o),
    (SELECT array_agg(
       row(c.sub_category_id, c.topic_id, c.criterion_id,
           c.score, c.data_quality_factor, c.tag_count, c.weight
       )::scoring_config.criterion_score_row)
     FROM crit c),
    (SELECT array_agg(
       row(tp.sub_category_id, tp.topic_id,
           tp.score, tp.data_quality_factor, tp.unadjusted_score
       )::scoring_config.topic_score_row)
     FROM topics tp),
    (SELECT array_agg(
       row(s.top_level_category_id, s.sub_category_id,
           s.score::float, s.data_quality_factor, s.weight
       )::scoring_config.sub_category_score_row)
     FROM sub_cats s),
    (SELECT array_agg(
       row(tc.top_level_category_id,
           tc.score::float, tc.data_quality_factor, tc.tlc_weight
       )::scoring_config.top_level_category_score_row)
     FROM tlcs tc)
  INTO v_tree;

  RETURN v_tree;
END;
$$;


COMMIT;



