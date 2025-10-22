import { sql } from "drizzle-orm";
import { osmSyncDb } from "~/db";
import { osm_admin, osm_amenities } from "~/db/schema/osm-sync";
import { getCombinedScoreQuery } from "~~/src/a11yscore/queries/score-sub-selects";

export async function calculateScoreByAdminArea(
  adminAreaId: string | number,
): Promise<Record<string, number>> {
  const join = [
    sql`JOIN ${osm_admin} ON ST_Intersects(${osm_amenities.geometry}, ${osm_admin.geometry})`,
  ];
  const where = [sql`${osm_admin.osm_id} = ${adminAreaId}`];

  const sqlClause = getCombinedScoreQuery({ join, where });
  const result = await osmSyncDb.execute(sqlClause);

  return result.rows.shift() as Record<string, number>;
}
