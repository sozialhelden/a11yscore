import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type EnvironmentCriterionId = "has-quiet-hours";

export const environmentCriteria: Record<
  EnvironmentCriterionId,
  CriterionProperties
> = {
  "has-quiet-hours": {
    name: () => t("Has quiet hours"),
    resources: ["https://wiki.openstreetmap.org/wiki/Proposal:Quiet_hours"],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'quiet_hours' != '' AND ${table.tags}->'quiet_hours' IS NOT NULL THEN 100
				ELSE 0
			END)::bigint`;
    },
  },
};
