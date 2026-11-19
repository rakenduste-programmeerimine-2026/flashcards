import type { requireUser } from "@/lib/auth/require-user";
import { apiError } from "@/lib/api/server-errors";
import type { RateLimiter } from "@/lib/rate-limit";
import {
  LimitReachedError,
  RepositoryUnavailableError,
  type Repositories,
} from "@/lib/repositories/types";

/**
 * What a handler needs from outside. Route files pass the real ones; tests pass a
 * fake session and an in-memory repository, so no Supabase is involved.
 */
export type HandlerDeps = {
  requireUser: typeof requireUser;
  repos: Repositories;
  limiter: RateLimiter;
};

/**
 * The start of every write handler: a session, then the per-user rate limit. A request
 * without a session is a 401 and does not use up anyone's allowance. Everything else
 * that reaches a write counts, valid or not, so a broken client cannot hammer the
 * route either.
 */
export async function requireWriter(deps: HandlerDeps) {
  const auth = await deps.requireUser();
  if (!auth.ok) {
    return auth;
  }

  const verdict = deps.limiter.check(auth.user.id);
  if (!verdict.allowed) {
    return {
      ok: false as const,
      response: apiError("rate_limited", {
        "Retry-After": String(verdict.retryAfterSeconds),
      }),
    };
  }
  return auth;
}

/**
 * A limit hit is a 409 with its own code, a storage that is not connected is a 503,
 * anything else unexpected is a 500.
 */
export function storageError(error: unknown) {
  if (error instanceof LimitReachedError) {
    return apiError(
      error.limit === "decks" ? "deck_limit_reached" : "card_limit_reached",
    );
  }
  return apiError(
    error instanceof RepositoryUnavailableError
      ? "storage_unavailable"
      : "server_error",
  );
}
