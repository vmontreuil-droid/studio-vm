"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured } from "@/lib/supabase/config";

export type NewsletterState = {
  ok: boolean;
  message: string;
};

export async function subscribe(formData: FormData): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const honeypot = String(formData.get("website") ?? "").trim();
  const locale = String(formData.get("locale") ?? "nl").slice(0, 5);
  const source = String(formData.get("source") ?? "footer").slice(0, 60);

  if (honeypot) {
    return { ok: true, message: "Bedankt!" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Dat e-mailadres lijkt niet te kloppen." };
  }

  if (leadsConfigured) {
    try {
      await getSupabaseAdmin()
        .from("newsletter_subscribers")
        .upsert(
          { email, locale, source, active: true, unsubscribed_at: null },
          { onConflict: "email" },
        );
    } catch (err) {
      // Een DB-hapering mag de bezoeker nooit een fout tonen.
      console.error("[newsletter] persist failed:", err);
    }
  } else {
    console.log("[newsletter] subscribe:", email);
  }

  return {
    ok: true,
    message: "Bedankt — ik mail je bij de eerste editie.",
  };
}
