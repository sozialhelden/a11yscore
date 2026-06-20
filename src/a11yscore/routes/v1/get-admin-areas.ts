import { notInArray } from "drizzle-orm";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { useIsDevelopment } from "~/utils/env";
import {
  excludedAdminAreas,
  includedGlobalCities,
} from "~~/src/a11yscore/config/admin-areas";

const globalCitiesSet = new Set(includedGlobalCities);

export default defineCachedEventHandler(
  async () => {
    const rows = await appDb
      .select()
      .from(adminAreas)
      .where(notInArray(adminAreas.osmId, excludedAdminAreas));

    return {
      adminAreas: rows.map((area) => ({
        ...area,
        globalCapital: globalCitiesSet.has(area.osmId),
      })),
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
