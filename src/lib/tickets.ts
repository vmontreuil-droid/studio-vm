// Tickets (Support) — gedeelde types, grenzen en pure hulpfuncties.
//
// Puur en client-veilig: geen server- of databank-imports (enkel type-imports),
// zodat dit bestand zowel in server actions, pagina's als client components
// gebruikt kan worden.
//
// Migratie 0049 voegt kolommen en tabellen toe. Tot die gedraaid is, bestaan
// enkel de oude kolommen (id, client_email, subject, status, created_at,
// updated_at). Alle 0049-velden zijn daarom OPTIONEEL en nullable, en elke
// functie hieronder werkt ook zonder.

import type { Locale } from "@/lib/i18n/config";
import type { ProjectStatus } from "@/lib/projecten";

// ── Soorten, afzenders, status ──────────────────────────────────────────

export type TicketSoort = "vraag" | "revisie" | "machine" | "afspraak" | "intern";
export const TICKET_SOORTEN: TicketSoort[] = ["vraag", "revisie", "machine", "afspraak", "intern"];

/** De soorten die een klant zelf kan kiezen. */
export type KlantSoort = "vraag" | "revisie" | "machine";
export const KLANT_SOORTEN: KlantSoort[] = ["vraag", "revisie", "machine"];

export type Afzender = "klant" | "studio";

/** 'in_behandeling' bestaat enkel nog in oude rijen en telt als open. */
export type TicketStatus = "open" | "in_behandeling" | "gesloten";

/** Wat de klant ziet. */
export type KlantStatus = "wacht_op_studio" | "antwoord_ontvangen" | "gesloten";

export function isTicketSoort(x: unknown): x is TicketSoort {
  return typeof x === "string" && (TICKET_SOORTEN as string[]).includes(x);
}

export function isKlantSoort(x: unknown): x is KlantSoort {
  return typeof x === "string" && (KLANT_SOORTEN as string[]).includes(x);
}

// ── Rijen ───────────────────────────────────────────────────────────────

export type TicketRij = {
  id: string;
  client_email: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  // Vanaf migratie 0049 (ontbreken tot ze gedraaid is):
  nummer?: number | null;
  soort?: TicketSoort | null;
  project_id?: string | null;
  locale?: string | null;
  systeem?: string | null;
  wacht_op?: Afzender | null;
  laatste_bericht_op?: string | null;
  laatste_afzender?: Afzender | null;
  laatste_fragment?: string | null;
  klant_gelezen_op?: string | null;
  studio_gelezen_op?: string | null;
  eerste_antwoord_op?: string | null;
  gesloten_op?: string | null;
  revisie_akkoord_op?: string | null;
  herinnerd_op?: string | null;
  klant_ongelezen?: boolean | null;
  studio_ongelezen?: boolean | null;
};

export type BerichtRij = {
  id: string;
  ticket_id: string;
  sender: Afzender;
  body: string;
  created_at: string;
};

export type BijlageRij = {
  id: string;
  created_at: string;
  ticket_id: string;
  message_id: string | null;
  door: Afzender;
  naam: string;
  pad: string;
  grootte: number | null;
  mime: string | null;
};

/** Interne notitie — NOOIT zichtbaar voor de klant. */
export type NotitieRij = {
  id: string;
  created_at: string;
  ticket_id: string;
  body: string;
};

/** Revisie-uren; tarief_cent = momentopname van de projectcategorie. */
export type UrenRij = {
  id: string;
  created_at: string;
  ticket_id: string;
  project_id: string | null;
  uren: number;
  tarief_cent: number;
  omschrijving: string | null;
  invoice_id: string | null;
  naar_project_op: string | null;
};

/** Eenmalige upload-link voor één bijlage (rechtstreeks naar de privé-opslag). */
export type UploadPlek = { naam: string; pad: string; url: string; grootte: number };

/** Wat de browser na het opladen terugstuurt naar de server action. */
export type GeuploadBestand = { naam: string; pad: string; grootte: number };

// ── Resultaten ──────────────────────────────────────────────────────────

export type TicketFout =
  | "login"
  | "leeg"
  | "te_lang"
  | "niet_gevonden"
  | "gesloten"
  | "te_oud"
  | "project"
  | "revisie_niet_mogelijk"
  | "akkoord"
  | "te_veel"
  | "bijlage_type"
  | "bijlage_groot"
  | "bijlage_aantal"
  | "bijlage_ontbreekt"
  | "opslag"
  | "migratie";

export type ActieResultaat<T = object> = ({ ok: true } & T) | { ok: false; fout: TicketFout };

// ── Grenzen ─────────────────────────────────────────────────────────────

export const MAX_ONDERWERP = 160;
export const MAX_BERICHT = 4000;
export const MAX_BERICHT_STUDIO = 8000;
export const MAX_NOTITIE = 4000;

export const BIJLAGE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB per bestand (limiet van de bucket)
export const BIJLAGE_MAX_AANTAL = 10;

/** Toegelaten extensies (kleine letters, zonder punt): plannen, CAD, machinebestanden, foto's en video's. */
export const BIJLAGE_EXT: readonly string[] = [
  "pdf",
  "dwg",
  "dxf",
  "xml",
  "landxml",
  "zip",
  "7z",
  "rar",
  "png",
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "csv",
  "txt",
  "gsi",
  "ttm",
  "tp3",
  "svd",
  "svl",
  "dc",
  "dsz",
  "ifc",
  "kmz",
  "kml",
  "shp",
  "webp",
  "heic",
  "mp4",
  "mov",
];

/** Waarde voor het accept-attribuut van een bestandsveld. */
export const BIJLAGE_ACCEPT = BIJLAGE_EXT.map((e) => `.${e}`).join(",");

export const HEROPEN_DAGEN = 30;
export const AUTO_SLUIT_DAGEN = 14;
export const MAX_TICKETS_PER_UUR = 5;
export const MAX_BERICHTEN_PER_UUR = 20;

/** Een revisie kan pas vanaf deze projectstatussen. */
export const REVISIE_PROJECTSTATUS: ProjectStatus[] = ["productie", "geleverd", "afgesloten"];

// Onderwerp-voorvoegsels van vóór migratie 0049 (en van de basisstand).
export const PREFIX_REVISIE = "Revisie — ";
export const PREFIX_AFSPRAAK = "[Afspraak] ";

const UUR = 3600000;
const DAG = 24 * UUR;

function ms(nu: number | Date): number {
  return typeof nu === "number" ? nu : nu.getTime();
}

// ── Weergave ────────────────────────────────────────────────────────────

/** "#1001", of vóór de migratie "#" + de eerste 8 tekens van het id. */
export function ticketRef(t: { id: string; nummer?: number | null }): string {
  return t.nummer != null ? `#${t.nummer}` : `#${String(t.id).slice(0, 8)}`;
}

/** Soort van een ticket: de kolom, anders afgeleid uit de oude onderwerp-voorvoegsels. */
export function soortVan(t: { subject?: string | null; soort?: string | null; client_email?: string | null }): TicketSoort {
  if (isTicketSoort(t.soort)) return t.soort;
  const s = String(t.subject ?? "");
  if (s.startsWith(PREFIX_REVISIE)) return "revisie";
  if (s.startsWith(PREFIX_AFSPRAAK.trim())) return "afspraak";
  // Site-meldingen uit /admin/sites (zelfde regel als migratie 0049).
  if ((t.client_email ?? "").toLowerCase() === "info@studio-vm.be" && s.startsWith("[")) return "intern";
  return "vraag";
}

/** Onderwerp zonder de oude Nederlandse voorvoegsels ('Revisie — ', '[Afspraak] '), voor de klant. */
export function toonOnderwerp(t: { subject?: string | null }): string {
  const s = String(t.subject ?? "");
  if (s.startsWith(PREFIX_REVISIE)) return s.slice(PREFIX_REVISIE.length).trim() || s;
  if (s.startsWith(PREFIX_AFSPRAAK.trim())) return s.slice(PREFIX_AFSPRAAK.trim().length).trim() || s;
  return s;
}

/** Eén regel tekst, voor previews (laatste_fragment). */
export function fragmentVan(body: string | null | undefined, max = 200): string {
  return String(body ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// ── Afgeleide toestand ──────────────────────────────────────────────────

/** Bericht met de velden die afgeleid() nodig heeft (een gedeeltelijke select volstaat). */
export type BerichtKern = { ticket_id?: string; sender: string; created_at: string; body?: string | null };

export type TicketAfgeleid = {
  /** Wie is aan zet: 'studio' = wacht op een antwoord van Studio VM, 'klant' = wacht op de klant. */
  wachtOp: Afzender;
  laatsteOp: string;
  laatsteAfzender: Afzender | null;
  fragment: string;
  klantOngelezen: boolean;
  studioOngelezen: boolean;
  gesloten: boolean;
};

/** Een ticketrij of een deel ervan (gedeeltelijke selects zijn goed). */
export type TicketKern = Omit<Partial<TicketRij>, "status"> & { status?: TicketStatus | string | null };

function isAfzender(x: unknown): x is Afzender {
  return x === "klant" || x === "studio";
}

function laatsteBericht(t: TicketKern, berichten?: BerichtKern[] | null): BerichtKern | null {
  let laatste: BerichtKern | null = null;
  for (const b of berichten ?? []) {
    if (t.id && b.ticket_id && b.ticket_id !== t.id) continue;
    if (!laatste || Date.parse(b.created_at) >= Date.parse(laatste.created_at)) laatste = b;
  }
  return laatste;
}

/**
 * Toestand van een ticket. Gebruikt de 0049-kolommen als ze er zijn,
 * anders het laatste bericht (berichten mogen van meerdere tickets zijn:
 * enkel die met hetzelfde ticket_id tellen). 'in_behandeling' telt als open.
 */
export function afgeleid(t: TicketKern, berichten?: BerichtKern[] | null): TicketAfgeleid {
  const gesloten = t.status === "gesloten";
  const laatste = laatsteBericht(t, berichten);
  if (isAfzender(t.wacht_op)) {
    const laatsteAfzender = isAfzender(t.laatste_afzender)
      ? t.laatste_afzender
      : laatste && isAfzender(laatste.sender)
        ? laatste.sender
        : null;
    const laatsteOp = t.laatste_bericht_op ?? laatste?.created_at ?? t.updated_at ?? t.created_at ?? "";
    const gelezen = (op: string | null | undefined) => !!op && !!laatsteOp && Date.parse(op) >= Date.parse(laatsteOp);
    const klantOngelezen =
      typeof t.klant_ongelezen === "boolean"
        ? t.klant_ongelezen
        : laatsteAfzender === "studio" && !gelezen(t.klant_gelezen_op);
    const studioOngelezen =
      typeof t.studio_ongelezen === "boolean"
        ? t.studio_ongelezen
        : laatsteAfzender === "klant" && !gelezen(t.studio_gelezen_op);
    return {
      wachtOp: t.wacht_op,
      laatsteOp,
      laatsteAfzender,
      fragment: t.laatste_fragment ?? fragmentVan(laatste?.body),
      klantOngelezen,
      studioOngelezen,
      gesloten,
    };
  }

  // Basisstand (vóór 0049): alles uit het laatste bericht; 'gelezen' bestaat niet.
  const laatsteAfzender = laatste && isAfzender(laatste.sender) ? laatste.sender : null;
  return {
    wachtOp: laatsteAfzender === "studio" ? "klant" : "studio",
    laatsteOp: laatste?.created_at ?? t.updated_at ?? t.created_at ?? "",
    laatsteAfzender,
    fragment: fragmentVan(laatste?.body),
    klantOngelezen: false,
    studioOngelezen: false,
    gesloten,
  };
}

export function klantStatus(t: TicketKern, berichten?: BerichtKern[] | null): KlantStatus {
  const a = afgeleid(t, berichten);
  if (a.gesloten) return "gesloten";
  return a.wachtOp === "klant" ? "antwoord_ontvangen" : "wacht_op_studio";
}

/** Mag de klant een gesloten ticket nog heropenen (door te antwoorden)? Sluitdatum ≤ 30 dagen geleden. */
export function magHeropenen(
  t: { gesloten_op?: string | null; updated_at?: string | null; created_at?: string | null },
  nu: number | Date = Date.now(),
): boolean {
  const ref = t.gesloten_op ?? t.updated_at ?? t.created_at;
  const sinds = ref ? Date.parse(ref) : NaN;
  if (!Number.isFinite(sinds)) return false;
  return ms(nu) - sinds <= HEROPEN_DAGEN * DAG;
}

/** Volle uren sinds `iso` (0 bij geen of ongeldige datum). */
export function wachtUren(iso: string | null | undefined, nu: number | Date = Date.now()): number {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((ms(nu) - t) / UUR));
}

/** Korte wachttijd voor de admin: "< 1 u", "5 u", "2 d 3 u". */
export function wachtKort(uren: number): string {
  if (uren < 1) return "< 1 u";
  if (uren < 48) return `${uren} u`;
  const d = Math.floor(uren / 24);
  const u = uren % 24;
  return u ? `${d} d ${u} u` : `${d} d`;
}

const DATUM_LOCALE: Record<Locale, string> = {
  nl: "nl-BE",
  fr: "fr-BE",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
};

/** Datum + uur in Brusselse tijd, bv. "3 okt 2026, 14:05". */
export function datumTijd(iso: string | null | undefined, locale: Locale | string = "nl"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(DATUM_LOCALE[locale as Locale] ?? "nl-BE", {
    timeZone: "Europe/Brussels",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Bestandsgrootte in de taal van de lezer: "3,2 MB" (nl/de/es), "3.2 MB" (en),
 * "3,2 Mo" / "120 ko" (fr). 0 = "0 kB"; geen of ongeldige grootte = "".
 */
export function bestandGrootte(b: number | null | undefined, locale: Locale | string = "nl"): string {
  if (b == null || !Number.isFinite(b) || b < 0) return "";
  const taal = DATUM_LOCALE[locale as Locale] ?? "nl-BE";
  const fr = locale === "fr";
  const kb = b === 0 ? 0 : Math.max(1, Math.round(b / 1024));
  if (kb < 1000) return `${kb} ${fr ? "ko" : "kB"}`;
  const mb = (b / 1024 / 1024).toLocaleString(taal, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${mb} ${fr ? "Mo" : "MB"}`;
}

// ── HTML-veilig ─────────────────────────────────────────────────────────

/** Maakt tekst onschadelijk voor HTML (& < > " '). */
export function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** esc() + regeleinden als <br>. */
export function tekstNaarHtml(s: string | null | undefined): string {
  return esc(s).replace(/\r\n|\r|\n/g, "<br>");
}

// ── Bijlagen ────────────────────────────────────────────────────────────

/** Extensie in kleine letters zonder punt ("" als er geen is). */
export function bijlageExt(naam: string): string {
  const i = naam.lastIndexOf(".");
  return i > 0 && i < naam.length - 1 ? naam.slice(i + 1).toLowerCase() : "";
}

/** Controle per bestand: type, leeg, te groot. null = in orde. */
export function bijlageFout(naam: string, grootte: number): TicketFout | null {
  if (typeof naam !== "string" || !naam.trim()) return "bijlage_type";
  if (!BIJLAGE_EXT.includes(bijlageExt(naam.trim()))) return "bijlage_type";
  if (typeof grootte !== "number" || !Number.isFinite(grootte) || grootte <= 0) return "bijlage_ontbreekt";
  if (grootte > BIJLAGE_MAX_BYTES) return "bijlage_groot";
  return null;
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  dwg: "image/vnd.dwg",
  dxf: "image/vnd.dxf",
  xml: "application/xml",
  landxml: "application/xml",
  zip: "application/zip",
  "7z": "application/x-7z-compressed",
  rar: "application/vnd.rar",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  heic: "image/heic",
  csv: "text/csv",
  txt: "text/plain",
  kml: "application/vnd.google-earth.kml+xml",
  kmz: "application/vnd.google-earth.kmz",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** MIME-type volgens de extensie (machine- en CAD-formaten: application/octet-stream). */
export function mimeVoor(naam: string): string {
  return MIME[bijlageExt(naam)] ?? "application/octet-stream";
}

// ── Diversen ────────────────────────────────────────────────────────────

export function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
