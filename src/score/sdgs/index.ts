import type { IntRange } from "type-fest";
import { t } from "~/utils/i18n";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type SustainableDevelopmentGoalId = IntRange<1, 18>;

type SustainableDevelopmentGoalProperties = {
  name: () => string;
};

const configuredSustainableDevelopmentGoals: Record<
  SustainableDevelopmentGoalId,
  SustainableDevelopmentGoalProperties
> = {
  "1": {
    name: () => t("No Poverty"),
  },
  "2": {
    name: () => t("Zero Hunger"),
  },
  "3": {
    name: () => t("Good Health and Well-being"),
  },
  "4": {
    name: () => t("Quality Education"),
  },
  "5": {
    name: () => t("Gender Equality"),
  },
  "6": {
    name: () => t("Clean Water and Sanitation"),
  },
  "7": {
    name: () => t("Affordable and Clean Energy"),
  },
  "8": {
    name: () => t("Decent Work and Economic Growth"),
  },
  "9": {
    name: () => t("Industry, Innovation and Infrastructure"),
  },
  "10": {
    name: () => t("Reduced Inequalities"),
  },
  "11": {
    name: () => t("Sustainable Cities and Communities"),
  },
  "12": {
    name: () => t("Responsible Consumption and Production"),
  },
  "13": {
    name: () => t("Climate Action"),
  },
  "14": {
    name: () => t("Life below Water"),
  },
  "15": {
    name: () => t("Life on Land"),
  },
  "16": {
    name: () => t("Peace, Justice and Strong Institutions"),
  },
  "17": {
    name: () => t("Partnerships for the Goals"),
  },
};

export type SustainableDevelopmentGoal =
  SustainableDevelopmentGoalProperties & {
    id: SustainableDevelopmentGoalId;
  };
export const sustainableDevelopmentGoals: Record<
  SustainableDevelopmentGoalId,
  SustainableDevelopmentGoal
> = addIdToConfigEntries<
  SustainableDevelopmentGoalId,
  SustainableDevelopmentGoalProperties
>(configuredSustainableDevelopmentGoals);
