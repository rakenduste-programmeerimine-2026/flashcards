/** One card as it comes out of an answer, before anything is saved. */
export type ParsedCard = {
  term: string;
  meaning: string;
};

/**
 * Why nothing could be read. The UI translates these; they are never shown as they
 * are, which is also why they are codes and not sentences.
 */
export type ParseProblem = "empty" | "no_cards";

export type ParseResult = {
  cards: ParsedCard[];
  /** Half-pairs that were thrown away: a term with no meaning, or the reverse. */
  dropped: number;
  /** Set only when `cards` is empty. */
  problem: ParseProblem | null;
};
