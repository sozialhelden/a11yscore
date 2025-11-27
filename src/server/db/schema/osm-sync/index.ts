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
  shop: varchar(),
  geometry: geometry().notNull(),
  smoking: varchar(),
  tags: jsonb().notNull(),
  wheelchair: varchar(),
  healthcare: varchar(),
  "toilets:wheelchair": varchar(),
});

export const osm_platforms = pgTable("osm_platforms", {
  id: integer().notNull().primaryKey(),
  public_transport: varchar(),
  geometry: geometry().notNull(),
  tags: jsonb().notNull(),
  bus: varchar(),
  tram: varchar(),
  ferry: varchar(),
  light_rail: varchar(),
  subway: varchar(),
  train: varchar(),
  trolleybus: varchar(),
  aerialway: varchar(),
  wheelchair: varchar(),
});

export const osm_stations = pgTable("osm_stations", {
  id: integer().notNull().primaryKey(),
  public_transport: varchar(),
  geometry: geometry().notNull(),
  tags: jsonb().notNull(),
  bus: varchar(),
  tram: varchar(),
  ferry: varchar(),
  light_rail: varchar(),
  subway: varchar(),
  train: varchar(),
  trolleybus: varchar(),
  aerialway: varchar(),
  wheelchair: varchar(),
});

export const osm_admin = pgTable("osm_admin", {
  osm_id: integer().notNull(),
  name: varchar().notNull(),
  admin_level: integer().notNull(),
  wikidata: varchar().notNull(),
  geometry: geometry().notNull(),
});

export const osm_admin_gen0 = pgTable("osm_admin_gen0", {
  osm_id: integer().notNull(),
  geometry: geometry().notNull(),
});
