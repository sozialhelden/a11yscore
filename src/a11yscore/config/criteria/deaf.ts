import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type DeafCriterionId = "is-accessible-to-hearing-impaired";

export const deafCriteria: Record<DeafCriterionId, CriterionProperties> = {
  "is-accessible-to-hearing-impaired": {
    name: () => t("Accessible to hearing impaired people"),
    osmTags: [
      { key: "deaf", value: "yes" },
      { key: "deaf", value: "designated" },
      { key: "deaf", value: "limited" },
      { key: "deaf", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'deaf' IN ('yes', 'designated') THEN 100
				WHEN ${table.tags}->'deaf' = 'limited' THEN 50
				WHEN ${table.tags}->'deaf' = 'no' THEN 10
				WHEN ${table.tags}->'deaf' != '' AND ${table.tags}->'deaf' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
    reason: () =>
      t(
        "Hearing impaired people must be able to access and use the most important areas of the facility without barriers.",
      ),
    recommendations: () => [
      t("Provide visual alarms and notifications for important information."),
      t(
        "Consider installing hearing loops or other assistive listening devices.",
      ),
    ],
  },
};
