import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { LIMITS } from "./limits";
import { toFields } from "./parse";
import {
  createCardSchema,
  createDeckSchema,
  renameDeckSchema,
  updateCardSchema,
} from "./schemas";

const card = { term: "Hastings", meaning: "Battle of 1066" };
const deck = { name: "History", language: "en", cards: [card] };
const text = (length: number) => "a".repeat(length);

function fieldsOf(schema: ZodType, value: unknown) {
  const result = schema.safeParse(value);
  if (result.success) {
    throw new Error("Expected the value to be rejected");
  }
  return toFields(result.error);
}

describe("trimming and empty strings", () => {
  it("trims whitespace around every text field", () => {
    const parsed = createDeckSchema.parse({
      name: "  History  ",
      language: "en",
      cards: [{ term: "  Hastings ", meaning: " 1066\n" }],
    });
    expect(parsed.name).toBe("History");
    expect(parsed.cards[0]).toEqual({ term: "Hastings", meaning: "1066" });
  });

  it("rejects an empty string", () => {
    expect(fieldsOf(renameDeckSchema, { name: "" })).toEqual({
      name: "required",
    });
  });

  it("rejects a string of only whitespace", () => {
    expect(fieldsOf(renameDeckSchema, { name: " \t\n " })).toEqual({
      name: "required",
    });
  });
});

describe("limits", () => {
  it("accepts a deck name at the limit and rejects one more", () => {
    expect(
      renameDeckSchema.safeParse({ name: text(LIMITS.deckNameMax) }).success,
    ).toBe(true);
    expect(
      fieldsOf(renameDeckSchema, { name: text(LIMITS.deckNameMax + 1) }),
    ).toEqual({ name: "too_long" });
  });

  it("accepts a term at the limit and rejects one more", () => {
    const ok = { ...card, term: text(LIMITS.termMax) };
    expect(createCardSchema.safeParse(ok).success).toBe(true);
    expect(
      fieldsOf(createCardSchema, { ...card, term: text(LIMITS.termMax + 1) }),
    ).toEqual({ term: "too_long" });
  });

  it("accepts a meaning at the limit and rejects one more", () => {
    const ok = { ...card, meaning: text(LIMITS.meaningMax) };
    expect(createCardSchema.safeParse(ok).success).toBe(true);
    expect(
      fieldsOf(createCardSchema, {
        ...card,
        meaning: text(LIMITS.meaningMax + 1),
      }),
    ).toEqual({ meaning: "too_long" });
  });

  it("accepts the maximum number of cards and rejects one more", () => {
    const cards = (n: number) => Array.from({ length: n }, () => card);
    expect(
      createDeckSchema.safeParse({
        ...deck,
        cards: cards(LIMITS.cardsPerImportMax),
      }).success,
    ).toBe(true);
    expect(
      fieldsOf(createDeckSchema, {
        ...deck,
        cards: cards(LIMITS.cardsPerImportMax + 1),
      }),
    ).toEqual({ cards: "too_many" });
  });

  it("rejects a deck with no cards", () => {
    expect(fieldsOf(createDeckSchema, { ...deck, cards: [] })).toEqual({
      cards: "required",
    });
  });
});

describe("cards missing a field", () => {
  it("rejects a card without a term", () => {
    expect(fieldsOf(createCardSchema, { meaning: "x" })).toEqual({
      term: "required",
    });
  });

  it("rejects a card without a meaning", () => {
    expect(fieldsOf(createCardSchema, { term: "x" })).toEqual({
      meaning: "required",
    });
  });

  it("reports the path of the failing card in an import", () => {
    const cards = [card, card, card, { meaning: "x" }];
    expect(fieldsOf(createDeckSchema, { ...deck, cards })).toEqual({
      "cards.3.term": "required",
    });
  });

  it("reports several fields at once", () => {
    const cards = [{ term: " ", meaning: text(LIMITS.meaningMax + 1) }];
    expect(
      fieldsOf(createDeckSchema, { name: "", language: "en", cards }),
    ).toEqual({
      name: "required",
      "cards.0.term": "required",
      "cards.0.meaning": "too_long",
    });
  });
});

describe("language", () => {
  it("accepts et and en", () => {
    for (const language of ["et", "en"]) {
      expect(createDeckSchema.safeParse({ ...deck, language }).success).toBe(
        true,
      );
    }
  });

  it("rejects an unknown language", () => {
    expect(fieldsOf(createDeckSchema, { ...deck, language: "de" })).toEqual({
      language: "invalid_value",
    });
  });

  it("rejects a missing language", () => {
    expect(fieldsOf(createDeckSchema, { name: "x", cards: [card] })).toEqual({
      language: "required",
    });
  });
});

describe("card update", () => {
  it("accepts a single field", () => {
    expect(updateCardSchema.safeParse({ term: "New" }).success).toBe(true);
    expect(updateCardSchema.safeParse({ meaning: "New" }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(fieldsOf(updateCardSchema, {})).toEqual({ body: "required" });
  });

  it("applies the same rules as create to the fields it has", () => {
    expect(fieldsOf(updateCardSchema, { term: "  " })).toEqual({
      term: "required",
    });
    expect(
      fieldsOf(updateCardSchema, { meaning: text(LIMITS.meaningMax + 1) }),
    ).toEqual({ meaning: "too_long" });
  });
});

describe("wrong shapes", () => {
  it("rejects a body that is not an object", () => {
    expect(fieldsOf(createDeckSchema, null)).toEqual({ body: "invalid_value" });
  });

  it("rejects text fields that are not strings", () => {
    expect(fieldsOf(renameDeckSchema, { name: 5 })).toEqual({
      name: "invalid_value",
    });
  });
});
