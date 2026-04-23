-- =============================================================================
-- Scoring Config Schema (tables only, no seed data)
-- =============================================================================
--
-- Extracted from scoring-config-schema-and-seed.sql
--
-- Usage:
--   psql -h localhost -p <port> -U <user> -d <db> -f docker/database-experiments/scoring-config-schema.sql
--
-- This file is idempotent — it drops and recreates the schema on each run.
-- It does NOT touch the public schema or any existing OSM / result tables.
-- =============================================================================

-- restaurant A: wheelchair=limited, toilets:wheelchair=no, air_con=yes, deaf=yes --> 0.8*0.5 + 0.2*0.1 + 1*1 + 1*1

BEGIN;

DROP SCHEMA IF EXISTS scoring_config CASCADE;
CREATE SCHEMA scoring_config;

-- ─── Global algorithm parameters ─────────────────────────────────────────────
-- here we store global parameters that are used in the scoring algorithm, such as the min dqf and blend of dqf and topic scores,
-- or other parameters that influence the scoring logic.
CREATE TABLE scoring_config.global_config (
  key   TEXT PRIMARY KEY,
  value_double DOUBLE PRECISION,
  value_text TEXT,
  value_int BIGINT,
  value_bool BOOLEAN
);

-- ─── Links ──────────────────────────────────────────────────────────
-- generic table to hold links that enrich dimensions

CREATE TABLE scoring_config.links (
   id                    BIGSERIAL PRIMARY KEY,
   table_name            TEXT NOT NULL, -- e.g. "dimensions" or "dimension_types"
   foreign_id            TEXT NOT NULL, -- the id of the record in the corresponding table
   link_type             TEXT NOT NULL, -- e.g. "recommendation" or "reason" or "url"
   uri                   TEXT  -- can link to the web or within our database (e.g. a handwritten recommendation or reason, descripton)
);

-- ─── Dimensions ──────────────────────────────────────────────────────────
-- generic table that holds all possible dimensions (topics, categories, sub-categories, criteria, sdgs) in a single hierarchy
-- this is optimized for postgres

CREATE TABLE scoring_config.dimensions (
   id                    BIGSERIAL PRIMARY KEY,
   name                  TEXT NOT NULL,
   dimension_type_id     TEXT NOT NULL REFERENCES scoring_config.dimension_types(id),
   weight                DOUBLE PRECISION, -- topics dont have weights,
   planned               BOOLEAN,  -- only relevant for top-level categories for now
   sort_order            NUMERIC NOT NULL DEFAULT 0,
   osm_source_table      TEXT
);

-- ─── Slugs ──────────────────────────────────────────────────────────
-- we want to have unique slugs for admin areas in order to have nice urls.
-- one admin area can have multiple slugs (e.g. "new-york-city" and "nyc"), but each slug can only belong to one admin area.

CREATE TABLE scoring_config.slugs (
    id                    BIGSERIAL PRIMARY KEY,
    table_name            TEXT NOT NULL, -- e.g. "dimensions" or "dimension_types"
    foreign_id            TEXT NOT NULL, -- the id of the record in the corresponding table
    name                  TEXT NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (name)
);

-- ─── Dimension Types ──────────────────────────────────────────────────────────
-- this table defines the types of dimensions we have, such as category, sub-category, topic, criterion, sdg, admin area
-- makes it easy to add new dimensions

CREATE TABLE scoring_config.dimension_types (
   id                    BIGSERIAL PRIMARY KEY,
   name                  TEXT NOT NULL -- 'category','sub_category','topic','criterion','sdg','admin_area'
);

-- ─── Dimension scoring rules ─────────────────────────────────────────────────
-- todo: wie kommen wir von den einzelnen Prädikaten zu einer Klausel
CREATE TABLE scoring_config.scoring_criterion_rules (
  id                 BIGSERIAL PRIMARY KEY,
  dimension_id       TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  tag_predicate_id   BIGINT,
  sort_order         NUMERIC NOT NULL DEFAULT 0, -- useful for sorting legend entries and stack bar charts in our visualization
  is_relevant_for_dq BOOLEAN NOT NULL DEFAULT false
  -- filter_group    INTEGER NOT NULL DEFAULT 0, -- to be decided
);
CREATE INDEX ON scoring_config.scoring_criterion_rules (dimension_id, tag_predicate_id);
CREATE INDEX ON scoring_config.scoring_criterion_rules (is_relevant_for_dq);
CREATE INDEX ON scoring_config.scoring_criterion_rules (tag_predicate_id);
CREATE INDEX ON scoring_config.scoring_criterion_rules (sort_order);

-- ─── Dimension Nesting ─────────────────

CREATE TABLE scoring_config.dimension_nesting (
  id                 BIGSERIAL PRIMARY KEY,
  parent_id          TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  child_id           TEXT NOT NULL REFERENCES scoring_config.dimensions(id),
  weight             DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  score              INTEGER NOT NULL,
      -- hier machen wir weiter

  UNIQUE (parent_id, child_id)
);

CREATE INDEX ON scoring_config.dimension_nesting (parent_id, child_id);

-- ─── Generic tag-predicates  ──────────────────────────────────────────────────
-- these definitions describe generic tag-based predicates that can be applied
-- to any sub-category, topic, or criterion (or even admin area)

CREATE TABLE scoring_config.tag_predicates (
   id                     BIGSERIAL PRIMARY KEY,
   osm_key                TEXT NOT NULL,
   osm_value              TEXT,
   operator               TEXT NOT NULL DEFAULT '=' CHECK (operator IN ('=','is_null')),
   is_negated             BOOLEAN NOT NULL DEFAULT false,
   is_semicolon_separated BOOLEAN NOT NULL DEFAULT false, -- if true, we will split the value by semicolon and apply the predicate to each value (useful for tags like "amenity=parking;parking_space")
   supports_language_code_suffixes BOOLEAN NOT NULL DEFAULT false, -- if true, we will consider language code suffixes when matching this predicate (e.g. "name:en", "name:fr", etc.)
   osm_tag_namespace      TEXT CHECK ( osm_tag_namespace IN ('prefix', 'suffix', 'subkey', 'infix', 'full_match') ) DEFAULT 'full_match'
);

COMMIT;

