import { desc, eq, sql } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { appDb, benchmarkAppDb } from "~/db";
import { adminAreas, scores } from "~/db/schema/app";
import { osm_admin } from "~/db/schema/osm-sync";
import type { BenchmarkScoreComputationJob } from "~/queue";
import { calculateScoresForAdminArea } from "~~/src/a11yscore/queries/calculate-scores-for-admin-area";
import { calculateScoresForAdminAreaV2 } from "~~/src/a11yscore/queries/calculate-scores-for-admin-area-v2";

export async function handle(job: BenchmarkScoreComputationJob) {
  if (!benchmarkAppDb) {
    throw new Error(
      "Benchmark database is not configured. Set NITRO_DATABASE_BENCHMARK_* env vars.",
    );
  }

  const implementation = job.data.implementation ?? "both";
  const adminAreaId = job.data.adminArea?.id;
  const adminArea = await getAdminArea(adminAreaId);

  console.debug(
    `[Benchmark] Starting score computation benchmark for admin area ${adminAreaId} (mode: ${implementation})...`,
  );

  // Prepare benchmark DB: ensure admin_areas row exists (FK constraint)
  await ensureAdminAreaInBenchmarkDb(adminArea);

  // Truncate score tables in benchmark DB before the run
  await truncateBenchmarkScores();

  const where = [() => sql`${osm_admin.osm_id} = ${adminArea.osmId}`];
  const join = [
    (table: PgTableWithColumns<any>) =>
      sql`JOIN ${osm_admin} ON ST_Intersects(${table.geometry}, ${osm_admin.geometry})`,
  ];

  const params = { where, join };

  let originalMs: number | undefined;
  let optimizedMs: number | undefined;
  let scoresMatch: boolean | undefined;

  // Run V1 (original)
  if (implementation === "original" || implementation === "both") {
    const start = performance.now();
    await calculateScoresForAdminArea(adminAreaId, params);
    originalMs = Math.round(performance.now() - start);
    console.debug(`[Benchmark] V1 (original) completed in ${originalMs}ms`);
  }

  // Run V2 (optimized) — writes to benchmark DB
  if (implementation === "optimized" || implementation === "both") {
    const start = performance.now();
    await calculateScoresForAdminAreaV2(adminAreaId, params, benchmarkAppDb);
    optimizedMs = Math.round(performance.now() - start);
    console.debug(`[Benchmark] V2 (optimized) completed in ${optimizedMs}ms`);
  }

  // Compare scores if both ran
  if (
    implementation === "both" &&
    originalMs !== undefined &&
    optimizedMs !== undefined
  ) {
    const v1Score = await getLatestScore(appDb, adminAreaId);
    const v2Score = await getLatestScore(benchmarkAppDb, adminAreaId);

    scoresMatch =
      v1Score?.score === v2Score?.score &&
      v1Score?.dataQualityFactor === v2Score?.dataQualityFactor;

    const speedup =
      originalMs > 0 ? (originalMs / optimizedMs).toFixed(1) : "N/A";

    const result = {
      adminAreaId,
      originalMs,
      optimizedMs,
      speedup: `${speedup}x`,
      scoresMatch,
      v1Score: v1Score
        ? { score: v1Score.score, dataQualityFactor: v1Score.dataQualityFactor }
        : null,
      v2Score: v2Score
        ? { score: v2Score.score, dataQualityFactor: v2Score.dataQualityFactor }
        : null,
    };

    console.log(`[Benchmark] Result:`, JSON.stringify(result, null, 2));
  }

  return { originalMs, optimizedMs, scoresMatch };
}

async function getAdminArea(id?: string) {
  const adminArea = (
    await appDb.select().from(adminAreas).where(eq(adminAreas.id, id))
  ).shift();

  if (!adminArea) {
    throw new Error(`Could not find admin area with ${id}`);
  }

  return adminArea;
}

async function ensureAdminAreaInBenchmarkDb(
  adminArea: typeof adminAreas.$inferSelect,
) {
  if (!benchmarkAppDb) return;

  await benchmarkAppDb
    .insert(adminAreas)
    .values(adminArea)
    .onConflictDoUpdate({
      target: adminAreas.osmId,
      set: {
        name: adminArea.name,
        adminLevel: adminArea.adminLevel,
        slug: adminArea.slug,
        wikidata: adminArea.wikidata,
        image: adminArea.image,
      },
    });
}

async function truncateBenchmarkScores() {
  if (!benchmarkAppDb) return;

  // Truncate in reverse FK order — criterion_scores → topic_scores → sub_category_scores → toplevel_category_scores → scores
  await benchmarkAppDb.execute(
    sql`TRUNCATE criterion_scores, topic_scores, sub_category_scores, toplevel_category_scores, scores CASCADE`,
  );
}

async function getLatestScore(db: typeof appDb, adminAreaId: string) {
  const [result] = await db
    .select({
      score: scores.score,
      dataQualityFactor: scores.dataQualityFactor,
    })
    .from(scores)
    .where(eq(scores.adminAreaId, adminAreaId))
    .orderBy(desc(scores.createdAt))
    .limit(1);

  return result ?? null;
}
