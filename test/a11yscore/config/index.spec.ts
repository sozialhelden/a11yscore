import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SubCategory,
  TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";

const getSubCategoriesMock = vi.fn();

vi.mock(
  import("~~/src/a11yscore/config/categories"),
  async (importOriginal) => {
    return {
      ...(await importOriginal()),
      getSubCategories: getSubCategoriesMock,
    };
  },
);

describe("getChildCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return child categories for a given parent category", async () => {
    getSubCategoriesMock.mockReturnValue({
      "sub-cat-1": {
        id: "sub-cat-1",
        parent: "top-cat-1",
      },
      "sub-cat-2": {
        id: "sub-cat-2",
        parent: "top-cat-1",
      },
      "sub-cat-3": {
        id: "sub-cat-3",
        parent: "top-cat-2",
      },
    });
    const { getChildCategories } = await import("~~/src/a11yscore/config");
    expect(getChildCategories("top-cat-1" as TopLevelCategoryId)).toEqual([
      {
        id: "sub-cat-1",
        parent: "top-cat-1",
      },
      {
        id: "sub-cat-2",
        parent: "top-cat-1",
      },
    ] as unknown as SubCategory[]);
    expect(getChildCategories("top-cat-2" as TopLevelCategoryId)).toEqual([
      {
        id: "sub-cat-3",
        parent: "top-cat-2",
      },
    ] as unknown as SubCategory[]);
  });
});
