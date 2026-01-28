import type { Topic, TopicId } from "~~/src/a11yscore/config/topics";
import { randomIdAndName } from "~~/test/_utils/factory";

export function topicsFactory(overrides = {}): Topic {
  return {
    ...randomIdAndName<TopicId>(),
    ...overrides,
  };
}
