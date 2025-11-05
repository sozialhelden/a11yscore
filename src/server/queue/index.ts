import { type Job, Queue } from "bullmq";
import type { adminAreas } from "~/db/schema/app";
import { redisConnection } from "~/queue/env";

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
  { adminArea: typeof adminAreas.$inferSelect },
  undefined,
  typeof computeAdminAreaScoreJobId
>;

export const syncAdminAreasJobId = "sync-admin-areas";
export type SyncAdminAreasJob = Job<
  undefined,
  undefined,
  typeof syncAdminAreasJobId
>;

export const setAdminAreaImageJobId = "set-admin-area-image";
export type SetAdminAreaImageJob = Job<
  { adminArea: typeof adminAreas.$inferSelect },
  undefined,
  typeof setAdminAreaImageJobId
>;
