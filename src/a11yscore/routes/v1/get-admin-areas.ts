import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";

export default defineEventHandler(async () => {
  return {
    adminAreas: await appDb.select().from(adminAreas),
  };
});
