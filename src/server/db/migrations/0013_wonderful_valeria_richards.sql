CREATE UNIQUE INDEX "osm_id_idx" ON "admin_areas" USING btree ("osm_id");--> statement-breakpoint
CREATE INDEX "topic_score_id_idx" ON "criterion_scores" USING btree ("topic_score_id");--> statement-breakpoint
CREATE INDEX "admin_area_id_idx" ON "scores" USING btree ("admin_area_id");--> statement-breakpoint
CREATE INDEX "top_level_category_score_id_idx" ON "sub_category_scores" USING btree ("toplevel_category_score_id");--> statement-breakpoint
CREATE INDEX "score_id_idx" ON "toplevel_category_scores" USING btree ("score_id");--> statement-breakpoint
CREATE INDEX "sub_category_score_id_idx" ON "topic_scores" USING btree ("sub_category_score_id");