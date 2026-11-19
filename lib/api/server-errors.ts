import { NextResponse } from "next/server";

const STATUS_BY_CODE = {
  unauthorized: 401,
  not_found: 404,
  too_large: 413,
  rate_limited: 429,
  server_error: 500,
  storage_unavailable: 503,
} as const;

export type ApiErrorCode = keyof typeof STATUS_BY_CODE;

/**
 * Same shape as the auth and validation errors: `{ "error": "<code>" }`. The frontend
 * translates the code, so no message text is sent.
 */
export function apiError(code: ApiErrorCode) {
  return NextResponse.json({ error: code }, { status: STATUS_BY_CODE[code] });
}
