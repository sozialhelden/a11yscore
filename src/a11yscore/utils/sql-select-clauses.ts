import { type SQL, sql } from "drizzle-orm";
import {
  type SubCategory,
  type TopLevelCategory,
  topLevelCategories,
} from "~~/src/a11yscore/config/categories";
import { criteria } from "~~/src/a11yscore/config/criteria";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  escapeTableOrColumnAlias,
  getCombinedScoreAlias,
  getCriterionScoreAlias,
  getCriterionSubSelectAlias,
  getSubCategoryScoreAlias,
  getSubCategorySubSelectAlias,
  getTopicScoreAlias,
  getTopicSubSelectAlias,
  getTopLevelCategoryScoreAlias,
  getTopLevelCategorySubSelectAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

/**
 * Creates an array of SQL select clauses for all criteria scores in a subcategory.
 * @example
 * ```
 * [
 *   sql`
 *      AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *      AS "c/mobility/is-wheelchair-accessible"
 *   `,
 *   sql`
 *      AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *      AS "c/mobility/has-wheelchair-accessible-toilet"
 *   `,
 * ]
 * ```
 */
export function getCriteriaSelectClauses(subCategory: SubCategory): SQL[] {
  const selects: SQL[] = [];

  for (const { topicId, criteria: criteriaList } of subCategory.topics) {
    for (const { criterionId } of criteriaList) {
      const criteriaAlias = escapeTableOrColumnAlias(
        getCriterionScoreAlias(subCategory.id, topicId, criterionId),
      );
      selects.push(
        sql`CEIL(${criteria[criterionId].sql(subCategory.sql.from)}) AS ${criteriaAlias}`,
      );
    }
  }

  return selects;
}

/**
 * Creates an array of SQL select clauses for all topic scores in a subcategory,
 * which is the weighted average of the criteria scores in each individual topic.
 * This is meant to select from a sub select that gets individual criteria scores.
 * @example
 * ```
 * [
 *   sql`"criteria-scores__restaurants".*`,
 *   sql`
 *      (
 *            0.7 * "criteria-scores__restaurants"."c/mobility/is-wheelchair-accessible"
 *          + 0.3 * "criteria-scores__restaurants"."c/mobility/has-wheelchair-accessible-toilet"
 *      )
 *      AS "t/restaurants/mobility"
 *   `,
 *   sql`
 *      (
 *            0.8 * "criteria-scores__restaurants"."c/air-and-climate/smoking-is-prohibited"
 *          + 0.2 * "criteria-scores__restaurants"."c/air-and-climate/has-air-conditioning"
 *      )
 *      AS "t/restaurants/air-and-climate"
 *   `,
 * ]
 * ```
 */
export function getTopicSelectClauses(subCategory: SubCategory): SQL[] {
  const criteriaSubSelectAlias = getCriterionSubSelectAlias(subCategory.id);
  const selects: SQL[] = [sql`${criteriaSubSelectAlias}.*`];

  for (const { topicId, criteria: criteriaList } of subCategory.topics) {
    const topicAlias = escapeTableOrColumnAlias(
      getTopicScoreAlias(subCategory.id, topicId),
    );
    const criteriaWeights: SQL[] = [];
    for (const { criterionId, weight } of criteriaList) {
      const criteriaAlias = escapeTableOrColumnAlias(
        getCriterionScoreAlias(subCategory.id, topicId, criterionId),
      );
      criteriaWeights.push(
        sql`${sql.raw(String(weight))} * ${criteriaSubSelectAlias}.${criteriaAlias}`,
      );
    }
    selects.push(
      sql`CEIL(${sql.join(criteriaWeights, sql` + `)}) AS ${topicAlias}`,
    );
  }

  return selects;
}

/**
 * Creates an array of SQL select clauses for the combined score of the given subcategory,
 * which is an unweighted average of the topic scores in that subcategory.
 * This is meant to select from a sub select that gets individual topic scores.
 * @example
 * ```
 * [
 * 		sql`"sub-category-scores__restaurants".*`,
 * 		sql`(("topic-scores__restaurants"."t/restaurants/mobility" + "topic-scores__restaurants"."t/restaurants/air-and-climate") / 2) AS "sc/restaurants"`
 * ]
 * ```
 */
export function getSubCategorySelectClauses(subCategory: SubCategory): SQL[] {
  const topicSubSelectAlias = getTopicSubSelectAlias(subCategory.id);

  const topics = subCategory.topics.map(
    ({ topicId }) =>
      sql`${topicSubSelectAlias}.${escapeTableOrColumnAlias(getTopicScoreAlias(subCategory.id, topicId))}`,
  );

  return [
    sql`${topicSubSelectAlias}.*`,
    sql`CEIL((${sql.join(topics, sql` + `)}) / ${sql.raw(String(topics.length))}) AS ${escapeTableOrColumnAlias(getSubCategoryScoreAlias(subCategory.id))}`,
  ];
}

/**
 * Creates an array of SQL select clauses for the combined score of the given top-level category,
 * which is the weighted average of the subcategory scores in that top-level category.
 * This is meant to select from a sub select that gets individual subcategory scores.
 * @example
 * ```
 * [
 *       sql`"sub-category-scores__restaurants".*`,
 *       sql`"sub-category-scores__cafes".*`,
 *       sql`(0.7 * "sub-category-scores__restaurants"."sc/restaurants" + 0.3 * "sub-category-scores__cafes"."sc/cafes") AS "tc/food-and-drinks"`
 * ]
 * ```
 */
export function getTopLevelCategorySelectClauses(
  topLevelCategory: TopLevelCategory,
): SQL[] {
  const selects: SQL[] = [];
  const weights: SQL[] = [];

  for (const { id, weight } of getChildCategories(topLevelCategory.id)) {
    const subCategorySubSelectAlias = getSubCategorySubSelectAlias(id);
    selects.push(sql`${subCategorySubSelectAlias}.*`);
    weights.push(
      sql`${sql.raw(String(weight))} * ${subCategorySubSelectAlias}.${escapeTableOrColumnAlias(getSubCategoryScoreAlias(id))}`,
    );
  }

  selects.push(
    sql`CEIL(${sql.join(weights, sql` + `)}) AS ${escapeTableOrColumnAlias(getTopLevelCategoryScoreAlias(topLevelCategory.id))}`,
  );

  return selects;
}

/**
 * Creates an array of SQL select clauses for the overall combined score,
 * which is the weighted average of all toplevel category scores.
 * This is meant to select from a sub select that gets individual top-level category scores.
 * @example
 * ```
 * [
 *       sql`"top-level-category-scores__food-and-drinks".*`,
 *       sql`"top-level-category-scores__public-transport".*`,
 *       sql`(0.6 * "top-level-category-scores__food-and-drinks"."tc/food-and-drinks" + 0.4 * "top-level-category-scores__public-transport"."tc/public-transport") AS "score"`
 * ]
 * ```
 */
export function getCombinedScoreSelectClauses(): SQL[] {
  const selects: SQL[] = [];
  const weights: SQL[] = [];

  for (const { id, weight } of Object.values(topLevelCategories)) {
    const topLevelCategorySubSelectAlias =
      getTopLevelCategorySubSelectAlias(id);
    selects.push(sql`${topLevelCategorySubSelectAlias}.*`);
    weights.push(
      sql`${sql.raw(String(weight))} * ${topLevelCategorySubSelectAlias}.${escapeTableOrColumnAlias(getTopLevelCategoryScoreAlias(id))}`,
    );
  }

  selects.push(
    sql`CEIL(${sql.join(weights, sql` + `)}) AS ${escapeTableOrColumnAlias(getCombinedScoreAlias())}`,
  );

  return selects;
}
