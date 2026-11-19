import { RepositoryUnavailableError, type Repositories } from "./types";

/**
 * TODO(#7): the Supabase adapter. It needs the `decks` and `cards` tables and their
 * row level security policies from #7, which are not in `main` yet.
 *
 * When they land, implement `DeckRepository` here with the per-request client from
 * `requireUser()` (so RLS applies as the caller), write the deck and its cards in one
 * transaction (for example a Postgres function called through `rpc`), and check the
 * adapter against the same behaviour the tests pin down on the in-memory repository.
 *
 * Until then every call fails with `RepositoryUnavailableError`, which the handlers
 * turn into a 503 instead of pretending to save something.
 */
function notConnected(): never {
  throw new RepositoryUnavailableError(
    "The Supabase repository is waiting for the tables from #7",
  );
}

export function createSupabaseRepositories(): Repositories {
  return {
    decks: {
      createDeckWithCards: async () => notConnected(),
      listDecks: async () => notConnected(),
      getDeck: async () => notConnected(),
      renameDeck: async () => notConnected(),
      deleteDeck: async () => notConnected(),
    },
    cards: {
      addCard: async () => notConnected(),
      updateCard: async () => notConnected(),
      deleteCard: async () => notConnected(),
    },
  };
}
