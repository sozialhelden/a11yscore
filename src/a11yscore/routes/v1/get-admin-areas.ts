import { useIsDevelopment } from "~/utils/env";
import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";
import {sql} from "drizzle-orm";
import {osmSyncDb} from "~/db";
import {osm_admin} from "~/db/schema/osm-sync";

export default defineEventHandler(
  async () => {
      const query = sql`SELECT * FROM ${osm_admin} LIMIT 5`;

    //return osmSyncDb.execute(query);
      return "hello world";
  },
);