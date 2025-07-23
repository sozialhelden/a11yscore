export default defineTask({
	meta: {
		name: "calculate",
		description: "Run calculations",
	},
	run(_event) {
		console.log("Calculating...");
		return { result: 42 };
	},
});
