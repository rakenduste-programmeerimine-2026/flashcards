import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

/** A fixed sequence, so a test about order is not a test about luck. */
function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

const CARDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("shuffle", () => {
  it("keeps every card exactly once", () => {
    const result = shuffle(
      CARDS,
      sequence([0.7, 0.1, 0.9, 0.35, 0.5, 0.05, 0.8]),
    );

    expect([...result].sort()).toEqual([...CARDS].sort());
    expect(result).toHaveLength(CARDS.length);
  });

  it("leaves the deck it was given alone", () => {
    const original = [...CARDS];
    shuffle(original);

    expect(original).toEqual(CARDS);
  });

  it("returns a different order than the one it was given", () => {
    const result = shuffle(
      CARDS,
      sequence([0.9, 0.2, 0.75, 0.4, 0.6, 0.15, 0.85]),
    );

    expect(result).not.toEqual(CARDS);
  });

  it("produces more than one order across repeated runs", () => {
    const orders = new Set(
      Array.from({ length: 50 }, () => shuffle(CARDS).join("")),
    );

    // With 8 cards, 50 runs landing on one order would mean the shuffle is broken.
    expect(orders.size).toBeGreaterThan(1);
  });

  it("handles an empty deck and a one-card deck", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["only"])).toEqual(["only"]);
  });

  it("can reorder part of a deck without touching the rest", () => {
    // How the mid-session reshuffle in #24 uses it: only the cards not yet seen.
    const seen = CARDS.slice(0, 3);
    const rest = shuffle(CARDS.slice(3));

    expect([...seen, ...rest].sort()).toEqual([...CARDS].sort());
    expect([...seen, ...rest].slice(0, 3)).toEqual(seen);
  });
});
