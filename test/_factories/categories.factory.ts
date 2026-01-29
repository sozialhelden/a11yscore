import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { osm_amenities } from "~/db/schema/osm-sync";
import type {
  SubCategory,
  SubCategoryId,
  TopLevelCategory,
  TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import type { Criterion, CriterionId } from "~~/src/a11yscore/config/criteria";
import type { SustainableDevelopmentGoalId } from "~~/src/a11yscore/config/sdgs";
import type { Topic, TopicId } from "~~/src/a11yscore/config/topics";
import { osmTagFactory } from "~~/test/_factories/osm-tag.factory";
import { randomIdAndName, randomWeight } from "~~/test/_utils/factory";

export function topicCriteriaPivotFactory(
  topic: Topic,
  criteria: Criterion[],
  overrides = {},
): {
  topicId: TopicId;
  criteria: { criterionId: CriterionId; weight: number }[];
} {
  return {
    topicId: topic.id,
    criteria: criteria.map((criterion) => ({
      criterionId: criterion.id,
      weight: randomWeight(),
    })),
    ...overrides,
  };
}

export function topLevelCategoryFactory(overrides = {}): TopLevelCategory {
  return {
    ...randomIdAndName<TopLevelCategoryId>(),
    weight: randomWeight(),
    planned: false,
    description: faker.lorem.sentence(),
    interpretation: () => faker.lorem.sentence(),
    sustainableDevelopmentGoals: [
      faker.number.int({ min: 1, max: 18 }) as SustainableDevelopmentGoalId,
    ],
    ...overrides,
  };
}

export function subCategoryFactory(
  topLevelCategory: TopLevelCategory,
  overrides = {},
): SubCategory {
  return {
    ...randomIdAndName<SubCategoryId>(),
    weight: randomWeight(),
    description: faker.lorem.sentence(),
    sql: {
      from: osm_amenities,
      where: sql`1 = 1`,
    },
    osmTags: [osmTagFactory()],
    topics: [],
    parent: topLevelCategory.id,
    ...overrides,
  };
}
