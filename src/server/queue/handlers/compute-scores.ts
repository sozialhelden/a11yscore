import { computeAdminAreaScoreJobId, scoreQueue } from "~/queue";
import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";

export async function handle() {
  await scoreQueue.addBulk(
    allowedAdminAreas.map((adminArea) => {
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
