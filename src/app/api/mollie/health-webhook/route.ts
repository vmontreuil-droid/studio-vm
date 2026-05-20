import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";
import { runScan } from "@/app/actions/scan";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { buildActionPlan } from "@/lib/health-check-actionplan";
import { nextDocNumber } from "@/lib/admin/numbering";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const fd = await req.formData().catch(() => null);
  const paymentId = (fd?.get("id") as string | null)?.trim();
  if (!paymentId) {
    return NextResponse.json({ ok: true, skip: true });
  }
  const p = await getMolliePayment(paymentId);
  if (!p) return NextResponse.json({ ok: true, skip: true });

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("health_checks")
    .select("id, email, website, locale, scan_token, status")
    .eq("mollie_payment_id", paymentId)
    .maybeSingle();
  const hc = data as
    | {
        id: string;
        email: string;
        website: string;
        locale: string;
        scan_token: string;
        status: string;
      }
    | null;
  if (!hc) return NextResponse.json({ ok: true });
  if (hc.status === "betaald") return NextResponse.json({ ok: true });

  if (p.status === "paid") {
    // Scan de site nu pas (na betaling) — geeft de prospect z'n
    // resultaat én levert ons een scan_request voor het portaal.
    const scan = await runScan(hc.website).catch(() => null);
    const plan = scan
      ? buildActionPlan(scan, hc.locale as "nl" | "fr" | "en")
      : [];
    await db
      .from("health_checks")
      .update({
        status: "betaald",
        paid_at: new Date().toISOString(),
        scan: scan ?? null,
        action_plan: plan,
        followup_1d_sent_at: new Date().toISOString(),
      })
      .eq("id", hc.id);

    if (scan) {
      // Maak portaal-entry (scan_requests) zodat de basis-scanpagina
      // ook werkt — én een aparte premium-portaal-link voor het
      // Health-Check-rapport.
      await db.from("scan_requests").insert({
        email: hc.email,
        url: hc.website,
        locale: hc.locale,
        token: hc.scan_token,
        scan,
      });
    }

    const portal = `${siteUrl}/${hc.locale}/portail/health-check/${hc.scan_token}`;

    // Automatische factuur (volledig betaald) — €99 incl btw 21%.
    // amount_cents wordt opgeslagen als EXCL btw (zoals de rest
    // van het systeem), 99,00 incl → 81,82 excl + 17,18 btw.
    const invoiceNumber = await nextDocNumber("invoice");
    const exclCents = Math.round(9900 / 1.21);
    const publicToken = randomBytes(18).toString("base64url");
    await db.from("invoices").insert({
      client_email: hc.email,
      number: invoiceNumber,
      description: `Site Health Check — ${hc.website.replace(/^https?:\/\//, "")}`,
      amount_cents: exclCents,
      status: "betaald",
      issued_at: new Date().toISOString().slice(0, 10),
      paid_at: new Date().toISOString(),
      mollie_payment_id: paymentId,
      public_token: publicToken,
    });
    const invoiceUrl = `${siteUrl}/${hc.locale}/factuur/${publicToken}`;
    const T =
      hc.locale === "fr"
        ? {
            subject: "Votre Site Health Check est prêt 🎉",
            title: "Merci pour votre paiement !",
            lines: [
              `Votre Site Health Check pour <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> est prêt.`,
              "Vous y trouverez votre score, les points concrets à améliorer et mon plan d'action.",
            ],
            cta: "Ouvrir mon rapport",
            foot: `Votre facture (téléchargeable) : <a href="${invoiceUrl}" style="color:#e08214">${invoiceUrl}</a>`,
          }
        : hc.locale === "en"
          ? {
              subject: "Your Site Health Check is ready 🎉",
              title: "Thanks for your payment!",
              lines: [
                `Your Site Health Check for <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> is ready.`,
                "You'll find your score, the concrete improvement points and my action plan.",
              ],
              cta: "Open my report",
              foot: `Your invoice (downloadable): <a href="${invoiceUrl}" style="color:#e08214">${invoiceUrl}</a>`,
            }
          : {
              subject: "Je Site Health Check is klaar 🎉",
              title: "Bedankt voor je betaling!",
              lines: [
                `Je Site Health Check voor <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> staat klaar.`,
                "Je vindt er je score, de concrete verbeterpunten en mijn actieplan.",
              ],
              cta: "Open mijn rapport",
              foot: `Je factuur (downloadbaar): <a href="${invoiceUrl}" style="color:#e08214">${invoiceUrl}</a>`,
            };

    await sendMail(hc.email, {
      subject: T.subject,
      html: portalEmailHtml({
        locale: hc.locale,
        eyebrow: "Site Health Check",
        title: T.title,
        bodyLines: T.lines,
        ctaLabel: T.cta,
        ctaHref: portal,
        footnote: T.foot,
      }),
    });
  } else if (p.status === "failed" || p.status === "canceled" || p.status === "expired") {
    await db
      .from("health_checks")
      .update({ status: "mislukt" })
      .eq("id", hc.id);
  }

  return NextResponse.json({ ok: true });
}
