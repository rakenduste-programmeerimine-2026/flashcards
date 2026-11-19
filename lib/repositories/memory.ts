import { randomUUID } from "node:crypto";
import type { CreateDeckData, Repositories } from "./types";

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
      },
    };
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
