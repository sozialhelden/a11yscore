import { createHash } from "node:crypto";
import { type SQL, sql } from "drizzle-orm";
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
    return alias.slice(0, 60);
  }
  return createHash("sha1").update(alias).digest("base64");
}

export function getCriterionScoreAlias(
  topicId: TopicId,
  criterionId: CriterionId,
): string {
  return truncate(`score/${topicId}/${criterionId}`);
}

export function getCriterionDataQualityFactorAlias(
  topicId: TopicId,
  criterionId: CriterionId,
): string {
  return truncate(`data-quality/${topicId}/${criterionId}`);
}

export function getCriterionTagCountAlias(
  topicId: TopicId,
  criterionId: CriterionId,
): string {
  return truncate(`tag-count/${topicId}/${criterionId}`);
}
