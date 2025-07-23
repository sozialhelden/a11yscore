import "dotenv/config";

/**
 * Helper file for all environment stuff that cannot use nitros runtime config
 * like tests (base url), database and storage.
 *
 * ⚠️ Do not add additional env variables here, unless you really need to. Try
 * to use nitros runtime config instead:
 * https://nitro.build/guide/configuration#runtime-configuration
 *
 * Currently, it's not possible to use nitros runtime config for the storage
 * layer directly. But there's a workaround using a custom plugin:
 * https://github.com/nitrojs/nitro/issues/1161#issuecomment-1511444675
 * We decided to not use this workaround, as we encounter the same issue with
 * the database layer as drizzle-kit needs access to some configuration things
 * as well as vitest and both have no knowledge about nitros internals.
 */

const {
	RESULTS_POSTGRES_USER,
	RESULTS_POSTGRES_PASSWORD,
	RESULTS_POSTGRES_HOST,
	RESULTS_POSTGRES_PORT,
	RESULTS_POSTGRES_DB,
} = process.env;
export const RESULTS_DATABASE_URL = `postgres://${RESULTS_POSTGRES_USER}:${RESULTS_POSTGRES_PASSWORD}@${RESULTS_POSTGRES_HOST}:${RESULTS_POSTGRES_PORT}/${RESULTS_POSTGRES_DB}`;

const {
	OSM_SYNC_POSTGRES_USER,
	OSM_SYNC_POSTGRES_PASSWORD,
	OSM_SYNC_POSTGRES_HOST,
	OSM_SYNC_POSTGRES_PORT,
	OSM_SYNC_POSTGRES_DB,
} = process.env;
export const OSM_SYNC_DATABASE_URL = `postgres://${OSM_SYNC_POSTGRES_USER}:${OSM_SYNC_POSTGRES_PASSWORD}@${OSM_SYNC_POSTGRES_HOST}:${OSM_SYNC_POSTGRES_PORT}/${OSM_SYNC_POSTGRES_DB}`;

const { REDIS_USER, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;
export const REDIS_URL = `redis://${REDIS_USER || REDIS_PASSWORD ? `${REDIS_USER}:${REDIS_PASSWORD}@` : ""}${REDIS_HOST}:${REDIS_PORT}`;

export const BASE_URL = process.env.NITRO_PUBLIC_BASE_URL;

export const ENABLE_TASK_SCHEDULER =
	process.env.NITRO_ENABLE_TASK_SCHEDULER === "true";
