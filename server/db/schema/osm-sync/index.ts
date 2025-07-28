import { integer, pgTable } from "drizzle-orm/pg-core";

export const osm_amenities = pgTable("osm_amenities", {
	id: integer().notNull().primaryKey(),
});
