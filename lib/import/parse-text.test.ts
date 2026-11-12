import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTextAnswer } from "./parse-text";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__");

function answer(name: string): string {
  return readFileSync(join(fixtures, `${name}.txt`), "utf8");
}

/**
 * Seven answers in the shapes real models return: an intro sentence and numbering,
 * plain lines, meanings wrapped over two lines, dashes with the diacritics dropped,
 * labels on their own line, half-written cards, and one answer that is not in the
 * format at all.
 */
describe("parseTextAnswer, on whole answers", () => {
  it("reads a numbered answer with bold labels and ignores the chat around it", () => {
    const result = parseTextAnswer(answer("01-chatgpt-numbered-et"));

    expect(result.cards).toHaveLength(5);
    expect(result.problem).toBeNull();
    expect(result.cards[0]).toEqual({
      term: "Reformatsioon",
      meaning: "16. sajandi usuliikumine, mis lõhestas läänekiriku.",
    });
    // The closing "Loodan, et need aitavad" must not end up glued to the last meaning.
    expect(result.cards[4].meaning).toBe(
      "1555. aastal sõlmitud kokkulepe, mis lubas vürstil valida oma maa usu.",
    );
  });

  it("reads a plain English answer", () => {
    const result = parseTextAnswer(answer("02-claude-plain-en"));

    expect(result.cards).toHaveLength(4);
    expect(result.cards.map((card) => card.term)).toEqual([
      "Photosynthesis",
      "Chlorophyll",
      "Stoma",
      "Calvin cycle",
    ]);
  });

  it("joins a meaning that wraps onto the next line", () => {
    const result = parseTextAnswer(answer("03-wrapped-meanings-et"));

    expect(result.cards).toHaveLength(3);
    expect(result.cards[0].meaning).toBe(
      "Põhja-Euroopa kaubalinnade ühendus, mis kontrollis 13.-15. sajandil Läänemere kaubateid ja kaitses oma liikmete kaubanduslikke eesõigusi.",
    );
    expect(result.cards[1].meaning).not.toContain("\n");
  });

  it("accepts dashes, bullets and Estonian labels without diacritics", () => {
    const result = parseTextAnswer(answer("04-dashes-no-diacritics-en"));

    expect(result.cards).toHaveLength(3);
    expect(result.cards[2]).toEqual({
      term: "Equilibrium price",
      meaning:
        "The price at which the quantity supplied equals the quantity demanded.",
    });
  });

  it("accepts a label whose value is on the next line", () => {
    const result = parseTextAnswer(answer("05-label-on-its-own-line-et"));

    expect(result.cards).toEqual([
      {
        term: "Fotosüntees",
        meaning:
          "Protsess, mille käigus taim seob valguse abil süsihappegaasi ja vee suhkruks.",
      },
      {
        term: "Kloroplast",
        meaning: "Rakuorganell, milles fotosüntees toimub.",
      },
    ]);
  });

  it("drops half-written cards instead of saving them blank", () => {
    const result = parseTextAnswer(answer("06-incomplete-pairs-et"));

    expect(result.cards.map((card) => card.term)).toEqual([
      "Barokk",
      "Klassitsism",
    ]);
    // A term with no meaning, and a meaning with no term.
    expect(result.dropped).toBe(2);
  });

  it("answers an unrecognised format with zero cards and a problem, not a throw", () => {
    const result = parseTextAnswer(answer("07-wrong-format-et"));

    expect(result.cards).toEqual([]);
    expect(result.problem).toBe("no_cards");
  });
});

describe("parseTextAnswer, on single awkward inputs", () => {
  it("reports an empty paste separately from an unreadable one", () => {
    expect(parseTextAnswer("   \n\n ").problem).toBe("empty");
  });

  it("does not treat an ordinary sentence with a colon as a label", () => {
    const result = parseTextAnswer(
      "Martin Luther: saksa munk\nMÕISTE: Reformatsioon\nTÄHENDUS: Usuliikumine.",
    );

    expect(result.cards).toEqual([
      { term: "Reformatsioon", meaning: "Usuliikumine." },
    ]);
  });

  it("keeps dates and numbers exactly as they were written", () => {
    const result = parseTextAnswer(
      "TERM: Battle of Hastings\nMEANING: Fought on 14 October 1066, it killed about 2,000 men.",
    );

    expect(result.cards[0].meaning).toBe(
      "Fought on 14 October 1066, it killed about 2,000 men.",
    );
  });

  it("survives Windows line endings and non-breaking spaces", () => {
    const result = parseTextAnswer(
      "MÕISTE: Hansa\r\nTÄHENDUS: Kaubalinnade ühendus.\r\n",
    );

    expect(result.cards).toEqual([
      { term: "Hansa", meaning: "Kaubalinnade ühendus." },
    ]);
  });

  it("starts a new card when a second term arrives before the meaning", () => {
    const result = parseTextAnswer(
      "TERM: A\nTERM: B\nMEANING: Second one only.",
    );

    expect(result.cards).toEqual([{ term: "B", meaning: "Second one only." }]);
    expect(result.dropped).toBe(1);
  });

  it("strips a matched pair of quotes but keeps a bracket that belongs to the text", () => {
    const result = parseTextAnswer(
      'TERM: "Indulgents"\nMEANING: (1517) Kirikult ostetud patukustutuskiri.',
    );

    expect(result.cards[0]).toEqual({
      term: "Indulgents",
      meaning: "(1517) Kirikult ostetud patukustutuskiri.",
    });
  });
});
