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

export type NewDeckCard = NewCard & { position?: number };
export type CardChanges = {
  term?: string;
  meaning?: string;
  position?: number;
};

/**
 * Single-card writes. Ownership is decided through the parent deck, so a card in
 * somebody else's deck is the same as a card that does not exist.
 *
 * Positions inside a deck stay unique and gapless (0..n-1) after every call: adding
 * or moving a card shifts the ones after it, deleting one closes the gap. A position
 * past the end means "last".
 */
export interface CardRepository {
  /** Adds a card to the owner's deck. Null if the deck is missing or not the owner's. */
  addCard(
    ownerId: string,
    deckId: string,
    card: NewDeckCard,
  ): Promise<DeckCard | null>;

  /** Changes term, meaning and/or position. Null if missing or not the owner's. */
  updateCard(
    ownerId: string,
    cardId: string,
    changes: CardChanges,
  ): Promise<DeckCard | null>;

  /** Deletes the card and closes the gap. False if missing or not the owner's. */
  deleteCard(ownerId: string, cardId: string): Promise<boolean>;
}

export type CardRating = { cardId: string; knew: boolean };

/**
 * Practice results per card (#28 owns the storage): times seen, times known and when
 * the card was last practised.
 */
export interface PracticeRepository {
  /**
   * Records the ratings: each one adds 1 to "seen", adds 1 to "known" if the card was
   * known, and sets "last practised". All or nothing: if any card is missing or in
   * somebody else's deck, nothing is written and the result is null. Returns the
   * number of ratings recorded.
   */
  recordRatings(
    ownerId: string,
    ratings: CardRating[],
  ): Promise<{ recorded: number } | null>;
}

export type Repositories = {
  decks: DeckRepository;
  cards: CardRepository;
  practice: PracticeRepository;
};

/** The storage cannot be reached or has not been connected yet. Handlers answer 503. */
export class RepositoryUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryUnavailableError";
  }
}
