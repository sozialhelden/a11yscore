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
  },
});

/*
 * sub categories
 */

export type FoodAndDrinksSubCategoryId = "restaurants" | "bakeries";

export const foodAndDrinksSubCategories: Record<
  FoodAndDrinksSubCategoryId,
  Omit<SubCategory, "id">
> = {
  bakeries: {
    name: () => t("Bakeries"),
    parent: "food-and-drinks",
    weight: 0.4,
    reason: () => "",
    description: () => t("Includes bakeries, pastry shops and confectionaries"),
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dbakery",
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dconfectionery",
      "https://wiki.openstreetmap.org/wiki/Tag:shop%3Dpastry",
    ],
    sql: {
      from: osm_amenities,
      where: sql.join(
        [
          sql`${osm_amenities.shop} = 'bakery'`,
          sql`${osm_amenities.shop} = 'confectionery'`,
          sql`${osm_amenities.shop} = 'pastry'`,
        ],
        sql` OR `,
      ),
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
    weight: 0.6,
    reason: () => "",
    description: () =>
      t(
        "Includes restaurants, cafes, fast-food, cafeterias, food-courts and canteens",
      ),
    resources: [
      "https://wiki.openstreetmap.org/wiki/Tag:amenity%3Drestaurant",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcafe",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dfast_food",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcanteen",
      "https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dfood_court",
    ],
    sql: {
      from: osm_amenities,
      where: sql.join(
        [
          sql`${osm_amenities.amenity} = 'restaurant'`,
          sql`${osm_amenities.amenity} = 'cafe'`,
          sql`${osm_amenities.amenity} = 'fast_food'`,
          sql`${osm_amenities.amenity} = 'canteen'`,
          sql`${osm_amenities.amenity} = 'food_court'`,
        ],
        sql` OR `,
      ),
    },
    topics: [
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
    ],
  },
};
