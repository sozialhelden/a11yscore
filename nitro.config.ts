import { REDIS_URL } from "~/utils/env";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	compatibilityDate: "2025-07-22",
	srcDir: "server",
	preset: "bun",
	runtimeConfig: {
		baseUrl: "",
	},
	storage: {
		cache: {
			driver: "redis",
			base: "cache",
			url: REDIS_URL,
		},
		default: {
			driver: "redis",
			base: "default",
			url: REDIS_URL,
		},
	},
});
