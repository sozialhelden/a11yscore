-- -------------------------------------------------------------
-- TablePlus 5.9.0(538)
--
-- https://tableplus.com/
--
-- Database: imposm
-- Generation Time: 2026-01-19 15:50:56.4380
-- -------------------------------------------------------------

CREATE EXTENSION hstore;

DROP TABLE IF EXISTS "public"."internal_api_access_tokens";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS internal_api_access_tokens_id_seq;

-- Table Definition
CREATE TABLE "public"."internal_api_access_tokens" (
    "id" int4 NOT NULL DEFAULT nextval('internal_api_access_tokens_id_seq'::regclass),
    "access_token" text NOT NULL,
    "api_response" jsonb,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."osm_admin";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_admin_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_admin" (
    "id" int4 NOT NULL DEFAULT nextval('osm_admin_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "type" varchar,
    "admin_level" int4,
    "cc2" varchar,
    "cc3" varchar,
    "ccnum" int4,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "area" float4,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_admin_gen0";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."osm_admin_gen0" (
    "osm_id" int8,
    "type" varchar,
    "admin_level" int4,
    "cc2" varchar,
    "cc3" varchar,
    "ccnum" int4,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "area" float4,
    "tags" hstore,
    "geometry" geometry
);

DROP TABLE IF EXISTS "public"."osm_admin_gen1";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Table Definition
CREATE TABLE "public"."osm_admin_gen1" (
    "osm_id" int8,
    "type" varchar,
    "admin_level" int4,
    "cc2" varchar,
    "cc3" varchar,
    "ccnum" int4,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "area" float4,
    "tags" hstore,
    "geometry" geometry
);

DROP TABLE IF EXISTS "public"."osm_amenities";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_amenities_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_amenities" (
    "id" int4 NOT NULL DEFAULT nextval('osm_amenities_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "mapping_key" varchar,
    "mapping_value" varchar,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "wheelchair" varchar,
    "toilets:wheelchair" varchar,
    "wheelchair:description" varchar,
    "access" varchar,
    "barrier" varchar,
    "building" varchar,
    "building:part" varchar,
    "building:colour" varchar,
    "building:max_level" varchar,
    "building:min_level" varchar,
    "max_level" varchar,
    "min_level" varchar,
    "building:flats" varchar,
    "building:levels" varchar,
    "description" varchar,
    "indoor" varchar,
    "information" varchar,
    "level" varchar,
    "location" varchar,
    "reservation" varchar,
    "room" varchar,
    "ref" varchar,
    "ref:IFOPT" varchar,
    "gtfs:stop_id" varchar,
    "gtfs:feed" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "social_facility" varchar,
    "toilet" varchar,
    "toilets" varchar,
    "unisex" varchar,
    "community_centre" varchar,
    "healthcare" varchar,
    "healthcare:speciality" varchar,
    "amenity" varchar,
    "shop" varchar,
    "attraction" varchar,
    "leisure" varchar,
    "sport" varchar,
    "tourism" varchar,
    "playground" varchar,
    "vending" varchar,
    "office" varchar,
    "school" varchar,
    "highway" varchar,
    "man_made" varchar,
    "landuse" varchar,
    "parking" varchar,
    "public_transport" varchar,
    "area" float4,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_buildings";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_buildings_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_buildings" (
    "id" int4 NOT NULL DEFAULT nextval('osm_buildings_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "building" varchar,
    "name" varchar,
    "wheelchair" varchar,
    "wheelchair_toilet" varchar,
    "toilets:wheelchair" varchar,
    "wikidata" varchar,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_conveying";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_conveying_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_conveying" (
    "id" int4 NOT NULL DEFAULT nextval('osm_conveying_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "incline" varchar,
    "conveying" varchar,
    "width" varchar,
    "highway" varchar,
    "level" varchar,
    "indoor" varchar,
    "name" varchar,
    "ref" varchar,
    "operator" varchar,
    "manufacturer" varchar,
    "tunnel" int2,
    "bridge" int2,
    "oneway" int2,
    "z_order" int4,
    "tags" hstore,
    "geometry" geometry(LineString,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_elevators";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_elevators_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_elevators" (
    "id" int4 NOT NULL DEFAULT nextval('osm_elevators_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "name" varchar,
    "ref" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "access" varchar,
    "automatic_door" varchar,
    "barrier" varchar,
    "bicycle" varchar,
    "brand" varchar,
    "building" varchar,
    "building_levels" varchar,
    "capacity_persons" varchar,
    "contact_email" varchar,
    "contact_phone" varchar,
    "contact_website" varchar,
    "door" varchar,
    "elevator" varchar,
    "entrance" varchar,
    "exit" varchar,
    "foot" varchar,
    "free" varchar,
    "goods" varchar,
    "handrail" varchar,
    "highway" varchar,
    "indoor" varchar,
    "level" varchar,
    "manufacturer" varchar,
    "maxweight" varchar,
    "operator" varchar,
    "source" varchar,
    "start_date" varchar,
    "wheelchair" varchar,
    "width" varchar,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_entrances_or_exits";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_entrances_or_exits_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_entrances_or_exits" (
    "id" int4 NOT NULL DEFAULT nextval('osm_entrances_or_exits_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "ref" varchar,
    "wikidata" varchar,
    "name" varchar,
    "entrance" varchar,
    "public_transport" varchar,
    "exit" varchar,
    "access" varchar,
    "level" varchar,
    "highway" varchar,
    "elevator" varchar,
    "door" varchar,
    "width" varchar,
    "barrier" varchar,
    "ramp" varchar,
    "ramp_wheelchair" varchar,
    "wheelchair" varchar,
    "automatic_door" varchar,
    "tags" hstore,
    "geometry" geometry(Point,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_master_route_members";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_master_route_members_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_master_route_members" (
    "id" int4 NOT NULL DEFAULT nextval('osm_master_route_members_id_seq'::regclass),
    "relation_id" int8 NOT NULL,
    "member_id" int8,
    "index" int4,
    "role" varchar,
    "type" int2,
    "route_master" varchar,
    "tags" hstore,
    "wikidata" varchar,
    "wikipedia" varchar,
    "public_transport:version" varchar,
    PRIMARY KEY ("relation_id","id")
);

DROP TABLE IF EXISTS "public"."osm_master_routes";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_master_routes_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_master_routes" (
    "id" int4 NOT NULL DEFAULT nextval('osm_master_routes_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "route_master" varchar,
    "rel_name" varchar,
    "line" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "ref" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "colour" varchar,
    "tourism" varchar,
    "school" varchar,
    "wheelchair" varchar,
    "tags" hstore,
    "public_transport:version" varchar,
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_pedestrian_highways";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_pedestrian_highways_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_pedestrian_highways" (
    "id" int4 NOT NULL DEFAULT nextval('osm_pedestrian_highways_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "mapping_key" varchar,
    "mapping_value" varchar,
    "access" varchar,
    "ref" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "automatic_door" varchar,
    "barrier" varchar,
    "bicycle" varchar,
    "bridge" varchar,
    "building_levels" varchar,
    "building" varchar,
    "capacity_persons" varchar,
    "conveying" varchar,
    "door" varchar,
    "elevator" varchar,
    "entrance" varchar,
    "exit" varchar,
    "foot" varchar,
    "footway" varchar,
    "free" varchar,
    "goods" varchar,
    "handrail_right" varchar,
    "handrail_left" varchar,
    "handrail_center" varchar,
    "handrail" varchar,
    "highway" varchar,
    "incline" varchar,
    "indoor" varchar,
    "kerb" varchar,
    "layer" varchar,
    "level" varchar,
    "man_made" varchar,
    "maxheight" varchar,
    "maxlength" varchar,
    "maxweight" varchar,
    "maxwidth" varchar,
    "name" varchar,
    "opening_hours" varchar,
    "ramp_wheelchair" varchar,
    "ramp" varchar,
    "repeat_on" varchar,
    "restriction" varchar,
    "segregated" varchar,
    "shoulder" varchar,
    "sidewalk" varchar,
    "smoothness" varchar,
    "surface" varchar,
    "steps" varchar,
    "step_count" varchar,
    "tactile_paving" varchar,
    "tunnel" varchar,
    "wheelchair" varchar,
    "tracktype" varchar,
    "width" varchar,
    "wheelchair:description" varchar,
    "blind:description" varchar,
    "deaf:description" varchar,
    "wheelchair:description:en" varchar,
    "blind:description:en" varchar,
    "deaf:description:en" varchar,
    "wheelchair:description:de" varchar,
    "blind:description:de" varchar,
    "deaf:description:de" varchar,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_places";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_places_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_places" (
    "id" int4 NOT NULL DEFAULT nextval('osm_places_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "mapping_value" varchar,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "area" float4,
    "z_order" int4,
    "population" int4,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_platforms";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_platforms_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_platforms" (
    "id" int4 NOT NULL DEFAULT nextval('osm_platforms_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "ref" varchar,
    "name" varchar,
    "public_transport" varchar,
    "railway" varchar,
    "highway" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "gtfs:feed" varchar,
    "gtfs:stop_id" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "ref:IFOPT" varchar,
    "bench" bool,
    "covered" bool,
    "departures_board" varchar,
    "layer" varchar,
    "level" varchar,
    "shelter" bool,
    "surface" varchar,
    "tactile_paving" varchar,
    "wheelchair" varchar,
    "width" varchar,
    "aerialway" varchar,
    "bus" varchar,
    "ferry" varchar,
    "light_rail" varchar,
    "monorail" varchar,
    "subway" varchar,
    "train" varchar,
    "tram" varchar,
    "trolleybus" varchar,
    "public_transport:version" varchar,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_ramps";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_ramps_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_ramps" (
    "id" int4 NOT NULL DEFAULT nextval('osm_ramps_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "mapping_key" varchar,
    "mapping_value" varchar,
    "incline" varchar,
    "step_count" varchar,
    "name" varchar,
    "ref" varchar,
    "entrance" varchar,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_route_members";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_route_members_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_route_members" (
    "id" int4 NOT NULL DEFAULT nextval('osm_route_members_id_seq'::regclass),
    "relation_id" int8 NOT NULL,
    "member_id" int8,
    "index" int4,
    "role" varchar,
    "type" int2,
    "route" varchar,
    "public_transport:version" varchar,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("relation_id","id")
);

DROP TABLE IF EXISTS "public"."osm_routes";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_routes_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_routes" (
    "id" int4 NOT NULL DEFAULT nextval('osm_routes_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "route" varchar,
    "name" varchar,
    "ref" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "state" varchar,
    "symbol" varchar,
    "description" varchar,
    "distance" varchar,
    "roundtrip" bool,
    "tourism" bool,
    "interval" varchar,
    "duration" varchar,
    "colour" varchar,
    "tags" hstore,
    "public_transport:version" varchar,
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_stations";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_stations_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_stations" (
    "id" int4 NOT NULL DEFAULT nextval('osm_stations_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "name" varchar,
    "railway" varchar,
    "amenity" varchar,
    "public_transport" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "ref" varchar,
    "ref:IFOPT" varchar,
    "gtfs:stop_id" varchar,
    "gtfs:feed" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "aerialway" varchar,
    "bench" varchar,
    "bus" varchar,
    "covered" varchar,
    "ferry" varchar,
    "light_rail" varchar,
    "monorail" varchar,
    "shelter" varchar,
    "subway" varchar,
    "train" varchar,
    "tram" varchar,
    "trolleybus" varchar,
    "access" varchar,
    "building" varchar,
    "departures_board" varchar,
    "layer" varchar,
    "level" varchar,
    "surface" varchar,
    "wheelchair" varchar,
    "tags" hstore,
    "public_transport:version" varchar,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_stop_area_members";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_stop_area_members_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_stop_area_members" (
    "id" int4 NOT NULL DEFAULT nextval('osm_stop_area_members_id_seq'::regclass),
    "relation_id" int8 NOT NULL,
    "member_id" int8,
    "index" int4,
    "role" varchar,
    "type" int2,
    "public_transport:version" varchar,
    "tags" hstore,
    "member_tags" hstore,
    PRIMARY KEY ("relation_id","id")
);

DROP TABLE IF EXISTS "public"."osm_stop_areas";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_stop_areas_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_stop_areas" (
    "id" int4 NOT NULL DEFAULT nextval('osm_stop_areas_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "name" varchar,
    "ref" varchar,
    "gtfs:feed" varchar,
    "gtfs:stop_id" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "ref:IFOPT" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "public_transport:version" varchar,
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_stop_positions";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_stop_positions_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_stop_positions" (
    "id" int4 NOT NULL DEFAULT nextval('osm_stop_positions_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "public_transport" varchar,
    "highway" varchar,
    "railway" varchar,
    "operator" varchar,
    "operator:guid" varchar,
    "operator:wikidata" varchar,
    "operator:wikipedia" varchar,
    "name" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "ref" varchar,
    "local_ref" varchar,
    "route_ref" varchar,
    "ref:IFOPT" varchar,
    "gtfs:stop_id" varchar,
    "gtfs:feed" varchar,
    "network" varchar,
    "network:guid" varchar,
    "network:wikidata" varchar,
    "network:wikipedia" varchar,
    "aerialway" varchar,
    "bus" varchar,
    "ferry" varchar,
    "light_rail" varchar,
    "monorail" varchar,
    "subway" varchar,
    "train" varchar,
    "tram" varchar,
    "trolleybus" varchar,
    "platform" varchar,
    "surface" varchar,
    "stop" varchar,
    "tactile_paving" varchar,
    "wheelchair" varchar,
    "departures_board" varchar,
    "bench" varchar,
    "shelter" varchar,
    "tags" hstore,
    "public_transport:version" varchar,
    "geometry" geometry(Point,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_toilets";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_toilets_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_toilets" (
    "id" int4 NOT NULL DEFAULT nextval('osm_toilets_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "mapping_key" varchar,
    "mapping_value" varchar,
    "name" varchar,
    "wheelchair_toilet" varchar,
    "position" varchar,
    "toilets:wheelchair" varchar,
    "toilets:position" varchar,
    "wikidata" varchar,
    "wikipedia" varchar,
    "access" varchar,
    "fee" varchar,
    "indoor" varchar,
    "wheelchair" varchar,
    "unisex" bool,
    "male" bool,
    "female" bool,
    "tags" hstore,
    "geometry" geometry(Geometry,3857),
    PRIMARY KEY ("osm_id","id")
);

DROP TABLE IF EXISTS "public"."osm_traffic_signals";
-- This script only contains the table creation statements and does not fully represent the table in the database. It's still missing: indices, triggers. Do not use it as a backup.

-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS osm_traffic_signals_id_seq;

-- Table Definition
CREATE TABLE "public"."osm_traffic_signals" (
    "id" int4 NOT NULL DEFAULT nextval('osm_traffic_signals_id_seq'::regclass),
    "osm_id" int8 NOT NULL,
    "button_operated" varchar,
    "red_turn:right" varchar,
    "bicycle" varchar,
    "ref" varchar,
    "traffic_signals:sound" varchar,
    "red_turn:right:bicycle" varchar,
    "traffic_signals:direction" varchar,
    "traffic_signals:countdown" varchar,
    "traffic_signals:vibration" varchar,
    "traffic_signals:arrow" varchar,
    "traffic_signals:minimap" varchar,
    "traffic_signals:floor_vibration" varchar,
    "traffic_signals:floor_light" varchar,
    "tags" hstore,
    "geometry" geometry(Point,3857),
    PRIMARY KEY ("osm_id","id")
);

