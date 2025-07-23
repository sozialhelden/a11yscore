import { defineConfig } from "drizzle-kit";

// drizzle-kit is not picking up aliases, so keep this import relative
import { DATABASE_URL } from "./server/utils/env";

export default defineConfig({
	out: "./server/db/migrations",
	schema: "./server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL,
	},
});
