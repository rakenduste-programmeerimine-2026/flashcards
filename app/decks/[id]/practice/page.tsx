import { titleMetadata } from "@/lib/i18n/metadata";
import { PracticeView } from "./practice-view";

export function generateMetadata() {
  return titleMetadata("meta.practice");
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PracticeView deckId={id} />;
}
