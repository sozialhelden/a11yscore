import { describe, expect, it, mock, test } from "bun:test";
import {
  type SubCategory,
  type TopLevelCategoryId,
  topLevelCategories,
} from "~~/src/score/categories";
import { getChildCategories } from "~~/src/score/utils/categories";

describe("unit", () => {
  describe("getChildCategories", () => {
    it("should return child categories for a given parent category", async () => {
      mock.module("~~/src/score/categories", () => {
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
        "~~/src/score/utils/categories"
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
      const totalWeight = Object.values(topLevelCategories).reduce(
        (sum, { weight }) => sum + weight,
        0,
      );
      expect(totalWeight).toBe(1);
    });

    for (const topLevelCategory of Object.keys(topLevelCategories)) {
      const subCategories = Object.values(
        getChildCategories(topLevelCategory as TopLevelCategoryId),
      );

      test(`sub-categories in "${topLevelCategory}"`, async () => {
        const totalWeight = subCategories.reduce(
          (sum, { weight }) => sum + weight,
          0,
        );
        expect(totalWeight).toBe(1);
      });

      for (const { topics, id: subCategoryId } of subCategories) {
        for (const { criteria, topicId } of topics) {
          test(`criteria in "${topLevelCategory}/${subCategoryId}/${topicId}"`, async () => {
            const totalWeight = Object.values(criteria).reduce(
              (sum, { weight }) => sum + weight,
              0,
            );
            expect(totalWeight).toBe(1);
          });
        }
      }
    }
  });
});
