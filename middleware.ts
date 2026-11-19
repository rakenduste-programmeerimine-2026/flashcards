import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isProtectedPage(pathname: string) {
  return pathname === "/decks" || pathname.startsWith("/decks/");
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (user || !isProtectedPage(pathname)) {
    return response;
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/sign-in";
  signInUrl.search = "";
  signInUrl.searchParams.set("next", pathname + search);

  const redirect = NextResponse.redirect(signInUrl);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  // The redirect depends on the session, so it must never be cached.
  redirect.headers.set("Cache-Control", "private, no-store");

  return redirect;
}

export const config = {
  // Everything except build output and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
