import { describe, expect, it, mock } from "bun:test";
import type { SubCategory, TopLevelCategoryId } from "~~/src/score/categories";

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
});
