// Herkomst van bezoek voor /admin/webactiviteit: verwijzers samenvoegen per
// platform en UTM-campagnes optellen. Zuivere functies (geen database), zodat
// ze met verzonnen rijen te testen zijn.

import { UTM_BRON_NAAM, isUtmBron } from "@/lib/utm";

export type PvHerkomst = {
  created_at: string;
  path: string;
  referrer?: string | null;
  visitor_hash?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
};

// Host (of app-pakket bij android-app://…) → platform. Volgorde telt, de
// eerste treffer wint: Messenger (com.facebook.orca) vóór Facebook
// (com.facebook.*), Threads (com.instagram.barcelona) vóór Instagram
// (com.instagram.*), Gemini en Gmail vóór de algemene Google-regel.
const GROEPEN: [RegExp, string][] = [
  [/(^|\.)messenger\.com$|^m\.me$|^com\.facebook\.(orca|mlite)$/, "Messenger"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me|watch)$|^com\.facebook\./, "Facebook"],
  [/(^|\.)threads\.(net|com)$|^com\.instagram\.barcelona$/, "Threads"],
  [/(^|\.)instagram\.com$|^com\.instagram\./, "Instagram"],
  [/^t\.co$|(^|\.)(twitter|x)\.com$|^com\.twitter\./, "X"],
  [/(^|\.)bsky\.(app|social)$|^xyz\.blueskyweb\./, "Bluesky"],
  [/(^|\.)youtube\.com$|^youtu\.be$|^com\.google\.android\.youtube$/, "YouTube"],
  [/(^|\.)tiktok\.com$|^com\.zhiliaoapp\.musically$|^com\.ss\.android\.ugc\./, "TikTok"],
  [/(^|\.)pinterest\.[a-z.]+$|^pin\.it$|^com\.pinterest$/, "Pinterest"],
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$|^com\.whatsapp/, "WhatsApp"],
  [/^gemini\.google\.com$|^bard\.google\.com$/, "Gemini"],
  [/^mail\.google\.com$|^com\.google\.android\.gm$/, "Gmail"],
  [/(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)qwant\.com$/, "Qwant"],
  [/(^|\.)yahoo\.[a-z.]+$/, "Yahoo"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)claude\.ai$/, "Claude"],
  [/^copilot\.microsoft\.com$/, "Copilot"],
  [/^outlook\.(live|office|office365)\.com$/, "Outlook"],
];

/** Platforms die als "sociale media" tellen (bericht, profiel of gedeelde link). */
export const SOCIALE_KANALEN = new Set([
  "Facebook",
  "Messenger",
  "Instagram",
  "X",
  "Threads",
  "Bluesky",
  "YouTube",
  "TikTok",
  "Pinterest",
  "WhatsApp",
]);

/**
 * Naam van de verwijzer: het platform als we het kennen (m./l./lm.facebook.com
 * en de Facebook-app worden allemaal "Facebook"), anders de kale host.
 * null = eigen site (doorklikken binnen studio-vm.be), "(direct)" = geen
 * verwijzer.
 */
export function verwijzerGroep(referrer: string | null | undefined): string | null {
  if (!referrer) return "(direct)";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "(onbekend)";
  }
  if (!host) return "(direct)";
  if (host.includes("studio-vm") || host === "localhost" || host === "127.0.0.1") return null;
  for (const [re, naam] of GROEPEN) if (re.test(host)) return naam;
  return host;
}

/** Leesbare naam van een utm_source ("facebook" → "Facebook", onbekend blijft zoals het is). */
export function bronNaam(src: string): string {
  const s = src.toLowerCase();
  return isUtmBron(s) ? UTM_BRON_NAAM[s] : src;
}

/**
 * Kanaal van één weergave: de UTM-bron als de link gelabeld was, anders de
 * verwijzer. null = doorklik binnen de site.
 */
export function kanaal(r: Pick<PvHerkomst, "referrer" | "utm_source">): string | null {
  if (r.utm_source) return bronNaam(r.utm_source);
  return verwijzerGroep(r.referrer);
}

export type CampagneRij = {
  sleutel: string;
  bron: string;
  medium: string | null;
  campagne: string | null;
  inhoud: string | null;
  weergaven: number;
  bezoekers: number;
  /** Bezoekers (zelfde dagcode) die in de periode ook het offerteformulier zagen. */
  offerte: number;
};

const isOfferte = (pad: string) => /\/offerte(\/|$)/.test(pad);

/** Weergaven met een utm_source, gegroepeerd per bron/medium/campagne(/inhoud). */
export function campagnes(rijen: PvHerkomst[], metInhoud: boolean): CampagneRij[] {
  const offerteBezoekers = new Set(rijen.filter((r) => isOfferte(r.path) && r.visitor_hash).map((r) => r.visitor_hash as string));
  const m = new Map<string, { rij: CampagneRij; hashes: Set<string> }>();
  for (const r of rijen) {
    if (!r.utm_source) continue;
    const inhoud = metInhoud ? (r.utm_content ?? null) : null;
    // Oudere rijen (vóór de opschoning in de tracker) kunnen hoofdletters hebben.
    const sleutel = [r.utm_source.toLowerCase(), (r.utm_medium ?? "").toLowerCase(), (r.utm_campaign ?? "").toLowerCase(), inhoud ?? ""].join("|");
    let g = m.get(sleutel);
    if (!g) {
      g = {
        rij: {
          sleutel,
          bron: bronNaam(r.utm_source),
          medium: r.utm_medium ?? null,
          campagne: r.utm_campaign ?? null,
          inhoud,
          weergaven: 0,
          bezoekers: 0,
          offerte: 0,
        },
        hashes: new Set(),
      };
      m.set(sleutel, g);
    }
    g.rij.weergaven += 1;
    if (r.visitor_hash) g.hashes.add(r.visitor_hash);
  }
  return [...m.values()]
    .map(({ rij, hashes }) => ({
      ...rij,
      bezoekers: hashes.size,
      offerte: [...hashes].filter((h) => offerteBezoekers.has(h)).length,
    }))
    .sort((a, b) => b.bezoekers - a.bezoekers || b.weergaven - a.weergaven);
}

/**
 * Unieke bezoekers per UTM-bron. Telt dagcodes per bron, zodat één bezoeker
 * die via twee Facebook-links binnenkwam (bv. een bericht en de actieknop)
 * één keer meetelt. De som van de tabelrijen kan dus hoger liggen.
 */
export function bezoekersPerBron(rijen: PvHerkomst[], max = 8): { label: string; value: number }[] {
  const m = new Map<string, Set<string>>();
  for (const r of rijen) {
    if (!r.utm_source || !r.visitor_hash) continue;
    const bron = bronNaam(r.utm_source);
    let s = m.get(bron);
    if (!s) m.set(bron, (s = new Set()));
    s.add(r.visitor_hash);
  }
  return [...m.entries()]
    .map(([label, s]) => ({ label, value: s.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

/** Unieke bezoekers die minstens één keer via een gelabelde link (UTM) binnenkwamen. */
export function gelabeldeBezoekers(rijen: PvHerkomst[]): number {
  const s = new Set<string>();
  for (const r of rijen) if (r.utm_source && r.visitor_hash) s.add(r.visitor_hash);
  return s.size;
}

/** Unieke bezoekers per kanaal (UTM-bron, anders verwijzer); doorkliks binnen de site tellen niet. */
export function bezoekersPerKanaal(rijen: PvHerkomst[], max = 8): { label: string; value: number }[] {
  const m = new Map<string, Set<string>>();
  for (const r of rijen) {
    const k = kanaal(r);
    if (!k || !r.visitor_hash) continue;
    let s = m.get(k);
    if (!s) m.set(k, (s = new Set()));
    s.add(r.visitor_hash);
  }
  return [...m.entries()]
    .map(([label, s]) => ({ label, value: s.size }))
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
}

/** Unieke bezoekers die minstens één keer via sociale media binnenkwamen. */
export function socialeBezoekers(rijen: PvHerkomst[]): number {
  const s = new Set<string>();
  for (const r of rijen) {
    const k = kanaal(r);
    if (k && SOCIALE_KANALEN.has(k) && r.visitor_hash) s.add(r.visitor_hash);
  }
  return s.size;
}
