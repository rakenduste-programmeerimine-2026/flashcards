"use client";

import { useI18n } from "./context";

export { I18nProvider, useI18n } from "./context";
export type { MessageKey, MessageVars, Translate } from "./translate";
export { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales";

/** The only way a component reads a string. */
export function useT() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}

export function useSetLocale() {
  return useI18n().setLocale;
}
