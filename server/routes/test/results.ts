import { appDb } from "~/db";
import { results } from "~/db/schema/app";

// TODO: this is testing code to see if the results database connection works
export default defineEventHandler(async (_event) => {
	const count = await appDb.$count(results);
	if (count === 0) {
		await appDb.insert(results).values({});
	}
	return await appDb.query.results.findFirst();
});
