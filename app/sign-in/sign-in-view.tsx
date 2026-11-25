"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/api/auth";
import { apiErrorKey } from "@/lib/api/errors";
import { useT } from "@/lib/i18n";
import styles from "./sign-in.module.css";

/**
 * Email and password only. There is no sign-up here on purpose: accounts are made in
 * Supabase for the user test, so a form that creates them would be a second way in
 * that nobody has checked.
 */
export function SignInView({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim() === "" || password === "") {
      setError(t("auth.missing"));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await signIn({ email: email.trim(), password, next });
      // refresh() first, so the server components on the next page see the new cookie.
      router.refresh();
      router.replace(result.next);
    } catch (caught) {
      setError(t(apiErrorKey(caught)));
      setPassword("");
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1>{t("auth.title")}</h1>
        <p className={styles.lede}>{t("auth.lede")}</p>
      </header>

      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor={emailId} className="label">
            {t("auth.email")}
          </label>
          <input
            id={emailId}
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={passwordId} className="label">
            {t("auth.password")}
          </label>
          <input
            id={passwordId}
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
          />
        </div>

        <div aria-live="polite">
          {error ? (
            <p className={styles.problem} role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? t("auth.signingIn") : t("auth.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
