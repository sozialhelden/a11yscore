import { sql } from "drizzle-orm";
import slug from "slug";
import { appDb, osmSyncDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { osm_admin, osm_admin_gen0 } from "~/db/schema/osm-sync";
import { encodeOsmId } from "~/utils/osmIds";

const germany = -51477;
const allowedAdminLevels = [4,5,6];

// extend slug to handle German characters properly
slug.extend({ ü: "ue", ä: "ae", ö: "oe", ß: "ss" });

export type AdminAreaResult = {
  osm_id: number;
  name: string;
  admin_level: number;
  wikidata: string;
};

export async function handle() {
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
  `;

  const { rows } = await osmSyncDb.execute<AdminAreaResult>(query);

  for (const result of rows) {
    const adminArea = {
      osmId: result.osm_id,
      name: result.name,
      adminLevel: result.admin_level,
      hash: encodeOsmId(result.osm_id),
      slug: slug(result.name),
      wikidata: result.wikidata,
    };

    await appDb.insert(adminAreas).values(adminArea).onConflictDoUpdate({
      target: adminAreas.osmId,
      set: adminArea,
    });
  }
}
