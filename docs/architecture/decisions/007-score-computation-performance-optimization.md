# ADR 7 - Score Computation Performance Optimization

## Status
✅ Accepted on 2026-04-13

## Context

As established in [ADR 5](005-database-setup-and-score-computation.md), score computation runs asynchronously in worker processes, reading from the OSM sync database and writing results to the app database. The original implementation (`calculateScoresForAdminArea`) processes everything sequentially inside a single long-lived app database transaction:

1. For each of the 54 active sub-categories, it issues a read query against the OSM sync database, then immediately writes placeholder rows and updates them one-by-one in the app database.
2. At every level of the hierarchy (criterion → topic → sub-category → top-level category → overall), it inserts a placeholder row to obtain a generated ID, then updates that same row with the computed score.

This results in **~1,400 serial database round-trips** (individual INSERTs and UPDATEs) plus **54 sequential read queries** — all held inside one app database transaction. For larger admin areas, this took **up to 2.5 minutes** per computation.

We also discovered that the `pg.Pool` connection config used `db` instead of `database` as the property name. The `pg` library only recognizes `database`; the `db` field was silently ignored. Connections worked by accident because `pg` defaults the database name to the username, which happened to match in all existing configurations (`a11yscore`/`a11yscore`, `imposm`/`imposm`).

## Decision

### Two-phase architecture

We restructured the score computation into two distinct phases:

**Read phase** (no app database transaction open):
- All 54 sub-category queries are ran concurrently against the OSM sync database, controlled by a configurable concurrency limit (`NITRO_SCORE_READ_CONCURRENCY`, default 8) using `p-limit`.
- Non-successful queries are collected via `Promise.allSettled` and reported as an `AggregateError` — a partial score is never written.
- The existing `createScoreAggregator` runs the same aggregation logic in memory (criterion → topic → sub-category → top-level category → overall). The scoring algorithm is completely unchanged.

**Write phase** (single short app database transaction):
- 5 batch `INSERT` statements (one per table level), each inserting all rows for that level at once with final computed values.
- Parent IDs are resolved by natural-key lookup from `.returning()` results (e.g. `topLevelCategory`, `subCategory` column values), never by positional index.

### Keeping aggregation in TypeScript

We evaluated moving the weighted-average aggregation into SQL CTEs but decided against it. The `createScoreAggregator` has three distinct behavioral modes (plain weighted average, data-quality-adjusted weights, exclusion of unavailable data), a two-pass virtual data quality component at the topic level, and config-driven weights that vary per sub-category/topic/criterion combination. It is independently unit-tested (298 tests) and still actively evolving. Moving this into dynamically generated SQL would duplicate the config-driven logic, break the existing test suite, and make the algorithm more difficult to iterate on — for a marginal gain, since the aggregation is pure arithmetic on ~300 numbers already in memory.

### Connection config fix

Changed all connection configs from `db` to `database` so the `pg` library actually uses the configured database name instead of silently falling back to the username.

### Configurable pool size

The OSM sync database pool size is now explicitly configurable via `NITRO_DATABASE_OSM_SYNC_POOL_MAX` (default 10) instead of relying on the `pg` library's implicit default.

### Benchmark framework

To validate correctness without risking production data, the optimized implementation (V2) writes to a **separate benchmark database** with identical schema. A dedicated `benchmark-score-computation` job runs both V1 and V2 against the same admin area, times each end-to-end (including all reads and writes), and compares the resulting scores.

## Benchmark results

All benchmarks ran on the local development environment against the same OSM sync database. V1 runs first (writes to production app database), then V2 (writes to benchmark database). Scores matched in every run.

| Admin area | V1 (original) | V2 (optimized) | Speedup | Scores match |
|------------|---------------|----------------|---------|--------------|
| `51ab34a6` (cold) | 149,331 ms | 5,251 ms | **28.4×** | ✅ |
| `435d7d08` | 16,994 ms | 2,216 ms | **7.7×** | ✅ |
| `51ab34a6` (warm) | 20,163 ms | 5,362 ms | **3.8×** | ✅ |
| `67a910fa` | 13,517 ms | 1,450 ms | **9.3×** | ✅ |

The first run for `51ab34a6` was significantly slower because the PostgreSQL query cache was cold. Subsequent runs for the same area show a consistent **4–9× speedup**. Smaller admin areas benefit more from parallelization since the per-query overhead dominates.

The speedup comes from two independent improvements:
1. **Parallel reads**: 54 sequential queries → 54 concurrent (limited to 8 at a time), reducing read time by roughly 7×.
2. **Batch writes**: ~1,400 individual INSERT/UPDATE round-trips → 5 batch INSERTs, reducing write time from seconds to milliseconds.

## Consequences

- The scoring algorithm (`createScoreAggregator`) is completely unchanged. All 298 existing unit tests continue to pass.
- The app database transaction is now held for milliseconds (writes only) instead of the entire computation duration. This reduces WAL pressure, lock contention, and the risk of transaction timeout.
- Score computation for all admin areas (currently run once daily) will complete significantly faster, reducing worker resource usage and allowing more frequent recomputation in the future.
- The `NITRO_SCORE_READ_CONCURRENCY` and `NITRO_DATABASE_OSM_SYNC_POOL_MAX` environment variables allow tuning parallelism without code changes. With worker concurrency of 4 and read concurrency of 8 per area, up to 32 concurrent OSM sync connections are possible — within PgBouncer limits in production but worth monitoring.
- The benchmark framework (separate database + comparison job) can be removed once V2 replaces V1 in the production job handler.

