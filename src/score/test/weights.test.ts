import { describe, expect, test } from "bun:test";
import {
	type TopLevelCategoryId,
	topLevelCategories,
} from "~~/src/score/categories";
import { getChildCategories } from "~~/src/score/utils/categories";

describe("unit", () => {
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
