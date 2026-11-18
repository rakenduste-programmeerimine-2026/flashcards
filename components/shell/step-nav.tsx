"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT, type MessageKey } from "@/lib/i18n";
import styles from "./shell.module.css";

type Step = {
  href: string;
  /** Matches this step when the path starts with one of these. */
  owns: string[];
  name: MessageKey;
  summary: MessageKey;
};

/** The journey is prompt → paste → practise, and the order never changes. */
const STEPS: Step[] = [
  {
    href: "/",
    owns: ["/"],
    name: "nav.steps.prompt.name",
    summary: "nav.steps.prompt.summary",
  },
  {
    href: "/paste",
    owns: ["/paste"],
    name: "nav.steps.paste.name",
    summary: "nav.steps.paste.summary",
  },
  {
    href: "/decks",
    owns: ["/decks"],
    name: "nav.steps.practise.name",
    summary: "nav.steps.practise.summary",
  },
];

function stepIndexFor(pathname: string): number {
  // Last match wins, so /decks/123/practice counts as step three.
  let index = 0;
  STEPS.forEach((step, i) => {
    const owned = step.owns.some((prefix) =>
      prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
    );
    if (owned) index = i;
  });
  return index;
}

export function StepNav() {
  const t = useT();
  const pathname = usePathname();
  const active = stepIndexFor(pathname);

  return (
    <nav aria-label={t("nav.aria")} className={styles.nav}>
      <ol
        className={styles.steps}
        /* The rail fills up to the step you are on: the same progress device as
           the practice meter, so the shell reads as part of the same product. */
        style={{ "--progress": active / (STEPS.length - 1) } as CSSProperties}
      >
        {STEPS.map((step, index) => {
          const isCurrent = index === active;
          return (
            <li key={step.href} className={styles.step}>
              <Link
                href={step.href}
                className={styles.stepLink}
                aria-current={isCurrent ? "step" : undefined}
                data-state={
                  index < active ? "done" : isCurrent ? "current" : "ahead"
                }
                title={t(step.summary)}
              >
                <span className={styles.dot} aria-hidden="true">
                  <span className="tabular">{index + 1}</span>
                </span>
                <span className={styles.stepText}>
                  <span className={`label ${styles.stepNumber}`}>
                    {t("nav.step", { step: index + 1 })}
                    {isCurrent ? (
                      <span className="sr-only">, {t("nav.current")}</span>
                    ) : null}
                  </span>
                  <span className={styles.stepName}>{t(step.name)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
