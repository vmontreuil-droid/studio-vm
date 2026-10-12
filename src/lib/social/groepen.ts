// "Groepspost van de week": Facebook-groepen laten geen automatisch posten
// toe (Meta sloot de Groups-API in 2024). Hier staat per week en per taal een
// groepsvriendelijke versie van een paginapost klaar om met de hand te
// plakken: zonder hashtags, met een vraag aan de groep, de link apart voor in
// een reactie (utm_medium=groep) en altijd 4 beelden om te downloaden. Elk
// bericht staat er in beide talen (vertaald via zijn sjabloon), zodat u per
// taal de beste kiest. De lijst met groepen houdt bij waar en wanneer er
// laatst gepost werd.

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { weekBereik } from "@/lib/admin/social-generator";
import { SITE_ADRES, metUtm, utmWeek } from "@/lib/utm";
import {
  KANAAL_REGELS,
  beeldPad,
  beeldUrlVoor,
  versieVan,
  zonderHashtags,
  type PostRij,
} from "@/lib/social/publish";
import { GROEP_DIAS, POST_TALEN, postInTaal, postTaal, type PostTaal, type Vertaling } from "@/lib/social/vertaling";

export type GroepTaal = PostTaal;
export const GROEP_TALEN: GroepTaal[] = POST_TALEN;

export type FbGroep = {
  id: string;
  naam: string;
  url: string;
  taal: GroepTaal;
  /** Laatste keer gepost (ISO), null = nog nooit. */
  laatst: string | null;
  /** De datum ervoor, om "Gepost" ongedaan te maken. */
  vorige?: string | null;
};

/** Hoogstens één post per groep per twee weken: anders wordt het spam. */
export const GROEP_RUST_DAGEN = 14;
const GROEPEN_SLEUTEL = "fb_groepen";

export async function leesGroepen(): Promise<FbGroep[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", GROEPEN_SLEUTEL)
    .maybeSingle();
  if (error || !data?.value) return [];
  try {
    const lijst = JSON.parse(String(data.value));
    return Array.isArray(lijst)
      ? lijst.filter((g): g is FbGroep => g && typeof g.id === "string" && typeof g.naam === "string")
      : [];
  } catch {
    return [];
  }
}

export async function bewaarGroepen(groepen: FbGroep[]): Promise<void> {
  await getSupabaseAdmin()
    .from("app_settings")
    .upsert(
      { key: GROEPEN_SLEUTEL, value: JSON.stringify(groepen), updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
}

/** Dagen tot er in deze groep weer gepost mag worden (0 = nu). */
export function dagenTotVrij(g: FbGroep, nu = new Date()): number {
  if (!g.laatst) return 0;
  const verstreken = (nu.getTime() - Date.parse(g.laatst)) / 86_400_000;
  return Math.max(0, Math.ceil(GROEP_RUST_DAGEN - verstreken));
}

const VRAAG: Record<GroepTaal, string> = {
  nl: "Herkenbaar? Hoe pakken jullie dit aan op de werf?",
  fr: "Ça vous parle ? Comment faites-vous sur vos chantiers ?",
  en: "Sound familiar? How do you handle this on site?",
  de: "Kommt Ihnen das bekannt vor? Wie lösen Sie das auf der Baustelle?",
};
const REACTIE: Record<GroepTaal, (dias: boolean) => string> = {
  nl: (dias) => (dias ? "Alle beelden en meer uitleg:" : "Meer uitleg:"),
  fr: (dias) => (dias ? "Toutes les images et plus d'explications :" : "Plus d'explications :"),
  en: (dias) => (dias ? "All images and more details:" : "More details:"),
  de: (dias) => (dias ? "Alle Bilder und mehr Infos:" : "Mehr Infos:"),
};

export type Groepspost = {
  postId: string;
  taal: GroepTaal;
  titel: string;
  soort: string;
  datum: string | null;
  status: string;
  /** Te plakken in de groep. */
  tekst: string;
  /** Te plakken als eerste reactie (de link). */
  reactie: string;
  link: string;
  /** Altijd 4: de hoofdkaart + 3 dia's (zie groepsDias). */
  beelden: { url: string; naam: string }[];
  /** Vertaald uit deze taal (de pagina kreeg de andere versie); null = origineel. */
  vertaaldUit: GroepTaal | null;
};

function metParams(pad: string, params: Record<string, string>): string {
  const q = new URLSearchParams(params).toString();
  return `${SITE_ADRES}${pad}${pad.includes("?") ? "&" : "?"}${q}`;
}

function maakGroepspost(p: PostRij, taal: GroepTaal, vt: Vertaling | null, eigen: GroepTaal): Groepspost {
  const titel = vt ? vt.title : p.title;
  const body = zonderHashtags(((vt ? vt.body : p.body) ?? "").replace(/\r\n/g, "\n").trim() || titel);
  // Een vraagpost eindigt al op een vraag; de andere krijgen er een.
  const tekst = p.post_type === "vraag" ? body : `${body}\n\n${VRAAG[taal]}`;
  const link = metUtm((vt ? vt.doel : p.target_url) || `/${taal}`, {
    bron: "facebook",
    medium: "groep",
    campagne: p.utm_campaign || (p.scheduled_for ? utmWeek(new Date(p.scheduled_for)) : undefined),
    inhoud: p.id,
  });
  const sleutel = KANAAL_REGELS.facebook.beeld ?? "portrait";
  const v = versieVan(p);
  const extra: Record<string, string> = vt ? { taal } : {};
  // Hoofdkaart: de bevroren kopie van het origineel, of de beeldroute in de
  // andere taal. Dia's: altijd via de route (?groep=1 vult aan tot 3).
  const hoofd = vt ? metParams(beeldPad(p.id, sleutel, v), extra) : beeldUrlVoor(p)(sleutel);
  const dias = Array.from({ length: GROEP_DIAS }, (_, i) =>
    metParams(beeldPad(p.id, `${sleutel}-${i + 1}`, v), { ...extra, groep: "1" }),
  );
  return {
    postId: p.id,
    taal,
    titel,
    soort: p.post_type ?? "",
    datum: p.scheduled_for ?? null,
    status: p.status,
    tekst,
    reactie: `${REACTIE[taal](true)} ${link}`,
    link,
    beelden: [hoofd, ...dias].map((url, i) => ({ url, naam: `studio-vm-${taal}-${p.id.slice(0, 8)}-${i + 1}.jpg` })),
    vertaaldUit: vt ? eigen : null,
  };
}

/** Groepsversies van een paginapost: in zijn eigen taal én vertaald. Puur. */
export function groepsversies(p: PostRij): Groepspost[] {
  const eigen: GroepTaal = postTaal(p.notes) ?? (p.taal === "fr" ? "fr" : "nl");
  const uit = [maakGroepspost(p, eigen, null, eigen)];
  for (const ander of GROEP_TALEN) {
    if (ander === eigen) continue;
    const vt = postInTaal(p, ander);
    if (vt) uit.push(maakGroepspost(p, ander, vt, eigen));
  }
  return uit;
}

/**
 * Paginaposts van een week per taal (feed, geen stories of Google), al
 * gepubliceerd eerst: in een groep volgt de post best op die van de pagina.
 */
export async function groepspostenVanWeek(week: string): Promise<Record<GroepTaal, Groepspost[]>> {
  const { van, tot } = weekBereik(week);
  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .eq("post_kind", "page")
    .neq("platform", "google")
    .in("status", ["goedgekeurd", "gepland", "gepubliceerd"])
    .gte("scheduled_for", van.toISOString())
    .lt("scheduled_for", tot.toISOString())
    .order("scheduled_for", { ascending: true });
  const rijen = (data as PostRij[] | null) ?? [];
  const uit: Record<GroepTaal, Groepspost[]> = { nl: [], fr: [], en: [], de: [] };
  for (const r of rijen) for (const g of groepsversies(r)) uit[g.taal].push(g);
  // Voorkeur: een origineel dat al op de pagina stond; daarna op datum.
  const gewicht = (g: Groepspost) => (g.vertaaldUit ? 0 : 2) + (g.status === "gepubliceerd" ? 1 : 0);
  for (const t of GROEP_TALEN) uit[t].sort((a, b) => gewicht(b) - gewicht(a) || (a.datum ?? "").localeCompare(b.datum ?? ""));
  return uit;
}
