import { requireUser } from "@/lib/auth/require-user";
import { getWriteRateLimiter } from "@/lib/rate-limit";
import { getRepositories } from "@/lib/repositories";
import type { HandlerDeps } from "./deps";

/** The real dependencies, for the route files. Tests build their own. */
export function defaultDeps(): HandlerDeps {
  return {
    requireUser,
    repos: getRepositories(),
    limiter: getWriteRateLimiter(),
  };
}
