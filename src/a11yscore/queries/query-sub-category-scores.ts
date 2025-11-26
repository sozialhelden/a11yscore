import { type SQL, sql } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { osmSyncDb } from "~/db";
import type { OSMTag, SubCategory } from "~~/src/a11yscore/config/categories";
import { criteria } from "~~/src/a11yscore/config/criteria";
import {
  alias,
  getCriterionDataQualityFactorAlias,
  getCriterionScoreAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

export type ScoreQueryResults = Record<string, number>;
export type SQLSelectParams = {
  join?: SQL[];
  where?: SQL[];
  groupBy?: SQL[];
};

export const minDataQualityFactor = 0.2;

/**
 * Queries scores for all criteria in a given subcategory. Use the SQL select parameters
 * to filter or group the results as needed.
 */
export async function querySubCategoryScores(
  subCategory: SubCategory,
  sqlSelectParams: SQLSelectParams,
): Promise<ScoreQueryResults> {
  const joins = [...(sqlSelectParams.join || []), subCategory.sql.join].filter(
    Boolean,
  );

  const wheres = [
    ...(sqlSelectParams.where || []),
    subCategory.sql.where,
  ].filter(Boolean);

  const groupBys = [
    ...(sqlSelectParams.groupBy || []),
    subCategory.sql.groupBy,
  ].filter(Boolean);

  const selects = [
    ...(sqlSelectParams.groupBy || []),
    ...getCriteriaSelectClauses(subCategory),
    subCategory.sql.groupBy,
  ].filter(Boolean);

  const statement = sql`
    SELECT ${sql.join(selects, sql`, `)} 
    FROM ${subCategory.sql.from} 
    ${sql.join(joins, sql`\n`)}
    ${wheres.length ? sql`WHERE ${sql.join(wheres, sql` AND `)}` : sql.empty()}
    ${groupBys.length ? sql`GROUP BY ${sql.join(groupBys, sql` AND `)}` : sql.empty()}
  `;

  try {
    return (
      await osmSyncDb.execute(statement)
    ).rows.shift() as ScoreQueryResults;
  } catch (error) {
    console.error("Error querying sub category scores", error);
  }
}

/**
 * Creates an array of SQL select clauses for all criteria scores in a subcategory.
 * @example
 * ```
 * [
 *   sql`
 *      AVG( CASE "osm_amenities"."wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "mobility/is-wheelchair-accessible"
 *   `,
 *   sql`
 *      AVG( CASE "osm_amenities"."toilets:wheelchair" = 'yes' THEN 100 ELSE 0 END )::bigint
 *          AS "mobility/has-wheelchair-accessible-toilet"
 *   `,
 * ]
 * ```
 */
export function getCriteriaSelectClauses(subCategory: SubCategory): SQL[] {
  const selects: SQL[] = [];

  for (const { topicId, criteria: criteriaList } of subCategory.topics) {
    for (const { criterionId } of criteriaList) {
      const criterionAlias = alias(
        getCriterionScoreAlias(topicId, criterionId),
      );
      const dataQualityFactorAlias = alias(
        getCriterionDataQualityFactorAlias(topicId, criterionId),
      );

      const table = subCategory.sql.from;
      const criterionProperties = criteria[criterionId];

      selects.push(
        sql`CEIL(${criterionProperties.sql(table)}) AS ${criterionAlias}`,
        sql`${
          criterionProperties.dataQualitySql
            ? criterionProperties.dataQualitySql(table)
            : getDataQualityFactorSql(table, criterionProperties.osmTags)
        } AS ${dataQualityFactorAlias}`,
      );
    }
  }

  return selects;
}

/**
 * Generates SQL to calculate the data quality factor based on the presence of given OSM tags.
 */
export function getDataQualityFactorSql(
  table: PgTableWithColumns<any>,
  osmTags: OSMTag[],
) {
  return sql<number>`
      -- Coalesce takes care to zero it, even if the math operation returns null (e.g. no rows)
      (COALESCE(
        (
            SUM(CASE ${sql.join(
              osmTags.map(
                ({ key, value }) =>
                  sql`WHEN ${table.tags}->'${sql.raw(key)}' = '${sql.raw(value)}' THEN 1`,
              ),
              sql` `,
            )} ELSE 0 END)::float 
            / COUNT(*)::float
        ), 
        0
      ) * ${sql.raw(String(1 - minDataQualityFactor))} + ${sql.raw(String(minDataQualityFactor))})
  `;
}
