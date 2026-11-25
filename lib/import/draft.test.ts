import { describe, expect, it } from "vitest";
import { saveDraft, takeDraft } from "./draft";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    size: () => map.size,
  };
}

describe("paste draft", () => {
  it("gives back what was saved, once", () => {
    const storage = memoryStorage();
    saveDraft(storage, { answer: "1. MÕISTE: a", name: "Ajalugu" });

    expect(takeDraft(storage)).toEqual({
      answer: "1. MÕISTE: a",
      name: "Ajalugu",
    });
    expect(takeDraft(storage)).toBeNull();
    expect(storage.size()).toBe(0);
  });

  it("returns null when nothing was saved", () => {
    expect(takeDraft(memoryStorage())).toBeNull();
  });

  it("ignores something that is not a draft", () => {
    const storage = memoryStorage();
    storage.setItem("flashcards.pasteDraft", '{"answer": 5}');
    expect(takeDraft(storage)).toBeNull();

    storage.setItem("flashcards.pasteDraft", "not json");
    expect(takeDraft(storage)).toBeNull();
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveDraft(blocked, { answer: "x", name: "y" })).not.toThrow();
    expect(takeDraft(blocked)).toBeNull();
  });
});
