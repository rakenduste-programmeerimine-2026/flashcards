import type { Metadata } from "next";
import { PracticeView } from "./practice-view";

export const metadata: Metadata = {
  title: "Harjutamine",
};

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PracticeView deckId={id} />;
}
