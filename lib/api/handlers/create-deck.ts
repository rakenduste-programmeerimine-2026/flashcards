import { NextResponse } from "next/server";
import { parseBody } from "@/lib/validation/parse";
import { createDeckSchema } from "@/lib/validation/schemas";
import { storageError, type HandlerDeps } from "./deps";

/**
 * POST /api/decks. The owner comes from the session and never from the body: the
 * schema does not even have a field for it.
 */
export async function createDeckHandler(request: Request, deps: HandlerDeps) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, createDeckSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const { id } = await deps.repos.decks.createDeckWithCards({
      ownerId: auth.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return storageError(error);
  }
}
