import { type SQL, sql } from "drizzle-orm";
import type {
  SubCategoryId,
  TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import type { CriterionId } from "~~/src/a11yscore/config/criteria";
import type { TopicId } from "~~/src/a11yscore/config/topics";

// there is a limit on column name length, so we keep it as compact as possible
// "c" - prefix = criterion score
// "t" - prefix = topic score
// "sc" - prefix = sub category score
// "tc" - prefix = top level category score

export function escapeTableOrColumnAlias(alias: string): SQL {
  return sql.raw(`"${alias.replace(/"/g, "")}"`);
}

export function getCriterionScoreAlias(
  subCategoryId: SubCategoryId,
  topicId: TopicId,
  criterionId: CriterionId,
): string {
  return `c/${subCategoryId}/${topicId}/${criterionId}`;
}

export function getTopicScoreAlias(
  subCategoryId: SubCategoryId,
  topicId: TopicId,
): string {
  return `t/${subCategoryId}/${topicId}`;
}

export function getSubCategoryScoreAlias(subCategoryId: SubCategoryId): string {
  return `sc/${subCategoryId}`;
}

export function getTopLevelCategoryScoreAlias(
  topLevelCategoryId: TopLevelCategoryId,
): string {
  return `tc/${topLevelCategoryId}`;
}

export function getCombinedScoreAlias(): string {
  return "score";
}

export function getCriterionSubSelectAlias(subCategoryId: SubCategoryId): SQL {
  return escapeTableOrColumnAlias(`criterion-scores__${subCategoryId}`);
}

export function getTopicSubSelectAlias(subCategoryId: SubCategoryId): SQL {
  return escapeTableOrColumnAlias(`topic-scores__${subCategoryId}`);
}

export function getSubCategorySubSelectAlias(
  subCategoryId: SubCategoryId,
): SQL {
  return escapeTableOrColumnAlias(`sub-category-scores__${subCategoryId}`);
}

export function getTopLevelCategorySubSelectAlias(
  topLevelCategoryId: TopLevelCategoryId,
): SQL {
  return escapeTableOrColumnAlias(
    `top-level-category-scores__${topLevelCategoryId}`,
  );
}
