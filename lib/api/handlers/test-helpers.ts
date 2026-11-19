import type { SupabaseClient, User } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/server-errors";
import { MemoryStore, type MemoryOptions } from "@/lib/repositories/memory";
import type { HandlerDeps } from "./deps";

/** Handler dependencies for tests: a fake session and the in-memory repositories. */
export function testDeps(
  userId: string | null = "user-1",
  options?: MemoryOptions,
) {
  const store = new MemoryStore(options);
  const deps: HandlerDeps = {
    requireUser: async () =>
      userId
        ? {
            ok: true,
            user: { id: userId } as User,
            supabase: {} as SupabaseClient,
          }
        : { ok: false, response: apiError("unauthorized") },
    repos: store.repositories(),
  };
  return { deps, store };
}

export function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
