import type { Criteria } from "../criteria";
import type { Topic } from "../topics";

export type Points = number;

export type CategoryBaseProperties = {
	label: () => string;
};
export type SubCategoryProperties = CategoryBaseProperties & {
	criteria: Record<Topic, Partial<Record<Criteria, Points>>>;
};
export type ParentCategoryProperties = CategoryBaseProperties & {
	children: Partial<Record<Category, SubCategoryProperties>>;
};

export type Category = "food-drink" | "restaurant";

export const categories: Partial<Record<Category, ParentCategoryProperties>> = {
	"food-drink": {
		label: () => "Food & Drink",
		children: {
			restaurant: {
				label: () => "Restaurant",
				criteria: {
					mobility: {
						"wheelchair-accessible": 100,
					},
					visual: {
						"has-digital-menu": 100,
					},
				},
			},
		},
	},
};
