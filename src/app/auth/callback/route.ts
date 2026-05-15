import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (supabaseConfigured && code) {
    try {
      const sb = await getSupabaseServer();
      await sb.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(new URL("/nl/portail", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/nl/portail/dashboard", url.origin));
}
