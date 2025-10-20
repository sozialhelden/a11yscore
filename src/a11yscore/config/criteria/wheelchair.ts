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
  },
};
