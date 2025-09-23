import { drizzle } from "drizzle-orm/node-postgres";
import * as appSchema from "~/db/schema/app";
import * as osmSyncSchema from "~/db/schema/osm-sync";

function getConnection({
  user,
  password,
  db,
  host,
  port,
  ssl,
  allowSelfSigned,
}: {
  user: string;
  password: string;
  db: string;
  host: string;
  port: string;
  ssl: boolean;
  allowSelfSigned: boolean;
}) {
  return {
    user,
    password,
    db,
    host,
    port: parseInt(port),
    // if you want to connect to the database with an encrypted connection, the ssl options must
    // either be `true` or an object with additional ssl options. in this case, we pass an object
    // with the rejectUnauthorized options. when rejectUnauthorized is true, it will reject
    // self-signed certificates. so in order to allow self-signed certificates, we set it to false.
    ssl: ssl && { rejectUnauthorized: !allowSelfSigned },
  };
}

export const appDb = drizzle({
  connection: getConnection(useRuntimeConfig().database.app),
  schema: appSchema,
});

export const osmSyncDb = drizzle({
  connection: getConnection(useRuntimeConfig().database.osmSync),
  schema: osmSyncSchema,
});
