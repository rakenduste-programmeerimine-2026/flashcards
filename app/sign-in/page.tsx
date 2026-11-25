import { safeNext } from "@/lib/auth/safe-next";
import { titleMetadata } from "@/lib/i18n/metadata";
import { SignInView } from "./sign-in-view";

export function generateMetadata() {
  return titleMetadata("meta.signIn");
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // Checked here as well as in the API, so the page never even links somewhere odd.
  const target = safeNext(Array.isArray(next) ? next[0] : next);

  return <SignInView next={target === "/" ? "/decks" : target} />;
}
