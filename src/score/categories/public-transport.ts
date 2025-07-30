import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import { t } from "~/plugins/i18n";
import type { SubCategory } from "~~/src/score/categories/index";

export type PublicTransportSubCategoryId = "train-stations";

export const publicTransportSubCategories: Record<
	PublicTransportSubCategoryId,
	Omit<SubCategory, "id">
> = {
	"train-stations": {
		name: () => t("Train Stations"),
		parent: "public-transport",
		weight: 1,
		reason: () => "",
		resources: ["https://wiki.openstreetmap.org/wiki/Tag:railway%3Dstation"],
		sql: {
			from: osm_amenities,
			where: sql`${osm_amenities.tags}->'railway' = 'station'`,
		},
		topics: [
			{
				topicId: "mobility",
				criteria: [
					{
						criteriaId: "is-wheelchair-accessible",
						weight: 1,
						reason: () => "",
					},
				],
			},
		],
	},
};
