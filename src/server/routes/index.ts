import { t } from "~/plugins/i18n";

export default defineEventHandler(async (_event) => {
	return t(`Hello World!`);
});
