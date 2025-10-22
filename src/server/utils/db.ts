import type { QueryWithTypings, SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const pgDialect = new PgDialect();

export function toQuery(sql: SQL): QueryWithTypings {
  return pgDialect.sqlToQuery(sql);
}
