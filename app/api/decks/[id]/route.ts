import { defaultDeps } from "@/lib/api/handlers/default-deps";
import {
  deleteDeckHandler,
  getDeckHandler,
  renameDeckHandler,
} from "@/lib/api/handlers/decks";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  return getDeckHandler((await params).id, defaultDeps());
}

export async function PATCH(request: Request, { params }: Context) {
  return renameDeckHandler(request, (await params).id, defaultDeps());
}

export async function DELETE(_request: Request, { params }: Context) {
  return deleteDeckHandler((await params).id, defaultDeps());
}
