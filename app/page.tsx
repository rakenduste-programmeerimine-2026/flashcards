import type { Metadata } from "next";
import { PromptView } from "./prompt-view";

export const metadata: Metadata = {
  title: "Juhend",
};

export default function PromptPage() {
  return <PromptView />;
}
