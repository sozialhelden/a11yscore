# Scoring Config — Entity Relationship Diagram

This diagram shows the proposed database schema for storing all scoring algorithm
configuration (weights, criterion rules, data-quality tags, sub-category selectors,
and the category→topic→criterion wiring) that is currently hardcoded in TypeScript.

The **existing result tables** (`scores`, `toplevel_category_scores`, etc.) are shown
in grey — they remain unchanged but are included for context.

```mermaid
erDiagram

    %% ─── ALGORITHM PARAMETERS ────────────────────────────────────────

    scoring_params {
        text key PK "e.g. min_data_quality_factor"
        double_precision value "e.g. 0.2"
    }

    %% ─── TOPICS ──────────────────────────────────────────────────────

    scoring_topics {
        text id PK "e.g. mobility, vision"
        text name_key "i18n key"
    }

    %% ─── CRITERIA (metadata) ─────────────────────────────────────────

    scoring_criteria {
        text id PK "e.g. is-wheelchair-accessible"
        text name_key "i18n key"
        text reason_key "i18n key"
        jsonb recommendations "array of i18n keys"
        jsonb links "array of label+url"
    }

    %% ─── CRITERION SCORING RULES (replaces CASE WHEN) ───────────────

    scoring_criterion_rules {
        uuid id PK
        text criterion_id FK
        text tag_key "e.g. wheelchair"
        text match_type "exact | present | any_known"
        text tag_value "NULL for present/any_known"
        integer points "e.g. 100, 50, 10"
        integer priority "lower = checked first"
    }

    scoring_criteria ||--o{ scoring_criterion_rules : "has rules"

    %% ─── CRITERION DATA-QUALITY TAGS (replaces osmTags) ─────────────

    scoring_criterion_dq_tags {
        uuid id PK
        text criterion_id FK
        text tag_key "e.g. wheelchair"
        text tag_value "exact value or * for presence"
    }

    scoring_criteria ||--o{ scoring_criterion_dq_tags : "has DQ tags"

    %% ─── TOP-LEVEL CATEGORIES ────────────────────────────────────────

    scoring_top_level_categories {
        text id PK "e.g. food-and-drinks"
        text name_key "i18n key"
        text description_key "i18n key"
        double_precision weight "e.g. 0.18"
        boolean planned "false"
        integer sort_order "0"
        jsonb sdgs "e.g. [2, 12, 13]"
    }

    %% ─── SUB-CATEGORIES ─────────────────────────────────────────────

    scoring_sub_categories {
        text id PK "e.g. restaurants"
        text top_level_category_id FK
        text name_key "i18n key"
        text description_key "i18n key"
        double_precision weight "e.g. 0.2"
        text osm_source_table "osm_amenities | osm_platforms | osm_stations"
    }

    scoring_top_level_categories ||--o{ scoring_sub_categories : "contains"

    %% ─── SUB-CATEGORY POI SELECTORS (replaces sql.where) ────────────

    scoring_sub_category_selectors {
        uuid id PK
        text sub_category_id FK
        integer filter_group "same group = AND, groups = OR"
        text column_ref "amenity | tags:fountain"
        text operator "= or !="
        text value "e.g. restaurant"
    }

    scoring_sub_categories ||--o{ scoring_sub_category_selectors : "filtered by"

    %% ─── SUB-CATEGORY DISPLAY TAGS (frontend only) ──────────────────

    scoring_sub_category_display_tags {
        uuid id PK
        text sub_category_id FK
        text tag_key "e.g. amenity"
        text tag_value "e.g. restaurant"
    }

    scoring_sub_categories ||--o{ scoring_sub_category_display_tags : "shown as"

    %% ─── THE WIRING: ASSIGNMENTS (sub-cat × topic × criterion) ──────

    scoring_assignments {
        uuid id PK
        text sub_category_id FK
        text topic_id FK
        text criterion_id FK
        double_precision weight "e.g. 0.8"
        text reason_override_key "optional i18n key"
        jsonb recommendations_override "optional"
        jsonb links_override "optional"
    }

    scoring_sub_categories ||--o{ scoring_assignments : "assigns"
    scoring_topics ||--o{ scoring_assignments : "within topic"
    scoring_criteria ||--o{ scoring_assignments : "uses criterion"

    %% ═══════════════════════════════════════════════════════════════════
    %% EXISTING RESULT TABLES (unchanged — shown for context)
    %% ═══════════════════════════════════════════════════════════════════

    admin_areas {
        uuid id PK
        integer osm_id UK
        varchar name
        integer admin_level
        varchar slug
    }

    scores {
        uuid id PK
        uuid admin_area_id FK
        integer score
        integer unadjusted_score
        double_precision data_quality_factor
        timestamp created_at
    }

    admin_areas ||--o{ scores : "computed for"

    toplevel_category_scores {
        uuid id PK
        uuid score_id FK
        varchar toplevel_category
        integer score
        double_precision data_quality_factor
        timestamp created_at
    }

    scores ||--o{ toplevel_category_scores : "breaks down into"

    sub_category_scores {
        uuid id PK
        uuid toplevel_category_score_id FK
        varchar sub_category
        integer score
        double_precision data_quality_factor
        timestamp created_at
    }

    toplevel_category_scores ||--o{ sub_category_scores : "breaks down into"

    topic_scores {
        uuid id PK
        uuid sub_category_score_id FK
        varchar topic
        integer score
        integer unadjusted_score
        double_precision data_quality_factor
        timestamp created_at
    }

    sub_category_scores ||--o{ topic_scores : "breaks down into"

    criterion_scores {
        uuid id PK
        uuid topic_score_id FK
        varchar criterion
        integer score
        integer tag_count
        double_precision data_quality_factor
        timestamp created_at
    }

    topic_scores ||--o{ criterion_scores : "breaks down into"
```

## Table Summary

| Table | Purpose | Replaces |
|---|---|---|
| `scoring_params` | Global algorithm constants | `config/data-quality.ts`, 80/20 blend ratio |
| `scoring_topics` | Topic definitions | `config/topics/index.ts` |
| `scoring_criteria` | Criterion metadata (name, reason, links) | `config/criteria/*.ts` (metadata) |
| `scoring_criterion_rules` | Scoring CASE WHEN branches per criterion | `config/criteria/*.ts` (`sql` functions) |
| `scoring_criterion_dq_tags` | Tags for data quality factor calculation | `config/criteria/*.ts` (`osmTags` arrays) |
| `scoring_top_level_categories` | Top-level category definitions + weights | `config/categories/*.ts` (top-level) |
| `scoring_sub_categories` | Sub-category definitions + weights + source table | `config/categories/*.ts` (sub-categories) |
| `scoring_sub_category_selectors` | POI filter conditions per sub-category | `config/categories/*.ts` (`sql.where`) |
| `scoring_sub_category_display_tags` | OSM tags shown in the frontend | `config/categories/*.ts` (`osmTags`) |
| `scoring_assignments` | Wiring: sub-category × topic × criterion + weight | `config/categories/*.ts` (`topics[]` arrays) |

## Aggregation Hierarchy (data flow during `compute_scores()`)

```mermaid
flowchart TB
    subgraph "Phase 1 — Criterion Scoring (dynamic SQL per sub-category)"
        OSM["OSM tables<br/>(osm_amenities, osm_platforms, osm_stations)"]
        RULES["scoring_criterion_rules<br/>(LATERAL rule match)"]
        DQ["scoring_criterion_dq_tags<br/>(LATERAL DQ check)"]
        SEL["scoring_sub_category_selectors<br/>(WHERE clause)"]
        CRIT["_crit temp table<br/>one row per sub-cat × topic × criterion"]
        OSM --> CRIT
        RULES --> CRIT
        DQ --> CRIT
        SEL --> CRIT
    end

    subgraph "Phase 2 — Aggregation (static SQL)"
        CRIT --> TOPICS["_topics<br/>Σ(score·w·dq) / Σ(w·dq)<br/>+ virtual DQ blend (80/20)"]
        TOPICS --> SUBCATS["_sub_cats<br/>AVG(topic scores)"]
        SUBCATS --> TLCS["_tlcs<br/>weighted avg, exclude no-data"]
        TLCS --> OVERALL["overall score<br/>weighted avg across TLCs"]
    end

    subgraph "Phase 3 — Write Results"
        OVERALL --> S["scores"]
        TLCS --> TCS["toplevel_category_scores"]
        SUBCATS --> SCS["sub_category_scores"]
        TOPICS --> TS["topic_scores"]
        CRIT --> CS["criterion_scores"]
    end
```

