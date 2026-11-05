import { NextResponse } from "next/server";
import { authError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return authError("auth_unavailable");
  }

  // "local" ends this browser's session only, not the user's other devices.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    return authError("auth_unavailable");
  }

  return new NextResponse(null, { status: 204 });
}
