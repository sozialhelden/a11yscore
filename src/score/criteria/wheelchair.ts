import { sql } from "drizzle-orm";
import { t } from "~/plugins/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type WheelchairCriterionId =
	| "is-wheelchair-accessible"
	| "has-wheelchair-accessible-toilet";

export const wheelchairCriteria: Record<
	WheelchairCriterionId,
	CriterionProperties
> = {
	"is-wheelchair-accessible": {
		name: () => t("Is accessible with wheelchair"),
		resources: ["https://wiki.openstreetmap.org/wiki/Key:wheelchair"],
		sql: (table) => {
			return sql<number>`AVG(CASE 
				WHEN ${table.wheelchair} = 'yes' THEN 100
 				WHEN ${table.wheelchair} = 'limited' THEN 50
 				WHEN ${table.wheelchair} = 'no' THEN 10
 				ELSE 0
			END)::bigint`;
		},
	},
	"has-wheelchair-accessible-toilet": {
		name: () => t("Toilet is accessible with wheelchair"),
		resources: [
			"https://wiki.openstreetmap.org/wiki/Wheelchair_accessible_toilets",
			"https://wiki.openstreetmap.org/wiki/Key:toilets:wheelchair",
		],
		sql: (table) =>
			sql<number>`AVG(CASE 
				WHEN ${table["toilets:wheelchair"]} = 'yes' THEN 100
 				WHEN ${table["toilets:wheelchair"]} = 'no' THEN 10
 				ELSE 0
			END)::bigint`,
	},
};
