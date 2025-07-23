import { osmSyncDb, resultsDb } from "~/db";
import { osm_amenities } from "~/db/schema/osm-sync";
import { results } from "~/db/schema/results";

export default defineEventHandler(async (_event) => {
	try {
		await useStorage().set("health", "ok");
		await resultsDb.select({ id: results.id }).from(results).limit(1);
		await osmSyncDb
			.select({ id: osm_amenities.id })
			.from(osm_amenities)
			.limit(1);
	} catch (_error) {
		console.error("Healthcheck failed:", _error);
		throw createError({
			status: 500,
			statusMessage: "Server error",
			message: "Service is not healthy",
		});
	}

	return { healthy: true };
});
