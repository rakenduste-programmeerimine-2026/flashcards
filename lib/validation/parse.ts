import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiError } from "@/lib/api/server-errors";
import { LIMITS } from "./limits";
import type { ValidationCode } from "./schemas";

const CODES: readonly string[] = [
  "required",
  "too_long",
  "too_many",
  "invalid_value",
] satisfies ValidationCode[];

export type ValidationFields = Record<string, ValidationCode>;

/** Path of the failing field, for example "cards.3.term". A rule on the whole body is "body". */
function fieldKey(path: PropertyKey[]) {
  return path.length ? path.map(String).join(".") : "body";
}

/** Turns a Zod error into field codes. Zod's own text never reaches the client. */
export function toFields(error: z.ZodError): ValidationFields {
  const fields: ValidationFields = {};
  for (const issue of error.issues) {
    const key = fieldKey(issue.path);
    if (key in fields) {
      continue;
    }
    fields[key] = (
      CODES.includes(issue.message) ? issue.message : "invalid_value"
    ) as ValidationCode;
  }
  return fields;
}

export function invalidInput(
  fields: ValidationFields = { body: "invalid_value" },
) {
  return NextResponse.json({ error: "invalid_input", fields }, { status: 400 });
}

type ParseResult<T> =
  { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * The body as text, or null as soon as it goes over `maxBytes`. The declared
 * Content-Length is checked first, but it can be missing or wrong, so the bytes
 * actually received are counted too and reading stops at the limit.
 */
async function readLimitedText(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return null;
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Validates a JSON body. Use it like requireUser(): `if (!parsed.ok) return parsed.response;`.
 * A body over `maxBytes` (default `LIMITS.bodyMaxBytes`) is `413 too_large` and is not parsed.
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
  options: { maxBytes?: number } = {},
): Promise<ParseResult<z.infer<T>>> {
  const text = await readLimitedText(
    request,
    options.maxBytes ?? LIMITS.bodyMaxBytes,
  );
  if (text === null) {
    return { ok: false, response: apiError("too_large") };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: invalidInput(toFields(result.error)) };
  }
  return { ok: true, data: result.data };
}
