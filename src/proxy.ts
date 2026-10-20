import { NextResponse, type NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) {
  try { return await refreshSupabaseSession(request); }
  catch {
    return NextResponse.json({ error: "Authentication unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
// Public sample routes never invoke Supabase. Protected pages also verify owners.
export const config = { matcher: ["/admin/:path*", "/auth/:path*"] };
