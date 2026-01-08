import { eq } from "drizzle-orm";
import type { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";

export type AppDbTransaction = Parameters<
  Parameters<typeof appDb.transaction>[0]
>[0];

export async function createScoreResult(
  tx: AppDbTransaction,
  { adminAreaId }: { adminAreaId: string },
) {
  const [{ scoreId }] = await tx
    .insert(scores)
    .values({ adminAreaId })
    .returning({ scoreId: scores.id });

  return scoreId;
}

export async function updateScoreResult(
  tx: AppDbTransaction,
  scoreId: string,
  {
    score,
    dataQualityFactor,
    unadjustedScore,
  }: {
    score: number;
    dataQualityFactor: number;
    unadjustedScore?: number;
  },
) {
  await tx
    .update(scores)
    .set({ score, dataQualityFactor, unadjustedScore })
    .where(eq(scores.id, scoreId));
}

export async function createTopLevelCategoryScoreResult(
  tx: AppDbTransaction,
  {
    scoreId,
    topLevelCategoryId,
  }: {
    scoreId: string;
    topLevelCategoryId: string;
  },
) {
  const [{ topLevelCategoryScoreId }] = await tx
    .insert(topLevelCategoryScores)
    .values({ scoreId, topLevelCategory: topLevelCategoryId })
    .returning({
      topLevelCategoryScoreId: topLevelCategoryScores.id,
    });

  return topLevelCategoryScoreId;
}

export async function updateTopLevelCategoryScoreResult(
  tx: AppDbTransaction,
  topLevelCategoryScoreId: string,
  {
    score,
    dataQualityFactor,
    unadjustedScore,
  }: {
    score: number;
    dataQualityFactor: number;
    unadjustedScore?: number;
  },
) {
  await tx
    .update(topLevelCategoryScores)
    .set({ score, dataQualityFactor, unadjustedScore })
    .where(eq(topLevelCategoryScores.id, topLevelCategoryScoreId));
}

export async function createSubCategoryScoreResult(
  tx: AppDbTransaction,
  {
    topLevelCategoryScoreId,
    subCategoryId,
  }: {
    topLevelCategoryScoreId: string;
    subCategoryId: string;
  },
) {
  const [{ subCategoryScoreId }] = await tx
    .insert(subCategoryScores)
    .values({ topLevelCategoryScoreId, subCategory: subCategoryId })
    .returning({ subCategoryScoreId: subCategoryScores.id });

  return subCategoryScoreId;
}

export async function updateSubCategoryScoreResult(
  tx: AppDbTransaction,
  subCategoryScoreId: string,
  {
    score,
    dataQualityFactor,
    unadjustedScore,
  }: {
    score: number;
    dataQualityFactor: number;
    unadjustedScore?: number;
  },
) {
  await tx
    .update(subCategoryScores)
    .set({ score, dataQualityFactor, unadjustedScore })
    .where(eq(subCategoryScores.id, subCategoryScoreId));
}

export async function createTopicScoreResult(
  tx: AppDbTransaction,
  {
    subCategoryScoreId,
    topicId,
  }: {
    subCategoryScoreId: string;
    topicId: string;
  },
) {
  const [{ topicScoreId }] = await tx
    .insert(topicScores)
    .values({ subCategoryScoreId, topic: topicId })
    .returning({ topicScoreId: topicScores.id });

  return topicScoreId;
}

export async function updateTopicScoreResult(
  tx: AppDbTransaction,
  topicScoreId: string,
  {
    score,
    dataQualityFactor,
    unadjustedScore,
  }: {
    score: number;
    dataQualityFactor: number;
    unadjustedScore?: number;
  },
) {
  await tx
    .update(topicScores)
    .set({
      score,
      unadjustedScore,
      dataQualityFactor,
    })
    .where(eq(topicScores.id, topicScoreId));
}

export async function createCriterionScoreResult(
  tx: AppDbTransaction,
  {
    topicScoreId,
    criterionId,
    score,
    dataQualityFactor,
    tagCount,
  }: {
    topicScoreId: string;
    criterionId: string;
    score: number;
    dataQualityFactor: number;
    tagCount: number;
  },
) {
  await tx.insert(criterionScores).values({
    topicScoreId,
    criterion: criterionId,
    score,
    dataQualityFactor,
    tagCount,
  });
}
