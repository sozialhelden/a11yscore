// need to use the default import because this package doesn't include
// an es module ¯\_(ツ)_/¯
import type transifex from "@transifex/native";

export type Translate = typeof transifex.t;

export const dummyTranslate: Translate = (str: string) => str;
