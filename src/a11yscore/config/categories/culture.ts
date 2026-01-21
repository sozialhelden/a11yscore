import type { Translate } from "~/utils/i18n";
import type { TopLevelCategory } from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type CultureTopLevelCategoryId = "culture";
export const getCultureTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<CultureTopLevelCategoryId, Omit<TopLevelCategory, "id">> => ({
  culture: {
    name: t("Culture"),
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
    description: t(
      "This category will evaluate the accessibility of cultural amenities, including theaters, opera houses, museums and cinemas.",
    ),
    planned: true,
  },
});
