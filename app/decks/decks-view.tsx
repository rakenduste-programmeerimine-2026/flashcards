"use client";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n";

/**
 * Step three with no decks. The list against the real API arrives in issue #19.
 */
export function DecksView() {
  const t = useT();

  return (
    <EmptyState
      title={t("empty.decks.title")}
      body={t("empty.decks.body")}
      action={
        <ButtonLink href="/paste" variant="primary">
          {t("empty.decks.action")}
        </ButtonLink>
      }
    />
  );
}
