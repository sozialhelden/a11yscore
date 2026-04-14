import { drizzle } from "drizzle-orm/node-postgres";
import {
  appDbConfig,
  benchmarkAppDbConfig,
  osmSyncDbConfig,
  osmSyncPoolMax,
} from "~/db/env";
import * as appSchema from "~/db/schema/app";
import * as osmSyncSchema from "~/db/schema/osm-sync";

export const appDb = drizzle({
  connection: appDbConfig,
  schema: appSchema,
});

export const osmSyncDb = drizzle({
  connection: { ...osmSyncDbConfig, max: osmSyncPoolMax },
  schema: osmSyncSchema,
});

export const benchmarkAppDb = benchmarkAppDbConfig
  ? drizzle({
      connection: benchmarkAppDbConfig,
      schema: appSchema,
    })
  : null;
