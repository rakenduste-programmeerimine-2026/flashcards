import {
  deleteDeckHandler,
  getDeckHandler,
  renameDeckHandler,
} from "@/lib/api/handlers/decks";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

type Context = { params: Promise<{ id: string }> };

const deps = () => ({ requireUser, repos: getRepositories() });

export async function GET(_request: Request, { params }: Context) {
  return getDeckHandler((await params).id, deps());
}

export async function PATCH(request: Request, { params }: Context) {
  return renameDeckHandler(request, (await params).id, deps());
}

export async function DELETE(_request: Request, { params }: Context) {
  return deleteDeckHandler((await params).id, deps());
}
