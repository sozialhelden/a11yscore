import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type BlindCriterionId = "is-accessible-to-visually-impaired";

export const blindCriteria: Record<BlindCriterionId, CriterionProperties> = {
  "is-accessible-to-visually-impaired": {
    name: () => t("Accessible to visually impaired people"),
    osmTags: [
      { key: "blind", value: "yes" },
      { key: "blind", value: "designated" },
      { key: "blind", value: "limited" },
      { key: "blind", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'blind' IN ('yes', 'designated') THEN 100
				WHEN ${table.tags}->'blind' = 'limited' THEN 50
				WHEN ${table.tags}->'blind' = 'no' THEN 10
				WHEN ${table.tags}->'blind' != '' AND ${table.tags}->'blind' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
  },
};
