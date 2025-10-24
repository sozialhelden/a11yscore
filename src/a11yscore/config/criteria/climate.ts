import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type ClimateCriterionId =
  | "smoking-is-prohibited"
  | "has-air-conditioning";

export const climateCriteria: Record<ClimateCriterionId, CriterionProperties> =
  {
    "smoking-is-prohibited": {
      name: () => t("Smoke-free environment"),
      osmTags: [
        { key: "smoking", value: "no" },
        { key: "smoking", value: "isolated" },
        { key: "smoking", value: "separated" },
        { key: "smoking", value: "yes" },
        { key: "smoking", value: "dedicated" },
      ],
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
      osmTags: [
        { key: "air_conditioning", value: "yes" },
        { key: "air_conditioning", value: "no" },
      ],
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
