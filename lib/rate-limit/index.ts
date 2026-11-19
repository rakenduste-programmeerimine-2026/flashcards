import { RATE_LIMITS } from "@/lib/validation/limits";

/**
 * Per-user rate limiting for write routes, behind an interface so the in-memory
 * version below can be replaced by a shared store without touching the handlers.
 */

export type RateLimitVerdict =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export interface RateLimiter {
  /** Counts one request for the key (the user id) and says whether it may go ahead. */
  check(key: string): RateLimitVerdict;
}

type Options = {
  limit: number;
  windowMs: number;
  /** For tests: the clock, in milliseconds. */
  now?: () => number;
};

/**
 * A sliding window kept in memory: at most `limit` requests per key in any
 * `windowMs`. A rejected request is not counted, so waiting out `retryAfterSeconds`
 * always works.
 *
 * Limits of this version: the counts live in one server instance. On a serverless host
 * every instance has its own, so the effective limit can be higher than `limit` and the
 * counts reset when an instance is recycled. That is enough to stop a runaway client;
 * a strict limit needs a shared store.
 */
export function createMemoryRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: Options): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key) {
      const time = now();
      const recent = (hits.get(key) ?? []).filter(
        (hit) => hit > time - windowMs,
      );

      if (recent.length >= limit) {
        hits.set(key, recent);
        const retryAfterMs = recent[0] + windowMs - time;
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      recent.push(time);
      hits.set(key, recent);

      // Forget keys that have gone quiet, so the map does not grow forever.
      if (hits.size > 10_000) {
        for (const [k, list] of hits) {
          if (list[list.length - 1] <= time - windowMs) hits.delete(k);
        }
      }
      return { allowed: true };
    },
  };
}

const globalForLimiter = globalThis as { __writeRateLimiter?: RateLimiter };

/** The limiter shared by all write routes. One instance per server process. */
export function getWriteRateLimiter(): RateLimiter {
  globalForLimiter.__writeRateLimiter ??= createMemoryRateLimiter({
    limit: RATE_LIMITS.writesPerWindow,
    windowMs: RATE_LIMITS.windowMs,
  });
  return globalForLimiter.__writeRateLimiter;
}
