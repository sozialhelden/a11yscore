ALTER TABLE "criterion_scores" ADD COLUMN "original_score" integer;--> statement-breakpoint
ALTER TABLE "scores" ADD COLUMN "original_score" integer;--> statement-breakpoint
ALTER TABLE "sub_category_scores" ADD COLUMN "original_score" integer;--> statement-breakpoint
ALTER TABLE "toplevel_category_scores" ADD COLUMN "original_score" integer;--> statement-breakpoint
ALTER TABLE "topic_scores" ADD COLUMN "original_score" integer;