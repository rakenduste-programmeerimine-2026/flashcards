"use client";

import { useT } from "@/lib/i18n";
import styles from "./state.module.css";

/**
 * Loading placeholder shaped like the rows that are coming, so the page does not
 * jump when they arrive. The row count is the one thing a caller tunes.
 */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  const t = useT();

  return (
    <div className={styles.loading} aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("status.loading")}</span>
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className={styles.skeleton} aria-hidden="true" />
      ))}
    </div>
  );
}
