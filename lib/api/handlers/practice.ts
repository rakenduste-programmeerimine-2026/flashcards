import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/server-errors";
import { parseBody } from "@/lib/validation/parse";
import { practiceRatingsSchema } from "@/lib/validation/schemas";
import { storageError, type HandlerDeps } from "./deps";

/**
 * POST /api/practice/ratings, a batch of `{ cardId, knew }`.
 *
 * Every card is checked against its parent deck's owner. One card that is not the
 * caller's rejects the whole batch with 404 and writes nothing, so a rating can never
 * land on a card the caller does not own.
 */
export async function recordRatingsHandler(
  request: Request,
  deps: HandlerDeps,
) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await parseBody(request, practiceRatingsSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const result = await deps.repos.practice.recordRatings(
      auth.user.id,
      parsed.data.ratings,
    );
    return result ? NextResponse.json(result) : apiError("not_found");
  } catch (error) {
    return storageError(error);
  }
}
