import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { ensureSiteMonitors } from "@/app/actions/sites-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIMEOUT_MS = 10_000;

// Lichte uptime-ping: enkel "leeft de site + hoe snel". Geen volledige
// scan (die blijft de wekelijkse diepe scan / "Scan nu"). Zo kan dit
// elke 5 minuten draaien zonder de site of onszelf te belasten.
async function ping(
  url: string,
): Promise<{ ok: boolean; status: number | null; ms: number; error?: string }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "StudioVM-Uptime/1.0" },
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return {
      ok: false,
      status: null,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.name : "fetch-fout",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  const mons = await ensureSiteMonitors();
  const now = new Date().toISOString();

  const results = await Promise.all(
    mons.map(async (mon) => {
      const r = await ping(mon.url);
      await db
        .from("monitors")
        .update({ last_scan_at: now })
        .eq("id", mon.id);
      await db.from("monitor_scans").insert({
        monitor_id: mon.id,
        score: null,
        grade: null,
        stack: null,
        cert_days_left: null,
        critical_count: null,
        snapshot: {
          kind: "ping",
          ok: r.ok,
          status: r.status,
          responseMs: r.ms,
          error: r.ok ? null : (r.error ?? `HTTP ${r.status ?? "?"}`),
          scanned_at: now,
        },
      });
      return { url: mon.url, ok: r.ok, ms: r.ms };
    }),
  );

  return NextResponse.json({
    ok: true,
    pinged: results.length,
    down: results.filter((x) => !x.ok).length,
  });
}
