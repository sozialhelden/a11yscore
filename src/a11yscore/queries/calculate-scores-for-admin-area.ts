import { eq } from "drizzle-orm";
import { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";
import {
  type SubCategory,
  type TopLevelCategory,
  topLevelCategories,
} from "~~/src/a11yscore/config/categories";
import {
  querySubCategoryScores,
  type ScoreQueryResults,
  type SQLSelectParams,
} from "~~/src/a11yscore/queries/query-sub-category-scores";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  getCriterionDataQualityFactorAlias,
  getCriterionScoreAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

type AppDbTransaction = Parameters<Parameters<typeof appDb.transaction>[0]>[0];

export async function calculateScoresForAdminArea(
  adminAreaId: string,
  params: SQLSelectParams,
) {
  await appDb.transaction(async (tx) => {
    const [{ scoreId }] = await tx
      .insert(scores)
      .values({ adminAreaId })
      .returning({ scoreId: scores.id });

    let score = 0;
    let dataQualityFactor = 0;

    for (const topLevelCategory of Object.values(topLevelCategories)) {
      const { topLevelCategoryScore, topLevelCategoryDataQualityFactor } =
        await calculateTopLevelCategoryScore(tx, params, {
          scoreId,
          topLevelCategory,
        });

      const { weight } = topLevelCategory;
      score += weight * topLevelCategoryScore;
      dataQualityFactor += weight * topLevelCategoryDataQualityFactor;
    }

    const normalizedScore = Math.ceil(score);

    await tx
      .update(scores)
      .set({ score: normalizedScore, dataQualityFactor })
      .where(eq(scores.id, scoreId));
  });
}

async function calculateTopLevelCategoryScore(
  tx: AppDbTransaction,
  params: SQLSelectParams,
  {
    scoreId,
    topLevelCategory,
  }: {
    scoreId: string;
    topLevelCategory: TopLevelCategory;
  },
) {
  const [{ topLevelCategoryScoreId }] = await tx
    .insert(topLevelCategoryScores)
    .values({ scoreId, topLevelCategory: topLevelCategory.id })
    .returning({
      topLevelCategoryScoreId: topLevelCategoryScores.id,
    });

  let topLevelCategoryScore = 0;
  let topLevelCategoryDataQualityFactor = 0;
  let weightsUsedInCalculation = 0;

  for (const subCategory of getChildCategories(topLevelCategory.id)) {
    const { subCategoryScore, subCategoryDataQualityFactor } =
      await calculateSubCategoryScore(tx, params, {
        topLevelCategoryScoreId,
        subCategory,
      });

    const { weight } = subCategory;
    topLevelCategoryDataQualityFactor = weight * subCategoryDataQualityFactor;

    // if dqf is 0, there is no data available for this sub-category, this means
    // there are no matching places/geometry in the given admin area. so we don't
    // include it in the score computation
    if (subCategoryDataQualityFactor !== 0) {
      topLevelCategoryScore += weight * subCategoryScore;
      weightsUsedInCalculation += weight;
    }
  }

  // We normalize the score by accounting for the weights of the sub-categories
  // that were not included because of missing geometry.
  const normalizedTopLevelCategoryScore = Math.ceil(
    (1 / weightsUsedInCalculation) * topLevelCategoryScore,
  );

  await tx
    .update(topLevelCategoryScores)
    .set({
      score: normalizedTopLevelCategoryScore,
      dataQualityFactor: topLevelCategoryDataQualityFactor,
    })
    .where(eq(topLevelCategoryScores.id, topLevelCategoryScoreId));

  return {
    topLevelCategoryScore: normalizedTopLevelCategoryScore,
    topLevelCategoryDataQualityFactor,
  };
}

async function calculateSubCategoryScore(
  tx: AppDbTransaction,
  params: SQLSelectParams,
  {
    topLevelCategoryScoreId,
    subCategory,
  }: {
    topLevelCategoryScoreId: string;
    subCategory: SubCategory;
  },
) {
  const [{ subCategoryScoreId }] = await tx
    .insert(subCategoryScores)
    .values({ topLevelCategoryScoreId, subCategory: subCategory.id })
    .returning({ subCategoryScoreId: subCategoryScores.id });

  // this actually queries scores from the database
  const results = await querySubCategoryScores(subCategory, params);

  let subCategoryScore = 0;
  let subCategoryDataQualityFactor = 0;

  for (const topic of subCategory.topics) {
    const { topicScore, topicDataQualityFactor } = await calculateTopicScore(
      tx,
      results,
      {
        subCategoryScoreId,
        topic,
      },
    );

    const topicCount = subCategory.topics.length;
    subCategoryScore += topicScore / topicCount;
    subCategoryDataQualityFactor += topicDataQualityFactor / topicCount;
  }

  const normalizedSubCategoryScore = Math.ceil(subCategoryScore);

  await tx
    .update(subCategoryScores)
    .set({
      score: normalizedSubCategoryScore,
      dataQualityFactor: subCategoryDataQualityFactor,
    })
    .where(eq(subCategoryScores.id, subCategoryScoreId));

  return {
    subCategoryScore: normalizedSubCategoryScore,
    subCategoryDataQualityFactor,
  };
}

async function calculateTopicScore(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    subCategoryScoreId,
    topic,
  }: { subCategoryScoreId: string; topic: SubCategory["topics"][number] },
) {
  const [{ topicScoreId }] = await tx
    .insert(topicScores)
    .values({ subCategoryScoreId, topic: topic.topicId })
    .returning({ topicScoreId: topicScores.id });

  let topicScore = 0;
  let topicDataQualityFactor = 0;

  for (const criterion of topic.criteria) {
    const { criterionScore, criterionDataQualityFactor } =
      await calculateCriterionScore(tx, results, {
        topicScoreId,
        topic,
        criterion,
      });

    const { weight } = criterion;
    topicScore += weight * criterionScore;
    topicDataQualityFactor += weight * criterionDataQualityFactor;
  }

  const normalizedTopicScore = Math.ceil(topicScore);

  await tx
    .update(topicScores)
    .set({
      score: normalizedTopicScore,
      dataQualityFactor: topicDataQualityFactor,
    })
    .where(eq(topicScores.id, topicScoreId));

  return {
    topicScore: normalizedTopicScore,
    topicDataQualityFactor,
  };
}

async function calculateCriterionScore(
  tx: AppDbTransaction,
  result: ScoreQueryResults,
  {
    topicScoreId,
    topic,
    criterion,
  }: {
    topicScoreId: string;
    topic: SubCategory["topics"][number];
    criterion: SubCategory["topics"][number]["criteria"][number];
  },
) {
  const criterionScore =
    result[getCriterionScoreAlias(topic.topicId, criterion.criterionId)];
  const criterionDataQualityFactor =
    result[
      getCriterionDataQualityFactorAlias(topic.topicId, criterion.criterionId)
    ];

  await tx.insert(criterionScores).values({
    topicScoreId,
    criterion: criterion.criterionId,
    score: criterionScore,
    dataQualityFactor: criterionDataQualityFactor,
  });

  return {
    criterionScore,
    criterionDataQualityFactor,
  };
}
