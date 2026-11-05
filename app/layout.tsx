import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashcards",
  description:
    "Turn an AI answer into a practice deck: copy the prompt, paste the answer, practise the cards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="et">
      <body>{children}</body>
    </html>
  );
}
