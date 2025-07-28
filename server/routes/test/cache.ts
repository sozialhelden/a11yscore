// TODO: this is testing code to see if the cache works
export default defineCachedEventHandler(
	async (_event) => {
		return Math.random();
	},
	{ maxAge: 60 * 60 },
);
