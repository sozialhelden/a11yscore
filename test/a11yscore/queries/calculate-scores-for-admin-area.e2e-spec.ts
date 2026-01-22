import { and, eq } from "drizzle-orm";
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

    const score = (
      await appDb
        .select()
        .from(scores)
        .where(eq(scores.adminAreaId, getAdminArea().id))
    ).shift();
    expect(score.id).toBeTruthy();

    const topLevelCategoryScore = (
      await appDb
        .select()
        .from(topLevelCategoryScores)
        .where(
          and(
            eq(topLevelCategoryScores.scoreId, score.id),
            eq(topLevelCategoryScores.topLevelCategory, topLevelCategory.id),
          ),
        )
    ).shift();
    expect(topLevelCategoryScore.id).toBeTruthy();

    const subCategoryScore = (
      await appDb
        .select()
        .from(subCategoryScores)
        .where(
          and(
            eq(
              subCategoryScores.topLevelCategoryScoreId,
              topLevelCategoryScore.id,
            ),
            eq(subCategoryScores.subCategory, subCategory.id),
          ),
        )
    ).shift();
    expect(subCategoryScore.id).toBeTruthy();

    const topicScore = (
      await appDb
        .select()
        .from(topicScores)
        .where(
          and(
            eq(topicScores.subCategoryScoreId, subCategoryScore.id),
            eq(topicScores.topic, topic.id),
          ),
        )
    ).shift();
    expect(topicScore.id).toBeTruthy();

    const criterionScore = (
      await appDb
        .select()
        .from(criterionScores)
        .where(
          and(
            eq(criterionScores.topicScoreId, topicScore.id),
            eq(criterionScores.criterion, criterion.id),
          ),
        )
    ).shift();
    expect(criterionScore.id).toBeTruthy();
  });
});
