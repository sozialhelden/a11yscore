import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const scores = pgTable("scores", {
	id: uuid("id").primaryKey().defaultRandom(),
	adminAreaId: varchar("admin_area_id").notNull(),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const toplevelCategoryScores = pgTable("toplevel_category_scores", {
	id: uuid("id").primaryKey().defaultRandom(),
	scoreId: uuid("score_id")
		.references(() => scores.id, { onDelete: "cascade" })
		.notNull(),
	toplevelCategory: varchar("toplevel_category").notNull(),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const subCategoryScores = pgTable("sub_category_scores", {
	id: uuid("id").primaryKey().defaultRandom(),
	toplevelCategoryScoreId: uuid("toplevel_category_score_id")
		.references(() => toplevelCategoryScores.id, { onDelete: "cascade" })
		.notNull(),
	subCategory: varchar("sub_category").notNull(),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const topicScores = pgTable("topic_scores", {
	id: uuid("id").primaryKey().defaultRandom(),
	subCategoryScoreId: uuid("sub_category_score_id")
		.references(() => subCategoryScores.id, { onDelete: "cascade" })
		.notNull(),
	topic: varchar("topic").notNull(),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const criterionScores = pgTable("criterion_scores", {
	id: uuid("id").primaryKey().defaultRandom(),
	topicScoreId: uuid("topic_score_id")
		.references(() => topicScores.id, { onDelete: "cascade" })
		.notNull(),
	criterion: varchar("criterion").notNull(),
	score: integer("score"),
	createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const scoresRelations = relations(scores, ({ many }) => ({
	toplevelCategoryScores: many(toplevelCategoryScores),
}));

export const toplevelCategoryScoresRelations = relations(
	toplevelCategoryScores,
	({ one, many }) => ({
		score: one(scores),
		subCategoryScores: many(subCategoryScores),
	}),
);

export const subCategoryScoresRelations = relations(
	subCategoryScores,
	({ one, many }) => ({
		toplevelCategoryScore: one(toplevelCategoryScores),
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
