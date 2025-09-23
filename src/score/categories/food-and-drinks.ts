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

export type FoodAndDrinksSubCategoryId = "restaurants" | "cafes";
export const foodAndDrinksSubCategories: Record<
  FoodAndDrinksSubCategoryId,
  Omit<SubCategory, "id">
> = {
  restaurants: {
    name: () => t("Restaurants"),
    parent: "food-and-drinks",
    weight: 0.7,
    reason: () => "",
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Drestaurant"],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'restaurant'`,
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
    ],
  },
  cafes: {
    name: () => t("Cafes"),
    reason: () => "",
    parent: "food-and-drinks",
    weight: 0.3,
    resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcafe"],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.amenity} = 'cafe'`,
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
    ],
  },
};
