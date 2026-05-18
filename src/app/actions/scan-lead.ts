"use server";

import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { unsubLink } from "@/lib/newsletter-token";
import { ensurePortalUser } from "@/lib/portal-access";
import { portalEmailHtml } from "@/lib/email";
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

  // Scan-lead ook in de nieuwsbrieflijst. ignoreDuplicates: bestaande
  // (incl. eerder uitgeschreven) rijen blijven ongemoeid — geen
  // heractivatie van wie zich al uitschreef.
  try {
    await getSupabaseAdmin()
      .from("newsletter_subscribers")
      .upsert(
        { email, locale, source: "scan", active: true },
        { onConflict: "email", ignoreDuplicates: true },
      );
  } catch {
    // Mag de scan nooit doen falen.
  }

  // Invite-only portaal: scan = automatisch toegang.
  await ensurePortalUser(email);

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
  const ff =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const items = t.items
    .map(
      (it) => `
      <tr>
        <td valign="top" style="padding:0 12px 12px 0;font:700 15px/1.5 ${ff};color:${accent}">&#10003;</td>
        <td valign="top" style="padding:0 0 12px 0;font:400 14px/1.55 ${ff};color:#44403c">${it}</td>
      </tr>`,
    )
    .join("");
  const extraHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #e7e5e4;border-collapse:separate">
      <tr><td style="padding:22px 24px">
        <p style="margin:0 0 12px;font:700 11px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#78716c">${t.scoreLabel}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
          <td valign="middle" style="padding-right:18px;font:800 46px/1 ${ff};color:${accent}">${grade}</td>
          <td valign="middle">
            <div style="font:700 22px/1 ${ff};color:#1c1917">${pct}<span style="font:600 14px/1 ${ff};color:#78716c"> / 100</span></div>
            <div style="margin-top:6px;font:600 13px/1 ${ff};color:${accent}">${t.verdict(pct)}</div>
          </td>
        </tr></table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:separate;table-layout:fixed"><tr>
          <td bgcolor="${accent}" height="6" width="${pct}%" style="font-size:0;line-height:0">&nbsp;</td>
          <td bgcolor="#e7e5e4" height="6" width="${100 - pct}%" style="font-size:0;line-height:0">&nbsp;</td>
        </tr></table>
      </td></tr>
    </table>
    <p style="margin:24px 0 14px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#1c1917">${t.insideTitle}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>
    <p style="margin:20px 0 0;font:400 13px/1.6 ${ff};color:#78716c">${t.foot}</p>`;

  await sendMail(email, {
    subject: t.subject(safeHost),
    html: portalEmailHtml({
      locale,
      eyebrow: t.eyebrow,
      title: t.headline(safeHost),
      bodyLines: [t.intro],
      extraHtml,
      ctaLabel: t.cta,
      ctaHref: portalUrl,
      footnote: `${t.reassure}<br><a href="${unsubLink(email)}" style="color:#78716c;text-decoration:underline">${
        locale === "fr"
          ? "Se désinscrire des updates"
          : locale === "en"
            ? "Unsubscribe from updates"
            : "Uitschrijven voor updates"
      }</a>`,
    }),
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
