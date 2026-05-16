"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { isEmail, sendMail } from "@/lib/monitor";
import { after } from "next/server";
import { scanAndStore } from "@/lib/scan-report";

export type QuoteState = { ok: true } | { ok: false; error: string };

export async function submitQuote(
  formData: FormData,
): Promise<QuoteState> {
  const s = (k: string) => String(formData.get(k) ?? "").trim();

  const name = s("name").slice(0, 120);
  const email = s("email").toLowerCase().slice(0, 160);
  const message = s("message").slice(0, 2000);
  const locale = s("locale") || "nl";
  const base = s("base").slice(0, 40);
  const plan = s("plan").slice(0, 40);
  const modules = s("modules")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 30);
  const estLow = Number(s("estLow")) || null;
  const estHigh = Number(s("estHigh")) || null;
  const monthly = Number(s("monthly")) || 0;

  if (!name) return { ok: false, error: "name" };
  if (!isEmail(email)) return { ok: false, error: "email" };

  const currentSite = s("currentSite");

  if (!leadsConfigured) return { ok: false, error: "not_configured" };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("quotes")
    .insert({
      locale,
      name,
      email,
      message: message || null,
      base,
      modules,
      plan,
      est_low: estLow,
      est_high: estHigh,
      monthly,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "store" };

  // Gaf de bezoeker een huidige site mee → scan ná de response en het
  // resultaat bij déze aanvraag bewaren (geen mail).
  const quoteId = (data as { id?: string } | null)?.id;
  if (quoteId && currentSite) {
    after(() => scanAndStore(currentSite, quoteId));
  }

  const fmt = (n: number | null) =>
    n == null ? "—" : "€ " + n.toLocaleString("nl-BE");
  await sendMail("info@studio-vm.be", {
    subject: `Nieuwe offerte-aanvraag — ${name}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 12px">Nieuwe offerte-aanvraag</h2>
<p><strong>${name}</strong> · <a href="mailto:${email}">${email}</a></p>
<table style="border-collapse:collapse;font-size:14px;margin-top:8px">
<tr><td style="padding:3px 16px 3px 0;color:#666">Pakket</td><td>${base}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Modules</td><td>${modules.length ? modules.join(", ") : "—"}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Onderhoud</td><td>${plan}${monthly ? ` (${fmt(monthly)}/m)` : ""}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Richtprijs</td><td>${fmt(estLow)} – ${fmt(estHigh)}</td></tr>
</table>
${message ? `<p style="margin-top:14px;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>` : ""}
<p style="margin-top:18px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  return { ok: true };
}
