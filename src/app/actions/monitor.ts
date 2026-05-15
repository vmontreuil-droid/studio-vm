"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import { newToken, isEmail, confirmMail, sendMail } from "@/lib/monitor";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export type SubscribeState =
  | { ok: true }
  | { ok: false; error: string };

export async function subscribeMonitor(
  formData: FormData,
): Promise<SubscribeState> {
  if (!monitorConfigured)
    return { ok: false, error: "Monitoring is nog niet geconfigureerd." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawUrl = String(formData.get("url") ?? "").trim();
  const locRaw = String(formData.get("locale") ?? "");
  const locale: Locale = isValidLocale(locRaw) ? locRaw : DEFAULT_LOCALE;

  if (!isEmail(email)) return { ok: false, error: "Ongeldig e-mailadres." };
  if (!rawUrl) return { ok: false, error: "Geen website-adres." };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { ok: false, error: "Ongeldig webadres." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return { ok: false, error: "Enkel http(s) wordt ondersteund." };

  const normalized = `${url.protocol}//${url.host}${url.pathname}`.replace(
    /\/$/,
    "",
  );
  const token = newToken();
  const db = getSupabaseAdmin();

  const { data: existing } = await db
    .from("monitors")
    .select("id, active, token")
    .eq("email", email)
    .ilike("url", normalized)
    .maybeSingle();

  if (existing?.active) return { ok: true };

  if (existing) {
    await db
      .from("monitors")
      .update({ token, locale, unsubscribed_at: null })
      .eq("id", existing.id);
  } else {
    const { error } = await db.from("monitors").insert({
      url: normalized,
      email,
      locale,
      token,
      active: false,
    });
    if (error) return { ok: false, error: "Kon niet opslaan, probeer later." };
  }

  await sendMail(email, confirmMail(locale, normalized, token));
  return { ok: true };
}
