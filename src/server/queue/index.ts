import { type Job, Queue } from "bullmq";
import { redisConnection } from "~/queue/env";
import type { AdminArea } from "~~/src/a11yscore/config/admin-areas";

export const scoreQueueId = "score";
export const scoreQueue = new Queue(scoreQueueId, {
  connection: redisConnection,
});

export const computeScoresJobId = "compute-scores";
export type ComputeScoresJob = Job<
  undefined,
  undefined,
  typeof computeScoresJobId
>;

export const computeAdminAreaScoreJobId = "compute-admin-area-score";
export type ComputeAdminAreaScoreJob = Job<
  { adminArea: AdminArea },
  undefined,
  typeof computeAdminAreaScoreJobId
>;
