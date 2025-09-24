import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/score/criteria/index";

export type WebsiteCriterionId =
  | "has-menu-on-website"
  | "reservation-via-website";

export const websiteCriteria: Record<WebsiteCriterionId, CriterionProperties> =
  {
    "has-menu-on-website": {
      name: () => t("Menu is available on the official website"),
      resources: ["https://wiki.openstreetmap.org/wiki/Key:website:menu"],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'website:menu' != '' AND ${table.tags}->'website:menu' IS NOT NULL THEN 100
				ELSE 0
			END)::bigint`;
      },
    },
    "reservation-via-website": {
      name: () => t("Reservations can be made via the official website"),
      resources: [
        "https://wiki.openstreetmap.org/wiki/Key:reservation:website",
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE
                WHEN ${table.tags}->'reservation:website' != '' AND ${table.tags}->'reservation:website' IS NOT NULL THEN 100
                ELSE 0
            END)::bigint`;
      },
    },
  };
