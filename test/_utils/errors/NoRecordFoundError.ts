import type { Conditions, Table } from "~~/test/_utils/database-assertions";

export class NoRecordFoundError extends Error {
  name = "NoRecordFoundError";

  constructor(
    public readonly table: Table,
    public readonly conditions: Conditions,
  ) {
    super(
      `No record found in table "${table}" matching conditions: ${JSON.stringify(
        conditions,
      )}`,
    );
  }
}
