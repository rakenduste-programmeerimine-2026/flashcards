import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

/**
 * Row level security and the write functions from #7, checked against a real Postgres.
 *
 * Runs when DATABASE_TEST_URL points at an empty database, for example the local Supabase
 * stack (`npx supabase start`, then postgresql://postgres:postgres@127.0.0.1:54322/postgres)
 * or a plain Postgres. On a plain Postgres the shim adds the bits of Supabase the migration
 * needs. Without the variable the suite is skipped, so `npm test` still works offline.
 *
 * Every test runs in a transaction that is rolled back, so nothing is left behind.
 */

const url = process.env.DATABASE_TEST_URL;
const dir = join(__dirname);
const migrations = join(__dirname, "..", "migrations");

const alice = randomUUID();
const bob = randomUUID();

let db: Client;

async function as(user: string | null) {
  await db.query(`set local role ${user ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [
    user ?? "",
  ]);
}

async function asAdmin() {
  await db.query("reset role");
}

async function createDeck(cards: number, name = "Keskaeg") {
  const list = Array.from({ length: cards }, (_, i) => ({
    term: `Mõiste ${i + 1}`,
    meaning: `Tähendus ${i + 1}`,
  }));
  const { rows } = await db.query(
    "select public.create_deck_with_cards($1, 'et', $2::jsonb, 50) as id",
    [name, JSON.stringify(list)],
  );
  return rows[0].id as string;
}

async function terms(deckId: string) {
  const { rows } = await db.query(
    "select term, position from public.cards where deck_id = $1 order by position",
    [deckId],
  );
  return rows.map((r) => `${r.position}:${r.term}`);
}

describe.skipIf(!url)(
  "database: tables, policies and functions (#7, #20)",
  () => {
    beforeAll(async () => {
      db = new Client({ connectionString: url });
      await db.connect();
      const { rows } = await db.query("select to_regclass('auth.users') as t");
      if (!rows[0].t) {
        await db.query(readFileSync(join(dir, "supabase-shim.sql"), "utf8"));
      }
      const { rows: existing } = await db.query(
        "select to_regclass('public.decks') as t",
      );
      if (!existing[0].t) {
        for (const file of readdirSync(migrations).sort()) {
          await db.query(readFileSync(join(migrations, file), "utf8"));
        }
      }
    });

    afterAll(async () => {
      await db?.end();
    });

    beforeEach(async () => {
      await db.query("begin");
      await db.query("insert into auth.users (id) values ($1), ($2)", [
        alice,
        bob,
      ]);
    });

    afterEach(async () => {
      await db.query("rollback");
    });

    it("creates a deck with its cards in the given order", async () => {
      await as(alice);
      const id = await createDeck(12);
      expect(await terms(id)).toHaveLength(12);
      expect((await terms(id))[0]).toBe("0:Mõiste 1");
      expect((await terms(id))[11]).toBe("11:Mõiste 12");

      const { rows } = await db.query(
        "select owner_id from public.decks where id = $1",
        [id],
      );
      expect(rows[0].owner_id).toBe(alice);
    });

    it("writes nothing when one card is invalid", async () => {
      await as(alice);
      await db.query("savepoint s");
      await expect(
        db.query("select public.create_deck_with_cards('X', 'et', $1::jsonb)", [
          JSON.stringify([
            { term: "Hea", meaning: "Hea" },
            { term: " ", meaning: "Tühi" },
          ]),
        ]),
      ).rejects.toThrow(/cards_term_check/);
      await db.query("rollback to savepoint s");
      const { rows } = await db.query(
        "select count(*)::int as n from public.decks",
      );
      expect(rows[0].n).toBe(0);
    });

    it("hides one user's decks and cards from another", async () => {
      await as(alice);
      const id = await createDeck(3);

      await as(bob);
      expect((await db.query("select * from public.decks")).rowCount).toBe(0);
      expect((await db.query("select * from public.cards")).rowCount).toBe(0);
      expect(
        (await db.query("select * from public.decks where id = $1", [id]))
          .rowCount,
      ).toBe(0);
    });

    it("does not let another user change or delete a deck", async () => {
      await as(alice);
      const id = await createDeck(3);

      await as(bob);
      const renamed = await db.query(
        "update public.decks set name = 'Minu' where id = $1",
        [id],
      );
      const deleted = await db.query("delete from public.decks where id = $1", [
        id,
      ]);
      expect(renamed.rowCount).toBe(0);
      expect(deleted.rowCount).toBe(0);

      await asAdmin();
      const { rows } = await db.query(
        "select name from public.decks where id = $1",
        [id],
      );
      expect(rows[0].name).toBe("Keskaeg");
    });

    it("does not let another user add, change or delete cards in a deck", async () => {
      await as(alice);
      const id = await createDeck(2);
      const { rows: cards } = await db.query(
        "select id from public.cards where deck_id = $1",
        [id],
      );

      await as(bob);
      await db.query("savepoint s");
      await expect(
        db.query(
          "insert into public.cards (deck_id, term, meaning, position) values ($1, 'x', 'y', 5)",
          [id],
        ),
      ).rejects.toThrow(/row-level security/);
      await db.query("rollback to savepoint s");

      expect(
        (await db.query("select * from public.add_card($1, 'x', 'y')", [id]))
          .rowCount,
      ).toBe(0);
      expect(
        (
          await db.query("select * from public.update_card($1, 'x')", [
            cards[0].id,
          ])
        ).rowCount,
      ).toBe(0);
      const { rows } = await db.query("select public.delete_card($1) as ok", [
        cards[0].id,
      ]);
      expect(rows[0].ok).toBe(false);

      await as(alice);
      expect(await terms(id)).toEqual(["0:Mõiste 1", "1:Mõiste 2"]);
    });

    it("does not let a user create a deck in somebody else's name", async () => {
      await as(bob);
      await db.query("savepoint s");
      await expect(
        db.query(
          "insert into public.decks (owner_id, name, language) values ($1, 'x', 'et')",
          [alice],
        ),
      ).rejects.toThrow(/row-level security/);
      await db.query("rollback to savepoint s");
    });

    it("gives an anonymous visitor nothing", async () => {
      await as(alice);
      await createDeck(1);

      await as(null);
      await db.query("savepoint s");
      await expect(db.query("select * from public.decks")).rejects.toThrow(
        /permission denied/,
      );
      await db.query("rollback to savepoint s");
      await expect(
        db.query("select public.create_deck_with_cards('x', 'et', '[]')"),
      ).rejects.toThrow(/permission denied/);
      await db.query("rollback to savepoint s");
    });

    it("stops at the deck limit", async () => {
      await as(alice);
      await db.query(
        "select public.create_deck_with_cards('a', 'et', '[]', 2)",
      );
      await db.query(
        "select public.create_deck_with_cards('b', 'et', '[]', 2)",
      );
      await db.query("savepoint s");
      await expect(
        db.query("select public.create_deck_with_cards('c', 'et', '[]', 2)"),
      ).rejects.toThrow("deck_limit_reached");
      await db.query("rollback to savepoint s");
    });

    it("stops at the card limit", async () => {
      await as(alice);
      const id = await createDeck(2);
      await db.query("savepoint s");
      await expect(
        db.query("select * from public.add_card($1, 'x', 'y', null, 2)", [id]),
      ).rejects.toThrow("card_limit_reached");
      await db.query("rollback to savepoint s");
    });

    it("keeps positions gapless when adding, moving and deleting cards", async () => {
      await as(alice);
      const id = await createDeck(3);

      await db.query("select * from public.add_card($1, 'Uus', 'u', 0)", [id]);
      expect(await terms(id)).toEqual([
        "0:Uus",
        "1:Mõiste 1",
        "2:Mõiste 2",
        "3:Mõiste 3",
      ]);

      await db.query("select * from public.add_card($1, 'Lõpp', 'l', 99)", [
        id,
      ]);
      expect((await terms(id)).at(-1)).toBe("4:Lõpp");

      const { rows: first } = await db.query(
        "select id from public.cards where deck_id = $1 and position = 0",
        [id],
      );
      await db.query("select * from public.update_card($1, null, null, 3)", [
        first[0].id,
      ]);
      expect(await terms(id)).toEqual([
        "0:Mõiste 1",
        "1:Mõiste 2",
        "2:Mõiste 3",
        "3:Uus",
        "4:Lõpp",
      ]);

      await db.query("select * from public.update_card($1, null, null, 0)", [
        first[0].id,
      ]);
      expect((await terms(id))[0]).toBe("0:Uus");

      await db.query("select public.delete_card($1)", [first[0].id]);
      expect(await terms(id)).toEqual([
        "0:Mõiste 1",
        "1:Mõiste 2",
        "2:Mõiste 3",
        "3:Lõpp",
      ]);
    });

    it("deletes a deck's cards with the deck", async () => {
      await as(alice);
      const id = await createDeck(4);
      await db.query("delete from public.decks where id = $1", [id]);
      expect(await terms(id)).toEqual([]);
    });
  },
);
