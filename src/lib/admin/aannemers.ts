// Doelgroep en signalen voor de outreach-engine — 3D-modellen voor
// machinesturing, gericht op grond-, weg- en waterbouwers.
//
// Bewust zonder imports (puur): zo kan dit bestand ook los getest
// worden en gebruiken cron-routes, admin-pagina's en server-actions
// exact dezelfde definitie.
//
// Opslag per prospect (prospect_outreach) — bestaande kolommen hergebruikt
// zodat alles werkt ook als migratie 0048 nog niet gedraaid is:
//   scan_grade  = "3D:MC" | "3D:GW" | "3D:AL" | "3D:NS"  (campagne + niveau;
//                 oude website-scans hebben A–F en worden nooit meer gemaild)
//   scan_score  = prioriteit 0–100 (hoger = eerst mailen)
//   scan_issues = leesbare signalen voor de admin ("Trimble", "GPS", …)
//   scan_stack  = JSON met de volledige Signalen (merken, taal, bron)
//   signalen    = (optioneel, migratie 0048) dezelfde JSON als jsonb

export type ProspectLand = "be" | "fr" | "uk" | "nl" | "de";
export type MailTaal = "nl" | "fr" | "en" | "de";

// ─────────────────────────────────────────────────────────────────────
// NACE-doelgroep
// ─────────────────────────────────────────────────────────────────────

/**
 * Wie krijgt welke mail: aannemers (eigen machines), ontwerpers (architecten
 * en studiebureaus: hun ontwerp wordt een model voor de aannemer) en
 * landmeters (onderaanneming bij drukte, onder hun naam).
 */
export type Doelgroep = "aannemer" | "ontwerper" | "landmeter";

export type NaceOptie = {
  code: string;
  label: string;
  /** Standaard "aannemer". */
  doelgroep?: Doelgroep;
  standaard: boolean;
  /**
   * Kernactiviteit grond-, weg- en waterbouw: ook zonder signalen op de
   * website mailen. Bij randactiviteiten (bv. 43.99 "overige", waar ook
   * chapewerkers, zwembadbouwers en voegers onder vallen) enkel als de
   * homepage grondwerk- of machinesturing-signalen toont.
   */
  kern: boolean;
};

// Codes zonder punten (zoals KBO ze levert: "42110"). Prefix-match, dus
// "4312" vangt ook de Belgische subcode "43120". Voor Frankrijk (APE
// "43.12A") en het VK (SIC "43120") wordt het formaat per land omgezet.
export const NACE_OPTIES: NaceOptie[] = [
  { code: "4211", label: "Aanleg van wegen en autosnelwegen", standaard: true, kern: true },
  { code: "4212", label: "Aanleg van spoorwegen en metro", standaard: true, kern: true },
  { code: "4213", label: "Bouw van bruggen en tunnels", standaard: true, kern: true },
  { code: "4221", label: "Nutswerken voor vloeistoffen (leidingen, riolering)", standaard: true, kern: true },
  { code: "4222", label: "Nutswerken voor elektriciteit en telecom", standaard: true, kern: false },
  { code: "4291", label: "Waterbouw", standaard: true, kern: true },
  { code: "4299", label: "Overige weg- en waterbouw", standaard: true, kern: true },
  { code: "4311", label: "Slopen", standaard: true, kern: false },
  { code: "4312", label: "Bouwrijp maken van terreinen (grondwerken)", standaard: true, kern: true },
  { code: "4313", label: "Proefboringen", standaard: true, kern: false },
  { code: "4399", label: "Overige gespecialiseerde bouwwerkzaamheden", standaard: true, kern: false },
  { code: "4120", label: "Algemene bouw van gebouwen", standaard: false, kern: false },
  { code: "8130", label: "Tuin- en landschapsaanleg", standaard: false, kern: false },
  { code: "0812", label: "Zand- en grindwinning", standaard: false, kern: false },
  // Ontwerpers en landmeters (Vincent 4/10). Studiebureaus en landmeters altijd;
  // architecten enkel als hun site over terrein, wegenis of riolering spreekt
  // (zo'n 18.000 bureaus: niet blind mailen). Interieurarchitecten (71.112) niet.
  { code: "71121", label: "Studiebureaus (ingenieurs en technisch advies)", doelgroep: "ontwerper", standaard: true, kern: true },
  { code: "71122", label: "Landmeters", doelgroep: "landmeter", standaard: true, kern: true },
  { code: "71111", label: "Bouwarchitecten", doelgroep: "ontwerper", standaard: true, kern: false },
  { code: "71113", label: "Stedenbouwkundigen en landschapsarchitecten", doelgroep: "ontwerper", standaard: true, kern: false },
];

const NACE_GROEPEN: Record<string, string> = {
  "41": "Bouw van gebouwen",
  "42": "Weg- en waterbouw (alles)",
  "421": "Wegen, spoorwegen, bruggen en tunnels",
  "422": "Nutswerken",
  "429": "Waterbouw en overige weg- en waterbouw",
  "43": "Gespecialiseerde bouwwerkzaamheden (alles)",
  "431": "Slopen en bouwrijp maken",
  "439": "Overige gespecialiseerde bouwwerkzaamheden",
  "81": "Facilitaire diensten en landschapsaanleg",
  "71": "Architecten, ingenieurs en landmeters",
  "711": "Architecten, ingenieurs en landmeters",
  "7111": "Architecten",
  "7112": "Ingenieurs en landmeters",
};

/**
 * Doelgroep uit de NACE-hoofdcode (KBO "71122", APE "71.12A", SIC "71122").
 * In Frankrijk is 71.12A géomètres en 71.12B bureaux d'études; het VK
 * onderscheidt landmeters niet apart, daar is alles in 71.1 "ontwerper".
 */
export function doelgroepVoorNace(code: unknown, land?: ProspectLand): Doelgroep {
  const ruw = String(code ?? "").trim().toUpperCase();
  if (/^71\.12A/.test(ruw)) return "landmeter";
  if (/^71\.1[12]/.test(ruw)) return "ontwerper";
  const c = normalizeNace(ruw);
  // SIC 71122 (VK) is technisch advies, geen landmeter.
  if (c.startsWith("71122") && land !== "uk") return "landmeter";
  if (c.startsWith("7111") || c.startsWith("7112")) return "ontwerper";
  return "aannemer";
}

/** Is dit een kernactiviteit (mailen ook zonder website-signalen)? */
export function isKernNace(code: unknown): boolean {
  const c = normalizeNace(code);
  return NACE_OPTIES.some((o) => o.kern && c.startsWith(o.code));
}

export const STANDAARD_NACE: string[] = NACE_OPTIES.filter((o) => o.standaard).map(
  (o) => o.code,
);

export function normalizeNace(code: unknown): string {
  return String(code ?? "").replace(/[^0-9]/g, "");
}

/** Lijst uit DB of formulier → genormaliseerde, unieke prefixen (2–5 cijfers). */
export function parseNaceList(raw: unknown): string[] {
  const parts: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[\s,;]+/)
      : [];
  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeNace(p);
    if (n.length >= 2 && n.length <= 5 && !out.includes(n)) out.push(n);
  }
  return out;
}

/** Ingestelde prefixen, of de standaard-aannemersselectie als er niets is ingesteld. */
export function effectiveNace(configured: unknown): string[] {
  const n = parseNaceList(configured);
  return n.length > 0 ? n : STANDAARD_NACE;
}

export function naceLabel(code: string): string {
  const n = normalizeNace(code);
  const exact = NACE_OPTIES.find((o) => o.code === n);
  if (exact) return exact.label;
  // Langste bekende prefix (bv. "43120" → "4312", "421" → groep).
  for (let len = Math.min(n.length, 4); len >= 2; len--) {
    const p = n.slice(0, len);
    const opt = NACE_OPTIES.find((o) => o.code === p);
    if (opt) return opt.label;
    if (NACE_GROEPEN[p]) return NACE_GROEPEN[p];
  }
  return "";
}

/** "4211" → "42.11" (punt-notatie zoals op officiële lijsten). */
export function naceMetPunt(code: string): string {
  const n = normalizeNace(code);
  return n.length > 2 ? `${n.slice(0, 2)}.${n.slice(2)}` : n;
}

export function naceMatches(code: unknown, prefixes: string[]): boolean {
  const c = normalizeNace(code);
  if (!c) return false;
  return prefixes.some((p) => {
    const n = normalizeNace(p);
    return n.length > 0 && c.startsWith(n);
  });
}

/** Prefix in het formaat van de bron-tabel van dat land. */
export function prefixVoorLand(prefix: string, land: ProspectLand): string {
  const n = normalizeNace(prefix);
  // Belgische subcodes van 71.1 → het formaat van het land.
  if (n.startsWith("711") && n.length === 5) {
    if (land === "fr") return n === "71122" ? "71.12A" : n === "71121" ? "71.12B" : "71.11";
    if (land === "uk") return n.slice(0, 4);
  }
  if (land === "fr") {
    // APE/NAF: "43.12A" — 4 cijfers met punt, daarna een letter.
    const p = n.slice(0, 4);
    return p.length > 2 ? `${p.slice(0, 2)}.${p.slice(2)}` : p;
  }
  return n;
}

/** PostgREST or-filter: `nace_main.like.4211*,nace_main.like.4312*` */
export function naceOrFilter(
  col: string,
  prefixes: string[],
  land: ProspectLand,
): string {
  const uniq: string[] = [];
  for (const p of prefixes) {
    const f = prefixVoorLand(p, land);
    if (f && !uniq.includes(f)) uniq.push(f);
  }
  return uniq
    .map((f) => (f.includes(".") ? `${col}.like."${f}*"` : `${col}.like.${f}*`))
    .join(",");
}

// ─────────────────────────────────────────────────────────────────────
// Signalen op de homepage
// ─────────────────────────────────────────────────────────────────────

export type SignaalBron = "site" | "onbereikbaar" | "geparkeerd" | "geen-site";

export type Signalen = {
  v: 1;
  /** Ondersteunde merken die we bij naam in de mail mogen noemen. */
  merken: string[];
  /** Andere machinesturingsmerken (signaal, maar niet bij naam genoemd). */
  andereMerken: string[];
  /** Termen die op machinesturing / GNSS wijzen. */
  sturing: string[];
  /** Grond-, weg- en waterbouwtermen en machinepark. */
  werk: string[];
  /** <html lang> van de site, indien herkend. */
  taal: MailTaal | null;
  bron: SignaalBron;
};

export type AannemerGrade = "3D:MC" | "3D:GW" | "3D:AL" | "3D:NS";
export const GRADE_PREFIX = "3D:";

export const GRADE_LABEL: Record<AannemerGrade, string> = {
  "3D:MC": "Machinesturing",
  "3D:GW": "Grond-/wegenwerk",
  "3D:AL": "Geen signalen",
  "3D:NS": "Geen bruikbare site",
};

export function isAannemerGrade(g: unknown): g is AannemerGrade {
  return typeof g === "string" && g.startsWith(GRADE_PREFIX);
}

type Patroon = { label: string; re: RegExp };

// Alle patronen werken op tekst zonder accenten, in kleine letters.
const MERKEN: Patroon[] = [
  { label: "Trimble", re: /\btrimble\b/ },
  { label: "Topcon", re: /\btopcon\b/ },
  { label: "Leica", re: /\bleica\b/ },
  { label: "Unicontrol", re: /\bunicontrol\b/ },
  { label: "CHCNAV", re: /\bchc\s?nav\b|\bchc navigation\b/ },
  {
    label: "Komatsu",
    re: /\bkomatsu\b[^.]{0,80}\b(imc|intelligent machine control)\b|\bintelligent machine control\b/,
  },
  {
    label: "Caterpillar",
    re: /\bcat\s?(®\s?)?grade\b|\bcaterpillar grade\b|\bcat command\b/,
  },
];

const ANDERE_MERKEN: Patroon[] = [
  { label: "Moba", re: /\bmoba\b/ },
  { label: "Xsite", re: /\bxsite\b/ },
  { label: "Novatron", re: /\bnovatron\b/ },
  { label: "Sitech", re: /\bsitech\b/ },
];

const STURING: Patroon[] = [
  {
    label: "machinesturing",
    re: /\bmachine ?sturing\b|\b3d[- ]?(machine)?sturing\b|\bgps[- ]?sturing\b|\bgps[- ]?gestuurd|\bmachinegeleiding\b/,
  },
  {
    label: "guidage d'engins",
    re: /\bguidage (d'|d |des )?engins?\b|\bguidage (3d|gps|machine)\b|\bguidage par gps\b|\bpilotage 3d\b/,
  },
  {
    label: "machine control",
    re: /\bmachine control\b|\bmachine guidance\b|\bgrade control\b|\bgps[- ]guided\b/,
  },
  {
    label: "Maschinensteuerung",
    re: /\b(bau)?maschinensteuerung\b|\b3d[- ]?steuerung\b|\bgps[- ]?steuerung\b/,
  },
  { label: "GNSS", re: /\bgnss\b/ },
  { label: "RTK", re: /\brtk\b/ },
];

// Zwakker signaal: "GPS" alleen (kan ook over voertuigvolging gaan).
const GPS: Patroon = { label: "GPS", re: /\bgps\b/ };

const WERK: Patroon[] = [
  { label: "grondwerken", re: /\bgrondwerk(en)?\b|\bgrondverzet\b|\bgraafwerk(en)?\b/ },
  { label: "wegenis", re: /\bwegenis(werken)?\b|\bwegenbouw\b|\binfrastructuurwerken\b/ },
  { label: "riolering", re: /\briolering(swerken)?\b|\bnutsleidingen\b/ },
  { label: "sloopwerken", re: /\bsloopwerk(en)?\b|\bafbraakwerk(en)?\b/ },
  { label: "terrassement", re: /\bterrassements?\b/ },
  { label: "voirie / VRD", re: /\bvoiries?\b|\bvrd\b|\btravaux publics\b|\bgenie civil\b/ },
  { label: "égouttage", re: /\begouttage\b|\bassainissement\b/ },
  { label: "earthworks", re: /\bearthworks?\b|\bearthmoving\b|\bgroundworks?\b|\bcivil engineering\b/ },
  { label: "Erdbau / Tiefbau", re: /\berdbau\b|\btiefbau\b|\berdarbeiten\b|\bstrassenbau\b/ },
  {
    label: "machinepark",
    re: /\bgraafmachines?\b|\bgraafkra(a)?n(en)?\b|\bbulldozers?\b|\bdozers?\b|\bgraders?\b|\bpelleteuses?\b|\bniveleuses?\b|\bbouteurs?\b|\bexcavators?\b|\bbagger\b/,
  },
];

/** HTML → genormaliseerde zichtbare tekst (incl. title, meta-omschrijving, alt). */
export function htmlNaarTekst(html: string): string {
  const meta: string[] = [];
  for (const m of html.matchAll(
    /<meta[^>]+(?:name|property)=["'](?:description|keywords|og:description|og:title)["'][^>]*>/gi,
  )) {
    const c = m[0].match(/content=["']([^"']*)["']/i)?.[1];
    if (c) meta.push(c);
  }
  const alts: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/gi)) {
    alts.push(m[1]);
  }
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return [body, ...meta, ...alts]
    .join(" ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#0?39;|&rsquo;|&lsquo;|&apos;/gi, "'")
    .replace(/&eacute;/gi, "e")
    .replace(/&egrave;/gi, "e")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/[’`´]/g, "'")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function siteTaal(html: string): MailTaal | null {
  const l = html.match(/<html[^>]*\blang\s*=\s*["']?([a-z]{2})/i)?.[1]?.toLowerCase();
  return l === "nl" || l === "fr" || l === "en" || l === "de" ? l : null;
}

function hits(tekst: string, patronen: Patroon[]): string[] {
  return patronen.filter((p) => p.re.test(tekst)).map((p) => p.label);
}

export function legeSignalen(bron: SignaalBron): Signalen {
  return { v: 1, merken: [], andereMerken: [], sturing: [], werk: [], taal: null, bron };
}

// Geparkeerde of te koop staande domeinen (vaak een fout geraden website).
// Het e-mailadres dat op zo'n pagina staat is dat van de domeinmakelaar,
// nooit van de aannemer.
const GEPARKEERD: RegExp[] = [
  /\b(this|the) domain( name)? (is|may be) (for sale|available)\b/,
  /\bdomain( name)? (is )?for sale\b/,
  /\bbuy this domain\b/,
  /\bdomein(naam)? (is )?te koop\b/,
  /\bdeze domeinnaam is te koop\b/,
  /\b(nom de )?domaine (est )?a vendre\b/,
  /\bdomain (steht )?zum verkauf\b/,
  /\b(nameshift|dovendi|sedo|afternic|hugedomains|parkingcrew|bodis|uniregistry)\b/,
  /\bdan\.com\b/,
  /\bdomain parking\b|\bparked (free|domain)\b|\bthis domain (is|has been) parked\b/,
  /\bdefault (web )?(site|server) page\b/,
];

export function isGeparkeerd(html: string): boolean {
  const tekst = htmlNaarTekst(html).slice(0, 20_000);
  return GEPARKEERD.some((re) => re.test(tekst));
}

const FREEMAIL = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.be", "hotmail.fr", "hotmail.co.uk",
  "outlook.com", "outlook.be", "outlook.fr", "live.be", "live.com", "live.fr", "live.co.uk",
  "msn.com", "yahoo.com", "yahoo.fr", "yahoo.co.uk", "icloud.com", "me.com",
  "telenet.be", "skynet.be", "proximus.be", "scarlet.be", "belgacom.net", "base.be", "pandora.be",
  "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "neuf.fr", "bbox.fr",
  "btinternet.com", "sky.com", "virginmedia.com", "gmx.com", "gmx.de", "gmx.net", "web.de",
  "t-online.de", "freenet.de", "hey.com", "protonmail.com", "proton.me",
]);

function hostTokens(host: string): string[] {
  const h = host.toLowerCase().replace(/^www\./, "");
  const zonderTld = h.split(".").slice(0, -1).join(".") || h;
  return zonderTld.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
}

/**
 * Hoort een op de site gevonden adres echt bij deze onderneming? Ja als
 * het domein overeenkomt, als het een gewone mailprovider is (veel kleine
 * aannemers gebruiken telenet/gmail), of als het domein een kenmerkend
 * stuk van de websitenaam deelt. Anders (webbouwer, makelaar) → nee.
 */
export function adresPastBijSite(email: string, website: string | null): boolean {
  const dom = email.split("@")[1]?.toLowerCase().trim();
  if (!dom) return false;
  if (FREEMAIL.has(dom)) return true;
  if (!website) return false;
  let host: string;
  try {
    host = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return false;
  }
  if (dom === host || dom.endsWith(`.${host}`) || host.endsWith(`.${dom}`)) return true;
  const a = hostTokens(host);
  const b = hostTokens(dom);
  // Gedeeld of ingesloten stuk: "melis.be" ↔ "bvbamelis.be",
  // "coastalservices.be" ↔ "coastalservice.be".
  return a.some((x) => b.some((y) => x === y || x.includes(y) || y.includes(x)));
}

/** Lees de homepage-HTML op machinesturing- en grondwerksignalen. */
export function detecteerSignalen(html: string): Signalen {
  const tekst = htmlNaarTekst(html);
  const sturing = hits(tekst, STURING);
  if (sturing.length === 0 && GPS.re.test(tekst)) sturing.push(GPS.label);
  return {
    v: 1,
    merken: hits(tekst, MERKEN),
    andereMerken: hits(tekst, ANDERE_MERKEN),
    sturing,
    werk: hits(tekst, WERK),
    taal: siteTaal(html),
    bron: "site",
  };
}

export function heeftSturing(s: Signalen): boolean {
  return (
    s.merken.length > 0 ||
    s.andereMerken.length > 0 ||
    s.sturing.some((t) => t !== "GPS")
  );
}

/** Niveau (campagne-grade) + prioriteit 0–100. */
export function beoordeel(s: Signalen): { grade: AannemerGrade; score: number } {
  let score = s.bron === "site" ? 10 : s.bron === "onbereikbaar" ? 4 : 2;
  const merkTal = s.merken.length + s.andereMerken.length;
  if (merkTal > 0) score += 40 + 10 * Math.min(2, merkTal - 1);
  const sterk = s.sturing.filter((t) => t !== "GPS").length;
  if (sterk > 0) score += merkTal > 0 ? 15 : 35;
  else if (s.sturing.includes("GPS")) score += 10;
  score += Math.min(25, 5 * s.werk.length);
  score = Math.max(0, Math.min(100, score));

  const grade: AannemerGrade = heeftSturing(s)
    ? "3D:MC"
    : s.werk.length > 0 || s.sturing.includes("GPS")
      ? "3D:GW"
      : s.bron === "site"
        ? "3D:AL"
        : "3D:NS";
  return { grade, score };
}

/** Leesbare labels voor scan_issues / de admin. */
export function signaalLabels(s: Signalen): string[] {
  return [...s.merken, ...s.andereMerken, ...s.sturing, ...s.werk].slice(0, 14);
}

export function encodeSignalen(s: Signalen): string {
  return JSON.stringify(s);
}

export function decodeSignalen(raw: unknown): Signalen | null {
  let o: unknown = raw;
  if (typeof raw === "string") {
    try {
      o = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== "object") return null;
  const r = o as Partial<Signalen>;
  if (r.v !== 1) return null;
  const arr = (x: unknown) =>
    Array.isArray(x) ? x.filter((y): y is string => typeof y === "string") : [];
  const taal = r.taal === "nl" || r.taal === "fr" || r.taal === "en" || r.taal === "de" ? r.taal : null;
  const bron: SignaalBron =
    r.bron === "site" ||
    r.bron === "onbereikbaar" ||
    r.bron === "geparkeerd" ||
    r.bron === "geen-site"
      ? r.bron
      : "site";
  return {
    v: 1,
    merken: arr(r.merken),
    andereMerken: arr(r.andereMerken),
    sturing: arr(r.sturing),
    werk: arr(r.werk),
    taal,
    bron,
  };
}
