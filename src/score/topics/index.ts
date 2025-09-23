import { t } from "~/utils/i18n";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type TopicId =
  | "mobility"
  | "vision"
  | "hearing"
  | "toilet"
  | "neurodivergent"
  | "air-and-climate";

type TopicProperties = {
  name: () => string;
};

const configuredTopics: Record<TopicId, TopicProperties> = {
  mobility: {
    name: () => t("Mobility"),
  },
  vision: {
    name: () => t("Vision"),
  },
  hearing: {
    name: () => t("Hearing"),
  },
  toilet: {
    name: () => t("Toilet"),
  },
  neurodivergent: {
    name: () => t("Neurodivergent"),
  },
  "air-and-climate": {
    name: () => t("Air and Climate"),
  },
};

export type Topic = TopicProperties & {
  id: TopicId;
};
export const topics: Record<TopicId, Topic> = addIdToConfigEntries<
  TopicId,
  TopicProperties
>(configuredTopics);
