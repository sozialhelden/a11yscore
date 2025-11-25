import { type SQL, sql } from "drizzle-orm";
import {
  type SubCategory,
  type TopLevelCategory,
  type TopLevelCategoryId,
  topLevelCategories,
} from "~~/src/a11yscore/config/categories";
import {
  getCombinedScoreSelectClauses,
  getCriteriaSelectClauses,
  getSubCategorySelectClauses,
  getTopicSelectClauses,
  getTopLevelCategorySelectClauses,
} from "~~/src/a11yscore/queries/score-select-clauses";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  alias,
  getCombinedSubCategoriesSubSelectAlias,
  getCriterionSubSelectAlias,
  getSubCategoryScoreAlias,
  getSubCategorySubSelectAlias,
  getTopicSubSelectAlias,
  getTopLevelCategorySubSelectAlias,
  getTopLevelCategoryWeightNormalizationFactorAlias,
} from "~~/src/a11yscore/utils/sql-aliases";
import { osm_admin, osm_amenities } from "~/db/schema/osm-sync";

/**
 * Get a SQL sub-select that retrieves all criteria scores for a given subcategory.
 * The most basic sub-select building block of the scoring queries.
 * @example
 * ```
 * SELECT
 *      AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "food-and-drinks/restaurants/mobility/is-wheelchair-accessible",
 *      AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 * FROM "osm_amenities"
 * WHERE "osm_amenities"."amenity" = 'restaurant'
 * ```
 */
export function getCriteriaSubSelect({
  topLevelCategoryId,
  subCategory,
  join = [],
  where = [],
  groupBy = [],
}: {
  topLevelCategoryId: TopLevelCategoryId;
  subCategory: SubCategory;
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
}): SQL {
  const selects = [
    subCategory.sql.groupBy,
    ...groupBy,
    ...getCriteriaSelectClauses(topLevelCategoryId, subCategory),
  ].filter(Boolean);

  const joins = [...join, subCategory.sql.join].filter(Boolean);
  const wheres = [...where, subCategory.sql.where].filter(Boolean);
  const groupBys = [...groupBy, subCategory.sql.groupBy].filter(Boolean);

  const table = subCategory.sql.from;
  const spatialJoin = [
    sql`JOIN ${osm_admin} ON ST_Intersects(${table.geometry}, ${osm_admin.geometry})`,
  ];

  return sql`
		SELECT ${sql.join(selects, sql`, `)} 
		FROM ${subCategory.sql.from} 
        ${sql.join(spatialJoin, sql`\n`)}    
		${wheres.length ? sql`WHERE ${sql.join(wheres, sql` AND `)}` : sql.empty()}
		${groupBys.length ? sql`GROUP BY ${sql.join(groupBys, sql` AND `)}` : sql.empty()}
	`;
}

/**
 * Get a SQL sub-select that retrieves all topic scores for a given subcategory.
 * This is the 2nd level sub-select building block of the scoring queries.
 * @example
 * ```
 * SELECT
 *      "criteria-scores__food-and-drinks__restaurants".*,
 *      (
 *            0.7 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/is-wheelchair-accessible"
 *          + 0.3 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 *      )
 *      AS "food-and-drinks/restaurants/mobility",
 *      (
 *            0.8 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/smoking-is-prohibited"
 *          + 0.2 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/has-air-conditioning"
 *      )
 *      AS "food-and-drinks/restaurants/air-and-climate"
 * FROM (
 *     SELECT
 *         AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *             AS "food-and-drinks/restaurants/mobility/is-wheelchair-accessible",
 *         AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *             AS "food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 *     FROM "osm_amenities"
 *     WHERE "osm_amenities"."amenity" = 'restaurant'
 * ) AS "criteria-scores__food-and-drinks__restaurants"
 * ```
 */
export function getTopicSubSelect({
  topLevelCategoryId,
  subCategory,
  join = [],
  where = [],
  groupBy = [],
}: {
  topLevelCategoryId: TopLevelCategoryId;
  subCategory: SubCategory;
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
}): SQL {
  const criterionSubSelectAlias = alias(
    getCriterionSubSelectAlias(topLevelCategoryId, subCategory.id),
  );

  const criteriaSubSelect = getCriteriaSubSelect({
    topLevelCategoryId,
    subCategory,
    join,
    where,
    groupBy,
  });

  return sql`
        SELECT ${sql.join(getTopicSelectClauses(topLevelCategoryId, subCategory), sql`, `)}
        FROM (${criteriaSubSelect}) AS ${criterionSubSelectAlias}
    `;
}

/**
 * Get a SQL sub-select that retrieves an overall score for the given subcategory.
 * This is the 3rd level sub-select building block of the scoring queries.
 * @example
 * ```
 * SELECT
 *      "topic-scores__food-and-drinks__restaurants".*,
 *      (("topic-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility" + "topic-scores__restaurants"."food-and-drinks/restaurants/air-and-climate") / 2) AS "food-and-drinks/restaurants"
 * FROM (
 *      SELECT
 *          "criteria-scores__food-and-drinks__restaurants".*,
 *          (
 *                0.7 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/is-wheelchair-accessible"
 *                + 0.3 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 *          )
 *          AS "food-and-drinks/restaurants/mobility",
 *          (
 *                0.8 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/smoking-is-prohibited"
 *              + 0.2 * "criteria-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/has-air-conditioning"
 *          )
 *          AS "food-and-drinks/restaurants/air-and-climate"
 *      FROM (
 *         -- ... see above
 *      ) AS "criteria-scores__food-and-drinks__restaurants"
 * ) AS "topic-scores__food-and-drinks__restaurants"
 * ```
 */
export function getSubCategorySubSelect({
  topLevelCategoryId,
  subCategory,
  join = [],
  where = [],
  groupBy = [],
}: {
  topLevelCategoryId: TopLevelCategoryId;
  subCategory: SubCategory;
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
}): SQL {
  const topicSubSelectAlias = alias(
    getTopicSubSelectAlias(topLevelCategoryId, subCategory.id),
  );

  const topicSubSelect = getTopicSubSelect({
    topLevelCategoryId,
    subCategory,
    join,
    where,
    groupBy,
  });

  return sql`
        SELECT ${sql.join(getSubCategorySelectClauses(topLevelCategoryId, subCategory), sql`, `)}
        FROM (${topicSubSelect}) AS ${topicSubSelectAlias}
    `;
}

/**
 * Get a SQL sub-select that retrieves an overall score for the given top-level category.
 * This is the 4th sub-select building block of the scoring queries.
 * @example
 * ```
 *  SELECT
 *        "sub-category-scores__food-and-drinks".*,
 *        "sub-category-scores__food-and-drinks".*,
 *        ("sub-category-scores__food-and-drinks"."food-and-drinks--weight-normalization" * (0.7 * "sub-category-scores__food-and-drinks"."food-and-drinks/restaurants" + 0.3 * "sub-category-scores__food-and-drinks"."food-and-drinks/cafes")) AS "food-and-drinks"
 * FROM (
 *     SELECT
 *         *,
 *         "food-and-drinks--weight-normalization"
 *     FROM (
 *      	-- see above...
 *     ) AS "sub-category-scores__food-and-drinks__restaurants",
 *     (
 * 			-- see above...
 *     ) AS "sub-category-scores__food-and-drinks__cafes"
 * ) AS "sub-category-scores__food-and-drinks"
 * ```
 */
export function getTopLevelCategorySubSelect({
  topLevelCategory,
  join = [],
  where = [],
  groupBy = [],
}: {
  topLevelCategory: TopLevelCategory;
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
}): SQL {
  const combinedSubCategoriesAlias = alias(
    getCombinedSubCategoriesSubSelectAlias(topLevelCategory.id),
  );
  const weightNormalizationFactorAlias = alias(
    getTopLevelCategoryWeightNormalizationFactorAlias(topLevelCategory.id),
  );

  const weightsForNormalization: SQL[] = [];
  const subCategorySubSelects = getChildCategories(topLevelCategory.id).map(
    (subCategory) => {
      const subCategoryScoreAlias = alias(
        getSubCategoryScoreAlias(topLevelCategory.id, subCategory.id),
      );
      const subCategorySubSelectAlias = alias(
        getSubCategorySubSelectAlias(topLevelCategory.id, subCategory.id),
      );

      const subCategorySubSelect = getSubCategorySubSelect({
        topLevelCategoryId: topLevelCategory.id,
        subCategory,
        join,
        where,
        groupBy,
      });

      weightsForNormalization.push(
        // If the sub category score is NULL - this means there are no places/geometry in that
        // sub category - set the weight to 0 for this sub category. Weights are normalized
        // in the topLevelCategorySubSelect clause to sum up to 1 again
        sql`(CASE WHEN ${subCategorySubSelectAlias}.${subCategoryScoreAlias} IS NULL THEN 0 ELSE ${sql.raw(String(subCategory.weight))} END)`,
      );

      return sql`(${subCategorySubSelect}) AS ${subCategorySubSelectAlias}`;
    },
  );

  const weightNormalizationFactor = sql`(1 / (${sql.join(weightsForNormalization, sql` + `)}))::float AS ${weightNormalizationFactorAlias}`;

  return sql`
        SELECT ${sql.join(getTopLevelCategorySelectClauses(topLevelCategory), sql`, `)}
        FROM (
            SELECT *, ${weightNormalizationFactor} 
            FROM ${sql.join(subCategorySubSelects, sql`, `)}
        ) AS ${combinedSubCategoriesAlias}
	`;
}

/**
 * Get a SQL query that retrieves the combined score for all top-level categories.
 * @example
 * ```
 * SELECT
 *        "top-level-category-scores__food-and-drinks".*,
 *        "top-level-category-scores__public-transport".*,
 *        (0.6 * "top-level-category-scores__food-and-drinks"."food-and-drinks" + 0.4 * "top-level-category-scores__public-transport"."public-transport") AS "score"
 * FROM (
 *        -- see above...
 * ) AS "top-level-category-scores__food-and-drinks",
 * (
 *         -- see above...
 * ) AS "top-level-category-scores__public-transport"
 * ```
 */
export function getCombinedScoreQuery({
  join = [],
  where = [],
  groupBy = [],
}: {
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
}): SQL {
  const topLevelCategorySubSelects = Object.values(topLevelCategories).map(
    (topLevelCategory) => {
      const topLevelCategorySubSelectAlias = alias(
        getTopLevelCategorySubSelectAlias(topLevelCategory.id),
      );

      const topLevelCategorySubSelect = getTopLevelCategorySubSelect({
        topLevelCategory,
        join,
        where,
        groupBy,
      });

      return sql`(${topLevelCategorySubSelect}) AS ${topLevelCategorySubSelectAlias}`;
    },
  );

  return sql`
		SELECT ${sql.join(getCombinedScoreSelectClauses(), sql`, `)}
		FROM ${sql.join(topLevelCategorySubSelects, sql`, `)}
	`;
}
