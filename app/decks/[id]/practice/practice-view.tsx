"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRows } from "@/components/ui/loading-rows";
import { apiErrorKey } from "@/lib/api/errors";
import { getDeck, type DeckCard, type DeckSummary } from "@/lib/api/decks";
import { readShufflePreference } from "@/lib/practice/preference";
import { reshuffleRemaining, shuffle } from "@/lib/practice/shuffle";
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
  /** The cards rated "did not know" in this round: the next round, if there is one. */
  const [missedCards, setMissedCards] = useState<DeckCard[]>([]);
  /** 1 is the whole deck; 2 and up are repeat rounds over what was missed. */
  const [round, setRound] = useState(1);
  /** Short confirmation after a reshuffle, cleared again so it does not linger. */
  const [notice, setNotice] = useState<string | null>(null);
  const cardRef = useRef<HTMLElement>(null);

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
      setMissedCards([]);
      setRound(1);
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
  const missed = missedCards.length;
  const knew = ratings.length - missed;

  const rate = useCallback(
    (rating: Rating) => {
      setRatings((current) => [...current, rating]);
      if (rating === "missed" && card) {
        setMissedCards((current) => [...current, card]);
      }
      setIndex((current) => current + 1);
      setRevealed(false);
      setNotice(null);
    },
    [card],
  );

  /** A second pass over the cards that were missed: the useful half of practice. */
  const repeatMissed = useCallback(() => {
    setCards(readShufflePreference() ? shuffle(missedCards) : [...missedCards]);
    setIndex(0);
    setRevealed(false);
    setRatings([]);
    setMissedCards([]);
    setRound((current) => current + 1);
    setNotice(null);
  }, [missedCards]);

  /** Only what is still ahead moves. The card on screen stays, and a card that has
      already been rated cannot come back in this round. */
  const reshuffleRest = useCallback(() => {
    setCards((current) => reshuffleRemaining(current, index + 1));
    setNotice(t("practice.reshuffled"));
    // Focus moves to the card that changed, not left on the button: otherwise the
    // next Space would press the reshuffle button again instead of revealing.
    cardRef.current?.focus();
  }, [index, t]);

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
    setMissedCards([]);
    setRound(1);
    setNotice(null);
  }, [stored]);

  useEffect(() => {
    if (notice === null) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Space reveals, the arrows rate. A full round is doable without a mouse.
  useEffect(() => {
    if (status !== "ready" || !card) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? "";
      const typing =
        target?.isContentEditable === true ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(tag);

      // Space and Enter belong to whatever is focused: on a button they click it,
      // which already does the right thing. The arrows are ours either way, or
      // using the reshuffle button would leave the keyboard dead for the round.
      const pressedByFocus = ["BUTTON", "A"].includes(tag);

      if (typing) return;

      if (
        !revealed &&
        !pressedByFocus &&
        (event.key === " " || event.key === "Enter")
      ) {
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
    const perfect = missed === 0;

    return (
      <div className={styles.done}>
        <p className="label">{deck?.name}</p>
        <h1>
          {perfect ? t("practice.done.perfectTitle") : t("practice.done.title")}
        </h1>

        {/* knew + missed is always the size of the round, so the two numbers on
            this screen cannot contradict each other. */}
        <p className={styles.score}>
          {t("practice.done.score", { knew, total })}
        </p>

        {perfect ? (
          <p className={styles.score}>{t("practice.done.perfectBody")}</p>
        ) : (
          <p className={`label ${styles.needWork}`}>
            {t("practice.done.needWork", { count: missed })}
          </p>
        )}

        <div className={styles.actions}>
          {/* A perfect round gets no repeat button rather than an empty one. */}
          {perfect ? null : (
            <Button variant="primary" onClick={repeatMissed}>
              {t("practice.done.repeat", { count: missed })}
            </Button>
          )}
          <Button variant={perfect ? "primary" : "quiet"} onClick={restart}>
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
          {round > 1 ? (
            <span className={styles.repeatRound}>
              {t("practice.repeatRound")}{" "}
            </span>
          ) : null}
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

      <article className={styles.card} ref={cardRef} tabIndex={-1}>
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

      <div className={styles.aside}>
        <p className="label">
          {revealed ? t("practice.keys.rate") : t("practice.keys.reveal")}
        </p>
        {total - index > 2 ? (
          <Button className={styles.reshuffle} onClick={reshuffleRest}>
            {t("practice.reshuffle")}
          </Button>
        ) : null}
      </div>

      {/* The confirmation the issue asks for, announced as well as shown. */}
      <p className={`label ${styles.notice}`} role="status" aria-live="polite">
        {notice}
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
