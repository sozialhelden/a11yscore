//https://nitro.unjs.io/config
export default defineNitroConfig({
	compatibilityDate: "2025-07-22",
	srcDir: "server",
	preset: "bun",
	runtimeConfig: {
		baseUrl: "",
		databaseUrl: "",
	},
});
