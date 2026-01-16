import { describe, expect, test } from "vitest";
import {
  getTopLevelCategoryIds,
  getTopLevelCategoryList,
  type TopLevelCategoryId,
  type TopLevelCategory,
} from "~~/src/a11yscore/config/categories";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";

describe("weights should add up to 1", () => {
  const activeCategories: TopLevelCategory[] = getTopLevelCategoryList().filter(
    (category) => !category.planned,
  );

  test("top-level categories", async () => {
    const totalWeight = activeCategories.reduce(
      (sum, { weight }) => sum + weight,
      0,
    );
    expect(totalWeight).toBeCloseTo(1, 10);
  });

  for (const topLevelCategory of activeCategories) {
    const subCategories = Object.values(
      getChildCategories(topLevelCategory.id),
    );

    test(`sub-categories in "${topLevelCategory}"`, async () => {
      const totalWeight = subCategories.reduce(
        (sum, { weight }) => sum + weight,
        0,
      );
      expect(totalWeight).toBeCloseTo(1, 10);
    });

    for (const { topics, id: subCategoryId } of subCategories) {
      for (const { criteria, topicId } of topics) {
        test(`criteria in "${topLevelCategory}/${subCategoryId}/${topicId}"`, async () => {
          const totalWeight = Object.values(criteria).reduce(
            (sum, { weight }) => sum + weight,
            0,
          );
          expect(totalWeight).toBeCloseTo(1, 10);
        });
      }
    }
  }
});
