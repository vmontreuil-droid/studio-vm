"use server";

import { headers } from "next/headers";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

export type AuthState = { ok: boolean; message: string };

export async function sendMagicLink(
  formData: FormData,
): Promise<AuthState> {
  if (!supabaseConfigured) {
    return {
      ok: false,
      message: "Het portaal is nog niet geactiveerd op deze omgeving.",
    };
  }
  const email = String(formData.get("email") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) return { ok: true, message: "" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Dat e-mailadres lijkt niet te kloppen." };
  }

  const h = await headers();
  const origin =
    h.get("origin") ||
    (h.get("host") ? `https://${h.get("host")}` : "https://studio-vm.be");

  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      return { ok: false, message: "Versturen mislukte. Probeer 't opnieuw." };
    }
    return {
      ok: true,
      message: "Check je inbox — de login-link is onderweg.",
    };
  } catch {
    return { ok: false, message: "Er ging iets mis. Probeer 't opnieuw." };
  }
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured) return;
  try {
    const sb = await getSupabaseServer();
    await sb.auth.signOut();
  } catch {}
}
