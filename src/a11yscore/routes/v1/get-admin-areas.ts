import { notInArray } from "drizzle-orm";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { useIsDevelopment } from "~/utils/env";
import { excludedAdminAreas } from "~~/src/a11yscore/config/admin-areas";

export default defineCachedEventHandler(
  async () => {
    return {
      adminAreas: await appDb
        .select()
        .from(adminAreas)
        .where(notInArray(adminAreas.osmId, excludedAdminAreas)),
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
