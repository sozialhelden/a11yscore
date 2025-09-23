CREATE TABLE "criterion_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_score_id" uuid NOT NULL,
	"criterion" varchar NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_area_id" integer NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sub_category_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"toplevel_category_score_id" uuid NOT NULL,
	"sub_category" varchar NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topic_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_category_score_id" uuid NOT NULL,
	"topic" varchar NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "toplevel_category_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score_id" uuid NOT NULL,
	"toplevel_category" varchar NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "results" CASCADE;--> statement-breakpoint
ALTER TABLE "criterion_scores" ADD CONSTRAINT "criterion_scores_topic_score_id_topic_scores_id_fk" FOREIGN KEY ("topic_score_id") REFERENCES "public"."topic_scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_category_scores" ADD CONSTRAINT "sub_category_scores_toplevel_category_score_id_toplevel_category_scores_id_fk" FOREIGN KEY ("toplevel_category_score_id") REFERENCES "public"."toplevel_category_scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_scores" ADD CONSTRAINT "topic_scores_sub_category_score_id_sub_category_scores_id_fk" FOREIGN KEY ("sub_category_score_id") REFERENCES "public"."sub_category_scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toplevel_category_scores" ADD CONSTRAINT "toplevel_category_scores_score_id_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."scores"("id") ON DELETE cascade ON UPDATE no action;