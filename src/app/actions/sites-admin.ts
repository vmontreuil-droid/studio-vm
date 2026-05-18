"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { runScan } from "@/app/actions/scan";
import { snapshotOf, newToken } from "@/lib/monitor";
import { MY_SITES, SITES_OWNER_EMAIL } from "@/lib/my-sites";

type MonRow = { id: string; url: string };

// Zorgt dat er voor elke site uit MY_SITES een admin-monitorrij
// bestaat (idempotent). Daardoor pikt de bestaande weekcron ze
// automatisch mee en bouwt de historiek vanzelf op.
export async function ensureSiteMonitors(): Promise<MonRow[]> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("monitors")
    .select("id, url")
    .eq("email", SITES_OWNER_EMAIL);
  const existing = new Map(
    ((data as MonRow[]) ?? []).map((m) => [m.url, m]),
  );
  const out: MonRow[] = [];
  for (const s of MY_SITES) {
    const found = existing.get(s.url);
    if (found) {
      out.push(found);
      continue;
    }
    const { data: ins } = await db
      .from("monitors")
      .insert({
        url: s.url,
        email: SITES_OWNER_EMAIL,
        locale: "nl",
        token: newToken(),
        active: true,
        confirmed_at: new Date().toISOString(),
      })
      .select("id, url")
      .maybeSingle();
    if (ins) out.push(ins as MonRow);
  }
  return out;
}

// "Scan nu": scant alle sites direct en bewaart het resultaat als
// historiek-punt (ook downs, zodat alarmen kloppen).
export async function scanAllSites(): Promise<void> {
  if (!(await requireAdmin())) return;
  const db = getSupabaseAdmin();
  const mons = await ensureSiteMonitors();
  await Promise.all(
    mons.map(async (mon) => {
      const t0 = Date.now();
      let res: Awaited<ReturnType<typeof runScan>>;
      try {
        res = await runScan(mon.url);
      } catch {
        res = { ok: false, error: "scan-fout" } as Awaited<
          ReturnType<typeof runScan>
        >;
      }
      const now = new Date().toISOString();
      await db
        .from("monitors")
        .update({ last_scan_at: now })
        .eq("id", mon.id);

      if (res.ok) {
        const snap = snapshotOf(res);
        await db.from("monitor_scans").insert({
          monitor_id: mon.id,
          score: snap.score,
          grade: snap.grade,
          stack: snap.stack,
          cert_days_left: snap.cert_days_left,
          critical_count: snap.critical_count,
          snapshot: {
            ...snap,
            ok: true,
            responseMs: res.responseMs ?? Date.now() - t0,
            host: res.host,
            finalUrl: res.finalUrl,
            cwvRisk: res.cwvRisk,
            hosting:
              res.findings?.find((f) => f.key === "hosting")?.value ??
              null,
            scanned_at: now,
          },
        });
      } else {
        await db.from("monitor_scans").insert({
          monitor_id: mon.id,
          score: 0,
          grade: "F",
          stack: "",
          cert_days_left: null,
          critical_count: 0,
          snapshot: {
            ok: false,
            error: res.error ?? "onbereikbaar",
            scanned_at: now,
          },
        });
      }
    }),
  );
  revalidatePath("/admin/sites");
}
