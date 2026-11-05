const FALLBACK = "/";
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/** Returns a same-site relative path to go to after sign-in, or "/" for anything else. */
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return FALLBACK;
  }

  // Browsers read "\" as "/" and drop tabs and newlines, so "/\evil.com" leaves the site.
  if (/[\\\u0000-\u001f]/.test(value)) {
    return FALLBACK;
  }

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return FALLBACK;
  }

  const path = url.pathname + url.search + url.hash;

  // "/.//evil.com" only becomes "//evil.com" once it has been normalised.
  if (url.origin !== PLACEHOLDER_ORIGIN || path.startsWith("//")) {
    return FALLBACK;
  }

  return path;
}
