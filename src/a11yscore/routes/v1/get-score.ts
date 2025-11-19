import { eq } from "drizzle-orm";
import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
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
    // startet der compound key mit "osm:" ? wenn ja, dann gucke in der admin-area db nach der osm id
    // wenn nein, gucke in der admin-area db nach der richtigen id

    const compoundKey = getRouterParam(event, "id");
    const adminArea = (
      await appDb
        .select({
          id: adminAreas.id,
          name: adminAreas.name,
          slug: adminAreas.slug,
          osmId: adminAreas.osmId,
          wikidata: adminAreas.wikidata,
        })
        .from(adminAreas)
        .where(
          compoundKey.startsWith("osm:")
            ? eq(adminAreas.osmId, parseInt(compoundKey.replace("osm:", "")))
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
    } = await queryScoreResultsByAdminArea(adminArea.osmId);

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
        adminArea,
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
