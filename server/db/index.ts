import { drizzle } from "drizzle-orm/node-postgres";
import * as osmSyncSchema from "~/db/schema/osm-sync";
import * as resultsSchema from "~/db/schema/results";
import { OSM_SYNC_DATABASE_URL, RESULTS_DATABASE_URL } from "~/utils/env";

export const resultsDb = drizzle({
	connection: {
		connectionString: RESULTS_DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
	},
	schema: resultsSchema,
});

export const osmSyncDb = drizzle({
	connection: {
		connectionString: OSM_SYNC_DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
	},
	schema: osmSyncSchema,
});
