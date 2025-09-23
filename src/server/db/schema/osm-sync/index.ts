import {
  geometry,
  integer,
  jsonb,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

export const osm_amenities = pgTable("osm_amenities", {
  id: integer().notNull().primaryKey(),
  amenity: varchar(),
  geometry: geometry().notNull(),
  smoking: varchar(),
  tags: jsonb().notNull(),
  wheelchair: varchar(),
  "toilets:wheelchair": varchar(),
});

export const osm_admin = pgTable("osm_admin", {
  osm_id: integer().notNull(),
  name: varchar().notNull(),
  geometry: geometry().notNull(),
});
