"use server";

// Server-acties en lezingen voor /admin/social en /admin/social/wachtrij.
//
// Alles werkt ook zonder migratie 0050: de nieuwe kolommen (post_type, taal,
// goedkeuring_nodig, media, kanalen, link_post, …) worden dan niet gelezen of
// geschreven. Concept, gepubliceerd en overslaan vallen terug op de oude
// waarden (OUDE_STATUS); goedkeuren kan pas na 0050.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  BUCKET,
  KANALEN_SLEUTEL,
  PUBLISHER_SLEUTEL,
  bevriesBericht,
  leesKanalenStand,
  leesPublisherStand,
  maandBegin,
  supabaseOpslag,
  telLinkberichten,
  vernieuwKanalen,
  type KanalenStand,
  type PublisherStand,
} from "@/lib/social/publish";
import { bufferOrganisatieVast, bufferSleutel, maakBufferDienst } from "@/lib/social/adapters/buffer";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { bewaarGroepen, leesGroepen } from "@/lib/social/groepen";
import {
  ALLES_AUTOMATISCH_SLEUTEL,
  LINK_BUDGET_PER_MAAND,
  brusselsDelen,
  huidigeWeek,
  isOudeDraft,
  leesAllesAutomatisch,
  leesWeekBerichten,
  mediaVoor,
  nieuweVersie,
  parseWeek,
  planWeek,
  socialMigratie,
  utmCampagne,
  vanDatumVeld,
  verschuifWeek,
  weekBereik,
  type MigratieStand,
  type SocialMedia,
} from "@/lib/admin/social-generator";
import { buildSocialDigestMail } from "@/lib/admin/social-mail";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import {
  KANALEN,
  OUDE_STATUS,
  POST_TYPES,
  SOCIAL_BRONNEN,
  STANDAARD_KANALEN,
  TALEN,
  isKanaal,
  isNieuweStatus,
  kanalenVoorPlaats,
  nieuweStatus,
  plaatsSoort,
  type Kanaal,
  type NieuweStatus,
} from "@/lib/admin/social-templates";

export type SocialPost = {
  id: string;
  created_at: string;
  updated_at: string;
  platform: string;
  post_kind: string | null;
  status: string;
  title: string;
  body: string | null;
  hashtags: string | null;
  attachments_json: unknown;
  target_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  scheduled_for: string | null;
  posted_at: string | null;
  posted_url: string | null;
  result_likes: number | null;
  result_comments: number | null;
  result_shares: number | null;
  notes: string | null;
  // Vanaf migratie 0050:
  post_type?: string | null;
  taal?: string | null;
  goedkeuring_nodig?: boolean | null;
  gekeurd_op?: string | null;
  media?: Partial<SocialMedia> | null;
  kanalen?: string[] | null;
  publicatie?: Record<string, unknown> | null;
  link_post?: boolean | null;
  tekst_kort?: string | null;
};

export type SocialStand = { migratie: MigratieStand; allesAutomatisch: boolean };

// =====================================================================
// Hulp
// =====================================================================

async function magBewerken(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

/** Enkel terug naar /admin/social(/wachtrij), met een eenvoudige query. */
function terugPad(fd: FormData): string | null {
  const t = String(fd.get("terug") ?? "");
  return /^\/admin\/social(\/wachtrij|\/groepen)?(\?[\w=&%.-]*)?(#[\w-]*)?$/.test(t) ? t : null;
}

function metMelding(pad: string, melding: string): string {
  const [zonderAnker, anker] = pad.split("#");
  const [p, q] = zonderAnker!.split("?");
  const qs = new URLSearchParams(q ?? "");
  qs.set("melding", melding);
  return `${p}?${qs.toString()}${anker ? `#${anker}` : ""}`;
}

function klaar(fd: FormData, melding?: string): void {
  revalidatePath("/admin/social");
  revalidatePath("/admin/social/wachtrij");
  revalidatePath("/admin/social/groepen");
  const t = terugPad(fd);
  if (t) redirect(melding ? metMelding(t, melding) : t);
}

function tekstVeld(fd: FormData, naam: string, max: number): string | null | undefined {
  if (!fd.has(naam)) return undefined;
  const v = String(fd.get(naam) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
  return v === "" ? null : v;
}

function maandSleutel(iso: string): string {
  const d = brusselsDelen(new Date(iso));
  return `${d.jaar}-${String(d.maand).padStart(2, "0")}`;
}

// =====================================================================
// Lezen
// =====================================================================

export async function getSocialStand(): Promise<SocialStand> {
  if (!(await magBewerken())) return { migratie: { kolommen: false, tokens: false }, allesAutomatisch: false };
  const db = getSupabaseAdmin();
  const [migratie, allesAutomatisch] = await Promise.all([socialMigratie(db), leesAllesAutomatisch(db)]);
  return { migratie, allesAutomatisch };
}

/** De bibliotheek: alle berichten behalve de drafts van de oude dagelijkse machine. */
export async function listSocialPosts(): Promise<SocialPost[]> {
  if (!(await magBewerken())) return [];
  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .or("scheduled_for.not.is.null,notes.is.null,notes.not.like.*auto-engine*,status.in.(gepost,gepubliceerd)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as SocialPost[] | null) ?? [];
}

/** Aantal drafts van de oude dagelijkse machine (nooit gepland, nooit gepost). */
export async function telOudeDrafts(): Promise<number> {
  if (!(await magBewerken())) return 0;
  const { count } = await getSupabaseAdmin()
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .is("scheduled_for", null)
    .like("notes", "%auto-engine%")
    .not("status", "in", "(gepost,gepubliceerd,overgeslagen,gearchiveerd)");
  return count ?? 0;
}

export async function listWeekPosts(week: string): Promise<SocialPost[]> {
  if (!parseWeek(week) || !(await magBewerken())) return [];
  return (await leesWeekBerichten(getSupabaseAdmin(), week)) as SocialPost[];
}

/** Linkberichten per maand ("2026-10" → 1); leeg zonder migratie 0050. */
export async function getLinkBerichten(vanIso: string, totIso: string): Promise<Record<string, number>> {
  if (!(await magBewerken())) return {};
  const { data, error } = await getSupabaseAdmin()
    .from("social_posts")
    .select("scheduled_for")
    .eq("link_post", true)
    .neq("status", "overgeslagen")
    .gte("scheduled_for", vanIso)
    .lt("scheduled_for", totIso)
    .limit(500);
  if (error) return {};
  const uit: Record<string, number> = {};
  for (const r of (data as Array<{ scheduled_for: string | null }> | null) ?? []) {
    if (!r.scheduled_for) continue;
    const k = maandSleutel(r.scheduled_for);
    uit[k] = (uit[k] ?? 0) + 1;
  }
  return uit;
}

// =====================================================================
// Nieuw bericht (handmatig)
// =====================================================================

export async function createSocialPost(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  const db = getSupabaseAdmin();
  const { kolommen } = await socialMigratie(db);

  const plaatsIn = String(formData.get("plaats") ?? "feed");
  const plaats = plaatsIn === "google" || plaatsIn === "story" ? plaatsIn : "feed";
  const taalIn = String(formData.get("taal") ?? "nl");
  const taal = (TALEN as string[]).includes(taalIn) ? taalIn : "nl";
  const typeIn = String(formData.get("post_type") ?? "tip");
  const post_type = (POST_TYPES as string[]).includes(typeIn) ? typeIn : "tip";
  // De gekozen kanalen gelden enkel voor een gewoon bericht. Een Google-bericht
  // gaat enkel naar Google, een story enkel naar de storykanalen, wat er ook
  // aangevinkt stond.
  const toegestaan = kanalenVoorPlaats(plaats);
  const gekozen = formData
    .getAll("kanalen")
    .map(String)
    .filter((k): k is Kanaal => isKanaal(k) && toegestaan.includes(k));
  const kanalen: Kanaal[] = plaats === "feed" && gekozen.length ? gekozen : [...STANDAARD_KANALEN[plaats]];
  const platform = plaats === "google" ? "google" : plaats === "story" ? "instagram" : kanalen[0] ?? "facebook";
  const post_kind = plaats === "story" ? "story" : "page";
  const moment = vanDatumVeld(String(formData.get("datum") ?? ""));
  const target_url = String(formData.get("target_url") ?? "").trim().slice(0, 500) || `/${taal}`;

  const id = crypto.randomUUID();
  const basis = {
    id,
    platform: kolommen ? platform : platform === "google" ? "algemeen" : platform,
    post_kind,
    status: "concept",
    title,
    body: tekstVeld(formData, "body", 5000) ?? null,
    hashtags: tekstVeld(formData, "hashtags", 500) ?? null,
    target_url,
    utm_source: platform,
    utm_medium: platform === "google" ? "gbp" : "social",
    utm_campaign: moment ? utmCampagne(huidigeWeek(moment)) : "handmatig",
    scheduled_for: moment ? moment.toISOString() : null,
    notes: `handmatig · plaats:${plaats}`,
  };
  const extra = kolommen
    ? {
        post_type,
        taal,
        goedkeuring_nodig: true,
        kanalen,
        tekst_kort: tekstVeld(formData, "tekst_kort", 300) ?? null,
        media: mediaVoor(id, nieuweVersie()),
      }
    : {};
  await db.from("social_posts").insert({ ...basis, ...extra });
  klaar(formData, "aangemaakt");
}

// =====================================================================
// Bewerken: tekst, planning, kanalen, linkbericht, resultaten
// =====================================================================

export async function updateSocialPost(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getSupabaseAdmin();
  const { kolommen } = await socialMigratie(db);
  const { data: huidig } = await db.from("social_posts").select("*").eq("id", id).maybeSingle();
  if (!huidig) return;
  const oud = huidig as SocialPost;

  const patch: Record<string, unknown> = {};
  const velden: Array<[string, number]> = [
    ["title", 200],
    ["body", 5000],
    ["hashtags", 500],
    ["target_url", 500],
    ["utm_campaign", 80],
    ["posted_url", 500],
    ["notes", 2000],
  ];
  for (const [veld, max] of velden) {
    const v = tekstVeld(formData, veld, max);
    if (v !== undefined) patch[veld] = veld === "title" && !v ? oud.title : v;
  }
  for (const f of ["result_likes", "result_comments", "result_shares"]) {
    if (formData.has(f)) {
      const n = Math.max(0, Math.round(Number(formData.get(f) ?? 0)));
      patch[f] = Number.isFinite(n) ? n : 0;
    }
  }
  if (formData.has("datum")) {
    const m = vanDatumVeld(String(formData.get("datum") ?? ""));
    patch.scheduled_for = m ? m.toISOString() : null;
  }

  let melding: string | undefined;
  if (kolommen) {
    const kort = tekstVeld(formData, "tekst_kort", 300);
    if (kort !== undefined) patch.tekst_kort = kort;
    const taal = String(formData.get("taal") ?? "");
    if ((TALEN as string[]).includes(taal)) patch.taal = taal;
    const type = String(formData.get("post_type") ?? "");
    if ((POST_TYPES as string[]).includes(type)) patch.post_type = type;
    // Selectievakjes: enkel als het formulier ze echt toonde, en enkel kanalen
    // die bij de plaats horen. Niets aangevinkt = niets veranderen (wie een
    // bericht niet wil publiceren, kiest Overslaan).
    if (formData.has("kanalen_getoond")) {
      const toegestaan = kanalenVoorPlaats(plaatsSoort(oud));
      const k = formData.getAll("kanalen").map(String).filter(isKanaal);
      const nieuw = KANALEN.filter((x) => k.includes(x) && toegestaan.includes(x));
      if (nieuw.length) patch.kanalen = nieuw;
      else melding = "geen-kanaal";
    }
    if (formData.has("link_getoond")) {
      const wil = formData.get("link_post") === "on";
      if (wil && !oud.link_post) {
        const wanneer = (patch.scheduled_for as string | null | undefined) ?? oud.scheduled_for;
        if (wanneer) {
          const maand = maandSleutel(wanneer);
          const { data: links } = await db
            .from("social_posts")
            .select("id, scheduled_for")
            .eq("link_post", true)
            .neq("status", "overgeslagen")
            .neq("id", id)
            .limit(200);
          const telling = ((links as Array<{ scheduled_for: string | null }> | null) ?? []).filter(
            (r) => r.scheduled_for && maandSleutel(r.scheduled_for) === maand,
          ).length;
          if (telling >= LINK_BUDGET_PER_MAAND) melding = "linkbudget";
          else patch.link_post = true;
        } else patch.link_post = true;
      } else if (!wil) patch.link_post = false;
    }
    // Andere tekst of kop → nieuwe beelden (cache breken).
    if (
      (patch.title !== undefined && patch.title !== oud.title) ||
      (patch.body !== undefined && patch.body !== oud.body)
    ) {
      const m = (oud.media ?? {}) as Partial<SocialMedia>;
      const { v: _v, beelden: _b, ...rest } = m;
      void _v;
      void _b;
      patch.media = mediaVoor(id, nieuweVersie(), rest);
    }
  }

  if (Object.keys(patch).length) await db.from("social_posts").update(patch).eq("id", id);
  klaar(formData, melding ?? "opgeslagen");
}

// =====================================================================
// Status: concept → goedgekeurd → (gepland) → gepubliceerd / mislukt / overgeslagen
// =====================================================================

export async function setSocialStatus(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  const gevraagd = String(formData.get("status") ?? "");
  if (!id || !isNieuweStatus(gevraagd)) return;
  const db = getSupabaseAdmin();
  const { kolommen } = await socialMigratie(db);
  const nu = new Date().toISOString();
  const status: NieuweStatus = gevraagd;
  // Vóór 0050 bestaat "goedgekeurd" niet: niet stilletjes "klaar" schrijven
  // (dat leest terug als concept en is geen akkoord voor de publisher).
  const oud = OUDE_STATUS[status];
  if (!kolommen && !oud) {
    klaar(formData, "migratie-nodig");
    return;
  }
  const patch: Record<string, unknown> = { status: kolommen ? status : oud };
  if (status === "gepubliceerd") patch.posted_at = nu;
  if (kolommen && status === "goedgekeurd") patch.gekeurd_op = nu;
  if (kolommen && status === "concept") patch.gekeurd_op = null;
  // Nooit een bericht dat de publisher op dit moment verstuurt ('gepland').
  await db.from("social_posts").update(patch).eq("id", id).neq("status", "gepland");
  // Akkoord: de beelden meteen als vaste JPEG in de publieke bucket zetten,
  // zodat de kanalen een stabiel adres krijgen (na de redirect, blokkeert niets).
  if (kolommen && status === "goedgekeurd") {
    after(async () => {
      try {
        await bevriesBericht(id, { db });
      } catch (e) {
        console.error("[social] bevriezen na akkoord mislukt:", e);
      }
    });
  }
  klaar(formData, status === "goedgekeurd" ? "goedgekeurd" : status === "overgeslagen" ? "overgeslagen" : "status");
}

/**
 * Kanalen die mislukten opnieuw laten proberen (gepubliceerd met fouten, of
 * mislukt). Een nieuw akkoord: kanalen die al gelukt zijn, worden nooit
 * opnieuw verstuurd; de publisher pakt het op bij de volgende run.
 */
export async function probeerOpnieuw(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getSupabaseAdmin();
  const { kolommen } = await socialMigratie(db);
  if (!kolommen) {
    klaar(formData, "migratie-nodig");
    return;
  }
  const { data } = await db
    .from("social_posts")
    .update({ status: "goedgekeurd", gekeurd_op: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["gepubliceerd", "mislukt"])
    .select("id")
    .maybeSingle();
  if (data) {
    after(async () => {
      try {
        await bevriesBericht(id, { db });
      } catch (e) {
        console.error("[social] bevriezen mislukt:", e);
      }
    });
  }
  klaar(formData, data ? "opnieuw" : "status");
}

// =====================================================================
// Kanalen (publisher via Buffer)
// =====================================================================

export type KanalenOverzicht = {
  /** BUFFER_API_KEY staat in de omgeving (de waarde zelf komt nooit hier). */
  sleutel: boolean;
  organisatieVast: boolean;
  migratie: boolean;
  /** Bucket social-media bestaat (null = niet na te gaan). */
  bucket: boolean | null;
  kanalen: KanalenStand;
  publisher: PublisherStand;
  /** Facebook-linkberichten die deze kalendermaand al uitgingen. */
  linkGebruikt: number;
};

export async function getKanalenOverzicht(): Promise<KanalenOverzicht> {
  const leeg: KanalenOverzicht = {
    sleutel: !!bufferSleutel(),
    organisatieVast: !!bufferOrganisatieVast(),
    migratie: false,
    bucket: null,
    kanalen: leesKanalenStand(null),
    publisher: {},
    linkGebruikt: 0,
  };
  if (!(await magBewerken())) return leeg;
  const db = getSupabaseAdmin();
  const opslag = supabaseOpslag(db);
  const [migratie, kanalenJson, standJson, bucket] = await Promise.all([
    socialMigratie(db).then((m) => m.kolommen),
    opslag.leesInstelling(KANALEN_SLEUTEL),
    opslag.leesInstelling(PUBLISHER_SLEUTEL),
    db.storage
      .getBucket(BUCKET)
      .then((r) => !r.error && !!r.data)
      .catch(() => null),
  ]);
  const nu = new Date();
  const linkGebruikt = migratie
    ? telLinkberichten(await opslag.linkRijen(new Date(maandBegin(nu).getTime() - 40 * 86_400_000).toISOString()), nu)
    : 0;
  return {
    ...leeg,
    migratie,
    bucket,
    kanalen: leesKanalenStand(kanalenJson),
    publisher: leesPublisherStand(standJson),
    linkGebruikt,
  };
}

/** "Verbinding testen": sleutel nakijken en alle kanalen (opnieuw) ophalen. */
export async function testKanalen(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const dienst = maakBufferDienst();
  if (!dienst) {
    klaar(formData, "kanalen-geen-sleutel");
    return;
  }
  let melding: string;
  try {
    const r = await vernieuwKanalen({ dienst, opslag: supabaseOpslag() });
    melding = r.test.ok
      ? `kanalen-ok-${r.kanalen.kanalen.filter((k) => !k.weg).length}`
      : r.test.sleutelFout
        ? "kanalen-sleutel"
        : r.test.limiet
          ? "kanalen-limiet"
          : "kanalen-fout";
  } catch (e) {
    console.error("[social] verbinding testen mislukt:", e);
    melding = "kanalen-fout";
  }
  klaar(formData, melding);
}

/** Eén instelling van een kanaal: aan/uit, enkel NL, Pinterest-bord. */
export async function zetKanaalInstelling(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("kanaal") ?? "");
  const veld = String(formData.get("veld") ?? "");
  const waarde = String(formData.get("waarde") ?? "");
  if (!id || !["aan", "alleenNl", "bord"].includes(veld)) return;
  const opslag = supabaseOpslag();
  const stand = leesKanalenStand(await opslag.leesInstelling(KANALEN_SLEUTEL));
  const k = stand.kanalen.find((x) => x.id === id);
  if (!k) {
    klaar(formData, "kanaal-onbekend");
    return;
  }
  if (veld === "aan") k.aan = waarde === "ja";
  else if (veld === "alleenNl") k.alleenNl = waarde === "ja";
  else if (k.borden.some((b) => b.id === waarde)) k.bord = waarde;
  await opslag.bewaarInstelling(KANALEN_SLEUTEL, JSON.stringify(stand));
  klaar(formData, "kanaal-opgeslagen");
}

export async function deleteSocialPost(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("social_posts").delete().eq("id", id);
  klaar(formData, "verwijderd");
}

// =====================================================================
// Contentmachine: week plannen + schakelaar "alles automatisch"
// =====================================================================

export async function planWeekNu(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const w = String(formData.get("week") ?? "");
  const r = await planWeek({ week: parseWeek(w) ? w : undefined });
  if (r.nieuw.length > 0) {
    try {
      const s = await getCompanySettings();
      const mail = buildSocialDigestMail({
        week: r.week,
        berichten: r.weekBerichten,
        links: r.links,
        allesAutomatisch: r.allesAutomatisch,
      });
      await sendMail(s.email || "info@studio-vm.be", mail).catch(() => false);
    } catch {
      // Een mailfout maakt het plannen niet ongedaan.
    }
  }
  klaar(formData, r.fout ? "planfout" : r.nieuw.length ? `gepland-${r.nieuw.length}` : "niets-te-plannen");
}

export async function zetAllesAutomatisch(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const aan = String(formData.get("aan") ?? "") === "ja";
  await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key: ALLES_AUTOMATISCH_SLEUTEL, value: aan ? "ja" : "nee", updated_at: new Date().toISOString() }, { onConflict: "key" });
  klaar(formData, aan ? "auto-aan" : "auto-uit");
}

// =====================================================================
// Statistiek
// =====================================================================

const GEPUBLICEERD = ["gepubliceerd", "gepost"];

export type MonthBucket = {
  month: string; // YYYY-MM
  label: string;
  posts: number;
  engagement: number;
  posted: number;
};

export async function getMonthlyStats(): Promise<MonthBucket[]> {
  if (!(await magBewerken())) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("created_at, posted_at, scheduled_for, status, notes, result_likes, result_comments, result_shares")
    .gte("created_at", since.toISOString())
    .limit(5_000);

  const rows =
    (data as Array<{
      created_at: string;
      posted_at: string | null;
      scheduled_for: string | null;
      status: string;
      notes: string | null;
      result_likes: number | null;
      result_comments: number | null;
      result_shares: number | null;
    }> | null) ?? [];

  const months: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("nl-BE", { month: "short" });
    months.push({ month: ym, label, posts: 0, engagement: 0, posted: 0 });
  }
  for (const r of rows) {
    // Overgeslagen berichten en de oude dagelijkse drafts tellen niet mee.
    if (nieuweStatus(r.status) === "overgeslagen" || isOudeDraft(r)) continue;
    const ym = (r.posted_at ?? r.scheduled_for ?? r.created_at).slice(0, 7);
    const m = months.find((x) => x.month === ym);
    if (!m) continue;
    m.posts += 1;
    if (GEPUBLICEERD.includes(r.status)) m.posted += 1;
    m.engagement += (r.result_likes ?? 0) + (r.result_comments ?? 0) + (r.result_shares ?? 0);
  }
  return months;
}

/** Bezoeken via social per week (laatste 12 weken). Outreach en mails tellen niet mee. */
export async function getSocialClicksPerWeek(): Promise<Array<{ label: string; value: number }>> {
  if (!(await magBewerken())) return [];
  const deze = huidigeWeek(new Date());
  const weken = Array.from({ length: 12 }, (_, i) => verschuifWeek(deze, i - 11));
  const { data } = await getSupabaseAdmin()
    .from("page_views")
    .select("created_at")
    .in("utm_source", SOCIAL_BRONNEN)
    .gte("created_at", weekBereik(weken[0]!).van.toISOString())
    .limit(20_000);
  const telling = new Map(weken.map((w) => [w, 0]));
  for (const r of (data as Array<{ created_at: string }> | null) ?? []) {
    const w = huidigeWeek(new Date(r.created_at));
    if (telling.has(w)) telling.set(w, (telling.get(w) ?? 0) + 1);
  }
  return weken.map((w) => ({ label: `w${Number(w.slice(-2))}`, value: telling.get(w) ?? 0 }));
}

export type PlatformBreakdown = {
  platform: string;
  posts: number;
  posted: number;
  engagement: number;
  clicks: number;
  avgEngagement: number;
};

/** Per kanaal: berichten (via kanalen, anders platform), gepubliceerd, engagement en klikken (30 d). */
export async function getPlatformBreakdown(): Promise<PlatformBreakdown[]> {
  if (!(await magBewerken())) return [];
  const sb = getSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [postsRes, viewsRes] = await Promise.all([
    sb.from("social_posts").select("*").neq("status", "overgeslagen").neq("status", "gearchiveerd").limit(5_000),
    sb.from("page_views").select("utm_source").in("utm_source", SOCIAL_BRONNEN).gte("created_at", since).limit(20_000),
  ]);

  const map = new Map<string, { posts: number; posted: number; engagement: number; clicks: number }>();
  const ensure = (k: string) => {
    let e = map.get(k);
    if (!e) {
      e = { posts: 0, posted: 0, engagement: 0, clicks: 0 };
      map.set(k, e);
    }
    return e;
  };

  for (const p of (postsRes.data as SocialPost[] | null) ?? []) {
    if (isOudeDraft(p)) continue;
    const kanalen = Array.isArray(p.kanalen) && p.kanalen.length ? p.kanalen : [p.platform ?? "algemeen"];
    for (const k of kanalen) {
      const e = ensure(k === "twitter" ? "x" : k);
      e.posts += 1;
      if (GEPUBLICEERD.includes(p.status)) e.posted += 1;
      e.engagement += (p.result_likes ?? 0) + (p.result_comments ?? 0) + (p.result_shares ?? 0);
    }
  }
  for (const v of (viewsRes.data as Array<{ utm_source: string | null }> | null) ?? []) {
    if (!v.utm_source) continue;
    ensure(v.utm_source === "twitter" ? "x" : v.utm_source).clicks += 1;
  }

  return [...map.entries()]
    .map(([platform, x]) => ({
      platform,
      ...x,
      avgEngagement: x.posted > 0 ? Math.round(x.engagement / x.posted) : 0,
    }))
    .sort((a, b) => b.clicks + b.posts - (a.clicks + a.posts));
}

export type TopPost = SocialPost & { _eng: number };

export async function getTopPosts(): Promise<TopPost[]> {
  if (!(await magBewerken())) return [];
  const { data } = await getSupabaseAdmin().from("social_posts").select("*").in("status", GEPUBLICEERD).limit(500);
  const posts = (data as SocialPost[] | null) ?? [];
  return posts
    .map((p) => ({ ...p, _eng: (p.result_likes ?? 0) + (p.result_comments ?? 0) + (p.result_shares ?? 0) }))
    .sort((a, b) => b._eng - a._eng)
    .slice(0, 10);
}

export type UtmStat = {
  source: string;
  campaign: string | null;
  views: number;
  visitors: number;
};

/** Paginaweergaven per social-bron en campagne (laatste 30 dagen). */
export async function getUtmStats(): Promise<UtmStat[]> {
  if (!(await magBewerken())) return [];
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await getSupabaseAdmin()
    .from("page_views")
    .select("utm_source, utm_campaign, visitor_hash")
    .in("utm_source", SOCIAL_BRONNEN)
    .gte("created_at", since)
    .limit(10_000);

  const rows =
    (data as Array<{ utm_source: string | null; utm_campaign: string | null; visitor_hash: string | null }> | null) ?? [];

  const map = new Map<string, { source: string; campaign: string | null; views: number; visitors: Set<string> }>();
  for (const r of rows) {
    if (!r.utm_source) continue;
    const key = `${r.utm_source}|${r.utm_campaign ?? ""}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { source: r.utm_source, campaign: r.utm_campaign, views: 0, visitors: new Set<string>() };
      map.set(key, entry);
    }
    entry.views += 1;
    if (r.visitor_hash) entry.visitors.add(r.visitor_hash);
  }
  return [...map.values()]
    .map((e) => ({ source: e.source, campaign: e.campaign, views: e.views, visitors: e.visitors.size }))
    .sort((a, b) => b.views - a.views);
}

// =====================================================================
// Facebook-groepen (met de hand posten; zie lib/social/groepen)
// =====================================================================

export async function voegGroepToe(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const naam = String(formData.get("naam") ?? "").trim().slice(0, 120);
  let url = String(formData.get("url") ?? "").trim().slice(0, 300);
  const taal = formData.get("taal") === "fr" ? "fr" : "nl";
  if (!naam) return klaar(formData, "groep-fout");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (url && !/^https:\/\/(www\.|m\.)?facebook\.com\//i.test(url)) return klaar(formData, "groep-fout");
  const groepen = await leesGroepen();
  groepen.push({ id: crypto.randomUUID(), naam, url, taal, laatst: null });
  await bewaarGroepen(groepen);
  klaar(formData, "groep-toegevoegd");
}

export async function verwijderGroep(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  await bewaarGroepen((await leesGroepen()).filter((g) => g.id !== id));
  klaar(formData, "groep-verwijderd");
}

/** "Gepost" aanvinken; nog eens klikken op dezelfde dag zet het terug. */
export async function markeerGroepGepost(formData: FormData): Promise<void> {
  if (!(await magBewerken())) return;
  const id = String(formData.get("id") ?? "");
  const terug = formData.get("terugzetten") === "1";
  const groepen = await leesGroepen();
  const g = groepen.find((x) => x.id === id);
  if (!g) return klaar(formData);
  if (terug) {
    g.laatst = g.vorige ?? null;
    g.vorige = null;
  } else {
    g.vorige = g.laatst;
    g.laatst = new Date().toISOString();
  }
  await bewaarGroepen(groepen);
  klaar(formData, terug ? "groep-terug" : "groep-gepost");
}
