import {
  computeAdminAreaScoreJobId,
  computeScoresJobId,
  scoreQueue,
} from "~/queue";
import { langQueryParameter } from "~/utils/openApi";

const allowedJobs = [computeScoresJobId, computeAdminAreaScoreJobId];
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, "type");
  const body = await readBody(event);

  if (!allowedJobs.includes(type)) {
    return createError({
      status: 404,
      statusText: "Job not found",
    });
  }

  await scoreQueue.add(type, body);
});

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1 - internal"],
    description: "Create a new job in the queue",
    requestBody: {
      description: "Job payload",
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            example: {},
          },
        },
      },
    },
    parameters: [
      {
        in: "path",
        name: "type",
        schema: {
          type: "string",
          example: computeScoresJobId,
          enum: allowedJobs,
        },
        description: "Type of the job to create",
      },
      langQueryParameter,
    ],
    security: [{ internalBasicAuth: [] }],
    responses: {
      "201": {
        description: "Successful response",
      },
      "401": {
        description: "Unauthorized",
      },
    },
  },
});
