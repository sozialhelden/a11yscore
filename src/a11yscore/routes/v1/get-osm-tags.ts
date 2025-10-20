import { topLevelCategories } from "~~/src/a11yscore/config/categories";
import { criteria } from "~~/src/a11yscore/config/criteria";
import { getChildCategories } from "~~/src/a11yscore/utils/categories";
import {
  subCategoryView,
  topLevelCategoryView,
} from "~~/src/a11yscore/views/categories";
import { criterionView } from "~~/src/a11yscore/views/criteria";

function sortByName(a: { name: () => string }, b: { name: () => string }) {
  if (a.name() === b.name()) {
    return 0;
  }
  return a.name() > b.name() ? 1 : -1;
}

export default defineEventHandler(async () => {
  return {
    topLevelCategories: Object.values(topLevelCategories)
      .sort(sortByName)
      .map((topLevelCategory) => {
        return {
          ...topLevelCategoryView(topLevelCategory),
          subCategories: getChildCategories(topLevelCategory.id)
            .sort(sortByName)
            .map(subCategoryView),
        };
      }),
    criteria: Object.values(criteria).sort(sortByName).map(criterionView),
  };
});
