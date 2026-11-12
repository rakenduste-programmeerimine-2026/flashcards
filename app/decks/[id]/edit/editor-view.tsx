"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingRows } from "@/components/ui/loading-rows";
import { apiErrorKey } from "@/lib/api/errors";
import {
  addCard,
  deleteCard,
  getDeck,
  renameDeck,
  updateCard,
  type DeckCard,
} from "@/lib/api/decks";
import { useT } from "@/lib/i18n";
import styles from "./editor.module.css";

type Status = "loading" | "ready" | "failed";

/** A card being edited. `id` is null for one that has not been saved yet. */
type DraftCard = {
  key: string;
  id: string | null;
  term: string;
  meaning: string;
};

/**
 * The deck editor. Everything is edited locally and written in one go, so discard
 * really means the stored deck was never touched — the issue asks for exactly that,
 * and it is also the only honest meaning of a discard button.
 */
export function EditorView({ deckId }: { deckId: string }) {
  const t = useT();
  const nameId = useId();

  const [status, setStatus] = useState<Status>("loading");
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /** What the server last told us. The baseline a save is diffed against. */
  const [originalName, setOriginalName] = useState("");
  const [original, setOriginal] = useState<DeckCard[]>([]);

  const [name, setName] = useState("");
  const [draft, setDraft] = useState<DraftCard[]>([]);

  const load = useCallback(async () => {
    setStatus("loading");
    setProblem(null);
    try {
      const detail = await getDeck(deckId);
      setOriginalName(detail.deck.name);
      setOriginal(detail.cards);
      setName(detail.deck.name);
      setDraft(
        detail.cards.map((card) => ({
          key: card.id,
          id: card.id,
          term: card.term,
          meaning: card.meaning,
        })),
      );
      setStatus("ready");
    } catch (error) {
      setProblem(t(apiErrorKey(error)));
      setStatus("failed");
    }
  }, [deckId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty =
    name !== originalName ||
    draft.length !== original.length ||
    draft.some((card, index) => {
      const was = original[index];
      return (
        !was ||
        was.id !== card.id ||
        was.term !== card.term ||
        was.meaning !== card.meaning
      );
    });

  function change(key: string, field: "term" | "meaning", value: string) {
    setSaved(false);
    setDraft((current) =>
      current.map((card) =>
        card.key === key ? { ...card, [field]: value } : card,
      ),
    );
  }

  function add() {
    setSaved(false);
    setDraft((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        id: null,
        term: "",
        meaning: "",
      },
    ]);
  }

  function remove(key: string) {
    setSaved(false);
    setDraft((current) => current.filter((card) => card.key !== key));
  }

  function discard() {
    setName(originalName);
    setDraft(
      original.map((card) => ({
        key: card.id,
        id: card.id,
        term: card.term,
        meaning: card.meaning,
      })),
    );
    setProblem(null);
    setSaved(false);
  }

  async function save() {
    const trimmedName = name.trim();
    const cards = draft.map((card) => ({
      ...card,
      term: card.term.trim(),
      meaning: card.meaning.trim(),
    }));

    if (trimmedName === "") {
      setProblem(t("editor.problem.needName"));
      return;
    }
    // A half-written card would be practised as a blank, so it blocks the save
    // rather than being dropped behind the user's back.
    if (cards.some((card) => (card.term === "") !== (card.meaning === ""))) {
      setProblem(t("editor.problem.halfCard"));
      return;
    }
    const complete = cards.filter(
      (card) => card.term !== "" && card.meaning !== "",
    );
    if (complete.length === 0) {
      setProblem(t("editor.problem.needCard"));
      return;
    }

    setSaving(true);
    setProblem(null);

    try {
      if (trimmedName !== originalName) {
        await renameDeck(deckId, trimmedName);
      }

      const kept = new Set(
        complete
          .map((card) => card.id)
          .filter((id): id is string => id !== null),
      );
      for (const card of original) {
        if (!kept.has(card.id)) await deleteCard(card.id);
      }

      for (const [index, card] of complete.entries()) {
        if (card.id === null) {
          await addCard(deckId, {
            term: card.term,
            meaning: card.meaning,
            position: index,
          });
          continue;
        }
        const was = original.find((other) => other.id === card.id);
        if (was && (was.term !== card.term || was.meaning !== card.meaning)) {
          await updateCard(card.id, { term: card.term, meaning: card.meaning });
        }
      }

      // Re-read rather than guess: new cards come back with their real ids, and
      // the next save then diffs against what the server actually holds.
      await load();
      setSaved(true);
    } catch (error) {
      setProblem(t(apiErrorKey(error)));
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <LoadingRows rows={4} />;

  if (status === "failed") {
    return (
      <ErrorState detail={problem ?? undefined} onRetry={() => void load()} />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="label">{t("editor.title")}</p>
        <div className={styles.field}>
          <label htmlFor={nameId} className="label">
            {t("editor.nameLabel")}
          </label>
          <input
            id={nameId}
            className={styles.name}
            value={name}
            maxLength={120}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
        </div>
        <p className={styles.lede}>{t("editor.lede")}</p>
      </header>

      <ol className={styles.cards}>
        {draft.map((card, index) => (
          <li key={card.key} className={styles.card}>
            <p className={`label tabular ${styles.position}`}>{index + 1}</p>

            <label className={styles.cell}>
              <span className="label">{t("editor.termLabel")}</span>
              <input
                className={styles.term}
                value={card.term}
                maxLength={200}
                onChange={(event) =>
                  change(card.key, "term", event.target.value)
                }
              />
            </label>

            <label className={styles.cell}>
              <span className="label">{t("editor.meaningLabel")}</span>
              <textarea
                className={styles.meaning}
                value={card.meaning}
                rows={2}
                maxLength={600}
                onChange={(event) =>
                  change(card.key, "meaning", event.target.value)
                }
              />
            </label>

            <Button
              className={styles.remove}
              onClick={() => remove(card.key)}
              aria-label={`${t("editor.remove")} ${index + 1}`}
            >
              {t("editor.remove")}
            </Button>
          </li>
        ))}
      </ol>

      <div>
        <Button onClick={add}>{t("editor.add")}</Button>
      </div>

      {problem ? (
        <p className={styles.problem} role="alert">
          {problem}
        </p>
      ) : null}

      <p className={`label ${styles.state}`} role="status" aria-live="polite">
        {saved ? t("editor.saved") : dirty ? t("editor.unsaved") : null}
      </p>

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={() => void save()}
          disabled={saving || !dirty}
        >
          {saving ? t("editor.saving") : t("editor.save")}
        </Button>
        <Button onClick={discard} disabled={saving || !dirty}>
          {t("editor.discard")}
        </Button>
        <ButtonLink href={`/decks/${deckId}/practice`}>
          {t("editor.practise")}
        </ButtonLink>
        <ButtonLink href="/decks">{t("editor.back")}</ButtonLink>
      </div>
    </div>
  );
}
