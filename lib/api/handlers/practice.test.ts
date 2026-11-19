import { describe, expect, it } from "vitest";
import { createSupabaseRepositories } from "@/lib/repositories/supabase";
import { LIMITS } from "@/lib/validation/limits";
import { jsonRequest, testDeps } from "./test-helpers";
import { recordRatingsHandler } from "./practice";

async function seeded() {
  const { deps, store } = testDeps("user-1");
  const make = (ownerId: string, count: number) =>
    deps.repos.decks.createDeckWithCards({
      ownerId,
      name: ownerId,
      language: "en",
      cards: Array.from({ length: count }, (_, i) => ({
        term: `T${i}`,
        meaning: `M${i}`,
      })),
    });
  const mine = await make("user-1", 40);
  const theirs = await make("user-2", 2);
  const idsOf = (deckId: string) =>
    store.cards.filter((c) => c.deckId === deckId).map((c) => c.id);
  return { deps, store, mine: idsOf(mine.id), theirs: idsOf(theirs.id) };
}

const post = (body: unknown) => jsonRequest(body);

describe("POST /api/practice/ratings", () => {
  it("records the ratings of a full session", async () => {
    const { deps, store, mine } = await seeded();
    const ratings = mine.map((cardId, i) => ({ cardId, knew: i % 4 !== 0 }));

    const response = await recordRatingsHandler(post({ ratings }), deps);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ recorded: 40 });
    expect(store.practice.size).toBe(40);
    expect(store.practice.get(mine[0])).toMatchObject({
      timesSeen: 1,
      timesKnown: 0,
    });
    expect(store.practice.get(mine[1])).toMatchObject({
      timesSeen: 1,
      timesKnown: 1,
    });
  });

  it("adds up over rounds, including a card repeated in one batch", async () => {
    const { deps, store, mine } = await seeded();

    await recordRatingsHandler(
      post({
        ratings: [
          { cardId: mine[0], knew: false },
          { cardId: mine[0], knew: true },
        ],
      }),
      deps,
    );
    await recordRatingsHandler(
      post({ ratings: [{ cardId: mine[0], knew: true }] }),
      deps,
    );

    expect(store.practice.get(mine[0])).toMatchObject({
      timesSeen: 3,
      timesKnown: 2,
      lastPracticedAt: expect.any(String),
    });
  });

  it("rejects a foreign card with 404 and writes nothing, even in a mixed batch", async () => {
    const { deps, store, mine, theirs } = await seeded();

    const response = await recordRatingsHandler(
      post({
        ratings: [
          { cardId: mine[0], knew: true },
          { cardId: theirs[0], knew: true },
        ],
      }),
      deps,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
    expect(store.practice.size).toBe(0);
  });

  it("answers 404 for a card that does not exist", async () => {
    const { deps, store } = await seeded();

    const response = await recordRatingsHandler(
      post({ ratings: [{ cardId: "nope", knew: false }] }),
      deps,
    );

    expect(response.status).toBe(404);
    expect(store.practice.size).toBe(0);
  });

  it("answers 400 for an invalid body and writes nothing", async () => {
    const { deps, store, mine } = await seeded();

    const bodies = [
      {},
      { ratings: [] },
      { ratings: [{ cardId: mine[0] }] },
      { ratings: [{ cardId: mine[0], knew: "yes" }] },
      { ratings: [{ cardId: "", knew: true }] },
      {
        ratings: Array.from(
          { length: LIMITS.ratingsPerRequestMax + 1 },
          () => ({
            cardId: mine[0],
            knew: true,
          }),
        ),
      },
    ];
    for (const body of bodies) {
      const response = await recordRatingsHandler(post(body), deps);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("invalid_input");
    }
    expect(store.practice.size).toBe(0);
  });

  it("names the failing rating in the error", async () => {
    const { deps, mine } = await seeded();

    const response = await recordRatingsHandler(
      post({
        ratings: [
          { cardId: mine[0], knew: true },
          { cardId: mine[1], knew: "yes" },
        ],
      }),
      deps,
    );

    expect((await response.json()).fields).toEqual({
      "ratings.1.knew": "invalid_value",
    });
  });

  it("answers 401 without a session", async () => {
    const { deps, store } = testDeps(null);

    const response = await recordRatingsHandler(
      post({ ratings: [{ cardId: "x", knew: true }] }),
      deps,
    );

    expect(response.status).toBe(401);
    expect(store.practice.size).toBe(0);
  });

  it("answers 503 while the practice storage is not connected (#28)", async () => {
    const { deps } = testDeps();

    const response = await recordRatingsHandler(
      post({ ratings: [{ cardId: "x", knew: true }] }),
      { ...deps, repos: createSupabaseRepositories() },
    );

    expect(response.status).toBe(503);
  });
});
