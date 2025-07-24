import { drizzle } from "drizzle-orm/node-postgres";
import * as osmSyncSchema from "~/db/schema/osm-sync";
import * as resultsSchema from "~/db/schema/results";

function getDatabaseCredentials({
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
	return { user, password, db, host, port: parseInt(port) };
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
	return {
		rejectUnauthorized: allowSelfSigned,
	};
}

console.log({
	...getDatabaseCredentials(useRuntimeConfig().database.results),
	ssl: getSslConfig(useRuntimeConfig().database.results),
});

console.log({
	...getDatabaseCredentials(useRuntimeConfig().database.osmSync),
	ssl: getSslConfig(useRuntimeConfig().database.osmSync),
});

export const resultsDb = drizzle({
	connection: {
		...getDatabaseCredentials(useRuntimeConfig().database.results),
		ssl: getSslConfig(useRuntimeConfig().database.results),
	},
	schema: resultsSchema,
});

export const osmSyncDb = drizzle({
	connection: {
		...getDatabaseCredentials(useRuntimeConfig().database.osmSync),
		ssl: getSslConfig(useRuntimeConfig().database.osmSync),
	},
	schema: osmSyncSchema,
});
