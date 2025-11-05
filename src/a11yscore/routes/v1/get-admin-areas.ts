import { sql } from "drizzle-orm";
import slug from "slug";
import { osmSyncDb } from "~/db";
import { osm_admin, osm_admin_gen0 } from "~/db/schema/osm-sync";
import { useIsDevelopment } from "~/utils/env";
import {
  AdminArea,
  allowedAdminAreas,
} from "~~/src/a11yscore/config/admin-areas";

export type AdminAreaResult = {
  osm_id: number;
  name: string;
  admin_level: number;
  wikidata: string;
};
slug.extend({ ü: "ue", ä: "ae", ö: "oe", ß: "ss" });

function generateHash(): string {
  const chars = "abcdefghjkmnopqrstuvwxyz0123456789"; // excluded 'l' and 'i'
  let result = "";
  for (let j = 0; j < 6; j++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

  const adminAreas = (await osmSyncDb.execute<AdminAreaResult>(query)).rows;

  // scores/-51235-berlin
  // scores/berlin-s3hd

  return adminAreas.map((area) => {
    return { ...area, hash, slug: slug(area.name) };
  });
});
