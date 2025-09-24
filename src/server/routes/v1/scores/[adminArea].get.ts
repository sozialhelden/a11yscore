import { queryScoreResultsByAdminArea } from "~/db/queries/queryScoreResultsByAdminArea";
import { allowedAdminAreas } from "~~/src/config";
import {
  type SubCategoryId,
  subCategories,
  type TopLevelCategoryId,
  topLevelCategories,
} from "~~/src/score/categories";
import { type CriterionId, criteria } from "~~/src/score/criteria";
import { type TopicId, topics } from "~~/src/score/topics";

// TODO: add openapi spec
defineRouteMeta({
  openAPI: {
    tags: ["API v1"],
    description: "Get the latest score for a given admin area",
    responses: {
      "200": {
        description: "Latest score",
      },
      "404": {
        description: "Admin are not found",
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  const adminAreaId = parseInt(getRouterParam(event, "adminArea"));

  if (!allowedAdminAreas.some(({ id }) => adminAreaId === id)) {
    throw createError({
      status: 404,
      statusMessage: "Not found",
      message: "Admin area not found",
    });
  }

  const {
    scoreResults,
    toplevelCategoryScoreResults,
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
  const result = toplevelCategoryScoreResults.map(
    ({ id, toplevelCategory, score }) => {
      const toplevelCategoryProperties =
        topLevelCategories[toplevelCategory as TopLevelCategoryId];
      return {
        name: toplevelCategoryProperties.name(),
        interpretation: toplevelCategoryProperties.interpretation?.(score),
        toplevelCategory,
        score,
        subCategories: subCategoryScoreResults
          .filter(
            ({ toplevelCategoryScoreId }) => toplevelCategoryScoreId === id,
          )
          .map(({ id, subCategory, score }) => {
            const subCategoryProperties =
              subCategories[subCategory as SubCategoryId];
            return {
              name: subCategoryProperties.name(),
              description: subCategoryProperties.description?.(),
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
                    .map(({ criterion, score }) => ({
                      name: criteria[criterion as CriterionId].name(),
                      criterion,
                      score,
                    })),
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
