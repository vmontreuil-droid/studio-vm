import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { findWebsiteForName } from "@/lib/admin/website-discovery";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Probeert per cron-run tot ~100 prospects zonder website,
// 8 parallel, ~3-5s per prospect. Werkt op alle drie de landen.
const BATCH = 100;
const CONCURRENCY = 8;

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const totals: Record<string, { tried: number; found: number }> = {};

  for (const land of ["fr", "uk", "be"] as Land[]) {
    const src = sourceFromLand(land);
    // Pak prospects zonder website, beperkt tot actieve in NACE
    // waar we sowieso voor kiezen — anders verspillen we requests.
    let q = db
      .from(src.table)
      .select(`${src.idCol}, name`)
      .is("website", null)
      .not("name", "is", null)
      .eq(src.statusCol, src.activeValue)
      .limit(BATCH);
    const { data } = await q;
    const rows =
      (data as { [k: string]: string | null }[] | null) ?? [];
    if (rows.length === 0) {
      totals[land] = { tried: 0, found: 0 };
      continue;
    }

    let found = 0;
    let idx = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (true) {
          const i = idx++;
          if (i >= rows.length) return;
          const r = rows[i];
          const name = r.name as string;
          const id = r[src.idCol] as string;
          if (!name) continue;
          try {
            const site = await findWebsiteForName(name, land);
            if (site) {
              await db
                .from(src.table)
                .update({ website: site })
                .eq(src.idCol, id);
              found++;
            }
          } catch {
            /* skip */
          }
        }
      }),
    );

    totals[land] = { tried: rows.length, found };
  }

  return NextResponse.json({ ok: true, totals });
}
