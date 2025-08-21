import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { osmSyncDb } from "~/db";
import { osm_admin, osm_amenities } from "~/db/schema/osm-sync";
import { getCombinedScoreQuery } from "~~/src/score/utils/sql-sub-selects";

// TODO: this code is just the first iteration for testing, remove it later
export default defineEventHandler(async (event) => {
	const pgDialect = new PgDialect();

	const join = [
		sql`JOIN ${osm_admin} ON ST_Intersects(${osm_amenities.geometry}, ${osm_admin.geometry})`,
	];
	const where = [
		sql`${osm_admin.name} = ${getRouterParam(event, "adminArea")}`,
	];

	const sqlClause = getCombinedScoreQuery({ join, where });
	const query = pgDialect.sqlToQuery(sqlClause);

	const { rows } = await osmSyncDb.execute(sqlClause);

	return {
		query,
		rows,
	};
});
