import type { Metadata } from "next";
import { EditorView } from "./editor-view";

export const metadata: Metadata = {
  title: "Paki muutmine",
};

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditorView deckId={id} />;
}
