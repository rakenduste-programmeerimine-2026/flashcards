import type { Dictionary } from "./dictionaries";

/**
 * Every dot path that leads to a string in the dictionary, e.g. "nav.steps.paste.name".
 * Using it as the key type means a typo in a component is a typecheck failure, not a
 * string that quietly renders as itself.
 */
export type MessageKey = DotPaths<Dictionary> | PluralKey<DotPaths<Dictionary>>;

/**
 * `card.count_one` and `card.count_other` are two entries in the file but one key
 * in a component: `t("card.count", { count })` picks between them.
 */
type PluralKey<K extends string> = K extends `${infer Base}_one` ? Base : never;

type DotPaths<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : `${K}.${DotPaths<T[K]>}`;
    }[keyof T & string];

export type MessageVars = Record<string, string | number>;

export type Translate = (key: MessageKey, vars?: MessageVars) => string;

/**
 * Looks a key up in one dictionary.
 *
 * Two conventions on top of a plain lookup:
 * - `{name}` in a message is replaced from `vars`.
 * - when `vars.count` is a number, `<key>_one` or `<key>_other` is preferred over
 *   `<key>`, which is how "1 kaart" and "12 kaarti" stay separate strings.
 */
export function translate(
  dictionary: Dictionary,
  key: string,
  vars?: MessageVars,
): string {
  const plural =
    typeof vars?.count === "number"
      ? lookup(dictionary, `${key}_${vars.count === 1 ? "one" : "other"}`)
      : undefined;
  const message = plural ?? lookup(dictionary, key);

  if (message === undefined) {
    // Loud in development, harmless in production: the key itself is still readable.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing message for key "${key}"`);
    }
    return key;
  }

  return vars ? fill(message, vars) : message;
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;

  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === "string" ? node : undefined;
}

function fill(message: string, vars: MessageVars): string {
  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}
