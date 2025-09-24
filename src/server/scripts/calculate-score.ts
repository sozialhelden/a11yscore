import { appDb } from "~/db";
import { calculateScoreByAdminArea } from "~/db/queries/calculateScoreByAdminArea";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  toplevelCategoryScores,
} from "~/db/schema/app";
import { allowedAdminAreas } from "~~/src/config";
import {
  type SubCategory,
  type SubCategoryId,
  type TopLevelCategoryId,
  topLevelCategoryList,
} from "~~/src/score/categories";
import type { TopicId } from "~~/src/score/topics";
import { getChildCategories } from "~~/src/score/utils/categories";
import {
  getCombinedScoreAlias,
  getCriterionScoreAlias,
  getSubCategoryScoreAlias,
  getTopicScoreAlias,
  getTopLevelCategoryScoreAlias,
} from "~~/src/score/utils/sql-aliases";

type AppDbTransaction = Parameters<Parameters<typeof appDb.transaction>[0]>[0];
type ScoreQueryResults = Record<string, number>;

// TODO: replace this with a proper task management system like Bull or Bree
//  that supports monitoring, retries, concurrency, etc.
calculate()
  .catch((error) => console.error(error))
  .then(() => console.info("Score calculation task completed."));

async function calculate() {
  const batchSize = 4;

  for (let i = 0; i < allowedAdminAreas.length; i += batchSize) {
    await Promise.all(
      allowedAdminAreas
        .slice(i, i + batchSize)
        .map(async ({ id: adminAreaId, name }) => {
          const startCalculation = new Date();
          console.info(
            `[${name}] Started calculation for admin-area "${adminAreaId}"`,
          );
          const results = await calculateScoreByAdminArea(adminAreaId);
          console.info(
            `[${name}] Calculation finished, took ${Math.ceil((Date.now() - startCalculation.getTime()) / 1000)}s`,
          );

          const startPersisting = new Date();
          console.info(`[${name}] Persisting scores...`);
          await appDb.transaction(async (tx) => {
            await persistScore(tx, results, { adminAreaId });
          });
          console.info(
            `[${name}] Scores persisted, took ${Math.ceil((Date.now() - startPersisting.getTime()) / 1000)}s`,
          );
        }),
    );
  }
}

async function persistScore(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  { adminAreaId }: { adminAreaId: number },
) {
  const [{ scoreId }] = await tx
    .insert(scores)
    .values({ adminAreaId, score: results[getCombinedScoreAlias()] })
    .returning({ scoreId: scores.id });

  await persistTopLevelCategoryScores(tx, results, { scoreId });
}

async function persistTopLevelCategoryScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  { scoreId }: { scoreId: string },
) {
  for (const toplevelCategory of topLevelCategoryList) {
    const [{ toplevelCategoryScoreId }] = await tx
      .insert(toplevelCategoryScores)
      .values({
        scoreId,
        toplevelCategory,
        score: results[getTopLevelCategoryScoreAlias(toplevelCategory)],
      })
      .returning({
        toplevelCategoryScoreId: toplevelCategoryScores.id,
      });

    await persistSubCategoryScores(tx, results, {
      toplevelCategory,
      toplevelCategoryScoreId,
    });
  }
}

async function persistSubCategoryScores(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    toplevelCategory,
    toplevelCategoryScoreId,
  }: {
    toplevelCategory: TopLevelCategoryId;
    toplevelCategoryScoreId: string;
  },
) {
  for (const { id: subCategory, topics } of getChildCategories(
    toplevelCategory,
  )) {
    const [{ subCategoryScoreId }] = await tx
      .insert(subCategoryScores)
      .values({
        toplevelCategoryScoreId,
        subCategory,
        score: results[getSubCategoryScoreAlias(subCategory)],
      })
      .returning({ subCategoryScoreId: subCategoryScores.id });

    await persistTopicScores(tx, results, {
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
    subCategory,
    subCategoryScoreId,
    topics,
  }: {
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
        score: results[getTopicScoreAlias(subCategory, topic)],
      })
      .returning({ topicScoreId: topicScores.id });

    await persistCriterionScores(tx, results, {
      topic,
      topicScoreId,
      subCategory,
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
    criteria,
  }: {
    topic: TopicId;
    topicScoreId: string;
    subCategory: SubCategoryId;
    criteria: SubCategory["topics"][number]["criteria"];
  },
) {
  for (const { criterionId: criterion } of criteria) {
    await tx.insert(criterionScores).values({
      topicScoreId,
      criterion,
      score: results[getCriterionScoreAlias(subCategory, topic, criterion)],
    });
  }
}
