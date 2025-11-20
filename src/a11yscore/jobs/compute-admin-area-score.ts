import { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";
import type { ComputeAdminAreaScoreJob } from "~/queue";
import {
  type SubCategory,
  type SubCategoryId,
  type TopLevelCategoryId,
  topLevelCategoryList,
} from "~~/src/a11yscore/config/categories";
import type { TopicId } from "~~/src/a11yscore/config/topics";
import { calculateScoreByAdminArea } from "~~/src/a11yscore/queries/calculate-score-by-admin-area";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  getCriterionScoreAlias,
  getScoreAlias,
  getSubCategoryScoreAlias,
  getTopicScoreAlias,
  getTopLevelCategoryScoreAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

export async function handle(job: ComputeAdminAreaScoreJob) {
  const { adminArea } = job.data;
  const results = await calculateScoreByAdminArea(adminArea.osmId);
  await job.updateProgress(50);
  await appDb.transaction(async (tx) => {
    await persistScore(tx, results, { adminAreaId: adminArea.id });
  });
}

type AppDbTransaction = Parameters<Parameters<typeof appDb.transaction>[0]>[0];
type ScoreQueryResults = Record<string, number>;

async function persistScore(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  { adminAreaId }: { adminAreaId: string },
) {
  const [{ scoreId }] = await tx
    .insert(scores)
    .values({ adminAreaId, score: results[getScoreAlias()] })
    .returning({ scoreId: scores.id });

  await persistTopLevelCategoryScores(tx, results, { scoreId });
}

async function persistTopLevelCategoryScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  { scoreId }: { scoreId: string },
) {
  for (const topLevelCategory of topLevelCategoryList) {
    const [{ topLevelCategoryScoreId }] = await tx
      .insert(topLevelCategoryScores)
      .values({
        scoreId,
        topLevelCategory,
        score: results[getTopLevelCategoryScoreAlias(topLevelCategory)],
      })
      .returning({
        topLevelCategoryScoreId: topLevelCategoryScores.id,
      });

    await persistSubCategoryScores(tx, results, {
      topLevelCategory,
      topLevelCategoryScoreId,
    });
  }
}

async function persistSubCategoryScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    topLevelCategory,
    topLevelCategoryScoreId,
  }: {
    topLevelCategory: TopLevelCategoryId;
    topLevelCategoryScoreId: string;
  },
) {
  for (const { id: subCategory, topics } of getChildCategories(
    topLevelCategory,
  )) {
    const [{ subCategoryScoreId }] = await tx
      .insert(subCategoryScores)
      .values({
        topLevelCategoryScoreId,
        subCategory,
        score: results[getSubCategoryScoreAlias(topLevelCategory, subCategory)],
      })
      .returning({ subCategoryScoreId: subCategoryScores.id });

    await persistTopicScores(tx, results, {
      topLevelCategory,
      subCategory,
      subCategoryScoreId,
      topics,
    });
  }
}

async function persistTopicScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    topLevelCategory,
    subCategory,
    subCategoryScoreId,
    topics,
  }: {
    topLevelCategory: TopLevelCategoryId;
    subCategory: SubCategoryId;
    subCategoryScoreId: string;
    topics: SubCategory["topics"];
  },
) {
  for (const { topicId: topic, criteria } of topics) {
    const [{ topicScoreId }] = await tx
      .insert(topicScores)
      .values({
        subCategoryScoreId,
        topic,
        score:
          results[getTopicScoreAlias(topLevelCategory, subCategory, topic)],
      })
      .returning({ topicScoreId: topicScores.id });

    await persistCriterionScores(tx, results, {
      topic,
      topicScoreId,
      subCategory,
      topLevelCategory,
      criteria,
    });
  }
}

async function persistCriterionScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    topic,
    topicScoreId,
    subCategory,
    topLevelCategory,
    criteria,
  }: {
    topic: TopicId;
    topicScoreId: string;
    subCategory: SubCategoryId;
    topLevelCategory: TopLevelCategoryId;
    criteria: SubCategory["topics"][number]["criteria"];
  },
) {
  for (const { criterionId: criterion } of criteria) {
    await tx.insert(criterionScores).values({
      topicScoreId,
      criterion,
      score:
        results[
          getCriterionScoreAlias(
            topLevelCategory,
            subCategory,
            topic,
            criterion,
          )
        ],
    });
  }
}
