/**
 * Keeps a pasted answer across the trip to the sign-in page. Without it, a student who
 * presses save while signed out would come back to an empty paste screen.
 * sessionStorage, so it never outlives the tab and is never sent anywhere.
 */

const KEY = "flashcards.pasteDraft";

export type PasteDraft = { answer: string; name: string };

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function saveDraft(storage: DraftStorage, draft: PasteDraft): void {
  try {
    storage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked: the student has to paste again, nothing worse.
  }
}

/** Returns the draft once and forgets it, so a reload does not bring it back again. */
export function takeDraft(storage: DraftStorage): PasteDraft | null {
  let raw: string | null;
  try {
    raw = storage.getItem(KEY);
    storage.removeItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as PasteDraft).answer === "string" &&
      typeof (value as PasteDraft).name === "string"
    ) {
      return {
        answer: (value as PasteDraft).answer,
        name: (value as PasteDraft).name,
      };
    }
  } catch {
    // fall through
  }
  return null;
}
