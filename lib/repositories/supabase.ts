import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  LimitReachedError,
  RepositoryUnavailableError,
  type DeckCard,
  type DeckSummary,
  type Repositories,
} from "./types";

/**
 * The Supabase adapter (#18) for the tables and functions from #7 and #28.
 *
 * Every call uses the per-request client, so it runs as the signed-in user and row level
 * security decides what it can see: a deck or card of somebody else's comes back as
 * missing, exactly like the in-memory repository. The owner filters below are a second
 * line, not the only one.
 *
 * Writes that touch several rows go through the Postgres functions (`rpc`), which run in
 * one transaction and do the limit checks there, so two requests cannot both slip under a
 * limit. Reads with counts are one round trip: `cards(count)` is a join PostgREST does for us.
 */

type Client = Pick<SupabaseClient, "from" | "rpc">;
export type ClientFactory = () => Promise<Client | null>;

const DECK_COLUMNS = "id, name, language, created_at, updated_at";

type DeckRow = {
  id: string;
  name: string;
  language: string;
  created_at: string;
  updated_at: string;
  cards?: { count: number }[] | DeckCard[];
};

function toSummary(row: DeckRow, cardCount: number): DeckSummary {
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    cardCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countOf(row: DeckRow): number {
  const first = row.cards?.[0] as { count?: number } | undefined;
  return first?.count ?? 0;
}

function toCard(row: DeckCard): DeckCard {
  return {
    id: row.id,
    term: row.term,
    meaning: row.meaning,
    position: row.position,
  };
}

/** An id that is not a uuid cannot exist, so it is "missing", not a server error. */
function isInvalidId(error: PostgrestError) {
  return error.code === "22P02";
}

function fail(error: PostgrestError): never {
  if (error.message.includes("deck_limit_reached")) {
    throw new LimitReachedError("decks");
  }
  if (error.message.includes("card_limit_reached")) {
    throw new LimitReachedError("cards");
  }
  throw new Error(`Supabase: ${error.code ?? ""} ${error.message}`.trim());
}

export function createSupabaseRepositories(
  getClient: ClientFactory = createClient,
): Repositories {
  async function client(): Promise<Client> {
    const supabase = await getClient();
    if (!supabase) {
      throw new RepositoryUnavailableError("Supabase is not configured");
    }
    return supabase;
  }

  return {
    decks: {
      async createDeckWithCards(data, limits) {
        const db = await client();
        const { data: id, error } = await db.rpc("create_deck_with_cards", {
          p_name: data.name,
          p_language: data.language,
          p_cards: data.cards.map(({ term, meaning }) => ({ term, meaning })),
          p_max_decks: limits?.maxDecks ?? null,
        });
        if (error) fail(error);
        return { id: id as string };
      },

      async listDecks(ownerId) {
        const db = await client();
        const { data, error } = await db
          .from("decks")
          .select(`${DECK_COLUMNS}, cards(count)`)
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false });
        if (error) fail(error);
        return (data as DeckRow[]).map((row) => toSummary(row, countOf(row)));
      },

      async getDeck(ownerId, deckId) {
        const db = await client();
        const { data, error } = await db
          .from("decks")
          .select(`${DECK_COLUMNS}, cards(id, term, meaning, position)`)
          .eq("id", deckId)
          .eq("owner_id", ownerId)
          .order("position", { referencedTable: "cards", ascending: true })
          .maybeSingle();
        if (error) {
          if (isInvalidId(error)) return null;
          fail(error);
        }
        if (!data) return null;
        const row = data as DeckRow;
        const cards = ((row.cards ?? []) as DeckCard[]).map(toCard);
        return { deck: toSummary(row, cards.length), cards };
      },

      async renameDeck(ownerId, deckId, name) {
        const db = await client();
        const { data, error } = await db
          .from("decks")
          .update({ name })
          .eq("id", deckId)
          .eq("owner_id", ownerId)
          .select(`${DECK_COLUMNS}, cards(count)`)
          .maybeSingle();
        if (error) {
          if (isInvalidId(error)) return null;
          fail(error);
        }
        return data
          ? toSummary(data as DeckRow, countOf(data as DeckRow))
          : null;
      },

      async deleteDeck(ownerId, deckId) {
        const db = await client();
        const { data, error } = await db
          .from("decks")
          .delete()
          .eq("id", deckId)
          .eq("owner_id", ownerId)
          .select("id");
        if (error) {
          if (isInvalidId(error)) return false;
          fail(error);
        }
        return (data?.length ?? 0) > 0;
      },
    },

    cards: {
      async addCard(_ownerId, deckId, card, limits) {
        const db = await client();
        const { data, error } = await db.rpc("add_card", {
          p_deck_id: deckId,
          p_term: card.term,
          p_meaning: card.meaning,
          p_position: card.position ?? null,
          p_max_cards: limits?.maxCards ?? null,
        });
        if (error) {
          if (isInvalidId(error)) return null;
          fail(error);
        }
        const row = (data as DeckCard[] | null)?.[0];
        return row ? toCard(row) : null;
      },

      async updateCard(_ownerId, cardId, changes) {
        const db = await client();
        const { data, error } = await db.rpc("update_card", {
          p_card_id: cardId,
          p_term: changes.term ?? null,
          p_meaning: changes.meaning ?? null,
          p_position: changes.position ?? null,
        });
        if (error) {
          if (isInvalidId(error)) return null;
          fail(error);
        }
        const row = (data as DeckCard[] | null)?.[0];
        return row ? toCard(row) : null;
      },

      async deleteCard(_ownerId, cardId) {
        const db = await client();
        const { data, error } = await db.rpc("delete_card", {
          p_card_id: cardId,
        });
        if (error) {
          if (isInvalidId(error)) return false;
          fail(error);
        }
        return data === true;
      },
    },

    practice: {
      async recordRatings(_ownerId, ratings) {
        const db = await client();
        const { data, error } = await db.rpc("record_ratings", {
          p_ratings: ratings.map(({ cardId, knew }) => ({ cardId, knew })),
        });
        if (error) {
          if (isInvalidId(error)) return null;
          fail(error);
        }
        return data === null ? null : { recorded: data as number };
      },
    },
  };
}
