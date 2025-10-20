import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type EnvironmentCriterionId = "has-quiet-hours";

export const environmentCriteria: Record<
  EnvironmentCriterionId,
  CriterionProperties
> = {
  "has-quiet-hours": {
    name: () => t("Has quiet hours"),
    osmTags: [{ key: "quiet_hours", value: "*" }],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'quiet_hours' != '' AND ${table.tags}->'quiet_hours' IS NOT NULL THEN 100
				ELSE 0
			END)::bigint`;
    },
  },
};
