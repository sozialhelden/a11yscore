type NestedRecord<T> = {
  [k: string | symbol]: T | T[] | NestedRecord<T> | NestedRecord<T>[];
};

export type JsonView<T> = (
  data: T,
) => NestedRecord<string | number | boolean | null | undefined>;
