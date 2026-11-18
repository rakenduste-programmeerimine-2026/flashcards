import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingRows } from "@/components/ui/loading-rows";
import { DecksView } from "./decks-view";

export const metadata: Metadata = {
  title: "Minu pakid",
};

export default function DecksPage() {
  // DecksView reads the saved deck id out of the query string, which needs a
  // Suspense boundary around it.
  return (
    <Suspense fallback={<LoadingRows rows={3} />}>
      <DecksView />
    </Suspense>
  );
}
