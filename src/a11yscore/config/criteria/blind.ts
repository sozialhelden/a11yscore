import { sql } from "drizzle-orm";
import type { Translate } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type VisionCriterionId =
  | "is-accessible-to-visually-impaired"
  | "has-tactile-paving"
  | "has-information-board-with-speech-output"
  | "has-tactile-writing";

export const getVisionCriteria = (
  t: Translate,
): Record<VisionCriterionId, CriterionProperties> => ({
  "is-accessible-to-visually-impaired": {
    name: t("Accessible to visually impaired people"),
    osmTags: [
      { key: "blind", value: "yes" },
      { key: "blind", value: "designated" },
      { key: "blind", value: "limited" },
      { key: "blind", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE
                              WHEN ${table.tags}->'blind' IN ('yes', 'designated') THEN 100
                              WHEN ${table.tags}->'blind' = 'limited' THEN 50
                              WHEN ${table.tags}->'blind' = 'no' THEN 10
                              WHEN ${table.tags}->'blind' != '' AND ${table.tags}->'blind' IS NOT NULL THEN 10
                              ELSE 0
                              END)::bigint`;
    },
    recommendations: [
      t(
        "Provide tactile paving to guide visually impaired individuals to key areas such as entrances, exits, and service counters.",
      ),
      t(
        "Install braille signage for important information, including room numbers, restrooms, and emergency exits.",
      ),
      t(
        "Ensure that pathways are well-lit and free of obstacles to enhance safety and accessibility.",
      ),
      t(
        "Ensure there are audible signals or announcements for important information in addition to visual ones.",
      ),
    ],
    reason: t(
      "People with visual impairments must be able to enter and use the most important areas of the facility without barriers.",
    ),
  },
  "has-tactile-paving": {
    name: t("Tactile paving for visually impaired people"),
    osmTags: [
      { key: "tactile_paving", value: "yes" },
      { key: "tactile_paving", value: "partial" },
      { key: "tactile_paving", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'tactile_paving' = 'yes' THEN 100
				WHEN ${table.tags}->'tactile_paving' = 'partial' THEN 50
				WHEN ${table.tags}->'tactile_paving' = 'no' THEN 10
				WHEN ${table.tags}->'tactile_paving' != '' AND ${table.tags}->'tactile_paving' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
    },
    recommendations: [],
    reason: t(
      "People with visual impairments must be able to use tactile information to navigate.",
    ),
  },
  "has-information-board-with-speech-output": {
    name: t("Departure board with speech output for visually impaired people"),
    osmTags: [
      { key: "departures_board:speech_output", value: "yes" },
      { key: "departures_board:speech_output", value: "no" },
      { key: "passenger_information_display:speech_output", value: "yes" },
      { key: "passenger_information_display:speech_output", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE
        WHEN
          ${table.tags}->'departures_board:speech_output' = 'yes'
          OR ${table.tags}->'passenger_information_display:speech_output' = 'yes'
          THEN 100
        WHEN
          ${table.tags}->'departures_board:speech_output' = 'no'
          OR ${table.tags}->'passenger_information_display:speech_output' = 'no'
          THEN 10
        WHEN
          (
          (${table.tags}->'departures_board:speech_output' IS NOT NULL AND ${table.tags}->'departures_board:speech_output' NOT IN ('', 'yes', 'no'))
          OR
          (${table.tags}->'passenger_information_display:speech_output' IS NOT NULL AND ${table.tags}->'passenger_information_display:speech_output' NOT IN ('', 'yes', 'no'))
          )
          THEN 10
        ELSE 0
      END)::bigint`;
    },
    recommendations: [],
    reason: t(
      "People with visual impairments must be able to obtain passenger information.",
    ),
  },
  "has-tactile-writing": {
    name: t("Tactile writing for visually impaired people"),
    osmTags: [
      { key: "tactile_writing", value: "yes" },
      { key: "tactile_writing", value: "no" },
      // TODO: consider these tags in the future
      // { key: "tactile_writing:braille:xx", value: "yes" },
      // { key: "tactile_writing:braille:xx", value: "no" },
      // { key: "tactile_writing:fakoo", value: "yes" },
      // { key: "tactile_writing:fakoo", value: "no" },
      // { key: "tactile_writing:moon", value: "yes" },
      // { key: "tactile_writing:moon", value: "no" },
    ],
    sql: (table) => {
      return sql<number>`AVG(CASE
        WHEN ${table.tags}->'tactile_writing' = 'yes' THEN 100
        WHEN ${table.tags}->'tactile_writing' = 'no' THEN 10
        WHEN ${table.tags}->'tactile_writing' != '' AND ${table.tags}->'tactile_writing' IS NOT NULL THEN 10
        ELSE 0
      END)::bigint`;
    },
    recommendations: [],
    reason: t(
      "People with visual impairments must be able to find tactile information about the facility.",
    ),
  },
});
