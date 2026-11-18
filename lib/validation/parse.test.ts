import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseBody } from "./parse";

const schema = z.object({ text: z.string() });

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers,
    body,
  });
}

describe("parseBody size limit", () => {
  it("accepts a body exactly at the limit", async () => {
    const body = JSON.stringify({ text: "x".repeat(100) });

    const result = await parseBody(post(body), schema, {
      maxBytes: new TextEncoder().encode(body).byteLength,
    });

    expect(result.ok).toBe(true);
  });

  it("answers 413 too_large when Content-Length says it is over the limit", async () => {
    const result = await parseBody(
      post("{}", { "content-length": "999999" }),
      schema,
      { maxBytes: 1000 },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
      expect(await result.response.json()).toEqual({ error: "too_large" });
    }
  });

  it("counts the bytes actually received when there is no Content-Length", async () => {
    const body = JSON.stringify({ text: "x".repeat(5000) });

    const result = await parseBody(post(body), schema, { maxBytes: 1000 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });

  it("counts bytes, not characters", async () => {
    // "õ" is two bytes in UTF-8: 600 characters, 1200 bytes.
    const body = JSON.stringify({ text: "õ".repeat(600) });

    const result = await parseBody(post(body), schema, { maxBytes: 1000 });

    expect(result.ok).toBe(false);
  });

  it("uses a default limit for routes that do not set one", async () => {
    const body = JSON.stringify({ text: "x".repeat(70 * 1024) });

    const result = await parseBody(post(body), schema);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });

  it("still answers 400 for a body that is not JSON", async () => {
    const result = await parseBody(post("not json"), schema);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});
