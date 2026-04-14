import "dotenv/config";

function getEnv(name: string, defaultValue?: string): string {
  const isTest = process.env.NODE_ENV === "test";
  return process.env[`NITRO_${isTest ? "TEST_" : ""}${name}`] ?? defaultValue;
}

export const appDbConfig = {
  user: getEnv("DATABASE_APP_USER", "a11yscore"),
  password: getEnv("DATABASE_APP_PASSWORD", ""),
  database: getEnv("DATABASE_APP_DB", "a11yscore"),
  host: getEnv("DATABASE_APP_HOST", "localhost"),
  port: parseInt(getEnv("DATABASE_APP_PORT", "5432")),
  ssl: getEnv("DATABASE_APP_SSL") === "true" && {
    rejectUnauthorized: !getEnv("DATABASE_APP_ALLOW_SELF_SIGNED"),
  },
};

export const osmSyncDbConfig = {
  user: getEnv("DATABASE_OSM_SYNC_USER", "imposm"),
  password: getEnv("DATABASE_OSM_SYNC_PASSWORD", ""),
  database: getEnv("DATABASE_OSM_SYNC_DB", "imposm"),
  host: getEnv("DATABASE_OSM_SYNC_HOST", "localhost"),
  port: parseInt(getEnv("DATABASE_OSM_SYNC_PORT", "5433")),
  ssl: getEnv("DATABASE_OSM_SYNC_SSL") === "true" && {
    rejectUnauthorized: !getEnv("DATABASE_OSM_SYNC_ALLOW_SELF_SIGNED"),
  },
};

export const osmSyncPoolMax = parseInt(
  getEnv("DATABASE_OSM_SYNC_POOL_MAX", "10"),
);

export const scoreReadConcurrency = parseInt(
  getEnv("SCORE_READ_CONCURRENCY", "8"),
);

const benchmarkDb = getEnv("DATABASE_BENCHMARK_DB");
export const benchmarkAppDbConfig = benchmarkDb
  ? {
      user: getEnv("DATABASE_BENCHMARK_USER", "a11yscore"),
      password: getEnv("DATABASE_BENCHMARK_PASSWORD", ""),
      database: benchmarkDb,
      host: getEnv("DATABASE_BENCHMARK_HOST", "localhost"),
      port: parseInt(getEnv("DATABASE_BENCHMARK_PORT", "5432")),
      ssl: getEnv("DATABASE_BENCHMARK_SSL") === "true" && {
        rejectUnauthorized: !getEnv("DATABASE_BENCHMARK_ALLOW_SELF_SIGNED"),
      },
    }
  : null;
