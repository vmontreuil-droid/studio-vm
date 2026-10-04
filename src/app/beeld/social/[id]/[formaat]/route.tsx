// Beeld van een social-bericht, als JPEG, in elk formaat van de afspraak in
// src/lib/social/beeld-url.ts:
//
//   /beeld/social/<post-id>/<og|portrait|square|story|gbp>.jpg?v=<versie>
//   /beeld/social/<post-id>/<formaat>-<n>.jpg?v=<versie>   dia n (1–10) van
//                                                           een carrousel (media.dias)
//
// Publiek en zonder login: platformen (Buffer, Meta, Google) en mailclients
// halen het zonder cookies op. Buiten /api/, want robots.txt blokkeert /api/.
// Enkel lezen uit social_posts. Bericht onbekend of databank niet bereikbaar
// → de neutrale merkkaart (kort bewaard), nooit een fout.

import { SOCIAL_FORMATEN, type SocialFormaat } from "@/lib/social/beeld-url";
import { kaartVoorDia, kaartVoorPost, merkkaartAntwoord, type SocialPostRij } from "@/lib/social/merkkaart";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BESTAND = /^([a-z]+)(?:-([1-9]|10))?\.jpg$/;

async function leesBericht(id: string): Promise<SocialPostRij | null> {
  if (!monitorConfigured || !UUID.test(id)) return null;
  try {
    // select("*"): kolommen die een latere migratie toevoegt (media), breken
    // niets; vóór die migratie is media gewoon afwezig.
    const { data, error } = await getSupabaseAdmin().from("social_posts").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    const tekst = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : null);
    return {
      id: tekst("id"),
      title: tekst("title"),
      body: tekst("body"),
      notes: tekst("notes"),
      post_kind: tekst("post_kind"),
      attachments_json: r.attachments_json,
      media: r.media,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string; formaat: string }> }) {
  const { id, formaat: bestand } = await params;
  const m = BESTAND.exec(bestand);
  // Eigen sleutels: "toString", "constructor" … zijn geen formaat (404).
  if (!m || !Object.hasOwn(SOCIAL_FORMATEN, m[1])) return new Response("Onbekend formaat", { status: 404 });
  const formaat = m[1] as SocialFormaat;
  const dia = m[2] ? Number(m[2]) : null;

  const url = new URL(req.url);
  const post = await leesBericht(id);
  let kaart = kaartVoorPost(post);
  if (dia !== null && post) {
    const d = kaartVoorDia(post, dia);
    if (!d) return new Response("Geen dia met dat nummer", { status: 404, headers: { "cache-control": "public, max-age=60" } });
    kaart = d;
  }
  const cacheControl = !post
    ? "public, max-age=60, s-maxage=300"
    : url.searchParams.has("v")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

  return merkkaartAntwoord(kaart, formaat, { origin: url.origin, cacheControl });
}
