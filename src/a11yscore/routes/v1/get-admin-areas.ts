import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { useIsDevelopment } from "~/utils/env";

export default defineCachedEventHandler(
  async () => {
    return {
      adminAreas: await appDb.select().from(adminAreas),
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
