import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const STATUS_BY_CODE = {
  invalid_input: 400,
  invalid_credentials: 401,
  unauthorized: 401,
  rate_limited: 429,
  auth_unavailable: 503,
} as const;

export type AuthErrorCode = keyof typeof STATUS_BY_CODE;

/** The frontend translates these codes, so Supabase's own messages never reach the client. */
export function authError(code: AuthErrorCode) {
  return NextResponse.json({ error: code }, { status: STATUS_BY_CODE[code] });
}

/** True when Supabase could not answer, as opposed to answering "no". */
export function isAuthUnavailable(error: unknown) {
  if (isAuthRetryableFetchError(error)) {
    return true;
  }

  const status = (error as { status?: number } | null)?.status;
  return status !== undefined && status >= 500;
}
