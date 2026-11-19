import { createDeckHandler } from "@/lib/api/handlers/create-deck";
import { listDecksHandler } from "@/lib/api/handlers/decks";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

const deps = () => ({ requireUser, repos: getRepositories() });

export async function GET() {
  return listDecksHandler(deps());
}

export async function POST(request: Request) {
  return createDeckHandler(request, deps());
}
