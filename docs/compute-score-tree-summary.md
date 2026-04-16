# `compute_score_tree()` — Performance Audit & Optimization

## Context

Following the work in [scoring-config-summary.md](./scoring-config-summary.md), we implemented `compute_score_tree()` — a PL/pgSQL function that computes the full score hierarchy from the `scoring_config` tables and OSM data entirely in the database.

## Performance Audit

We audited the initial SQL implementation against the existing TypeScript scoring code and identified two critical issues:

### Issue 1: 5× redundant OSM table scans (fixed)

The original `compute_score_tree()` called five standalone functions independently (`compute_criterion_scores`, `compute_topic_scores`, `compute_sub_category_scores`, `compute_top_level_category_scores`, `compute_overall_score`). Each one cascaded back down to `compute_criterion_scores()`, causing the ~54 dynamic OSM queries to run **5 times** instead of once.

| | OSM queries | Berlin wall clock |
|---|---|---|
| Old (5 standalone calls) | ~270 | ~21.5s |
| New (single CTE chain) | ~54 | ~4.2s |
| **Speedup** | **5×** | **~4.3×** |

### Issue 2: `tags->` hstore vs dedicated columns (not fixed, documented)

The SQL functions always access tag values via `t.tags->'key'` (hstore lookup). Some OSM tables have dedicated indexed columns for common tags (e.g., `osm_amenities."wheelchair"` is a varchar column with a B-tree index). Using those columns instead of the hstore would allow index-based filtering.

However, this is non-trivial to implement safely:
- Some tables have dedicated columns with **different types** (e.g., `osm_platforms."bench"` is `bool`, not `varchar`) — blindly resolving to the column causes type mismatch errors.
- The hstore always stores the raw OSM text value, while dedicated columns may interpret it differently.
- A proper fix requires a mapping table or convention to know which columns are safe to use for which tables.

This is left as future work.

## What Changed

**File:** `docker/compute-scores.sql`

The file now contains 6 functions (down from 10):

| Function | Purpose |
|---|---|
| `build_selector_where` | Builds WHERE clause from sub-category selectors |
| `build_criterion_case` | Builds CASE WHEN from criterion scoring rules |
| `build_dq_expression` | Builds data quality factor expression |
| `build_tag_count_expression` | Builds tag count expression |
| `compute_criterion_scores` | Phase 1 — dynamic queries against OSM tables |
| `compute_score_tree` | **Main entry point** — single-pass CTE chain |

The four standalone cascading functions (`compute_topic_scores`, `compute_sub_category_scores`, `compute_top_level_category_scores`, `compute_overall_score`) were removed. Their aggregation logic is inlined into `compute_score_tree`'s CTE chain.

## How It Works

```
compute_score_tree(osm_id)
  │
  ├─ CTE: crit ← compute_criterion_scores()   ← only OSM table access
  ├─ CTE: adjusted ← weight × DQ factor
  ├─ CTE: topic_weight_sums ← normalization denominators
  ├─ CTE: topic_raw ← weighted averages per topic
  ├─ CTE: topics ← CEIL + virtual DQ blend (80/20)
  ├─ CTE: sub_cats ← AVG of topic scores per sub-category
  ├─ CTE: tlcs ← weighted average, excluding no-data sub-cats
  ├─ CTE: overall ← weighted average of TLCs
  │
  └─ SELECT INTO v_tree ← collect all arrays + overall in one query
```

## Validation

Results match the old standalone functions within ±1 point (due to floating-point rounding consistency — the CTE chain is actually more self-consistent since all levels derive from the same criterion values).

```
 top_level_category_id  │ standalone │ score_tree
────────────────────────┼────────────┼────────────
 education              │         22 │         22
 food-and-drinks        │         16 │         16
 health-care            │         21 │         21
 public-institutions    │         24 │         25
 public-transport       │         37 │         37
 social-care            │         18 │         18
```

## Usage

```sql
-- Compute full tree for Berlin
SELECT * FROM scoring_config.compute_score_tree(-62422);

-- Inspect individual levels
SELECT (t).overall_score, (t).overall_data_quality_factor
FROM scoring_config.compute_score_tree(-62422) t;

-- Unnest criteria
SELECT (unnest((t).criteria)).*
FROM scoring_config.compute_score_tree(-62422) t;
```

