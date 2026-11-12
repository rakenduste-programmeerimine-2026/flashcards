import type { MessageKey } from "@/lib/i18n";
import { ApiError } from "./client";

/**
 * Error codes the API can send, mapped to the sentence a user reads. A code we have
 * not seen falls back to the general message rather than appearing raw on screen.
 */
const MESSAGES: Record<string, MessageKey> = {
  offline: "apiError.offline",
  unauthorized: "apiError.unauthorized",
  not_found: "apiError.notFound",
  invalid_input: "apiError.invalidInput",
  too_large: "apiError.tooLarge",
  rate_limited: "apiError.rateLimited",
  server_error: "apiError.server",
  bad_response: "apiError.server",
  auth_unavailable: "apiError.server",
};

export function apiErrorKey(error: unknown): MessageKey {
  if (error instanceof ApiError && error.code in MESSAGES) {
    return MESSAGES[error.code];
  }
  return "apiError.unknown";
}
