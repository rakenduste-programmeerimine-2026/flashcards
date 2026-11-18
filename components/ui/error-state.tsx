"use client";

import { Button } from "./button";
import { useT } from "@/lib/i18n";
import styles from "./state.module.css";

/**
 * Error placeholder every page can reuse. `detail` is for a message that is already
 * translated — never a raw error code, never a stack.
 */
export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  const t = useT();

  return (
    <div className={styles.error} role="alert">
      <h2 className={styles.title}>{title ?? t("status.error.title")}</h2>
      <p className={styles.body}>{detail ?? t("status.error.body")}</p>
      {onRetry ? (
        <Button variant="quiet" onClick={onRetry}>
          {t("status.error.retry")}
        </Button>
      ) : null}
    </div>
  );
}
