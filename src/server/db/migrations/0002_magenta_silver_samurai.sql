CREATE TABLE "admin_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"osm_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"hash" varchar NOT NULL,
	"wikidata" varchar,
	CONSTRAINT "admin_areas_osm_id_unique" UNIQUE("osm_id")
);
