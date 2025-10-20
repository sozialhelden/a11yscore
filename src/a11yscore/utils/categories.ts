import {
  type SubCategory,
  subCategories,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";

export function getChildCategories(parent: TopLevelCategoryId): SubCategory[] {
  return Object.values(subCategories).filter(
    (category) => (category as SubCategory)?.parent === parent,
  );
}
