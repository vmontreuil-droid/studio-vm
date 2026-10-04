import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { klantGegevens } from "@/lib/projecten-admin";
import { offerteHerinneringMail } from "@/lib/klant-mails";

export const dynamic = "force-dynamic";

// Dagelijks: herinnering 2 dagen vóór de vervaldag van een open offerte.
// Taal: die van het project van de offerte (accountprofiel → aanvraag),
// anders de laatste aanvraag van de klant. Tekst: offerteHerinneringMail().
export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const target = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .slice(0, 10);

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("offers")
    .select("id, client_email, title, offer_no, valid_until")
    .eq("status", "open")
    .eq("valid_until", target)
    .is("reminder_sent_at", null)
    .limit(200);

  const offers =
    (data as
      | {
          id: string;
          client_email: string;
          title: string;
          offer_no: string | null;
          valid_until: string;
        }[]
      | null) ?? [];

  let sent = 0;
  for (const o of offers) {
    let quoteId: string | null = null;
    try {
      const { data: pr } = await db
        .from("projecten")
        .select("quote_id")
        .eq("offer_id", o.id)
        .limit(1)
        .maybeSingle();
      quoteId = (pr as { quote_id?: string | null } | null)?.quote_id ?? null;
    } catch {
      quoteId = null;
    }
    const { taal } = await klantGegevens(o.client_email, quoteId);
    await sendMail(
      o.client_email,
      offerteHerinneringMail(taal, {
        titel: o.title,
        offerNo: o.offer_no,
        geldigTot: o.valid_until,
      }),
    ).catch(() => {});
    await db
      .from("offers")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", o.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
