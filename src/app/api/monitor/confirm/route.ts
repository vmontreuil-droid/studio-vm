import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, siteUrl } from "@/lib/supabase/config";
import { runScan } from "@/app/actions/scan";
import { snapshotOf, welcomeMail, sendMail } from "@/lib/monitor";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });

  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token)
    return NextResponse.redirect(`${siteUrl}/`);

  const db = getSupabaseAdmin();
  const { data: mon } = await db
    .from("monitors")
    .select("id, url, email, locale, token, active")
    .eq("token", token)
    .maybeSingle();

  if (!mon) return NextResponse.redirect(`${siteUrl}/`);

  const locale = isValidLocale(mon.locale) ? mon.locale : DEFAULT_LOCALE;

  if (!mon.active) {
    await db
      .from("monitors")
      .update({
        active: true,
        confirmed_at: new Date().toISOString(),
        last_scan_at: new Date().toISOString(),
      })
      .eq("id", mon.id);

    const res = await runScan(mon.url);
    if (res.ok) {
      const snap = snapshotOf(res);
      await db.from("monitor_scans").insert({
        monitor_id: mon.id,
        score: snap.score,
        grade: snap.grade,
        stack: snap.stack,
        cert_days_left: snap.cert_days_left,
        critical_count: snap.critical_count,
        snapshot: snap,
      });
    }
    await sendMail(mon.email, welcomeMail(locale, mon.url, token));
  }

  return NextResponse.redirect(
    `${siteUrl}/${locale}/scan/historiek/${token}`,
  );
}
