import { NextResponse } from "next/server";
import type { z } from "zod";
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

/** Validates a JSON body. Use it like requireUser(): `if (!parsed.ok) return parsed.response;`. */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseResult<z.infer<T>>> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);

  if (!result.success) {
    return { ok: false, response: invalidInput(toFields(result.error)) };
  }
  return { ok: true, data: result.data };
}
