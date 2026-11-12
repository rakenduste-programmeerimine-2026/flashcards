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
