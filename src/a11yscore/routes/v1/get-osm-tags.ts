import { useIsDevelopment } from "~/utils/env";
import {
  getChildCategories,
  getCriterionList,
  getTopLevelCategoryList,
} from "~~/src/a11yscore/config";
import { byName } from "~~/src/a11yscore/utils/sort";
import {
  subCategoryView,
  topLevelCategoryView,
} from "~~/src/a11yscore/views/categories";
import { criterionView } from "~~/src/a11yscore/views/criteria";

export default defineCachedEventHandler(
  async (event) => {
    const t = event.context.t;

    return {
      topLevelCategories: getTopLevelCategoryList(t)
        .sort(byName)
        .map((topLevelCategory) => {
          return {
            ...topLevelCategoryView(topLevelCategory),
            subCategories: getChildCategories(topLevelCategory.id, t)
              .sort(byName)
              .map(subCategoryView),
          };
        }),
      criteria: getCriterionList(t).sort(byName).map(criterionView),
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
