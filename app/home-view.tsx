"use client";

import { ButtonLink } from "@/components/ui/button";
import { useT, type MessageKey } from "@/lib/i18n";
import styles from "./home.module.css";

const JOURNEY: MessageKey[] = [
  "nav.steps.prompt.summary",
  "nav.steps.paste.summary",
  "nav.steps.practise.summary",
];

export function HomeView() {
  const t = useT();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="label">{t("nav.step", { step: 1 })}</p>
        <h1>{t("home.title")}</h1>
        <p className={styles.lede}>{t("home.lede")}</p>
      </header>

      <ol className={styles.journey}>
        {JOURNEY.map((summary, index) => (
          <li key={summary} className={styles.journeyStep}>
            <span className={`label tabular ${styles.journeyNumber}`}>
              {index + 1}
            </span>
            <span>{t(summary)}</span>
          </li>
        ))}
      </ol>

      <p className={styles.privacy}>{t("home.privacy")}</p>

      <div>
        <ButtonLink href="/paste" variant="primary">
          {t("home.next")}
        </ButtonLink>
      </div>
    </div>
  );
}
