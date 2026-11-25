"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  currentUser,
  signInHref,
  signOut,
  type SessionUser,
} from "@/lib/api/auth";
import { useT } from "@/lib/i18n";
import styles from "./shell.module.css";

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; user: SessionUser };

/**
 * Sign in or sign out, in the header on every page. The session is read again on
 * every navigation, because signing in happens on another page.
 */
export function AccountControl() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    currentUser()
      .then((user) => {
        if (!cancelled) {
          setState(user ? { kind: "signed-in", user } : { kind: "signed-out" });
        }
      })
      // Supabase not answering is not the same as signed out, but the header is the
      // wrong place to say so. Offer sign-in; the page itself reports the error.
      .catch(() => {
        if (!cancelled) setState({ kind: "signed-out" });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function leave() {
    setPending(true);
    try {
      await signOut();
      setState({ kind: "signed-out" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (state.kind === "loading" || pathname === "/sign-in") {
    return null;
  }

  if (state.kind === "signed-out") {
    return (
      <Link href={signInHref(pathname)} className={styles.account}>
        {t("auth.signIn")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={styles.account}
      onClick={leave}
      disabled={pending}
      title={state.user.email ?? undefined}
    >
      {t("auth.signOut")}
    </button>
  );
}
