"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { StepNav } from "./step-nav";
import styles from "./shell.module.css";

/** Two offset cards: the product mark, and the only decorative graphic in the shell. */
function DeckMark() {
  return (
    <svg
      className={styles.mark}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1.25"
        y="5.25"
        width="13.5"
        height="17.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <rect
        x="7.25"
        y="1.25"
        width="15.5"
        height="17.5"
        rx="3"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 7.5h8M11 11.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SiteHeader() {
  const t = useT();

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.wordmark}>
          <DeckMark />
          <span>{t("app.name")}</span>
        </Link>
        <p className={`label ${styles.tagline}`}>{t("app.tagline")}</p>
        {/* The language switch lands in this slot in issue #6. */}
        <div className={styles.slot} data-slot="language" />
      </div>
      <StepNav />
    </header>
  );
}
