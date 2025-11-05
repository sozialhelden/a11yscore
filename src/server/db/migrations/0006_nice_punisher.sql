ALTER TABLE "scores" ALTER COLUMN "admin_area_id" SET DATA TYPE uuid USING 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_admin_area_id_admin_areas_id_fk" FOREIGN KEY ("admin_area_id") REFERENCES "public"."admin_areas"("id") ON DELETE no action ON UPDATE no action;
