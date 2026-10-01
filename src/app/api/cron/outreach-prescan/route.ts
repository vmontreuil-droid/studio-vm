import { NextResponse, type NextRequest } from "next/server";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import {
  getOutreachConfig,
  pickForPrescan,
  qualifyProspect,
} from "@/lib/admin/outreach";
import { effectiveNace } from "@/lib/admin/aannemers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Kwalificatie van aannemers: per prospect één lichte GET van de homepage
// (SSRF-veilig) op zoek naar machinesturing-signalen (GPS, Trimble,
// Topcon, Leica, Unicontrol, …) en grondwerktermen. Resultaat → rij in
// prospect_outreach met status 'gescand' en een prioriteit (scan_score).
// Verstuurt zelf NOOIT een mail.

const BUDGET_MS = 240_000;
const CONCURRENCY = 4;

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cfg = await getOutreachConfig();
  if (cfg.paused) {
    return NextResponse.json({ ok: true, paused: true });
  }

  const started = Date.now();
  const prefixes = effectiveNace(cfg.nacePrefixes);
  // Ruim genoeg kandidaten voor ~2 dagen verzenden, verdeeld over de landen.
  const perLand = Math.min(
    150,
    Math.max(10, Math.round((cfg.dailyQuota * 2) / Math.max(1, cfg.lands.length))),
  );

  let scanned = 0;
  let failed = 0;
  let skipped = 0;
  const perGrade: Record<string, number> = {};
  for (const land of cfg.lands) {
    if (Date.now() - started > BUDGET_MS) break;
    const picks = await pickForPrescan(land, perLand, prefixes);
    let idx = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (true) {
          if (Date.now() - started > BUDGET_MS) return;
          const i = idx++;
          if (i >= picks.length) return;
          const p = picks[i];
          try {
            const r = await qualifyProspect(land, p.id, p.website, {
              site: p.siteEmail,
              register: p.registerEmail,
            }, p.nace);
            if (r.ok) {
              scanned++;
              if (r.grade) perGrade[r.grade] = (perGrade[r.grade] ?? 0) + 1;
            } else if (r.overgeslagen) skipped++;
            else failed++;
          } catch {
            failed++;
          }
        }
      }),
    );
  }
  return NextResponse.json({
    ok: true,
    scanned,
    skipped,
    failed,
    perGrade,
    nace: prefixes,
    ms: Date.now() - started,
  });
}
