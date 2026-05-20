"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resendApiKey } from "@/lib/supabase/config";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { buildOutreachMail } from "@/lib/admin/outreach-mail";
import {
  portalEmailHtml,
  offerPreviewHtml,
  invoicePaidPreviewHtml,
} from "@/lib/email";

const STATUSES = [
  "nieuw",
  "gescand",
  "verzonden",
  "opgevolgd",
  "geopend",
  "beantwoord",
  "klant",
  "geen_interesse",
] as const;

export async function setOutreachStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const land = (fd.get("land") as string | null)?.trim();
  const prospect_id = (fd.get("prospect_id") as string | null)?.trim();
  const status = (fd.get("status") as string | null)?.trim() as
    | (typeof STATUSES)[number]
    | undefined;
  if (!land || !prospect_id || !status || !STATUSES.includes(status)) return;
  try {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "beantwoord") patch.replied_at = new Date().toISOString();
    await getSupabaseAdmin()
      .from("prospect_outreach")
      .update(patch)
      .eq("land", land)
      .eq("prospect_id", prospect_id);
    revalidatePath("/admin/outreach");
  } catch {}
}

// Stuur één voorbeeldmail naar jezelf om de rendering, headers en
// spam-score te checken vóór de cron echt naar prospects vertrekt.
export async function sendTestMail(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  if (!resendApiKey)
    return { ok: false, error: "RESEND_API_KEY ontbreekt." };
  const id = (fd.get("id") as string | null)?.trim();
  if (!id) return { ok: false, error: "Geen mail-id." };

  const cfg = await getOutreachConfig();
  if (!cfg.senderEmail)
    return { ok: false, error: "Geen sender-email ingesteld." };

  // Genereer dezelfde sample-mail als op de preview-pagina.
  const sample = buildSamplePreview(id, cfg);
  if (!sample)
    return { ok: false, error: `Onbekende template '${id}'.` };

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be";
  const unsub = `${baseUrl}/api/outreach/unsubscribe?t=preview-abc123`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sample.from ?? `${cfg.senderName} <${cfg.senderEmail}>`,
        to: [cfg.senderEmail],
        subject: `[TEST] ${sample.subject}`,
        html: sample.html,
        text: sample.text,
        reply_to: cfg.senderEmail,
        headers: {
          "List-Unsubscribe": `<${unsub}>, <mailto:${cfg.senderEmail}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { ok: false, error: `Resend ${r.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "netwerk-error",
    };
  }
}

export async function sendTestMailAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return sendTestMail(fd);
}

function buildSamplePreview(
  id: string,
  cfg: Awaited<ReturnType<typeof getOutreachConfig>>,
): {
  subject: string;
  html: string;
  text?: string;
  from?: string;
} | null {
  // Outreach-varianten
  const m = id.match(/^outreach-(first|followup)-(nl|fr|en)$/);
  if (m) {
    const variant = m[1] as "first" | "followup";
    const lang = m[2] as "nl" | "fr" | "en";
    const issues =
      lang === "nl"
        ? [
            "SSL-certificaat verloopt binnenkort",
            "Geen mobiele viewport-instelling",
            "Trage Largest Contentful Paint (4,3s)",
          ]
        : lang === "fr"
          ? [
              "Le certificat SSL expire bientôt",
              "Pas de paramètre viewport mobile",
              "Largest Contentful Paint lent (4,3s)",
            ]
          : [
              "SSL certificate expires soon",
              "No mobile viewport meta tag",
              "Slow Largest Contentful Paint (4.3s)",
            ];
    return buildOutreachMail(
      {
        name: "carpentiernv.be",
        website: "https://carpentiernv.be",
        scanScore: 62,
        scanGrade: "C",
        scanIssues: issues,
        scanToken: "preview-abc123",
        land: "be",
      },
      cfg,
      lang,
      variant,
    );
  }
  if (id === "offer-sent-nl") {
    return {
      subject: "Je offerte staat klaar — Studio VM",
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Je offerte",
        title: "Hi Jan Carpentier,",
        bodyLines: [
          "Hierbij je persoonlijke offerte — alle prijzen en betaalopties in je portaal.",
        ],
        ctaLabel: "Bekijk je voorstel",
        ctaHref: "https://studio-vm.be/nl/portail",
        extraHtml: offerPreviewHtml({
          offerNo: "OFF2026-0042",
          greeting: "Jan Carpentier",
          amountExclCents: 290000,
          vatReverse: false,
          validUntil: "2026-06-19",
          includes: [
            "Studio Pro — onepager",
            "Domein + hosting setup",
            "On-page SEO",
          ],
          subLabel: "Care-abonnement",
          subMonthlyCents: 4900,
          discountCents: 20300,
          freeMonthsCents: 9800,
        }),
      }),
    };
  }
  if (id === "invoice-paid-nl") {
    return {
      subject: "Factuur F2026-0017 is betaald — bedankt!",
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Factuur betaald",
        title: "Bedankt voor je betaling 🎉",
        bodyLines: ["Je betaling is goed binnengekomen."],
        ctaLabel: "Open mijn portaal",
        ctaHref: "https://studio-vm.be/nl/portail",
        extraHtml: invoicePaidPreviewHtml({
          number: "F2026-0017",
          description: "Voorschot 30% — nieuwe website",
          amountExclCents: 148760,
          vatReverse: false,
          paidAt: new Date().toISOString(),
          locale: "nl",
        }),
      }),
    };
  }
  if (id === "support-free-nl") {
    return {
      subject: "Je supportmaand is gratis 🎁 — Studio VM",
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Je supportabonnement",
        title: "Maand 1: gratis 🎁",
        bodyLines: [
          "Maand 1 van je Care-abonnement is gratis.",
        ],
        ctaLabel: "Bekijk je portaal",
        ctaHref: "https://studio-vm.be/nl/portail",
      }),
    };
  }
  if (id === "reminder-1-nl") {
    return {
      subject: "Vriendelijke herinnering — factuur F2026-0017",
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Vriendelijke herinnering",
        title: "Mogen we je even herinneren?",
        bodyLines: [
          "Factuur F2026-0017 is intussen vervallen.",
          "Openstaand bedrag: € 180,00.",
        ],
        ctaLabel: "Betaal in je portaal",
        ctaHref: "https://studio-vm.be/nl/portail",
      }),
    };
  }
  return null;
}

export async function toggleOutreachPaused(): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("company_settings")
      .select("outreach_paused")
      .eq("id", "default")
      .maybeSingle();
    const current = (data as { outreach_paused: boolean } | null)
      ?.outreach_paused;
    await db
      .from("company_settings")
      .update({ outreach_paused: !current })
      .eq("id", "default");
    revalidatePath("/admin/outreach");
  } catch {}
}
