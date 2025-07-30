import {
	fallbackLanguageTag,
	getILanguageTagsFromAcceptLanguageHeader,
	getMostPreferableLanguageTag,
} from "@sozialhelden/core";
import { tx } from "~/plugins/i18n";

export default defineEventHandler(async (event) => {
	const acceptLanguageHeader = event.headers.get("accept-language");

	const languageTag = acceptLanguageHeader
		? getMostPreferableLanguageTag(
				getILanguageTagsFromAcceptLanguageHeader(acceptLanguageHeader),
			)
		: fallbackLanguageTag;

	event.context.languageTag = languageTag;

	if (tx.isCurrent(languageTag)) {
		return;
	}

	try {
		await tx.setCurrentLocale(languageTag);
	} catch (error) {
		console.error("Could not set Transifex locale:", error);
		// throw createError({
		// 	status: 500,
		// 	statusMessage: "Server error",
		// 	message: "Could not set Transifex locale",
		// });
	}
});
