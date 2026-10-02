import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  supabaseUrl,
  supabaseAnonKey,
  supabaseConfigured,
} from "@/lib/supabase/config";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  const nextParam = url.searchParams.get("next") || "/nl/portail/dashboard";
  const next = nextParam.startsWith("/")
    ? nextParam
    : "/nl/portail/dashboard";

  const fail = NextResponse.redirect(
    new URL("/nl/portail?fout=link", url.origin),
  );
  if (!supabaseConfigured) return fail;

  // Sessie-cookies moeten op de redirect-response zelf gezet worden.
  const success = NextResponse.redirect(new URL(next, url.origin));
  const sb = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) =>
        toSet.forEach(({ name, value, options }) =>
          success.cookies.set(name, value, options),
        ),
    },
  });

  try {
    if (tokenHash) {
      const { error } = await sb.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (error) return fail;
    } else if (code) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) return fail;
    } else {
      return fail;
    }
  } catch {
    return fail;
  }
  return success;
}
