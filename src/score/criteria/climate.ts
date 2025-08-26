import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type ClimateCriterionId =
	| "smoking-is-prohibited"
	| "has-air-conditioning";

export const climateCriteria: Record<ClimateCriterionId, CriterionProperties> =
	{
		"smoking-is-prohibited": {
			name: () => t("Smoking is prohibited"),
			resources: ["https://wiki.openstreetmap.org/wiki/Key:smoking"],
			sql: (table) => {
				return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'smoking' = 'no' THEN 100
				WHEN ${table.tags}->'smoking' = 'isolated' THEN 90
				WHEN ${table.tags}->'smoking' = 'separated' THEN 80
				WHEN ${table.tags}->'smoking' IN ('yes', 'dedicated') THEN 10
				WHEN ${table.tags}->'smoking' != '' AND ${table.tags}->'smoking' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
			},
		},
		"has-air-conditioning": {
			name: () => t("Has air conditioning"),
			resources: ["https://wiki.openstreetmap.org/wiki/Key:air_conditioning"],
			sql: (table) => {
				return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'air_conditioning' = 'yes' THEN 100
				WHEN ${table.tags}->'air_conditioning' = 'no' THEN 10
				WHEN ${table.tags}->'air_conditioning' != '' AND ${table.tags}->'air_conditioning' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
			},
		},
	};
