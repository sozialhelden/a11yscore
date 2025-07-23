export default defineCachedEventHandler(
	async (_event) => {
		return "Hello World!";
	},
	{ maxAge: 60 * 60 },
);
