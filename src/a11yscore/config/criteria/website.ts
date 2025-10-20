import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type WebsiteCriterionId =
  | "has-menu-on-website"
  | "has-website"
  | "reservation-via-website";

export const websiteCriteria: Record<WebsiteCriterionId, CriterionProperties> =
  {
    "has-website": {
      name: () => t("Has an official website"),
      osmTags: [
        { key: "contact:website", value: "*" },
        { key: "website", value: "*" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE
                WHEN ${table.tags}->'contact:website' != '' AND ${table.tags}->'contact:website' IS NOT NULL THEN 100
                WHEN ${table.tags}->'website' != '' AND ${table.tags}->'website' IS NOT NULL THEN 100
                ELSE 0
            END)::bigint`;
      },
    },
    "has-menu-on-website": {
      name: () => t("Menu is available on the official website"),
      osmTags: [{ key: "website:menu", value: "*" }],
      sql: (table) => {
        return sql<number>`AVG(CASE
				WHEN ${table.tags}->'website:menu' != '' AND ${table.tags}->'website:menu' IS NOT NULL THEN 100
				ELSE 0
			END)::bigint`;
      },
    },
    "reservation-via-website": {
      name: () => t("Reservations can be made via the official website"),
      osmTags: [{ key: "reservation:website", value: "*" }],
      sql: (table) => {
        return sql<number>`AVG(CASE
                WHEN ${table.tags}->'reservation:website' != '' AND ${table.tags}->'reservation:website' IS NOT NULL THEN 100
                ELSE 0
            END)::bigint`;
      },
    },
  };
