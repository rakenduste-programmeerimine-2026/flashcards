/**
 * The one place the frontend talks to our own API.
 *
 * Every failure becomes an `ApiError` with a stable code, never a raw message:
 * the UI translates the code, so nothing a server said in English ends up on an
 * Estonian screen.
 */

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(`API error: ${code} (${status})`);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    // No connection, or the request never left the browser.
    throw new ApiError("offline", 0);
  }

  if (!response.ok) {
    throw new ApiError(await errorCode(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("bad_response", response.status);
  }
}

/**
 * Our own endpoints answer `{ "error": "invalid_input" }`. Anything else - an HTML
 * error page from the platform, an empty body - becomes a code by status, so the
 * screen always has something to translate.
 */
async function errorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // fall through to the status-based code
  }

  if (response.status === 401) return "unauthorized";
  if (response.status === 404) return "not_found";
  if (response.status === 429) return "rate_limited";
  return "server_error";
}
