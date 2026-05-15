import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { runScan } from "@/app/actions/scan";
import {
  snapshotOf,
  diffAlert,
  alertMail,
  sendMail,
  type ScanRow,
} from "@/lib/monitor";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BATCH = 12;

export async function GET(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data: monitors } = await db
    .from("monitors")
    .select("id, url, email, locale, token")
    .eq("active", true)
    .order("last_scan_at", { ascending: true, nullsFirst: true })
    .limit(BATCH);

  let scanned = 0;
  let alerted = 0;

  for (const mon of monitors ?? []) {
    const res = await runScan(mon.url);
    await db
      .from("monitors")
      .update({ last_scan_at: new Date().toISOString() })
      .eq("id", mon.id);
    if (!res.ok) continue;
    scanned++;

    const snap = snapshotOf(res);
    const { data: prevRows } = await db
      .from("monitor_scans")
      .select("score, grade, stack, cert_days_left, critical_count, scanned_at")
      .eq("monitor_id", mon.id)
      .order("scanned_at", { ascending: false })
      .limit(1);
    const prev = (prevRows?.[0] as ScanRow | undefined) ?? null;

    await db.from("monitor_scans").insert({
      monitor_id: mon.id,
      score: snap.score,
      grade: snap.grade,
      stack: snap.stack,
      cert_days_left: snap.cert_days_left,
      critical_count: snap.critical_count,
      snapshot: snap,
    });

    const locale = isValidLocale(mon.locale) ? mon.locale : DEFAULT_LOCALE;
    const changes = diffAlert(locale, prev, snap);
    if (changes.length > 0) {
      const sent = await sendMail(
        mon.email,
        alertMail(locale, mon.url, mon.token, changes),
      );
      if (sent) alerted++;
    }
  }

  return NextResponse.json({ ok: true, scanned, alerted });
}
