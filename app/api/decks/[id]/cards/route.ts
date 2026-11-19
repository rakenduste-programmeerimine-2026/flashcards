import { addCardHandler } from "@/lib/api/handlers/cards";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  return addCardHandler(request, (await params).id, {
    requireUser,
    repos: getRepositories(),
  });
}
