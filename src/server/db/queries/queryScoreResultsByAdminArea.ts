import { desc, eq, inArray } from "drizzle-orm";
import { appDb } from "~/db";
import {
  criterionScores,
  scores,
  subCategoryScores,
  topicScores,
  toplevelCategoryScores,
} from "~/db/schema/app";

export async function queryScoreResultsByAdminArea(adminAreaId: number) {
  const [scoreResults] = await appDb
    .select()
    .from(scores)
    .where(eq(scores.adminAreaId, adminAreaId))
    .orderBy(desc(scores.createdAt))
    .limit(1)
    .execute();

  const toplevelCategoryScoreResults = await appDb
    .select()
    .from(toplevelCategoryScores)
    .where(eq(toplevelCategoryScores.scoreId, scoreResults.id))
    .execute();

  const subCategoryScoreResults = await appDb
    .select()
    .from(subCategoryScores)
    .where(
      inArray(
        subCategoryScores.toplevelCategoryScoreId,
        toplevelCategoryScoreResults.map(({ id }) => id),
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
    toplevelCategoryScoreResults,
    subCategoryScoreResults,
    topicScoreResults,
    criterionScoreResults,
  };
}
