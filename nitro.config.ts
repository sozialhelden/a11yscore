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
    meta: {
      title: "Sozialheld*innen API Reference",
      description: "",
      version: "1.0.0",
    },
    production: "prerender",
    route: "/openapi.json",
    ui: {
      scalar: {
        route: "/docs",
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
    baseURL: "http://localhost:3000",
    env: process.env.NODE_ENV || "production",
    internalAuth: {
      user: "",
      password: "",
    },
    transifex: {
      token: "",
      secret: "",
    },
  },
});
