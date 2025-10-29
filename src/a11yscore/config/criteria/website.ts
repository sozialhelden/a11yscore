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
      reason: () =>
        t(
          "An official website provides essential information about the facility. This can help users plan their visit and access important details.",
        ),
      recommendations: () => [
        t(
          "Create an official website that includes key information such as location, opening hours, accessibility features, and contact details.",
        ),
      ],
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
      reason: () =>
        t(
          "Providing the menu on the official website allows users to make informed decisions about their visit, especially for those with dietary restrictions or preferences. It also allows people with visual impairments to access the menu more easily using screen readers.",
        ),
      recommendations: () => [
        t(
          "Upload the menu in an accessible format, such as HTML or PDF, to the official website.",
        ),
      ],
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
      reason: () =>
        t(
          "Online reservations improve accessibility by allowing users to easily book a visit without needing to make phone calls or visit in person.",
        ),
      recommendations: () => [
        t(
          "Implement an online reservation system on the official website that is easy to navigate and use.",
        ),
      ],
    },
  };
