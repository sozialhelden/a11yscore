import {
	type SubCategory,
	subCategories,
	type TopLevelCategoryId,
} from "~~/src/score/categories";

export function getChildCategories(parent: TopLevelCategoryId): SubCategory[] {
	return Object.values(subCategories).filter(
		(category) => (category as SubCategory)?.parent === parent,
	);
}
