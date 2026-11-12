import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAnswer } from "./parse-answer";
import { parseJsonAnswer } from "./parse-json";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

function answer(name: string): string {
  return readFileSync(join(fixtures, `${name}.txt`), "utf8");
}

describe("parseJsonAnswer", () => {
  it("reads the Estonian key spellings our prompt asks for", () => {
    const result = parseJsonAnswer(answer("08-json-array-et"));

    expect(result?.cards).toHaveLength(3);
    expect(result?.cards[0]).toEqual({
      term: "Reformatsioon",
      meaning: "16. sajandi usuliikumine, mis lõhestas läänekiriku.",
    });
  });

  it("reads JSON out of a fenced code block with chat around it", () => {
    const result = parseJsonAnswer(answer("09-json-fenced-en"));

    expect(result?.cards.map((card) => card.term)).toEqual([
      "Supply",
      "Demand",
      "Equilibrium price",
    ]);
  });

  it("gives up on broken JSON instead of throwing", () => {
    expect(parseJsonAnswer(answer("10-json-broken-et"))).toBeNull();
  });

  it("accepts an array wrapped in an object", () => {
    const result = parseJsonAnswer(
      '{ "cards": [{ "term": "Stoma", "meaning": "A pore on a leaf." }] }',
    );

    expect(result?.cards).toEqual([
      { term: "Stoma", meaning: "A pore on a leaf." },
    ]);
  });

  it("accepts a term used as the key", () => {
    const result = parseJsonAnswer(
      '[{ "Reformatsioon": "16. sajandi usuliikumine." }]',
    );

    expect(result?.cards).toEqual([
      { term: "Reformatsioon", meaning: "16. sajandi usuliikumine." },
    ]);
  });

  it("does not read { term: x } as a card called term", () => {
    const result = parseJsonAnswer('[{ "term": "Barokk" }]');

    expect(result?.cards).toEqual([]);
    expect(result?.dropped).toBe(1);
  });

  it("ignores extra fields a model adds", () => {
    const result = parseJsonAnswer(
      '[{ "term": "Hansa", "meaning": "Kaubalinnade ühendus.", "difficulty": 3, "tags": ["ajalugu"] }]',
    );

    expect(result?.cards).toEqual([
      { term: "Hansa", meaning: "Kaubalinnade ühendus." },
    ]);
  });

  it("is not fooled by plain text that happens to contain a bracket", () => {
    expect(
      parseJsonAnswer("MÕISTE: Indulgents (1517)\nTÄHENDUS: Patukustutuskiri."),
    ).toBeNull();
  });
});

describe("parseAnswer, choosing between the two", () => {
  it("prefers JSON when the answer is JSON", () => {
    expect(parseAnswer(answer("08-json-array-et")).cards).toHaveLength(3);
  });

  it("gives broken JSON the same readable error as unreadable text", () => {
    // The fallback runs, but a cut-off JSON answer has no TERM / MEANING lines in
    // it either - its labels are JSON keys. So it ends where the issue says it
    // should: zero cards and the one problem code the paste screen translates.
    const result = parseAnswer(answer("10-json-broken-et"));

    expect(result.cards).toEqual([]);
    expect(result.problem).toBe("no_cards");
  });

  it("falls back to the text parser when the answer is lines, not JSON", () => {
    const result = parseAnswer(
      "Siin on kaardid:\n\nMÕISTE: Barokk\nTÄHENDUS: 17. sajandi kunstistiil.",
    );

    expect(result.cards).toEqual([
      { term: "Barokk", meaning: "17. sajandi kunstistiil." },
    ]);
  });

  it("still reads a plain text answer", () => {
    expect(parseAnswer(answer("01-chatgpt-numbered-et")).cards).toHaveLength(5);
  });

  it("gives an unreadable answer the same problem code either way", () => {
    expect(parseAnswer(answer("07-wrong-format-et")).problem).toBe("no_cards");
    expect(parseAnswer("{ not json at all ]").problem).toBe("no_cards");
  });

  it("reports an empty paste as empty", () => {
    expect(parseAnswer("  \n ").problem).toBe("empty");
  });
});
