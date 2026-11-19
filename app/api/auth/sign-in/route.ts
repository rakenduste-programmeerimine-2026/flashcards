import { NextResponse } from "next/server";
import { authError, isAuthUnavailable } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const { email, password, next } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return authError("invalid_input");
  }

  const supabase = await createClient();
  if (!supabase) {
    return authError("auth_unavailable");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (error.status === 429) {
      return authError("rate_limited");
    }
    return authError(
      isAuthUnavailable(error) ? "auth_unavailable" : "invalid_credentials",
    );
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
    next: safeNext(next),
  });
}
