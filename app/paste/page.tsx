import type { Metadata } from "next";
import { PasteView } from "./paste-view";

export const metadata: Metadata = {
  title: "Kleebi vastus",
};

export default function PastePage() {
  return <PasteView />;
}
