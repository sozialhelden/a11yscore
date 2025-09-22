import { sql } from "drizzle-orm";
import { appDb, osmSyncDb } from "~/db";
import {
	criterionScores,
	scores,
	subCategoryScores,
	topicScores,
	toplevelCategoryScores,
} from "~/db/schema/app";
import { osm_admin, osm_amenities } from "~/db/schema/osm-sync";
import {
	type TopicId,
	type TopLevelCategoryId,
	topics,
	topLevelCategories,
} from "~~/src/score";
import { getChildCategories } from "~~/src/score/utils/categories";
import {
	getCriterionScoreAlias,
	getSubCategoryScoreAlias,
	getTopicScoreAlias,
	getTopLevelCategoryScoreAlias,
} from "~~/src/score/utils/sql-aliases";
import { getCombinedScoreQuery } from "~~/src/score/utils/sql-sub-selects";

// TODO: replace this with a proper task management system like Bull or Bree
export default defineTask({
	meta: {
		name: "calculate-score",
		description: "",
	},
	run: async () => {
		const adminAreas = ["-55764"];

		await Promise.all(
			adminAreas.map(async (adminAreaId) => {
				const join = [
					sql`JOIN ${osm_admin} ON ST_Intersects(${osm_amenities.geometry}, ${osm_admin.geometry})`,
				];
				const where = [sql`${osm_admin.osm_id} = ${adminAreaId}`];

				const sqlClause = getCombinedScoreQuery({ join, where });

				const { rows } = await osmSyncDb.execute(sqlClause);
				const result = rows.shift() as Record<string, number>;

				await appDb.transaction(async (tx) => {
					const [{ scoreId }] = await tx
						.insert(scores)
						.values({ adminAreaId, score: result.score })
						.returning({ scoreId: scores.id });

					for (const toplevelCategory of Object.keys(
						topLevelCategories,
					) as TopLevelCategoryId[]) {
						const [{ toplevelCategoryScoreId }] = await tx
							.insert(toplevelCategoryScores)
							.values({
								scoreId,
								toplevelCategory,
								score: result[getTopLevelCategoryScoreAlias(toplevelCategory)],
							})
							.returning({
								toplevelCategoryScoreId: toplevelCategoryScores.id,
							});

						for (const { id: subCategory, topics } of getChildCategories(
							toplevelCategory,
						)) {
							const [{ subCategoryScoreId }] = await tx
								.insert(subCategoryScores)
								.values({
									toplevelCategoryScoreId,
									subCategory,
									score: result[getSubCategoryScoreAlias(subCategory)],
								})
								.returning({ subCategoryScoreId: subCategoryScores.id });

							for (const { topicId: topic, criteria } of topics) {
								const [{ topicScoreId }] = await tx
									.insert(topicScores)
									.values({
										subCategoryScoreId,
										topic,
										score: result[getTopicScoreAlias(subCategory, topic)],
									})
									.returning({ topicScoreId: topicScores.id });

								for (const { criterionId: criterion } of criteria) {
									await tx.insert(criterionScores).values({
										topicScoreId,
										criterion,
										score:
											result[
												getCriterionScoreAlias(subCategory, topic, criterion)
											],
									});
								}
							}
						}
					}
				});
			}),
		);

		return {
			result: "okay",
		};
	},
});
