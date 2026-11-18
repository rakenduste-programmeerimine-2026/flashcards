import { defaultDeps } from "@/lib/api/handlers/default-deps";
import { recordRatingsHandler } from "@/lib/api/handlers/practice";

export async function POST(request: Request) {
  return recordRatingsHandler(request, defaultDeps());
}
