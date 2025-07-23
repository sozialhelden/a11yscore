// TODO: this is testing code to see if the task system works
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
