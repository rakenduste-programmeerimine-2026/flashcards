import { createDeckHandler } from "@/lib/api/handlers/create-deck";
import { defaultDeps } from "@/lib/api/handlers/default-deps";
import { listDecksHandler } from "@/lib/api/handlers/decks";

export async function GET() {
  return listDecksHandler(defaultDeps());
}

export async function POST(request: Request) {
  return createDeckHandler(request, defaultDeps());
}
