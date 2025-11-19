import { useIsDevelopment } from "~/utils/env";
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

export default defineCachedEventHandler(
  async (event) => {
    let adminAreaId: number;
    const compoundKey = getRouterParam(event, "id");



    if (compoundKey.startsWith("osm:")) {
      adminAreaId = allowedAdminAreas.find(
        ({ id }) => id === parseInt(compoundKey.replace("osm:", "")),
      )?.id;
    }

    if (compoundKey.startsWith("slug:")) {
      adminAreaId = allowedAdminAreas.find(
        ({ slug }) => slug === compoundKey.replace("slug:", ""),
      )?.id;
    }

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
          id: topLevelCategory,
          name: topLevelCategoryProperties.name(),
          score,
          interpretation: topLevelCategoryProperties.interpretation?.(score),
          subCategories: subCategoryScoreResults
            .filter(
              ({ topLevelCategoryScoreId }) => topLevelCategoryScoreId === id,
            )
            .map(({ id, subCategory, score }) => {
              const subCategoryProperties =
                subCategories[subCategory as SubCategoryId];
              return {
                id: subCategory,
                name: subCategoryProperties.name(),
                score,
                description: subCategoryProperties.description?.(),
                osmTags: subCategoryProperties.osmTags,
                topics: topicScoreResults
                  .filter(({ subCategoryScoreId }) => subCategoryScoreId === id)
                  .map(({ id, topic, score }) => ({
                    id: topic,
                    name: topics[topic as TopicId].name(),
                    score,
                    criteria: criterionScoreResults
                      .filter(({ topicScoreId }) => topicScoreId === id)
                      .map(({ criterion, score }) => {
                        const criterionPivotProperties =
                          subCategoryProperties.topics
                            .find(({ topicId }) => topic === topicId)
                            .criteria.find(
                              ({ criterionId }) => criterionId === criterion,
                            );

                        const criterionProperties =
                          criteria[criterion as CriterionId];

                        const genericRecommendations =
                          criterionProperties.recommendations();

                        return {
                          id: criterion,
                          name: criterionProperties.name(),
                          score,
                          reason:
                            criterionPivotProperties?.reason?.() ||
                            criterionProperties.reason(),
                          recommendations:
                            criterionPivotProperties?.recommendations?.(
                              genericRecommendations,
                            ) || genericRecommendations,
                          links:
                            criterionPivotProperties?.links?.() ||
                            criterionProperties.links?.() ||
                            [],
                          osmTags: criterionProperties.osmTags,
                        };
                      }),
                  })),
              };
            }),
        };
      },
    );

    delete scoreResults.adminAreaId;

    return {
      score: {
        ...scoreResults,
        adminArea: {
          id: adminAreaId,
          name: allowedAdminAreas.find(({ id }) => id === adminAreaId)?.name,
        },
        toplevelCategories: result,
      },
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
