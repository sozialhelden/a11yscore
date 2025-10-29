import { topLevelCategories } from "~~/src/a11yscore/config/categories";
import { criteria } from "~~/src/a11yscore/config/criteria";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import { byName } from "~~/src/a11yscore/utils/sort";
import {
  subCategoryView,
  topLevelCategoryView,
} from "~~/src/a11yscore/views/categories";
import { criterionView } from "~~/src/a11yscore/views/criteria";

export default defineEventHandler(async () => {
  return {
    topLevelCategories: Object.values(topLevelCategories)
      .sort(byName)
      .map((topLevelCategory) => {
        return {
          ...topLevelCategoryView(topLevelCategory),
          subCategories: getChildCategories(topLevelCategory.id)
            .sort(byName)
            .map(subCategoryView),
        };
      }),
    criteria: Object.values(criteria).sort(byName).map(criterionView),
  };
});
