import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

// Dagelijks: herinnering 2 dagen vóór de vervaldag van een open offerte.
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
    await sendMail(o.client_email, {
      subject: `Herinnering: je offerte ${o.offer_no ?? ""} verloopt binnenkort`,
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Herinnering",
        title: "Je offerte verloopt over 2 dagen",
        bodyLines: [
          `De offerte <strong>${o.title}</strong>${
            o.offer_no ? ` (${o.offer_no})` : ""
          } is geldig tot <strong>${o.valid_until}</strong>. Daarna vervalt ze automatisch.`,
        ],
        ctaLabel: "Bekijk & beslis",
        ctaHref: `${siteUrl}/nl/portail`,
      }),
    }).catch(() => {});
    await db
      .from("offers")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", o.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
