import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Source_Sans_3,
  IBM_Plex_Mono,
} from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

/* Display: a grotesque with enough character to carry a flashcard term on its own. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-bricolage",
});

/* Body: humanist sans, holds up at 15px for a definition read quickly. */
const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-sans",
});

/* Mono: labels, counters and the prompt block the student copies. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Flashcards",
    template: "%s · Flashcards",
  },
  description:
    "Turn an AI answer into a practice deck: copy the prompt, paste the answer, practise the cards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="et"
      className={`${bricolage.variable} ${sourceSans.variable} ${plexMono.variable}`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
