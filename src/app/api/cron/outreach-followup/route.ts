import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  monitorConfigured,
  cronSecret,
  resendApiKey,
} from "@/lib/supabase/config";
import { getOutreachConfig, detectLang } from "@/lib/admin/outreach";
import { buildOutreachMail } from "@/lib/admin/outreach-mail";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DAY = 86_400_000;

type Row = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_grade: string | null;
  scan_issues: string[] | null;
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

  // Stap B: prospects die 5-10 dagen geleden gemaild zijn, geen reactie
  // en geen follow-up → één opvolg-mail.
  const { data } = await db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_score, scan_grade, scan_issues, scan_token, mail_to, mail_sent_at",
    )
    .eq("status", "verzonden")
    .is("replied_at", null)
    .is("followup_sent_at", null)
    .lt("mail_sent_at", cutoff)
    .limit(cfg.dailyQuota);
  const rows = (data as Row[] | null) ?? [];

  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    if (!r.scan_token || !r.mail_to || !r.website || r.scan_score == null)
      continue;
    let lang: "nl" | "fr" | "en" = detectLang(
      r.land as "be" | "fr" | "uk",
      null,
    );
    if (r.land === "be") {
      const { data: pr } = await db
        .from("kbo_enterprises")
        .select("postcode")
        .eq("enterprise_number", r.prospect_id)
        .maybeSingle();
      lang = detectLang(
        "be",
        (pr as { postcode: string | null } | null)?.postcode ?? null,
      );
    }
    const mail = buildOutreachMail(
      {
        name: r.website.replace(/^https?:\/\//, ""),
        website: r.website,
        scanScore: r.scan_score,
        scanGrade: r.scan_grade ?? "",
        scanIssues: r.scan_issues ?? [],
        scanToken: r.scan_token,
        land: r.land as "be" | "fr" | "uk",
      },
      cfg,
      lang,
      "followup",
    );
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be";
    const unsub = `${baseUrl}/api/outreach/unsubscribe?t=${r.scan_token}`;
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
  }
  return NextResponse.json({ ok: true, sent, failed });
}
