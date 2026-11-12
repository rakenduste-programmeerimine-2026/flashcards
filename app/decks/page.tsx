import { Suspense } from "react";
import { LoadingRows } from "@/components/ui/loading-rows";
import { titleMetadata } from "@/lib/i18n/metadata";
import { DecksView } from "./decks-view";

export function generateMetadata() {
  return titleMetadata("meta.decks");
}

export default function DecksPage() {
  // DecksView reads the saved deck id out of the query string, which needs a
  // Suspense boundary around it.
  return (
    <Suspense fallback={<LoadingRows rows={3} />}>
      <DecksView />
    </Suspense>
  );
}
