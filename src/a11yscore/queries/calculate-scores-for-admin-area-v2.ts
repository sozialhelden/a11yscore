import pLimit from "p-limit";
import type { appDb as appDbInstance } from "~/db";
import { scoreReadConcurrency } from "~/db/env";
import {
  getTopLevelCategoryList,
  type SubCategory,
} from "~~/src/a11yscore/config/categories";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";
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

// Use the same type as the appDb instance so any Drizzle instance with the app schema works
type AppDb = typeof appDbInstance;

// ─── In-memory result types ─────────────────────────────────────────────────

type CriterionResult = {
  criterionId: string;
  score: number;
  dataQualityFactor: number;
  tagCount: number;
};

type TopicResult = {
  topicId: string;
  score: number | null;
  dataQualityFactor: number;
  unadjustedScore?: number;
  criteria: CriterionResult[];
};

type SubCategoryResult = {
  subCategoryId: string;
  parentTopLevelCategoryId: string;
  score: number | null;
  dataQualityFactor: number;
  unadjustedScore?: number;
  weight: number;
  topics: TopicResult[];
};

type TopLevelCategoryResult = {
  topLevelCategoryId: string;
  score: number | null;
  dataQualityFactor: number;
  unadjustedScore?: number;
  weight: number;
  subCategories: SubCategoryResult[];
};

type OverallResult = {
  score: number | null;
  dataQualityFactor: number;
  unadjustedScore?: number;
  topLevelCategories: TopLevelCategoryResult[];
};

// ─── Read phase ─────────────────────────────────────────────────────────────

/**
 * Fire all sub-category queries in parallel with controlled concurrency,
 * then aggregate scores in memory using the existing createScoreAggregator.
 */
async function readAndComputeScores(
  params: SQLSelectParams,
): Promise<OverallResult> {
  const topLevelCategories = getTopLevelCategoryList().filter(
    (c) => !c.planned,
  );

  // Collect all sub-categories with their parent info
  const allSubCategories = topLevelCategories.flatMap((tlc) =>
    getChildCategories(tlc.id).map((sc) => ({
      topLevelCategory: tlc,
      subCategory: sc,
    })),
  );

  // Parallel read phase with concurrency limit
  const limit = pLimit(scoreReadConcurrency);

  const queryPromises = allSubCategories.map(({ subCategory }) =>
    limit(() => querySubCategoryScores(subCategory, params)),
  );

  const settledResults = await Promise.allSettled(queryPromises);

  // Check for failures
  const failures: { subCategoryId: string; reason: unknown }[] = [];
  const queryResults: ScoreQueryResults[] = [];

  for (let i = 0; i < settledResults.length; i++) {
    const result = settledResults[i];
    if (result.status === "rejected") {
      failures.push({
        subCategoryId: allSubCategories[i].subCategory.id,
        reason: result.reason,
      });
    } else {
      queryResults.push(result.value);
    }
  }

  if (failures.length > 0) {
    const failedIds = failures.map((f) => f.subCategoryId).join(", ");
    console.error(
      `Score computation failed for sub-categories: ${failedIds}`,
      failures.map((f) => f.reason),
    );
    throw new AggregateError(
      failures.map((f) =>
        f.reason instanceof Error ? f.reason : new Error(String(f.reason)),
      ),
      `${failures.length} sub-category queries failed: ${failedIds}`,
    );
  }

  // ─── Aggregation phase (all in-memory, same logic as V1) ──────────────

  const topLevelCategoryResults: TopLevelCategoryResult[] = [];
  const overallAggregator = createScoreAggregator();

  // Group query results by top-level category
  let resultIndex = 0;

  for (const tlc of topLevelCategories) {
    const childCategories = getChildCategories(tlc.id);
    const tlcAggregator = createScoreAggregator({
      excludeFromScoreWhenDataIsNotAvailable: true,
    });

    const subCategoryResults: SubCategoryResult[] = [];

    for (const subCategory of childCategories) {
      const result = queryResults[resultIndex++];
      const scResult = computeSubCategoryScore(subCategory, result);
      subCategoryResults.push(scResult);

      tlcAggregator.add({
        componentScore: scResult.score,
        componentDataQualityFactor: scResult.dataQualityFactor,
        componentWeight: subCategory.weight,
      });
    }

    const {
      score: tlcScore,
      dataQualityFactor: tlcDq,
      unadjustedScore: tlcUnadjusted,
    } = tlcAggregator.aggregate();

    const tlcResult: TopLevelCategoryResult = {
      topLevelCategoryId: tlc.id,
      score: tlcScore,
      dataQualityFactor: tlcDq,
      unadjustedScore: tlcUnadjusted,
      weight: tlc.weight,
      subCategories: subCategoryResults,
    };

    topLevelCategoryResults.push(tlcResult);

    overallAggregator.add({
      componentScore: tlcScore,
      componentDataQualityFactor: tlcDq,
      componentWeight: tlc.weight,
    });
  }

  const {
    score: overallScore,
    dataQualityFactor: overallDq,
    unadjustedScore: overallUnadjusted,
  } = overallAggregator.aggregate();

  return {
    score: overallScore,
    dataQualityFactor: overallDq,
    unadjustedScore: overallUnadjusted,
    topLevelCategories: topLevelCategoryResults,
  };
}

function computeSubCategoryScore(
  subCategory: SubCategory,
  result: ScoreQueryResults,
): SubCategoryResult {
  const scAggregator = createScoreAggregator();
  const topics: TopicResult[] = [];

  for (const topic of subCategory.topics) {
    const topicResult = computeTopicScore(topic, result);
    topics.push(topicResult);

    scAggregator.add({
      componentScore: topicResult.score,
      componentDataQualityFactor: topicResult.dataQualityFactor,
    });
  }

  const { score, dataQualityFactor, unadjustedScore } =
    scAggregator.aggregate();

  return {
    subCategoryId: subCategory.id,
    parentTopLevelCategoryId: subCategory.parent,
    score,
    dataQualityFactor,
    unadjustedScore,
    weight: subCategory.weight,
    topics,
  };
}

function computeTopicScore(
  topic: SubCategory["topics"][number],
  result: ScoreQueryResults,
): TopicResult {
  const topicAggregator = createScoreAggregator({
    adjustWeightsByDataQuality: true,
  });
  const criteria: CriterionResult[] = [];

  for (const criterion of topic.criteria) {
    const criterionScore =
      result[getCriterionScoreAlias(topic.topicId, criterion.criterionId)];
    const criterionDq = roundDataQualityFactor(
      result[
        getCriterionDataQualityFactorAlias(topic.topicId, criterion.criterionId)
      ],
    );
    const tagCount =
      result[getCriterionTagCountAlias(topic.topicId, criterion.criterionId)];

    criteria.push({
      criterionId: criterion.criterionId,
      score: criterionScore,
      dataQualityFactor: criterionDq,
      tagCount,
    });

    topicAggregator.add({
      componentScore: criterionScore,
      componentDataQualityFactor: criterionDq,
      componentWeight: criterion.weight,
    });
  }

  const {
    score: preliminaryScore,
    dataQualityFactor,
    unadjustedScore,
  } = topicAggregator.aggregate();

  let score = preliminaryScore;

  if (preliminaryScore !== null) {
    // Virtual data quality criterion (80/20 blend)
    // Same logic as V1: see scoring-algorithm.md#data-quality-criterion-score
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

  return {
    topicId: topic.topicId,
    score,
    dataQualityFactor,
    unadjustedScore,
    criteria,
  };
}

// ─── Write phase ────────────────────────────────────────────────────────────

function requireId(
  map: Map<string, string>,
  key: string,
  label: string,
): string {
  const id = map.get(key);
  if (!id) {
    throw new Error(`Missing ${label} ID for key "${key}"`);
  }
  return id;
}

/**
 * Batch-insert all computed scores in a single short transaction.
 * Uses 5 INSERT statements total (one per table level).
 * Parent IDs are resolved by natural-key lookup from .returning(), never by position.
 */
async function batchWriteScores(
  db: AppDb,
  adminAreaId: string,
  result: OverallResult,
) {
  await db.transaction(async (tx) => {
    // 1. Root score row
    const [{ scoreId }] = await tx
      .insert(scores)
      .values({
        adminAreaId,
        score: result.score,
        dataQualityFactor: result.dataQualityFactor,
        unadjustedScore: result.unadjustedScore,
      })
      .returning({ scoreId: scores.id });

    // 2. Top-level category scores
    const tlcRows = await tx
      .insert(topLevelCategoryScores)
      .values(
        result.topLevelCategories.map((tlc) => ({
          scoreId,
          topLevelCategory: tlc.topLevelCategoryId,
          score: tlc.score,
          dataQualityFactor: tlc.dataQualityFactor,
          unadjustedScore: tlc.unadjustedScore,
        })),
      )
      .returning({
        id: topLevelCategoryScores.id,
        topLevelCategory: topLevelCategoryScores.topLevelCategory,
      });

    // Build lookup by natural key
    const tlcIdMap = new Map(
      tlcRows.map((row) => [row.topLevelCategory, row.id]),
    );

    // 3. Sub-category scores
    const subCatValues = result.topLevelCategories.flatMap((tlc) =>
      tlc.subCategories.map((sc) => ({
        topLevelCategoryScoreId: requireId(
          tlcIdMap,
          tlc.topLevelCategoryId,
          "top-level category",
        ),
        subCategory: sc.subCategoryId,
        score: sc.score,
        dataQualityFactor: sc.dataQualityFactor,
        unadjustedScore: sc.unadjustedScore,
      })),
    );

    const scRows = await tx
      .insert(subCategoryScores)
      .values(subCatValues)
      .returning({
        id: subCategoryScores.id,
        subCategory: subCategoryScores.subCategory,
      });

    // Build lookup by natural key
    const scIdMap = new Map(scRows.map((row) => [row.subCategory, row.id]));

    // 4. Topic scores
    const topicValues = result.topLevelCategories.flatMap((tlc) =>
      tlc.subCategories.flatMap((sc) =>
        sc.topics.map((topic) => ({
          subCategoryScoreId: requireId(
            scIdMap,
            sc.subCategoryId,
            "sub-category",
          ),
          topic: topic.topicId,
          score: topic.score,
          dataQualityFactor: topic.dataQualityFactor,
          unadjustedScore: topic.unadjustedScore,
          // carry sub-category ID for the composite lookup key
          _subCategoryId: sc.subCategoryId,
        })),
      ),
    );

    const topicRows = await tx
      .insert(topicScores)
      .values(topicValues.map(({ _subCategoryId, ...row }) => row))
      .returning({
        id: topicScores.id,
        topic: topicScores.topic,
        subCategoryScoreId: topicScores.subCategoryScoreId,
      });

    // Build lookup by composite key: subCategoryScoreId/topic
    const topicIdMap = new Map(
      topicRows.map((row) => [
        `${row.subCategoryScoreId}/${row.topic}`,
        row.id,
      ]),
    );

    // 5. Criterion scores (leaf level, no IDs needed back)
    const criterionValues = result.topLevelCategories.flatMap((tlc) =>
      tlc.subCategories.flatMap((sc) =>
        sc.topics.flatMap((topic) =>
          topic.criteria.map((criterion) => {
            const compositeKey = `${requireId(scIdMap, sc.subCategoryId, "sub-category")}/${topic.topicId}`;
            return {
              topicScoreId: requireId(topicIdMap, compositeKey, "topic"),
              criterion: criterion.criterionId,
              score: criterion.score,
              dataQualityFactor: criterion.dataQualityFactor,
              tagCount: criterion.tagCount,
            };
          }),
        ),
      ),
    );

    if (criterionValues.length > 0) {
      await tx.insert(criterionScores).values(criterionValues);
    }
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Optimized score computation (V2): parallel reads + batch writes.
 *
 * Same scoring algorithm as V1 (uses the same createScoreAggregator),
 * but restructured into two phases:
 * 1. Read phase: all 54 osmSyncDb queries run in parallel (controlled concurrency)
 * 2. Write phase: 5 batch INSERTs in a single short appDb transaction
 *
 * @param adminAreaId - The admin area to compute scores for
 * @param params - SQL parameters for filtering (joins, wheres for admin area geometry)
 * @param db - The Drizzle database instance to write results to
 */
export async function calculateScoresForAdminAreaV2(
  adminAreaId: string,
  params: SQLSelectParams,
  db: AppDb,
) {
  try {
    const result = await readAndComputeScores(params);
    await batchWriteScores(db, adminAreaId, result);
  } catch (error) {
    const rootCause =
      error instanceof Error && error.cause ? error.cause : error;
    console.error(
      `[V2] Failed to calculate scores for admin area ${adminAreaId}:`,
      rootCause,
    );
    throw error;
  }
}
