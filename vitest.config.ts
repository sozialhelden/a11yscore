import { join, resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~~": resolve(__dirname),
      "~": join(resolve(__dirname), "src/server"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          include: ["**/*.spec.{ts,js}"],
          name: "unit",
        },
      },
      {
        extends: true,
        test: {
          include: ["**/*.e2e-spec.{ts,js}"],
          name: "e2e",
        },
      },
    ],
  },
});
