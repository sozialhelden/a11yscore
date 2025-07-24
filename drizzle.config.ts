import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * This is used by drizzle-kit to work with the results-database, aka
 * create migrations and run them. The osm-sync database is built and
 * managed by imposm.
 */

const {
	NITRO_DATABASE_RESULTS_USER,
	NITRO_DATABASE_RESULTS_PASSWORD,
	NITRO_DATABASE_RESULTS_HOST,
	NITRO_DATABASE_RESULTS_PORT,
	NITRO_DATABASE_RESULTS_DB,
	NITRO_DATABASE_RESULTS_SSL,
	NITRO_DATABASE_RESULTS_ALLOW_SELF_SIGNED,
} = process.env;

const ssl =
	NITRO_DATABASE_RESULTS_SSL !== "true"
		? false
		: NITRO_DATABASE_RESULTS_ALLOW_SELF_SIGNED === "true"
			? {
					rejectUnauthorized: false,
				}
			: true;

const url = `postgres://${NITRO_DATABASE_RESULTS_USER}:${NITRO_DATABASE_RESULTS_PASSWORD}@${NITRO_DATABASE_RESULTS_HOST}:${NITRO_DATABASE_RESULTS_PORT}/${NITRO_DATABASE_RESULTS_DB}`;

export default defineConfig({
	out: "./server/db/migrations",
	schema: "./server/db/schema/results/index.ts",
	dialect: "postgresql",
	dbCredentials: { url, ssl },
});
