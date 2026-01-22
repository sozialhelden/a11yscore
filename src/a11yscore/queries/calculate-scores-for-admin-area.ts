import { appDb } from "~/db";
import {
  getTopLevelCategoryList,
  type SubCategory,
  type TopLevelCategory,
} from "~~/src/a11yscore/config/categories";
import {
  type AppDbTransaction,
  createCriterionScoreResult,
  createScoreResult,
  createSubCategoryScoreResult,
  createTopicScoreResult,
  createTopLevelCategoryScoreResult,
  updateScoreResult,
  updateSubCategoryScoreResult,
  updateTopicScoreResult,
  updateTopLevelCategoryScoreResult,
} from "~~/src/a11yscore/queries/create-score-result-entries";
import {
  querySubCategoryScores,
  type ScoreQueryResults,
  type SQLSelectParams,
} from "~~/src/a11yscore/queries/query-sub-category-scores";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import { roundDataQualityFactor } from "~~/src/a11yscore/utils/data-quality";
import { createScoreAggregator } from "~~/src/a11yscore/utils/score-aggregator";
import {
  getCriterionDataQualityFactorAlias,
  getCriterionScoreAlias,
  getCriterionTagCountAlias,
} from "~~/src/a11yscore/utils/sql-aliases";

export async function calculateScoresForAdminArea(
  adminAreaId: string,
  params: SQLSelectParams,
) {
  await appDb.transaction(async (tx) => {
    const scoreId = await createScoreResult(tx, { adminAreaId });
    const { add, aggregate } = createScoreAggregator();

    for (const topLevelCategory of getTopLevelCategoryList()) {
      if (topLevelCategory.planned) continue;

      const { topLevelCategoryScore, topLevelCategoryDataQualityFactor } =
        await calculateTopLevelCategoryScore(tx, params, {
          scoreId,
          topLevelCategory,
        });
      add({
        componentScore: topLevelCategoryScore,
        componentDataQualityFactor: topLevelCategoryDataQualityFactor,
        componentWeight: topLevelCategory.weight,
      });
    }

    await updateScoreResult(tx, scoreId, aggregate());
  });
}

/**
 * Top-Level Category
 */
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
  const topLevelCategoryScoreId = await createTopLevelCategoryScoreResult(tx, {
    scoreId,
    topLevelCategoryId: topLevelCategory.id,
  });
  const { add, aggregate } = createScoreAggregator({
    excludeFromScoreWhenDataIsNotAvailable: true,
  });

  for (const subCategory of getChildCategories(topLevelCategory.id)) {
    const { subCategoryScore, subCategoryDataQualityFactor } =
      await calculateSubCategoryScore(tx, params, {
        topLevelCategoryScoreId,
        subCategory,
      });
    add({
      componentScore: subCategoryScore,
      componentDataQualityFactor: subCategoryDataQualityFactor,
      componentWeight: subCategory.weight,
    });
  }

  const { score, dataQualityFactor, unadjustedScore } = aggregate();

  await updateTopLevelCategoryScoreResult(tx, topLevelCategoryScoreId, {
    score,
    dataQualityFactor,
  });

  return {
    topLevelCategoryScore: score,
    topLevelCategoryDataQualityFactor: dataQualityFactor,
    unadjustedScore,
  };
}

/**
 * Sub Category
 */
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
  const subCategoryScoreId = await createSubCategoryScoreResult(tx, {
    topLevelCategoryScoreId,
    subCategoryId: subCategory.id,
  });
  const { add, aggregate } = createScoreAggregator();

  // this actually queries scores from the database. this is done on the sub-category
  // level in order to reduce the number of queries made to the database
  const results = await querySubCategoryScores(subCategory, params);

  for (const topic of subCategory.topics) {
    const { topicScore, topicDataQualityFactor } = await calculateTopicScore(
      tx,
      results,
      {
        subCategoryScoreId,
        topic,
      },
    );
    add({
      componentScore: topicScore,
      componentDataQualityFactor: topicDataQualityFactor,
    });
  }

  const { score, dataQualityFactor, unadjustedScore } = aggregate();

  await updateSubCategoryScoreResult(tx, subCategoryScoreId, {
    score,
    dataQualityFactor,
  });

  return {
    subCategoryScore: score,
    subCategoryDataQualityFactor: dataQualityFactor,
    unadjustedScore,
  };
}

/**
 * Topic
 */
async function calculateTopicScore(
  tx: AppDbTransaction,
  results: ScoreQueryResults,
  {
    subCategoryScoreId,
    topic,
  }: { subCategoryScoreId: string; topic: SubCategory["topics"][number] },
) {
  const topicScoreId = await createTopicScoreResult(tx, {
    subCategoryScoreId,
    topicId: topic.topicId,
  });
  const { add, aggregate } = createScoreAggregator({
    adjustWeightsByDataQuality: true,
  });

  for (const criterion of topic.criteria) {
    const { criterionScore, criterionDataQualityFactor } =
      await calculateCriterionScore(tx, results, {
        topicScoreId,
        topic,
        criterion,
      });
    add({
      componentScore: criterionScore,
      componentDataQualityFactor: criterionDataQualityFactor,
      componentWeight: criterion.weight,
    });
  }

  let score: number | null;

  const {
    score: preliminaryScore,
    dataQualityFactor,
    unadjustedScore,
  } = aggregate();

  score = preliminaryScore;

  if (preliminaryScore !== null) {
    // we add a "virtual" score component that is based solely on the data quality factor.
    // this ensures to offset negative impacts when a lot of new data with a low score is added.
    // also see: https://github.com/sozialhelden/a11yscore/blob/main/docs/architecture/02.scoring-algorithm.md#data-quality-criterion-score

    const additionalScoreComponents = createScoreAggregator();
    additionalScoreComponents.add({
      componentScore: preliminaryScore,
      componentWeight: 0.8,
    });
    additionalScoreComponents.add({
      componentScore: 100 * dataQualityFactor,
      componentWeight: 0.2,
    });
    score = additionalScoreComponents.aggregate().score;
  }

  await updateTopicScoreResult(tx, topicScoreId, {
    score,
    dataQualityFactor,
    unadjustedScore,
  });

  return {
    topicScore: score,
    topicDataQualityFactor: dataQualityFactor,
  };
}

/**
 * Criterion
 */
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
  const score =
    result[getCriterionScoreAlias(topic.topicId, criterion.criterionId)];
  const dataQualityFactor = roundDataQualityFactor(
    result[
      getCriterionDataQualityFactorAlias(topic.topicId, criterion.criterionId)
    ],
  );
  const tagCount =
    result[getCriterionTagCountAlias(topic.topicId, criterion.criterionId)];

  await createCriterionScoreResult(tx, {
    topicScoreId,
    criterionId: criterion.criterionId,
    score,
    dataQualityFactor,
    tagCount,
  });

  return {
    criterionScore: score,
    criterionDataQualityFactor: dataQualityFactor,
  };
}
