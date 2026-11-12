"use client";

import { LOCALES, useLocale, useSetLocale, useT } from "@/lib/i18n";
import styles from "./shell.module.css";

/**
 * Two buttons rather than a select: there are exactly two languages and both fit,
 * so the current one can be visible instead of hidden behind a menu.
 */
export function LanguageSwitch() {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div
      className={styles.language}
      role="group"
      aria-label={t("language.label")}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={`label ${styles.languageOption}`}
          aria-pressed={option === locale}
          lang={option}
          onClick={() => setLocale(option)}
        >
          <span aria-hidden="true">{option}</span>
          <span className="sr-only">{t(`language.${option}`)}</span>
        </button>
      ))}
    </div>
  );
}
