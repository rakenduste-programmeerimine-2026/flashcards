import { addCardHandler } from "@/lib/api/handlers/cards";
import { defaultDeps } from "@/lib/api/handlers/default-deps";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  return addCardHandler(request, (await params).id, defaultDeps());
}
