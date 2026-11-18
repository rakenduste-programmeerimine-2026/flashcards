"use client";

import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { SiteHeader } from "./site-header";
import styles from "./shell.module.css";

/**
 * Header, the one content column and the skip link, around every page.
 * `children` stays a server component: it is only passed through.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();

  return (
    <div className={styles.frame}>
      <a href="#content" className={styles.skip}>
        {t("nav.skip")}
      </a>
      <SiteHeader />
      <main id="content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
