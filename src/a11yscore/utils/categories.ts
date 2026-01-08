import {
  getSubCategoryList,
  type SubCategory,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";

export function getChildCategories(parent: TopLevelCategoryId): SubCategory[] {
  return getSubCategoryList().filter(
    (category) => (category as SubCategory)?.parent === parent,
  );
}
