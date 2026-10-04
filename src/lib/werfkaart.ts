// Werfkaart (admin, /admin/kaart): projecten → compacte kaartrijen, filters
// lezen en schrijven (querystring), filteren met live tellingen per optie,
// sorteren en CSV. Puur (geen "use client", geen server-only): de server
// maakt de rijen, de browser filtert.
//
// Tijd: alle datums zijn kalenderdagen (YYYY-MM-DD) in Europe/Brussels. De
// server geeft "vandaag" mee, zodat server en browser hetzelfde rekenen.
import { MERKEN, STAPPEN, STATUS_LABEL, CATEGORIE_LABEL, type Project, type ProjectStatus } from "@/lib/projecten";
import { werfCoordinaten } from "@/lib/werf-punten";
import type { ProjectRij } from "@/lib/projecten-overzicht";

export type Categorie = Project["categorie"];
export const CATEGORIEEN: Categorie[] = ["last-minute", "normaal", "vroegtijdig"];
export const ALLE_STATUSSEN: ProjectStatus[] = [...STAPPEN, "geannuleerd"];

/** Status-snelkeuzes: open werk en afgerond. */
export const ACTIEF: ProjectStatus[] = ["aanvraag", "offerte", "akkoord", "productie"];
export const AFGEROND: ProjectStatus[] = ["geleverd", "afgesloten"];
/** Klaar voor de leveringsfilters "te laat" / "binnen 7 dagen". */
const KLAAR: ProjectStatus[] = ["geleverd", "afgesloten", "geannuleerd"];

// ── Provincies (België, afgeleid van de postcode) ───────────────────────────
export type Provincie = "wvl" | "ovl" | "ant" | "lim" | "vbr" | "bru" | "wbr" | "hen" | "nam" | "lui" | "lux";

export const PROVINCIES: { code: Provincie; naam: string }[] = [
  { code: "wvl", naam: "West-Vlaanderen" },
  { code: "ovl", naam: "Oost-Vlaanderen" },
  { code: "ant", naam: "Antwerpen" },
  { code: "lim", naam: "Limburg" },
  { code: "vbr", naam: "Vlaams-Brabant" },
  { code: "bru", naam: "Brussel" },
  { code: "wbr", naam: "Waals-Brabant" },
  { code: "hen", naam: "Henegouwen" },
  { code: "nam", naam: "Namen" },
  { code: "lui", naam: "Luik" },
  { code: "lux", naam: "Luxemburg" },
];
const PROVINCIE_CODES = PROVINCIES.map((p) => p.code);
export const provincieNaam = (c: Provincie) => PROVINCIES.find((p) => p.code === c)?.naam ?? c;

/** Belgische provincie (of Brussel) van een postcode; null als die niet klopt. */
export function provincieVan(postcode: string | null | undefined): Provincie | null {
  const m = String(postcode ?? "").trim().match(/^(?:B-?)?(\d{4})$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1000) return null;
  if (n < 1300) return "bru";
  if (n < 1500) return "wbr";
  if (n < 2000) return "vbr";
  if (n < 3000) return "ant";
  if (n < 3500) return "vbr";
  if (n < 4000) return "lim";
  if (n < 5000) return "lui";
  if (n < 6000) return "nam";
  if (n < 6600) return "hen";
  if (n < 7000) return "lux";
  if (n < 8000) return "hen";
  if (n < 9000) return "wvl";
  return "ovl";
}

// ── Landen ─────────────────────────────────────────────────────────────────
/** Sleutel voor projecten zonder (geldig) land. */
export const ONBEKEND = "onbekend";
/** Sleutel voor "geen systeem" en "geen stelsel". */
export const GEEN = "geen";

let landNamen: Intl.DisplayNames | null = null;
export function landNaam(code: string): string {
  if (!code || code === ONBEKEND) return "Onbekend land";
  try {
    landNamen ??= new Intl.DisplayNames(["nl"], { type: "region" });
    return landNamen.of(code) ?? code;
  } catch {
    return code;
  }
}

// ── Datums (kalenderdagen, Europe/Brussels) ────────────────────────────────
const DAG = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });

/** Kalenderdag (YYYY-MM-DD) in Brussel van een tijdstip. */
export function dagVan(t: number | string): string {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? "" : DAG.format(d);
}

const ISO_DAG = /^\d{4}-\d{2}-\d{2}$/;
/** Bestaande kalenderdag in de vorm YYYY-MM-DD? */
export function isDag(s: string): boolean {
  if (!ISO_DAG.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
const dagNr = (s: string) => Date.parse(`${s}T00:00:00Z`) / 86400000;
const dagPlus = (s: string, n: number) => new Date((dagNr(s) + n) * 86400000).toISOString().slice(0, 10);
/** Hele dagen van `van` tot `tot` (negatief = `tot` ligt ervoor). */
export const dagenTussen = (van: string, tot: string) => Math.round(dagNr(tot) - dagNr(van));

// ── Rijen ──────────────────────────────────────────────────────────────────
export type Factuur = "betaald" | "open" | "geen";
export const FACTUREN: Factuur[] = ["betaald", "open", "geen"];
export type Levering = "telaat" | "week" | "maand" | "geen";
export const LEVERINGEN: Levering[] = ["telaat", "week", "maand", "geen"];
export type Periode = "30d" | "jaar" | "12m" | "eigen";
export const PERIODES: Periode[] = ["30d", "jaar", "12m", "eigen"];
export type Sortering = "nieuw" | "oud" | "levering" | "titel" | "klant";
export const SORTERINGEN: Sortering[] = ["nieuw", "oud", "levering", "titel", "klant"];

/** Eén project zoals de werfkaart het nodig heeft (klein en serialiseerbaar). */
export type KaartProject = {
  id: string;
  titel: string;
  status: ProjectStatus;
  categorie: Categorie;
  merken: string[];
  klant: string;
  /** E-mailadres van de klant, kleine letters (ook de sleutel van de klantfilter). */
  email: string;
  straat: string;
  postcode: string;
  gemeente: string;
  /** ISO-landcode (BE, NL, FR …) of "" als onbekend. */
  land: string;
  provincie: Provincie | null;
  lat: number | null;
  lon: number | null;
  stelsel: string;
  epsg: string;
  /** Kalenderdag van aanmaak (Brussel). */
  aangemaakt: string;
  leverdatum: string | null;
  factuur: Factuur;
  /** Status van de factuur zoals in de facturatie (open, vervallen …). */
  factuurStatus: string | null;
  offerte: boolean;
};

/** Serverkant: projectrij (met klant en factuur) → kaartproject. */
export function naarKaartProject(r: ProjectRij): KaartProject {
  const w = r.werf ?? {};
  const plek = werfCoordinaten(r.werf);
  const land = String(w.land ?? "").trim().toUpperCase();
  const geldigLand = /^[A-Z]{2}$/.test(land) ? land : "";
  const lever = r.leverdatum ? String(r.leverdatum).slice(0, 10) : null;
  return {
    id: r.id,
    titel: r.titel || "Zonder titel",
    status: r.status,
    categorie: r.categorie,
    merken: Array.isArray(r.merken) ? r.merken.filter((m) => typeof m === "string" && m.trim()) : [],
    klant: r.klant || r.client_email || "",
    email: (r.client_email ?? "").trim().toLowerCase(),
    straat: String(w.straat ?? "").trim(),
    postcode: String(w.postcode ?? "").trim(),
    gemeente: String(w.gemeente ?? "").trim(),
    land: geldigLand,
    provincie: geldigLand === "BE" ? provincieVan(w.postcode) : null,
    lat: plek?.lat ?? null,
    lon: plek?.lon ?? null,
    stelsel: String(r.stelsel?.stelsel ?? "").trim(),
    epsg: String(r.stelsel?.epsg ?? "").trim(),
    aangemaakt: dagVan(r.created_at),
    leverdatum: lever && isDag(lever) ? lever : null,
    factuur: r.betaald ? "betaald" : r.factuurStatus ? "open" : "geen",
    factuurStatus: r.factuurStatus,
    offerte: r.offerte,
  };
}

export const heeftLocatie = (p: KaartProject) => p.lat != null && p.lon != null;
export const stelselSleutel = (p: KaartProject) => (p.epsg || p.stelsel || GEEN).replace(/,/g, " ");
export const landSleutel = (p: KaartProject) => p.land || ONBEKEND;
export const adresVan = (p: KaartProject) =>
  [p.straat, [p.postcode, p.gemeente].filter(Boolean).join(" "), p.land].filter(Boolean).join(", ");

/** Kleine letters, zonder accenten (zoeken op "liege" vindt "Liège"). */
export function normaal(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Rij met wat het filteren nodig heeft, één keer berekend. */
export type Rij = KaartProject & {
  zoek: string;
  stelselSleutel: string;
  landSleutel: string;
  /** Dagen tot de leverdatum (negatief = verlopen), null zonder datum. */
  dagen: number | null;
  klaar: boolean;
  locatie: boolean;
  /** Plaats in de oorspronkelijke volgorde (nieuwste eerst). */
  volgorde: number;
};

export function voorbereid(ps: KaartProject[], vandaag: string): Rij[] {
  return ps.map((p, i) => ({
    ...p,
    zoek: normaal([p.titel, p.straat, p.postcode, p.gemeente, p.klant, p.email].join(" \u0001 ")),
    stelselSleutel: stelselSleutel(p),
    landSleutel: landSleutel(p),
    dagen: p.leverdatum ? dagenTussen(vandaag, p.leverdatum) : null,
    klaar: KLAAR.includes(p.status),
    locatie: heeftLocatie(p),
    volgorde: i,
  }));
}

// ── Keuzes die in de gegevens voorkomen ────────────────────────────────────
export type KlantOptie = { email: string; naam: string };
export type StelselOptie = { sleutel: string; naam: string; epsg: string };

export type Opties = {
  /** MERKEN eerst (vaste volgorde), dan andere namen uit de gegevens. */
  systemen: string[];
  klanten: KlantOptie[];
  stelsels: StelselOptie[];
  landen: string[];
  provincies: Provincie[];
};

export function optiesVan(ps: KaartProject[]): Opties {
  const merkSet = new Set<string>();
  const klant = new Map<string, Map<string, number>>();
  const stelsels = new Map<string, StelselOptie>();
  const landen = new Set<string>();
  const provs = new Set<Provincie>();
  for (const p of ps) {
    for (const m of p.merken) merkSet.add(m);
    if (p.email) {
      const namen = klant.get(p.email) ?? klant.set(p.email, new Map()).get(p.email)!;
      namen.set(p.klant, (namen.get(p.klant) ?? 0) + 1);
    }
    const s = stelselSleutel(p);
    if (!stelsels.has(s)) stelsels.set(s, { sleutel: s, naam: s === GEEN ? "" : p.stelsel, epsg: p.epsg });
    landen.add(landSleutel(p));
    if (p.provincie) provs.add(p.provincie);
  }
  const extra = [...merkSet].filter((m) => !MERKEN.includes(m)).sort((a, b) => a.localeCompare(b, "nl"));
  const nl = (a: string, b: string) => a.localeCompare(b, "nl", { sensitivity: "base", numeric: true });
  return {
    systemen: [...MERKEN, ...extra],
    // Naam: de vaakst gebruikte naam die geen e-mailadres is.
    klanten: [...klant.entries()]
      .map(([email, namen]) => {
        const beste = [...namen.entries()].sort((a, b) => Number(a[0] === email) - Number(b[0] === email) || b[1] - a[1])[0];
        return { email, naam: beste?.[0] || email };
      })
      .sort((a, b) => nl(a.naam, b.naam)),
    stelsels: [...stelsels.values()].sort((a, b) =>
      a.sleutel === GEEN ? 1 : b.sleutel === GEEN ? -1 : nl(a.naam || a.epsg, b.naam || b.epsg),
    ),
    // België, Nederland, Frankrijk vooraan; dan alfabetisch; onbekend achteraan.
    landen: [...landen].sort((a, b) => {
      const rang = (x: string) => (x === ONBEKEND ? 99 : ["BE", "NL", "FR", "LU", "DE"].indexOf(x) + 1 || 50);
      return rang(a) - rang(b) || nl(landNaam(a), landNaam(b));
    }),
    provincies: PROVINCIE_CODES.filter((c) => provs.has(c)),
  };
}

// ── Filters ────────────────────────────────────────────────────────────────
export type Filters = {
  q: string;
  status: ProjectStatus[];
  urg: Categorie[];
  systeem: string[];
  klant: string;
  stelsel: string[];
  land: string[];
  prov: Provincie[];
  periode: Periode | "";
  van: string;
  tot: string;
  levering: Levering[];
  factuur: Factuur[];
  offerte: "" | "ja" | "nee";
  locatie: "" | "met" | "zonder";
  sort: Sortering;
};

export const GEEN_FILTERS: Filters = {
  q: "",
  status: [],
  urg: [],
  systeem: [],
  klant: "",
  stelsel: [],
  land: [],
  prov: [],
  periode: "",
  van: "",
  tot: "",
  levering: [],
  factuur: [],
  offerte: "",
  locatie: "",
  sort: "nieuw",
};

type Lezer = { getAll(k: string): string[] };

/**
 * Querystring → filters. Onbekende sleutels en waarden vallen stil weg, de
 * volgorde wordt vast (zelfde selectie = zelfde adres). Lijsten mogen
 * komma-gescheiden of herhaald (?status=a,b of ?status=a&status=b).
 */
export function leesFilters(sp: Lezer, o: Opties): Filters {
  const lijst = (k: string) =>
    sp
      .getAll(k)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 100);
  const binnen = <T extends string>(k: string, toegestaan: readonly T[]): T[] => {
    const gekozen = new Set(lijst(k));
    return toegestaan.filter((x) => gekozen.has(x));
  };
  const een = <T extends string>(k: string, toegestaan: readonly T[]): T | "" => {
    const v = sp.getAll(k)[0]?.trim() ?? "";
    return (toegestaan as readonly string[]).includes(v) ? (v as T) : "";
  };
  const klant = (sp.getAll("klant")[0] ?? "").trim().toLowerCase();
  const periode = een("periode", PERIODES);
  let van = (sp.getAll("van")[0] ?? "").trim();
  let tot = (sp.getAll("tot")[0] ?? "").trim();
  van = periode === "eigen" && isDag(van) ? van : "";
  tot = periode === "eigen" && isDag(tot) ? tot : "";
  if (van && tot && van > tot) [van, tot] = [tot, van];
  return {
    q: (sp.getAll("q")[0] ?? "").replace(/\s+/g, " ").trim().slice(0, 100),
    status: binnen("status", ALLE_STATUSSEN),
    urg: binnen("urg", CATEGORIEEN),
    systeem: binnen("systeem", [...o.systemen, GEEN]),
    klant: o.klanten.some((k) => k.email === klant) ? klant : "",
    stelsel: binnen("stelsel", o.stelsels.map((s) => s.sleutel)),
    land: binnen("land", o.landen),
    prov: binnen("prov", o.provincies),
    periode,
    van,
    tot,
    levering: binnen("levering", LEVERINGEN),
    factuur: binnen("factuur", FACTUREN),
    offerte: een("offerte", ["ja", "nee"] as const),
    locatie: een("locatie", ["met", "zonder"] as const),
    sort: een("sort", SORTERINGEN) || "nieuw",
  };
}

// Leesbaar adres: ":" en "@" mogen onvercijferd in een querystring, spatie = "+".
const codeer = (v: string) => encodeURIComponent(v).replace(/%20/g, "+").replace(/%3A/gi, ":").replace(/%40/g, "@");

/** Filters → querystring (zonder "?"), enkel wat afwijkt van de standaard. */
export function schrijfFilters(f: Filters): string {
  const delen: string[] = [];
  const zet = (k: string, v: string | string[]) => {
    const w = Array.isArray(v) ? v.map(codeer).join(",") : codeer(v);
    if (w) delen.push(`${k}=${w}`);
  };
  zet("q", f.q.trim());
  zet("status", f.status);
  zet("urg", f.urg);
  zet("systeem", f.systeem);
  zet("klant", f.klant);
  zet("stelsel", f.stelsel);
  zet("land", f.land);
  zet("prov", f.prov);
  zet("periode", f.periode);
  if (f.periode === "eigen") {
    zet("van", f.van);
    zet("tot", f.tot);
  }
  zet("levering", f.levering);
  zet("factuur", f.factuur);
  zet("offerte", f.offerte);
  zet("locatie", f.locatie);
  if (f.sort !== "nieuw") zet("sort", f.sort);
  return delen.join("&");
}

/** Facetten: elk filteronderdeel apart (voor de tellingen "wat als"). */
const FACETTEN = ["q", "status", "urg", "systeem", "klant", "stelsel", "regio", "periode", "levering", "factuur", "offerte", "locatie"] as const;
export type Facet = (typeof FACETTEN)[number];

/** Aantal actieve facetten (zoeken telt mee, sorteren niet). */
export function aantalActief(f: Filters): number {
  return actieveFacetten(f).length;
}
export function actieveFacetten(f: Filters): Facet[] {
  const aan: Record<Facet, boolean> = {
    q: !!f.q.trim(),
    status: f.status.length > 0,
    urg: f.urg.length > 0,
    systeem: f.systeem.length > 0,
    klant: !!f.klant,
    stelsel: f.stelsel.length > 0,
    regio: f.land.length + f.prov.length > 0,
    periode: !!f.periode && (f.periode !== "eigen" || !!(f.van || f.tot)),
    levering: f.levering.length > 0,
    factuur: f.factuur.length > 0,
    offerte: !!f.offerte,
    locatie: !!f.locatie,
  };
  return FACETTEN.filter((k) => aan[k]);
}

/** Begin (en einde) van de aanmaakperiode; leeg = geen grens. */
export function periodeGrenzen(f: Pick<Filters, "periode" | "van" | "tot">, vandaag: string): { van: string; tot: string } {
  switch (f.periode) {
    case "30d":
      // Vandaag en de 29 dagen ervoor.
      return { van: dagPlus(vandaag, -29), tot: "" };
    case "jaar":
      return { van: `${vandaag.slice(0, 4)}-01-01`, tot: "" };
    case "12m": {
      // Sinds dezelfde dag vorig jaar (29 februari → 28 februari).
      const vorigJaar = `${Number(vandaag.slice(0, 4)) - 1}${vandaag.slice(4)}`;
      return { van: isDag(vorigJaar) ? vorigJaar : dagPlus(vorigJaar.slice(0, 8) + "01", 27), tot: "" };
    }
    case "eigen":
      return { van: f.van, tot: f.tot };
    default:
      return { van: "", tot: "" };
  }
}

const binnenPeriode = (dag: string, g: { van: string; tot: string }) =>
  (!g.van || dag >= g.van) && (!g.tot || dag <= g.tot);

export function levert(r: Rij, l: Levering, vandaag: string): boolean {
  switch (l) {
    case "telaat":
      return r.dagen != null && r.dagen < 0 && !r.klaar;
    case "week":
      return r.dagen != null && r.dagen >= 0 && r.dagen <= 7 && !r.klaar;
    case "maand":
      return !!r.leverdatum && r.leverdatum.slice(0, 7) === vandaag.slice(0, 7);
    case "geen":
      return !r.leverdatum;
  }
}

export type Tellingen = {
  status: Record<string, number>;
  urg: Record<string, number>;
  systeem: Record<string, number>;
  klant: Record<string, number>;
  stelsel: Record<string, number>;
  land: Record<string, number>;
  prov: Record<string, number>;
  periode: Record<string, number>;
  levering: Record<string, number>;
  factuur: Record<string, number>;
  offerte: { alle: number; ja: number; nee: number };
  locatie: { alle: number; met: number; zonder: number };
};

const plus = (r: Record<string, number>, k: string) => {
  r[k] = (r[k] ?? 0) + 1;
};

/**
 * Filteren + tellingen. Een telling naast een keuze = hoeveel projecten er
 * zouden overblijven met al de andere filters (de keuze zelf meegerekend):
 * klassieke facettentelling. Keuzes binnen één filter zijn OF, filters
 * onderling EN. Land en provincie vormen samen één filter (OF): een land
 * kiezen is het hele land, een provincie enkel die provincie.
 */
export function filterRijen(rijen: Rij[], f: Filters, vandaag: string): { resultaat: Rij[]; tel: Tellingen } {
  const woorden = normaal(f.q).split(/\s+/).filter(Boolean);
  const periode = periodeGrenzen(f, vandaag);
  const presets = {
    "30d": periodeGrenzen({ periode: "30d", van: "", tot: "" }, vandaag),
    jaar: periodeGrenzen({ periode: "jaar", van: "", tot: "" }, vandaag),
    "12m": periodeGrenzen({ periode: "12m", van: "", tot: "" }, vandaag),
  };
  const tel: Tellingen = {
    status: {},
    urg: {},
    systeem: {},
    klant: {},
    stelsel: {},
    land: {},
    prov: {},
    periode: {},
    levering: {},
    factuur: {},
    offerte: { alle: 0, ja: 0, nee: 0 },
    locatie: { alle: 0, met: 0, zonder: 0 },
  };
  const resultaat: Rij[] = [];

  const tellen = (r: Rij, facet: Facet) => {
    switch (facet) {
      case "status":
        return plus(tel.status, r.status);
      case "urg":
        return plus(tel.urg, r.categorie);
      case "systeem":
        if (!r.merken.length) plus(tel.systeem, GEEN);
        for (const m of new Set(r.merken)) plus(tel.systeem, m);
        return;
      case "klant":
        return r.email ? plus(tel.klant, r.email) : undefined;
      case "stelsel":
        return plus(tel.stelsel, r.stelselSleutel);
      case "regio":
        plus(tel.land, r.landSleutel);
        if (r.landSleutel === "BE" && r.provincie) plus(tel.prov, r.provincie);
        return;
      case "periode":
        plus(tel.periode, "alles");
        for (const [k, g] of Object.entries(presets)) if (binnenPeriode(r.aangemaakt, g)) plus(tel.periode, k);
        if (f.periode === "eigen" && binnenPeriode(r.aangemaakt, periode)) plus(tel.periode, "eigen");
        return;
      case "levering":
        for (const l of LEVERINGEN) if (levert(r, l, vandaag)) plus(tel.levering, l);
        return;
      case "factuur":
        return plus(tel.factuur, r.factuur);
      case "offerte":
        tel.offerte.alle++;
        if (r.offerte) tel.offerte.ja++;
        else tel.offerte.nee++;
        return;
      case "locatie":
        tel.locatie.alle++;
        if (r.locatie) tel.locatie.met++;
        else tel.locatie.zonder++;
        return;
    }
  };

  for (const r of rijen) {
    const mis: Facet[] = [];
    if (woorden.length && !woorden.every((w) => r.zoek.includes(w))) mis.push("q");
    if (f.status.length && !f.status.includes(r.status)) mis.push("status");
    if (f.urg.length && !f.urg.includes(r.categorie)) mis.push("urg");
    if (f.systeem.length && !(r.merken.length ? r.merken.some((m) => f.systeem.includes(m)) : f.systeem.includes(GEEN)))
      mis.push("systeem");
    if (f.klant && r.email !== f.klant) mis.push("klant");
    if (f.stelsel.length && !f.stelsel.includes(r.stelselSleutel)) mis.push("stelsel");
    if (
      (f.land.length || f.prov.length) &&
      !f.land.includes(r.landSleutel) &&
      !(r.landSleutel === "BE" && r.provincie && f.prov.includes(r.provincie))
    )
      mis.push("regio");
    if (f.periode && !binnenPeriode(r.aangemaakt, periode)) mis.push("periode");
    if (f.levering.length && !f.levering.some((l) => levert(r, l, vandaag))) mis.push("levering");
    if (f.factuur.length && !f.factuur.includes(r.factuur)) mis.push("factuur");
    if (f.offerte && (f.offerte === "ja") !== r.offerte) mis.push("offerte");
    if (f.locatie && (f.locatie === "met") !== r.locatie) mis.push("locatie");

    if (mis.length === 0) {
      resultaat.push(r);
      for (const facet of FACETTEN) tellen(r, facet);
    } else if (mis.length === 1) {
      tellen(r, mis[0]);
    }
  }
  return { resultaat, tel };
}

export function sorteer(rijen: Rij[], s: Sortering): Rij[] {
  const nl = (a: string, b: string) => a.localeCompare(b, "nl", { sensitivity: "base", numeric: true });
  const op = [...rijen];
  switch (s) {
    case "oud":
      return op.sort((a, b) => b.volgorde - a.volgorde);
    case "levering":
      return op.sort(
        (a, b) =>
          (a.leverdatum ? 0 : 1) - (b.leverdatum ? 0 : 1) ||
          (a.leverdatum ?? "").localeCompare(b.leverdatum ?? "") ||
          a.volgorde - b.volgorde,
      );
    case "titel":
      return op.sort((a, b) => nl(a.titel, b.titel) || a.volgorde - b.volgorde);
    case "klant":
      return op.sort((a, b) => nl(a.klant, b.klant) || nl(a.titel, b.titel) || a.volgorde - b.volgorde);
    default:
      return op.sort((a, b) => a.volgorde - b.volgorde);
  }
}

// ── Land/provincie als boom ────────────────────────────────────────────────
/** België aan/uit: het hele land (wist de losse provincies). */
export function wisselLand(f: Filters, land: string): Pick<Filters, "land" | "prov"> {
  if (f.land.includes(land)) return { land: f.land.filter((x) => x !== land), prov: f.prov };
  return { land: [...f.land, land], prov: land === "BE" ? [] : f.prov };
}

/**
 * Provincie aan/uit. Staat heel België aan, dan blijven de andere provincies
 * aan; staan alle provincies aan, dan wordt het weer "heel België".
 */
export function wisselProvincie(f: Filters, prov: Provincie, alle: Provincie[]): Pick<Filters, "land" | "prov"> {
  if (f.land.includes("BE")) {
    return { land: f.land.filter((x) => x !== "BE"), prov: alle.filter((p) => p !== prov) };
  }
  const nieuw = f.prov.includes(prov) ? f.prov.filter((p) => p !== prov) : [...f.prov, prov];
  if (alle.length > 1 && alle.every((p) => nieuw.includes(p))) return { land: [...f.land, "BE"], prov: [] };
  return { land: f.land, prov: PROVINCIE_CODES.filter((c) => nieuw.includes(c)) };
}

// ── Teksten (admin, Nederlands) ────────────────────────────────────────────
export const LEVERING_LABEL: Record<Levering, string> = {
  telaat: "Te laat",
  week: "Binnen 7 dagen",
  maand: "Deze maand",
  geen: "Zonder leverdatum",
};
export const FACTUUR_LABEL: Record<Factuur, string> = {
  betaald: "Betaald",
  open: "Factuur open",
  geen: "Geen factuur",
};
export const PERIODE_LABEL: Record<Periode, string> = {
  "30d": "Laatste 30 dagen",
  jaar: "Dit jaar",
  "12m": "Laatste 12 maanden",
  eigen: "Eigen periode",
};
export const SORTERING_LABEL: Record<Sortering, string> = {
  nieuw: "Nieuwste eerst",
  oud: "Oudste eerst",
  levering: "Leverdatum",
  titel: "Titel A–Z",
  klant: "Klant A–Z",
};
export const stelselLabel = (s: StelselOptie) =>
  s.sleutel === GEEN ? "Geen stelsel" : s.naam && s.epsg ? `${s.naam} · ${s.epsg.replace(/^EPSG:/i, "")}` : s.naam || s.epsg;

const datumNl = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

/** Actieve filters als losse labels (pillen boven de kaart op een gsm). */
export function filterPillen(f: Filters, o: Opties): { facet: Facet; label: string }[] {
  const uit: { facet: Facet; label: string }[] = [];
  const lijst = (xs: string[], max = 2) => (xs.length > max ? `${xs.slice(0, max).join(", ")} +${xs.length - max}` : xs.join(", "));
  if (f.q.trim()) uit.push({ facet: "q", label: `“${f.q.trim()}”` });
  if (f.status.length) {
    const naam =
      sameSet(f.status, ACTIEF) ? "Actief" : sameSet(f.status, AFGEROND) ? "Afgerond" : lijst(f.status.map((s) => STATUS_LABEL[s].nl));
    uit.push({ facet: "status", label: naam });
  }
  if (f.urg.length) uit.push({ facet: "urg", label: lijst(f.urg.map((c) => CATEGORIE_LABEL[c].nl)) });
  if (f.systeem.length) uit.push({ facet: "systeem", label: lijst(f.systeem.map((m) => (m === GEEN ? "Geen systeem" : m))) });
  if (f.klant) uit.push({ facet: "klant", label: o.klanten.find((k) => k.email === f.klant)?.naam ?? f.klant });
  if (f.stelsel.length) {
    const namen = f.stelsel.map((s) => {
      const opt = o.stelsels.find((x) => x.sleutel === s);
      return opt ? stelselLabel(opt) : s;
    });
    uit.push({ facet: "stelsel", label: lijst(namen, 1) });
  }
  if (f.land.length || f.prov.length) uit.push({ facet: "regio", label: lijst([...f.land.map(landNaam), ...f.prov.map(provincieNaam)]) });
  if (f.periode && (f.periode !== "eigen" || f.van || f.tot)) {
    const label =
      f.periode === "eigen"
        ? f.van && f.tot
          ? `${datumNl(f.van)} – ${datumNl(f.tot)}`
          : f.van
            ? `Vanaf ${datumNl(f.van)}`
            : `Tot ${datumNl(f.tot)}`
        : PERIODE_LABEL[f.periode];
    uit.push({ facet: "periode", label });
  }
  if (f.levering.length) uit.push({ facet: "levering", label: lijst(f.levering.map((l) => LEVERING_LABEL[l])) });
  if (f.factuur.length) uit.push({ facet: "factuur", label: lijst(f.factuur.map((x) => FACTUUR_LABEL[x])) });
  if (f.offerte) uit.push({ facet: "offerte", label: f.offerte === "ja" ? "Met offerte" : "Zonder offerte" });
  if (f.locatie) uit.push({ facet: "locatie", label: f.locatie === "met" ? "Op de kaart" : "Zonder locatie" });
  return uit;
}

/** Eén facet wissen (de rest blijft). */
export function zonderFacet(f: Filters, facet: Facet): Filters {
  switch (facet) {
    case "q":
      return { ...f, q: "" };
    case "status":
      return { ...f, status: [] };
    case "urg":
      return { ...f, urg: [] };
    case "systeem":
      return { ...f, systeem: [] };
    case "klant":
      return { ...f, klant: "" };
    case "stelsel":
      return { ...f, stelsel: [] };
    case "regio":
      return { ...f, land: [], prov: [] };
    case "periode":
      return { ...f, periode: "", van: "", tot: "" };
    case "levering":
      return { ...f, levering: [] };
    case "factuur":
      return { ...f, factuur: [] };
    case "offerte":
      return { ...f, offerte: "" };
    case "locatie":
      return { ...f, locatie: "" };
  }
}

export function sameSet<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// ── CSV ────────────────────────────────────────────────────────────────────
/** Cel voor Excel (puntkomma, aanhalingstekens, geen formules). */
function cel(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(,\d+)?$/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
// Decimale komma (Excel in België/Nederland), 6 decimalen ≈ 0,1 m.
const komma = (n: number | null) => (n == null ? "" : String(Math.round(n * 1e6) / 1e6).replace(".", ","));

/** CSV (puntkomma, UTF-8 met BOM, Nederlandse koppen) van de gefilterde lijst. */
export function werfkaartCsv(rijen: KaartProject[], basis: string): string {
  const koppen = [
    "Titel",
    "Klant",
    "E-mail",
    "Status",
    "Urgentie",
    "Systemen",
    "Straat",
    "Postcode",
    "Gemeente",
    "Land",
    "Provincie",
    "Breedtegraad",
    "Lengtegraad",
    "Coördinatenstelsel",
    "EPSG",
    "Aangemaakt",
    "Leverdatum",
    "Factuur",
    "Offerte",
    "Link",
  ];
  const regels = rijen.map((p) =>
    [
      p.titel,
      p.klant,
      p.email,
      STATUS_LABEL[p.status].nl,
      CATEGORIE_LABEL[p.categorie].nl,
      p.merken.join(", "),
      p.straat,
      p.postcode,
      p.gemeente,
      p.land ? landNaam(p.land) : "",
      p.provincie ? provincieNaam(p.provincie) : "",
      komma(p.lat),
      komma(p.lon),
      p.stelsel,
      p.epsg,
      p.aangemaakt,
      p.leverdatum ?? "",
      p.factuur === "betaald" ? "betaald" : p.factuur === "open" ? (p.factuurStatus ?? "open") : "geen factuur",
      p.offerte ? "ja" : "nee",
      `${basis}/admin/projecten/${p.id}`,
    ]
      .map(cel)
      .join(";"),
  );
  return `﻿${[koppen.map(cel).join(";"), ...regels].join("\r\n")}\r\n`;
}
