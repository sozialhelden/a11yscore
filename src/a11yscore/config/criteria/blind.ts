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
    reason: () =>
      t(
        "People with visual impairments must be able to enter and use the most important areas of the facility without barriers.",
      ),
    recommendations: () => [
      t(
        "Provide tactile paving to guide visually impaired individuals to key areas such as entrances, exits, and service counters.",
      ),
      t(
        "Install braille signage for important information, including room numbers, restrooms, and emergency exits.",
      ),
      t(
        "Ensure that pathways are well-lit and free of obstacles to enhance safety and accessibility.",
      ),
      t(
        "Ensure there are audible signals or announcements for important information in addition to visual ones.",
      ),
    ],
  },
};
