import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { appDb } from "~/db";
import { scores, adminAreas } from "~/db/schema/app";
import {
  activeCategory,
  activeCategory2,
  subCategory,
  subCategory2,
  plannedCategory,
} from "~~/src/a11yscore/test/mocks/categories.ts";
import { calculateScoresForAdminArea } from "~~/src/a11yscore/queries/calculate-scores-for-admin-area";
import * as categoryConfig from "~~/src/a11yscore/config/categories/index";
import * as categoryUtils from "~~/src/a11yscore/utils/categories";
import { handle as computeScoreHandler } from "~~/src/a11yscore/jobs/compute-admin-area-score.ts";
import { osm_amenities } from "~/db/schema/osm-sync";
import { getChildCategories } from "../utils/categories";

describe("Planned Categories Integration", () => {
  let testAdminAreaId: string;
  const createdScoreIds: string[] = [];

  let getTopLevelCategoriesListSpy: MockInstance<
    () => categoryConfig.TopLevelCategory[]
  >;
  let getChildCategoriesSpy: MockInstance<
    typeof categoryUtils.getChildCategories
  >;

  const runCalculation = async (
    categories: categoryConfig.TopLevelCategory[],
  ) => {
    // mocking the top level categories to compute the scores for
    getTopLevelCategoriesListSpy.mockReturnValue(categories);

    await computeScoreHandler({
      data: {
        adminArea: { id: testAdminAreaId },
      },
    } as ComputeAdminAreaScoreJob);

    const [latestScore] = await appDb
      .select()
      .from(scores)
      .where(eq(scores.adminAreaId, testAdminAreaId))
      .orderBy(desc(scores.createdAt))
      .limit(1);

    if (!latestScore) throw new Error("Failed to retrieve latest score");

    createdScoreIds.push(latestScore.id);
    return latestScore;
  };

  beforeEach(async () => {
    const [adminArea] = await appDb.select().from(adminAreas).limit(1);
    if (!adminArea) throw new Error("No admin areas found in DB for testing");
    testAdminAreaId = adminArea.id;

    getTopLevelCategoriesListSpy = vi.spyOn(
      categoryConfig,
      "getTopLevelCategoryList",
    );
    getChildCategoriesSpy = vi.spyOn(categoryUtils, "getChildCategories");
  });

  afterEach(async () => {
    if (createdScoreIds.length > 0) {
      // deleting the mocked scores from the database after the test
      await appDb.delete(scores).where(inArray(scores.id, createdScoreIds));
      createdScoreIds.length = 0;
    }
    vi.restoreAllMocks();
  });

  it("ensures that adding planned categories does not change the overall score", async () => {
    getChildCategoriesSpy.mockReturnValue([subCategory]);

    const score1 = await runCalculation([activeCategory]);
    const score2 = await runCalculation([activeCategory, plannedCategory]);

    expect(score1.score).toBe(score2.score);
    expect(score1.dataQualityFactor).toBe(score2.dataQualityFactor);
  }, 60000);

  it("verifies that adding active categories does indeed change the overall score", async () => {
    getChildCategoriesSpy.mockImplementation((parentId) => {
      if (parentId === activeCategory.id) return [subCategory];
      if (parentId === activeCategory2.id) return [subCategory2];
      return [];
    });

    const score1 = await runCalculation([activeCategory]);
    const score2 = await runCalculation([activeCategory, activeCategory2]);

    expect(score1.score).not.toBe(score2.score);
    expect(score1.dataQualityFactor).not.toBe(score2.dataQualityFactor);
  }, 60000);
});
