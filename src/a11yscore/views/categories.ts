import type { JsonView } from "~/views/types";
import type {
  SubCategory,
  TopLevelCategory,
} from "~~/src/a11yscore/config/categories";

export const topLevelCategoryView: JsonView<TopLevelCategory> = ({
  id,
  name,
}) => {
  return {
    id,
    name: name(),
  };
};

export const subCategoryView: JsonView<SubCategory> = ({
  id,
  name,
  osmTags,
  description,
}) => {
  return {
    id,
    name: name(),
    description: description?.(),
    osmTags,
  };
};
