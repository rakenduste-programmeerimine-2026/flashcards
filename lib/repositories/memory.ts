import { randomUUID } from "node:crypto";
import type {
  CreateDeckData,
  DeckDetail,
  DeckSummary,
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
    };
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
