import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured, cronSecret } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Bewaartermijn van de bezoekstatistieken (page_views): de privacyverklaring
// belooft maximaal 25 maanden. Deze taak wist rijen die ouder zijn.
//
// Ingepland in vercel.json: de 1e van elke maand om 03:15 UTC. De tabel
// bestaat sinds 22/5/2026: vóór eind juni 2028 is er niets te wissen.
//
// Bewust niet in de publieke tracker (/api/track-pv): wissen hoort enkel
// achter CRON_SECRET.
const BEWAAR_MAANDEN = 25;

export async function GET(req: NextRequest) {
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!adminConfigured) return NextResponse.json({ ok: true, gewist: 0 });

  const grens = new Date();
  grens.setUTCMonth(grens.getUTCMonth() - BEWAAR_MAANDEN);
  const { error, count } = await getSupabaseAdmin()
    .from("page_views")
    .delete({ count: "exact" })
    .lt("created_at", grens.toISOString());
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, grens: grens.toISOString(), gewist: count ?? 0 });
}
