// Projecten (3D-modellen) — gedeeld door klantenportaal en admin.
import type { Locale } from "@/lib/i18n/config";

export type ProjectStatus =
  | "aanvraag"
  | "offerte"
  | "akkoord"
  | "productie"
  | "geleverd"
  | "afgesloten"
  | "geannuleerd";

export type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  client_email: string;
  quote_id: string | null;
  offer_id: string | null;
  invoice_id: string | null;
  titel: string;
  status: ProjectStatus;
  categorie: "vroegtijdig" | "normaal" | "last-minute";
  merken: string[];
  werf: {
    straat?: string;
    postcode?: string;
    gemeente?: string;
    land?: string;
    lat?: number | null;
    lon?: number | null;
  } | null;
  stelsel: { stelsel: string; epsg: string; hoogte: string; opmerking?: string } | null;
  plannen: { naam: string; pad: string; grootte?: number }[];
  geschatte_uren: number | null;
  gewerkte_uren: number | null;
  leverdatum: string | null;
  opmerking: string | null;
};

export type Levering = {
  id: string;
  created_at: string;
  project_id: string;
  versie: number;
  systeem: string;
  naam: string;
  pad: string;
  grootte: number | null;
  opmerking: string | null;
};

// Machinesturingssystemen waarvoor een model geleverd kan worden — gedeeld
// door het publieke aanvraagformulier en de admin.
export const MERKEN = [
  "Trimble GCS900",
  "Trimble Earthworks",
  "Trimble Access",
  "Topcon 3D-MC",
  "Topcon MC-Max",
  "Topcon Pocket-3D",
  "Leica iCON site",
  "Leica MC1",
  "Unicontrol",
  "CHCNAV",
  "Komatsu",
  "Caterpillar",
];

// Leveringen die niet aan één systeem gebonden zijn.
export const NEUTRALE_SYSTEMEN = ["Alle systemen", "LandXML", "DXF"];

/** Hele dagen van vandaag tot `datum` (YYYY-MM-DD); negatief = verlopen. */
export function dagenTot(datum: string, nu: number): number {
  const d = new Date(`${datum}T00:00:00`);
  const vandaag = new Date(nu);
  vandaag.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - vandaag.getTime()) / 86400000);
}

// De stappen die de klant als tijdlijn ziet (geannuleerd valt erbuiten).
export const STAPPEN: ProjectStatus[] = ["aanvraag", "offerte", "akkoord", "productie", "geleverd", "afgesloten"];

export const STATUS_LABEL: Record<ProjectStatus, Record<Locale, string>> = {
  aanvraag: { nl: "Aanvraag ontvangen", fr: "Demande reçue", en: "Request received", de: "Anfrage eingegangen", es: "Solicitud recibida" },
  offerte: { nl: "Offerte verstuurd", fr: "Devis envoyé", en: "Quote sent", de: "Angebot versendet", es: "Presupuesto enviado" },
  akkoord: { nl: "Akkoord", fr: "Accepté", en: "Accepted", de: "Angenommen", es: "Aceptado" },
  productie: { nl: "In productie", fr: "En production", en: "In production", de: "In Produktion", es: "En producción" },
  geleverd: { nl: "Geleverd", fr: "Livré", en: "Delivered", de: "Geliefert", es: "Entregado" },
  afgesloten: { nl: "Afgesloten", fr: "Clôturé", en: "Closed", de: "Abgeschlossen", es: "Cerrado" },
  geannuleerd: { nl: "Geannuleerd", fr: "Annulé", en: "Cancelled", de: "Storniert", es: "Cancelado" },
};

export const CATEGORIE_LABEL: Record<Project["categorie"], Record<Locale, string>> = {
  vroegtijdig: { nl: "Vroegtijdig", fr: "Anticipé", en: "Early", de: "Frühzeitig", es: "Anticipado" },
  normaal: { nl: "Normaal", fr: "Normal", en: "Standard", de: "Standard", es: "Estándar" },
  "last-minute": { nl: "Last-minute", fr: "Urgent", en: "Last-minute", de: "Last-Minute", es: "Urgente" },
};

export function werfTekst(w: Project["werf"]): string {
  if (!w) return "—";
  return [w.straat, [w.postcode, w.gemeente].filter(Boolean).join(" "), w.land].filter(Boolean).join(", ");
}

export function grootteTekst(b?: number | null): string {
  if (!b) return "";
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} kB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/** Leveringen gegroepeerd per versie (nieuwste eerst). */
export function perVersie(lev: Levering[]): { versie: number; items: Levering[] }[] {
  const m = new Map<number, Levering[]>();
  for (const l of lev) (m.get(l.versie) ?? m.set(l.versie, []).get(l.versie)!).push(l);
  return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([versie, items]) => ({ versie, items }));
}

export function statusKleur(s: ProjectStatus): string {
  if (s === "geleverd" || s === "afgesloten") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
  if (s === "geannuleerd") return "bg-stone-500/10 text-muted border-border";
  if (s === "productie" || s === "akkoord") return "bg-blue-500/10 text-blue-500 border-blue-500/30";
  return "bg-accent/10 text-accent border-accent/30";
}

