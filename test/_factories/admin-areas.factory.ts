import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import type { adminAreas } from "~/db/schema/app";
import type { osm_admin } from "~/db/schema/osm-sync";
import { allowedAdminLevels } from "~~/src/a11yscore/config/admin-areas";

export function osmAdminAreaFactory(
  middlePoint: { lat: number; lng: number },
  overrides = {},
): typeof osm_admin.$inferSelect {
  // this creates a square of 10km x 10km around the given middle point
  const squareSize = 10000; // 10000 meters = 10km

  // bearing east of north => 135 degrees is southeast
  const angle = 135 * (Math.PI / 180);

  // 1 degree of latitude is approximately 10^7 / 90 = 111111
  const displacementPerDegree = 111111;

  // this uses a simple equirectangular approximation, which is fine for small distances
  // especially for randomized testing data
  const displacementLat =
    (squareSize * Math.cos(angle)) / displacementPerDegree;
  const displacementLng =
    (squareSize * Math.sin(angle)) /
    Math.cos(middlePoint.lat) /
    displacementPerDegree;

  const topLeft = {
    lat: middlePoint.lat - displacementLat / 2,
    lng: middlePoint.lng - displacementLng / 2,
  };
  const bottomRight = {
    lat: middlePoint.lat + displacementLat / 2,
    lng: middlePoint.lng + displacementLng / 2,
  };

  return {
    osm_id: faker.number.int({ min: 1, max: 1_000_000 }),
    name: faker.location.city(),
    admin_level: faker.helpers.arrayElement(allowedAdminLevels),
    wikidata: `Q${faker.number.int({ min: 1 })}`,
    geometry:
      // TODO: drizzle doesn't support polygons yet, so we need to cast this to a point :D
      sql`ST_Transform( ST_MakeEnvelope(${topLeft.lng}, ${topLeft.lat}, ${bottomRight.lng}, ${bottomRight.lat}, 4326), 3857)` as unknown as [
        number,
        number,
      ],
    ...overrides,
  };
}

export function adminAreaFromOsmAdminAreaFactory(
  osmAdminArea: typeof osm_admin.$inferSelect,
  overrides = {},
): typeof adminAreas.$inferSelect {
  return {
    id: faker.string.uuid(),
    osmId: osmAdminArea.osm_id,
    name: osmAdminArea.name,
    adminLevel: osmAdminArea.admin_level,
    slug: faker.lorem.slug(),
    wikidata: osmAdminArea.wikidata,
    image: null,
    ...overrides,
  };
}
