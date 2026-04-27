# Scoring Data Model & Computation Flow

This document describes the proposed data model and computation pipeline for computing accessibility scores from OSM tag data. It captures the design decisions made during the architecture phase and serves as the reference for implementation.

## Table of Contents

- [Overview](#overview)
- [Data Model](#data-model)
  - [Configuration Tables](#configuration-tables)
  - [Precomputed Tables](#precomputed-tables)
  - [Result Tables](#result-tables)
- [Computation Flow](#computation-flow)
  - [Step 0: Precomputation (on config change)](#step-0-precomputation-on-config-change)
  - [Step 1: Criterion Evaluation](#step-1-criterion-evaluation)
  - [Step 2: Data Quality Factor Computation](#step-2-data-quality-factor-computation)
  - [Step 3: Topic Aggregation](#step-3-topic-aggregation)
  - [Step 4: Higher-Level Aggregation](#step-4-higher-level-aggregation)
  - [Step 5: Admin Area Aggregation](#step-5-admin-area-aggregation)
- [Worked Example](#worked-example)
- [Index Strategy](#index-strategy)
- [Design Decisions & Rationale](#design-decisions--rationale)

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION (rarely changes)                       │
│                                                                             │
│  dimension_types ◄── dimensions ◄──▶ dimension_nesting (weight)             │
│                          │                                                  │
│                          ▼                                                  │
│               scoring_criterion_rules (points, sort_order)                  │
│                          │                                                  │
│                          ▼                                                  │
│               criterion_clauses (rule_id, or_group, tag_predicate_id)       │
│                          │                                                  │
│                          ▼                                                  │
│               tag_predicates (osm_key, osm_value, operator, is_negated)     │
│                                                                             │
│  global_config:  dqf_min_offset (w), dqf_blend (blend)                     │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  on config change
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRECOMPUTATION                                      │
│                                                                             │
│  ┌────────────────────────────────┐                                         │
│  │  dimension_paths               │                                         │
│  │  (topic → root, path_weight)  │                                         │
│  └────────────────────────────────┘                                         │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  scoring run
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Step 1: Criterion Evaluation (cross join + GROUP BY) → poi_criterion_scores│
│  Step 2: Data Quality Factor Computation → criterion_dqf                    │
│  Step 3: Topic Aggregation (base score + DQ virtual criterion, blend)       │
│  Step 4: Higher-Level Aggregation (flattened paths)                         │
│  Step 5: Admin Area Aggregation                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The scoring system evaluates OSM POIs against configurable criteria, produces per-POI scores at every hierarchy level, and aggregates them into admin-area scores. Configuration changes are rare; scoring runs are expensive bulk operations over millions of POIs.

---

## Data Model

### Configuration Tables

#### `scoring_config.global_config`

Global algorithm parameters that influence scoring behavior.

| key | type | example | purpose |
|-----|------|---------|---------|
| `dqf_min_offset` | `DOUBLE PRECISION` | `0.2` | Minimum DQ factor `w` — ensures even untagged criteria retain some weight |
| `dqf_blend` | `DOUBLE PRECISION` | `0.2` | Blend ratio between base topic score and virtual DQ criterion |

```sql
CREATE TABLE scoring_config.global_config (
  key          TEXT PRIMARY KEY,
  value_double DOUBLE PRECISION,
  value_text   TEXT,
  value_int    BIGINT,
  value_bool   BOOLEAN
);
```

#### `scoring_config.dimension_types`

Defines the types of scoring hierarchy levels.

```sql
CREATE TABLE scoring_config.dimension_types (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL  -- 'category', 'sub_category', 'topic', 'criterion'
);
```

#### `scoring_config.dimensions`

Every scoreable concept (criterion, topic, sub-category, category) has an entry here. This is the backbone of the hierarchy.

```sql
CREATE TABLE scoring_config.dimensions (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  dimension_type_id TEXT NOT NULL REFERENCES scoring_config.dimension_types(id),
  weight            DOUBLE PRECISION,     -- used at sub_category level and above
  planned           BOOLEAN DEFAULT false, -- only for top-level categories
  sort_order        NUMERIC NOT NULL DEFAULT 0,
  osm_source_table  TEXT                   -- which OSM table to query (e.g. 'osm_amenities')
);
```

#### `scoring_config.dimension_nesting`

Edges in the hierarchy. Each edge carries a `weight` that determines how much a child contributes to its parent's weighted average.

```sql
CREATE TABLE scoring_config.dimension_nesting (
  id        BIGSERIAL PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  child_id  TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  weight    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  UNIQUE (parent_id, child_id)
);
```

#### `scoring_config.tag_predicates`

Atomic reusable conditions on OSM tags. They support equality checks, null checks, negation, semicolon-separated values, language code suffixes, and namespace matching.

```sql
CREATE TABLE scoring_config.tag_predicates (
  id                              BIGSERIAL PRIMARY KEY,
  osm_key                         TEXT NOT NULL,
  osm_value                       TEXT,
  operator                        TEXT NOT NULL DEFAULT '='
                                    CHECK (operator IN ('=', 'is_null')),
  is_negated                      BOOLEAN NOT NULL DEFAULT false,
  is_semicolon_separated          BOOLEAN NOT NULL DEFAULT false,
  supports_language_code_suffixes BOOLEAN NOT NULL DEFAULT false,
  osm_tag_namespace               TEXT CHECK (osm_tag_namespace IN
                                    ('prefix','suffix','subkey','infix','full_match'))
                                    DEFAULT 'full_match'
);
```

#### `scoring_config.scoring_criterion_rules`

Each rule links a criterion dimension to a point value. Multiple rules per criterion form a scoring ladder (e.g. 100/50/10/0 points). Rules are evaluated in `sort_order` — **first match wins**.

```sql
CREATE TABLE scoring_config.scoring_criterion_rules (
  id                 BIGSERIAL PRIMARY KEY,
  dimension_id       TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  points             INTEGER NOT NULL DEFAULT 0,
  sort_order         NUMERIC NOT NULL DEFAULT 0,
  is_relevant_for_dq BOOLEAN NOT NULL DEFAULT false
);
```

#### `scoring_config.criterion_clauses` *(NEW)*

Connects a rule to one or more tag predicates using **Disjunctive Normal Form (DNF)**. Predicates within the same `or_group` are ANDed; different `or_group`s are ORed.

```sql
CREATE TABLE scoring_config.criterion_clauses (
  id               BIGSERIAL PRIMARY KEY,
  rule_id          BIGINT NOT NULL REFERENCES scoring_config.scoring_criterion_rules(id),
  or_group         INTEGER NOT NULL DEFAULT 0,
  tag_predicate_id BIGINT NOT NULL REFERENCES scoring_config.tag_predicates(id),
  UNIQUE (rule_id, or_group, tag_predicate_id)
);
```

**Example:** The expression `(wheelchair=yes AND toilet=no) OR wheelchair=limited` is stored as:

| rule_id | or_group | tag_predicate_id |
|---------|----------|------------------|
| 1 | 0 | → wheelchair = yes |
| 1 | 0 | → toilet = no |
| 1 | 1 | → wheelchair = limited |

### Precomputed Tables

These are regenerated on config change. They transform the relational config into structures optimized for bulk evaluation.


#### `scoring_config.dimension_paths`

Flattened path table from every **topic** to each ancestor, with the cumulative product of weights along the path. Turns hierarchical aggregation into a single flat `GROUP BY`.

```sql
CREATE TABLE scoring_config.dimension_paths (
  criterion_id BIGINT NOT NULL REFERENCES scoring_config.dimensions(id),
  ancestor_id  BIGINT NOT NULL REFERENCES scoring_config.dimensions(id),
  depth        INTEGER NOT NULL,           -- 0 = self, 1 = parent, ...
  path_weight  DOUBLE PRECISION NOT NULL,  -- product of weights along path
  PRIMARY KEY (criterion_id, ancestor_id)
);
```

### Result Tables

#### `scoring_results.poi_criterion_scores` *(NEW — write cache)*

Materializes which rule matched each POI and with how many points. Written once during scoring, read during aggregation. Downstream queries never touch `tags` again.

```sql
CREATE TABLE scoring_results.poi_criterion_scores (
  osm_id       BIGINT NOT NULL,
  osm_type     TEXT NOT NULL,
  dimension_id TEXT NOT NULL,
  rule_id      BIGINT,                     -- NULL = no match → 0 points
  points       INTEGER NOT NULL DEFAULT 0,
  scored_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (osm_id, osm_type, dimension_id)
);

CREATE INDEX ON scoring_results.poi_criterion_scores (dimension_id);
CREATE INDEX ON scoring_results.poi_criterion_scores (rule_id);
```

#### `scoring_results.criterion_dqf`

Cached DQF per criterion, computed after criterion evaluation.

```sql
CREATE TABLE scoring_results.criterion_dqf (
  criterion_id TEXT PRIMARY KEY,
  raw_ratio    DOUBLE PRECISION NOT NULL,
  q            DOUBLE PRECISION NOT NULL,   -- scaled DQF
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Computation Flow

### Step 0: Precomputation (on config change)

#### 0a: Build dimension_paths (topic → root)

A recursive CTE walks `dimension_nesting` from every topic upward, multiplying edge weights to produce cumulative `path_weight`.

```sql
TRUNCATE scoring_config.dimension_paths;
INSERT INTO scoring_config.dimension_paths

WITH RECURSIVE paths AS (
  SELECT d.id AS criterion_id, d.id AS ancestor_id,
         0 AS depth, 1.0::DOUBLE PRECISION AS path_weight
  FROM scoring_config.dimensions d
  WHERE d.dimension_type_id = 'topic'

  UNION ALL

  SELECT p.criterion_id, dn.parent_id, p.depth + 1,
         p.path_weight * dn.weight
  FROM paths p
  JOIN scoring_config.dimension_nesting dn ON dn.child_id = p.ancestor_id
)
SELECT * FROM paths;
```

### Step 1: Criterion Evaluation

For each criterion, evaluate all its rules against all POIs using a **cross join with GROUP BY**. POIs are joined against clauses and tag predicates; `bool_and` evaluates each AND-group and `bool_or` collapses the OR-groups. First-match semantics are achieved via `DISTINCT ON` ordered by `sort_order`.

Results are **upserted** into the `poi_criterion_scores` write-cache.

```sql
INSERT INTO scoring_results.poi_criterion_scores
  (osm_id, osm_type, dimension_id, rule_id, points)

SELECT DISTINCT ON (p.osm_id, p.osm_type)
  p.osm_id,
  p.osm_type,
  :criterion_id,
  r.id AS rule_id,
  r.points
FROM public.pois p
CROSS JOIN scoring_config.scoring_criterion_rules r
JOIN scoring_config.criterion_clauses cc ON cc.rule_id = r.id
JOIN scoring_config.tag_predicates tp ON tp.id = cc.tag_predicate_id
WHERE r.dimension_id = :criterion_id
GROUP BY p.osm_id, p.osm_type, r.id, r.points, r.sort_order
HAVING bool_or(
  -- Each or_group must have all its predicates satisfied (bool_and).
  -- We check per or_group in a subquery-free way by encoding the
  -- group match as: every predicate in the group evaluated to true.
  -- Since we grouped by rule, we use a two-level aggregation pattern:
  bool_and(
    CASE
      WHEN tp.operator = '=' AND NOT tp.is_negated
        THEN p.tags ->> tp.osm_key = tp.osm_value
      WHEN tp.operator = '=' AND tp.is_negated
        THEN p.tags ->> tp.osm_key IS DISTINCT FROM tp.osm_value
      WHEN tp.operator = 'is_null' AND NOT tp.is_negated
        THEN p.tags ->> tp.osm_key IS NULL
      WHEN tp.operator = 'is_null' AND tp.is_negated
        THEN p.tags ->> tp.osm_key IS NOT NULL
    END
  ) FILTER (WHERE cc.or_group = cc.or_group)  -- placeholder; see note
)
ORDER BY p.osm_id, p.osm_type, r.sort_order

ON CONFLICT (osm_id, osm_type, dimension_id) DO UPDATE
  SET rule_id   = EXCLUDED.rule_id,
      points    = EXCLUDED.points,
      scored_at = NOW();
```

Because the two-level aggregation (AND within groups, OR across groups) cannot be done in a single flat `GROUP BY`, the actual query uses a subquery for the per-group evaluation:

```sql
INSERT INTO scoring_results.poi_criterion_scores
  (osm_id, osm_type, dimension_id, rule_id, points)

SELECT DISTINCT ON (osm_id, osm_type)
  osm_id,
  osm_type,
  :criterion_id,
  rule_id,
  points
FROM (
  SELECT
    p.osm_id,
    p.osm_type,
    r.id AS rule_id,
    r.points,
    r.sort_order,
    bool_or(group_match) AS rule_match
  FROM public.pois p
  CROSS JOIN scoring_config.scoring_criterion_rules r
  JOIN LATERAL (
    -- Evaluate each or_group: AND all predicates within the group
    SELECT
      cc.or_group,
      bool_and(
        CASE
          WHEN tp.operator = '=' AND NOT tp.is_negated
            THEN p.tags ->> tp.osm_key = tp.osm_value
          WHEN tp.operator = '=' AND tp.is_negated
            THEN p.tags ->> tp.osm_key IS DISTINCT FROM tp.osm_value
          WHEN tp.operator = 'is_null' AND NOT tp.is_negated
            THEN p.tags ->> tp.osm_key IS NULL
          WHEN tp.operator = 'is_null' AND tp.is_negated
            THEN p.tags ->> tp.osm_key IS NOT NULL
        END
      ) AS group_match
    FROM scoring_config.criterion_clauses cc
    JOIN scoring_config.tag_predicates tp ON tp.id = cc.tag_predicate_id
    WHERE cc.rule_id = r.id
    GROUP BY cc.or_group
  ) groups ON true
  WHERE r.dimension_id = :criterion_id
  GROUP BY p.osm_id, p.osm_type, r.id, r.points, r.sort_order
  HAVING bool_or(groups.group_match) = true
) matched
ORDER BY osm_id, osm_type, sort_order

ON CONFLICT (osm_id, osm_type, dimension_id) DO UPDATE
  SET rule_id   = EXCLUDED.rule_id,
      points    = EXCLUDED.points,
      scored_at = NOW();
```

The inner LATERAL evaluates each `or_group` by ANDing (`bool_and`) all its predicates. The outer query ORs (`bool_or`) across groups. `DISTINCT ON` + `ORDER BY sort_order` gives first-match semantics. This runs once per criterion dimension. The config tables are tiny and fit in memory — the cross join is against the small rule set, not a large table.

### Step 2: Data Quality Factor Computation

After all criteria are evaluated, compute the DQF per criterion from the cached results. The `is_relevant_for_dq` flag on the rule controls which matches count as "tagged" (vs. a fallback/else rule).

The DQF formula scales the raw coverage ratio into the range `[w, 1]`:

```
q = raw_ratio × (1 − w) + w
```

where `w = dqf_min_offset` from global config.

```sql
INSERT INTO scoring_results.criterion_dqf (criterion_id, raw_ratio, q)

WITH params AS (
  SELECT value_double AS w
  FROM scoring_config.global_config
  WHERE key = 'dqf_min_offset'
),

raw_dq AS (
  SELECT
    d.id AS criterion_id,
    COUNT(pcs.osm_id) FILTER (
      WHERE pcs.rule_id IS NOT NULL
        AND r.is_relevant_for_dq = true
    )::DOUBLE PRECISION
      / NULLIF(COUNT(pcs.osm_id), 0) AS raw_ratio
  FROM scoring_config.dimensions d
  LEFT JOIN scoring_results.poi_criterion_scores pcs
    ON pcs.dimension_id = d.id
  LEFT JOIN scoring_config.scoring_criterion_rules r
    ON r.id = pcs.rule_id
  WHERE d.dimension_type_id = 'criterion'
  GROUP BY d.id
)

SELECT
  criterion_id,
  COALESCE(raw_ratio, 0),
  COALESCE(raw_ratio, 0) * (1.0 - p.w) + p.w
FROM raw_dq
CROSS JOIN params p

ON CONFLICT (criterion_id) DO UPDATE
  SET raw_ratio   = EXCLUDED.raw_ratio,
      q           = EXCLUDED.q,
      computed_at  = NOW();
```

### Step 3: Topic Aggregation

This step combines:

1. **Base score** — weighted average of criterion points using DQF-adjusted, renormalized weights
2. **Virtual DQ criterion** — `AVG(weight × q) × 100` — reflects how well the dataset covers this topic
3. **Blended topic score** — `base_score × (1 − blend) + dq_score × blend`

```
poi_criterion_scores
        │
        ▼
┌──────────────────────────────────────────────────┐
│  DQF weight adjustment per criterion             │
│  adjusted_weight = weight × q                    │
│  norm_weight = adjusted / Σ(adjusted) per topic  │
└──────────────────────┬───────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
     ┌─────────────┐   ┌───────────────┐
     │ base_score   │   │  dq_score     │
     │ Σ(pts × nw)  │   │ AVG(w×q)×100  │
     └──────┬──────┘   └──────┬────────┘
            │                  │
            ▼                  ▼
     ┌─────────────────────────────────┐
     │  topic_score =                  │
     │  base × (1 − blend)            │
     │  + dq × blend                  │
     └────────────────────────────────-┘
```

```sql
WITH params AS (
  SELECT
    MAX(CASE WHEN key = 'dqf_min_offset' THEN value_double END) AS w,
    MAX(CASE WHEN key = 'dqf_blend'      THEN value_double END) AS blend
  FROM scoring_config.global_config
),

-- DQF-adjusted weights, renormalized per topic
adjusted_weights AS (
  SELECT
    dn.parent_id  AS topic_id,
    dn.child_id   AS criterion_id,
    cdq.q,
    dn.weight,
    dn.weight * cdq.q AS raw_adjusted,
    dn.weight * cdq.q
      / NULLIF(SUM(dn.weight * cdq.q) OVER (PARTITION BY dn.parent_id), 0)
      AS norm_weight
  FROM scoring_config.dimension_nesting dn
  JOIN scoring_results.criterion_dqf cdq ON cdq.criterion_id = dn.child_id
  JOIN scoring_config.dimensions d ON d.id = dn.child_id
  WHERE d.dimension_type_id = 'criterion'
),

-- Per POI per topic: base score + DQ score
topic_components AS (
  SELECT
    pcs.osm_id,
    pcs.osm_type,
    aw.topic_id,
    -- Base score: weighted average using renormalized weights
    SUM(COALESCE(pcs.points, 0) * aw.norm_weight) AS base_score,
    -- DQ virtual criterion: avg of (original_weight × q) × 100
    AVG(aw.raw_adjusted) * 100                      AS dq_score
  FROM adjusted_weights aw
  LEFT JOIN scoring_results.poi_criterion_scores pcs
    ON pcs.dimension_id = aw.criterion_id
  GROUP BY pcs.osm_id, pcs.osm_type, aw.topic_id
),

-- Blended topic score
topic_scores AS (
  SELECT
    osm_id,
    osm_type,
    topic_id AS dimension_id,
    base_score * (1.0 - p.blend) + dq_score * p.blend AS score,
    base_score,
    dq_score
  FROM topic_components
  CROSS JOIN params p
)

SELECT * FROM topic_scores;
```

**Note:** The `dq_score` is identical for every POI within a topic — it depends on dataset-wide tag coverage, not individual POI tags. Only the `base_score` varies per POI.

### Step 4: Higher-Level Aggregation

Topic scores are rolled up through sub-category → category → root using the precomputed `dimension_paths` table. One flat `GROUP BY`, no recursion.

```sql
SELECT
  ts.osm_id,
  ts.osm_type,
  dp.ancestor_id AS dimension_id,
  SUM(ts.score * dp.path_weight)
    / NULLIF(SUM(dp.path_weight), 0) AS score
FROM topic_scores ts
JOIN scoring_config.dimension_paths dp
  ON dp.criterion_id = ts.dimension_id
 AND dp.depth > 0
GROUP BY ts.osm_id, ts.osm_type, dp.ancestor_id;
```

Each topic score is multiplied by its cumulative `path_weight` (product of edge weights from topic to ancestor) and averaged. This produces scores at sub-category, category, and root level in a single pass.

### Step 5: Admin Area Aggregation

Averages POI-level scores across all POIs within an admin area to produce area-level scores per dimension.

```sql
SELECT
  pa.admin_area_id,
  ps.dimension_id,
  AVG(ps.score)  AS area_score,
  COUNT(*)       AS poi_count
FROM (
  SELECT osm_id, osm_type, dimension_id, score FROM topic_scores
  UNION ALL
  SELECT osm_id, osm_type, dimension_id, score FROM higher_scores
) ps
JOIN public.poi_admin_areas pa
  ON pa.osm_id = ps.osm_id AND pa.osm_type = ps.osm_type
GROUP BY pa.admin_area_id, ps.dimension_id;
```

---

## Worked Example

**Config:**

```
global_config:  dqf_min_offset = 0.2,  dqf_blend = 0.2

Dimensions:
  "Mobility"           (category)
  "Wheelchair"         (topic, child of Mobility, weight=0.8)
  "wheelchair_access"  (criterion, child of Wheelchair, weight=0.7)
  "toilet_wheelchair"  (criterion, child of Wheelchair, weight=0.3)

Rules for wheelchair_access:
  rule 1: wheelchair=yes      → 100 pts, sort=0, is_relevant_for_dq=true
  rule 2: wheelchair=limited  →  50 pts, sort=1, is_relevant_for_dq=true
  rule 3: wheelchair=no       →  10 pts, sort=2, is_relevant_for_dq=true

Rules for toilet_wheelchair:
  rule 4: toilets:wheelchair=yes → 100 pts, sort=0, is_relevant_for_dq=true
  rule 5: toilets:wheelchair=no  →  10 pts, sort=1, is_relevant_for_dq=true
```

**POI:** `osm_id=1234, tags = {amenity:restaurant, wheelchair:yes, toilets:wheelchair:no}`

**Dataset:** 80% of POIs have `wheelchair` tagged, 20% have `toilets:wheelchair` tagged.

### Step 1 — Criterion evaluation

| osm_id | dimension_id | rule_id | points |
|--------|--------------|---------|--------|
| 1234 | wheelchair_access | 1 | 100 |
| 1234 | toilet_wheelchair | 5 | 10 |

`wheelchair=yes` matches rule 1 (first match). `toilets:wheelchair=no` matches rule 5.

### Step 2 — DQF

| criterion | raw_ratio | q = raw × (1−0.2) + 0.2 |
|-----------|-----------|--------------------------|
| wheelchair_access | 0.80 | 0.84 |
| toilet_wheelchair | 0.20 | 0.36 |

### Step 3 — Topic aggregation for "Wheelchair"

**Weight adjustment:**

| criterion | weight | q | raw_adjusted (w×q) | norm_weight |
|-----------|--------|------|-----------|-------------|
| wheelchair_access | 0.7 | 0.84 | 0.588 | 0.588 / 0.696 = **0.845** |
| toilet_wheelchair | 0.3 | 0.36 | 0.108 | 0.108 / 0.696 = **0.155** |

**Scores:**

```
base_score = 100 × 0.845 + 10 × 0.155 = 86.05
dq_score   = AVG(0.588, 0.108) × 100 = 0.348 × 100 = 34.8
topic_score = 86.05 × 0.8 + 34.8 × 0.2 = 68.84 + 6.96 = 75.80
```

The low DQ score (34.8) reflects that toilet wheelchair data is sparse. It drags the topic down from 86 to 76, honestly representing that we can't be fully confident in this topic for this area.

### Step 4 — Higher aggregation

```
dimension_paths: Wheelchair → Mobility, path_weight = 0.8

Mobility score = 75.80 (only one topic child, weight cancels out)
```

### Step 5 — Admin area

```
Berlin area_score for "Mobility" = AVG(all POI Mobility scores in Berlin)
```

---

## Index Strategy

A full GIN index on `tags` for hundreds of millions of rows is enormous. We use **partial expression indexes** restricted to only the OSM keys used in scoring:

```sql
-- One btree index per scoring-relevant OSM key, filtered to rows that have the key
CREATE INDEX pois_wheelchair
  ON public.pois ((tags ->> 'wheelchair'))
  WHERE tags ? 'wheelchair';

CREATE INDEX pois_toilet_wheelchair
  ON public.pois ((tags ->> 'toilets:wheelchair'))
  WHERE tags ? 'toilets:wheelchair';

CREATE INDEX pois_blind
  ON public.pois ((tags ->> 'blind'))
  WHERE tags ? 'blind';

-- ... one per OSM key used in tag_predicates
```

**Why partial indexes:**

- A full GIN on `tags` for 200M+ rows would be tens of GB
- Partial indexes only include rows that actually carry the relevant key
- Btree expression indexes give exact value lookups, not just key containment
- The list of scoring-relevant keys is small and rarely changes — maintenance cost is low

**Alternative** (simpler but larger): A partial GIN index filtered to rows with at least one relevant key:

```sql
CREATE INDEX pois_tags_gin_relevant
  ON public.pois USING GIN (tags)
  WHERE tags ?| ARRAY['wheelchair','toilets:wheelchair','blind',
                       'tactile_paving','deaf','hearing_loop'];
```

---

## Design Decisions & Rationale

### 1. DNF (Disjunctive Normal Form) for compound predicates

**Decision:** Tag predicate expressions are stored in DNF via `criterion_clauses` with `or_group`.

**Rationale:** We need compound conditions like `(wheelchair=yes AND toilet=no) OR wheelchair=limited`. Three options were considered:

- **DNF groups** — flat table with `or_group` column, predicates in same group are ANDed, groups are ORed
- **Expression tree** — recursive self-referencing table modeling an AST
- **JSONB expression** — store the boolean tree as a JSON document

DNF was chosen because: (a) it's the simplest relational model, (b) accessibility tag combinations are typically simple (a few ANDs ORed together), (c) it's easy to build admin tooling for, and (d) it's fully evaluable in pure SQL. The expression tree is more powerful but adds recursive SQL complexity without a current need. JSONB is opaque to SQL queries and harder to validate at the DB level.

### 2. Cross join with GROUP BY for criterion evaluation

**Decision:** Criterion evaluation uses a cross join of POIs against rules, with `bool_and`/`bool_or` aggregation and `DISTINCT ON` for first-match semantics.

**Rationale:** Three evaluation approaches were compared:

- **Cross join + GROUP BY** — join POIs with all clauses, aggregate with `bool_and` (per AND-group) and `bool_or` (across OR-groups), then `DISTINCT ON` + `ORDER BY sort_order` for first-match
- **LATERAL subquery** — evaluate per POI with first-match via `LIMIT 1`
- **Generated SQL** — precompile rules into raw WHERE clauses, run directly

Cross join + GROUP BY was chosen because: (a) it is a single declarative SQL statement with no code generation or dynamic SQL, (b) `bool_and`/`bool_or` directly express the DNF logic, (c) the config tables (`criterion_clauses`, `tag_predicates`) are tiny and fit in memory so the cross join is cheap, and (d) Postgres can efficiently plan the join and aggregation over the full POI table in a single sequential pass. The write-cache (`poi_criterion_scores`) means evaluation only happens once per scoring run, so the cost is amortized.

### 3. Write-cache for POI criterion scores

**Decision:** Criterion evaluation results are cached in `scoring_results.poi_criterion_scores`.

**Rationale:** At Europe scale (150–300M POIs), re-evaluating tag predicates for every aggregation query is prohibitively expensive. By caching the results:

- Downstream aggregation (Steps 2–5) never touches the `tags` column again
- Cache can be incrementally updated (upsert on re-score)
- Debugging is easier — you can inspect which rule matched each POI
- Aggregation queries become simple joins against a well-indexed table

### 4. Flattened paths for hierarchical aggregation

**Decision:** Hierarchical score aggregation uses a precomputed `dimension_paths` table, not recursive CTEs or fixed-level joins.

**Rationale:** Three approaches were considered:

- **Recursive CTE** — standard approach, but Postgres doesn't support aggregation inside recursive terms
- **Fixed-level joins** — explicit CTE per level (criterion → topic → sub_category → category) — works but hard-coded to exactly 4 levels
- **Flattened paths** — precompute the transitive closure with cumulative `path_weight`, then aggregate with a single `GROUP BY`

Flattened paths were chosen because: (a) one query handles all levels without recursion, (b) it works for arbitrary nesting depth without query changes, (c) the path table is tiny (topics × depth ≈ hundreds of rows) and only regenerated on config change, and (d) `SUM(score × path_weight) / SUM(path_weight)` is the simplest possible aggregation query for 200M+ POIs.

### 5. Data Quality Factor (DQF) with scaled offset

**Decision:** DQF is computed as `q = raw_ratio × (1 − w) + w`, with `w` from global config.

**Rationale:** Raw data quality (% of POIs tagged) ranges from 0 to 1. Using it directly would mean criteria with near-zero coverage effectively vanish from the score. The offset `w` ensures even poorly-tagged criteria retain some influence. The linear scaling maps `[0, 1]` to `[w, 1]`, preserving the relative ordering while compressing the range. With `w = 0.2`, a completely untagged criterion still has 20% of its configured weight.

### 6. Virtual DQ criterion with blending

**Decision:** Each topic score is a blend of the base score and a virtual DQ criterion: `score = base × (1 − blend) + dq × blend`.

**Rationale:** The virtual DQ criterion (`AVG(weight × q) × 100`) reflects how well the dataset covers the topic, weighted by criterion importance. A heavily-weighted criterion with poor data drags the DQ score down more than a low-weight one. Blending it into the topic score ensures that:

- Areas with sparse data are honestly penalized (you can't score 100 if we don't have the data to prove it)
- The blend ratio is configurable — e.g. 80:20 means data quality accounts for 20% of the topic score
- The DQ score is the same for all POIs within a topic (it's a dataset property, not a POI property) — only the base score varies per POI

### 7. Partial expression indexes over full GIN

**Decision:** Use per-key partial btree expression indexes instead of a full GIN index on `tags`.

**Rationale:** At 200M+ rows, a full GIN index on `tags` (which may contain dozens of keys per POI) would be enormous. Partial expression indexes (`CREATE INDEX ON pois ((tags ->> 'wheelchair')) WHERE tags ? 'wheelchair'`) are far smaller because they only index rows that carry the relevant key, and they provide exact value lookups (not just key containment). The set of scoring-relevant keys is small (~20–30) and rarely changes, making maintenance cost negligible.

