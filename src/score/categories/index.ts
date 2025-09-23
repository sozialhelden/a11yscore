import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import {
  type FoodAndDrinksSubCategoryId,
  type FoodAndDrinksTopLevelCategoryId,
  foodAndDrinksSubCategories,
  foodAndDrinksTopLevelCategory,
} from "~~/src/score/categories/food-and-drinks";
import {
  type PublicTransportSubCategoryId,
  type PublicTransportTopLevelCategoryId,
  publicTransportSubCategories,
  publicTransportTopLevelCategory,
} from "~~/src/score/categories/public-transport";
import type { CriterionId } from "~~/src/score/criteria";
import type { SustainableDevelopmentGoalId } from "~~/src/score/sdgs";
import type { TopicId } from "~~/src/score/topics";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type TopLevelCategoryId =
  | FoodAndDrinksTopLevelCategoryId
  | PublicTransportTopLevelCategoryId;

export type SubCategoryId =
  | FoodAndDrinksSubCategoryId
  | PublicTransportSubCategoryId;

export type TopLevelCategory = {
  /**
   * Identifier of the category.
   * @example
   * ```
   * "food-and-drinks"
   * ```
   */
  id: TopLevelCategoryId;
  /**
   * The name of the category, used for display purposes.
   * Make sure to use the `t` function to translate the name.
   * @example
   * ```
   * () => t("Food and Drinks")
   * ```
   */
  name: () => string;
  /**
   * A list of Sustainable Development Goals (SDGs) that this category
   * contributes to.
   * @example
   * ```
   * [6, 13, 17]
   * ```
   */
  sustainableDevelopmentGoals: Readonly<SustainableDevelopmentGoalId[]>;
  /**
   * An optional description of this top-level category, explaining its relevance.
   * It should also be used to explain the reasoning behind the individual weight.
   * Make sure to use the `t` function to translate the description.
   * @example
   * ```
   * () => t("This sub-category is important because...")
   * ```
   */
  reason?: () => string;
  /**
   * A numeric weight that indicates the importance of this category in relation to
   * other top-level categories. Ideally, the weights of all top-level categories should
   * sum up to 1.
   * @example
   * ```
   * 0.5
   * ```
   */
  weight: number;
};

export type SubCategory = {
  /**
   * Identifier of the category.
   * @example
   * ```
   * "restaurants"
   * ```
   */
  id: SubCategoryId;
  /**
   * The name of the category, used for display purposes.
   * Make sure to use the `t` function to translate the name.
   * @example
   * ```
   * () => t("Restaurants")
   * ```
   */
  name: () => string;
  /**
   * The ID of the parent category this sub-category belongs to.
   * @example
   * ```
   * "food-and-drinks"
   * ```
   */
  parent: TopLevelCategoryId;
  /**
   * A numeric weight that indicates the importance of this sub-category inside
   * the parent category. Ideally, the weights of all sub-categories should
   * sum up to 1.
   * @example
   * ```
   * 0.5
   * ```
   */
  weight: number;
  /**
   * An optional description of this sub-category, explaining its relevance.
   * It should also be used to explain the reasoning behind the individual weight.
   * Make sure to use the `t` function to translate the description.
   * @example
   * ```
   * () => t("This sub-category is important because...")
   * ```
   */
  reason?: () => string;
  /**
   * Some individual parts of SQL query that will be used to select the data for
   * this sub-category.
   */
  sql: {
    /**
     * The table to select data from. You should import the table from the
     * "osm-sync" schema in ~/db/schema/osm-sync.
     * @example
     * ```
     * osm_amenities
     * ```
     */
    from: PgTableWithColumns<any>;
    /**
     * An optional SQL query to join additional tables needed for this sub-category.
     * Make sure to always use the drizzle schema for building SQL queries.
     * @example
     * ```
     * sql`JOIN ${osm_admin} ON ST_Intersects(${osm_amenities.geometry}, ${osm_admin.geometry})`
     * ```
     */
    join?: SQL;
    /**
     * An optional SQL query to filter the data.
     * This will be integrated into an existing WHERE clause, so it should NOT
     * include the `WHERE` keyword.
     * @example
     * ```
     * sql`${osm_amenities.amenity} = 'restaurant'`
     * ```
     */
    where?: SQL;
    /**
     * An optional SQL query to group the data.
     * This will be integrated into an existing GROUP BY clause, so it should NOT
     * include the `GROUP BY` keyword.
     * @example
     * ```
     * sql`${osm_amenities.reservation}`
     * ```
     */
    groupBy?: SQL;
  };
  /**
   * Links to resources that explain this category/selector in more detail.
   * E.g. links to the OSM wiki of the relevant tags.
   * @example
   * ```
   * ["https://wiki.openstreetmap.org/wiki/Key:amenity"]
   * ```
   */
  resources?: `${"http://" | "https://"}${string}`[];
  /**
   * A list of topics for this sub-category.
   */
  topics: Array<{
    /**
     * The ID of the topic.
     * @example
     * ```
     * "mobility"
     * ```
     */
    topicId: TopicId;
    /**
     * A list of criteria for this topic.
     */
    criteria: Array<{
      /**
       * The ID of the criterion.
       * @example
       * ```
       * "is-wheelchair-accessible"
       * ```
       */
      criterionId: CriterionId;
      /**
       * A numeric weight, that indicates the importance of this criterion
       * within the topic for this category. Ideally, all weights in this topic
       * should sum up to 1.
       * @example
       * ```
       * 0.5
       * ```
       */
      weight: number;
      /**
       * An optional description why this criterion is relevant for this topic
       * in this category. It should also be used to explain the reasoning
       * behind the individual weight.
       * @example
       * ```
       * () => t("This criterion is relevant because...")
       * ```
       */
      reason?: () => string;
    }>;
  }>;
};

const configuredTopLevelCategories: Record<
  TopLevelCategoryId,
  Omit<TopLevelCategory, "id">
> = {
  ...foodAndDrinksTopLevelCategory({ weight: 0.6 }),
  ...publicTransportTopLevelCategory({ weight: 0.4 }),
};

const configuredSubCategories: Record<
  SubCategoryId,
  Omit<SubCategory, "id">
> = {
  ...foodAndDrinksSubCategories,
  ...publicTransportSubCategories,
};

export const topLevelCategories: Record<TopLevelCategoryId, TopLevelCategory> =
  addIdToConfigEntries<TopLevelCategoryId, TopLevelCategory>(
    configuredTopLevelCategories,
  );
export const topLevelCategoryList = Object.keys(
  topLevelCategories,
) as TopLevelCategoryId[];

export const subCategories: Record<SubCategoryId, SubCategory> =
  addIdToConfigEntries<SubCategoryId, SubCategory>(configuredSubCategories);
