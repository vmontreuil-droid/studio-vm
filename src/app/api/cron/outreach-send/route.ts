import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  monitorConfigured,
  cronSecret,
  resendApiKey,
} from "@/lib/supabase/config";
import { getOutreachConfig, detectLang } from "@/lib/admin/outreach";
import { buildOutreachMail } from "@/lib/admin/outreach-mail";
import { sourceFromLand } from "@/lib/admin/prospect-source";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type OutreachRow = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_grade: string | null;
  scan_issues: string[] | null;
  scan_token: string | null;
  mail_to: string | null;
};

async function sendPersonal(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string,
  replyTo: string,
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
  if (cfg.paused || cfg.dailyQuota <= 0) {
    return NextResponse.json({ ok: true, paused: true });
  }
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY ontbreekt" },
      { status: 500 },
    );
  }

  const db = getSupabaseAdmin();
  let q = db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_score, scan_grade, scan_issues, scan_token, mail_to",
    )
    .eq("status", "gescand")
    .is("mail_sent_at", null)
    .not("mail_to", "is", null)
    .gte("scan_score", cfg.minScore)
    .lte("scan_score", cfg.maxScore)
    .limit(cfg.dailyQuota);
  if (cfg.lands.length > 0) q = q.in("land", cfg.lands);
  const { data } = await q;
  const rows = (data as OutreachRow[] | null) ?? [];

  // Optioneel: filter op NACE-prefix per land (kost ook een join met
  // de land-tabel; we doen het kort en eenvoudig per prospect_id).
  let filtered = rows;
  if (cfg.nacePrefixes.length > 0) {
    const naceOk: OutreachRow[] = [];
    for (const r of rows) {
      const src = sourceFromLand(r.land);
      const { data: pr } = await db
        .from(src.table)
        .select(src.codeCol)
        .eq(src.idCol, r.prospect_id)
        .maybeSingle();
      const code = (pr as Record<string, string | null> | null)?.[src.codeCol];
      if (
        code &&
        cfg.nacePrefixes.some((p) => code.startsWith(p))
      ) {
        naceOk.push(r);
      }
    }
    filtered = naceOk;
  }

  let sent = 0;
  let failed = 0;
  for (const r of filtered) {
    if (!r.scan_token || !r.mail_to || !r.website || r.scan_score == null)
      continue;
    // Postcode ophalen voor taaldetectie (alleen BE).
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
      lang = detectLang("be", (pr as { postcode: string | null } | null)?.postcode ?? null);
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
      "first",
    );

    const ok = await sendPersonal(
      r.mail_to,
      mail.from,
      mail.subject,
      mail.html,
      mail.text,
      cfg.senderEmail,
    );

    if (ok) {
      sent++;
      await db
        .from("prospect_outreach")
        .update({
          mail_sent_at: new Date().toISOString(),
          status: "verzonden",
          updated_at: new Date().toISOString(),
        })
        .eq("land", r.land)
        .eq("prospect_id", r.prospect_id);
    } else {
      failed++;
    }
  }
  return NextResponse.json({ ok: true, sent, failed, scope: filtered.length });
}
