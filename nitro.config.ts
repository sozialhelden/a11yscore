import { ENABLE_TASK_SCHEDULER, REDIS_URL } from "~/utils/env";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	compatibilityDate: "2025-07-22",
	srcDir: "server",
	preset: "bun",
	experimental: {
		tasks: ENABLE_TASK_SCHEDULER,
		openAPI: true,
	},
	scheduledTasks: ENABLE_TASK_SCHEDULER && {
		// runs at 2am every Sunday
		// "0 2 * * 7": ["calculate"],
		// TODO: this is testing code to see if the task scheduler works
		"* * * * *": ["calculate"],
	},
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
