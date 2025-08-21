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
		// When Transifex is down, setting the locale (and downloading the translations)
		// will fail. We'd rather show an untranslated page than a completely one in this
		// case, that's why we catch the error here and just go on with the default.
		console.error("Could not set Transifex locale:", error);
	}
});
