import { and, eq, gt, lt } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { expect } from "vitest";
import { appDb, type osmSyncDb } from "~/db";

type Database = typeof appDb | typeof osmSyncDb;
type Table = PgTableWithColumns<any>;
type Conditions = Record<
  string,
  string | number | boolean | { comparator: "eq" | "gt" | "lt"; value: string }
>;

export async function query<T extends { [x: string]: any }>(
  database: Database,
  table: Table,
  conditions: Conditions,
): Promise<T[]> {
  const result = await database
    .select()
    .from(table)
    .where(
      and(
        ...Object.entries(conditions).map(([key, value]) => {
          if (typeof value !== "object") {
            return eq(table[key], value);
          }

          if (value.comparator === "gt") {
            return gt(table[key], value.value);
          }

          if (value.comparator === "lt") {
            return lt(table[key], value.value);
          }

          throw new Error(`Unsupported comparator: ${value.comparator}`);
        }),
      ),
    );

  if (result.length === 0) {
    throw new Error(
      `No record found in table "${table}" matching conditions: ${JSON.stringify(conditions)}`,
    );
  }

  return result;
}

export async function findFirst(
  database: Database,
  table: Table,
  conditions: Conditions,
) {
  const results = await query(database, table, conditions);
  return results[0];
}

export async function appDbHas(table: Table, conditions: Conditions) {
  await expect(findFirst(appDb, table, conditions)).resolves.toBeTruthy();
}
