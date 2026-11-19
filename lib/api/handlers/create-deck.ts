import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/validation/limits";
import { parseBody } from "@/lib/validation/parse";
import { createDeckSchema } from "@/lib/validation/schemas";
import { requireWriter, storageError, type HandlerDeps } from "./deps";

/**
 * POST /api/decks. The owner comes from the session and never from the body: the
 * schema does not even have a field for it.
 *
 * This is the import route, so its body may be larger than the others, but still
 * capped: a paste over `importBodyMaxBytes` is `413 too_large` and is not parsed. A
 * user who already has `decksPerUserMax` decks gets `409 deck_limit_reached`.
 */
export async function createDeckHandler(request: Request, deps: HandlerDeps) {
  const auth = await requireWriter(deps);
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, createDeckSchema, {
    maxBytes: LIMITS.importBodyMaxBytes,
  });
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const { id } = await deps.repos.decks.createDeckWithCards(
      { ownerId: auth.user.id, ...parsed.data },
      { maxDecks: LIMITS.decksPerUserMax },
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return storageError(error);
  }
}
