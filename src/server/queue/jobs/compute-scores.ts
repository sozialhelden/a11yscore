import { appDb } from "~/db";
import { adminAreas } from "~/db/schema/app";
import { computeAdminAreaScoreJobId, scoreQueue } from "~/queue";

export async function handle() {
  await scoreQueue.addBulk(
    (await appDb.select().from(adminAreas)).map((adminArea) => {
      return {
        name: computeAdminAreaScoreJobId,
        data: { adminArea },
        opts: {
          attempts: 2,
          deduplication: {
            id: `${computeAdminAreaScoreJobId}-${adminArea.id}`,
          },
        },
      };
    }),
  );
}
