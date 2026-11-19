import { describe, expect, it } from "vitest";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import {
  deleteDeckHandler,
  getDeckHandler,
  listDecksHandler,
  renameDeckHandler,
} from "./decks";
import { jsonRequest, testDeps } from "./test-helpers";

const cards = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    term: `Term ${i}`,
    meaning: `Meaning ${i}`,
  }));

/** Two users with two decks and one deck each, written straight into the store. */
async function seeded() {
  const { deps, store } = testDeps("user-1");
  const { decks } = deps.repos;
  const mine1 = await decks.createDeckWithCards({
    ownerId: "user-1",
    name: "First",
    language: "en",
    cards: cards(3),
  });
  const mine2 = await decks.createDeckWithCards({
    ownerId: "user-1",
    name: "Second",
    language: "et",
    cards: cards(5),
  });
  const foreign = await decks.createDeckWithCards({
    ownerId: "user-2",
    name: "Not yours",
    language: "en",
    cards: cards(2),
  });
  return { deps, store, mine1: mine1.id, mine2: mine2.id, foreign: foreign.id };
}

describe("GET /api/decks", () => {
  it("lists only the caller's decks, newest first, with card counts", async () => {
    const { deps } = await seeded();

    const response = await listDecksHandler(deps);

    expect(response.status).toBe(200);
    const { decks } = await response.json();
    expect(decks.map((d: { name: string }) => d.name)).toEqual([
      "Second",
      "First",
    ]);
    expect(decks.map((d: { cardCount: number }) => d.cardCount)).toEqual([
      5, 3,
    ]);
    expect(decks[0]).toEqual({
      id: expect.any(String),
      name: "Second",
      language: "et",
      cardCount: 5,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it("returns an empty list for a user with no decks", async () => {
    const { deps } = testDeps("user-3");

    const response = await listDecksHandler(deps);

    expect(await response.json()).toEqual({ decks: [] });
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    expect((await listDecksHandler(deps)).status).toBe(401);
  });
});

describe("GET /api/decks/:id", () => {
  it("returns the deck with its cards in position order", async () => {
    const { deps, mine1 } = await seeded();

    const response = await getDeckHandler(mine1, deps);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.deck).toMatchObject({ id: mine1, name: "First", cardCount: 3 });
    expect(json.cards.map((c: { position: number }) => c.position)).toEqual([
      0, 1, 2,
    ]);
    expect(json.cards[0]).toEqual({
      id: expect.any(String),
      term: "Term 0",
      meaning: "Meaning 0",
      position: 0,
    });
  });

  it("answers 404 for a foreign or missing deck", async () => {
    const { deps, foreign } = await seeded();

    for (const id of [foreign, "no-such-deck"]) {
      const response = await getDeckHandler(id, deps);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "not_found" });
    }
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    expect((await getDeckHandler("x", deps)).status).toBe(401);
  });
});

describe("PATCH /api/decks/:id", () => {
  it("renames the deck and returns it", async () => {
    const { deps, mine1 } = await seeded();

    const response = await renameDeckHandler(
      jsonRequest({ name: "  Renamed  " }, "PATCH"),
      mine1,
      deps,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: mine1,
      name: "Renamed",
      cardCount: 3,
    });
  });

  it("answers 404 for a foreign deck and changes nothing", async () => {
    const { deps, store, foreign } = await seeded();

    const response = await renameDeckHandler(
      jsonRequest({ name: "Mine now" }, "PATCH"),
      foreign,
      deps,
    );

    expect(response.status).toBe(404);
    expect(store.decks.find((d) => d.id === foreign)?.name).toBe("Not yours");
  });

  it("answers 400 for an invalid name and changes nothing", async () => {
    const { deps, store, mine1 } = await seeded();

    const response = await renameDeckHandler(
      jsonRequest({ name: "   " }, "PATCH"),
      mine1,
      deps,
    );

    expect(response.status).toBe(400);
    expect((await response.json()).fields).toEqual({ name: "required" });
    expect(store.decks.find((d) => d.id === mine1)?.name).toBe("First");
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    const response = await renameDeckHandler(
      jsonRequest({ name: "x" }, "PATCH"),
      "id",
      deps,
    );

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/decks/:id", () => {
  it("deletes the deck and its cards, and nobody else's", async () => {
    const { deps, store, mine1, foreign } = await seeded();

    const response = await deleteDeckHandler(mine1, deps);

    expect(response.status).toBe(204);
    expect(store.decks.map((d) => d.id)).not.toContain(mine1);
    expect(store.cards.filter((c) => c.deckId === mine1)).toHaveLength(0);
    expect(store.cards.filter((c) => c.deckId === foreign)).toHaveLength(2);
    expect(store.cards).toHaveLength(7);
  });

  it("answers 404 for a foreign deck and deletes nothing", async () => {
    const { deps, store, foreign } = await seeded();

    const response = await deleteDeckHandler(foreign, deps);

    expect(response.status).toBe(404);
    expect(store.decks).toHaveLength(3);
    expect(store.cards).toHaveLength(10);
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    expect((await deleteDeckHandler("id", deps)).status).toBe(401);
  });
});

describe("before the tables exist (#7)", () => {
  it("answers 503 from every route", async () => {
    const { deps } = testDeps();
    const stub = { ...deps, repos: createSupabaseRepositories() };

    const responses = [
      await listDecksHandler(stub),
      await getDeckHandler("id", stub),
      await renameDeckHandler(jsonRequest({ name: "x" }, "PATCH"), "id", stub),
      await deleteDeckHandler("id", stub),
    ];

    expect(responses.map((r) => r.status)).toEqual([503, 503, 503, 503]);
  });
});
