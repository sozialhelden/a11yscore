import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type ToiletCriterionId = "has-toilet";
export const toiletCriteria: Record<ToiletCriterionId, CriterionProperties> = {
  "has-toilet": {
    name: () => t("A toilet is available"),
    resources: ["https://wiki.openstreetmap.org/wiki/Key:toilets"],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'toilets' = 'yes' THEN 100
				WHEN ${table.tags}->'toilets' = 'no' THEN 10
				WHEN ${table.tags}->'toilets' != '' AND ${table.tags}->'toilets' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
  },
};
