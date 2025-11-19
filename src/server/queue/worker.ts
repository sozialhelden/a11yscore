import { Worker } from "bullmq";
import { redisConnection } from "~/queue/env";
import {
  type ComputeAdminAreaScoreJob,
  type ComputeScoresJob,
  computeAdminAreaScoreJobId,
  computeScoresJobId,
  type SyncAdminAreasJob,
  scoreQueue,
  scoreQueueId,
  syncAdminAreasJobId,
} from "~/queue/index";
import { handle as handleComputeScores } from "~/queue/jobs/compute-scores";
import { handle as handleSyncAdminAreas } from "~/queue/jobs/sync-admin-areas";
import { handle as handleComputeAdminAreaScore } from "~~/src/a11yscore/jobs/compute-admin-area-score";

await scoreQueue.setGlobalConcurrency(4);

await scoreQueue.upsertJobScheduler(
  computeScoresJobId,
  { pattern: "0 0 1 * * *" }, // once per day at 1:00am
  {
    name: computeScoresJobId,
    opts: {
      attempts: 1,
      removeOnComplete: {
        age: 60 * 60 * 24 * 30, // keep successful jobs for 30 days
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 90, // keep failed jobs for 90 days
      },
    },
  },
);

await scoreQueue.upsertJobScheduler(
    syncAdminAreasJobId,
    { pattern: "0 0 0 * * *" }, // once per day at 00:00
    {
      name: syncAdminAreasJobId,
      opts: {
        attempts: 1,
        removeOnComplete: {
          age: 60 * 60 * 24 * 30, // keep successful jobs for 30 days
        },
        removeOnFail: {
          age: 60 * 60 * 24 * 90, // keep failed jobs for 90 days
        },
      },
    },
);

const worker = new Worker(
  scoreQueueId,
  async (
    job: ComputeScoresJob | ComputeAdminAreaScoreJob | SyncAdminAreasJob,
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
