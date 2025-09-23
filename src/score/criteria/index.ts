import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import {
  type ClimateCriterionId,
  climateCriteria,
} from "~~/src/score/criteria/climate";
import {
  type WheelchairCriterionId,
  wheelchairCriteria,
} from "~~/src/score/criteria/wheelchair";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type CriterionId = WheelchairCriterionId | ClimateCriterionId;

export type CriterionProperties = {
  /**
   * The name of the criterion, used for display purposes.
   * Make sure to use the `t` function to translate it.
   * @example
   * ```
   * () => t("Is accessible for wheelchair users")
   * ```
   */
  name: () => string;
  /**
   * Links to resources that explain this criterion in more detail.
   * E.g. links to the OSM wiki of the relevant tags.
   * @example
   * ```
   * ["https://wiki.openstreetmap.org/wiki/Key:wheelchair"]
   * ```
   */
  resources?: `${"http://" | "https://"}${string}`[];
  /**
   * SQL clause that calculates the score for this criterion. This
   * will be embedded into a SELECT clause and aliased, so skip the
   * `SELECT` and `AS` parts. A score of 100 points is considered
   * fully accessible. A score higher than 100 is possible, but should
   * be used sparingly for exceptionally accessible places. The function
   * gets the table from the current category sub-select as argument, so
   * you can use the table's columns directly. If you need data from
   * multiple tables, feel free to select stuff from multiple tables here.
   * @example
   * ```
   * (table) => sql`AVG(CASE WHEN table.wheelchair = 'yes' THEN 100 ELSE 0 END)::bigint`
   * ```
   */
  sql: (table: PgTableWithColumns<any>) => SQL;
};

const configuredCriteria: Record<CriterionId, CriterionProperties> = {
  ...wheelchairCriteria,
  ...climateCriteria,
};

export type Criterion = CriterionProperties & {
  id: CriterionId;
};
export const criteria: Record<CriterionId, Criterion> = addIdToConfigEntries<
  CriterionId,
  CriterionProperties
>(configuredCriteria);
