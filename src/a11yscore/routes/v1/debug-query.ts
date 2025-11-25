import { useIsDevelopment } from "~/utils/env";
import { PgDialect } from "drizzle-orm/pg-core";
import { osm_admin } from "~/db/schema/osm-sync";
import { getCombinedScoreQuery } from "~~/src/a11yscore/queries/score-sub-selects";
import { sql } from "drizzle-orm";

export default defineCachedEventHandler(
  async () => {
    const adminAreaId = -62422;
    const where = [sql`${osm_admin.osm_id} = ${adminAreaId}`];

    const pgDialect = new PgDialect();
    const sqlClause = getCombinedScoreQuery({ where: where });
    return pgDialect.sqlToQuery(sqlClause).sql;
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
