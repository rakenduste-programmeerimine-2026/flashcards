"use client";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n";

/**
 * Step two before anything has been pasted. The paste area itself, the preview and
 * the save action arrive in issue #14; this is the state the screen starts in.
 */
export function PasteView() {
  const t = useT();

  return (
    <EmptyState
      title={t("empty.paste.title")}
      body={t("empty.paste.body")}
      action={
        <ButtonLink href="/" variant="primary">
          {t("empty.paste.action")}
        </ButtonLink>
      }
    />
  );
}
