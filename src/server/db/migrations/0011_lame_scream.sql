ALTER TABLE "criterion_scores" RENAME COLUMN "original_score" TO "unadjusted_score";--> statement-breakpoint
ALTER TABLE "scores" RENAME COLUMN "original_score" TO "unadjusted_score";--> statement-breakpoint
ALTER TABLE "sub_category_scores" RENAME COLUMN "original_score" TO "unadjusted_score";--> statement-breakpoint
ALTER TABLE "toplevel_category_scores" RENAME COLUMN "original_score" TO "unadjusted_score";--> statement-breakpoint
ALTER TABLE "topic_scores" RENAME COLUMN "original_score" TO "unadjusted_score";