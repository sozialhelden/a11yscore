import { faker } from "@faker-js/faker";
import type { OSMTag } from "~~/src/a11yscore/config/categories";

export function osmTagFactory(overrides = {}): OSMTag {
  return {
    key: faker.lorem.word(),
    value: faker.lorem.word(),
    ...overrides,
  };
}
