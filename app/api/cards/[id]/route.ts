import { deleteCardHandler, updateCardHandler } from "@/lib/api/handlers/cards";
import { defaultDeps } from "@/lib/api/handlers/default-deps";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return updateCardHandler(request, (await params).id, defaultDeps());
}

export async function DELETE(_request: Request, { params }: Context) {
  return deleteCardHandler((await params).id, defaultDeps());
}
