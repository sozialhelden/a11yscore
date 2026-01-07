import { describe, expect, it, mock, test } from "bun:test";
import {
  getTopLevelCategoryIds,
  getTopLevelCategoryList,
  type SubCategory,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";

describe("unit", () => {
  describe("getChildCategories", () => {
    it("should return child categories for a given parent category", async () => {
      mock.module("~~/src/a11yscore/config/categories", () => {
        return {
          subCategories: {
            "sub-cat-1": {
              id: "sub-cat-1",
              parent: "top-cat-1",
            },
            "sub-cat-2": {
              id: "sub-cat-2",
              parent: "top-cat-1",
            },
            "sub-cat-3": {
              id: "sub-cat-3",
              parent: "top-cat-2",
            },
          },
        };
      });
      const { getChildCategories } = await import(
        "~~/src/a11yscore/utils/categories"
      );
      expect(getChildCategories("top-cat-1" as TopLevelCategoryId)).toEqual([
        {
          id: "sub-cat-1",
          parent: "top-cat-1",
        },
        {
          id: "sub-cat-2",
          parent: "top-cat-1",
        },
      ] as unknown as SubCategory[]);
      expect(getChildCategories("top-cat-2" as TopLevelCategoryId)).toEqual([
        {
          id: "sub-cat-3",
          parent: "top-cat-2",
        },
      ] as unknown as SubCategory[]);
      mock.restore();
    });
  });

  describe("weights should add up to 1", () => {
    test("top-level categories", async () => {
      const totalWeight = getTopLevelCategoryList().reduce(
        (sum, { weight }) => sum + weight,
        0,
      );
      expect(totalWeight).toBeCloseTo(1, 10);
    });

    for (const topLevelCategory of getTopLevelCategoryIds()) {
      const subCategories = Object.values(
        getChildCategories(topLevelCategory as TopLevelCategoryId),
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
});
