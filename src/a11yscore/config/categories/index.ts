import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import {
  type FoodAndDrinksSubCategoryId,
  type FoodAndDrinksTopLevelCategoryId,
  foodAndDrinksSubCategories,
  foodAndDrinksTopLevelCategory,
} from "~~/src/a11yscore/config/categories/food-and-drinks";
import {
  type PublicTransportSubCategoryId,
  type PublicTransportTopLevelCategoryId,
  publicTransportSubCategories,
  publicTransportTopLevelCategory,
} from "~~/src/a11yscore/config/categories/public-transport";
import type { CriterionId } from "~~/src/a11yscore/config/criteria";
import type { SustainableDevelopmentGoalId } from "~~/src/a11yscore/config/sdgs";
import type { TopicId } from "~~/src/a11yscore/config/topics";
import { addIdToConfigEntries } from "~~/src/a11yscore/utils/config";
import {
  healthCareSubCategories,
  type HealthCareSubCategoryId,
  healthCareTopLevelCategory,
  type HealthCareTopLevelCategoryId,
} from "~~/src/a11yscore/config/categories/health-care";
import {
  socialCareSubCategories,
  type SocialCareSubCategoryId,
  socialCareTopLevelCategory,
  type SocialCareTopLevelCategoryId,
} from "~~/src/a11yscore/config/categories/social-care";

export type TopLevelCategoryId =
  | FoodAndDrinksTopLevelCategoryId
  | PublicTransportTopLevelCategoryId
  | HealthCareTopLevelCategoryId
  | SocialCareTopLevelCategoryId;

export type SubCategoryId =
  | FoodAndDrinksSubCategoryId
  | PublicTransportSubCategoryId
  | HealthCareSubCategoryId
  | SocialCareSubCategoryId;

export type OSMTag = {
  /**
   * The key of the OSM tag that is used for this category/selector.
   * @example
   * ```
   * amenity
   * ```
   */
  key: string;
  /**
   * The value of the OSM tag that is used for this category/selector.
   * @example
   * ```
   * restaurant
   * ```
   */
  value: string;
};

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
   * A numeric weight that indicates the importance of this category in relation to
   * other top-level categories. Ideally, the weights of all top-level categories should
   * sum up to 1.
   * @example
   * ```
   * 0.5
   * ```
   */
  weight: number;
  /**
   * A written interpretation of the score, used for display purposes.
   * Make sure to use the `t` function to translate the description.
   * @example
   * ```
   * (score) => {
   *    if (score >= 0.75) {
   *        return t("Many of the transport stops are accessible");
   *    } else if (score >= 0.3) {
   *        return t("Some of the transport stops are accessible");
   *    } else if (score > 0) {
   *        return t("Only a few transport stops are accessible");
   *    }
   *    return t("Score could not be calculated due to missing data");
   * }
   * ```
   */
  interpretation: (score: number) => string;
  description?: string;
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
   * The ID of the parent category this sub-category belongs to.
   * @example
   * ```
   * "food-and-drinks"
   * ```
   */
  parent: TopLevelCategoryId;
  /**
   * The name of the category, used for display purposes.
   * Make sure to use the `t` function to translate the name.
   * @example
   * ```
   * () => t("Gastronomy")
   * ```
   */
  name: () => string;
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
   * An optional description of the category, used for display purposes.
   * Make sure to use the `t` function to translate the description.
   * @example
   * ```
   * () => t("Includes restaurants, cafes, fast-food, cafeteria and canteens.")
   * ```
   */
  description?: () => string;
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
   * A list of OSM tags that are used to select relevant objects for this category.
   * This is used for display purposes only. For the actual selection of data,
   * please use the `sql` property.
   */
  osmTags: OSMTag[];
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
       * A description why this criterion is relevant for this topic in this category. This will
       * override the generic reason provided in the criterion configuration.
       * This will be used for display purposes in the frontend, so make sure to use the `t` function
       * to translate the description. Markdown syntax is allowed!
       * @example
       * ```
       * () => t("Wheelchair users **must** be able to enter and use the facilities without barriers.")
       * ```
       */
      reason?: () => string;
      /**
       * A list of recommendations on how to improve this criterion for this topic in this category.
       * This will override the generic recommendations provided in the criterion configuration, those
       * are passed as parameter to the function, so you can still use them if you want.
       * This will be used for display purposes in the frontend, so make sure to use the `t` function
       * to translate the description. Markdown syntax is allowed!
       * @example
       * ```
       * () => [
       *     t("If the entrance has one or multiple steps, [consider installing a ramp](https://wheelramp.de) or lift."),
       * ]
       * ```
       */
      recommendations?: (genericRecommendations: string[]) => string[];
      /**
       * A list of links that provide more information about this criterion. Can be e.g. links to
       * guides, norms, or other resources.
       * This will override the generic links provided in the criterion configuration. This will be
       * used for display purposes in the frontend, so make sure to use the `t` function to translate
       * the label.
       * @example
       * ```
       * () => [
       *     {
       *         label: t("DIN 18040 - Accessible building design"),
       *         url: "https://www.din18040.de/wc-toiletten.htm"
       *     }
       * ]
       * ```
       */
      links?: () => { url: string; label: string }[];
    }>;
  }>;
};

const configuredTopLevelCategories: Record<
  TopLevelCategoryId,
  Omit<TopLevelCategory, "id">
> = {
  ...foodAndDrinksTopLevelCategory({ weight: 0.1 }),
  ...publicTransportTopLevelCategory({ weight: 0.3 }),
  ...healthCareTopLevelCategory({ weight: 0.3 }),
  ...socialCareTopLevelCategory({ weight: 0.3 }),
};

const configuredSubCategories: Record<
  SubCategoryId,
  Omit<SubCategory, "id">
> = {
  ...foodAndDrinksSubCategories,
  ...publicTransportSubCategories,
  ...healthCareSubCategories,
  ...socialCareSubCategories,
};

const topLevelCategories: Record<TopLevelCategoryId, TopLevelCategory> =
  addIdToConfigEntries<TopLevelCategoryId, TopLevelCategory>(
    configuredTopLevelCategories,
  );
export const getTopLevelCategoryList = () => Object.values(topLevelCategories);
export const getTopLevelCategoryIds = () =>
  Object.keys(topLevelCategories) as TopLevelCategoryId[];
export const getTopLevelCategoryById = (id: TopLevelCategoryId) =>
  topLevelCategories[id];

const subCategories: Record<SubCategoryId, SubCategory> = addIdToConfigEntries<
  SubCategoryId,
  SubCategory
>(configuredSubCategories);
export const getSubCategoryList = () => Object.values(subCategories);
export const getSubCategoryIds = () =>
  Object.keys(subCategories) as SubCategoryId[];
export const getSubCategoryById = (id: SubCategoryId) => subCategories[id];
