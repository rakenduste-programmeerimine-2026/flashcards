/** The two languages the product promises. Everything else derives from this list. */
export const LOCALES = ["et", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Estonian first: the contact and most of the course study in Estonian. */
export const DEFAULT_LOCALE: Locale = "et";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
