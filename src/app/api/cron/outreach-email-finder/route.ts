// Cron-variant van /api/admin/email-batch: pakt aannemers (NACE-filter
// van de outreach-config, of de standaard grondwerk-selectie) met website
// maar zonder email_scanned_at, leest hun contactpagina's en vult
// email_found. Verstuurt niets — leest enkel publieke contactgegevens.
// CRON_SECRET-auth zodat de achtergrond-runner zonder admin-cookie kan.

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { findEmails } from "@/lib/email-finder";
import { sourceFromLand } from "@/lib/admin/prospect-source";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { effectiveNace, prefixVoorLand } from "@/lib/admin/aannemers";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_PER_LAND = 30;
const CONCURRENCY = 5;

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
  const totals: Record<
    string,
    { scanned: number; withEmails: number; emailsTotal: number }
  > = {};

  for (const land of cfg.lands) {
    const source = sourceFromLand(land);

    // Atomic claim — zelfde RPC als de admin-batch, vergrendelt rijen
    // tijdens deze run zodat parallelle calls geen dubbel werk doen.
    // De RPC kent één prefix per oproep → per NACE-prefix claimen tot de
    // batch vol is.
    const rows: { enterprise_number: string; website: string }[] = [];
    const formatted = [...new Set(prefixes.map((p) => prefixVoorLand(p, land)))];
    for (const prefix of formatted) {
      const need = BATCH_PER_LAND - rows.length;
      if (need <= 0) break;
      const { data: claimed } = await db.rpc(source.claimRpc, {
        p_limit: need,
        p_q: null,
        p_postcode: null,
        [source.land === "fr"
          ? "p_ape"
          : source.land === "uk"
            ? "p_sic"
            : "p_nace"]: prefix,
        [source.land === "uk" ? "p_cat" : "p_form"]: null,
        p_active: true,
      });
      rows.push(
        ...((claimed as { enterprise_number: string; website: string }[] | null) ??
          []),
      );
    }

    // Parallel-scan met CONCURRENCY workers.
    type R = { id: string; emails: string[] };
    const results: R[] = new Array(rows.length);
    let idx = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (true) {
          const i = idx++;
          if (i >= rows.length) return;
          const r = rows[i];
          if (!r.website || !r.website.trim()) {
            results[i] = { id: r.enterprise_number, emails: [] };
            continue;
          }
          try {
            const fr = await findEmails(r.website);
            results[i] = {
              id: r.enterprise_number,
              emails: (fr.emails ?? []).map((e) => e.address),
            };
          } catch {
            results[i] = { id: r.enterprise_number, emails: [] };
          }
        }
      }),
    );

    // Bulk-update met email_found + tijdstempel (= "ik heb gescand,
    // ook al vond ik niets" → niet opnieuw scannen).
    const now = new Date().toISOString();
    await Promise.all(
      results.map((res) =>
        db
          .from(source.table)
          .update({ email_found: res.emails, email_scanned_at: now })
          .eq(source.idCol, res.id),
      ),
    );

    totals[land] = {
      scanned: results.length,
      withEmails: results.filter((r) => r.emails.length > 0).length,
      emailsTotal: results.reduce((t, r) => t + r.emails.length, 0),
    };
  }

  return NextResponse.json({ ok: true, nace: prefixes, totals });
}
