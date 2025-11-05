import { desc, eq, inArray } from "drizzle-orm";
import { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  topLevelCategoryScores,
} from "~/db/schema/app";

export async function queryScoreResultsByAdminArea(adminAreaId: string) {
  const [scoreResults] = await appDb
    .select()
    .from(scores)
    .where(eq(scores.adminAreaId, adminAreaId))
    .orderBy(desc(scores.createdAt))
    .limit(1)
    .execute();

  if (!scoreResults) {
    return { scoreResults: undefined };
  }

  const topLevelCategoryScoreResults = await appDb
    .select()
    .from(topLevelCategoryScores)
    .where(eq(topLevelCategoryScores.scoreId, scoreResults.id))
    .execute();

  const subCategoryScoreResults = await appDb
    .select()
    .from(subCategoryScores)
    .where(
      inArray(
        subCategoryScores.topLevelCategoryScoreId,
        topLevelCategoryScoreResults.map(({ id }) => id),
      ),
    )
    .execute();

  const topicScoreResults = await appDb
    .select()
    .from(topicScores)
    .where(
      inArray(
        topicScores.subCategoryScoreId,
        subCategoryScoreResults.map(({ id }) => id),
      ),
    )
    .execute();

  const criterionScoreResults = await appDb
    .select()
    .from(criterionScores)
    .where(
      inArray(
        criterionScores.topicScoreId,
        topicScoreResults.map(({ id }) => id),
      ),
    )
    .execute();

  return {
    scoreResults,
    topLevelCategoryScoreResults,
    subCategoryScoreResults,
    topicScoreResults,
    criterionScoreResults,
  };
}
