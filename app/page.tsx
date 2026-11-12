import { PromptView } from "./prompt-view";

/* No generateMetadata here on purpose: `title.template` from the root layout does
   not apply to the page in the same segment, so a title set here would be missing
   the "· Flashcards" suffix every other page has. The front page of the product is
   called Flashcards in both languages anyway. */

export default function PromptPage() {
  return <PromptView />;
}
