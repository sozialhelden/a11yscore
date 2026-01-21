import { sql } from "drizzle-orm";
import type { Translate } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type EnvironmentCriterionId = "has-quiet-hours";

export const getEnvironmentCriteria = (
  t: Translate,
): Record<EnvironmentCriterionId, CriterionProperties> => ({
  "has-quiet-hours": {
    name: t("Has quiet hours"),
    osmTags: [{ key: "quiet_hours", value: "*" }],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'quiet_hours' != '' AND ${table.tags}->'quiet_hours' IS NOT NULL THEN 100
				ELSE 0
			END)::bigint`;
    },
    reason: t(
      "People with neurodivergent conditions may benefit from quiet hours.",
    ),
    recommendations: [
      t(
        "Consider implementing quiet hours during specific times of the day. Limit loud music and announcements in these hours.",
      ),
    ],
  },
});
