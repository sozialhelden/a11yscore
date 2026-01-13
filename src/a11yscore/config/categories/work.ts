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

export type WorkTopLevelCategoryId = "work";
export const workTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<WorkTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  work: {
    name: () => t("Work"),
    sustainableDevelopmentGoals: [1, 3, 4, 10, 9],
    weight,
    interpretation: (score) => {
      if (score >= 75) return t("Most of the work places are accessible.");
      if (score >= 50) return t("Many of the work places are accessible.");
      if (score >= 30) return t("Some of the work places are accessible.");
      if (score > 0) return t("Only a few of the work places are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: () =>
      t(
        "This category will evaluate the accessibility of work places, including office buildings, company offices, manufacturers and factories.",
      ),
    planned: true,
  },
});

/*
 * sub categories
 */

export type WorkSubCategoryId = None;

const weight = 1;
export const workSubCategories: Record<
  WorkSubCategoryId,
  Omit<SubCategory, "id">
> = {};
