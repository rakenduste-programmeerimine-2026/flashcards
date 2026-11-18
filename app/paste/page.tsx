import { titleMetadata } from "@/lib/i18n/metadata";
import { PasteView } from "./paste-view";

export function generateMetadata() {
  return titleMetadata("meta.paste");
}

export default function PastePage() {
  return <PasteView />;
}
