import { defineConfig } from "drizzle-kit";

/**
 * This is used by drizzle-kit to work with the results-database, aka
 * create migrations and run them. The osm-sync database is built and
 * managed by imposm.
 */

// drizzle-kit is not picking up aliases, so keep this import relative
import { RESULTS_DATABASE_URL } from "./server/utils/env";

export default defineConfig({
	out: "./server/db/migrations",
	schema: "./server/db/schema/results/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: RESULTS_DATABASE_URL,
	},
});
