import { randomUUID } from "node:crypto";
import type {
  CardChanges,
  CreateDeckData,
  DeckCard,
  DeckDetail,
  DeckSummary,
  CardRating,
  NewDeckCard,
  Repositories,
} from "./types";

/**
 * An in-memory stand-in for the database, for unit tests of the handlers. It keeps the
 * rules the real tables will have to keep: the deck and its cards are written together
 * or not at all, and the owner is stored with the deck.
 */

export type StoredDeck = {
  id: string;
  ownerId: string;
  name: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredCard = {
  id: string;
  deckId: string;
  term: string;
  meaning: string;
  position: number;
};

export type MemoryOptions = {
  /** Throws after this many cards were written, to prove nothing is left behind. */
  failAfterCards?: number;
};

export class MemoryStore {
  decks: StoredDeck[] = [];
  cards: StoredCard[] = [];
  /** Practice results by card id. */
  practice = new Map<
    string,
    { timesSeen: number; timesKnown: number; lastPracticedAt: string }
  >();

  constructor(readonly options: MemoryOptions = {}) {}

  repositories(): Repositories {
    return {
      decks: {
        createDeckWithCards: async (data) => this.createDeckWithCards(data),
        listDecks: async (ownerId) => this.listDecks(ownerId),
        getDeck: async (ownerId, deckId) => this.getDeck(ownerId, deckId),
        renameDeck: async (ownerId, deckId, name) =>
          this.renameDeck(ownerId, deckId, name),
        deleteDeck: async (ownerId, deckId) => this.deleteDeck(ownerId, deckId),
      },
      cards: {
        addCard: async (ownerId, deckId, card) =>
          this.addCard(ownerId, deckId, card),
        updateCard: async (ownerId, cardId, changes) =>
          this.updateCard(ownerId, cardId, changes),
        deleteCard: async (ownerId, cardId) => this.deleteCard(ownerId, cardId),
      },
      practice: {
        recordRatings: async (ownerId, ratings) =>
          this.recordRatings(ownerId, ratings),
      },
    };
  }

  private recordRatings(ownerId: string, ratings: CardRating[]) {
    // Check every card first, so a foreign one means nothing is written at all.
    if (ratings.some((r) => !this.ownedCard(ownerId, r.cardId))) {
      return null;
    }
    const now = new Date().toISOString();
    for (const { cardId, knew } of ratings) {
      const stats = this.practice.get(cardId) ?? {
        timesSeen: 0,
        timesKnown: 0,
        lastPracticedAt: now,
      };
      stats.timesSeen += 1;
      if (knew) stats.timesKnown += 1;
      stats.lastPracticedAt = now;
      this.practice.set(cardId, stats);
    }
    return { recorded: ratings.length };
  }

  /** The card, if its parent deck is the owner's. */
  private ownedCard(ownerId: string, cardId: string) {
    const card = this.cards.find((c) => c.id === cardId);
    return card && this.owned(ownerId, card.deckId) ? card : undefined;
  }

  private inDeck(deckId: string) {
    return this.cards
      .filter((c) => c.deckId === deckId)
      .sort((a, b) => a.position - b.position);
  }

  private static view({ id, term, meaning, position }: StoredCard): DeckCard {
    return { id, term, meaning, position };
  }

  /** Puts the card at `position` among the deck's cards and renumbers them 0..n-1. */
  private place(deckId: string, card: StoredCard, position: number) {
    const others = this.inDeck(deckId).filter((c) => c !== card);
    others.splice(Math.min(position, others.length), 0, card);
    others.forEach((c, index) => (c.position = index));
  }

  private addCard(ownerId: string, deckId: string, data: NewDeckCard) {
    const deck = this.owned(ownerId, deckId);
    if (!deck) {
      return null;
    }
    const card: StoredCard = {
      id: randomUUID(),
      deckId,
      term: data.term,
      meaning: data.meaning,
      position: Number.MAX_SAFE_INTEGER,
    };
    this.cards.push(card);
    this.place(deckId, card, data.position ?? Number.MAX_SAFE_INTEGER);
    deck.updatedAt = new Date().toISOString();
    return MemoryStore.view(card);
  }

  private updateCard(ownerId: string, cardId: string, changes: CardChanges) {
    const card = this.ownedCard(ownerId, cardId);
    if (!card) {
      return null;
    }
    if (changes.term !== undefined) card.term = changes.term;
    if (changes.meaning !== undefined) card.meaning = changes.meaning;
    if (changes.position !== undefined) {
      this.place(card.deckId, card, changes.position);
    }
    const deck = this.owned(ownerId, card.deckId);
    if (deck) deck.updatedAt = new Date().toISOString();
    return MemoryStore.view(card);
  }

  private deleteCard(ownerId: string, cardId: string) {
    const card = this.ownedCard(ownerId, cardId);
    if (!card) {
      return false;
    }
    this.cards = this.cards.filter((c) => c !== card);
    this.inDeck(card.deckId).forEach((c, index) => (c.position = index));
    return true;
  }

  private owned(ownerId: string, deckId: string) {
    return this.decks.find(
      (deck) => deck.id === deckId && deck.ownerId === ownerId,
    );
  }

  private summary(deck: StoredDeck): DeckSummary {
    return {
      id: deck.id,
      name: deck.name,
      language: deck.language,
      cardCount: this.cards.filter((card) => card.deckId === deck.id).length,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  }

  private listDecks(ownerId: string) {
    return this.decks
      .filter((deck) => deck.ownerId === ownerId)
      .map((deck) => this.summary(deck))
      .reverse() // later inserts first, so equal timestamps still come out newest first
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private getDeck(ownerId: string, deckId: string): DeckDetail | null {
    const deck = this.owned(ownerId, deckId);
    if (!deck) {
      return null;
    }
    const cards = this.cards
      .filter((card) => card.deckId === deck.id)
      .sort((a, b) => a.position - b.position)
      .map(({ id, term, meaning, position }) => ({
        id,
        term,
        meaning,
        position,
      }));
    return { deck: this.summary(deck), cards };
  }

  private renameDeck(ownerId: string, deckId: string, name: string) {
    const deck = this.owned(ownerId, deckId);
    if (!deck) {
      return null;
    }
    deck.name = name;
    deck.updatedAt = new Date().toISOString();
    return this.summary(deck);
  }

  private deleteDeck(ownerId: string, deckId: string) {
    const deck = this.owned(ownerId, deckId);
    if (!deck) {
      return false;
    }
    this.decks = this.decks.filter((d) => d.id !== deck.id);
    this.cards = this.cards.filter((card) => card.deckId !== deck.id); // cascade
    return true;
  }

  private createDeckWithCards(data: CreateDeckData) {
    const decksBefore = this.decks.length;
    const cardsBefore = this.cards.length;

    try {
      const now = new Date().toISOString();
      const id = randomUUID();
      this.decks.push({
        id,
        ownerId: data.ownerId,
        name: data.name,
        language: data.language,
        createdAt: now,
        updatedAt: now,
      });

      data.cards.forEach((card, position) => {
        if (position === this.options.failAfterCards) {
          throw new Error("Forced failure while writing cards");
        }
        this.cards.push({ id: randomUUID(), deckId: id, position, ...card });
      });

      return { id };
    } catch (error) {
      // A transaction rolls back; this is the same thing by hand.
      this.decks.length = decksBefore;
      this.cards.length = cardsBefore;
      throw error;
    }
  }
}
