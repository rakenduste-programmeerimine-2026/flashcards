import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./button.module.css";

/**
 * primary — the one action that moves the journey forward on a screen.
 * quiet   — everything else.
 * good/bad — the two practice ratings only. They are semantic, never decorative.
 * danger  — destructive, used by delete confirmations.
 */
export type ButtonVariant = "primary" | "quiet" | "good" | "bad" | "danger";

export function buttonClassName(
  variant: ButtonVariant = "quiet",
  extra?: string,
): string {
  return [styles.button, styles[variant], extra].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "quiet",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      {...rest}
    />
  );
}

export function ButtonLink({
  href,
  variant = "quiet",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}
