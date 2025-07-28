import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * This is used by drizzle-kit to work with the app-database, aka
 * create migrations and run them. The osm-sync database is built and
 * managed by imposm.
 */

const {
	NITRO_DATABASE_APP_USER,
	NITRO_DATABASE_APP_PASSWORD,
	NITRO_DATABASE_APP_HOST,
	NITRO_DATABASE_APP_PORT,
	NITRO_DATABASE_APP_DB,
	NITRO_DATABASE_APP_SSL,
	NITRO_DATABASE_APP_ALLOW_SELF_SIGNED,
} = process.env;

const ssl =
	NITRO_DATABASE_APP_SSL !== "true"
		? false
		: {
				rejectUnauthorized: NITRO_DATABASE_APP_ALLOW_SELF_SIGNED !== "true",
			};

export default defineConfig({
	out: "./server/db/migrations",
	schema: "./server/db/schema/app/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		host: NITRO_DATABASE_APP_HOST,
		port: parseInt(NITRO_DATABASE_APP_PORT),
		user: NITRO_DATABASE_APP_USER,
		password: NITRO_DATABASE_APP_PASSWORD,
		database: NITRO_DATABASE_APP_DB,
		ssl,
	},
});
