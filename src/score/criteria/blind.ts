import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type BlindCriterionId = "is-accessible-to-visually-impaired";

export const blindCriteria: Record<BlindCriterionId, CriterionProperties> = {
  "is-accessible-to-visually-impaired": {
    name: () => t("Accessible to visually impaired people"),
    resources: ["https://wiki.openstreetmap.org/wiki/Key:blind"],
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
