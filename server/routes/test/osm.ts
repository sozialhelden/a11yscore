import { sql } from "drizzle-orm";
import { osmSyncDb } from "~/db";
import { osm_amenities } from "~/db/schema/osm-sync";

// TODO: this is testing code to see if the osm database connection works
export default defineEventHandler(async (_event) => {
	const results = await osmSyncDb.execute(
		sql`SELECT * FROM ${osm_amenities} WHERE osm_id = 975235121`,
	);
	return results.rows;
});
