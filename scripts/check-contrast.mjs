#!/usr/bin/env node
/**
 * WCAG contrast for the token pairs the interface actually puts together, in both
 * themes. Reads app/tokens.css, so it checks what ships rather than a copy of the
 * palette in a document that drifts.
 *
 * Run with `npm run check:contrast`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const tokens = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "app", "tokens.css"),
  "utf8",
);

/** AA: 4.5 for body text, 3 for text at 24px+ or 19px bold, 3 for UI boundaries. */
const PAIRS = [
  ["--color-ink", "--color-bg", 4.5, "body text on the page"],
  ["--color-ink", "--color-surface", 4.5, "text on a card"],
  ["--color-ink", "--color-surface-2", 4.5, "text in an inset area"],
  ["--color-muted", "--color-bg", 4.5, "secondary text on the page"],
  ["--color-muted", "--color-surface", 4.5, "secondary text on a card"],
  ["--color-muted", "--color-surface-2", 4.5, "placeholder in a field"],
  ["--color-accent", "--color-surface", 4.5, "links and the step label"],
  ["--color-accent", "--color-bg", 4.5, "accent text on the page"],
  ["--color-on-accent", "--color-accent", 4.5, "label on a primary button"],
  [
    "--color-accent",
    "--color-accent-soft",
    4.5,
    "text on the soft accent panel",
  ],
  ["--color-good", "--color-surface", 4.5, "the I knew it button"],
  ["--color-bad", "--color-surface", 4.5, "the I did not know button"],
  ["--color-bad", "--color-bg", 4.5, "an error sentence on the page"],
  ["--color-surface", "--color-bad", 4.5, "label on the delete button"],
  ["--color-control", "--color-surface", 3, "a field or control on a card"],
  ["--color-control", "--color-surface-2", 3, "a control on an inset area"],
  ["--color-control", "--color-bg", 3, "a control on the page"],
  ["--color-accent", "--color-bg", 3, "the focus ring"],
];

function palette(block) {
  const source = tokens.slice(tokens.indexOf(block) + block.length);
  const body = source.slice(0, source.indexOf("}"));
  return Object.fromEntries(
    [...body.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const THEMES = [
  ["light", palette(":root {")],
  ["dark", palette(':root[data-theme="dark"] {')],
];

let failures = 0;

for (const [name, colours] of THEMES) {
  console.log(`\n${name}`);
  for (const [front, back, required, use] of PAIRS) {
    const ratio = contrast(colours[front], colours[back]);
    const ok = ratio >= required;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${ratio.toFixed(2)}:1 (needs ${required}) ${use}`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} pair(s) below WCAG AA.`);
  process.exit(1);
}

console.log("\nEvery pair meets WCAG AA.");
