import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import { t } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/score/categories/index";

/*
 * top-level category
 */

export type FoodAndDrinksTopLevelCategoryId = "food-and-drinks";
export const foodAndDrinksTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<FoodAndDrinksTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  "food-and-drinks": {
    name: () => t("Food and Drinks"),
    sustainableDevelopmentGoals: [2, 12, 13, 14],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the establishments and shops are accessible.");
      if (score >= 50)
        return t("Many of the establishments and shops are accessible.");
      if (score >= 30)
        return t("Some of the establishments and shops are accessible.");
      if (score > 0)
        return t("Only a few of the establishments and shops are accessible.");

      return t("The score could not be determined due to missing data.");
    },
  },
});

/*
 * sub categories
 */

const genericGastronomyTopics: SubCategory["topics"] = [
  {
    topicId: "mobility",
    criteria: [
      {
        criterionId: "is-wheelchair-accessible",
        weight: 0.8,
        reason: () => "",
      },
      {
        criterionId: "has-wheelchair-accessible-toilet",
        weight: 0.2,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 0.8,
        reason: () => "",
      },
      {
        criterionId: "has-menu-on-website",
        weight: 0.2,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "toilet",
    criteria: [
      {
        criterionId: "has-toilet",
        weight: 1,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "neurodivergent",
    criteria: [
      {
        criterionId: "has-quiet-hours",
        weight: 1,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "air-and-climate",
    criteria: [
      {
        criterionId: "smoking-is-prohibited",
        weight: 0.7,
        reason: () => "",
      },
      {
        criterionId: "has-air-conditioning",
        weight: 0.3,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "hearing",
    criteria: [
      {
        criterionId: "is-accessible-to-hearing-impaired",
        weight: 0.7,
        reason: () => "",
      },
      {
        criterionId: "reservation-via-website",
        weight: 0.3,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "general-assistance",
    criteria: [
      {
        criterionId: "has-drinking-straws",
        weight: 1,
        reason: () => "",
      },
    ],
  },
];

const genericShopTopics: SubCategory["topics"] = [
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
    topicId: "vision",
    criteria: [
      {
        criterionId: "is-accessible-to-visually-impaired",
        weight: 0.6,
        reason: () => "",
      },
      {
        criterionId: "has-menu-on-website",
        weight: 0.2,
        reason: () => "",
      },
      {
        criterionId: "has-website",
        weight: 0.2,
        reason: () => "",
      },
    ],
  },
  {
    topicId: "air-and-climate",
    criteria: [
      {
        criterionId: "has-air-conditioning",
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
];

export type FoodAndDrinksSubCategoryId =
  | "restaurants"
  | "bakeries"
  | "delicatessen"
  | "bars"
  | "drinking-water"
  | "cafes"
  | "food-court"
  | "fast-food"
  | "canteen"
  | "ice-cream";

export const foodAndDrinksSubCategories: Record<
  FoodAndDrinksSubCategoryId,
  Omit<SubCategory, "id">
> = {
  "drinking-water": {
    name: () => t("Drinking water"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:amenity=drinking_water",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity=water_point",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=water",
      "https://wiki.openstreetmap.org/wiki/Tag:fountain=drinking",
      "https://wiki.openstreetmap.org/wiki/Tag:drinking_water=yes",
    ],
    description: () =>
      t(
        "Includes drinking water fountains, springs, water stores and public taps",
      ),
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.shop} = 'water'`,
          sql`${osm_amenities.tags}->'fountain' = 'drinking'`,
          sql`${osm_amenities.amenity} = 'water_point'`,
          sql`${osm_amenities.amenity} = 'drinking_water'`,
          sql`${osm_amenities.tags}->'drinking_water' = 'yes'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: [
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
        topicId: "vision",
        criteria: [
          {
            criterionId: "is-accessible-to-visually-impaired",
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
    ],
  },
  bars: {
    name: () => t("Bars and pubs"),
    parent: "food-and-drinks",
    weight: 0.1,
    reason: () => "",
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:amenity=bar",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity=pub",
      "https://wiki.openstreetmap.org/wiki/Tag:bar=yes",
    ],
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.amenity} = 'bar'`,
          sql`${osm_amenities.amenity} = 'pub'`,
          sql`${osm_amenities.tags}->'bar' = 'yes'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericGastronomyTopics,
  },
  delicatessen: {
    name: () => t("Delicatessen"),
    parent: "food-and-drinks",
    weight: 0.1,
    reason: () => "",
    description: () =>
      t(
        "Includes butcher shops, cheese stores, dairy stores, chocolate shops, coffee shops, delis, farm stores, general food shops, greengrocers, health food stores, pasta shops, seafood markets, spice shops, tea shops, nut stores, tortilla shops, wine shops and liquor stores",
      ),
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:shop=butcher",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=cheese",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=dairy",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=chocolate",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=coffee",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=deli",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=farm",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=food",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=greengrocer",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=health_food",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=pasta",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=seafood",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=spices",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=tea",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=nuts",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=tortillas",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=wine",
      "https://wiki.openstreetmap.org/wiki/Tag:shop=alcohol",
    ],
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.shop} = 'butcher'`,
          sql`${osm_amenities.shop} = 'cheese'`,
          sql`${osm_amenities.shop} = 'dairy'`,
          sql`${osm_amenities.shop} = 'chocolate'`,
          sql`${osm_amenities.shop} = 'coffee'`,
          sql`${osm_amenities.shop} = 'deli'`,
          sql`${osm_amenities.shop} = 'farm'`,
          sql`${osm_amenities.shop} = 'food'`,
          sql`${osm_amenities.shop} = 'greengrocer'`,
          sql`${osm_amenities.shop} = 'health_food'`,
          sql`${osm_amenities.shop} = 'pasta'`,
          sql`${osm_amenities.shop} = 'seafood'`,
          sql`${osm_amenities.shop} = 'spices'`,
          sql`${osm_amenities.shop} = 'tea'`,
          sql`${osm_amenities.shop} = 'nuts'`,
          sql`${osm_amenities.shop} = 'tortillas'`,
          sql`${osm_amenities.shop} = 'wine'`,
          sql`${osm_amenities.shop} = 'alcohol'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: genericShopTopics,
  },
  "ice-cream": {
    name: () => t("Ice cream shops"),
    parent: "food-and-drinks",
    weight: 0.1,
    reason: () => "",
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dice_cream",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity=ice_cream",
    ],
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.shop} = 'ice_cream'`,
          sql`${osm_amenities.amenity} = 'ice_cream'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: [
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
        topicId: "vision",
        criteria: [
          {
            criterionId: "is-accessible-to-visually-impaired",
            weight: 0.8,
            reason: () => "",
          },
          {
            criterionId: "has-menu-on-website",
            weight: 0.2,
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
        topicId: "general-assistance",
        criteria: [
          {
            criterionId: "has-drinking-straws",
            weight: 1,
            reason: () => "",
          },
        ],
      },
    ],
  },
  bakeries: {
    name: () => t("Bakeries"),
    parent: "food-and-drinks",
    weight: 0.1,
    reason: () => "",
    description: () => t("Includes bakeries, pastry shops and confectionaries"),
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dbakery",
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dconfectionery",
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dpastry",
    ],
    sql: {
      from: osm_amenities,
      where: sql`(${sql.join(
        [
          sql`${osm_amenities.shop} = 'bakery'`,
          sql`${osm_amenities.shop} = 'confectionery'`,
          sql`${osm_amenities.shop} = 'pastry'`,
        ],
        sql` OR `,
      )})`,
    },
    topics: [
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
        topicId: "vision",
        criteria: [
          {
            criterionId: "is-accessible-to-visually-impaired",
            weight: 0.8,
            reason: () => "",
          },
          {
            criterionId: "has-menu-on-website",
            weight: 0.2,
            reason: () => "",
          },
        ],
      },
      {
        topicId: "air-and-climate",
        criteria: [
          {
            criterionId: "has-air-conditioning",
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
    ],
  },
  restaurants: {
    name: () => t("Restaurants"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    description: () =>
      t(
        "Includes restaurants, cafes, fast-food, cafeterias, food-courts and canteens",
      ),
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Drestaurant"],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'restaurant'`,
    },
    topics: genericGastronomyTopics,
  },
  cafes: {
    name: () => t("Cafes"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcafe"],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'cafe'`,
    },
    topics: genericGastronomyTopics,
  },
  "fast-food": {
    name: () => t("Fast food"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dfast_food"],
    sql: {
      from: osm_amenities,
      where: sql`(${osm_amenities.amenity} = 'fast_food' AND ${osm_amenities.tags}->'fast_food' != 'cafeteria')`,
    },
    topics: genericGastronomyTopics,
  },
  canteen: {
    name: () => t("Canteen"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcanteen"],
    sql: {
      from: osm_amenities,
      where: sql`(${osm_amenities.amenity} = 'canteen' OR (${osm_amenities.amenity} = 'fast_food' AND ${osm_amenities.tags}->'fast_food' = 'cafeteria'))`,
    },
    topics: genericGastronomyTopics,
  },
  "food-court": {
    name: () => t("Food court"),
    parent: "food-and-drinks",
    weight: 0.3,
    reason: () => "",
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dfood_court"],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'food_court'`,
    },
    topics: genericGastronomyTopics,
  },
};
