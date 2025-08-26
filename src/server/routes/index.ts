import { t } from "~/utils/i18n";

defineRouteMeta({
	openAPI: {},
});

export default defineEventHandler(async (_event) => {
	return t(`Hello World!`);
});
