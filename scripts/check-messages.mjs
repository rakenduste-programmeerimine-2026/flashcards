#!/usr/bin/env node
/**
 * Fails when the two dictionaries drift apart.
 *
 * Typing catches a key that `et.json` has and `en.json` does not, because `en` is
 * typed against `et`. It cannot catch the other direction, an empty string, or a
 * `{placeholder}` that only one language fills in. This does.
 *
 * Run with `npm run check:messages`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const messagesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "messages",
);
const LOCALES = ["et", "en"];

function flatten(value, prefix = "") {
  if (typeof value === "string") return { [prefix]: value };
  return Object.entries(value).reduce((all, [key, child]) => {
    return { ...all, ...flatten(child, prefix ? `${prefix}.${key}` : key) };
  }, {});
}

function placeholders(message) {
  return [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

const dictionaries = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    flatten(
      JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), "utf8")),
    ),
  ]),
);

const problems = [];

for (const locale of LOCALES) {
  const others = LOCALES.filter((other) => other !== locale);
  for (const [key, message] of Object.entries(dictionaries[locale])) {
    if (message.trim() === "") {
      problems.push(`${locale}.json: "${key}" is empty`);
    }
    for (const other of others) {
      if (!(key in dictionaries[other])) {
        problems.push(
          `${other}.json: missing "${key}", which ${locale}.json has`,
        );
        continue;
      }
      const mine = placeholders(message).join(",");
      const theirs = placeholders(dictionaries[other][key]).join(",");
      // Report once, from the alphabetically first locale, instead of twice.
      if (mine !== theirs && locale < other) {
        problems.push(
          `"${key}": ${locale}.json uses {${mine}} but ${other}.json uses {${theirs}}`,
        );
      }
    }
  }
}

const counted = Object.entries(dictionaries)
  .map(([locale, dictionary]) => `${locale} ${Object.keys(dictionary).length}`)
  .join(", ");

if (problems.length > 0) {
  console.error(`Message files do not match (${counted}):`);
  for (const problem of [...new Set(problems)].sort()) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

console.log(`Message files match: ${counted} keys.`);
