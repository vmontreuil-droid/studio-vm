// Eén UTM-schema voor alles wat naar studio-vm.be linkt: berichten op
// sociale media, profiel- en biolinks, het Google-bedrijfsprofiel en de
// deelknoppen op de site. De contentmachine, de publisher, de deelknoppen en
// /admin/webactiviteit gebruiken allemaal dit bestand, zodat de cijfers op
// dezelfde labels samenkomen.
//
//   utm_source    waar de klik vandaan komt (platform)       → UTM_BRONNEN
//   utm_medium    wat voor link het is                        → UTM_MEDIA
//   utm_campaign  week van het bericht ("2026-w41") of de vaste plek
//                 van een profiellink ("profiel", "bio", "knop")
//   utm_content   id van het bericht (social_posts.id)
//
// Voorbeelden:
//   bericht op Facebook   facebook / social / 2026-w41 / <post-id>
//   Google-bericht        google / gbp / 2026-w41 / <post-id>
//   websiteveld op GBP    google / gbp / profiel
//   biolink Instagram     instagram / profiel / bio
//   actieknop Facebook    facebook / profiel / knop
//   deelknop WhatsApp     whatsapp / share
//
// Geen URL's in de tekst van een bericht: Facebook telt links in berichten
// én reacties mee voor de linklimiet (Meta One, sept. 2026). De gelabelde
// link hoort in het profiel, de bio of de actieknop.

// Zelfde adres als SITE in lib/seo. Bewust niet van daar ingelezen: seo.ts
// trekt de kennisbank en de beeldkaarten mee, en dit bestand belandt via de
// deelknoppen in de browserbundel.
export const SITE_ADRES = "https://www.studio-vm.be";
const SITE = SITE_ADRES;

export const UTM_BRONNEN = [
  "facebook",
  "instagram",
  "google",
  "youtube",
  "tiktok",
  "pinterest",
  "x",
  "threads",
  "bluesky",
  "whatsapp",
] as const;
export type UtmBron = (typeof UTM_BRONNEN)[number];

export const UTM_MEDIA = ["social", "gbp", "share", "profiel"] as const;
export type UtmMedium = (typeof UTM_MEDIA)[number];

/** Vaste campagnes voor links die niet bij één bericht horen. */
export const PROFIEL_CAMPAGNES = ["profiel", "bio", "knop"] as const;
export type ProfielCampagne = (typeof PROFIEL_CAMPAGNES)[number];

export type Utm = {
  bron: UtmBron;
  medium: UtmMedium;
  /** "2026-w41" (zie utmWeek) of een ProfielCampagne. */
  campagne?: string;
  /** Id van het bericht. */
  inhoud?: string;
};

/** Leesbare naam per bron, voor het beheer. */
export const UTM_BRON_NAAM: Record<UtmBron, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  x: "X",
  threads: "Threads",
  bluesky: "Bluesky",
  whatsapp: "WhatsApp",
};

export const UTM_MEDIUM_NAAM: Record<UtmMedium, string> = {
  social: "Bericht",
  gbp: "Google-bedrijfsprofiel",
  share: "Gedeeld door bezoeker",
  profiel: "Profiel / bio / knop",
};

export function isUtmBron(v: unknown): v is UtmBron {
  return typeof v === "string" && (UTM_BRONNEN as readonly string[]).includes(v);
}

export function isUtmMedium(v: unknown): v is UtmMedium {
  return typeof v === "string" && (UTM_MEDIA as readonly string[]).includes(v);
}

/**
 * Campagnelabel voor de ISO-week van `d`, bv. "2026-w41". Een bericht krijgt
 * de week waarin het verschijnt (scheduled_for), niet die waarin het gemaakt
 * werd.
 */
export function utmWeek(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dag = t.getUTCDay() || 7; // maandag 1 … zondag 7
  t.setUTCDate(t.getUTCDate() + 4 - dag); // donderdag van dezelfde week
  const jaar = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(jaar, 0, 1)) / 86_400_000 + 1) / 7);
  return `${jaar}-w${String(week).padStart(2, "0")}`;
}

/**
 * `url` met de UTM-parameters van `utm`. Bestaande utm_*-parameters gaan
 * eruit, de rest van de query en het #anker blijven staan. Een pad zonder
 * domein ("/nl/offerte") wordt een volledig adres op studio-vm.be.
 */
export function metUtm(url: string, utm: Utm): string {
  const u = new URL(url, SITE);
  for (const k of [...u.searchParams.keys()]) {
    if (k.toLowerCase().startsWith("utm_")) u.searchParams.delete(k);
  }
  u.searchParams.set("utm_source", utm.bron);
  u.searchParams.set("utm_medium", utm.medium);
  if (utm.campagne) u.searchParams.set("utm_campaign", utm.campagne);
  if (utm.inhoud) u.searchParams.set("utm_content", utm.inhoud);
  return u.toString();
}

/**
 * De vaste, gelabelde links die de eigenaar één keer in zijn profielen plakt
 * (websiteveld, bio, actieknop). Zelfde schema als hierboven. Zonder taal in
 * het pad: de site stuurt door naar de taal van de bezoeker (nl/fr/…) en
 * houdt de UTM-parameters daarbij.
 */
export function profielLinks(): { bron: UtmBron; waar: string; url: string }[] {
  const start = "/";
  const offerte = "/offerte";
  const l = (bron: UtmBron, waar: string, pad: string, campagne: ProfielCampagne, medium: UtmMedium = "profiel") => ({
    bron,
    waar,
    url: metUtm(pad, { bron, medium, campagne }),
  });
  return [
    l("facebook", "Websiteveld van de pagina", start, "profiel"),
    l("facebook", "Actieknop (Offerte aanvragen)", offerte, "knop"),
    l("instagram", "Link in bio", offerte, "bio"),
    l("google", "Website in het bedrijfsprofiel", start, "profiel", "gbp"),
    l("youtube", "Link op het kanaal", start, "profiel"),
    l("tiktok", "Link in bio", offerte, "bio"),
    l("pinterest", "Website in het profiel", start, "profiel"),
    l("x", "Website in het profiel", start, "profiel"),
    l("threads", "Link in bio", offerte, "bio"),
    l("bluesky", "Link in bio", offerte, "bio"),
  ];
}

/**
 * Kolom page_views.utm_content komt pas met migratie 0050. Herkent de fout
 * die Supabase geeft zolang die er niet is (insert: PGRST204, select: 42703),
 * zodat code zonder de kolom verder kan.
 */
export function utmContentOntbreekt(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === "PGRST204" || err.code === "42703" || /utm_content/i.test(err.message ?? "");
}

/**
 * Opschoning van één UTM-waarde zoals de tracker ze bewaart: hoogstens 80
 * tekens, enkel letters, cijfers, "_", "-" en ".". Bron, medium en campagne
 * in kleine letters, zodat "Facebook" en "facebook" samen tellen; de inhoud
 * (een bericht-id) blijft zoals hij is.
 */
export function schoneUtm(v: unknown, opts?: { kleineLetters?: boolean }): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).slice(0, 80).replace(/[^a-zA-Z0-9_\-.]/g, "");
  if (opts?.kleineLetters !== false) s = s.toLowerCase();
  return s || null;
}
