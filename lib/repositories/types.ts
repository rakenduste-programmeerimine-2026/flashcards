/**
 * Data access for decks and cards, as an interface.
 *
 * Route handlers only know these types. The tables behind them belong to #7, so the
 * real adapter (`supabase.ts`) is a stub until they exist, and tests run against the
 * in-memory implementation in `memory.ts`.
 *
 * Every method takes the owner's id. Something that is missing and something that
 * belongs to somebody else look the same to the caller (`null`), so a handler can
 * answer 404 in both cases and never confirms that an id exists.
 */

export type NewCard = { term: string; meaning: string };

export type CreateDeckData = {
  ownerId: string;
  name: string;
  language: string;
  cards: NewCard[];
};

export type DeckSummary = {
  id: string;
  name: string;
  language: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DeckCard = {
  id: string;
  term: string;
  meaning: string;
  position: number;
};

export type DeckDetail = { deck: DeckSummary; cards: DeckCard[] };

export interface DeckRepository {
  /**
   * Writes the deck and all of its cards, or nothing. The cards keep the order they
   * were given in, as positions 0, 1, 2, ...
   */
  createDeckWithCards(data: CreateDeckData): Promise<{ id: string }>;

  /** The owner's decks with their card counts, newest first. */
  listDecks(ownerId: string): Promise<DeckSummary[]>;

  /** One deck with its cards ordered by position, or null if it is missing or not the owner's. */
  getDeck(ownerId: string, deckId: string): Promise<DeckDetail | null>;

  /** Renames the deck. Null if it is missing or not the owner's; nothing changes then. */
  renameDeck(
    ownerId: string,
    deckId: string,
    name: string,
  ): Promise<DeckSummary | null>;

  /** Deletes the deck and its cards. False if it is missing or not the owner's. */
  deleteDeck(ownerId: string, deckId: string): Promise<boolean>;
}

export type Repositories = {
  decks: DeckRepository;
};

/** The storage cannot be reached or has not been connected yet. Handlers answer 503. */
export class RepositoryUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryUnavailableError";
  }
}
