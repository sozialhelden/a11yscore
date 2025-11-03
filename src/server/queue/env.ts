import "dotenv/config";

const { NITRO_REDIS_HOST, NITRO_REDIS_PORT, NITRO_REDIS_PASSWORD } =
  process.env;

export const redisConnection = {
  host: NITRO_REDIS_HOST || "redis",
  port: NITRO_REDIS_PORT ? parseInt(NITRO_REDIS_PORT || "6379") : undefined,
  password: NITRO_REDIS_PASSWORD,
};
