/**
 * Whether practice shuffles, remembered between visits.
 *
 * localStorage rather than a cookie: the server never needs this, and a reader who
 * blocks site data simply gets the default. Every access is guarded, because
 * reading localStorage throws outright in some privacy modes.
 */
const KEY = "flashcards_shuffle";

/** The contact asked for random practice, so shuffling is what you get unless you say otherwise. */
export const SHUFFLE_BY_DEFAULT = true;

export function readShufflePreference(): boolean {
  if (typeof window === "undefined") return SHUFFLE_BY_DEFAULT;

  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    // Site data blocked. The default is a fine answer.
  }

  return SHUFFLE_BY_DEFAULT;
}

export function writeShufflePreference(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? "on" : "off");
  } catch {
    // The toggle still works for this session; it just will not be remembered.
  }
}
