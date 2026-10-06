// Cron-variant van /api/admin/email-batch: pakt aannemers (NACE-filter
// van de outreach-config, of de standaard grondwerk-selectie) met website
// maar zonder email_scanned_at, leest hun contactpagina's en vult
// email_found. Verstuurt niets — leest enkel publieke contactgegevens.
// CRON_SECRET-auth zodat de achtergrond-runner zonder admin-cookie kan.
//
// Draait elk halfuur: alle landen om beurt, in kleine porties (CHUNK) met
// CONCURRENCY tegelijk, tot de tijd op is. De claim zet email_scanned_at
// meteen, dus een geclaimde rij die niet afraakt, raakt nooit meer gescand:
// daarom na STOP_MS geen nieuwe claims (één site = max. 8 pagina's × 8 s),
// en elk resultaat wordt meteen weggeschreven.

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { findEmails } from "@/lib/email-finder";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { effectiveNace, prefixVoorLand } from "@/lib/admin/aannemers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CHUNK = 10;
const CONCURRENCY = 16;
const STOP_MS = 180_000;

type Taak = { land: Land; id: string; website: string };

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
  const totals: Record<string, { scanned: number; withEmails: number; emailsTotal: number }> = {};
  for (const land of cfg.lands) totals[land] = { scanned: 0, withEmails: 0, emailsTotal: 0 };

  // Per land de prefixen in de vorm van dat land; een prefix zonder rijen
  // valt af, een land zonder prefixen ook.
  const open = new Map<Land, string[]>(
    (cfg.lands as Land[]).map((land) => [land, [...new Set(prefixes.map((p) => prefixVoorLand(p, land)))]]),
  );
  const wachtrij: Taak[] = [];
  let beurt = 0;

  // Atomic claim — zelfde RPC als de admin-batch, vergrendelt de rijen zodat
  // parallelle runs geen dubbel werk doen. De RPC kent één prefix per oproep.
  async function claim(land: Land): Promise<void> {
    const source = sourceFromLand(land);
    const rest = open.get(land) ?? [];
    while (rest.length > 0) {
      const { data: claimed, error } = await db.rpc(source.claimRpc, {
        p_limit: CHUNK,
        p_q: null,
        p_postcode: null,
        [land === "fr" ? "p_ape" : land === "uk" ? "p_sic" : "p_nace"]: rest[0],
        [land === "uk" ? "p_cat" : "p_form"]: null,
        p_active: true,
      });
      const rows = (claimed as { enterprise_number: string; website: string }[] | null) ?? [];
      if (error || rows.length === 0) {
        rest.shift();
        continue;
      }
      for (const r of rows) wachtrij.push({ land, id: r.enterprise_number, website: r.website });
      return;
    }
    open.delete(land);
  }

  // Aanvullen tot elke werker iets heeft (niet meer: wat geclaimd is, moet
  // nog binnen de looptijd af).
  let bezig: Promise<void> | null = null;
  async function vul() {
    while (wachtrij.length < CONCURRENCY && open.size > 0 && Date.now() - started < STOP_MS) {
      const landen = [...open.keys()];
      await claim(landen[beurt++ % landen.length]);
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
      while (true) {
        const t = wachtrij.shift();
        if (!t) {
          // Leeg: wachten op de volgende portie, niet opgeven — anders slinkt
          // de groep werkers telkens een portie kleiner is dan de groep.
          if (open.size === 0 || Date.now() - started >= STOP_MS) return;
          await vulAan();
          continue;
        }
        let emails: string[] = [];
        if (t.website?.trim()) {
          try {
            emails = ((await findEmails(t.website)).emails ?? []).map((e) => e.address);
          } catch {
            /* time-out of netwerk — leeg resultaat */
          }
        }
        // email_found + tijdstempel (= "gescand, ook al vond ik niets").
        const source = sourceFromLand(t.land);
        await db
          .from(source.table)
          .update({ email_found: emails, email_scanned_at: new Date().toISOString() })
          .eq(source.idCol, t.id);
        const tot = totals[t.land];
        tot.scanned++;
        if (emails.length > 0) tot.withEmails++;
        tot.emailsTotal += emails.length;
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
