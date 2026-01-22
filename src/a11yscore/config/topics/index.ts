import type { Translate } from "~/utils/i18n";
import { addIdToConfigEntries } from "~~/src/a11yscore/utils/config";

export type TopicId =
  | "air-and-climate"
  | "general-assistance"
  | "hearing"
  | "mobility"
  | "neurodivergent"
  | "toilet"
  | "vision";

type TopicProperties = {
  name: string;
};

export type Topic = TopicProperties & {
  id: TopicId;
};

export const getTopics = (t: Translate): Record<TopicId, Topic> =>
  addIdToConfigEntries<TopicId, TopicProperties>({
    mobility: {
      name: t("Mobility"),
    },
    vision: {
      name: t("Vision"),
    },
    hearing: {
      name: t("Hearing"),
    },
    toilet: {
      name: t("Toilet"),
    },
    neurodivergent: {
      name: t("Neurodiversity"),
    },
    "air-and-climate": {
      name: t("Air and Climate"),
    },
    "general-assistance": {
      name: t("Helpful Amenities"),
    },
  });
