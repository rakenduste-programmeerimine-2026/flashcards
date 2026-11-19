import { describe, expect, it } from "vitest";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { createDeckHandler } from "./create-deck";
import { jsonRequest, testDeps } from "./test-helpers";

const cards = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    term: `Term ${i}`,
    meaning: `Meaning ${i}`,
  }));
const body = (count = 40) => ({
  name: "History",
  language: "en",
  cards: cards(count),
});

describe("POST /api/decks", () => {
  it("creates one deck and 40 cards with the session's owner", async () => {
    const { deps, store } = testDeps("user-1");

    const response = await createDeckHandler(jsonRequest(body()), deps);

    expect(response.status).toBe(201);
    const { id } = await response.json();
    expect(store.decks).toHaveLength(1);
    expect(store.decks[0]).toMatchObject({
      id,
      ownerId: "user-1",
      name: "History",
      language: "en",
    });
    expect(store.cards).toHaveLength(40);
    expect(store.cards.every((card) => card.deckId === id)).toBe(true);
  });

  it("keeps the order of the cards as positions 0..n-1", async () => {
    const { deps, store } = testDeps();

    await createDeckHandler(jsonRequest(body()), deps);

    expect(store.cards.map((card) => card.position)).toEqual(
      Array.from({ length: 40 }, (_, i) => i),
    );
    expect(store.cards.map((card) => card.term)).toEqual(
      cards(40).map((card) => card.term),
    );
  });

  it("takes the owner from the session, not from the body", async () => {
    const { deps, store } = testDeps("user-1");

    await createDeckHandler(
      jsonRequest({ ...body(1), ownerId: "user-2", owner_id: "user-2" }),
      deps,
    );

    expect(store.decks[0].ownerId).toBe("user-1");
  });

  it("answers 401 without a session and writes nothing", async () => {
    const { deps, store } = testDeps(null);

    const response = await createDeckHandler(jsonRequest(body()), deps);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(store.decks).toHaveLength(0);
    expect(store.cards).toHaveLength(0);
  });

  it("answers 400 for an invalid payload and writes nothing", async () => {
    const { deps, store } = testDeps();

    const response = await createDeckHandler(
      jsonRequest({ name: "", language: "fr", cards: [] }),
      deps,
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("invalid_input");
    expect(Object.keys(json.fields)).toEqual(
      expect.arrayContaining(["name", "language", "cards"]),
    );
    expect(store.decks).toHaveLength(0);
    expect(store.cards).toHaveLength(0);
  });

  it("answers 400 for a body that is not JSON", async () => {
    const { deps, store } = testDeps();

    const response = await createDeckHandler(jsonRequest("not json"), deps);

    expect(response.status).toBe(400);
    expect(store.decks).toHaveLength(0);
  });

  it("leaves no deck behind when a write fails half way", async () => {
    const { deps, store } = testDeps("user-1", { failAfterCards: 20 });

    const response = await createDeckHandler(jsonRequest(body()), deps);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "server_error" });
    expect(store.decks).toHaveLength(0);
    expect(store.cards).toHaveLength(0);
  });

  it("answers 503 while the Supabase repository is not connected (#7)", async () => {
    const { deps } = testDeps();

    const response = await createDeckHandler(jsonRequest(body()), {
      ...deps,
      repos: createSupabaseRepositories(),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "storage_unavailable" });
  });
});
