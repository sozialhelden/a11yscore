import "dotenv/config";

const enableTaskScheduler = process.env.NITRO_ENABLE_TASK_SCHEDULER === "true";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	compatibilityDate: "2025-07-22",
	srcDir: "src/server",
	preset: "bun",
	experimental: {
		tasks: enableTaskScheduler,
		openAPI: true,
	},
	scheduledTasks: enableTaskScheduler && {
		// runs at 2am every Sunday
		"0 2 * * 7": ["calculate"],
	},
	routeRules: {
		"/v1/**": { cors: true },
	},
	runtimeConfig: {
		env: process.env.NODE_ENV || "production",
		database: {
			app: {
				user: "a11yscore",
				password: "a11yscore",
				db: "a11yscore",
				host: "localhost",
				port: "5432",
				ssl: false,
				allowSelfSigned: false,
			},
			osmSync: {
				user: "imposm",
				password: "",
				db: "imposm",
				host: "localhost",
				port: "5433",
				ssl: false,
				allowSelfSigned: false,
			},
		},
		transifex: {
			token: "",
			secret: "",
		},
	},
});
