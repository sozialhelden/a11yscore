import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type WheelchairCriterionId =
  | "is-wheelchair-accessible"
  | "has-wheelchair-accessible-toilet";

export const wheelchairCriteria: Record<
  WheelchairCriterionId,
  CriterionProperties
> = {
  "is-wheelchair-accessible": {
    name: () => t("Is accessible with wheelchair"),
    osmTags: [
      { key: "wheelchair", value: "yes" },
      { key: "wheelchair", value: "limited" },
      { key: "wheelchair", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.wheelchair} = 'yes' THEN 100
 				WHEN ${table.wheelchair} = 'limited' THEN 50
 				WHEN ${table.wheelchair} = 'no' THEN 10
 				ELSE 0
			END)::bigint`;
    },
    reason: () =>
      t(
        "Wheelchair users should be able to enter and use the most important areas of the facility without barriers and assistance.",
      ),
    recommendations: () => [
      t(
        "If the entrance has one or two steps, consider [getting a removable ramp](https://wheelramp.de).",
      ),
      t(
        "Consider installing automatic doors or ensuring that doors can be opened without assistance.",
      ),
      t("Consider widening narrow doorways to at least 90 cm (36 inches)."),
    ],
    links: () => [
      {
        label: t("Removable ramps for wheelchair accessibility"),
        url: "https://wheelramp.de",
      },
    ],
  },
  "has-wheelchair-accessible-toilet": {
    name: () => t("Toilet is accessible with wheelchair"),
    osmTags: [
      { key: "toilets:wheelchair", value: "yes" },
      { key: "toilets:wheelchair", value: "no" },
    ],
    sql: (table) =>
      sql<number>`AVG(CASE 
				WHEN ${table["toilets:wheelchair"]} = 'yes' THEN 100
 				WHEN ${table["toilets:wheelchair"]} = 'no' THEN 10
 				ELSE 0
			END)::bigint`,
    reason: () => "Wheelchair users must be able to use the toilet.",
    recommendations: () => [
      t("Consider installing grab rails to existing toilets."),
      t(
        "Consider raising the toilet seat to a comfortable height (about 48 cm).",
      ),
    ],
    links: () => [
      {
        label: t(
          "DIN 18040-2 Standard for Accessible Design of Buildings - Bathrooms",
        ),
        url: "https://nullbarriere.de/din18040-2-bad.htm",
      },
    ],
  },
};
