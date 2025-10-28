import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";
import {
  type SubCategoryId,
  subCategories,
  type TopLevelCategoryId,
  topLevelCategories,
} from "~~/src/a11yscore/config/categories";
import { type CriterionId, criteria } from "~~/src/a11yscore/config/criteria";
import { type TopicId, topics } from "~~/src/a11yscore/config/topics";
import { queryScoreResultsByAdminArea } from "~~/src/a11yscore/queries/query-score-results-by-admin-area";

export default defineEventHandler(async (event) => {
  const adminArea = getRouterParam(event, "adminArea");
  const adminAreaId = allowedAdminAreas.find(
    ({ slug }) => slug === adminArea,
  )?.id;

  if (!adminAreaId) {
    throw createError({
      status: 404,
      statusMessage: "Not found",
      message: "Admin area not found",
    });
  }

  const {
    scoreResults,
    topLevelCategoryScoreResults,
    subCategoryScoreResults,
    topicScoreResults,
    criterionScoreResults,
  } = await queryScoreResultsByAdminArea(adminAreaId);

  if (!scoreResults) {
    throw createError({
      status: 404,
      statusMessage: "Not found",
      message: "Calculated score for admin area not found",
    });
  }

  // TODO: refactor this
  const result = topLevelCategoryScoreResults.map(
    ({ id, topLevelCategory, score }) => {
      const topLevelCategoryProperties =
        topLevelCategories[topLevelCategory as TopLevelCategoryId];
      return {
        name: topLevelCategoryProperties.name(),
        interpretation: topLevelCategoryProperties.interpretation?.(score),
        topLevelCategory,
        score,
        subCategories: subCategoryScoreResults
          .filter(
            ({ topLevelCategoryScoreId }) => topLevelCategoryScoreId === id,
          )
          .map(({ id, subCategory, score }) => {
            const subCategoryProperties =
              subCategories[subCategory as SubCategoryId];
            return {
              name: subCategoryProperties.name(),
              description: subCategoryProperties.description?.(),
              osmTags: subCategoryProperties.osmTags,
              subCategory,
              score,
              topics: topicScoreResults
                .filter(({ subCategoryScoreId }) => subCategoryScoreId === id)
                .map(({ id, topic, score }) => ({
                  name: topics[topic as TopicId].name(),
                  topic,
                  score,
                  criteria: criterionScoreResults
                    .filter(({ topicScoreId }) => topicScoreId === id)
                    .map(({ criterion, score }) => {
                      const criterionProperties =
                        criteria[criterion as CriterionId];
                      return {
                        name: criterionProperties.name(),
                        osmTags: criterionProperties.osmTags,
                        criterion,
                        score,
                      };
                    }),
                })),
            };
          }),
      };
    },
  );

  return {
    score: {
      ...scoreResults,
      name: allowedAdminAreas.find(({ id }) => id === adminAreaId)?.name,
      toplevelCategories: result,
    },
  };
});
