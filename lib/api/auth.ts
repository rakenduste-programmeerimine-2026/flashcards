import { request } from "./client";

/**
 * The auth endpoints from #44. Components never call fetch for these directly,
 * for the same reason as the deck endpoints in `decks.ts`.
 */

export type SessionUser = { id: string; email: string | null };

export async function signIn(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<{ user: SessionUser; next: string }> {
  return request("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function signOut(): Promise<void> {
  await request<void>("/api/auth/sign-out", { method: "POST" });
}

/** The signed-in user, or null when there is no session. Other failures still throw. */
export async function currentUser(): Promise<SessionUser | null> {
  try {
    const { user } = await request<{ user: SessionUser }>("/api/auth/me");
    return user;
  } catch (error) {
    if ((error as { status?: number }).status === 401) {
      return null;
    }
    throw error;
  }
}

/** Where the sign-in page should send the reader back to afterwards. */
export function signInHref(next: string): string {
  return `/sign-in?next=${encodeURIComponent(next)}`;
}
