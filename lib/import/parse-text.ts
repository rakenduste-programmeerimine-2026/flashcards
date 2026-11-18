import type { ParsedCard, ParseResult } from "./types";

/**
 * Reads the TERM / MEANING line format out of an AI answer.
 *
 * Real answers are messy: an intro sentence, numbering, bold markers, a meaning
 * wrapped over three lines, a closing "hope this helps". The parser's job is to
 * survive all of that and never throw — an answer it cannot read comes back as zero
 * cards and a problem code, not an exception.
 */

/** Both languages, and both spellings of the Estonian ones, since a model drops diacritics. */
const TERM_LABELS = new Set(["mõiste", "moiste", "term"]);
const MEANING_LABELS = new Set(["tähendus", "tahendus", "meaning"]);

/** A label is one word, then a colon or a dash, then the rest of the line. */
const LABEL_LINE = /^(\p{L}+)\s*[:：\-–—]\s*(.*)$/u;

type Field = "term" | "meaning";

export function parseTextAnswer(input: string): ParseResult {
  if (input.trim() === "") {
    return { cards: [], dropped: 0, problem: "empty" };
  }

  const cards: ParsedCard[] = [];
  let dropped = 0;

  let pending: Partial<Record<Field, string>> = {};
  /** The field a wrapped line belongs to, or null after a blank line. */
  let open: Field | null = null;

  const flush = () => {
    const term = tidy(pending.term ?? "");
    const meaning = tidy(pending.meaning ?? "");
    if (term && meaning) {
      cards.push({ term, meaning });
    } else if (term || meaning) {
      // Half a card is worse than no card: it would be practised as a blank.
      dropped += 1;
    }
    pending = {};
  };

  for (const rawLine of input.split(/\r\n|\r|\n/)) {
    const line = clean(rawLine);

    if (line === "") {
      // A blank line ends a wrapped meaning. It does not end the card: a model
      // sometimes puts a blank line between the two halves of one card.
      open = null;
      continue;
    }

    const label = readLabel(line);

    if (label?.field === "term") {
      // A new term starts a new card, whatever state the previous one was in.
      flush();
      pending.term = label.value;
      open = "term";
      continue;
    }

    if (label?.field === "meaning") {
      if (pending.meaning !== undefined) {
        // Two meanings in a row: the first one belonged to a card with no term.
        flush();
      }
      pending.meaning = label.value;
      open = "meaning";
      continue;
    }

    // Not a label. Only a line that continues an open field counts; anything else
    // is the intro, a heading, or the "hope this helps" at the end.
    if (open && pending[open] !== undefined) {
      pending[open] = `${pending[open]} ${line}`.trim();
    }
  }

  flush();

  return {
    cards,
    dropped,
    problem: cards.length === 0 ? "no_cards" : null,
  };
}

function readLabel(line: string): { field: Field; value: string } | null {
  const match = LABEL_LINE.exec(line);
  if (!match) return null;

  const word = match[1].toLowerCase();
  if (TERM_LABELS.has(word)) return { field: "term", value: match[2].trim() };
  if (MEANING_LABELS.has(word))
    return { field: "meaning", value: match[2].trim() };
  return null;
}

/**
 * One line, stripped of everything a model decorates it with. Order matters: bold
 * markers come off before bullets, or `**TERM:**` loses its first star to the
 * bullet rule and stops looking like a label.
 */
function clean(line: string): string {
  return line
    .replace(/ /g, " ")
    .replace(/[​-‏﻿]/g, "")
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*(?:[-*•·‣–—]|\d{1,3}\s*[.)])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Last pass over a finished value. Only a matched pair of outer quotes comes off:
 * a meaning may legitimately start with a bracket ("(1517) ..."), so nothing else
 * is stripped from the ends.
 */
function tidy(value: string): string {
  const trimmed = value.trim();
  const quoted = /^(["'“„«])([\s\S]*)(["'”»])$/.exec(trimmed);
  return (quoted ? quoted[2] : trimmed).trim();
}
