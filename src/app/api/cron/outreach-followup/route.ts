import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  monitorConfigured,
  cronSecret,
  resendApiKey,
} from "@/lib/supabase/config";
import {
  adresOnderdrukt,
  getOutreachConfig,
  langVoorProspect,
  signalenUitRij,
} from "@/lib/admin/outreach";
import { bedrijfVoorMail, buildOutreachMail } from "@/lib/admin/outreach-mail";
import { getCompanySettings } from "@/lib/admin/settings";
import type { Land } from "@/lib/admin/prospect-source";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAY = 86_400_000;

type Row = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_grade: string | null;
  scan_stack: string | null;
  scan_token: string | null;
  mail_to: string | null;
  mail_sent_at: string | null;
};

async function sendPersonal(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string,
  replyTo: string,
  unsubUrl: string,
): Promise<boolean> {
  if (!resendApiKey) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
        reply_to: replyTo,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>, <mailto:${replyTo}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cfg = await getOutreachConfig();
  if (cfg.paused) return NextResponse.json({ ok: true, paused: true });
  if (!resendApiKey)
    return NextResponse.json(
      { error: "RESEND_API_KEY ontbreekt" },
      { status: 500 },
    );

  const db = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 5 * DAY).toISOString();
  const stopAfter = new Date(Date.now() - 10 * DAY).toISOString();

  // Stap A: prospects ouder dan 10 dagen zonder reactie → afsluiten.
  await db
    .from("prospect_outreach")
    .update({
      status: "geen_interesse",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "verzonden")
    .is("replied_at", null)
    .lt("mail_sent_at", stopAfter);

  // Stap B: aannemers die 5-10 dagen geleden gemaild zijn, geen reactie
  // en geen follow-up → één opvolg-mail. Enkel de aannemers-campagne
  // ("3D:…"); rijen uit de oude website-campagne krijgen niets.
  const { data } = await db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_grade, scan_stack, scan_token, mail_to, mail_sent_at",
    )
    .eq("status", "verzonden")
    .like("scan_grade", "3D:%")
    .is("replied_at", null)
    .is("followup_sent_at", null)
    .is("bounced_at", null)
    .is("complaint_at", null)
    .lt("mail_sent_at", cutoff)
    .limit(cfg.dailyQuota);
  const rows = (data as Row[] | null) ?? [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const bedrijf = bedrijfVoorMail(await getCompanySettings());

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    if (!r.scan_token || !r.mail_to) continue;
    if (await adresOnderdrukt(r.mail_to, r)) continue;
    const signalen = signalenUitRij(r);
    const land = r.land as Land;
    const lang = await langVoorProspect(land, r.prospect_id, signalen);
    const mail = buildOutreachMail(
      { land, website: r.website, signalen, token: r.scan_token },
      cfg,
      bedrijf,
      lang,
      "followup",
    );
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be";
    const unsub = `${baseUrl}/api/outreach/unsubscribe?t=${encodeURIComponent(r.scan_token)}&l=${lang}`;
    const ok = await sendPersonal(
      r.mail_to,
      mail.from,
      mail.subject,
      mail.html,
      mail.text,
      cfg.senderEmail,
      unsub,
    );
    if (ok) {
      sent++;
      await db
        .from("prospect_outreach")
        .update({
          followup_sent_at: new Date().toISOString(),
          status: "opgevolgd",
          updated_at: new Date().toISOString(),
        })
        .eq("land", r.land)
        .eq("prospect_id", r.prospect_id);
    } else {
      failed++;
    }
    await sleep(12_000);
  }
  return NextResponse.json({ ok: true, sent, failed });
}
