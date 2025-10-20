import "dotenv/config";

//https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: "2025-07-22",
  srcDir: "src/server",
  preset: "bun",
  experimental: {
    openAPI: true,
  },
  openAPI: {
    production: "prerender",
    route: "/openapi.json",
    ui: {
      scalar: {
        route: "/",
        title: "API Reference",
        layout: "modern",
        defaultOpenAllTags: true,
        hideClientButton: true,
        theme: "deepSpace",
        showSidebar: true,
        telemetry: false,
      },
      swagger: false,
    },
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
