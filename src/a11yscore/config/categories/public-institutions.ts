import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import type { Translate } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type PublicInstitutionsTopLevelCategoryId = "public-institutions";
export const getPublicInstitutionsTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<
  PublicInstitutionsTopLevelCategoryId,
  Omit<TopLevelCategory, "id">
> => ({
  "public-institutions": {
    name: t("Public Institutions"),
    sustainableDevelopmentGoals: [8, 5, 10, 11, 16, 17],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the public institutions are accessible.");
      if (score >= 50)
        return t("Many of the public institutions are accessible.");
      if (score >= 30)
        return t("Some of the public institutions are accessible.");
      if (score > 0)
        return t("Only a few of the public institutions are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "This category evaluates the accessibility of public institutions, including townhalls, government offices, police stations, courts and consulates.",
    ),
    planned: false,
  },
});

const genericPublicInstitutionsTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 0.5,
      },
      {
        criterionId: "has-wheelchair-accessible-toilet",
        weight: 0.5,
      },
    ],
  },
  {
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 0.25,
      },
      {
        criterionId: "has-tactile-paving",
        weight: 0.25,
      },
      {
        criterionId: "has-information-board-with-speech-output",
        weight: 0.25,
      },
      {
        criterionId: "has-tactile-writing",
        weight: 0.25,
      },
    ],
  },
  {
    topicId: "hearing",
    criteria: [
      {
        criterionId: "is-accessible-to-hearing-impaired",
        weight: 1,
      },
    ],
  },
  {
    topicId: "general-assistance",
    criteria: [
      {
        criterionId: "has-website",
        weight: 1,
      },
    ],
  },
  {
    topicId: "air-and-climate",
    criteria: [
      {
        criterionId: "has-air-conditioning",
        weight: 1,
      },
    ],
  },
];

export type PublicInstitutionsSubCategoryId =
  | "townhalls"
  | "consulates-embassies"
  | "police-stations"
  | "courts"
  | "government-offices";

const weight = 1 / 5;

export const getPublicInstitutionsSubCategories = (
  t: Translate,
): Record<PublicInstitutionsSubCategoryId, Omit<SubCategory, "id">> => ({
  townhalls: {
    name: t("Townhalls"),
    parent: "public-institutions",
    weight: weight,
    osmTags: [{ key: "amenity", value: "townhall" }],
    description: t(
      "Townhalls are the administrative centers of municipalities. They provide various public services and administrative functions.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'townhall'`,
    },
    topics: genericPublicInstitutionsTopics,
  },
  "consulates-embassies": {
    name: t("Consulates and Embassies"),
    parent: "public-institutions",
    weight: weight,
    osmTags: [{ key: "office", value: "diplomatic" }],
    description: t(
      "Consulates and embassies represent foreign governments and provide services to their citizens and conduct diplomatic relations.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'office' = 'diplomatic'`,
    },
    topics: genericPublicInstitutionsTopics,
  },
  "police-stations": {
    name: t("Police Stations"),
    parent: "public-institutions",
    weight: weight,
    osmTags: [{ key: "amenity", value: "police" }],
    description: t(
      "Police stations are facilities where law enforcement officers work and provide public safety services and support.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'police'`,
    },
    topics: genericPublicInstitutionsTopics,
  },
  courts: {
    name: t("Courts"),
    parent: "public-institutions",
    weight: weight,
    osmTags: [{ key: "amenity", value: "courthouse" }],
    description: t(
      "Courts are judicial facilities where legal proceedings take place and justice is administered.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'courthouse'`,
    },
    topics: genericPublicInstitutionsTopics,
  },
  "government-offices": {
    name: t("Government Offices"),
    parent: "public-institutions",
    weight: weight,
    osmTags: [{ key: "office", value: "government" }],
    description: t(
      "Government offices include tax authorities, citizen offices, immigration offices, parliaments and other administrative institutions providing public services.",
    ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'office' = 'government'`,
    },
    topics: genericPublicInstitutionsTopics,
  },
});
