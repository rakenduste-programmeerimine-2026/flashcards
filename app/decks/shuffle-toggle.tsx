"use client";

import { useEffect, useState } from "react";
import {
  readShufflePreference,
  writeShufflePreference,
} from "@/lib/practice/preference";
import { useT } from "@/lib/i18n";
import styles from "./decks.module.css";

/**
 * Whether practice shuffles. It sits on the deck list rather than inside a session,
 * because it is a decision about how you practise, not something to change halfway
 * through a round.
 *
 * The stored value is read after mount: localStorage does not exist on the server,
 * and rendering one state and then correcting it is worse than one frame of the
 * default.
 */
export function ShuffleToggle() {
  const t = useT();
  const [shuffling, setShuffling] = useState(readShufflePreference);

  useEffect(() => {
    setShuffling(readShufflePreference());
  }, []);

  function toggle() {
    const next = !shuffling;
    setShuffling(next);
    writeShufflePreference(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={shuffling}
      onClick={toggle}
      className={styles.shuffle}
    >
      <span className={styles.shuffleTrack} aria-hidden="true">
        <span className={styles.shuffleKnob} />
      </span>
      <span className="label">{t("decks.shuffle")}</span>
    </button>
  );
}
