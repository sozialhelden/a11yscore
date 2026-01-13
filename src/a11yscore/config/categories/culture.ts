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

export type CultureTopLevelCategoryId = "culture";
export const cultureTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<CultureTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  culture: {
    name: () => t("Culture"),
    sustainableDevelopmentGoals: [3, 4, 10],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the cultural amenities are accessible.");
      if (score >= 50)
        return t("Many of the cultural amenities are accessible.");
      if (score >= 30)
        return t("Some of the cultural amenities are accessible.");
      if (score > 0)
        return t("Only a few of the cultural amenities are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: () =>
      t(
        "This category will evaluate the accessibility of cultural amenities, including theaters, opera houses, museums and cinemas.",
      ),
    planned: true,
  },
});

/*
 * sub categories
 */

export type CultureSubCategoryId = None;

const weight = 1;
export const cultureSubCategories: Record<
  CultureSubCategoryId,
  Omit<SubCategory, "id">
> = {};
