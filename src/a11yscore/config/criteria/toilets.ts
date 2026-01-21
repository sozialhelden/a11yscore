import { sql } from "drizzle-orm";
import type { Translate } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type ToiletCriterionId = "has-toilet";
export const getToiletCriteria = (
  t: Translate,
): Record<ToiletCriterionId, CriterionProperties> => ({
  "has-toilet": {
    name: t("A toilet is available"),
    osmTags: [
      { key: "toilets", value: "yes" },
      { key: "toilets", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'toilets' = 'yes' THEN 100
				WHEN ${table.tags}->'toilets' = 'no' THEN 10
				WHEN ${table.tags}->'toilets' != '' AND ${table.tags}->'toilets' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
    reason: t(
      "A toilet should be available for all visitors, but is especially important for people with certain medical conditions e.g. inflammatory bowel disease.",
    ),
    recommendations: [t("Consider installing a toilet if there is none.")],
  },
});
