import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server-errors";
import { parseBody } from "@/lib/validation/parse";
import { createCardSchema, updateCardSchema } from "@/lib/validation/schemas";
import { storageError, type HandlerDeps } from "./deps";

/**
 * Single-card writes. The repository decides ownership through the parent deck, and a
 * card in somebody else's deck is a 404 like a card that does not exist. The body is
 * checked with the shared schemas, never with inline rules.
 */

/** POST /api/decks/:id/cards */
export async function addCardHandler(
  request: Request,
  deckId: string,
  deps: HandlerDeps,
) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, createCardSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const card = await deps.repos.cards.addCard(
      auth.user.id,
      deckId,
      parsed.data,
    );
    return card
      ? NextResponse.json(card, { status: 201 })
      : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}

/** PATCH /api/cards/:id */
export async function updateCardHandler(
  request: Request,
  cardId: string,
  deps: HandlerDeps,
) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, updateCardSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const card = await deps.repos.cards.updateCard(
      auth.user.id,
      cardId,
      parsed.data,
    );
    return card ? NextResponse.json(card) : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}

/** DELETE /api/cards/:id */
export async function deleteCardHandler(cardId: string, deps: HandlerDeps) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const deleted = await deps.repos.cards.deleteCard(auth.user.id, cardId);
    return deleted
      ? new NextResponse(null, { status: 204 })
      : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}
