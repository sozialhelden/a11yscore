import type { SQL } from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import type { OSMTag } from "~~/src/a11yscore/config/categories";
import {
  type BlindCriterionId,
  blindCriteria,
} from "~~/src/a11yscore/config/criteria/blind";
import {
  type ClimateCriterionId,
  climateCriteria,
} from "~~/src/a11yscore/config/criteria/climate";
import {
  type DeafCriterionId,
  deafCriteria,
} from "~~/src/a11yscore/config/criteria/deaf";
import {
  type EnvironmentCriterionId,
  environmentCriteria,
} from "~~/src/a11yscore/config/criteria/environment";
import {
  type GeneralCriterionId,
  generalCriteria,
} from "~~/src/a11yscore/config/criteria/general";
import {
  type ToiletCriterionId,
  toiletCriteria,
} from "~~/src/a11yscore/config/criteria/toilets";
import {
  type WebsiteCriterionId,
  websiteCriteria,
} from "~~/src/a11yscore/config/criteria/website";
import {
  type WheelchairCriterionId,
  wheelchairCriteria,
} from "~~/src/a11yscore/config/criteria/wheelchair";
import { addIdToConfigEntries } from "~~/src/a11yscore/utils/config";

export type CriterionId =
  | BlindCriterionId
  | ClimateCriterionId
  | DeafCriterionId
  | EnvironmentCriterionId
  | GeneralCriterionId
  | ToiletCriterionId
  | WebsiteCriterionId
  | WheelchairCriterionId;

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
   * A list of OSM tags that are used to select relevant objects for this category.
   * This is used for display purposes only. For the actual selection of data,
   * please use the `sql` property.
   */
  osmTags: OSMTag[];
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
  /**
   * A description why this criterion is generally relevant. This can be overridden on the
   * category/topic level to provide a category/topic-specific reason.
   * This will be used for display purposes in the frontend, so make sure to use the `t` function
   * to translate the description. Markdown syntax is allowed!
   * @example
   * ```
   * () => t("Wheelchair users **must** be able to enter and use the facilities without barriers.")
   * ```
   */
  reason: () => string;
  /**
   * A list of recommendations on how to generally improve this criterion. This can be overridden
   * on the category/topic level to provide a category/topic-specific recommendations.
   * This will be used for display purposes in the frontend, so make sure to use the `t` function
   * to translate the description. Markdown syntax is allowed!
   * @example
   * ```
   * () => [
   *     t("If the entrance has one or multiple steps, [consider getting a ramp](https://wheelramp.de) or installing a lift."),
   * ]
   * ```
   */
  recommendations: () => string[];
  /**
   * A list of links that provide more information about this criterion. Can be e.g. links to
   * guides, norms, or other resources.
   * This can be overridden on the category/topic level to provide a category/topic-specific
   * links. This will be used for display purposes in the frontend, so make sure to use the `t`
   * function to translate the label.
   * @example
   * ```
   * () => [
   *     {
   *         label: t("DIN 18040 - Accessible building design"),
   *         url: "https://www.din18040.de/wc-toiletten.htm"
   *     }
   * ]
   * ```
   */
  links?: () => { url: string; label: string }[];
};

const configuredCriteria: Record<CriterionId, CriterionProperties> = {
  ...generalCriteria,
  ...blindCriteria,
  ...climateCriteria,
  ...deafCriteria,
  ...environmentCriteria,
  ...toiletCriteria,
  ...websiteCriteria,
  ...wheelchairCriteria,
};

export type Criterion = CriterionProperties & {
  id: CriterionId;
};
export const criteria: Record<CriterionId, Criterion> = addIdToConfigEntries<
  CriterionId,
  CriterionProperties
>(configuredCriteria);
