import { faker } from "@faker-js/faker";
import { beforeEach } from "vitest";
import { appDb, osmSyncDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { osm_admin } from "~/db/schema/osm-sync";
import {
  adminAreaFromOsmAdminAreaFactory,
  osmAdminAreaFactory,
} from "~~/test/_factories/admin-areas.factory";

export function seedAdminArea(): {
  getMiddlePoint: () => { lat: number; lng: number };
  getAdminArea: () => ReturnType<typeof adminAreaFromOsmAdminAreaFactory>;
  getOsmAdminArea: () => ReturnType<typeof osmAdminAreaFactory>;
} {
  let middlePoint: { lat: number; lng: number };
  let adminArea: ReturnType<typeof adminAreaFromOsmAdminAreaFactory>;
  let osmAdminArea: ReturnType<typeof osmAdminAreaFactory>;

  beforeEach(async () => {
    middlePoint = {
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
    };

    osmAdminArea = osmAdminAreaFactory(middlePoint);
    await osmSyncDb.insert(osm_admin).values(osmAdminArea);

    adminArea = adminAreaFromOsmAdminAreaFactory(osmAdminArea);
    await appDb.insert(adminAreas).values(adminArea);
  });

  return {
    getMiddlePoint: () => middlePoint,
    getAdminArea: () => adminArea,
    getOsmAdminArea: () => osmAdminArea,
  };
}
