import { useIsDevelopment } from "~/utils/env";
import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";

export default defineCachedEventHandler(
  async () => {
    return {
      adminAreas: allowedAdminAreas,
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
