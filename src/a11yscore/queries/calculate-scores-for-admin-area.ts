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
  minDataQualityFactor,
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
  let sumOfWeights = 0;

  for (const subCategory of getChildCategories(topLevelCategory.id)) {
    const { subCategoryScore, subCategoryDataQualityFactor } =
      await calculateSubCategoryScore(tx, params, {
        topLevelCategoryScoreId,
        subCategory,
      });

    const { weight } = subCategory;
    topLevelCategoryDataQualityFactor = weight * subCategoryDataQualityFactor;

    // if dqf is at its minimum, there is no data available for this sub-category,
    // this means there are no matching places/geometry in the given admin area. so
    // we don't include it in the score computation
    if (subCategoryDataQualityFactor !== minDataQualityFactor) {
      topLevelCategoryScore += weight * subCategoryScore;
      sumOfWeights += weight;
    }
  }

  // We normalize the score by accounting for the weights of the sub-categories
  // that were not included because of missing geometry.
  const normalizedTopLevelCategoryScore = Math.ceil(
    sumOfWeights === 0 ? 0 : (1 / sumOfWeights) * topLevelCategoryScore,
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

  // this actually queries scores from the database. this is done on the sub-category
  // level in order to reduce the number of queries made to the database
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
  let sumOfWeights = 0;

  for (const criterion of topic.criteria) {
    const { criterionScore, criterionDataQualityFactor } =
      await calculateCriterionScore(tx, results, {
        topicScoreId,
        topic,
        criterion,
      });

    const { weight } = criterion;

    // we adjust the overall weight of a single criterion by its data quality factor
    // in order to reduce the impact of low-quality data on the overall topic score
    // also see: https://github.com/sozialhelden/a11yscore/blob/main/docs/architecture/02.scoring-algorithm.md#data-quality-adjusted-weights
    const dataQualityAdjustedWeight = weight * criterionDataQualityFactor;

    sumOfWeights += dataQualityAdjustedWeight;
    topicScore += dataQualityAdjustedWeight * criterionScore;
    topicDataQualityFactor += weight * criterionDataQualityFactor;
  }

  // We normalize the score by accounting for the data-quality adjusted weights which
  // don't sum up to 1 anymore
  const normalizedTopicScore = Math.ceil(
    sumOfWeights === 0 ? 0 : topicScore * (1 / sumOfWeights),
  );

  // we add a "virtual" score component that is based solely on the data quality factor.
  // this ensures to offset negative impacts when new data with a low score is added.
  // also see: https://github.com/sozialhelden/a11yscore/blob/main/docs/architecture/02.scoring-algorithm.md#data-quality-criterion-score
  const dataQualityCriterionScore = 100 * topicDataQualityFactor;
  const finalTopicScore = Math.ceil(
    normalizedTopicScore * 0.8 + 0.2 * dataQualityCriterionScore,
  );

  await tx
    .update(topicScores)
    .set({
      score: finalTopicScore,
      unadjustedScore: Math.ceil(topicScore),
      dataQualityFactor: topicDataQualityFactor,
    })
    .where(eq(topicScores.id, topicScoreId));

  return {
    topicScore: finalTopicScore,
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
  // we query the database once per sub-category and pass down the results multiple levels,
  // in order to minimize the number of queries made to the database
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
