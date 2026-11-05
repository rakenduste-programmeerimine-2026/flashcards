import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authError, isAuthUnavailable } from "./errors";

type RequireUserResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * The session check for route handlers:
 *
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.response;
 */
export async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, response: authError("auth_unavailable") };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    return { ok: true, user, supabase };
  }

  return {
    ok: false,
    response: authError(
      isAuthUnavailable(error) ? "auth_unavailable" : "unauthorized",
    ),
  };
}
