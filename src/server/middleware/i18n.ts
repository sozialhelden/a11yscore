import {
  configuredLanguageTags,
  fallbackLanguageTag,
  getILanguageTagsFromAcceptLanguageHeader,
  getMostPreferableLanguageTag,
  type LanguageTag,
} from "@sozialhelden/core";
import type { tx } from "@transifex/native";

export default defineEventHandler(async (event) => {
  const languageFromQuery = getQuery(event).lang as string | undefined;
  const acceptLanguageHeader = getRequestHeaders(event)["accept-language"];

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

  // This requests gets a specific translation function for the selected language
  // This is also how the official @transifex/express middleware/module works
  event.context.t = (...args: Parameters<typeof tx.t>) =>
    event.context.tx.translateLocale(languageTag, ...args);

  try {
    // Make sure to update the fetched translations for the selected language. As the
    // Transifex sdk caches those in memory, this will only result in a network request
    // every so often, but ensures we have up-to-date translations.
    await event.context.tx.fetchTranslations(languageTag);
  } catch (error) {
    // When Transifex is down, downloading the translations will fail. We'd rather show
    // an untranslated page than a completely broken one in this case, that's why we
    // catch the error here and just go on with the default.
    console.error("Could not fetch Transifex translations:", error);
  }
});
