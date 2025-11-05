import { sql } from "drizzle-orm";
import { osmSyncDb } from "~/db";
import { osm_admin, osm_admin_gen0 } from "~/db/schema/osm-sync";
import { useIsDevelopment } from "~/utils/env";
import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";

export default defineEventHandler(async () => {
  const germany = -51477;
  const allowedAdminLevels = [4];

  const query = sql`
    SELECT ${osm_admin.osm_id}, ${osm_admin.name}, ${osm_admin.admin_level}, ${osm_admin.wikidata}
    FROM ${osm_admin}
    JOIN ${osm_admin_gen0} ON ${osm_admin_gen0.osm_id} = ${germany}
    WHERE 
        ST_Covers(
            ${osm_admin_gen0.geometry},
            -- Checking only for a representative point inside the sub-region avoids
            -- missing sub-regions with exclaves and non-exact border topologies (like
            -- Bavaria in Germany). 
            ST_PointOnSurface(${osm_admin.geometry})
        )
        AND ${osm_admin.admin_level} IN ${allowedAdminLevels}
        AND ${osm_admin.name} != ''
    LIMIT 20
  `;

  return (await osmSyncDb.execute(query)).rows;
});
