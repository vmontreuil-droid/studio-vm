import { NextResponse, type NextRequest } from "next/server";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import {
  getOutreachConfig,
  pickForPrescan,
  prescanProspect,
} from "@/lib/admin/outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  if (cfg.paused) {
    return NextResponse.json({ ok: true, paused: true });
  }

  // Per cron-run: maximaal 4× de dagquota pre-scannen (zodat we morgen
  // ruim genoeg verzendkandidaten hebben). Verdeeld over de lands.
  const perLand = Math.max(5, Math.round((cfg.dailyQuota * 4) / cfg.lands.length));
  let scanned = 0;
  let failed = 0;
  for (const land of cfg.lands) {
    const picks = await pickForPrescan(land, perLand);
    for (const p of picks) {
      const ok = await prescanProspect(land, p.id, p.website, p.email);
      if (ok) scanned++;
      else failed++;
      await sleep(2_000); // beleefdheid + Vercel-budget
    }
  }
  return NextResponse.json({ ok: true, scanned, failed });
}
