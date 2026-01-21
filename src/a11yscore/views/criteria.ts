import type { JsonView } from "~/views/types";
import type { Criterion } from "~~/src/a11yscore/config/criteria";

export const criterionView: JsonView<Criterion> = ({ id, name, osmTags }) => {
  return {
    id,
    name,
    osmTags,
  };
};
