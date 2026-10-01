import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { findWebsiteForName } from "@/lib/admin/website-discovery";
import { sourceFromLand } from "@/lib/admin/prospect-source";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { effectiveNace, naceOrFilter } from "@/lib/admin/aannemers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Probeert per cron-run tot ~100 aannemers (NACE-filter van de outreach-
// config, of de standaard grondwerk-selectie) zonder website te koppelen
// aan een website, 8 parallel, ~3-5s per prospect. Verstuurt niets.
//
// Met migratie 0048 krijgt elke geprobeerde rij 'website_discovery_at',
// zodat dezelfde ondernemingen niet elke nacht opnieuw geprobeerd worden.
// Zonder die kolom kiest de route een willekeurige pagina.
const BATCH = 100;
const CONCURRENCY = 8;
const BUDGET_MS = 250_000;

let discoveryKolom: boolean | null = null;

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const cfg = await getOutreachConfig();
  const prefixes = effectiveNace(cfg.nacePrefixes);
  const started = Date.now();
  const totals: Record<string, { tried: number; found: number }> = {};

  for (const land of cfg.lands) {
    if (Date.now() - started > BUDGET_MS) break;
    const src = sourceFromLand(land);
    const naceFilter = naceOrFilter(src.codeCol, prefixes, land);

    // Enkel actieve aannemers zonder website — anders verspillen we requests.
    const basis = () =>
      db
        .from(src.table)
        .select(`${src.idCol}, name`)
        .is("website", null)
        .not("name", "is", null)
        .eq(src.statusCol, src.activeValue)
        .or(naceFilter);

    let rows: { [k: string]: string | null }[] = [];
    if (discoveryKolom !== false) {
      const { data, error } = await basis()
        .is("website_discovery_at", null)
        .limit(BATCH);
      if (!error) {
        discoveryKolom = true;
        rows = (data as unknown as { [k: string]: string | null }[] | null) ?? [];
      } else if (/website_discovery_at/i.test(error.message)) {
        discoveryKolom = false;
      }
    }
    if (discoveryKolom === false) {
      // Zonder markeerkolom: willekeurige pagina binnen de doelgroep.
      const { count } = await db
        .from(src.table)
        .select(src.idCol, { count: "exact", head: true })
        .is("website", null)
        .not("name", "is", null)
        .eq(src.statusCol, src.activeValue)
        .or(naceFilter);
      const offset = Math.max(0, Math.floor(Math.random() * Math.max(0, (count ?? 0) - BATCH)));
      const { data } = await basis()
        .order(src.idCol, { ascending: true })
        .range(offset, offset + BATCH - 1);
      rows = (data as unknown as { [k: string]: string | null }[] | null) ?? [];
    }
    if (rows.length === 0) {
      totals[land] = { tried: 0, found: 0 };
      continue;
    }

    let found = 0;
    let tried = 0;
    let idx = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (true) {
          if (Date.now() - started > BUDGET_MS) return;
          const i = idx++;
          if (i >= rows.length) return;
          const r = rows[i];
          const name = r.name as string;
          const id = r[src.idCol] as string;
          if (!name || !id) continue;
          tried++;
          let site: string | null = null;
          try {
            site = await findWebsiteForName(name, land);
          } catch {
            /* skip */
          }
          const patch: Record<string, unknown> = {};
          if (site) patch.website = site;
          if (discoveryKolom) patch.website_discovery_at = new Date().toISOString();
          if (Object.keys(patch).length > 0) {
            await db.from(src.table).update(patch).eq(src.idCol, id);
          }
          if (site) found++;
        }
      }),
    );

    totals[land] = { tried, found };
  }

  return NextResponse.json({ ok: true, nace: prefixes, totals });
}
