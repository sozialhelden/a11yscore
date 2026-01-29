import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import type { Criterion, CriterionId } from "~~/src/a11yscore/config/criteria";
import { randomIdAndName } from "~~/test/_utils/factory";

export function criteriaFactory(overrides = {}): Criterion {
  return {
    ...randomIdAndName<CriterionId>(),
    osmTags: [],
    sql: () => sql`100`,
    reason: faker.lorem.sentence(),
    recommendations: [],
    links: [],
    ...overrides,
  };
}
