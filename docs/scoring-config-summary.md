# Scoring Config in Database — Summary

## What we did

We designed and implemented a database-driven scoring configuration system that moves all hardcoded algorithm coefficients (weights, scoring rules, data quality tags, sub-category selectors, and the category→topic→criterion wiring) from TypeScript config files into database tables. The goal is to eventually push the entire score computation into SQL, with no TypeScript aggregation.

### 1. Schema Design

We designed 10 new config tables (living in a `scoring_config` schema) that replace everything in `src/a11yscore/config/`:

| Table | Replaces | Rows |
|---|---|---|
| `scoring_params` | `config/data-quality.ts` + 80/20 blend ratio | 4 |
| `scoring_topics` | `config/topics/index.ts` | 7 |
| `scoring_criteria` | `config/criteria/*.ts` (names, reasons, links) | 19 |
| `scoring_criterion_rules` | `config/criteria/*.ts` — the `CASE WHEN` SQL functions | 71 |
| `scoring_criterion_dq_tags` | `config/criteria/*.ts` — `osmTags` arrays for data quality | 57 |
| `scoring_top_level_categories` | `config/categories/*.ts` — top-level definitions + weights | 9 |
| `scoring_sub_categories` | `config/categories/*.ts` — sub-category definitions + weights | 54 |
| `scoring_sub_category_selectors` | `config/categories/*.ts` — `sql.where` clauses | 199 |
| `scoring_sub_category_display_tags` | `config/categories/*.ts` — `osmTags` for frontend display | 176 |
| `scoring_assignments` | `config/categories/*.ts` — `topics[]` arrays (the wiring) | 406 |

Key design decisions:
- **Scoring rules are declarative rows** instead of hardcoded `CASE WHEN` expressions. Each row has a `criterion_id`, `tag_key`, `match_type` (`exact`/`present`/`any_known`), `tag_value`, `points`, and `priority`. A SQL generator builds the `CASE WHEN` from these rows at query time.
- **Sub-category selectors use a `filter_group` pattern**: rows in the same group are ANDed, different groups are ORed. This is disjunctive normal form (OR-of-ANDs) and handles all existing filter patterns.
- **`scoring_assignments`** is the junction table that wires sub-categories to topics to criteria with weights. Shared topic templates (like `genericGastronomyTopics`) are inserted via `CROSS JOIN` against a VALUES list.

### 2. ERD

Created `docs/scoring-config-erd.md` with two Mermaid diagrams:
- An **ER diagram** showing all config tables + the existing result tables
- A **flowchart** showing the three-phase computation data flow

### 3. Local Test Database

Created tooling to set up a local copy of the OSM sync database with real data:

**`scripts/dump-osm-subset.sh`** — Dumps a spatial subset of the production OSM sync DB (Berlin + Kreis Segeberg) into a loadable SQL file. Safety features:
- `PGOPTIONS="-c default_transaction_read_only=on"` — enforced at connection level, server rejects any writes
- `statement_timeout=600000` (10 min) — prevents runaway queries against production
- Connection check before starting work
- `set -euo pipefail` + `ON_ERROR_STOP`

**`docker/scoring-config-schema-and-seed.sql`** — Idempotent SQL file that creates the `scoring_config` schema and seeds all 10 tables with the complete config data extracted from every TypeScript config file. Wrapped in `BEGIN/COMMIT` with a sanity-check `DO` block at the end.

### 4. Current State of the Test Database

Running on `localhost:54322` (the `osm_database_test` docker-compose service):

```
OSM data (public schema):
  osm_admin:      232 rows  (Berlin + Segeberg + child admin areas)
  osm_amenities:  227,236 rows
  osm_platforms:  1,834 rows
  osm_stations:   473 rows

Scoring config (scoring_config schema):
  scoring_params:                       4 rows
  scoring_topics:                       7 rows
  scoring_criteria:                    19 rows
  scoring_criterion_rules:             71 rows
  scoring_criterion_dq_tags:           57 rows
  scoring_top_level_categories:         9 rows
  scoring_sub_categories:              54 rows
  scoring_sub_category_selectors:     199 rows
  scoring_sub_category_display_tags:  176 rows
  scoring_assignments:                406 rows
```

Connect with: `PGPASSWORD=imposm psql -h localhost -p 54322 -U imposm -d imposm`

### 5. What's NOT changed

- The existing TypeScript config files are untouched
- The existing V1/V2 score computation code is untouched
- The existing result tables (`scores`, `toplevel_category_scores`, etc.) are untouched
- No production databases were modified

### Files Created

| File | Purpose |
|---|---|
| `docs/scoring-config-erd.md` | ERD + data flow diagrams (Mermaid) |
| `docker/scoring-config-schema-and-seed.sql` | Config schema DDL + full seed data |
| `docker/osm-subset-data.sql` | Berlin + Kreis Segeberg OSM data dump |
| `scripts/dump-osm-subset.sh` | Script to regenerate the OSM data dump |

### Next Step

Implement the `compute_scores` plpgsql function that reads from the `scoring_config` tables and the OSM data, runs the full aggregation in SQL, and writes results — replacing the TypeScript `calculateScoresForAdminAreaV2`. This function should be testable from an Observable Framework notebook in the `a11yscore-experiments` repo.

