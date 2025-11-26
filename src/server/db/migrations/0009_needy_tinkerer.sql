ALTER TABLE "scores" ADD COLUMN "data_quality_factor" double precision;--> statement-breakpoint
ALTER TABLE "sub_category_scores" ADD COLUMN "data_quality_factor" double precision;--> statement-breakpoint
ALTER TABLE "toplevel_category_scores" ADD COLUMN "data_quality_factor" double precision;--> statement-breakpoint
ALTER TABLE "topic_scores" ADD COLUMN "data_quality_factor" double precision;