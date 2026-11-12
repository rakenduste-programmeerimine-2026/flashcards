import { titleMetadata } from "@/lib/i18n/metadata";
import { EditorView } from "./editor-view";

export function generateMetadata() {
  return titleMetadata("meta.edit");
}

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EditorView deckId={id} />;
}
