import { allowedAdminAreas } from "~~/src/a11yscore/config/admin-areas";

export default defineEventHandler(async () => {
  return {
    adminAreas: allowedAdminAreas,
  };
});
