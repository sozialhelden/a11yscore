import { eq, sql } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { osm_admin } from "~/db/schema/osm-sync";
import type { ComputeAdminAreaScoreJob } from "~/queue";
import { calculateScoresForAdminArea } from "~~/src/a11yscore/queries/calculate-scores-for-admin-area";

export async function handle(job: ComputeAdminAreaScoreJob) {
  const adminAreaId = job.data.adminArea?.id;
  const adminArea = await getAdminArea(adminAreaId);

  console.debug(`Starting score computation for admin area ${adminAreaId}...`);

  const where = [() => sql`${osm_admin.osm_id} = ${adminArea.osmId}`];
  const join = [
    (table: PgTableWithColumns<any>) =>
      sql`JOIN ${osm_admin} ON ST_Intersects(${table.geometry}, ${osm_admin.geometry})`,
  ];

  await calculateScoresForAdminArea(adminAreaId, { where, join });
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
