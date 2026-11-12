/**
 * Fisher-Yates over a copy. The stored order of a deck is never touched: practice
 * reorders what it shows, not what the database holds.
 *
 * `random` is injectable so the tests can run a known sequence instead of hoping
 * about chance.
 */
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Reorders the cards after `from`, leaving everything up to and including it where
 * it is. Used mid-session: the card on screen stays put, the ones already answered
 * cannot come back, and only what is still ahead is reordered.
 */
export function reshuffleRemaining<T>(
  cards: readonly T[],
  from: number,
  random: () => number = Math.random,
): T[] {
  const keep = Math.max(0, Math.min(from, cards.length));
  return [...cards.slice(0, keep), ...shuffle(cards.slice(keep), random)];
}
