import type { Translate } from "~/utils/i18n";
import type { TopLevelCategory } from "~~/src/a11yscore/config/categories/index";

/*
 * top-level category
 */

export type GovernmentBuildingsTopLevelCategoryId = "government-buildings";
export const getGovernmentBuildingsTopLevelCategory = ({
  t,
  weight,
}: {
  t: Translate;
  weight: number;
}): Record<
  GovernmentBuildingsTopLevelCategoryId,
  Omit<TopLevelCategory, "id">
> => ({
  "government-buildings": {
    name: t("Government Buildings"),
    sustainableDevelopmentGoals: [8, 10, 16],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the government buildings are accessible.");
      if (score >= 50)
        return t("Many of the government buildings are accessible.");
      if (score >= 30)
        return t("Some of the government buildings are accessible.");
      if (score > 0)
        return t("Only a few of the government buildings are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: t(
      "This category will evaluate the accessibility of government buildings, including townhalls, government offices, authorities, courts and consulates.",
    ),
    planned: true,
  },
});
