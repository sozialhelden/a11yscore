import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "~/utils/env";
import * as schema from "./schema";

export const db = drizzle({
	connection: DATABASE_URL,
	schema,
});
