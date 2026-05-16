"use server";

import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import type { ScanResult } from "@/app/actions/scan";

export type ScanLeadState =
  | { ok: true; url: string }
  | { ok: false; error: string };

const T: Record<
  string,
  { subject: (h: string) => string; pre: string; cta: string; foot: string }
> = {
  nl: {
    subject: (h) => `Je klantenportaal voor ${h} staat klaar`,
    pre: "Je persoonlijke klantenportaal staat klaar. Daarin vind je je volledige, eerlijke site-analyse — score, valkuilen, stack en het plan — plus je offerte op maat.",
    cta: "Open je klantenportaal",
    foot: "Deze link is persoonlijk en blijft geldig. Vragen? Antwoord gerust op deze mail.",
  },
  fr: {
    subject: (h) => `Votre portail client pour ${h} est prêt`,
    pre: "Votre portail client personnel est prêt. Vous y trouvez votre analyse de site complète et honnête — score, pièges, stack et le plan — ainsi que votre devis sur mesure.",
    cta: "Ouvrir votre portail client",
    foot: "Ce lien est personnel et reste valable. Une question ? Répondez à cet e-mail.",
  },
  en: {
    subject: (h) => `Your client portal for ${h} is ready`,
    pre: "Your personal client portal is ready. Inside you'll find your full, honest site analysis — score, pitfalls, stack and the plan — plus your tailored quote.",
    cta: "Open your client portal",
    foot: "This link is personal and stays valid. Questions? Just reply to this email.",
  },
};

export async function submitScanLead(input: {
  email: string;
  url: string;
  locale: string;
  scan: ScanResult;
}): Promise<ScanLeadState> {
  const email = input.email.trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "email" };
  }
  if (!input.scan || !input.scan.ok) {
    return { ok: false, error: "scan" };
  }
  if (!leadsConfigured) {
    return { ok: false, error: "not_configured" };
  }

  const locale = ["nl", "fr", "en"].includes(input.locale)
    ? input.locale
    : "nl";
  const t = T[locale];
  const token = randomBytes(24).toString("base64url");
  const host = input.scan.host;
  const portalUrl = `${siteUrl}/${locale}/portail/${token}`;

  try {
    const { error } = await getSupabaseAdmin()
      .from("scan_requests")
      .insert({
        token,
        email,
        url: input.scan.finalUrl || input.url,
        locale,
        scan: input.scan,
      });
    if (error) return { ok: false, error: "store" };
  } catch {
    return { ok: false, error: "store" };
  }

  const accent = "#b45309";
  await sendMail(email, {
    subject: t.subject(host),
    html: `<div style="margin:0;padding:0;background:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <p style="margin:0 0 24px;font:600 13px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:${accent}">studio&nbsp;vm<span style="color:${accent}">.</span></p>
  <div style="background:#1c1917;border:1px solid #292524;border-radius:20px;overflow:hidden">
    <div style="background:linear-gradient(135deg,${accent},#7c3a2e);padding:36px 28px;text-align:center">
      <div style="font:800 56px/1 -apple-system,sans-serif;color:#fff">${input.scan.grade}</div>
      <div style="margin-top:8px;font:600 14px/1 ui-monospace,monospace;letter-spacing:.1em;color:rgba(255,255,255,.85)">${input.scan.score}/100 · ${host}</div>
    </div>
    <div style="padding:28px">
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#d6d3d1">${t.pre}</p>
      <a href="${portalUrl}" style="display:block;background:#fafaf9;color:#0c0a09;text-decoration:none;text-align:center;font:600 15px/1 -apple-system,sans-serif;padding:16px;border-radius:9999px">${t.cta} →</a>
      <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#78716c">${t.foot}</p>
    </div>
  </div>
  <p style="margin:24px 0 0;text-align:center;font-size:11px;color:#57534e">© ${new Date().getFullYear()} Studio VM · studio-vm.be</p>
</div>
</div>`,
  });

  return { ok: true, url: portalUrl };
}
