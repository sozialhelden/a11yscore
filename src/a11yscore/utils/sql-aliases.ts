import { createHash } from "node:crypto";
import { type SQL, sql } from "drizzle-orm";
import type {
  SubCategoryId,
  TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import type { CriterionId } from "~~/src/a11yscore/config/criteria";
import type { TopicId } from "~~/src/a11yscore/config/topics";

/**
 * Escape the alias to be used in SQL queries.
 * @param alias
 */
export function alias(alias: string): SQL {
  return sql.raw(`"${alias.replace(/"/g, "")}"`);
}

/**
 * There is a limit on the length of SQL aliases (63 characters in Postgres)
 * So, this function is used to truncate aliases to a safe length.
 * @param alias
 */
export function truncate(alias: string): string {
  if (process.env.NITRO_DEBUG === "true") {
    return alias.slice(0, 59);
  }
  return createHash("sha1").update(alias).digest("base64");
}

/*
 * Score Aliases
 */

export function getCriterionScoreAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
  topicId: TopicId,
  criterionId: CriterionId,
): string {
  return truncate(
    `${topLevelCategoryId}/${subCategoryId}/${topicId}/${criterionId}`,
  );
}

export function getTopicScoreAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
  topicId: TopicId,
): string {
  return truncate(`${topLevelCategoryId}/${subCategoryId}/${topicId}`);
}

export function getSubCategoryScoreAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
): string {
  return truncate(`${topLevelCategoryId}/${subCategoryId}`);
}

export function getTopLevelCategoryScoreAlias(
  topLevelCategoryId: TopLevelCategoryId,
): string {
  return truncate(`${topLevelCategoryId}`);
}

export function getScoreAlias(): string {
  return truncate("score");
}

/*
 * Factor aliases
 */

export function getTopLevelCategoryWeightNormalizationFactorAlias(
  topLevelCategoryId: TopLevelCategoryId,
): string {
  return truncate(`${topLevelCategoryId}--weight-normalization`);
}

/*
 * Sub Select Aliases
 */

export function getCriterionSubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
): string {
  return truncate(`criterion-scores__${topLevelCategoryId}__${subCategoryId}`);
}

export function getTopicSubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
): string {
  return truncate(`topic-scores__${topLevelCategoryId}__${subCategoryId}`);
}

export function getSubCategorySubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
  subCategoryId: SubCategoryId,
): string {
  return truncate(
    `sub-category-scores__${topLevelCategoryId}__${subCategoryId}`,
  );
}

export function getCombinedSubCategoriesSubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
): string {
  return truncate(`sub-category-scores__${topLevelCategoryId}`);
}

export function getTopLevelCategorySubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
): string {
  return truncate(`top-level-category-scores__${topLevelCategoryId}`);
}
