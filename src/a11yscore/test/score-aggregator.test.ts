import { describe, expect, it } from "bun:test";
import { createScoreAggregator } from "~~/src/a11yscore/utils/score-aggregator";

describe("unit", () => {
  describe("scoreAggregator", () => {
    it("it adds up scores and data quality factors", () => {
      const { add, aggregate } = createScoreAggregator();
      add({ componentScore: 50, componentDataQualityFactor: 0.8 });
      add({ componentScore: 100, componentDataQualityFactor: 0.6 });
      add({ componentScore: 75, componentDataQualityFactor: 0.1 });

      // (50 + 100 + 75) / 3 = 75
      // (0.8 + 0.6 + 0.1) / 3 = 0.5
      expect(aggregate()).toEqual({
        score: 75,
        dataQualityFactor: 0.5,
        unadjustedScore: undefined,
      });
    });

    it("it accepts individual weights", () => {
      const { add, aggregate } = createScoreAggregator();
      add({
        componentScore: 50,
        componentDataQualityFactor: 0.8,
        componentWeight: 0.5,
      });
      add({
        componentScore: 100,
        componentDataQualityFactor: 0.6,
        componentWeight: 0.25,
      });
      add({
        componentScore: 75,
        componentDataQualityFactor: 0.1,
        componentWeight: 0.25,
      });

      // 50 * 0.5 + 100 * 0.25 + 75 * 0.25 = 69
      // 0.8 * 0.5 + 0.6 * 0.25 + 0.1 * 0.25 = 0.575
      expect(aggregate()).toEqual({
        score: 69,
        dataQualityFactor: 0.575,
        unadjustedScore: undefined,
      });
    });

    it("it rounds the data quality factor on aggregation to 3 decimal points", () => {
      const { add, aggregate } = createScoreAggregator();
      add({
        componentScore: 0,
        componentDataQualityFactor: 0.8888888888,
        componentWeight: 0.5,
      });
      add({
        componentScore: 0,
        componentDataQualityFactor: 0.6666666666,
        componentWeight: 0.5,
      });

      // 0.8888888888 * 0.5 + 0.6666666666 * 0.5 = 0.7777777777
      expect(aggregate()).toEqual({
        score: 0,
        dataQualityFactor: 0.778,
        unadjustedScore: undefined,
      });
    });

    it("normalizes weights when their sum exceeds 1", () => {
      const { add, aggregate } = createScoreAggregator();
      add({
        componentScore: 200,
        componentDataQualityFactor: 2,
        componentWeight: 1,
      });
      add({
        componentScore: 50,
        componentDataQualityFactor: 0.5,
        componentWeight: 2,
      });

      // 200 * 1 + 50 * 2 = 300 / (1 + 2) = 100
      // 2 * 1 + 0.5 * 2 = 3 / (1 + 2) = 1
      expect(aggregate()).toEqual({
        score: 100,
        dataQualityFactor: 1,
        unadjustedScore: undefined,
      });
    });

    it("it falls back to a weight of 1 when no weight is provided", () => {
      const { add, aggregate } = createScoreAggregator();
      add({
        componentScore: 100,
        componentDataQualityFactor: 1,
      });
      add({
        componentScore: 50,
        componentDataQualityFactor: 1,
        componentWeight: 0.25,
      });

      // 100 * 1 + 50 * 0.25 = 112.5 / (1 + 0.25) = 90
      expect(aggregate()).toEqual({
        score: 90,
        dataQualityFactor: 1,
        unadjustedScore: undefined,
      });
    });

    it("it can exclude entries from the score but keeps them in the data quality factor when no data is available", () => {
      const { add, aggregate } = createScoreAggregator({
        excludeFromScoreWhenDataIsNotAvailable: false,
      });
      add({
        componentScore: 100,
        componentDataQualityFactor: 0,
        componentWeight: 0.5,
      });
      add({
        componentScore: 50,
        componentDataQualityFactor: 1,
        componentWeight: 0.5,
      });
      expect(aggregate()).toEqual({
        score: 75,
        dataQualityFactor: 0.5,
        unadjustedScore: undefined,
      });

      const { add: addNew, aggregate: aggregateNew } = createScoreAggregator({
        excludeFromScoreWhenDataIsNotAvailable: true,
      });
      addNew({
        componentScore: 100,
        componentDataQualityFactor: 0,
        componentWeight: 0.5,
      });
      addNew({
        componentScore: 50,
        componentDataQualityFactor: 1,
        componentWeight: 0.5,
      });
      expect(aggregateNew()).toEqual({
        score: 50,
        dataQualityFactor: 0.5,
        unadjustedScore: undefined,
      });
    });

    it("it can adjust weights based on data quality factors", () => {
      const { add, aggregate } = createScoreAggregator({
        adjustWeightsByDataQuality: true,
      });
      add({
        componentScore: 50,
        componentDataQualityFactor: 0.8,
        componentWeight: 0.5,
      });
      add({
        componentScore: 100,
        componentDataQualityFactor: 0.6,
        componentWeight: 0.25,
      });
      add({
        componentScore: 75,
        componentDataQualityFactor: 0.1,
        componentWeight: 0.25,
      });
      expect(aggregate()).toEqual({
        score: 65,
        unadjustedScore: 69,
        dataQualityFactor: 0.575,
      });
    });

    it("uses 1 as default data quality factor when none is provided", () => {
      const { add, aggregate } = createScoreAggregator({
        adjustWeightsByDataQuality: true,
      });
      add({ componentScore: 50 });
      add({ componentScore: 100 });
      expect(aggregate()).toEqual({
        score: 75,
        unadjustedScore: 75,
        dataQualityFactor: 1,
      });
    });
  });
});
