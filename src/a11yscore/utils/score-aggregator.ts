import {
  minDataQualityFactor,
  noDataThreshold,
} from "~~/src/a11yscore/config/data-quality";
import { roundDataQualityFactor } from "~~/src/a11yscore/utils/data-quality";

/**
 * Creates a score aggregator to accumulate component scores and data quality factors
 * and finalize them into a normalized score and data quality factor.
 */
export function createScoreAggregator({
  adjustWeightsByDataQuality = false,
  excludeFromScoreWhenDataIsNotAvailable = false,
}: {
  adjustWeightsByDataQuality?: boolean;
  excludeFromScoreWhenDataIsNotAvailable?: boolean;
} = {}) {
  const scores: number[] = [];
  const dataQualityFactors: (number | undefined)[] = [];
  const weights: (number | undefined)[] = [];

  function normalize(
    number: number,
    {
      excludeUnavailable = false,
      adjustWeights = false,
    }: {
      excludeUnavailable?: boolean;
      adjustWeights?: boolean;
    } = {},
  ) {
    const sum = weights.reduce((accumulator, weight, index) => {
      weight = weight ?? 1;
      const dataQualityFactor = dataQualityFactors[index] ?? 1;

      if (excludeUnavailable && dataQualityFactor <= noDataThreshold) {
        return accumulator;
      }
      if (adjustWeights) {
        return accumulator + weight * dataQualityFactor;
      }

      return accumulator + weight;
    }, 0);
    return sum === 0 ? 0 : number * (1 / sum);
  }

  function weightedSum(
    values: (number | undefined)[],
    {
      excludeUnavailable = false,
      adjustWeights = false,
      defaultValue = 0,
    }: {
      excludeUnavailable?: boolean;
      adjustWeights?: boolean;
      defaultValue?: number;
    } = {},
  ) {
    return values.reduce((accumulator, value, index) => {
      value = value ?? defaultValue;
      const weight = weights[index] ?? 1;
      const dataQualityFactor = dataQualityFactors[index] ?? 1;

      if (excludeUnavailable && dataQualityFactor <= noDataThreshold) {
        return accumulator;
      }
      if (adjustWeights) {
        return accumulator + value * weight * dataQualityFactor;
      }

      return accumulator + value * weight;
    }, 0);
  }

  function allNull(values: (number | undefined | null)[]) {
    return values.every((value) => value === null || value === undefined);
  }

  return {
    /**
     * Add a component's score and data quality factor to the aggregator
     */
    add({
      componentScore,
      componentDataQualityFactor,
      componentWeight,
    }: {
      componentScore: number;
      componentDataQualityFactor?: number;
      componentWeight?: number;
    }) {
      weights.push(componentWeight);
      scores.push(componentScore);
      dataQualityFactors.push(componentDataQualityFactor);
    },
    /**
     * Finalize and aggregate the scores and data quality factors
     */
    aggregate() {
      if (allNull(scores)) {
        return {
          score: null,
          unadjustedScore: null,
          dataQualityFactor: minDataQualityFactor,
        };
      }

      // calculate adjusted score
      const scoreSum = weightedSum(scores, {
        excludeUnavailable: excludeFromScoreWhenDataIsNotAvailable,
        adjustWeights: adjustWeightsByDataQuality,
      });
      const score = normalize(scoreSum, {
        excludeUnavailable: excludeFromScoreWhenDataIsNotAvailable,
        adjustWeights: adjustWeightsByDataQuality,
      });

      // calculate unadjusted score
      const unadjustedScoreSum = weightedSum(scores, {
        excludeUnavailable: excludeFromScoreWhenDataIsNotAvailable,
      });
      const unadjustedScore = normalize(unadjustedScoreSum, {
        excludeUnavailable: excludeFromScoreWhenDataIsNotAvailable,
      });

      // calculate data quality factor
      const dataQualityFactorSum = weightedSum(dataQualityFactors, {
        defaultValue: 1,
      });
      const dataQualityFactor = normalize(dataQualityFactorSum);

      return {
        score: Math.ceil(score),
        dataQualityFactor: roundDataQualityFactor(dataQualityFactor),
        unadjustedScore: adjustWeightsByDataQuality
          ? Math.ceil(unadjustedScore)
          : undefined,
      };
    },
  };
}
