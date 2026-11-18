import type { Metadata } from "next";
import styles from "./specimen.module.css";

export const metadata: Metadata = {
  title: "Design tokens",
  description:
    "Living reference for the colour tokens, type scale and components of the flashcards app.",
};

const SWATCHES = [
  ["--color-bg", "page background"],
  ["--color-surface", "cards, header"],
  ["--color-surface-2", "inset areas"],
  ["--color-line", "borders"],
  ["--color-muted", "secondary text"],
  ["--color-ink", "primary text"],
  ["--color-accent", "actions, progress"],
  ["--color-accent-soft", "active step"],
  ["--color-good", "knew it"],
  ["--color-bad", "did not know"],
];

const SCALE = [
  ["--text-3xl", "Reformatsioon", "the term on a flashcard"],
  ["--text-2xl", "Practise your cards", "page title"],
  ["--text-xl", "Your decks", "section heading"],
  ["--text-lg", "Reformation, 8 cards", "deck name"],
  ["--text-md", "A 16th-century movement that split the church.", "meaning"],
  ["--text-base", "Body text, the default size for everything else.", "body"],
  ["--text-sm", "Secondary text and helper lines.", "secondary"],
];

export default function DesignPage() {
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <p className="label">Design tokens</p>
        <h1>One system, two themes</h1>
        <p className={styles.lede}>
          Every colour, size and radius in the app comes from{" "}
          <code>app/tokens.css</code>. This page is the reference: switch your
          system between light and dark and both columns have to stay readable.
          The reasoning is in <code>docs/DESIGN.md</code>.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Colour</h2>
        <ul className={styles.swatches}>
          {SWATCHES.map(([token, use]) => (
            <li key={token} className={styles.swatch}>
              <span
                className={styles.chip}
                style={{ background: `var(${token})` }}
              />
              <code>{token}</code>
              <span className={styles.use}>{use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Type</h2>
        <ul className={styles.scale}>
          {SCALE.map(([token, sample, use]) => (
            <li key={token} className={styles.scaleRow}>
              <code className={styles.scaleToken}>{token}</code>
              <span
                className={
                  token === "--text-3xl" || token === "--text-2xl"
                    ? styles.display
                    : undefined
                }
                style={{ fontSize: `var(${token})` }}
              >
                {sample}
              </span>
              <span className={styles.use}>{use}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Display face is Bricolage Grotesque, body is Source Sans 3, and the
          mono face is IBM Plex Mono for labels, counters and the prompt block
          the student copies.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Surfaces and actions</h2>
        <div className={styles.demoRow}>
          <div className={styles.card}>
            <p className="label">Card surface</p>
            <p>A deck row, a preview row, a panel.</p>
          </div>
          <div className={styles.flash}>
            <p className="label">Flashcard</p>
            <p className={styles.term}>Indulgents</p>
            <p className={styles.hidden}>
              The meaning stays hidden until asked
            </p>
          </div>
        </div>
        <div className={styles.demoRow}>
          <button type="button" className={styles.primary}>
            Primary action
          </button>
          <button type="button" className={styles.ghost}>
            Secondary action
          </button>
          <button type="button" className={styles.good}>
            I knew it
          </button>
          <button type="button" className={styles.bad}>
            I did not know
          </button>
        </div>
        <p className={styles.note}>
          Tab through the buttons: the focus ring is one style for the whole
          app, set once in <code>globals.css</code>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Progress</h2>
        <div className={styles.meter} aria-hidden="true">
          <i style={{ width: "40%" }} />
        </div>
        <p className={`label tabular ${styles.counts}`}>
          <span>Knew 8</span>
          <span>Missed 4</span>
          <span>Left 12</span>
        </p>
      </section>
    </main>
  );
}
