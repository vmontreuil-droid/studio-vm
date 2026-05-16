import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, mollieConfigured } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";
import { sendMail } from "@/lib/monitor";

export const dynamic = "force-dynamic";

// Mollie POST't enkel het payment-id. We halen de status zelf op bij
// Mollie (gezaghebbend) en zetten de factuur op betaald. Idempotent.
export async function POST(req: NextRequest) {
  if (!mollieConfigured || !monitorConfigured) {
    return NextResponse.json({ ok: true });
  }
  let id = "";
  try {
    const form = await req.formData();
    id = String(form.get("id") ?? "");
  } catch {
    id = "";
  }
  if (!id) return NextResponse.json({ ok: true });

  const payment = await getMolliePayment(id);
  if (!payment) return NextResponse.json({ ok: true });

  const invoiceId = payment.metadata?.invoice_id;
  const quoteId = payment.metadata?.quote_id;

  if (payment.status === "paid" && invoiceId) {
    try {
      await getSupabaseAdmin()
        .from("invoices")
        .update({
          status: "betaald",
          paid_at: new Date().toISOString(),
          mollie_payment_id: payment.id,
        })
        .eq("id", invoiceId);
    } catch {
      // Mollie herprobeert de webhook als we geen 200 geven; bij een
      // DB-hapering net wél 200 geven en op de volgende retry vertrouwen
      // zou data missen — daarom hier 500.
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  if (payment.status === "paid" && quoteId) {
    try {
      const db = getSupabaseAdmin();
      const { data } = await db
        .from("quotes")
        .select("id, name, email, deposit_status, deposit_cents")
        .eq("id", quoteId)
        .maybeSingle();
      const q = data as {
        id: string;
        name: string;
        email: string;
        deposit_status: string;
        deposit_cents: number | null;
      } | null;
      // Idempotent: enkel de eerste keer mailen.
      if (q && q.deposit_status !== "betaald") {
        await db
          .from("quotes")
          .update({
            deposit_status: "betaald",
            deposit_paid_at: new Date().toISOString(),
            mollie_payment_id: payment.id,
            status: "vastgelegd",
          })
          .eq("id", quoteId);

        // deposit_cents staat excl. btw opgeslagen; betaald werd incl. 21%.
        const amt =
          "€ " +
          (Math.round((q.deposit_cents ?? 0) * 1.21) / 100).toLocaleString(
            "nl-BE",
          ) +
          " incl. btw";
        await sendMail("info@studio-vm.be", {
          subject: `Aanbetaling ontvangen — ${q.name}`,
          html: `<div style="font-family:system-ui,sans-serif;color:#111;line-height:1.6"><p><strong>${q.name}</strong> (${q.email}) heeft de aanbetaling van ${amt} betaald. De scope ligt vast — klaar om op te starten.</p></div>`,
        }).catch(() => {});
        await sendMail(q.email, {
          subject: "Je aanbetaling is ontvangen — we starten op",
          html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111"><p style="margin:0 0 8px">Bedankt! We ontvingen je aanbetaling van <strong>${amt}</strong>.</p><p style="margin:0 0 8px">Je samenstelling ligt nu vast. Ik neem snel contact op om de planning af te spreken. Vanaf oplevering start je maandfactuur (maanddeel + onderhoud + domein).</p></div>`,
        }).catch(() => {});
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
