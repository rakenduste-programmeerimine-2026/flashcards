import { deleteCardHandler, updateCardHandler } from "@/lib/api/handlers/cards";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

type Context = { params: Promise<{ id: string }> };

const deps = () => ({ requireUser, repos: getRepositories() });

export async function PATCH(request: Request, { params }: Context) {
  return updateCardHandler(request, (await params).id, deps());
}

export async function DELETE(_request: Request, { params }: Context) {
  return deleteCardHandler((await params).id, deps());
}
