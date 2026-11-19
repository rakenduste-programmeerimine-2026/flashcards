/**
 * Input limits for decks and cards. The numbers are a team assumption: neither the issue nor the
 * backlog fixes them. Change them here and every endpoint follows.
 */
export const LIMITS = {
  deckNameMax: 100,
  termMax: 200,
  meaningMax: 1000,
  cardsPerImportMax: 200,
} as const;

export const LANGUAGES = ["et", "en"] as const;
