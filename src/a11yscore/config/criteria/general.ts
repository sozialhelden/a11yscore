import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type GeneralCriterionId = "has-drinking-straws";
export const generalCriteria: Record<GeneralCriterionId, CriterionProperties> =
  {
    "has-drinking-straws": {
      name: () => t("Drinking straws are available"),
      osmTags: [
        { key: "drinking_straw", value: "yes" },
        { key: "drinking_straw", value: "no" },
        { key: "drinking_straw", value: "plastic" },
        { key: "drinking_straw", value: "paper" },
        { key: "drinking_straw", value: "bioplastic" },
        { key: "drinking_straw", value: "metal" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'drinking_straw' IN ('yes', 'plastic', 'paper', 'bioplastic', 'metal') THEN 100
				WHEN ${table.tags}->'drinking_straw' = 'no' THEN 10
				WHEN ${table.tags}->'drinking_straw' != '' AND ${table.tags}->'drinking_straw' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
      },
    },
  };
