import "dotenv/config";

//https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: "2025-07-22",
  srcDir: "src/server",
  preset: "bun",
  experimental: {
    openAPI: true,
  },
  routeRules: {
    "/v1/**": { cors: true },
  },
  runtimeConfig: {
    env: process.env.NODE_ENV || "production",
    transifex: {
      token: "",
      secret: "",
    },
  },
});
