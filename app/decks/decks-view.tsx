"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRows } from "@/components/ui/loading-rows";
import { apiErrorKey } from "@/lib/api/errors";
import { deleteDeck, listDecks, type DeckSummary } from "@/lib/api/decks";
import { useLocale, useT } from "@/lib/i18n";
import styles from "./decks.module.css";

type Status = "loading" | "ready" | "failed";

/**
 * Step three. Everything a saved deck can do starts here: practise it, fix it, or
 * throw it away.
 */
export function DecksView() {
  const t = useT();
  const locale = useLocale();
  /** Set by the paste screen after a save, so the new deck can be pointed out. */
  const justSavedId = useSearchParams().get("saved");

  const [status, setStatus] = useState<Status>("loading");
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setProblem(null);
    try {
      const { decks: loaded } = await listDecks();
      setDecks(loaded);
      setStatus("ready");
    } catch (error) {
      setProblem(t(apiErrorKey(error)));
      setStatus("failed");
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    setDeleting(id);
    setProblem(null);
    try {
      await deleteDeck(id);
      setDecks((current) => current.filter((deck) => deck.id !== id));
      setConfirming(null);
    } catch (error) {
      setProblem(t(apiErrorKey(error)));
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
    }).format(date);
  }

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <DecksHeader />
        <LoadingRows rows={3} />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.page}>
        <DecksHeader />
        <ErrorState detail={problem ?? undefined} onRetry={() => void load()} />
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className={styles.page}>
        <DecksHeader />
        <EmptyState
          title={t("empty.decks.title")}
          body={t("empty.decks.body")}
          action={
            <ButtonLink href="/paste" variant="primary">
              {t("empty.decks.action")}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <DecksHeader />

      {problem ? (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      ) : null}

      <ul className={styles.list}>
        {decks.map((deck) => {
          const isConfirming = confirming === deck.id;
          const question = t("decks.confirm.question", { name: deck.name });

          return (
            <li
              key={deck.id}
              className={styles.deck}
              data-saved={deck.id === justSavedId ? "" : undefined}
            >
              <div className={styles.about}>
                <h2 className={styles.name}>
                  <Link
                    href={`/decks/${deck.id}/practice`}
                    className={styles.nameLink}
                  >
                    {deck.name}
                  </Link>
                </h2>
                <p className={`label tabular ${styles.meta}`}>
                  <span>{t("card.count", { count: deck.cardCount })}</span>
                  {deck.id === justSavedId ? (
                    <span className={styles.saved}>{t("decks.justSaved")}</span>
                  ) : deck.updatedAt ? (
                    <span>
                      {t("decks.updated", { date: formatDate(deck.updatedAt) })}
                    </span>
                  ) : null}
                </p>
              </div>

              {isConfirming ? (
                /* The confirmation lives in the row: a browser dialog can be
                   blocked, and it would not say which deck is about to go. */
                <div
                  className={styles.confirm}
                  role="alertdialog"
                  aria-label={question}
                >
                  <div>
                    <p className={styles.confirmQuestion}>{question}</p>
                    <p className={styles.confirmBody}>
                      {t("decks.confirm.body")}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <Button
                      variant="danger"
                      onClick={() => void remove(deck.id)}
                      disabled={deleting === deck.id}
                    >
                      {deleting === deck.id
                        ? t("decks.confirm.deleting")
                        : t("decks.confirm.yes")}
                    </Button>
                    {/* Focus lands on "keep it", not on the destructive action. */}
                    <Button
                      onClick={() => setConfirming(null)}
                      disabled={deleting === deck.id}
                      autoFocus
                    >
                      {t("decks.confirm.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <ButtonLink
                    href={`/decks/${deck.id}/practice`}
                    variant="primary"
                  >
                    {t("decks.practise")}
                  </ButtonLink>
                  <ButtonLink href={`/decks/${deck.id}/edit`}>
                    {t("decks.edit")}
                  </ButtonLink>
                  <Button onClick={() => setConfirming(deck.id)}>
                    {t("decks.delete")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DecksHeader() {
  const t = useT();

  return (
    <header className={styles.head}>
      <p className="label">{t("nav.step", { step: 3 })}</p>
      <h1>{t("decks.title")}</h1>
      <p className={styles.lede}>{t("decks.lede")}</p>
    </header>
  );
}
