import { recordRatingsHandler } from "@/lib/api/handlers/practice";
import { requireUser } from "@/lib/auth/require-user";
import { getRepositories } from "@/lib/repositories";

export async function POST(request: Request) {
  return recordRatingsHandler(request, {
    requireUser,
    repos: getRepositories(),
  });
}
