import { t } from "~/utils/i18n";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type TopicId =
  | "air-and-climate"
  | "general-assistance"
  | "hearing"
  | "mobility"
  | "neurodivergent"
  | "toilet"
  | "vision";

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
  "general-assistance": {
    name: () => t("General Assistance"),
  },
};

export type Topic = TopicProperties & {
  id: TopicId;
};
export const topics: Record<TopicId, Topic> = addIdToConfigEntries<
  TopicId,
  TopicProperties
>(configuredTopics);
