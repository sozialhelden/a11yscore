# Database-Driven Score Computation

This document describes the SQL-based scoring functions in `scoring_config` schema
that compute a11yscores directly from database configuration (no TypeScript config needed).

## Overview

The `docker/compute-scores.sql` file installs PL/pgSQL functions that:

1. Read scoring configuration from `scoring_config.*` tables
2. Query OSM data from `public.osm_*` tables
3. Compute the full score hierarchy (criterion → topic → sub-category → TLC → overall)
4. Return results as rows — they do **not** write to the result tables

This is complementary to (not a replacement for) the existing V1/V2 TypeScript score
computation in `src/a11yscore/queries/`. The TypeScript path writes results to the
`scores`/`*_scores` tables for the API. The SQL path is designed for:

- **Experimentation** — tune algorithm parameters interactively in the Observable notebook
- **Validation** — cross-check TypeScript scoring against a pure-SQL implementation
- **Future migration** — eventually the SQL functions could replace the TypeScript scoring

## Functions

All functions accept optional parameter overrides so callers can experiment
with different algorithm settings without modifying the `scoring_params` table.

### `compute_criterion_scores(admin_osm_id, min_dq_override)`

The lowest-level scoring function. For each `scoring_assignments` row, it:

1. Builds a `WHERE` clause from `scoring_sub_category_selectors` (DNF: OR-of-ANDs)
2. Builds a `CASE WHEN` from `scoring_criterion_rules` (priority-ordered tag matching)
3. Builds a data-quality expression from `scoring_criterion_dq_tags`
4. Executes **one query per sub-category** (batching all criteria into a single table scan)

Returns one row per (sub_category, topic, criterion) with score, DQ factor, tag count, and weight.

### `compute_topic_scores(admin_osm_id, min_dq, no_data_thresh, topic_score_w, topic_dq_w)`

Aggregates criterion scores into topic scores using:

- **DQ-adjusted weights**: `adjusted_weight = weight × data_quality_factor`
- **Normalized weighted average**: scores weighted by adjusted weights, normalized to sum=1
- **Virtual DQ blend**: `final = topic_score_w × preliminary + topic_dq_w × (100 × dq_factor)`

### `compute_sub_category_scores(...)`

Simple average of topic scores within each sub-category (topics are equally weighted).

### `compute_top_level_category_scores(...)`

Weighted average of sub-category scores, **excluding** sub-categories where
`data_quality_factor ≤ no_data_threshold`.

### `compute_overall_score(...)`

Weighted average across all non-planned top-level categories.

### `compute_score_tree(...)`

All-in-one convenience function that returns a single composite row containing
arrays for each aggregation level.

## Parameter Overrides

| Parameter | Default | Description |
|---|---|---|
| `p_min_dq_override` | 0.2 | Minimum data quality factor floor |
| `p_no_data_thresh_override` | 0.21 | Below this DQ, sub-cat is excluded from TLC score |
| `p_topic_score_w_override` | 0.8 | Weight of the preliminary score in the DQ blend |
| `p_topic_dq_w_override` | 0.2 | Weight of the DQ-based score in the DQ blend |

## Usage

```sql
-- Score Berlin with default parameters
SELECT * FROM scoring_config.compute_overall_score(-62422);

-- Score Berlin with custom parameters
SELECT * FROM scoring_config.compute_overall_score(
  -62422,   -- admin_osm_id
  0.1,      -- min_dq (lower floor)
  0.11,     -- no_data_threshold
  0.6,      -- topic_score_weight (less emphasis on raw score)
  0.4       -- topic_dq_weight (more emphasis on data quality)
);

-- Get criterion-level detail
SELECT * FROM scoring_config.compute_criterion_scores(-62422)
ORDER BY sub_category_id, topic_id;

-- Full tree (all levels)
SELECT * FROM scoring_config.compute_score_tree(-62422);
```

## Prerequisites

1. Install the scoring config schema: `psql -f docker/scoring-config-schema-and-seed.sql`
2. Install the scoring functions: `psql -f docker/compute-scores.sql`

## Observable Notebook

The `a11yscore-experiments` repo has an interactive "Scoring Algorithm Tuning" notebook
that uses these functions. It:

1. Fetches criterion-level scores once via a data loader (server-side)
2. Performs all aggregation in the browser (JavaScript)
3. Lets users tune algorithm parameters with sliders and see results instantly

See `a11yscore-experiments/src/scoring-tuning.md`.

