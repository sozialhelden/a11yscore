import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const adminAreas = pgTable(
  "admin_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    osmId: integer("osm_id").unique().notNull(),
    name: varchar("name").notNull(),
    adminLevel: integer("admin_level").notNull(),
    slug: varchar("slug").notNull(),
    wikidata: varchar("wikidata"),
    image: json("image"),
  },
  (table) => [uniqueIndex("osm_id_idx").on(table.osmId)],
);

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminAreaId: uuid("admin_area_id")
      .references(() => adminAreas.id, { onDelete: "no action" })
      .notNull(),
    score: integer("score"),
    unadjustedScore: integer("unadjusted_score"),
    dataQualityFactor: doublePrecision("data_quality_factor"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("admin_area_id_idx").on(table.adminAreaId)],
);

export const topLevelCategoryScores = pgTable(
  "toplevel_category_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scoreId: uuid("score_id")
      .references(() => scores.id, { onDelete: "cascade" })
      .notNull(),
    topLevelCategory: varchar("toplevel_category").notNull(),
    score: integer("score"),
    unadjustedScore: integer("unadjusted_score"),
    dataQualityFactor: doublePrecision("data_quality_factor"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("score_id_idx").on(table.scoreId)],
);

export const subCategoryScores = pgTable(
  "sub_category_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topLevelCategoryScoreId: uuid("toplevel_category_score_id")
      .references(() => topLevelCategoryScores.id, { onDelete: "cascade" })
      .notNull(),
    subCategory: varchar("sub_category").notNull(),
    score: integer("score"),
    unadjustedScore: integer("unadjusted_score"),
    dataQualityFactor: doublePrecision("data_quality_factor"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    index("top_level_category_score_id_idx").on(table.topLevelCategoryScoreId),
  ],
);

export const topicScores = pgTable(
  "topic_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subCategoryScoreId: uuid("sub_category_score_id")
      .references(() => subCategoryScores.id, { onDelete: "cascade" })
      .notNull(),
    topic: varchar("topic").notNull(),
    score: integer("score"),
    unadjustedScore: integer("unadjusted_score"),
    dataQualityFactor: doublePrecision("data_quality_factor"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("sub_category_score_id_idx").on(table.subCategoryScoreId)],
);

export const criterionScores = pgTable(
  "criterion_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicScoreId: uuid("topic_score_id")
      .references(() => topicScores.id, { onDelete: "cascade" })
      .notNull(),
    criterion: varchar("criterion").notNull(),
    score: integer("score"),
    tagCount: integer("tag_count"),
    unadjustedScore: integer("unadjusted_score"),
    dataQualityFactor: doublePrecision("data_quality_factor"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [index("topic_score_id_idx").on(table.topicScoreId)],
);

export const scoresRelations = relations(scores, ({ many }) => ({
  topLevelCategoryScores: many(topLevelCategoryScores),
}));

export const topLevelCategoryScoresRelations = relations(
  topLevelCategoryScores,
  ({ one, many }) => ({
    score: one(scores),
    subCategoryScores: many(subCategoryScores),
  }),
);

export const subCategoryScoresRelations = relations(
  subCategoryScores,
  ({ one, many }) => ({
    topLevelCategoryScore: one(topLevelCategoryScores),
    topicScores: many(topicScores),
  }),
);

export const topicScoresRelations = relations(topicScores, ({ one, many }) => ({
  subCategoryScore: one(subCategoryScores),
  criterionScores: many(criterionScores),
}));

export const criterionScoresRelations = relations(
  criterionScores,
  ({ one }) => ({
    topicScore: one(criterionScores),
  }),
);
