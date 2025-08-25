import { type SQL, sql } from "drizzle-orm";
import {
	type SubCategory,
	type TopLevelCategory,
	topLevelCategories,
} from "~~/src/score/categories";
import { getChildCategories } from "~~/src/score/utils/categories";
import {
	getCriterionSubSelectAlias,
	getSubCategorySubSelectAlias,
	getTopicSubSelectAlias,
	getTopLevelCategorySubSelectAlias,
} from "~~/src/score/utils/sql-aliases";
import {
	getCombinedScoreSelectClauses,
	getCriteriaSelectClauses,
	getSubCategorySelectClauses,
	getTopicSelectClauses,
	getTopLevelCategorySelectClauses,
} from "~~/src/score/utils/sql-select-clauses";

/**
 * Get a SQL sub-select that retrieves all criteria scores for a given subcategory.
 * @example
 * ```
 * SELECT
 *      AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *      AS "c/mobility/is-wheelchair-accessible",
 *      AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *      AS "c/mobility/has-wheelchair-accessible-toilet"
 * FROM "osm_amenities"
 * WHERE "osm_amenities"."amenity" = 'restaurant'
 * ```
 */
export function getCriteriaSubSelect({
	subCategory,
	join = [],
	where = [],
	groupBy = [],
}: {
	subCategory: SubCategory;
	join?: SQL[];
	where?: SQL[];
	groupBy?: SQL[];
}): SQL {
	const selects = [
		subCategory.sql.groupBy,
		...groupBy,
		...getCriteriaSelectClauses(subCategory),
	].filter(Boolean);

	const joins = [...join, subCategory.sql.join].filter(Boolean);
	const wheres = [...where, subCategory.sql.where].filter(Boolean);
	const groupBys = [...groupBy, subCategory.sql.groupBy].filter(Boolean);

	return sql`
		SELECT ${sql.join(selects, sql`, `)} 
		FROM ${subCategory.sql.from} 
		${sql.join(joins, sql`\n`)}
		${wheres.length ? sql`WHERE ${sql.join(wheres, sql` AND `)}` : sql.empty()}
		${groupBys.length ? sql`GROUP BY ${sql.join(groupBys, sql` AND `)}` : sql.empty()}
	`;
}

/**
 * Get a SQL sub-select that retrieves all topic scores for a given subcategory.
 * @example
 * ```
 * SELECT
 *      "criteria-scores__restaurants".*,
 *      (
 *            0.7 * "criteria-scores__restaurants"."c/mobility/is-wheelchair-accessible"
 *          + 0.3 * "criteria-scores__restaurants"."c/mobility/has-wheelchair-accessible-toilet"
 *      )
 *      AS "t/restaurants/mobility",
 *      (
 *            0.8 * "criteria-scores__restaurants"."c/air-and-climate/smoking-is-prohibited"
 *          + 0.2 * "criteria-scores__restaurants"."c/air-and-climate/has-air-conditioning"
 *      )
 *      AS "t/restaurants/air-and-climate"
 * FROM (
 *     SELECT
 *         AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *         AS "c/restaurants/mobility/is-wheelchair-accessible",
 *         AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *         AS "c/restaurants/mobility/has-wheelchair-accessible-toilet"
 *     FROM "osm_amenities"
 *     WHERE "osm_amenities"."amenity" = 'restaurant'
 * ) AS "criteria-scores__restaurants"
 * ```
 */
export function getTopicSubSelect({
	subCategory,
	join = [],
	where = [],
	groupBy = [],
}: {
	subCategory: SubCategory;
	join?: SQL[];
	where?: SQL[];
	groupBy?: SQL[];
}): SQL {
	const criteriaSubSelect = getCriteriaSubSelect({
		subCategory,
		join,
		where,
		groupBy,
	});
	const criteriaSubSelectAlias = getCriterionSubSelectAlias(subCategory.id);
	const selects = getTopicSelectClauses(subCategory);

	return sql`
        SELECT ${sql.join(selects, sql`, `)}
        FROM (${criteriaSubSelect}) AS ${criteriaSubSelectAlias}
    `;
}

/**
 * Get a SQL sub-select that retrieves an overall score for the given subcategory.
 * @example
 * ```
 * SELECT
 *      "topic-scores__restaurants".*,
 *      (("topic-scores__restaurants"."t/restaurants/mobility" + "topic-scores__restaurants"."t/restaurants/air-and-climate") / 2) AS "s/restaurants"
 * FROM (
 *      SELECT
 *          "criteria-scores__restaurants".*,
 *          (
 *                0.7 * "criteria-scores__restaurants"."c/mobility/is-wheelchair-accessible"
 *                + 0.3 * "criteria-scores__restaurants"."c/mobility/has-wheelchair-accessible-toilet"
 *          )
 *          AS "t/restaurants/mobility",
 *          (
 *                0.8 * "criteria-scores__restaurants"."c/air-and-climate/smoking-is-prohibited"
 *              + 0.2 * "criteria-scores__restaurants"."c/air-and-climate/has-air-conditioning"
 *          )
 *          AS "t/restaurants/air-and-climate"
 *      FROM (
 *          SELECT
 *              AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *              AS "c/restaurants/mobility/is-wheelchair-accessible",
 *              AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *              AS "c/restaurants/mobility/has-wheelchair-accessible-toilet"
 *          FROM "osm_amenities"
 *          WHERE "osm_amenities"."amenity" = 'restaurant'
 *      ) AS "criteria-scores__restaurants"
 * ) AS "topic-scores__restaurants"
 * ```
 */
export function getSubCategorySubSelect({
	subCategory,
	join = [],
	where = [],
	groupBy = [],
}: {
	subCategory: SubCategory;
	join?: SQL[];
	where?: SQL[];
	groupBy?: SQL[];
}): SQL {
	const topicSubSelectAlias = getTopicSubSelectAlias(subCategory.id);
	const topicSubSelect = getTopicSubSelect({
		subCategory,
		join,
		where,
		groupBy,
	});
	const selects = getSubCategorySelectClauses(subCategory);

	return sql`
        SELECT ${sql.join(selects, sql`, `)}
        FROM (${topicSubSelect}) AS ${topicSubSelectAlias}
    `;
}

/**
 * Get a SQL sub-select that retrieves an overall score for the given top-level category.
 * @example
 * ```
 * SELECT
 * 		"sub-category-scores__restaurants".*,
 *		"sub-category-scores__cafes".*,
 *		(0.7 * "sub-category-scores__restaurants"."sc/restaurants" + 0.3 * "sub-category-scores__cafes"."sc/cafes") AS "tc/food-and-drinks"
 * FROM (
 *      	-- see above...
 * ) AS "sub-category-scores__restaurants",
 * (
 * 			-- see above...
 * ) AS "sub-category-scores__cafes"
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
	const subCategorySubSelects = getChildCategories(topLevelCategory.id).map(
		(subCategory) =>
			sql`(
				${getSubCategorySubSelect({
					subCategory,
					join,
					where,
					groupBy,
				})}
			) AS ${getSubCategorySubSelectAlias(subCategory.id)}`,
	);
	const selects = getTopLevelCategorySelectClauses(topLevelCategory);

	return sql`
		SELECT ${sql.join(selects, sql`, `)}
		FROM ${sql.join(subCategorySubSelects, sql`, `)}
	`;
}

/**
 * Get a SQL query that retrieves the combined score for all top-level categories.
 * @example
 * ```
 * SELECT
 *        "top-level-category-scores__food-and-drinks".*,
 *        "top-level-category-scores__public-transport".*,
 *        (0.6 * "top-level-category-scores__food-and-drinks"."sc/food-and-drinks" + 0.4 * "top-level-category-scores__public-transport"."sc/public-transport") AS "score"
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
		(topLevelCategory) =>
			sql`(
				${getTopLevelCategorySubSelect({
					topLevelCategory,
					join,
					where,
					groupBy,
				})}
			) AS ${getTopLevelCategorySubSelectAlias(topLevelCategory.id)}`,
	);
	const selects = getCombinedScoreSelectClauses();

	return sql`
		SELECT ${sql.join(selects, sql`, `)}
		FROM ${sql.join(topLevelCategorySubSelects, sql`, `)}
	`;
}
