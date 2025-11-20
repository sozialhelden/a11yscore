import { eq, sql } from "drizzle-orm";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import type { SetAdminAreaImageJob } from "~/queue";
import { getImage } from "~/utils/wikidata";

export async function handle(job: SetAdminAreaImageJob) {
  const { adminArea } = job.data;
  if (!adminArea.wikidata) return;

  const image = await getImage(adminArea.wikidata);
  if (!image) return;

  await appDb
    .update(adminAreas)
    .set({ image: sql`${image}::json` })
    .where(eq(adminAreas.id, adminArea.id));
}
