import { describe, expect, it } from "vitest";
import { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";
import {
  subCategoryFactory,
  topicCriteriaPivotFactory,
  topLevelCategoryFactory,
} from "~~/test/_factories/categories.factory";
import { criteriaFactory } from "~~/test/_factories/criteria.factory";
import { topicsFactory } from "~~/test/_factories/topics.factory";
import { findFirst } from "~~/test/_utils/database-assertions";
import { mockCategories, mockCriteria } from "~~/test/_utils/mocks";
import { seedAdminArea } from "~~/test/_utils/seeders";

const { getTopLevelCategoriesMock, getSubCategoriesMock } = mockCategories();
const { getCriteriaMock } = mockCriteria();

describe("calculateScoresForAdminArea", () => {
  const { getAdminArea } = seedAdminArea();

  it("persists scores in the database", async () => {
    const topLevelCategory = topLevelCategoryFactory();
    const topic = topicsFactory();
    const criterion = criteriaFactory();
    const subCategory = subCategoryFactory(topLevelCategory, {
      topics: [topicCriteriaPivotFactory(topic, [criterion])],
    });

    getCriteriaMock().mockReturnValue({
      [criterion.id]: criterion,
    });
    getTopLevelCategoriesMock().mockReturnValue({
      [topLevelCategory.id]: topLevelCategory,
    });
    getSubCategoriesMock().mockReturnValue({
      [subCategory.id]: subCategory,
    });

    const { calculateScoresForAdminArea } = await import(
      "~~/src/a11yscore/queries/calculate-scores-for-admin-area"
    );

    await calculateScoresForAdminArea(getAdminArea().id, {});

    const score = await findFirst(appDb, scores, {
      adminAreaId: getAdminArea().id,
    });
    expect(score.id).toBeTruthy();

    const topLevelCategoryScore = await findFirst(
      appDb,
      topLevelCategoryScores,
      {
        scoreId: score.id,
        topLevelCategory: topLevelCategory.id,
      },
    );
    expect(topLevelCategoryScore.id).toBeTruthy();

    const subCategoryScore = await findFirst(appDb, subCategoryScores, {
      topLevelCategoryScoreId: topLevelCategoryScore.id,
      subCategory: subCategory.id,
    });
    expect(subCategoryScore.id).toBeTruthy();

    const topicScore = await findFirst(appDb, topicScores, {
      subCategoryScoreId: subCategoryScore.id,
      topic: topic.id,
    });
    expect(topicScore.id).toBeTruthy();

    const criterionScore = await findFirst(appDb, criterionScores, {
      topicScoreId: topicScore.id,
      criterion: criterion.id,
    });
    expect(criterionScore.id).toBeTruthy();
  });
});
