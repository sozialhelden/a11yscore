import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import { t } from "~/utils/i18n";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type PublicTransportTopLevelCategoryId = "public-transport";
export const publicTransportTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<PublicTransportTopLevelCategoryId, Omit<TopLevelCategory, "id">> =
  ({ weight }) => ({
    "public-transport": {
      name: () => t("Public Transport"),
      sustainableDevelopmentGoals: [9, 13, 15, 16],
      weight,
      interpretation: (score) => {
        if (score >= 75)
          return t("Most of the transport stops are accessible.");
        if (score >= 50)
          return t("Many of the transport stops are accessible.");
        if (score >= 30)
          return t("Some of the transport stops are accessible.");
        if (score > 0)
          return t("Only a few of the transport stops are accessible.");

        return t("The score could not be determined due to missing data.");
      },
    },
  });

/*
 * sub categories
 */

export type PublicTransportSubCategoryId = "train-stations";
export const publicTransportSubCategories: Record<
  PublicTransportSubCategoryId,
  Omit<SubCategory, "id">
> = {
  "train-stations": {
    name: () => t("Train Stations"),
    parent: "public-transport",
    weight: 1,
    reason: () => "",
    osmTags: [{ key: "railway", value: "station" }],
    sql: {
      from: osm_amenities,
      where: sql`${osm_amenities.tags}->'railway' = 'station'`,
    },
    topics: [
      {
        topicId: "mobility",
        criteria: [
          {
            criterionId: "is-wheelchair-accessible",
            weight: 1,
            reason: () => "",
          },
        ],
      },
    ],
  },
};
