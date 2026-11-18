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
  /** Cards one deck may hold, however they got there. */
  cardsPerDeckMax: 500,
  decksPerUserMax: 50,
  /** The import route: 200 cards at their longest are about 240 KB, so this has room to spare. */
  importBodyMaxBytes: 512 * 1024,
  /** Every other JSON body. A full round of 500 ratings is about 40 KB. */
  bodyMaxBytes: 64 * 1024,
} as const;

/** Writes per user: enough for a 200-card editor session, far below a script. */
export const RATE_LIMITS = {
  writesPerWindow: 120,
  windowMs: 60_000,
} as const;

export const LANGUAGES = ["et", "en"] as const;
