import { scoreQueue } from "~/queue";
import { langQueryParameter } from "~/utils/openApi";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  const metrics = [await scoreQueue.exportPrometheusMetrics()];
  return metrics.join("\n");
});

defineRouteMeta({
  openAPI: {
    tags: ["a11y-Score v1 - internal"],
    description: "Get prometheus metrics",
    parameters: [langQueryParameter],
    security: [{ internalBasicAuth: [] }],
    responses: {
      "200": {
        description: "Successful response",
        content: {
          "text/plain": {
            schema: {
              type: "string",
              description: "Prometheus metrics in text format",
              example:
                '# HELP bullmq_job_count Number of jobs in the queue by state\n# TYPE bullmq_job_count gauge bullmq_job_count{queue="score", state="active"} 0\nbullmq_job_count{queue="score", state="completed"} 777\nbullmq_job_count{queue="score", state="delayed"} 1',
            },
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  },
});
