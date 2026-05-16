import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, mollieConfigured } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";

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
  return NextResponse.json({ ok: true });
}
