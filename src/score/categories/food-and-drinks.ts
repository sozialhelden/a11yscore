import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import { t } from "~/plugins/i18n";
import type { SubCategory } from "~~/src/score/categories/index";

export type FoodAndDrinksSubCategoryId = "restaurants" | "cafes";

export const foodAndDrinksSubCategories: Record<
	FoodAndDrinksSubCategoryId,
	Omit<SubCategory, "id">
> = {
	restaurants: {
		name: () => t("Restaurants"),
		parent: "food-and-drinks",
		weight: 0.7,
		reason: () => "",
		resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Drestaurant"],
		sql: {
			from: osm_amenities,
			where: sql`${osm_amenities.amenity} = 'restaurant'`,
		},
		topics: [
			{
				topicId: "mobility",
				criteria: [
					{
						criteriaId: "is-wheelchair-accessible",
						weight: 0.8,
						reason: () => "",
					},
					{
						criteriaId: "has-wheelchair-accessible-toilet",
						weight: 0.2,
						reason: () => "",
					},
				],
			},
			{
				topicId: "air-and-climate",
				criteria: [
					{
						criteriaId: "smoking-is-prohibited",
						weight: 0.7,
						reason: () => "",
					},
					{
						criteriaId: "has-air-conditioning",
						weight: 0.3,
						reason: () => "",
					},
				],
			},
		],
	},
	cafes: {
		name: () => t("Cafes"),
		reason: () => "",
		parent: "food-and-drinks",
		weight: 0.3,
		resources: ["https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcafe"],
		sql: {
			from: osm_amenities,
			where: sql`${osm_amenities.amenity} = 'cafe'`,
		},
		topics: [
			{
				topicId: "mobility",
				criteria: [
					{
						criteriaId: "is-wheelchair-accessible",
						weight: 0.8,
						reason: () => "",
					},
					{
						criteriaId: "has-wheelchair-accessible-toilet",
						weight: 0.2,
						reason: () => "",
					},
				],
			},
		],
	},
};
