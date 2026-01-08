import "dotenv/config";

const baseUrl = new URL(
  process.env.NITRO_TEST_BASE_URL || "http://localhost:3000",
);

// make sure it works even if a path or hash is provided
baseUrl.hash = "";
baseUrl.pathname = "/";

// remove any trailing slashes
export const BASE_URL = baseUrl.toString().replace(/\/+$/, "");
