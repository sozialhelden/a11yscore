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

export type EducationTopLevelCategoryId = "education";
export const educationTopLevelCategory: ({
  weight,
}: {
  weight: number;
}) => Record<EducationTopLevelCategoryId, Omit<TopLevelCategory, "id">> = ({
  weight,
}) => ({
  education: {
    name: () => t("Education"),
    sustainableDevelopmentGoals: [4, 8, 9, 10],
    weight,
    interpretation: (score) => {
      if (score >= 75)
        return t("Most of the education facilities are accessible.");
      if (score >= 50)
        return t("Many of the education facilities are accessible.");
      if (score >= 30)
        return t("Some of the education facilities are accessible.");
      if (score > 0)
        return t("Only a few of the education facilities are accessible.");

      return t("The score could not be determined due to missing data.");
    },
    description: () =>
      t(
        "This category will evaluate the accessibility of educational facilities, including schools, universities, and libraries.",
      ),
    planned: true,
  },
});

/*
 * sub categories
 */

export type EducationSubCategoryId = None;

const weight = 1;
export const educationSubCategories: Record<
  EducationSubCategoryId,
  Omit<SubCategory, "id">
> = {};
