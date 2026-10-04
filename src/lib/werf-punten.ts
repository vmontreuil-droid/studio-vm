// Werven-kaart: projecten → kaartpunten. Gedeeld door het klantenportaal en de
// admin (server én browser), daarom bewust zonder "use client".
import { localePath, type Locale } from "@/lib/i18n/config";
import { CATEGORIE_LABEL, STATUS_LABEL, werfTekst, type Project, type ProjectStatus } from "@/lib/projecten";

/** Kleurgroep van een status op de kaart (pin, legende, statuslabel). */
export type WerfGroep = "open" | "bezig" | "klaar" | "grijs";

export const WERF_GROEPEN: WerfGroep[] = ["open", "bezig", "klaar", "grijs"];

export function werfGroep(s: ProjectStatus): WerfGroep {
  if (s === "geleverd" || s === "afgesloten") return "klaar";
  if (s === "akkoord" || s === "productie") return "bezig";
  if (s === "geannuleerd") return "grijs";
  return "open";
}

export type WerfPunt = {
  id: string;
  titel: string;
  status: ProjectStatus;
  statusLabel: string;
  categorie: Project["categorie"];
  categorieLabel: string;
  merken: string[];
  adres: string;
  /** Enkel in de admin: naam van de klant. */
  klant?: string;
  lat: number;
  lon: number;
  href: string;
};

/** Een getal, of een niet-lege tekst met een getal; al de rest (ook "") → null. */
function getal(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Geldige coördinaten van een werf, of null (ontbrekend, leeg, onzin of 0,0). */
export function werfCoordinaten(w: Project["werf"]): { lat: number; lon: number } | null {
  const lat = getal(w?.lat);
  const lon = getal(w?.lon);
  if (lat == null || lon == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;
  return { lat, lon };
}

/**
 * Projecten → punten voor de werven-kaart. Projecten zonder geldige
 * coördinaten vallen weg. Standaard linkt een punt naar de projectpagina in
 * het portaal; de admin geeft een eigen `href` en `klant` mee.
 */
export function werfPunten<P extends Project>(
  projecten: P[],
  locale: Locale,
  opties: { href?: (p: P) => string; klant?: (p: P) => string | undefined } = {},
): WerfPunt[] {
  return projecten.flatMap((p) => {
    const plek = werfCoordinaten(p.werf);
    if (!plek) return [];
    return [
      {
        id: p.id,
        titel: p.titel,
        status: p.status,
        statusLabel: STATUS_LABEL[p.status][locale],
        categorie: p.categorie,
        categorieLabel: CATEGORIE_LABEL[p.categorie][locale],
        merken: p.merken ?? [],
        adres: werfTekst(p.werf),
        klant: opties.klant?.(p) || undefined,
        ...plek,
        href: opties.href ? opties.href(p) : localePath(locale, `/portail/dashboard/projecten/${p.id}`),
      },
    ];
  });
}
