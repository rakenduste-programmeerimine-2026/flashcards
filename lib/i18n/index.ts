"use client";

import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { translate, type MessageKey, type MessageVars } from "./translate";

export type { MessageKey, Translate } from "./translate";
export { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales";

/**
 * The only way a component reads a string.
 *
 * Right now it always answers in the default locale; the language switch and the
 * remembered choice arrive in issue #6 behind this same hook, so no component has to
 * change when they do.
 */
export function useT() {
  return (key: MessageKey, vars?: MessageVars) =>
    translate(dictionaries[DEFAULT_LOCALE], key, vars);
}

export function useLocale(): Locale {
  return DEFAULT_LOCALE;
}
