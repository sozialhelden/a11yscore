import { Worker } from "bullmq";
import { redisConnection } from "~/queue/env";
import {
  type ComputeAdminAreaScoreJob,
  type ComputeScoresJob,
  computeAdminAreaScoreJobId,
  computeScoresJobId,
  type SetAdminAreaImageJob,
  type SyncAdminAreasJob,
  scoreQueue,
  scoreQueueId,
  setAdminAreaImageJobId,
  syncAdminAreasJobId,
} from "~/queue/index";
import { handle as handleComputeScores } from "~/queue/jobs/compute-scores";
import { handle as handleSetAdminAreaImage } from "~~/src/a11yscore/jobs/set-admin-area-image";
import { handle as handleSyncAdminAreas } from "~~/src/a11yscore/jobs/sync-admin-areas";
import { handle as handleComputeAdminAreaScore } from "~~/src/a11yscore/jobs/compute-admin-area-score";

await scoreQueue.setGlobalConcurrency(4);

const defaultJobOptions = {
  attempts: 1,
  removeOnComplete: {
    age: 60 * 60 * 24 * 30, // keep successful jobs for 30 days
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 90, // keep failed jobs for 90 days
  },
};

await scoreQueue.upsertJobScheduler(
  computeScoresJobId,
  { pattern: "0 0 1 * * *" }, // once per day at 1:00am
  {
    name: computeScoresJobId,
    opts: defaultJobOptions,
  },
);

await scoreQueue.upsertJobScheduler(
  syncAdminAreasJobId,
  { pattern: "0 0 0 * * *" }, // once per day at 00:00
  {
    name: syncAdminAreasJobId,
    opts: defaultJobOptions,
  },
);

// this manual registration of handlers doesn't scale well. if you add
// more jobs in the future, please refactor this.
const worker = new Worker(
  scoreQueueId,
  async (
    job:
      | ComputeScoresJob
      | ComputeAdminAreaScoreJob
      | SyncAdminAreasJob
      | SetAdminAreaImageJob,
  ) => {
    if (job.name === computeScoresJobId) {
      return handleComputeScores();
    }
    if (job.name === computeAdminAreaScoreJobId) {
      return handleComputeAdminAreaScore(job);
    }
    if (job.name === syncAdminAreasJobId) {
      return handleSyncAdminAreas();
    }
    if (job.name === setAdminAreaImageJobId) {
      return handleSetAdminAreaImage(job);
    }
  },
  {
    connection: redisConnection,
    concurrency: 4,
  },
);

worker.on("ready", () => {
  console.log("Worker is now running and ready to process jobs.");
});

worker.on("completed", (job) => {
  console.log(
    `Job ${job.name} with id "${job.id}" (${JSON.stringify(job.data)}) has completed!`,
  );
});

worker.on("failed", (job, error) => {
  console.error(
    `Job ${job.name} with id "${job.id}" has failed with "${error.message}".`,
  );
});

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down worker...`);
  await worker.close();
  process.exit(0);
};

// Handle termination signals for graceful shutdown
// see: https://docs.bullmq.io/guide/going-to-production#gracefully-shut-down-workers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions and unhandled promise rejections, so the worker container doesn't crash
// see: https://docs.bullmq.io/guide/going-to-production#unhandled-exceptions-and-rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at: Promise", { promise, reason });
});
