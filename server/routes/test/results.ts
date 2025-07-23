import { resultsDb } from "~/db";
import { results } from "~/db/schema/results";

// TODO: this is testing code to see if the results database connection works
export default defineEventHandler(async (_event) => {
	const count = await resultsDb.$count(results);
	if (count === 0) {
		await resultsDb.insert(results).values({});
	}
	return await resultsDb.query.results.findFirst();
});
