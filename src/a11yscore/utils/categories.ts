import type { Translate } from "~/utils/i18n";
import {
  getSubCategoryList,
  type SubCategory,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";

export function getChildCategories(
  parent: TopLevelCategoryId,
  t?: Translate,
): SubCategory[] {
  return getSubCategoryList(t).filter(
    (category) => (category as SubCategory)?.parent === parent,
  );
}
