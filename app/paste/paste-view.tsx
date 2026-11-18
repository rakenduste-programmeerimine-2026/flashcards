"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiErrorKey } from "@/lib/api/errors";
import { createDeck } from "@/lib/api/decks";
import { parseAnswer } from "@/lib/import/parse-answer";
import type { ParseResult } from "@/lib/import/types";
import { useLocale, useT } from "@/lib/i18n";
import styles from "./paste.module.css";

/**
 * Step two: a wall of pasted text in, a deck out. Nothing is saved until the cards
 * are on screen and the student has pressed save, because handing over a whole
 * answer and getting an invisible result is the part that feels untrustworthy.
 */
export function PasteView() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const answerId = useId();
  const nameId = useId();

  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cards = result?.cards ?? [];
  const hasCards = cards.length > 0;

  function read() {
    const parsed = parseAnswer(answer);
    setResult(parsed);
    setSaveError(null);

    if (parsed.cards.length > 0 && name.trim() === "") {
      // Named at parse time rather than on first render: the date has to come from
      // the reader's own clock and locale, not from the server's.
      setName(
        t("paste.defaultName", {
          date: new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "long",
          }).format(new Date()),
        }),
      );
    }
  }

  function useSample() {
    setAnswer(t("paste.sample"));
    setResult(null);
    setSaveError(null);
  }

  function restart() {
    setAnswer("");
    setResult(null);
    setName("");
    setSaveError(null);
  }

  async function save() {
    if (name.trim() === "") {
      setSaveError(t("paste.problem.nameRequired"));
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const deck = await createDeck({
        name: name.trim(),
        language: locale,
        cards,
      });
      router.push(`/decks?saved=${encodeURIComponent(deck.id)}`);
    } catch (error) {
      setSaveError(t(apiErrorKey(error)));
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="label">{t("nav.step", { step: 2 })}</p>
        <h1>{t("paste.title")}</h1>
        <p className={styles.lede}>{t("paste.lede")}</p>
      </header>

      <div className={styles.field}>
        <label htmlFor={answerId} className="label">
          {t("paste.label")}
        </label>
        <textarea
          id={answerId}
          className={styles.answer}
          value={answer}
          rows={12}
          spellCheck={false}
          placeholder={t("paste.placeholder")}
          onChange={(event) => {
            setAnswer(event.target.value);
            // The preview belongs to the text that produced it.
            setResult(null);
          }}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={read} disabled={saving}>
          {t("paste.read")}
        </Button>
        <Button onClick={useSample} disabled={saving}>
          {t("paste.sampleAction")}
        </Button>
        {answer !== "" ? (
          <Button onClick={restart} disabled={saving}>
            {t("paste.clear")}
          </Button>
        ) : null}
      </div>

      {/* One region for every outcome of pressing "read the cards". */}
      <div aria-live="polite" className={styles.outcome}>
        {result?.problem === "empty" ? (
          <p className={styles.inlineProblem}>{t("paste.problem.empty")}</p>
        ) : null}

        {result?.problem === "no_cards" ? (
          <div className={styles.problem} role="alert">
            <h2 className={styles.problemTitle}>
              {t("paste.problem.noCardsTitle")}
            </h2>
            <p>{t("paste.problem.noCardsBody")}</p>
            <pre className={styles.expected}>{t("paste.placeholder")}</pre>
          </div>
        ) : null}

        {hasCards ? (
          <section className={styles.preview} aria-labelledby="preview-heading">
            <div className={styles.previewHead}>
              <h2 id="preview-heading" className={styles.found}>
                {t("paste.found", { count: cards.length })}
              </h2>
              {result && result.dropped > 0 ? (
                <p className={`label ${styles.dropped}`}>
                  {t("paste.dropped", { count: result.dropped })}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor={nameId} className="label">
                {t("paste.nameLabel")}
              </label>
              <input
                id={nameId}
                className={styles.name}
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <ol className={styles.cards} aria-label={t("paste.previewLabel")}>
              {cards.map((card, index) => (
                <li key={`${card.term}-${index}`} className={styles.card}>
                  <span className={`label tabular ${styles.position}`}>
                    {index + 1}
                  </span>
                  <p className={styles.term}>{card.term}</p>
                  <p className={styles.meaning}>{card.meaning}</p>
                </li>
              ))}
            </ol>

            {saveError ? (
              <p className={styles.inlineProblem} role="alert">
                {saveError}
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button variant="primary" onClick={save} disabled={saving}>
                {saving ? t("paste.saving") : t("paste.save")}
              </Button>
              <Button onClick={restart} disabled={saving}>
                {t("paste.restart")}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
