import { sql } from "drizzle-orm";
import type { Translate } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type DeafCriterionId =
  | "is-accessible-to-hearing-impaired"
  | "has-hearing-loop";

export const getDeafCriteria = (
  t: Translate,
): Record<DeafCriterionId, CriterionProperties> => ({
  "is-accessible-to-hearing-impaired": {
    name: t("Accessible to hearing impaired people"),
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
    reason: t(
      "Hearing impaired people must be able to access and use the most important areas of the facility without barriers.",
    ),
    recommendations: [
      t("Provide visual alarms and notifications for important information."),
      t(
        "Consider installing hearing loops or other assistive listening devices.",
      ),
    ],
  },
  "has-hearing-loop": {
    name: t("Has hearing (induction) loop"),
    osmTags: [
      { key: "hearing_loop", value: "yes" },
      { key: "audio_loop", value: "yes" },
      { key: "hearing_loop", value: "no" },
      { key: "audio_loop", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'hearing_loop' = 'yes' THEN 100
				WHEN ${table.tags}->'audio_loop' ='yes' THEN 100
        WHEN ${table.tags}->'hearing_loop' = 'no' THEN 10
        WHEN ${table.tags}->'audio_loop' ='no' THEN 10
				ELSE 0
			END)::bigint`;
    },
    reason: t(
      "Hearing loops (also known as induction loops) can significantly improve the listening experience for people with hearing aids or cochlear implants, allowing them to better access important information and communicate effectively.",
    ),
    recommendations: [
      t(
        "Consider installing hearing loops or other assistive listening devices.",
      ),
    ],
  },
});
