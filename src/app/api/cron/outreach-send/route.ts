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
  warmUpQuota,
} from "@/lib/admin/outreach";
import { bedrijfVoorMail, buildOutreachMail } from "@/lib/admin/outreach-mail";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { doelgroepVoorNace, effectiveNace, naceMatches } from "@/lib/admin/aannemers";
import { getCompanySettings } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type OutreachRow = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_grade: string | null;
  scan_stack: string | null;
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
  unsubUrl: string,
): Promise<{ ok: boolean; id?: string }> {
  if (!resendApiKey) return { ok: false };
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
    if (!r.ok) return { ok: false };
    const j = (await r.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: j.id };
  } catch {
    return { ok: false };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // Warm-up: jonge afzender-domeinen mogen nog niet aan volle quota.
  const todayQuota = warmUpQuota(cfg.dailyQuota, cfg.startedAt);

  const db = getSupabaseAdmin();

  // Per-tick verdeling: cron loopt elke 30 min van 06:00 tot 22:30
  // (ma-za) = 34 ticks per dag. We willen de quota gelijkmatig
  // verspreiden over de overgebleven ticks van vandaag — lijkt op een
  // mens die af en toe een mail tikt, geen burst om 10:30 's morgens.
  const TICKS_PER_DAY = 34;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: sentTodayCount } = await db
    .from("prospect_outreach")
    .select("prospect_id", { count: "exact", head: true })
    .gte("mail_sent_at", todayStart.toISOString());
  const sentToday = sentTodayCount ?? 0;
  const remainingToday = Math.max(0, todayQuota - sentToday);
  if (remainingToday === 0) {
    return NextResponse.json({
      ok: true,
      quotaReached: true,
      sentToday,
      todayQuota,
    });
  }
  // Ticks die nog vandaag firen (inclusief deze).
  const now = new Date();
  const curHr = now.getHours();
  const curMin = now.getMinutes();
  const totalSlotsFromStart =
    Math.max(0, curHr - 6) * 2 + (curMin >= 30 ? 1 : 0);
  const ticksLeftToday = Math.max(1, TICKS_PER_DAY - totalSlotsFromStart);
  const perTick = Math.max(1, Math.ceil(remainingToday / ticksLeftToday));
  const sendLimit = Math.min(perTick, remainingToday);

  // Enkel aannemers uit de nieuwe campagne (scan_grade "3D:…"); oude
  // website-scans (A–F) worden nooit meer gemaild. Hoogste prioriteit
  // (machinesturing-signalen) eerst.
  let q = db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_score, scan_grade, scan_stack, scan_token, mail_to",
    )
    .eq("status", "gescand")
    .like("scan_grade", "3D:%")
    .is("mail_sent_at", null)
    .is("bounced_at", null)
    .is("complaint_at", null)
    .not("mail_to", "is", null)
    .order("scan_score", { ascending: false })
    .limit(sendLimit * 4);
  if (cfg.lands.length > 0) q = q.in("land", cfg.lands);
  const { data } = await q;
  const rows = (data as OutreachRow[] | null) ?? [];

  // NACE-controle (de doelgroep kan sinds de kwalificatie gewijzigd zijn).
  const prefixes = effectiveNace(cfg.nacePrefixes);
  // De NACE-code bepaalt ook de doelgroep (aannemer, ontwerper, landmeter) en dus de mail.
  const filtered: Array<OutreachRow & { nace: string | null }> = [];
  for (const r of rows) {
    if (filtered.length >= sendLimit) break;
    const src = sourceFromLand(r.land);
    const { data: pr } = await db
      .from(src.table)
      .select(src.codeCol)
      .eq(src.idCol, r.prospect_id)
      .maybeSingle();
    const code = (pr as Record<string, string | null> | null)?.[src.codeCol];
    if (naceMatches(code, prefixes)) filtered.push({ ...r, nace: code ?? null });
  }

  const bedrijf = bedrijfVoorMail(await getCompanySettings());

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const r of filtered) {
    if (!r.scan_token || !r.mail_to) continue;

    // Adres al afgemeld/gebounced of al gemaild via een andere onderneming?
    if (await adresOnderdrukt(r.mail_to, r)) {
      skipped++;
      await db
        .from("prospect_outreach")
        .update({
          status: "geen_interesse",
          notes: "overgeslagen: adres al gemaild, afgemeld of gebounced",
          updated_at: new Date().toISOString(),
        })
        .eq("land", r.land)
        .eq("prospect_id", r.prospect_id);
      continue;
    }

    const signalen = signalenUitRij(r);
    const land = r.land as Land;
    const lang = await langVoorProspect(land, r.prospect_id, signalen);
    const mail = buildOutreachMail(
      { land, website: r.website, signalen, token: r.scan_token, doelgroep: doelgroepVoorNace(r.nace, land) },
      cfg,
      bedrijf,
      lang,
      "first",
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be";
    const unsub = `${baseUrl}/api/outreach/unsubscribe?t=${encodeURIComponent(r.scan_token)}&l=${lang}`;
    const res = await sendPersonal(
      r.mail_to,
      mail.from,
      mail.subject,
      mail.html,
      mail.text,
      cfg.senderEmail,
      unsub,
    );

    if (res.ok) {
      sent++;
      await db
        .from("prospect_outreach")
        .update({
          mail_sent_at: new Date().toISOString(),
          resend_message_id: res.id ?? null,
          status: "verzonden",
          updated_at: new Date().toISOString(),
        })
        .eq("land", r.land)
        .eq("prospect_id", r.prospect_id);
    } else {
      failed++;
    }
    // Natuurlijk patroon — niet 20 mails in 30 sec, maar verspreid
    // over ~5 min zodat mailproviders geen burst-signaal zien.
    await sleep(12_000);
  }

  // Eerste-keer-marker: bij allereerste succesvolle send registreren
  // we de startdatum voor de warm-up-curve.
  if (sent > 0 && !cfg.startedAt) {
    await db
      .from("company_settings")
      .update({ outreach_started_at: new Date().toISOString().slice(0, 10) })
      .eq("id", "default");
  }
  return NextResponse.json({
    ok: true,
    sent,
    failed,
    skipped,
    scope: filtered.length,
    todayQuota,
    sentToday: sentToday + sent,
    perTick,
    ticksLeftToday,
  });
}
