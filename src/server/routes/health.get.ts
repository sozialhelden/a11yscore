import { appDb, osmSyncDb } from "~/db";
import { scores } from "~/db/schema/app";
import { osm_amenities } from "~/db/schema/osm-sync";

export default defineEventHandler(async (_event) => {
  try {
    // test the kv-storage
    await useStorage().set("health", "ok");
    // test the app db
    await appDb.select({ id: scores.id }).from(scores).limit(1);
    // test the osm-sync db
    await osmSyncDb
      .select({ id: osm_amenities.id })
      .from(osm_amenities)
      .limit(1);
  } catch (error) {
    console.error("Healthcheck failed:", error);
    throw createError({
      status: 500,
      statusMessage: "Server error",
      message: "Service is not healthy",
    });
  }
  return { healthy: true };
});
