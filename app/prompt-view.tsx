"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink, Button } from "@/components/ui/button";
import { useT, type MessageKey } from "@/lib/i18n";
import styles from "./prompt.module.css";

const NOTES: MessageKey[] = [
  "prompt.notes.material",
  "prompt.notes.messy",
  "prompt.notes.privacy",
];

type CopyState = "idle" | "copied" | "failed";

/**
 * Step one. The prompt is the product, so it gets the room: a readable mono block
 * that scrolls on its own, one copy action, and a card showing the shape the answer
 * comes back in.
 */
export function PromptView() {
  const t = useT();
  const promptRef = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<CopyState>("idle");

  // "Copied" is a confirmation, not a permanent label.
  useEffect(() => {
    if (state !== "copied") return;
    const timer = window.setTimeout(() => setState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    const text = t("prompt.text");
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard refused — an insecure origin, or the user said no. Select the
      // text instead so Ctrl+C still works, and say so.
      selectPrompt();
      setState("failed");
    }
  }

  function selectPrompt() {
    const node = promptRef.current;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="label">{t("nav.step", { step: 1 })}</p>
        <h1>{t("prompt.title")}</h1>
        <p className={styles.lede}>{t("prompt.lede")}</p>
      </header>

      <section className={styles.block} aria-labelledby="prompt-label">
        <div className={styles.blockHead}>
          <h2 id="prompt-label" className="label">
            {t("prompt.blockLabel")}
          </h2>
          <Button
            variant="primary"
            onClick={copy}
            data-state={state}
            className={styles.copy}
          >
            {state === "copied" ? t("prompt.copied") : t("prompt.copy")}
          </Button>
        </div>
        <pre ref={promptRef} className={styles.prompt} tabIndex={0}>
          {t("prompt.text")}
        </pre>
        {/* One region for both outcomes, so a screen reader hears the result once. */}
        <p
          className={styles.feedback}
          role="status"
          data-state={state}
          aria-live="polite"
        >
          {state === "failed" ? t("prompt.copyFailed") : null}
          {state === "copied" ? t("prompt.copied") : null}
        </p>
      </section>

      <section className={styles.example}>
        <h2 className="label">{t("prompt.example.label")}</h2>
        <div className={styles.exampleCard}>
          <p className={styles.exampleTerm}>{t("prompt.example.term")}</p>
          <p className={styles.exampleMeaning}>{t("prompt.example.meaning")}</p>
        </div>
      </section>

      <ul className={styles.notes}>
        {NOTES.map((note) => (
          <li key={note}>{t(note)}</li>
        ))}
      </ul>

      <div>
        <ButtonLink href="/paste" variant="primary">
          {t("prompt.next")}
        </ButtonLink>
      </div>
    </div>
  );
}
