import { type Mock, vi } from "vitest";

export function mockCategories(): {
  getTopLevelCategoriesMock: () => Mock;
  getSubCategoriesMock: () => Mock;
} {
  const getTopLevelCategoriesMock = vi.fn();
  const getSubCategoriesMock = vi.fn();

  vi.doMock("~~/src/a11yscore/config/categories", async (importActual) => ({
    ...(await importActual()),
    getTopLevelCategories: getTopLevelCategoriesMock,
    getSubCategories: getSubCategoriesMock,
  }));

  return {
    getTopLevelCategoriesMock: () => getTopLevelCategoriesMock,
    getSubCategoriesMock: () => getSubCategoriesMock,
  };
}

export function mockCriteria(): { getCriteriaMock: () => Mock } {
  const getCriteriaMock = vi.fn();

  vi.doMock("~~/src/a11yscore/config/criteria", async (importActual) => ({
    ...(await importActual()),
    getCriteria: getCriteriaMock,
  }));

  return {
    getCriteriaMock: () => getCriteriaMock,
  };
}
