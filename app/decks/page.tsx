import type { Metadata } from "next";
import { DecksView } from "./decks-view";

export const metadata: Metadata = {
  title: "Minu pakid",
};

export default function DecksPage() {
  return <DecksView />;
}
