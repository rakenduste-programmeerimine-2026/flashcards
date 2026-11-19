import type { SupabaseClient, User } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/server-errors";
import { createMemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { MemoryStore, type MemoryOptions } from "@/lib/repositories/memory";
import { RATE_LIMITS } from "@/lib/validation/limits";
import type { HandlerDeps } from "./deps";

/** Handler dependencies for tests: a fake session and the in-memory repositories. */
export function testDeps(
  userId: string | null = "user-1",
  options?: MemoryOptions,
  limiter: RateLimiter = createMemoryRateLimiter({
    limit: RATE_LIMITS.writesPerWindow,
    windowMs: RATE_LIMITS.windowMs,
  }),
) {
  const store = new MemoryStore(options);
  const deps: HandlerDeps = {
    limiter,
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
