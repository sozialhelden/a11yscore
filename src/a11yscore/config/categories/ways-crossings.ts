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

export type WaysCrossingsTopLevelCategoryId = "ways-crossings";
export const waysCrossingsTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<WaysCrossingsTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  "ways-crossings": {
    name: () => t("Ways and Crossings"),
    sustainableDevelopmentGoals: [3, 4, 10],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the ways and crossings are easy to navigate.");
      if (score >= 50)
        return t("Many of the ways and crossings are easy to navigate.");
      if (score >= 30)
        return t("Some of the ways and crossings are easy to navigate.");
      if (score > 0)
        return t("Only a few of the ways and crossings are easy to navigate.");

      return t("The score could not be determined due to missing data.");
    },
    description: () =>
      t(
        "This category will evaluate the accessibility of ways and crossings, including pavement surfaces, curb heights, intersections and crossings and traffic lights.",
      ),
    planned: true,
  },
});
