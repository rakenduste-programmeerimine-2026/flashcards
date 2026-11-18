import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { createSupabaseRepositories } from "./supabase";
import { LimitReachedError, type Repositories } from "./types";

/**
 * The Supabase adapter against a running Supabase with the migrations applied, through
 * PostgREST and real sessions, so row level security is the real thing.
 *
 *   npx supabase start
 *   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
 *   SUPABASE_TEST_ANON_KEY=<ANON_KEY from `npx supabase status`> \
 *   SUPABASE_TEST_SERVICE_KEY=<SERVICE_ROLE_KEY> npm test
 *
 * The service key only creates the two test users. Never point this at production.
 * Skipped when the variables are missing.
 */

const url = process.env.SUPABASE_TEST_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY;

type User = { id: string; repos: Repositories };

async function signedInUser(): Promise<User> {
  const admin = createClient(url!, serviceKey!, {
    auth: { persistSession: false },
  });
  const email = `test-${randomUUID()}@example.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  const client: SupabaseClient = createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  return {
    id: data.user.id,
    repos: createSupabaseRepositories(async () => client),
  };
}

const cards = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    term: `Mõiste ${i + 1}`,
    meaning: `Tähendus ${i + 1}`,
  }));

describe.skipIf(!url || !anonKey || !serviceKey)(
  "Supabase repository (#18)",
  () => {
    let alice: User;
    let bob: User;

    beforeAll(async () => {
      [alice, bob] = await Promise.all([signedInUser(), signedInUser()]);
    });

    it("creates a deck with 12 cards and reads it back in order", async () => {
      const { id } = await alice.repos.decks.createDeckWithCards({
        ownerId: alice.id,
        name: "Eesti keskaeg",
        language: "et",
        cards: cards(12),
      });

      const detail = await alice.repos.decks.getDeck(alice.id, id);
      expect(detail?.deck).toMatchObject({
        id,
        name: "Eesti keskaeg",
        language: "et",
        cardCount: 12,
      });
      expect(detail?.cards.map((c) => c.position)).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      ]);
      expect(detail?.cards[0]).toMatchObject({
        term: "Mõiste 1",
        meaning: "Tähendus 1",
      });
    });

    it("lists decks newest first with card counts", async () => {
      const user = await signedInUser();
      await user.repos.decks.createDeckWithCards({
        ownerId: user.id,
        name: "Vanem",
        language: "et",
        cards: cards(2),
      });
      await user.repos.decks.createDeckWithCards({
        ownerId: user.id,
        name: "Uuem",
        language: "en",
        cards: cards(5),
      });

      const decks = await user.repos.decks.listDecks(user.id);
      expect(decks.map((d) => [d.name, d.cardCount])).toEqual([
        ["Uuem", 5],
        ["Vanem", 2],
      ]);
    });

    it("renames and deletes only the owner's deck", async () => {
      const { id } = await alice.repos.decks.createDeckWithCards({
        ownerId: alice.id,
        name: "Enne",
        language: "et",
        cards: cards(1),
      });

      expect(await bob.repos.decks.getDeck(bob.id, id)).toBeNull();
      expect(await bob.repos.decks.renameDeck(bob.id, id, "Minu")).toBeNull();
      expect(await bob.repos.decks.deleteDeck(bob.id, id)).toBe(false);

      const renamed = await alice.repos.decks.renameDeck(
        alice.id,
        id,
        "Pärast",
      );
      expect(renamed).toMatchObject({ name: "Pärast", cardCount: 1 });

      expect(await alice.repos.decks.deleteDeck(alice.id, id)).toBe(true);
      expect(await alice.repos.decks.getDeck(alice.id, id)).toBeNull();
    });

    it("answers missing for ids that are not uuids", async () => {
      expect(await alice.repos.decks.getDeck(alice.id, "nope")).toBeNull();
      expect(await alice.repos.cards.deleteCard(alice.id, "nope")).toBe(false);
    });

    it("adds, moves and deletes cards with gapless positions", async () => {
      const { id } = await alice.repos.decks.createDeckWithCards({
        ownerId: alice.id,
        name: "Kaardid",
        language: "et",
        cards: cards(3),
      });

      const added = await alice.repos.cards.addCard(alice.id, id, {
        term: "Uus",
        meaning: "u",
        position: 0,
      });
      expect(added).toMatchObject({ term: "Uus", position: 0 });

      const moved = await alice.repos.cards.updateCard(alice.id, added!.id, {
        position: 99,
        meaning: "muudetud",
      });
      expect(moved).toMatchObject({ position: 3, meaning: "muudetud" });

      expect(
        await bob.repos.cards.updateCard(bob.id, added!.id, { term: "x" }),
      ).toBeNull();
      expect(
        await bob.repos.cards.addCard(bob.id, id, { term: "x", meaning: "y" }),
      ).toBeNull();
      expect(await bob.repos.cards.deleteCard(bob.id, added!.id)).toBe(false);

      const first = (await alice.repos.decks.getDeck(alice.id, id))!.cards[0];
      expect(await alice.repos.cards.deleteCard(alice.id, first.id)).toBe(true);

      const after = await alice.repos.decks.getDeck(alice.id, id);
      expect(after?.cards.map((c) => `${c.position}:${c.term}`)).toEqual([
        "0:Mõiste 2",
        "1:Mõiste 3",
        "2:Uus",
      ]);
    });

    it("turns the database limits into LimitReachedError", async () => {
      const user = await signedInUser();
      const { id } = await user.repos.decks.createDeckWithCards(
        { ownerId: user.id, name: "A", language: "et", cards: cards(2) },
        { maxDecks: 1 },
      );
      await expect(
        user.repos.decks.createDeckWithCards(
          { ownerId: user.id, name: "B", language: "et", cards: [] },
          { maxDecks: 1 },
        ),
      ).rejects.toEqual(new LimitReachedError("decks"));
      await expect(
        user.repos.cards.addCard(
          user.id,
          id,
          { term: "x", meaning: "y" },
          { maxCards: 2 },
        ),
      ).rejects.toEqual(new LimitReachedError("cards"));
    });

    it("records practice ratings, all or nothing", async () => {
      const { id } = await alice.repos.decks.createDeckWithCards({
        ownerId: alice.id,
        name: "Harjutus",
        language: "et",
        cards: cards(2),
      });
      const [a, b] = (await alice.repos.decks.getDeck(alice.id, id))!.cards;

      expect(
        await alice.repos.practice.recordRatings(alice.id, [
          { cardId: a.id, knew: true },
          { cardId: a.id, knew: false },
          { cardId: b.id, knew: true },
        ]),
      ).toEqual({ recorded: 3 });

      expect(
        await bob.repos.practice.recordRatings(bob.id, [
          { cardId: a.id, knew: true },
        ]),
      ).toBeNull();
    });
  },
);
