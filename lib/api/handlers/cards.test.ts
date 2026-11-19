import { describe, expect, it } from "vitest";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { addCardHandler, deleteCardHandler, updateCardHandler } from "./cards";
import { jsonRequest, testDeps } from "./test-helpers";

async function seeded() {
  const { deps, store } = testDeps("user-1");
  const mine = await deps.repos.decks.createDeckWithCards({
    ownerId: "user-1",
    name: "Mine",
    language: "en",
    cards: [0, 1, 2, 3].map((i) => ({ term: `T${i}`, meaning: `M${i}` })),
  });
  const theirs = await deps.repos.decks.createDeckWithCards({
    ownerId: "user-2",
    name: "Theirs",
    language: "en",
    cards: [0, 1].map((i) => ({ term: `X${i}`, meaning: `Y${i}` })),
  });
  const order = (deckId: string) =>
    store.cards
      .filter((c) => c.deckId === deckId)
      .sort((a, b) => a.position - b.position);
  return {
    deps,
    store,
    mine: mine.id,
    theirs: theirs.id,
    order,
    mineCards: order(mine.id),
    theirCards: order(theirs.id),
  };
}

const positionsOf = (cards: { position: number }[]) =>
  cards.map((c) => c.position);

describe("POST /api/decks/:id/cards", () => {
  it("appends a card when no position is given", async () => {
    const { deps, mine, order } = await seeded();

    const response = await addCardHandler(
      jsonRequest({ term: " New ", meaning: "Card" }),
      mine,
      deps,
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: expect.any(String),
      term: "New",
      meaning: "Card",
      position: 4,
    });
    expect(order(mine).map((c) => c.term)).toEqual([
      "T0",
      "T1",
      "T2",
      "T3",
      "New",
    ]);
  });

  it("inserts at a position and keeps positions unique and ordered", async () => {
    const { deps, mine, order } = await seeded();

    const response = await addCardHandler(
      jsonRequest({ term: "New", meaning: "Card", position: 1 }),
      mine,
      deps,
    );

    expect((await response.json()).position).toBe(1);
    expect(order(mine).map((c) => c.term)).toEqual([
      "T0",
      "New",
      "T1",
      "T2",
      "T3",
    ]);
    expect(positionsOf(order(mine))).toEqual([0, 1, 2, 3, 4]);
  });

  it("treats a position past the end as last", async () => {
    const { deps, mine, order } = await seeded();

    await addCardHandler(
      jsonRequest({ term: "New", meaning: "Card", position: 99 }),
      mine,
      deps,
    );

    expect(positionsOf(order(mine))).toEqual([0, 1, 2, 3, 4]);
    expect(order(mine)[4].term).toBe("New");
  });

  it("answers 404 for a foreign deck and adds nothing", async () => {
    const { deps, store, theirs } = await seeded();

    const response = await addCardHandler(
      jsonRequest({ term: "a", meaning: "b" }),
      theirs,
      deps,
    );

    expect(response.status).toBe(404);
    expect(store.cards).toHaveLength(6);
  });

  it("answers 400 for an invalid card or position", async () => {
    const { deps, store, mine } = await seeded();

    const response = await addCardHandler(
      jsonRequest({ term: "", meaning: "b", position: -1 }),
      mine,
      deps,
    );

    expect(response.status).toBe(400);
    expect((await response.json()).fields).toEqual({
      term: "required",
      position: "invalid_value",
    });
    expect(store.cards).toHaveLength(6);
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    const response = await addCardHandler(
      jsonRequest({ term: "a", meaning: "b" }),
      "deck",
      deps,
    );

    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/cards/:id", () => {
  it("changes term and meaning only", async () => {
    const { deps, mineCards } = await seeded();

    const response = await updateCardHandler(
      jsonRequest({ term: " Changed " }, "PATCH"),
      mineCards[1].id,
      deps,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: mineCards[1].id,
      term: "Changed",
      meaning: "M1",
      position: 1,
    });
  });

  it("moves a card and renumbers the deck", async () => {
    const { deps, mine, mineCards, order } = await seeded();

    await updateCardHandler(
      jsonRequest({ position: 0 }, "PATCH"),
      mineCards[3].id,
      deps,
    );

    expect(order(mine).map((c) => c.term)).toEqual(["T3", "T0", "T1", "T2"]);
    expect(positionsOf(order(mine))).toEqual([0, 1, 2, 3]);
  });

  it("answers 404 for a card in a foreign deck and changes nothing", async () => {
    const { deps, store, theirCards } = await seeded();
    const before = structuredClone(store.cards);

    const response = await updateCardHandler(
      jsonRequest({ term: "Hacked", position: 0 }, "PATCH"),
      theirCards[1].id,
      deps,
    );

    expect(response.status).toBe(404);
    expect(store.cards).toEqual(before);
  });

  it("answers 404 for a card that does not exist", async () => {
    const { deps } = await seeded();

    const response = await updateCardHandler(
      jsonRequest({ term: "x" }, "PATCH"),
      "no-such-card",
      deps,
    );

    expect(response.status).toBe(404);
  });

  it("answers 400 for an empty or invalid change", async () => {
    const { deps, mineCards } = await seeded();

    const empty = await updateCardHandler(
      jsonRequest({}, "PATCH"),
      mineCards[0].id,
      deps,
    );
    const blank = await updateCardHandler(
      jsonRequest({ meaning: "  " }, "PATCH"),
      mineCards[0].id,
      deps,
    );

    expect(empty.status).toBe(400);
    expect((await empty.json()).fields).toEqual({ body: "required" });
    expect(blank.status).toBe(400);
    expect((await blank.json()).fields).toEqual({ meaning: "required" });
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    const response = await updateCardHandler(
      jsonRequest({ term: "x" }, "PATCH"),
      "id",
      deps,
    );

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/cards/:id", () => {
  it("deletes the card and closes the gap in positions", async () => {
    const { deps, mine, mineCards, order } = await seeded();

    const response = await deleteCardHandler(mineCards[1].id, deps);

    expect(response.status).toBe(204);
    expect(order(mine).map((c) => c.term)).toEqual(["T0", "T2", "T3"]);
    expect(positionsOf(order(mine))).toEqual([0, 1, 2]);
  });

  it("answers 404 for a card in a foreign deck and deletes nothing", async () => {
    const { deps, store, theirCards } = await seeded();

    const response = await deleteCardHandler(theirCards[0].id, deps);

    expect(response.status).toBe(404);
    expect(store.cards).toHaveLength(6);
  });

  it("answers 401 without a session", async () => {
    const { deps } = testDeps(null);

    expect((await deleteCardHandler("id", deps)).status).toBe(401);
  });
});

describe("before the tables exist (#7)", () => {
  it("answers 503 from every card route", async () => {
    const { deps } = testDeps();
    const stub = { ...deps, repos: createSupabaseRepositories() };

    const responses = [
      await addCardHandler(jsonRequest({ term: "a", meaning: "b" }), "d", stub),
      await updateCardHandler(jsonRequest({ term: "a" }, "PATCH"), "c", stub),
      await deleteCardHandler("c", stub),
    ];

    expect(responses.map((r) => r.status)).toEqual([503, 503, 503]);
  });
});
