import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import { t } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type SocialCareTopLevelCategoryId = "social-care";
export const socialCareTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<SocialCareTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  "social-care": {
    name: () => t("Social Care"),
    sustainableDevelopmentGoals: [1, 2, 3, 5, 10, 11, 16],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the social care facilities are accessible.");
      if (score >= 50)
        return t("Many of the social care facilities are accessible.");
      if (score >= 30)
        return t("Some of the social care facilities are accessible.");
      if (score > 0)
        return t("Only a few of the social care facilities are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "The overall score for social care facilities is calculated based on the scores of these subcategories:",
    ),
  },
});

/*
 * sub categories
 */

const genericSocialCareTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 0.8,
      },
      {
        criterionId: "has-wheelchair-accessible-toilet",
        weight: 0.2,
      },
    ],
  },
  {
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 1,
      },
    ],
  },
  {
    topicId: "toilet",
    criteria: [
      {
        criterionId: "has-toilet",
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
];

export type SocialCareSubCategoryId =
  | "community-centers"
  | "counselling-services"
  | "ambulatory-services"
  | "senior-facilities"
  | "child-youth-facilities"
  | "disabled-facilities"
  | "refugee-accommodations"
  | "women-mother-shelters"
  | "queer-facilities"
  | "addiction-facilities"
  | "clothing-banks"
  | "charity-shops"
  | "soup-kitchens-food-banks";

const weight = 1 / 13;

export const socialCareSubCategories: Record<
  SocialCareSubCategoryId,
  Omit<SubCategory, "id">
> = {
  "community-centers": {
    name: () => t("Community Centers"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "amenity", value: "community_centre" },
      { key: "amenity", value: "social_centre" },
      { key: "social_facility:for", value: "community" },
    ],
    description: () => t("Includes community centers and social centers."),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'community_centre'`,
          sql`${osm_amenities.amenity} = 'social_centre'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'community'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "counselling-services": {
    name: () => t("Counselling Services and Social Support"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "healthcare", value: "counselling" },
      { key: "healthcare:counselling", value: "addiction" },
      { key: "healthcare:counselling", value: "family" },
      { key: "social_facility:for", value: "family" },
    ],
    description: () =>
      t(
        "Includes non-medical counselling such as family and addiction counselling.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'healthcare' = 'counselling'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'addiction'`,
          sql`${osm_amenities.tags}->'healthcare:counselling' = 'family'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'family'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "ambulatory-services": {
    name: () => t("Ambulatory Service Offices"),
    parent: "social-care",
    weight: weight,
    osmTags: [{ key: "social_facility", value: "ambulatory_care" }],
    description: () =>
      t(
        "Includes offices providing ambulatory social services and mobile care.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility' = 'ambulatory_care'`,
    },
    topics: genericSocialCareTopics,
  },
  "senior-facilities": {
    name: () => t("Senior Facilities"),
    parent: "social-care",
    weight: weight,
    osmTags: [{ key: "social_facility:for", value: "senior" }],
    description: () =>
      t(
        "Includes facilities for seniors such as residential groups, nursing homes, assisted living, and day care.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility:for' = 'senior'`,
    },
    topics: genericSocialCareTopics,
  },
  "child-youth-facilities": {
    name: () => t("Child and Youth Facilities"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility:for", value: "juvenile" },
      { key: "social_facility:for", value: "child;juvenile" },
      { key: "social_facility:for", value: "child" },
      { key: "social_facility:for", value: "children" },
      { key: "social_facility:for", value: "youth" },
      { key: "social_facility:for", value: "orphan" },
    ],
    description: () =>
      t(
        "Includes facilities for children and youth such as residential groups, orphanages, shelters, and social work organizations.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'social_facility:for' = 'juvenile'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'child;juvenile'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'child'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'children'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'youth'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'orphan'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "disabled-facilities": {
    name: () => t("Facilities for People with Disabilities"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility:for", value: "disabled" },
      { key: "social_facility:for", value: "mental_health" },
    ],
    description: () =>
      t(
        "Includes facilities for people with disabilities such as residential groups, nursing homes, assisted living, day care, and workshops for people with disabilities.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'social_facility:for' = 'disabled'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'mental_health'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "refugee-accommodations": {
    name: () => t("Accommodations for Refugees and Migrants"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility", value: "shelter" },
      { key: "social_facility:for", value: "refugees" },
      { key: "social_facility:for", value: "refugee" },
      { key: "social_facility:for", value: "migrant" },
      { key: "social_facility:for", value: "migrants" },
      { key: "social_facility:for", value: "refugees, migrants" },
      { key: "social_facility:for", value: "refugees,migrants,immigrants" },
      { key: "social_facility:for", value: "migrants;refugees" },
      { key: "social_facility:for", value: "displaced" },
    ],
    description: () =>
      t("Includes shelters and accommodations for refugees and immigrants."),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility' = 'shelter'
      AND (${sql.join(
        [
          sql`${osm_amenities.tags}->'social_facility:for' = 'refugees'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'refugee'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'migrant'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'migrants'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'refugees, migrants'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'refugees,migrants,immigrants'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'migrants;refugees'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'displaced'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "women-mother-shelters": {
    name: () => t("Shelters for Women and Mothers"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility", value: "shelter" },
      { key: "social_facility:for", value: "Women" },
      { key: "social_facility:for", value: "women" },
      { key: "social_facility:for", value: "woman" },
      { key: "social_facility:for", value: "woman;child" },
      { key: "social_facility:for", value: "child;woman" },
      { key: "social_facility:for", value: "child;women" },
      { key: "social_facility:for", value: "women;child" },
      { key: "social_facility:for", value: "women;children" },
    ],
    description: () =>
      t(
        "Includes shelters and accommodations for women, mothers, and their children.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility' = 'shelter'
      AND (${sql.join(
        [
          sql`${osm_amenities.tags}->'social_facility:for' = 'Women'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'women'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'woman'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'woman;child'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'child;woman'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'child;women'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'women;child'`,
          sql`${osm_amenities.tags}->'social_facility:for' = 'women;children'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "queer-facilities": {
    name: () => t("Facilities for Queer People"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility:for", value: "lgbtq" },
      // { key: "social_facility:for", value: "women,lgbtq" },
      // { key: "social_facility:for", value: "women;LGBTI" },
    ],
    description: () =>
      t(
        "Includes facilities and services specifically for queer people, such as LGBTQ+ communities.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.tags}->'social_facility:for' = 'lgbtq'`,
          // sql`${osm_amenities.tags}->'social_facility:for' = 'women,lgbtq'`,
          // sql`${osm_amenities.tags}->'social_facility:for' = 'women;LGBTI'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericSocialCareTopics,
  },
  "addiction-facilities": {
    name: () => t("Facilities for People with Addiction Problems"),
    parent: "social-care",
    weight: weight,
    osmTags: [{ key: "social_facility:for", value: "drug_addicted" }],
    description: () =>
      t(
        "Includes facilities for people with addiction issues, such as addiction counseling, rehabilitation, and support centers.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility:for' = 'drug_addicted'`,
    },
    topics: genericSocialCareTopics,
  },
  "clothing-banks": {
    name: () => t("Clothing Banks"),
    parent: "social-care",
    weight: weight,
    osmTags: [{ key: "social_facility", value: "clothing_bank" }],
    description: () =>
      t(
        "Includes clothing banks where people in need can receive free or low-cost clothing.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility' = 'clothing_bank'`,
    },
    topics: genericSocialCareTopics,
  },
  "charity-shops": {
    name: () => t("Charity Shops"),
    parent: "social-care",
    weight: weight,
    osmTags: [{ key: "shop", value: "charity" }],
    description: () =>
      t(
        "Includes charity shops offering affordable clothing, household goods, and other items.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'shop' = 'charity'`,
    },
    topics: genericSocialCareTopics,
  },
  "soup-kitchens-food-banks": {
    name: () => t("Food Banks and Soup Kitchens"),
    parent: "social-care",
    weight: weight,
    osmTags: [
      { key: "social_facility", value: "soup_kitchen" },
      { key: "social_facility", value: "food_bank" },
    ],
    description: () =>
      t(
        "Includes soup kitchens and food banks providing meals or food support to people in need.",
      ),
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'social_facility' = 'soup_kitchen' or ${osm_amenities.tags}->'social_facility' = 'food_bank'`,
    },
    topics: genericSocialCareTopics,
  },
};
