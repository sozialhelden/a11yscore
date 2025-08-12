import { t } from "~/plugins/i18n";

defineRouteMeta({
	openAPI: {},
});

export default defineEventHandler(async (_event) => {
	return t(`Hello World!`);
});
