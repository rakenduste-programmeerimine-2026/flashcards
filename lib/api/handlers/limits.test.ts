import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "@/lib/rate-limit";
import { LIMITS, RATE_LIMITS } from "@/lib/validation/limits";
import { addCardHandler, deleteCardHandler, updateCardHandler } from "./cards";
import { createDeckHandler } from "./create-deck";
import {
  deleteDeckHandler,
  getDeckHandler,
  listDecksHandler,
  renameDeckHandler,
} from "./decks";
import { recordRatingsHandler } from "./practice";
import { jsonRequest, testDeps } from "./test-helpers";

const card = (i: number, term = `Term ${i}`, meaning = `Meaning ${i}`) => ({
  term,
  meaning,
});
const importBody = (count: number, make = card) => ({
  name: "History",
  language: "en",
  cards: Array.from({ length: count }, (_, i) => make(i)),
});

describe("size limit on the import route", () => {
  it("rejects an oversized paste with 413 too_large and writes nothing", async () => {
    const { deps, store } = testDeps();
    // 100 cards of 100 KB each is far over the limit, and passes no field rule either.
    const huge = "x".repeat(100_000);

    const response = await createDeckHandler(
      jsonRequest(importBody(100, (i) => card(i, "t", huge))),
      deps,
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "too_large" });
    expect(store.decks).toHaveLength(0);
  });

  it("is checked before the body is parsed, so garbage that is too big is 413 too", async () => {
    const { deps } = testDeps();

    const response = await createDeckHandler(
      jsonRequest("x".repeat(LIMITS.importBodyMaxBytes + 1)),
      deps,
    );

    expect(response.status).toBe(413);
  });

  it("takes the largest valid import: 200 cards with the longest term and meaning", async () => {
    const { deps, store } = testDeps();
    const longest = (i: number) =>
      card(i, "t".repeat(LIMITS.termMax), "õ".repeat(LIMITS.meaningMax));

    const response = await createDeckHandler(
      jsonRequest(importBody(LIMITS.cardsPerImportMax, longest)),
      deps,
    );

    expect(response.status).toBe(201);
    expect(store.cards).toHaveLength(LIMITS.cardsPerImportMax);
  });

  it("limits other write routes to the smaller default body", async () => {
    const { deps } = testDeps();
    const big = { term: "t", meaning: "m".repeat(LIMITS.bodyMaxBytes) };

    const response = await addCardHandler(jsonRequest(big), "deck", deps);

    expect(response.status).toBe(413);
  });
});

describe("decks per user", () => {
  it("answers 409 deck_limit_reached at the limit and writes nothing", async () => {
    const { deps, store } = testDeps("user-1");
    for (let i = 0; i < LIMITS.decksPerUserMax; i++) {
      await deps.repos.decks.createDeckWithCards({
        ownerId: "user-1",
        name: `Deck ${i}`,
        language: "en",
        cards: [card(i)],
      });
    }

    const response = await createDeckHandler(jsonRequest(importBody(3)), deps);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "deck_limit_reached" });
    expect(store.decks).toHaveLength(LIMITS.decksPerUserMax);
    expect(store.cards).toHaveLength(LIMITS.decksPerUserMax);
  });

  it("counts only the caller's decks", async () => {
    const { deps } = testDeps("user-1");
    for (let i = 0; i < LIMITS.decksPerUserMax; i++) {
      await deps.repos.decks.createDeckWithCards({
        ownerId: "user-2",
        name: `Deck ${i}`,
        language: "en",
        cards: [card(i)],
      });
    }

    const response = await createDeckHandler(jsonRequest(importBody(3)), deps);

    expect(response.status).toBe(201);
  });

  it("lets the user create a deck again after deleting one", async () => {
    const { deps } = testDeps("user-1");
    const ids: string[] = [];
    for (let i = 0; i < LIMITS.decksPerUserMax; i++) {
      const { id } = await deps.repos.decks.createDeckWithCards({
        ownerId: "user-1",
        name: `Deck ${i}`,
        language: "en",
        cards: [card(i)],
      });
      ids.push(id);
    }
    await deleteDeckHandler(ids[0], deps);

    const response = await createDeckHandler(jsonRequest(importBody(3)), deps);

    expect(response.status).toBe(201);
  });
});

describe("cards per deck", () => {
  async function fullDeck() {
    const { deps, store } = testDeps("user-1");
    const { id } = await deps.repos.decks.createDeckWithCards({
      ownerId: "user-1",
      name: "Full",
      language: "en",
      cards: Array.from({ length: LIMITS.cardsPerImportMax }, (_, i) =>
        card(i),
      ),
    });
    while (store.cards.length < LIMITS.cardsPerDeckMax) {
      await deps.repos.cards.addCard("user-1", id, card(store.cards.length));
    }
    return { deps, store, id };
  }

  it("answers 409 card_limit_reached when the deck is full", async () => {
    const { deps, store, id } = await fullDeck();

    const response = await addCardHandler(
      jsonRequest(card(0, "one", "too many")),
      id,
      deps,
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "card_limit_reached" });
    expect(store.cards).toHaveLength(LIMITS.cardsPerDeckMax);
  });

  it("allows the next card after one was deleted", async () => {
    const { deps, store, id } = await fullDeck();
    await deleteCardHandler(store.cards[0].id, deps);

    const response = await addCardHandler(
      jsonRequest(card(0, "again", "fits")),
      id,
      deps,
    );

    expect(response.status).toBe(201);
  });

  it("does not hide a missing deck behind the limit: a foreign deck is still 404", async () => {
    const { deps } = testDeps("user-1");
    const { id } = await deps.repos.decks.createDeckWithCards({
      ownerId: "user-2",
      name: "Theirs",
      language: "en",
      cards: [card(0)],
    });

    const response = await addCardHandler(jsonRequest(card(1)), id, deps);

    expect(response.status).toBe(404);
  });
});

describe("rate limiting", () => {
  const small = (limit: number) =>
    createMemoryRateLimiter({ limit, windowMs: 60_000 });

  it("answers 429 rate_limited with Retry-After once a user is over the limit", async () => {
    const { deps, store } = testDeps("user-1", undefined, small(2));

    const first = await createDeckHandler(jsonRequest(importBody(2)), deps);
    const second = await createDeckHandler(jsonRequest(importBody(2)), deps);
    const third = await createDeckHandler(jsonRequest(importBody(2)), deps);

    expect([first.status, second.status, third.status]).toEqual([
      201, 201, 429,
    ]);
    expect(await third.json()).toEqual({ error: "rate_limited" });
    expect(Number(third.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(store.decks).toHaveLength(2);
  });

  it("applies to every write route, and they share one allowance", async () => {
    const { deps } = testDeps("user-1", undefined, small(1));

    await renameDeckHandler(jsonRequest({ name: "x" }, "PATCH"), "d", deps);
    const responses = [
      await renameDeckHandler(jsonRequest({ name: "x" }, "PATCH"), "d", deps),
      await deleteDeckHandler("d", deps),
      await addCardHandler(jsonRequest(card(0)), "d", deps),
      await updateCardHandler(jsonRequest({ term: "t" }, "PATCH"), "c", deps),
      await deleteCardHandler("c", deps),
      await recordRatingsHandler(
        jsonRequest({ ratings: [{ cardId: "c", knew: true }] }),
        deps,
      ),
      await createDeckHandler(jsonRequest(importBody(1)), deps),
    ];

    expect(responses.map((r) => r.status)).toEqual(Array(7).fill(429));
  });

  it("does not limit reads", async () => {
    const { deps } = testDeps("user-1", undefined, small(1));

    for (let i = 0; i < 10; i++) {
      expect((await listDecksHandler(deps)).status).toBe(200);
      expect((await getDeckHandler("d", deps)).status).toBe(404);
    }
  });

  it("gives every user their own allowance", async () => {
    const limiter = small(1);
    const a = testDeps("user-1", undefined, limiter).deps;
    const b = testDeps("user-2", undefined, limiter).deps;

    await createDeckHandler(jsonRequest(importBody(1)), a);

    expect(
      (await createDeckHandler(jsonRequest(importBody(1)), a)).status,
    ).toBe(429);
    expect(
      (await createDeckHandler(jsonRequest(importBody(1)), b)).status,
    ).toBe(201);
  });

  it("does not use up an allowance for a request without a session", async () => {
    const limiter = small(1);
    const anonymous = testDeps(null, undefined, limiter).deps;
    const user = testDeps("user-1", undefined, limiter).deps;

    for (let i = 0; i < 5; i++) {
      expect(
        (await createDeckHandler(jsonRequest(importBody(1)), anonymous)).status,
      ).toBe(401);
    }

    expect(
      (await createDeckHandler(jsonRequest(importBody(1)), user)).status,
    ).toBe(201);
  });

  it("counts invalid requests too, so a broken client cannot hammer a route", async () => {
    const { deps } = testDeps("user-1", undefined, small(1));

    const invalid = await createDeckHandler(jsonRequest({}), deps);
    const next = await createDeckHandler(jsonRequest(importBody(1)), deps);

    expect([invalid.status, next.status]).toEqual([400, 429]);
  });
});

describe("normal use never hits a limit", () => {
  it("a 40-card import is far under every limit", async () => {
    const { deps, store } = testDeps("user-1");
    const body = JSON.stringify(importBody(40));

    const response = await createDeckHandler(jsonRequest(body), deps);

    expect(response.status).toBe(201);
    expect(store.cards).toHaveLength(40);
    expect(new TextEncoder().encode(body).byteLength).toBeLessThan(
      LIMITS.importBodyMaxBytes / 10,
    );
    expect(40).toBeLessThan(LIMITS.cardsPerDeckMax);
  });

  it("importing, then editing every card of the deck, stays under the rate limit", async () => {
    const { deps, store } = testDeps("user-1");
    const created = await createDeckHandler(jsonRequest(importBody(40)), deps);
    const { id } = await created.json();

    // The editor sends one request per changed card: rename, 40 edits, 5 adds, 5 deletes.
    const statuses = [
      (
        await renameDeckHandler(
          jsonRequest({ name: "Edited" }, "PATCH"),
          id,
          deps,
        )
      ).status,
    ];
    for (const { id: cardId } of [...store.cards]) {
      statuses.push(
        (
          await updateCardHandler(
            jsonRequest({ meaning: "Edited" }, "PATCH"),
            cardId,
            deps,
          )
        ).status,
      );
    }
    for (let i = 0; i < 5; i++) {
      statuses.push(
        (await addCardHandler(jsonRequest(card(i, `New ${i}`)), id, deps))
          .status,
      );
    }
    for (const { id: cardId } of store.cards.slice(0, 5)) {
      statuses.push((await deleteCardHandler(cardId, deps)).status);
    }

    expect(statuses).not.toContain(429);
    expect(1 + 1 + statuses.length).toBeLessThan(RATE_LIMITS.writesPerWindow);
  });
});
