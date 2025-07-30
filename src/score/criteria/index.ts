import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import {
	type ClimateCriteriaId,
	climateCriteria,
} from "~~/src/score/criteria/climate";
import {
	type WheelchairCriteriaId,
	wheelchairCriteria,
} from "~~/src/score/criteria/wheelchair";
import { addIdToConfigEntries } from "~~/src/score/utils/config";

export type CriteriaId = WheelchairCriteriaId | ClimateCriteriaId;

export type CriteriaProperties = {
	/**
	 * The name of the criterium, used for display purposes.
	 * Make sure to use the `t` function to translate it.
	 * @example
	 * ```
	 * () => t("Is accessible for wheelchair users")
	 * ```
	 */
	name: () => string;
	/**
	 * Links to resources that explain this criterium in more detail.
	 * E.g. links to the OSM wiki of the relevant tags.
	 * @example
	 * ```
	 * ["https://wiki.openstreetmap.org/wiki/Key:wheelchair"]
	 * ```
	 */
	resources?: `${"http://" | "https://"}${string}`[];
	/**
	 * SQL clause that calculates the score for this criterium. This
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

const configuredCriteria: Record<CriteriaId, CriteriaProperties> = {
	...wheelchairCriteria,
	...climateCriteria,
};

export type Criteria = CriteriaProperties & {
	id: CriteriaId;
};
export const criteria: Record<CriteriaId, Criteria> = addIdToConfigEntries<
	CriteriaId,
	CriteriaProperties
>(configuredCriteria);
