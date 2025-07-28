import { pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const results = pgTable("results", {
	id: serial().primaryKey(),
	created: timestamp({ mode: "date" }).defaultNow(),
});
