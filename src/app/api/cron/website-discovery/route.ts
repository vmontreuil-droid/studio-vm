import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { findWebsiteForName } from "@/lib/admin/website-discovery";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { effectiveNace, naceOrFilter } from "@/lib/admin/aannemers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Koppelt aannemers (NACE-filter van de outreach-config) zonder website aan
// een website. Verstuurt niets. Draait elk halfuur: alle landen komen om
// beurt aan bod in porties van BATCH, met CONCURRENCY tegelijk, tot de
// tijd op is. Na STOP_MS geen nieuwe namen meer: één naam kan tot ~105 s
// duren (10 kandidaten × HEAD + bevestiging), zodat alles binnen 300 s af is.
//
// Elke geprobeerde rij krijgt 'website_discovery_at' (migratie 0048/0055/0056),
// zodat dezelfde ondernemingen niet opnieuw geraden worden. Een tabel zonder
// die kolom valt terug op één willekeurige pagina per run — per tabel, zodat
// één land zonder kolom de andere niet meesleept.
const BATCH = 150;
const CONCURRENCY = 24;
const STOP_MS = 175_000;

const discoveryKolom = new Map<string, boolean>();

type Taak = { land: Land; id: string; name: string };

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
  for (const land of cfg.lands) totals[land] = { tried: 0, found: 0 };

  const gezien = new Set<string>();
  const wachtrij: Taak[] = [];
  let landen = [...cfg.lands] as Land[];
  let beurt = 0;

  // Volgende portie van één land (om beurt). Een land zonder nieuwe rijen
  // valt af; zonder markeerkolom krijgt een land maar één portie per run.
  async function portie(land: Land): Promise<number> {
    const src = sourceFromLand(land);
    const naceFilter = naceOrFilter(src.codeCol, prefixes, land);
    const basis = () =>
      db
        .from(src.table)
        .select(`${src.idCol}, name`)
        .is("website", null)
        .not("name", "is", null)
        .eq(src.statusCol, src.activeValue)
        .or(naceFilter);

    let rows: Record<string, string | null>[] = [];
    let eenmalig = false;
    if (discoveryKolom.get(src.table) !== false) {
      // Rijen die nog lopen, hebben hun markering nog niet: ruimer ophalen en
      // wat al in deze run zit overslaan.
      const { data, error } = await basis()
        .is("website_discovery_at", null)
        .limit(BATCH * 2);
      if (!error) {
        discoveryKolom.set(src.table, true);
        rows = (data as unknown as Record<string, string | null>[] | null) ?? [];
      } else if (/website_discovery_at/i.test(error.message)) {
        discoveryKolom.set(src.table, false);
      } else {
        // Andere fout (bv. time-out): dit land overslaan in deze run.
        landen = landen.filter((l) => l !== land);
        return 0;
      }
    }
    if (discoveryKolom.get(src.table) === false) {
      eenmalig = true;
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
      rows = (data as unknown as Record<string, string | null>[] | null) ?? [];
    }

    let nieuw = 0;
    for (const r of rows) {
      const id = r[src.idCol];
      const name = r.name;
      if (!id || !name || gezien.has(`${land}:${id}`)) continue;
      gezien.add(`${land}:${id}`);
      wachtrij.push({ land, id, name });
      if (++nieuw >= BATCH) break;
    }
    if (nieuw === 0 || eenmalig) landen = landen.filter((l) => l !== land);
    return nieuw;
  }

  // Eén aanvulling tegelijk; zoekt verder tot een land iets oplevert.
  let bezig: Promise<void> | null = null;
  async function vul() {
    while (wachtrij.length === 0 && landen.length > 0 && Date.now() - started < STOP_MS) {
      await portie(landen[beurt++ % landen.length]);
    }
  }
  const vulAan = () => {
    bezig ??= vul().finally(() => {
      bezig = null;
    });
    return bezig;
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (Date.now() - started < STOP_MS) {
        const t = wachtrij.shift();
        if (!t) {
          // Leeg: wachten op de volgende portie, niet opgeven.
          if (landen.length === 0) return;
          await vulAan();
          continue;
        }
        const src = sourceFromLand(t.land);
        totals[t.land].tried++;
        let site: string | null = null;
        try {
          site = await findWebsiteForName(t.name, t.land);
        } catch {
          /* skip */
        }
        const patch: Record<string, unknown> = {};
        if (site) patch.website = site;
        if (discoveryKolom.get(src.table)) patch.website_discovery_at = new Date().toISOString();
        if (Object.keys(patch).length > 0) {
          await db.from(src.table).update(patch).eq(src.idCol, t.id);
        }
        if (site) totals[t.land].found++;
      }
    }),
  );

  return NextResponse.json({
    ok: true,
    seconden: Math.round((Date.now() - started) / 1000),
    nace: prefixes,
    totals,
  });
}
