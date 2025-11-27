import { sql } from "drizzle-orm";
import { t } from "~/utils/i18n";
import type { CriterionProperties } from "~~/src/a11yscore/config/criteria/index";

export type GeneralCriterionId =
  | "has-drinking-straws"
  | "is-lit"
  | "has-shelter"
  | "has-bench";
export const generalCriteria: Record<GeneralCriterionId, CriterionProperties> =
  {
    "has-drinking-straws": {
      name: () => t("Drinking straws are available"),
      osmTags: [
        { key: "drinking_straw", value: "yes" },
        { key: "drinking_straw", value: "no" },
        { key: "drinking_straw", value: "plastic" },
        { key: "drinking_straw", value: "paper" },
        { key: "drinking_straw", value: "bioplastic" },
        { key: "drinking_straw", value: "metal" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'drinking_straw' IN ('yes', 'plastic', 'paper', 'bioplastic', 'metal') THEN 100
				WHEN ${table.tags}->'drinking_straw' = 'no' THEN 10
				WHEN ${table.tags}->'drinking_straw' != '' AND ${table.tags}->'drinking_straw' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
      },
      reason: () =>
        t(
          "Drinking straws can help people with limited hand or arm mobility to drink more easily.",
        ),
      recommendations: () => [
        t(
          "Consider providing drinking straws, including eco-friendly options like paper or metal straws.",
        ),
      ],
    },
    "is-lit": {
      name: () => t("The facility is lit"),
      osmTags: [
        { key: "lit", value: "yes" },
        { key: "lit", value: "no" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'lit' = 'yes' THEN 100
				WHEN ${table.tags}->'lit' = 'no' THEN 10
				WHEN ${table.tags}->'lit' != '' AND ${table.tags}->'lit' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
      },
      reason: () =>
        t(
          "Well lit facilities improve visibility and safety for all visitors, especially those with visual impairments or mobility challenges.",
        ),
      recommendations: () => [
        t(
          "Consider installing adequate lighting in and around the facility to enhance visibility and safety.",
        ),
      ],
    },
    "has-shelter": {
      name: () => t("The public transport stop has shelter"),
      osmTags: [
        { key: "shelter", value: "yes" },
        { key: "shelter", value: "roof" },
        { key: "shelter", value: "limited" },
        { key: "shelter", value: "no" },
        { key: "covered", value: "yes" },
        { key: "covered", value: "no" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'shelter' IN ('yes', 'roof') OR ${table.tags}->'covered' = 'yes' THEN 100
                WHEN ${table.tags}->'shelter' = 'limited' THEN 50
				WHEN ${table.tags}->'shelter' = 'no' OR ${table.tags}->'covered' = 'no' THEN 10
                WHEN
                (
                (${table.tags}->'shelter' IS NOT NULL AND ${table.tags}->'shelter' !='')
                OR
                (${table.tags}->'covered' IS NOT NULL AND ${table.tags}->'covered' !='')
                )
                THEN 10
        ELSE 0
			END)::bigint`;
      },
      reason: () =>
        t(
          "Shelters at public transport stops provide protection from weather conditions, enhancing comfort and safety for all passengers.",
        ),
      recommendations: () => [
        t(
          "Consider providing shelters at public transport stops to protect passengers from adverse weather conditions.",
        ),
      ],
    },
    "has-bench": {
      name: () => t("The public transport stop has a bench."),
      osmTags: [
        { key: "bench", value: "yes" },
        { key: "bench", value: "stand_up_bench" },
        { key: "bench", value: "no" },
      ],
      sql: (table) => {
        return sql<number>`AVG(CASE 
				WHEN ${table.tags}->'bench' = 'yes' THEN 100
                WHEN ${table.tags}->'bench' = 'stand_up_bench' THEN 50
				WHEN ${table.tags}->'bench' = 'no' THEN 10
				WHEN ${table.tags}->'bench' != '' AND ${table.tags}->'bench' IS NOT NULL THEN 10
				ELSE 0
			END)::bigint`;
      },
      reason: () =>
        t(
          "Benches at public transport stops provide seating for passengers, enhancing comfort, especially for those with mobility issues or fatigue.",
        ),
      recommendations: () => [
        t(
          "Consider providing benches at public transport stops to offer seating for waiting passengers.",
        ),
      ],
    },
  };
