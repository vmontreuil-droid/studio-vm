// "Groepspost van de week": Facebook-groepen laten geen automatisch posten
// toe (Meta sloot de Groups-API in 2024). Hier staat per week en per taal een
// groepsvriendelijke versie van een paginapost klaar om met de hand te
// plakken: zonder hashtags, met een vraag aan de groep, de link apart voor in
// een reactie (utm_medium=groep) en de beelden om te downloaden. De lijst met
// groepen houdt bij waar en wanneer er laatst gepost werd.

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { weekBereik } from "@/lib/admin/social-generator";
import { metUtm, utmWeek } from "@/lib/utm";
import {
  KANAAL_REGELS,
  beeldUrlVoor,
  diaAantal,
  zonderHashtags,
  type PostRij,
} from "@/lib/social/publish";

export type GroepTaal = "nl" | "fr";
export const GROEP_TALEN: GroepTaal[] = ["nl", "fr"];

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
};
const REACTIE: Record<GroepTaal, (dias: boolean) => string> = {
  nl: (dias) => (dias ? "Alle beelden en meer uitleg:" : "Meer uitleg:"),
  fr: (dias) => (dias ? "Toutes les images et plus d'explications :" : "Plus d'explications :"),
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
  beelden: { url: string; naam: string }[];
};

/** Groepsversie van een paginapost. Puur. */
export function groepsversie(p: PostRij & { taal?: string | null; post_type?: string | null }): Groepspost {
  const taal: GroepTaal = p.taal === "fr" ? "fr" : "nl";
  const body = zonderHashtags((p.body ?? "").replace(/\r\n/g, "\n").trim() || p.title);
  // Een vraagpost eindigt al op een vraag; de andere krijgen er een.
  const tekst = p.post_type === "vraag" ? body : `${body}\n\n${VRAAG[taal]}`;
  const link = metUtm(p.target_url || `/${taal}`, {
    bron: "facebook",
    medium: "groep",
    campagne: p.utm_campaign || (p.scheduled_for ? utmWeek(new Date(p.scheduled_for)) : undefined),
    inhoud: p.id,
  });
  const dias = diaAantal(p);
  const sleutel = KANAAL_REGELS.facebook.beeld ?? "portrait";
  const url = beeldUrlVoor(p);
  const sleutels = [sleutel, ...Array.from({ length: dias }, (_, i) => `${sleutel}-${i + 1}`)];
  return {
    postId: p.id,
    taal,
    titel: p.title,
    soort: p.post_type ?? "",
    datum: p.scheduled_for ?? null,
    status: p.status,
    tekst,
    reactie: `${REACTIE[taal](dias > 0)} ${link}`,
    link,
    beelden: sleutels.map((s, i) => ({ url: url(s), naam: `studio-vm-${p.id.slice(0, 8)}-${i + 1}.jpg` })),
  };
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
  const rijen = (data as (PostRij & { taal?: string | null; post_type?: string | null })[] | null) ?? [];
  const uit: Record<GroepTaal, Groepspost[]> = { nl: [], fr: [] };
  for (const r of rijen) {
    const g = groepsversie(r);
    uit[g.taal].push(g);
  }
  for (const t of GROEP_TALEN) {
    uit[t].sort((a, b) => Number(b.status === "gepubliceerd") - Number(a.status === "gepubliceerd"));
  }
  return uit;
}
