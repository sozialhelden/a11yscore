import { beforeEach, describe, expect, it, jest, mock } from "bun:test";

const createScoreResultEntriesMock = {
  createCriterionScoreResult: jest.fn(),
  createScoreResult: jest.fn(),
  createSubCategoryScoreResult: jest.fn(),
  createTopicScoreResult: jest.fn(),
  createTopLevelCategoryScoreResult: jest.fn(),
  updateScoreResult: jest.fn(),
  updateSubCategoryScoreResult: jest.fn(),
  updateTopicScoreResult: jest.fn(),
  updateTopLevelCategoryScoreResult: jest.fn(),
};
mock.module(
  "../queries/create-score-result-entries",
  () => createScoreResultEntriesMock,
);

const categoriesMock = {
  getTopLevelCategoryList: jest.fn(),
  getTopLevelCategoryIds: jest.fn(),
  getTopLevelCategoryById: jest.fn(),
  getChildCategories: jest.fn(),
  getSubCategoryList: jest.fn(),
};
mock.module("../config/categories", () => categoriesMock);

const querySubCategoryScoresMock = jest.fn();
mock.module("../queries/query-sub-category-scores", () => {
  return {
    querySubCategoryScores: querySubCategoryScoresMock,
  };
});

describe("unit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });
  describe("calculateScoresForAdminArea", () => {
    it("adds an id property to config entries", () => {});
  });
});
