import type { ReactNode } from "react";
import styles from "./state.module.css";

/**
 * The shape of an empty screen in this app: a card that is not there yet, drawn
 * with its term legible and its meaning hidden, next to the one thing to do next.
 */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.ghost} aria-hidden="true">
        <span className={styles.ghostTerm} />
        <span className={styles.ghostMeaning} />
      </div>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        {action ? <div className={styles.actions}>{action}</div> : null}
      </div>
    </div>
  );
}
