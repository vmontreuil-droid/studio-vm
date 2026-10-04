import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";
import { runScan } from "@/app/actions/scan";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { buildActionPlan } from "@/lib/health-check-actionplan";
import { slaFactuurOp } from "@/lib/facturatie/opslaan";
import { sendInvoiceViaBillit } from "@/lib/billit";
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
    .select(
      "id, name, email, website, locale, scan_token, status, package, amount_cents, customer_type, company_name, vat_number, street, postal_code, city, country",
    )
    .eq("mollie_payment_id", paymentId)
    .maybeSingle();
  const hc = data as
    | {
        id: string;
        name: string | null;
        email: string;
        website: string;
        locale: string;
        scan_token: string;
        status: string;
        package: "standard" | "premium" | null;
        amount_cents: number;
        customer_type: "particulier" | "bedrijf" | null;
        company_name: string | null;
        vat_number: string | null;
        street: string | null;
        postal_code: string | null;
        city: string | null;
        country: string | null;
      }
    | null;
  if (!hc) return NextResponse.json({ ok: true });
  if (hc.status === "betaald") return NextResponse.json({ ok: true });
  const pkg: "standard" | "premium" = hc.package === "standard" ? "standard" : "premium";
  const grossCents = hc.amount_cents || (pkg === "standard" ? 4900 : 9900);

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

    // Automatische factuur (volledig betaald) — Standard €49 incl
    // of Premium €99 incl btw 21%. amount_cents wordt opgeslagen
    // als EXCL btw (zoals de rest van het systeem).
    const exclCents = Math.round(grossCents / 1.21);
    const publicToken = randomBytes(18).toString("base64url");
    const pkgLabel = pkg === "premium" ? "Premium" : "Standard";
    // Voor B2B-factuur: bedrijfsnaam, anders persoonsnaam.
    // Adres opbouwen uit beschikbare velden.
    const clientName =
      hc.customer_type === "bedrijf" && hc.company_name
        ? hc.company_name
        : hc.name || hc.email;
    const clientAddress = [
      hc.street,
      [hc.postal_code, hc.city].filter(Boolean).join(" "),
      hc.country && hc.country !== "BE" ? hc.country : null,
    ]
      .filter(Boolean)
      .join("\n");
    const issuedAt = new Date().toISOString().slice(0, 10);
    const invoiceDesc = `Site Health Check ${pkgLabel} — ${hc.website.replace(/^https?:\/\//, "")}`;
    const opgeslagen = await slaFactuurOp({
      client_email: hc.email,
      client_name: clientName,
      client_address: clientAddress || null,
      client_vat: hc.vat_number,
      description: invoiceDesc,
      amount_cents: exclCents,
      status: "betaald",
      issued_at: issuedAt,
      paid_at: new Date().toISOString(),
      mollie_payment_id: paymentId,
      public_token: publicToken,
      peppol_status: hc.vat_number ? "wachten" : "niet_vereist",
    }, db);
    const invoiceNumber = opgeslagen.ok ? opgeslagen.doc.nummer : "";

    // Peppol-verzending via Billit — faalt-stil. Particulier (geen
    // btw-nr) krijgt direct 'niet_vereist'; B2B gaat naar Billit's
    // Peppol Access Point. De resultaten worden naar de invoice
    // gesynct zodat /admin/facturen de status toont.
    const billit = !invoiceNumber
      ? { ok: false as const, error: "factuur niet opgeslagen" }
      : await sendInvoiceViaBillit({
      number: invoiceNumber,
      issued_at: issuedAt,
      lines: [
        {
          description: invoiceDesc,
          amount_excl_cents: exclCents,
          vat_rate: 21,
        },
      ],
      client: {
        customer_name: clientName,
        customer_vat: hc.vat_number,
        customer_email: hc.email,
        customer_address: hc.street,
        postal_code: hc.postal_code,
        city: hc.city,
        country: hc.country || "BE",
      },
    }).catch((e) => ({
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }));
    if (billit.ok) {
      await db
        .from("invoices")
        .update({
          billit_order_id: billit.billit_order_id || null,
          peppol_status: billit.peppol_status,
          peppol_sent_at:
            billit.peppol_status === "verzonden"
              ? new Date().toISOString()
              : null,
        })
        .eq("number", invoiceNumber);
    } else {
      await db
        .from("invoices")
        .update({
          peppol_status: "mislukt",
          peppol_error: billit.error,
        })
        .eq("number", invoiceNumber);
    }
    const invoiceUrl = `${siteUrl}/${hc.locale}/factuur/${publicToken}`;
    const isPremium = pkg === "premium";
    const T =
      hc.locale === "fr"
        ? {
            subject: `Votre Site Health Check ${pkgLabel} est prêt 🎉`,
            title: "Merci pour votre paiement !",
            lines: [
              `Votre Site Health Check pour <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> est prêt.`,
              "Vous y trouverez votre score, les points concrets à améliorer et mon plan d'action.",
              ...(isPremium
                ? [
                    "🎙️ Comme vous avez choisi <strong>Premium</strong>, je vous contacte personnellement dans les 24h pour planifier votre appel vidéo de 30 min.",
                  ]
                : []),
            ],
            cta: "Ouvrir mon rapport",
            foot: `Votre facture (téléchargeable) : <a href="${invoiceUrl}" style="color:#e08214">${invoiceUrl}</a>`,
          }
        : hc.locale === "en"
          ? {
              subject: `Your Site Health Check ${pkgLabel} is ready 🎉`,
              title: "Thanks for your payment!",
              lines: [
                `Your Site Health Check for <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> is ready.`,
                "You'll find your score, the concrete improvement points and my action plan.",
                ...(isPremium
                  ? [
                      "🎙️ Since you picked <strong>Premium</strong>, I'll reach out within 24h to schedule your 30-min video call.",
                    ]
                  : []),
              ],
              cta: "Open my report",
              foot: `Your invoice (downloadable): <a href="${invoiceUrl}" style="color:#e08214">${invoiceUrl}</a>`,
            }
          : {
              subject: `Je Site Health Check ${pkgLabel} is klaar 🎉`,
              title: "Bedankt voor je betaling!",
              lines: [
                `Je Site Health Check voor <strong>${hc.website.replace(/^https?:\/\//, "")}</strong> staat klaar.`,
                "Je vindt er je score, de concrete verbeterpunten en mijn actieplan.",
                ...(isPremium
                  ? [
                      "🎙️ Omdat je voor <strong>Premium</strong> gekozen hebt, neem ik binnen 24u persoonlijk contact op om je 30-min videocall te plannen.",
                    ]
                  : []),
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
