import { drizzle } from "drizzle-orm/node-postgres";
import * as osmSyncSchema from "~/db/schema/osm-sync";
import * as resultsSchema from "~/db/schema/results";

function getDatabaseUrl({
	user,
	password,
	db,
	host,
	port,
}: {
	user: string;
	password: string;
	db: string;
	host: string;
	port: string;
}) {
	return `postgres://${user}:${password}@${host}:${port}/${db}`;
}

function getSslConfig({
	ssl,
	allowSelfSigned,
}: {
	ssl: boolean;
	allowSelfSigned: boolean;
}) {
	if (!ssl) {
		return false;
	}
	if (allowSelfSigned) {
		return {
			rejectUnauthorized: false,
		};
	}
	return true;
}

export const resultsDb = drizzle({
	connection: {
		connectionString: getDatabaseUrl(useRuntimeConfig().database.results),
		ssl: getSslConfig(useRuntimeConfig().database.results),
	},
	schema: resultsSchema,
});

export const osmSyncDb = drizzle({
	connection: {
		connectionString: getDatabaseUrl(useRuntimeConfig().database.osmSync),
		ssl: getSslConfig(useRuntimeConfig().database.osmSync),
	},
	schema: osmSyncSchema,
});
