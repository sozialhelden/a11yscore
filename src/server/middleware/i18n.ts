import {
  configuredLanguageTags,
  fallbackLanguageTag,
  getILanguageTagsFromAcceptLanguageHeader,
  getMostPreferableLanguageTag,
  type LanguageTag,
} from "@sozialhelden/core";

import { tx } from "~/utils/i18n";

export default defineEventHandler(async (event) => {
  const acceptLanguageHeader = event.headers.get("accept-language");
  const languageFromQuery = getQuery(event).lang as string | undefined;

  let languageTag: LanguageTag;

  if (Object.keys(configuredLanguageTags).includes(languageFromQuery)) {
    languageTag = languageFromQuery as LanguageTag;
  } else {
    try {
      languageTag = acceptLanguageHeader
        ? getMostPreferableLanguageTag([
            ...getILanguageTagsFromAcceptLanguageHeader(acceptLanguageHeader),
          ])
        : fallbackLanguageTag;
    } catch {
      languageTag = fallbackLanguageTag;
    }
  }

  event.context.languageTag = languageTag;

  try {
    await tx.setCurrentLocale(languageTag);
  } catch (error) {
    // When Transifex is down, setting the locale (and downloading the translations)
    // will fail. We'd rather show an untranslated page than a completely broken one
    // in this case, that's why we catch the error here and just go on with the default.
    console.error("Could not set Transifex locale:", error);
  }
});
