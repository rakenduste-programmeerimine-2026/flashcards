import type { ParsedCard, ParseResult } from "./types";

/**
 * Reads an answer that came back as JSON.
 *
 * Returns `null` when the input is not JSON we can use — no structure, unparseable,
 * or parsed but holding nothing card-shaped. The caller then falls back to the text
 * parser, so a model that half-followed the JSON instruction still gets read.
 */

/** The key spellings our two JSON prompts produce, plus the obvious neighbours. */
const TERM_KEYS = ["term", "moiste", "mõiste", "sõna", "sona", "front"];
const MEANING_KEYS = [
  "meaning",
  "tahendus",
  "tähendus",
  "definition",
  "selgitus",
  "back",
];

/** Wrappers a model puts the array in: { "cards": [...] } and its translations. */
const LIST_KEYS = ["cards", "kaardid", "items", "data", "moisted", "mõisted"];

export function parseJsonAnswer(input: string): ParseResult | null {
  const source = extractJson(input);
  if (source === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    // Broken JSON is not an error here: the text parser gets its turn.
    return null;
  }

  const list = asList(value);
  if (list === null) return null;

  const cards: ParsedCard[] = [];
  let dropped = 0;

  for (const entry of list) {
    const card = asCard(entry);
    if (card) {
      cards.push(card);
    } else if (entry !== null && typeof entry === "object") {
      dropped += 1;
    }
  }

  if (cards.length === 0 && dropped === 0) return null;

  return {
    cards,
    dropped,
    problem: cards.length === 0 ? "no_cards" : null,
  };
}

/**
 * The JSON out of whatever the model wrapped it in: a ```json fence, a sentence
 * before it, a "hope this helps" after it.
 */
function extractJson(input: string): string | null {
  const fenced = /```(?:json|javascript)?\s*([\s\S]*?)```/i.exec(input);
  const body = fenced ? fenced[1] : input;

  const start = firstIndexOf(body, ["[", "{"]);
  const end = lastIndexOf(body, ["]", "}"]);
  if (start === -1 || end === -1 || end <= start) return null;

  return body.slice(start, end + 1);
}

function firstIndexOf(text: string, characters: string[]): number {
  const found = characters
    .map((character) => text.indexOf(character))
    .filter((index) => index !== -1);
  return found.length === 0 ? -1 : Math.min(...found);
}

function lastIndexOf(text: string, characters: string[]): number {
  return Math.max(
    ...characters.map((character) => text.lastIndexOf(character)),
  );
}

function asList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (LIST_KEYS.includes(key.toLowerCase()) && Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }

  return null;
}

function asCard(entry: unknown): ParsedCard | null {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const term = pick(record, TERM_KEYS);
  const meaning = pick(record, MEANING_KEYS);

  if (term && meaning) return { term, meaning };

  // { "Reformatsioon": "16. sajandi liikumine" } — a term as the key. Only when the
  // key is not one of our own label names, or { "term": "x" } would read as a card
  // with the term "term".
  const entries = Object.entries(record);
  if (entries.length === 1) {
    const [key, onlyValue] = entries[0];
    const known = [...TERM_KEYS, ...MEANING_KEYS].includes(key.toLowerCase());
    const text = asText(onlyValue);
    if (!known && key.trim() && text) {
      return { term: key.trim(), meaning: text };
    }
  }

  return null;
}

function pick(record: Record<string, unknown>, keys: string[]): string | null {
  for (const [key, value] of Object.entries(record)) {
    if (keys.includes(key.trim().toLowerCase())) {
      const text = asText(value);
      if (text) return text;
    }
  }
  return null;
}

/** Strings and numbers are usable; anything else is not a meaning. */
function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
