"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRows } from "@/components/ui/loading-rows";
import { apiErrorKey } from "@/lib/api/errors";
import { getDeck, type DeckCard, type DeckSummary } from "@/lib/api/decks";
import { readShufflePreference } from "@/lib/practice/preference";
import { shuffle } from "@/lib/practice/shuffle";
import { useT } from "@/lib/i18n";
import styles from "./practice.module.css";

type Status = "loading" | "ready" | "failed";

/** What the student said about a card in this round. */
type Rating = "knew" | "missed";

/**
 * One card at a time: the term, then the meaning once it is asked for, then a
 * rating. The session lives in this component only — leaving the page and coming
 * back starts a clean round, which is what the issue asks for and also the honest
 * behaviour, since nothing about a half-finished round is saved anywhere.
 */
export function PracticeView({ deckId }: { deckId: string }) {
  const t = useT();

  const [status, setStatus] = useState<Status>("loading");
  const [problem, setProblem] = useState<string | null>(null);
  const [deck, setDeck] = useState<DeckSummary | null>(null);
  /** The deck in its stored order. Never reordered, only read from. */
  const [stored, setStored] = useState<DeckCard[]>([]);
  /** The order of this round. */
  const [cards, setCards] = useState<DeckCard[]>([]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    setProblem(null);
    try {
      const detail = await getDeck(deckId);
      setDeck(detail.deck);
      setStored(detail.cards);
      // Read here rather than in an effect: by now we are on the client, and the
      // first card the student sees is already the right one.
      setCards(readShufflePreference() ? shuffle(detail.cards) : detail.cards);
      setIndex(0);
      setRevealed(false);
      setRatings([]);
      setStatus("ready");
    } catch (error) {
      setProblem(t(apiErrorKey(error)));
      setStatus("failed");
    }
  }, [deckId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = cards.length;
  const card = cards[index];
  const finished = status === "ready" && total > 0 && index >= total;
  const knew = ratings.filter((rating) => rating === "knew").length;
  const missed = ratings.length - knew;

  const rate = useCallback((rating: Rating) => {
    setRatings((current) => [...current, rating]);
    setIndex((current) => current + 1);
    setRevealed(false);
  }, []);

  const restart = useCallback(() => {
    // A second run through the same deck is shuffled again, or the toggle would
    // only mean "shuffled once".
    setCards((current) =>
      readShufflePreference()
        ? shuffle(stored)
        : stored.length
          ? stored
          : current,
    );
    setIndex(0);
    setRevealed(false);
    setRatings([]);
  }, [stored]);

  // Space reveals, the arrows rate. A full round is doable without a mouse.
  useEffect(() => {
    if (status !== "ready" || !card) return;

    function onKeyDown(event: KeyboardEvent) {
      // Never steal a key from a field or a focused button.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
            target.tagName,
          ))
      ) {
        return;
      }

      if (!revealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }

      if (revealed && event.key === "ArrowRight") {
        event.preventDefault();
        rate("knew");
      }

      if (revealed && event.key === "ArrowLeft") {
        event.preventDefault();
        rate("missed");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, card, revealed, rate]);

  if (status === "loading") {
    return <LoadingRows rows={2} />;
  }

  if (status === "failed") {
    return (
      <ErrorState detail={problem ?? undefined} onRetry={() => void load()} />
    );
  }

  if (total === 0) {
    return (
      <EmptyState
        title={t("practice.empty.title")}
        body={t("practice.empty.body")}
        action={
          <ButtonLink href={`/decks/${deckId}/edit`} variant="primary">
            {t("practice.empty.action")}
          </ButtonLink>
        }
      />
    );
  }

  if (finished) {
    return (
      <div className={styles.done}>
        <p className="label">{deck?.name}</p>
        <h1>{t("practice.done.title")}</h1>
        <p className={styles.score}>
          {t("practice.done.score", { knew, total })}
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={restart}>
            {t("practice.done.again")}
          </Button>
          <ButtonLink href="/decks">{t("practice.done.back")}</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={`label ${styles.deckName}`}>{deck?.name}</p>
        <p className="label tabular">
          {t("practice.position", { current: index + 1, total })}
        </p>
      </header>

      {/* Answered, not current: the bar and the position then say the same thing. */}
      <div
        className={styles.meter}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={ratings.length}
      >
        <i style={{ width: `${(ratings.length / total) * 100}%` }} />
      </div>

      <article className={styles.card}>
        <p className={`label ${styles.cardLabel}`}>{t("card.term")}</p>
        <h1 className={styles.term}>{card.term}</h1>

        <div className={styles.meaningArea}>
          {revealed ? (
            <>
              <p className={`label ${styles.cardLabel}`}>{t("card.meaning")}</p>
              <p className={styles.meaning}>{card.meaning}</p>
            </>
          ) : (
            /* The meaning is not in the document at all until it is asked for.
               Blurring it would leave it selectable, and a student who can read it
               through the blur is not practising. */
            <p className={styles.hidden} aria-hidden="true">
              <span className={styles.hiddenLine} />
              <span className={styles.hiddenLine} />
            </p>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {revealed ? t("practice.revealed") : t("practice.hidden")}
        </p>
      </article>

      <div className={styles.actions}>
        {revealed ? (
          <>
            <Button variant="bad" onClick={() => rate("missed")}>
              {t("practice.missed")}
            </Button>
            <Button variant="good" onClick={() => rate("knew")}>
              {t("practice.knew")}
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => setRevealed(true)}>
            {t("practice.reveal")}
          </Button>
        )}
      </div>

      <p className={`label ${styles.keys}`}>
        {revealed ? t("practice.keys.rate") : t("practice.keys.reveal")}
      </p>

      <p className={`label tabular ${styles.counts}`}>
        <span className={styles.knew}>
          {t("practice.counts.knew", { count: knew })}
        </span>
        <span className={styles.missed}>
          {t("practice.counts.missed", { count: missed })}
        </span>
        <span>
          {t("practice.counts.left", { count: total - ratings.length })}
        </span>
      </p>

      <div>
        <ButtonLink href="/decks">{t("practice.leave")}</ButtonLink>
      </div>
    </div>
  );
}
