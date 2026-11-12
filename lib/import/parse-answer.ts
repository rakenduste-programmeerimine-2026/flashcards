import { parseJsonAnswer } from "./parse-json";
import { parseTextAnswer } from "./parse-text";
import type { ParseResult } from "./types";

/**
 * The one entry point the paste screen uses.
 *
 * JSON first, because a JSON answer read as text would produce nothing useful; the
 * text parser then gets anything JSON could not use, including JSON that is broken.
 * A model that was asked for JSON and answered in lines still works, and the other
 * way round.
 */
export function parseAnswer(input: string): ParseResult {
  if (input.trim() === "") {
    return { cards: [], dropped: 0, problem: "empty" };
  }

  const json = parseJsonAnswer(input);
  if (json && json.cards.length > 0) return json;

  const text = parseTextAnswer(input);
  if (text.cards.length > 0) return text;

  // Neither read a card. Prefer the JSON attempt if it at least saw card-shaped
  // entries, so "4 entries, all half-written" is not reported as "no cards at all".
  return json ?? text;
}
