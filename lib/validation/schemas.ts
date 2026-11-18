import { z } from "zod";
import { LANGUAGES, LIMITS } from "./limits";

/**
 * The message of every rule is a stable field code (see ValidationCode), so the frontend can
 * translate it. parse.ts relies on that.
 */
export type ValidationCode =
  "required" | "too_long" | "too_many" | "invalid_value";

/** Wrong type is "invalid_value"; a missing value is "required". */
const typeError = (issue: { input?: unknown }): ValidationCode =>
  issue.input === undefined ? "required" : "invalid_value";

/** A trimmed, non-empty string with a maximum length. */
const text = (max: number) =>
  z.string({ error: typeError }).trim().min(1, "required").max(max, "too_long");

const deckName = text(LIMITS.deckNameMax);

/** The fields of one card, shared by import, create and update so they cannot drift. */
const cardFields = {
  term: text(LIMITS.termMax),
  meaning: text(LIMITS.meaningMax),
};

const cardSchema = z.object(cardFields);

export const createDeckSchema = z.object({
  name: deckName,
  language: z.enum(LANGUAGES, { error: typeError }),
  cards: z
    .array(cardSchema, { error: typeError })
    .min(1, "required")
    .max(LIMITS.cardsPerImportMax, "too_many"),
});

export const renameDeckSchema = z.object({ name: deckName });

export const createCardSchema = cardSchema;

export const updateCardSchema = z
  .object({
    term: cardFields.term.optional(),
    meaning: cardFields.meaning.optional(),
  })
  .refine((value) => value.term !== undefined || value.meaning !== undefined, {
    message: "required",
  });

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type RenameDeckInput = z.infer<typeof renameDeckSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
