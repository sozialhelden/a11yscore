import { sql } from "drizzle-orm";
import { integer, uuid, varchar } from "drizzle-orm/pg-core";
import slug from "slug";
import { appDb, osmSyncDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { osm_admin, osm_admin_gen0 } from "~/db/schema/osm-sync";
import { decodeOsmId, encodeOsmId } from "~/utils/osmIds";

export type AdminAreaResult = {
  osm_id: number;
  name: string;
  admin_level: number;
  wikidata: string;
};
slug.extend({ ü: "ue", ä: "ae", ö: "oe", ß: "ss" });

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

  const adminAreasResult = (await osmSyncDb.execute<AdminAreaResult>(query))
    .rows;

  // scores/-51235-berlin
  // scores/berlin-s3hd
  const mappedAdminAreas = adminAreasResult.map((area) => {
    return {
      osmId: area.osm_id,
      name: area.name,
      adminLevel: area.admin_level,
      hash: encodeOsmId(area.osm_id),
      slug: slug(area.name),
      wikidata: area.wikidata,
    };
  });

  for (const area of mappedAdminAreas) {
    await appDb.insert(adminAreas).values(area).onConflictDoUpdate({
      target: adminAreas.osmId,
      set: area,
    });
  }

  return 0;
});
