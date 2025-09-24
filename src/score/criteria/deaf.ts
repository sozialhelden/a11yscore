import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type DeafCriterionId = "is-accessible-to-hearing-impaired";

export const deafCriteria: Record<DeafCriterionId, CriterionProperties> = {
  "is-accessible-to-hearing-impaired": {
    name: () => t("Accessible to hearing impaired people"),
    resources: ["https://wiki.openstreetmap.org/wiki/Key:deaf"],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'deaf' IN ('yes', 'designated') THEN 100
				WHEN ${table.tags}->'deaf' = 'limited' THEN 50
				WHEN ${table.tags}->'deaf' = 'no' THEN 10
				WHEN ${table.tags}->'deaf' != '' AND ${table.tags}->'deaf' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
  },
};
