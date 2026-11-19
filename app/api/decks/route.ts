import { createDeckHandler } from "@/lib/api/handlers/create-deck";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

export async function POST(request: Request) {
  return createDeckHandler(request, {
    requireUser,
    repos: getRepositories(),
  });
}
