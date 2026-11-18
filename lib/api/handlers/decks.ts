import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server-errors";
import { parseBody } from "@/lib/validation/parse";
import { renameDeckSchema } from "@/lib/validation/schemas";
import { requireWriter, storageError, type HandlerDeps } from "./deps";

/**
 * GET, PATCH and DELETE on decks. Every one checks the session first and passes the
 * owner to the repository, which only returns what that owner has. A deck that is
 * missing and a deck that belongs to someone else are both 404, so an id is never
 * confirmed to a stranger.
 */

/** GET /api/decks */
export async function listDecksHandler(deps: HandlerDeps) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    return NextResponse.json({
      decks: await deps.repos.decks.listDecks(auth.user.id),
    });
  } catch (error) {
    return storageError(error);
  }
}

/** GET /api/decks/:id */
export async function getDeckHandler(deckId: string, deps: HandlerDeps) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const detail = await deps.repos.decks.getDeck(auth.user.id, deckId);
    return detail ? NextResponse.json(detail) : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}

/** PATCH /api/decks/:id */
export async function renameDeckHandler(
  request: Request,
  deckId: string,
  deps: HandlerDeps,
) {
  const auth = await requireWriter(deps);
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, renameDeckSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const deck = await deps.repos.decks.renameDeck(
      auth.user.id,
      deckId,
      parsed.data.name,
    );
    return deck ? NextResponse.json(deck) : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}

/** DELETE /api/decks/:id */
export async function deleteDeckHandler(deckId: string, deps: HandlerDeps) {
  const auth = await requireWriter(deps);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const deleted = await deps.repos.decks.deleteDeck(auth.user.id, deckId);
    return deleted
      ? new NextResponse(null, { status: 204 })
      : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}
