import en from "@/messages/en.json";
import et from "@/messages/et.json";
import type { Locale } from "./locales";

/**
 * Estonian is the reference shape. `en` is typed against it below, so a key that
 * exists in one file and not in the other fails `npm run typecheck`.
 */
export type Dictionary = typeof et;

export const dictionaries: Record<Locale, Dictionary> = { et, en };
