import "dotenv/config";

function getEnv(name: string, defaultValue?: string): string {
  const isTest = process.env.NODE_ENV === "test";
  return process.env[`NITRO_${isTest ? "TEST_" : ""}${name}`] ?? defaultValue;
}

export const redisConnection = {
  host: getEnv("REDIS_HOST", "localhost"),
  port: parseInt(getEnv("REDIS_PORT", "6379")),
  password: getEnv("REDIS_PASSWORD"),
};
