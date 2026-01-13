import { eq } from "drizzle-orm";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { useIsDevelopment } from "~/utils/env";
import {
  getSubCategoryById,
  getTopLevelCategoryById,
  getTopLevelCategoryList,
  type SubCategoryId,
  type TopLevelCategoryId,
} from "~~/src/a11yscore/config/categories";
import { type CriterionId, criteria } from "~~/src/a11yscore/config/criteria";
import { type TopicId, topics } from "~~/src/a11yscore/config/topics";
import { queryScoreResultsByAdminArea } from "~~/src/a11yscore/queries/query-score-results-by-admin-area";
import { dataIsUnavailable } from "~~/src/a11yscore/utils/data-quality";

export default defineCachedEventHandler(
  async (event) => {
    const compoundKey = getRouterParam(event, "id");

    const adminArea = (
      await appDb
        .select()
        .from(adminAreas)
        .where(
          compoundKey.startsWith("osm:")
            ? eq(
                adminAreas.osmId,
                parseInt(compoundKey.replace("osm:", ""), 10),
              )
            : eq(adminAreas.id, compoundKey),
        )
    ).shift();

    if (!adminArea) {
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
    } = await queryScoreResultsByAdminArea(adminArea.id);

    if (!scoreResults) {
      throw createError({
        status: 404,
        statusMessage: "Not found",
        message: "Calculated score for admin area not found",
      });
    }
    // there are no scores for planned categories in the database
    // thus, we manually set the score to 0
    const plannedCategories = getTopLevelCategoryList()
      .filter((category) => category.planned)
      .map(({ name, description, interpretation, ...category }) => ({
        ...category,
        name: name(),
        description: description(),
        interpretation: interpretation(),
        score: {
          score: 0,
          dataQualityFactor: 0,
          dataIsUnavailable: true,
        },
      }));

    // TODO: this whole file is a mess, please refactor
    const result = topLevelCategoryScoreResults.map(
      ({ id, topLevelCategory, score, dataQualityFactor }) => {
        const topLevelCategoryProperties = getTopLevelCategoryById(
          topLevelCategory as TopLevelCategoryId,
        );
        return {
          id: topLevelCategory,
          name: topLevelCategoryProperties.name(),
          score: {
            score,
            dataQualityFactor,
            dataIsUnavailable: dataIsUnavailable(dataQualityFactor),
          },
          interpretation: topLevelCategoryProperties.interpretation?.(score),
          description: topLevelCategoryProperties.description?.(),
          planned: topLevelCategoryProperties.planned,
          subCategories: subCategoryScoreResults
            .filter(
              ({ topLevelCategoryScoreId }) => topLevelCategoryScoreId === id,
            )
            .map(({ id, subCategory, score, dataQualityFactor }) => {
              const subCategoryProperties = getSubCategoryById(
                subCategory as SubCategoryId,
              );
              return {
                id: subCategory,
                name: subCategoryProperties.name(),
                score: {
                  score,
                  dataQualityFactor,
                  dataIsUnavailable: dataIsUnavailable(dataQualityFactor),
                },
                description: subCategoryProperties.description?.(),
                osmTags: subCategoryProperties.osmTags,
                topics: topicScoreResults
                  .filter(({ subCategoryScoreId }) => subCategoryScoreId === id)
                  .map(({ id, topic, score, dataQualityFactor }) => ({
                    id: topic,
                    name: topics[topic as TopicId].name(),
                    score: {
                      score,
                      dataQualityFactor,
                      dataIsUnavailable: dataIsUnavailable(dataQualityFactor),
                    },
                    criteria: criterionScoreResults
                      .filter(({ topicScoreId }) => topicScoreId === id)
                      .map(({ criterion, score, dataQualityFactor }) => {
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
                          score: {
                            score,
                            dataQualityFactor,
                            dataIsUnavailable:
                              dataIsUnavailable(dataQualityFactor),
                          },
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

    // combining active and planned categories to serve both to the front-end
    const allTopLevelCategories = [...result, ...plannedCategories];

    const score = {
      score: scoreResults.score,
      dataQualityFactor: scoreResults.dataQualityFactor,
      dataIsUnavailable: dataIsUnavailable(scoreResults.dataQualityFactor),
    };

    delete scoreResults.adminAreaId;
    delete scoreResults.score;
    delete scoreResults.dataQualityFactor;

    return {
      adminArea,
      score: {
        ...scoreResults,
        score,
        toplevelCategories: allTopLevelCategories,
      },
    };
  },
  {
    maxAge: 60 * 60 /* 1 hour */,
    varies: ["accept-language", "Accept-Language"],
    shouldBypassCache: useIsDevelopment,
  },
);
