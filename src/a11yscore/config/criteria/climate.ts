import { sql } from "drizzle-orm";
import type { Translate } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type ClimateCriterionId =
  | "smoking-is-prohibited"
  | "has-air-conditioning";

export const getClimateCriteria = (
  t: Translate,
): Record<ClimateCriterionId, CriterionProperties> => ({
  "smoking-is-prohibited": {
    name: t("Smoke-free environment"),
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
    reason: t(
      "A smoke-free environment improves air quality and comfort for all visitors, but is especially necessary for people with respiratory conditions.",
    ),
    recommendations: [
      t("Restrict smoking areas to outdoor locations away from entrances."),
    ],
  },
  "has-air-conditioning": {
    name: t("Has air conditioning"),
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
    reason: t(
      "Air conditioning improves indoor temperature, air quality and comfort for all visitors, but is especially important for individuals with pre-existing conditions.",
    ),
    recommendations: [
      t(
        "Consider installing or upgrading air conditioning systems to ensure effective climate control.",
      ),
    ],
  },
});
