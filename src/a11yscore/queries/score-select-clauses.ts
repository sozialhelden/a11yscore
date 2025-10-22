import { type SQL, sql } from "drizzle-orm";
import {
  type SubCategory,
  type TopLevelCategory,
  type TopLevelCategoryId,
  topLevelCategories,
} from "~~/src/a11yscore/config/categories";
import { criteria } from "~~/src/a11yscore/config/criteria";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  alias,
  getCombinedSubCategoriesSubSelectAlias,
  getCriterionScoreAlias,
  getCriterionSubSelectAlias,
  getScoreAlias,
  getSubCategoryScoreAlias,
  getTopicScoreAlias,
  getTopicSubSelectAlias,
  getTopLevelCategoryScoreAlias,
  getTopLevelCategorySubSelectAlias,
  getTopLevelCategoryWeightNormalizationFactorAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

/**
 * Creates an array of SQL select clauses for all criteria scores in a subcategory.
 * @example
 * ```
 * [
 *   sql`
 *      AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "food-and-drinks/restaurants/mobility/is-wheelchair-accessible"
 *   `,
 *   sql`
 *      AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 *   `,
 * ]
 * ```
 */
export function getCriteriaSelectClauses(
  topLevelCategoryId: TopLevelCategoryId,
  subCategory: SubCategory,
): SQL[] {
  const selects: SQL[] = [];

  for (const { topicId, criteria: criteriaList } of subCategory.topics) {
    for (const { criterionId } of criteriaList) {
      const criterionAlias = alias(
        getCriterionScoreAlias(
          topLevelCategoryId,
          subCategory.id,
          topicId,
          criterionId,
        ),
      );
      selects.push(
        sql`CEIL(${criteria[criterionId].sql(subCategory.sql.from)}) AS ${criterionAlias}`,
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
 *   sql`"criterion-scores__restaurants".*`,
 *   sql`
 *      (
 *            0.7 * "criterion-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/is-wheelchair-accessible"
 *          + 0.3 * "criterion-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility/has-wheelchair-accessible-toilet"
 *      )
 *      AS "food-and-drinks/restaurants/mobility"
 *   `,
 *   sql`
 *      (
 *            0.8 * "criterion-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/smoking-is-prohibited"
 *          + 0.2 * "criterion-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate/has-air-conditioning"
 *      )
 *      AS "food-and-drinks/restaurants/air-and-climate"
 *   `,
 * ]
 * ```
 */
export function getTopicSelectClauses(
  topLevelCategoryId: TopLevelCategoryId,
  subCategory: SubCategory,
): SQL[] {
  const criterionSubSelectAlias = alias(
    getCriterionSubSelectAlias(topLevelCategoryId, subCategory.id),
  );
  const selects: SQL[] = [sql`${criterionSubSelectAlias}.*`];

  for (const { topicId, criteria: criteriaList } of subCategory.topics) {
    const topicAlias = alias(
      getTopicScoreAlias(topLevelCategoryId, subCategory.id, topicId),
    );
    const criteriaWeights: SQL[] = [];

    for (const { criterionId, weight } of criteriaList) {
      const criterionAlias = alias(
        getCriterionScoreAlias(
          topLevelCategoryId,
          subCategory.id,
          topicId,
          criterionId,
        ),
      );

      criteriaWeights.push(
        sql`${sql.raw(String(weight))} * ${criterionSubSelectAlias}.${criterionAlias}`,
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
 * 		sql`"topic-scores__food-and-drinks__restaurants".*`,
 * 		sql`(("topic-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/mobility" + "topic-scores__food-and-drinks__restaurants"."food-and-drinks/restaurants/air-and-climate") / 2) AS "food-and-drinks/restaurants"`
 * ]
 * ```
 */
export function getSubCategorySelectClauses(
  topLevelCategoryId: TopLevelCategoryId,
  subCategory: SubCategory,
): SQL[] {
  const topicSubSelectAlias = alias(
    getTopicSubSelectAlias(topLevelCategoryId, subCategory.id),
  );
  const subCategoryScoreAlias = alias(
    getSubCategoryScoreAlias(topLevelCategoryId, subCategory.id),
  );

  const topics = subCategory.topics.map(({ topicId }) => {
    const topicScoreAlias = alias(
      getTopicScoreAlias(topLevelCategoryId, subCategory.id, topicId),
    );
    return sql`${topicSubSelectAlias}.${topicScoreAlias}`;
  });

  return [
    sql`${topicSubSelectAlias}.*`,
    sql`CEIL((${sql.join(topics, sql` + `)}) / ${sql.raw(String(topics.length))}) AS ${subCategoryScoreAlias}`,
  ];
}

/**
 * Creates an array of SQL select clauses for the combined score of the given top-level category,
 * which is the weighted average of the subcategory scores in that top-level category.
 * This is meant to select from a sub select that gets individual subcategory scores.
 * @example
 * ```
 * [
 *       sql`"sub-category-scores__food-and-drinks__restaurants".*`,
 *       sql`"sub-category-scores__food-and-drinks_cafes".*`,
 *       sql`("sub-category-scores__food-and-drinks"."food-and-drinks--weight-normalization" * (0.7 * "sub-category-scores__food-and-drinks"."food-and-drinks/restaurants" + 0.3 * "sub-category-scores__food-and-drinks"."food-and-drinks/cafes")) AS "food-and-drinks"`
 * ]
 * ```
 */
export function getTopLevelCategorySelectClauses(
  topLevelCategory: TopLevelCategory,
): SQL[] {
  const subCategorySubSelectAlias = alias(
    getCombinedSubCategoriesSubSelectAlias(topLevelCategory.id),
  );
  const weightNormalizationFactorAlias = alias(
    getTopLevelCategoryWeightNormalizationFactorAlias(topLevelCategory.id),
  );
  const topLevelCategoryScoreAlias = alias(
    getTopLevelCategoryScoreAlias(topLevelCategory.id),
  );

  const selects: SQL[] = [];
  const weights: SQL[] = [];

  for (const { id, weight } of getChildCategories(topLevelCategory.id)) {
    const subCategoryScoreAlias = alias(
      getSubCategoryScoreAlias(topLevelCategory.id, id),
    );

    selects.push(sql`${subCategorySubSelectAlias}.*`);
    weights.push(
      sql`COALESCE(${sql.raw(String(weight))} * ${subCategorySubSelectAlias}.${subCategoryScoreAlias}, 0)`,
    );
  }

  selects.push(
    sql`CEIL(
        ${subCategorySubSelectAlias}.${weightNormalizationFactorAlias} 
        * (${sql.join(weights, sql` + `)})
    ) AS ${topLevelCategoryScoreAlias}`,
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
  const scoreAlias = alias(getScoreAlias());

  const selects: SQL[] = [];
  const weights: SQL[] = [];

  for (const { id, weight } of Object.values(topLevelCategories)) {
    const topLevelCategorySubSelectAlias = alias(
      getTopLevelCategorySubSelectAlias(id),
    );
    const topLevelCategoryScoreAlias = alias(getTopLevelCategoryScoreAlias(id));

    selects.push(sql`${topLevelCategorySubSelectAlias}.*`);
    weights.push(
      sql`${sql.raw(String(weight))} * ${topLevelCategorySubSelectAlias}.${topLevelCategoryScoreAlias}`,
    );
  }

  selects.push(sql`CEIL(${sql.join(weights, sql` + `)}) AS ${scoreAlias}`);

  return selects;
}
