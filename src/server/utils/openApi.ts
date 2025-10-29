import { supportedLanguageTags } from "@sozialhelden/core";

export const langQueryParameter = {
  in: "query" as const,
  name: "lang",
  schema: {
    type: "string" as const,
    enum: supportedLanguageTags as string[],
    example: "en-US",
  },
  description: "Language tag for localization",
};
