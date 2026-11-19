import { createSupabaseRepositories } from "./supabase";
import type { Repositories } from "./types";

export type * from "./types";
export { LimitReachedError, RepositoryUnavailableError } from "./types";

/** The repositories route handlers use. Tests pass their own to the handlers instead. */
export function getRepositories(): Repositories {
  return createSupabaseRepositories();
}
