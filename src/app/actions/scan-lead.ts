"use server";

import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import type { ScanResult } from "@/app/actions/scan";

export type ScanLeadState =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type ResendState = { ok: true } | { ok: false; error: string };

type Copy = {
  subject: (h: string) => string;
  preheader: string;
  eyebrow: string;
  headline: (h: string) => string;
  intro: string;
  scoreLabel: string;
  verdict: (score: number) => string;
  insideTitle: string;
  items: [string, string, string, string];
  cta: string;
  reassure: string;
  foot: string;
};

const T: Record<string, Copy> = {
  nl: {
    subject: (h) => `Je site-analyse van ${h} staat klaar`,
    preheader:
      "Je volledige, eerlijke rapport + herbouwplan staan in je persoonlijke portaal.",
    eyebrow: "Site-analyse",
    headline: (h) => `Het rapport van ${h} is klaar`,
    intro:
      "Ik heb je site volledig doorgelicht — eerlijk, zonder verkooppraat. Hieronder je score; het volledige rapport en je offerte op maat staan klaar in je persoonlijke portaal.",
    scoreLabel: "Jouw site-score",
    verdict: (s) =>
      s >= 75
        ? "Sterke basis"
        : s >= 45
          ? "Degelijk — met groeimarge"
          : "Werk aan de winkel",
    insideTitle: "Wat je in je portaal vindt",
    items: [
      "Je score per categorie — snelheid, SEO, mobiel, veiligheid",
      "Elke valkuil met waarom het telt én hoe ik het oplos",
      "Je technologie, security headers, domein & e-mail",
      "Een herbouwplan met vaste richtprijs en doorlooptijd",
    ],
    cta: "Open je klantenportaal",
    reassure:
      "Geen account nodig. Deze link is persoonlijk en blijft geldig.",
    foot: "Vragen? Antwoord gerust rechtstreeks op deze mail — je krijgt mij, geen bot.",
  },
  fr: {
    subject: (h) => `Votre analyse de ${h} est prête`,
    preheader:
      "Votre rapport complet et honnête + plan de reconstruction dans votre portail personnel.",
    eyebrow: "Analyse de site",
    headline: (h) => `Le rapport de ${h} est prêt`,
    intro:
      "J'ai passé votre site au crible — honnêtement, sans argumentaire. Voici votre score ; le rapport complet et votre devis sur mesure vous attendent dans votre portail personnel.",
    scoreLabel: "Votre score",
    verdict: (s) =>
      s >= 75
        ? "Base solide"
        : s >= 45
          ? "Correct — perfectible"
          : "Du travail à faire",
    insideTitle: "Ce que vous trouvez dans votre portail",
    items: [
      "Votre score par catégorie — vitesse, SEO, mobile, sécurité",
      "Chaque piège avec pourquoi il compte et comment je le corrige",
      "Votre technologie, en-têtes de sécurité, domaine & e-mail",
      "Un plan de reconstruction avec prix indicatif fixe et délai",
    ],
    cta: "Ouvrir votre portail client",
    reassure:
      "Aucun compte requis. Ce lien est personnel et reste valable.",
    foot: "Une question ? Répondez directement à cet e-mail — vous m'aurez, pas un bot.",
  },
  en: {
    subject: (h) => `Your analysis of ${h} is ready`,
    preheader:
      "Your full, honest report + rebuild plan are in your personal portal.",
    eyebrow: "Site analysis",
    headline: (h) => `The report for ${h} is ready`,
    intro:
      "I've gone through your site in full — honestly, no sales pitch. Here's your score; the full report and your tailored quote are waiting in your personal portal.",
    scoreLabel: "Your site score",
    verdict: (s) =>
      s >= 75
        ? "Strong base"
        : s >= 45
          ? "Decent — room to grow"
          : "Needs work",
    insideTitle: "What's inside your portal",
    items: [
      "Your score per category — speed, SEO, mobile, security",
      "Every pitfall with why it matters and how I fix it",
      "Your technology, security headers, domain & email",
      "A rebuild plan with a fixed indicative price and timeline",
    ],
    cta: "Open your client portal",
    reassure: "No account needed. This link is personal and stays valid.",
    foot: "Questions? Just reply straight to this email — you get me, not a bot.",
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

  await sendPortalMail(email, locale, host, input.scan.grade, input.scan.score, portalUrl);

  return { ok: true, url: portalUrl };
}

async function sendPortalMail(
  email: string,
  locale: string,
  host: string,
  grade: string,
  score: number,
  portalUrl: string,
): Promise<void> {
  const t = T[locale] ?? T.nl;
  const accent = "#e08214";
  const safeHost = host.replace(/[<>&]/g, "");
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const items = t.items
    .map(
      (it) => `
      <tr>
        <td valign="top" style="padding:0 12px 12px 0;font:700 15px/1.5 ${font};color:${accent}">✓</td>
        <td valign="top" style="padding:0 0 12px 0;font:400 14px/1.55 ${font};color:#d6d3d1">${it}</td>
      </tr>`,
    )
    .join("");

  await sendMail(email, {
    subject: t.subject(safeHost),
    html: `<!DOCTYPE html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:#0c0a09;-webkit-text-size-adjust:100%">
<span style="display:none!important;opacity:0;color:#0c0a09;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden">${t.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse">
  <tr><td style="padding:0 4px 20px;font:700 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;text-transform:uppercase;color:${accent}">STUDIO&nbsp;VM<span style="color:${accent}">.</span></td></tr>
  <tr><td style="background:#161210;border:1px solid #2c2521;border-radius:18px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr><td style="padding:32px 32px 0">
        <p style="margin:0 0 10px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:${accent}">${t.eyebrow}</p>
        <h1 style="margin:0 0 14px;font:700 23px/1.3 ${font};color:#fafaf9">${t.headline(safeHost)}</h1>
        <p style="margin:0 0 24px;font:400 15px/1.65 ${font};color:#a8a29e">${t.intro}</p>
      </td></tr>
      <tr><td style="padding:0 32px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211a14;border:1px solid #3a2f25;border-radius:14px;border-collapse:separate">
          <tr><td style="padding:22px 24px">
            <p style="margin:0 0 12px;font:700 11px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#a8a29e">${t.scoreLabel}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
              <td valign="middle" style="padding-right:18px;font:800 46px/1 ${font};color:${accent}">${grade}</td>
              <td valign="middle">
                <div style="font:700 22px/1 ${font};color:#fafaf9">${pct}<span style="font:600 14px/1 ${font};color:#a8a29e"> / 100</span></div>
                <div style="margin-top:6px;font:600 13px/1 ${font};color:${accent}">${t.verdict(pct)}</div>
              </td>
            </tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:separate;table-layout:fixed"><tr>
              <td bgcolor="${accent}" height="6" width="${pct}%" style="border-radius:3px;font-size:0;line-height:0">&nbsp;</td>
              <td bgcolor="#3a2f25" height="6" width="${100 - pct}%" style="font-size:0;line-height:0">&nbsp;</td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:28px 32px 0">
        <p style="margin:0 0 16px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#fafaf9">${t.insideTitle}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>
      </td></tr>
      <tr><td style="padding:28px 32px 8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>
          <td align="center" bgcolor="#fafaf9" style="border-radius:9999px">
            <a href="${portalUrl}" style="display:block;padding:16px 28px;font:700 15px/1 ${font};color:#0c0a09;text-decoration:none">${t.cta} &nbsp;→</a>
          </td>
        </tr></table>
        <p style="margin:16px 0 0;text-align:center;font:400 12px/1.5 ${font};color:#78716c">${t.reassure}</p>
      </td></tr>
      <tr><td style="padding:24px 32px 30px">
        <div style="border-top:1px solid #2c2521;padding-top:18px">
          <p style="margin:0;font:400 13px/1.6 ${font};color:#a8a29e">${t.foot}</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:22px 4px 0;text-align:center;font:400 11px/1.5 ${font};color:#57534e">© ${new Date().getFullYear()} Studio VM · Vincent Montreuil · <a href="https://studio-vm.be" style="color:#78716c;text-decoration:none">studio-vm.be</a></td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  });
}

export async function resendPortalLink(input: {
  email: string;
  locale: string;
}): Promise<ResendState> {
  const email = input.email.trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "email" };
  }
  if (!leadsConfigured) {
    return { ok: false, error: "not_configured" };
  }

  try {
    const { data } = await getSupabaseAdmin()
      .from("scan_requests")
      .select("token, locale, scan")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const row = data as
      | { token: string; locale: string; scan: ScanResult }
      | null;

    // Altijd dezelfde generieke uitkomst: lekt niet of een adres bestaat.
    if (row && row.scan && row.scan.ok) {
      const loc = ["nl", "fr", "en"].includes(row.locale)
        ? row.locale
        : "nl";
      const portalUrl = `${siteUrl}/${loc}/portail/${row.token}`;
      await sendPortalMail(
        email,
        loc,
        row.scan.host,
        row.scan.grade,
        row.scan.score,
        portalUrl,
      );
    }
  } catch {
    // Stil: we tonen sowieso de generieke bevestiging.
  }

  return { ok: true };
}
