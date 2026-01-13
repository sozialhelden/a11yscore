import { sql } from "drizzle-orm";
import { osm_platforms, osm_stations } from "~/db/schema/osm-sync";
import { t } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type PublicTransportTopLevelCategoryId = "public-transport";
export const publicTransportTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<PublicTransportTopLevelCategoryId, Omit<TopLevelCategory, "id">> =
  ({ weight }) => ({
    "public-transport": {
      name: () => t("Public Transport"),
      sustainableDevelopmentGoals: [9, 13, 15, 16],
      weight,
      interpretation: (score) => {
        if (score >= 75)
          return t("Most of the transport stops are accessible.");
        if (score >= 50)
          return t("Many of the transport stops are accessible.");
        if (score >= 30)
          return t("Some of the transport stops are accessible.");
        if (score > 0)
          return t("Only a few of the transport stops are accessible.");

        return t("The score could not be determined due to missing data.");
      },
      description: () =>
        t(
          "This category includes transit hubs and boarding points, including platforms and stations for buses, trains, trams, subways, light rail, and ferries.",
        ),
    },
  });

/*
 * sub categories
 */

// the mapping.yaml maps public_transport=platform, highway=platform, railway=platform into the platforms table,
// but we only want the public_transport=platform ones here since the railway and highway schemas are outdated,
// lesser tagged and more than 90% of them are also tagged with public_transport=platform

// public_transport=station, railway: [station, halt], amenity=bus_station are mapped into the stations table
// but we only want those with public_transport=station here for the same reason as above

// we omit trolleybusses since 78% of them are tagged together with bus=yes

// TODO: airports and ferries

const genericPlatformTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 1,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "hearing",
    criteria: [
      {
        criterionId: "is-accessible-to-hearing-impaired",
        weight: 1,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 0.1,
        reason: () => "",
      },
      {
        criterionId: "has-tactile-paving",
        weight: 0.35,
        reason: () => "",
      },
      {
        criterionId: "has-information-board-with-speech-output",
        weight: 0.35,
        reason: () => "",
      },
      {
        criterionId: "has-tactile-writing",
        weight: 0.2,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "general-assistance",
    criteria: [
      {
        criterionId: "has-bench",
        weight: 1 / 3,
        reason: () => "",
      },
      {
        criterionId: "is-lit",
        weight: 1 / 3,
        reason: () => "",
      },
      {
        criterionId: "has-shelter",
        weight: 1 / 3,
        reason: () => "",
      },
    ],
  },
];
const subwayTopics: SubCategory["topics"] = [
  ...genericPlatformTopics.filter(
    (topic) => topic.topicId !== "general-assistance",
  ),
  {
    topicId: "general-assistance",
    criteria: [
      {
        criterionId: "has-bench",
        weight: 1,
        reason: () => "",
      },
    ],
  },
];

export type PublicTransportSubCategoryId =
  | "bus-platforms"
  | "tram-platforms"
  | "subway-platforms"
  | "train-platforms"
  | "ferry-platforms"
  | "light-rail-platforms"
  | "bus-stations"
  | "tram-stations"
  | "subway-stations"
  | "train-stations"
  | "ferry-stations"
  | "light-rail-stations";
//  | "aerialway-stations";

const weight = 1 / 12;

export const publicTransportSubCategories: Record<
  PublicTransportSubCategoryId,
  Omit<SubCategory, "id">
> = {
  "bus-platforms": {
    name: () => t("Bus Platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "bus", value: "yes" },
    ],
    description: () =>
      t(
        "Includes bus platforms, the places where passengers board or alight from buses.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.bus} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "tram-platforms": {
    name: () => t("Tram Platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "tram", value: "yes" },
    ],
    description: () =>
      t(
        "Includes tram platforms, the places where passengers board or alight from trams.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.tram} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "subway-platforms": {
    name: () => t("Subway Platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "subway", value: "yes" },
    ],
    description: () =>
      t(
        "Includes subway platforms, the places where passengers board or alight from subways cars.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.subway} = 'yes'`,
    },
    topics: subwayTopics,
  },
  "train-platforms": {
    name: () => t("Train platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "train", value: "yes" },
    ],
    description: () =>
      t(
        "Includes train platforms, the places where passengers board or alight from trains.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.train} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "ferry-platforms": {
    name: () => t("Ferry platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "ferry", value: "yes" },
    ],
    description: () =>
      t(
        "Includes ferry platforms, the places where passengers board or alight from ferries.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.ferry} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "light-rail-platforms": {
    name: () => t("Light Rail platforms"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "platform" },
      { key: "light_rail", value: "yes" },
    ],
    description: () =>
      t(
        "Includes light rail platforms, the places where passengers board or alight from light rail trains.",
      ),
    sql: {
      from: osm_platforms,
      where: sql`${osm_platforms.public_transport} = 'platform' and ${osm_platforms.light_rail} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },

  "bus-stations": {
    name: () => t("Bus stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "bus", value: "yes" },
    ],
    description: () =>
      t(
        "Bus stations are larger transport hubs where passengers can board or alight from buses, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.bus} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "tram-stations": {
    name: () => t("Tram stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "tram", value: "yes" },
    ],
    description: () =>
      t(
        "Tram stations are larger transport hubs where passengers can board or alight from trams, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.tram} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "subway-stations": {
    name: () => t("Subway stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "subway", value: "yes" },
    ],
    description: () =>
      t(
        "Subway stations are larger transport hubs where passengers can board or alight from subway cars, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.subway} = 'yes'`,
    },
    topics: subwayTopics,
  },
  "train-stations": {
    name: () => t("Train stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "train", value: "yes" },
    ],
    description: () =>
      t(
        "Train stations are larger transport hubs where passengers can board or alight from trains, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.train} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "ferry-stations": {
    name: () => t("Ferry stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "ferry", value: "yes" },
    ],
    description: () =>
      t(
        "Ferry stations are larger transport hubs where passengers can board or alight from ferries, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.ferry} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
  "light-rail-stations": {
    name: () => t("Light Rail stations"),
    parent: "public-transport",
    weight: weight,
    osmTags: [
      { key: "public_transport", value: "station" },
      { key: "light_rail", value: "yes" },
    ],
    description: () =>
      t(
        "Light rail stations are larger transport hubs where passengers can board or alight from light rail, often featuring multiple platforms and additional amenities.",
      ),
    sql: {
      from: osm_stations,
      where: sql`${osm_stations.public_transport} = 'station' and ${osm_stations.light_rail} = 'yes'`,
    },
    topics: genericPlatformTopics,
  },
};
