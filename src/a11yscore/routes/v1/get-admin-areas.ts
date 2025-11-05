import { sql } from "drizzle-orm";
import slug from "slug";
import { osmSyncDb } from "~/db";
import { osm_admin, osm_admin_gen0 } from "~/db/schema/osm-sync";
import { useIsDevelopment } from "~/utils/env";
import {
  AdminArea,
  allowedAdminAreas,
} from "~~/src/a11yscore/config/admin-areas";
import Hashids from "hashids";

export type AdminAreaResult = {
  osm_id: number;
  name: string;
  admin_level: number;
  wikidata: string;
};
slug.extend({ ü: "ue", ä: "ae", ö: "oe", ß: "ss" });


function encodeId(osmId: number): string {
  const salt = osmId < 0 ? 'r': 'w';
  const hashids = new Hashids(salt, 0, 'abcdefghjkmnopqrstuvwxyz0123456789');
  return salt + hashids.encode(Math.abs(osmId))
}

function decode(hash: string): number{
  const cleanedHash = hash.slice(1);
  const salt = hash.charAt(0);
  const signFactor = salt === 'r' ? -1 : 1;
  const hashids = new Hashids(salt, 0, 'abcdefghjkmnopqrstuvwxyz0123456789');
  return Number(hashids.decode(cleanedHash)[0]) * signFactor;
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
    const hash = encodeId(area.osm_id)
    return { ...area, hash: encodeId(area.osm_id), slug: slug(area.name), decoded: decode(hash)};
  });
});
