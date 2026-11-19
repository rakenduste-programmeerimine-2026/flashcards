import type { requireUser } from "@/lib/auth/require-user";
import { apiError } from "@/lib/api/server-errors";
import {
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
};

/** A storage that is not connected is a 503, anything else unexpected is a 500. */
export function storageError(error: unknown) {
  return apiError(
    error instanceof RepositoryUnavailableError
      ? "storage_unavailable"
      : "server_error",
  );
}
