import type { Translate } from "~/utils/i18n";
import type { TopLevelCategory } from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type WorkTopLevelCategoryId = "work";
export const getWorkTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<WorkTopLevelCategoryId, Omit<TopLevelCategory, "id">> => ({
  work: {
    name: t("Work"),
    sustainableDevelopmentGoals: [1, 3, 4, 10, 9],
    weight,
    interpretation: (score) => {
      if (score >= 75) return t("Most of the work places are accessible.");
      if (score >= 50) return t("Many of the work places are accessible.");
      if (score >= 30) return t("Some of the work places are accessible.");
      if (score > 0) return t("Only a few of the work places are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "This category will evaluate the accessibility of work places, including office buildings, company offices, manufacturers and factories.",
    ),
    planned: true,
  },
});
