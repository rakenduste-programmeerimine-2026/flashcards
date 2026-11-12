/** The two languages the product promises. Everything else derives from this list. */
export const LOCALES = ["et", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Estonian first: the contact and most of the course study in Estonian. */
export const DEFAULT_LOCALE: Locale = "et";

/**
 * Where the choice is remembered. A cookie rather than localStorage, because the
 * server has to know the language before the first paint to put it on <html lang>.
 */
export const LOCALE_COOKIE = "flashcards_locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
