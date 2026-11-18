/**
 * Input limits for decks and cards. The numbers are a team assumption: neither the issue nor the
 * backlog fixes them. Change them here and every endpoint follows.
 */
export const LIMITS = {
  deckNameMax: 100,
  termMax: 200,
  meaningMax: 1000,
  cardsPerImportMax: 200,
  /** Ratings in one practice request. A full round of a 200-card deck fits twice over. */
  ratingsPerRequestMax: 500,
  cardIdMax: 100,
} as const;

export const LANGUAGES = ["et", "en"] as const;
