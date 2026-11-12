import type { ParsedCard } from "@/lib/import/types";
import { request } from "./client";

/**
 * The deck endpoints, as agreed in #16, #17 and #27.
 *
 * Everything that reads or writes a deck goes through here rather than calling
 * fetch from a component, so the shapes live in one file when the backend changes.
 */

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

export type DeckDetail = {
  deck: DeckSummary;
  cards: DeckCard[];
};

export function createDeck(input: {
  name: string;
  language: string;
  cards: ParsedCard[];
}): Promise<{ id: string }> {
  return request<{ id: string }>("/api/decks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listDecks(): Promise<{ decks: DeckSummary[] }> {
  return request<{ decks: DeckSummary[] }>("/api/decks");
}

export function getDeck(id: string): Promise<DeckDetail> {
  return request<DeckDetail>(`/api/decks/${encodeURIComponent(id)}`);
}

export function renameDeck(id: string, name: string): Promise<DeckSummary> {
  return request<DeckSummary>(`/api/decks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteDeck(id: string): Promise<void> {
  return request<void>(`/api/decks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
