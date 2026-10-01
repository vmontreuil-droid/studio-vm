// Website-discovery: voor prospects zonder URL probeer een handvol
// veel voorkomende domein-varianten op basis van hun naam.
// Geen externe API nodig — HEAD-request met timeout, daarna één lichte
// GET van de homepage om te bevestigen dat de site echt over deze
// onderneming gaat (anders zou de e-mailzoeker het adres van een
// naamgenoot of een geparkeerd domein oppikken).

import { safeFetchText, validateHost } from "@/lib/safe-fetch";
import { htmlNaarTekst, isGeparkeerd } from "@/lib/admin/aannemers";

const TIMEOUT_MS = 4500;
const STOP_WORDS_FR = new Set([
  "sas",
  "sarl",
  "sa",
  "scop",
  "sci",
  "eurl",
  "snc",
  "ei",
  "eirl",
  "selarl",
  "selas",
  "selafa",
]);
const STOP_WORDS_BE = new Set([
  "bv",
  "nv",
  "bvba",
  "sprl",
  "srl",
  "comm",
  "vof",
  "esv",
  "cv",
  "cvba",
]);
const STOP_WORDS_UK = new Set([
  "ltd",
  "limited",
  "plc",
  "llp",
  "company",
  "co",
]);

// Te algemene woorden om op zichzelf te bewijzen dat een site bij deze
// onderneming hoort.
const GENERIEK = new Set([
  "aanneming",
  "aannemingen",
  "aannemer",
  "bouw",
  "bouwbedrijf",
  "bouwwerken",
  "werken",
  "grondwerken",
  "wegenwerken",
  "infra",
  "groep",
  "group",
  "algemene",
  "general",
  "entreprise",
  "entreprises",
  "travaux",
  "construction",
  "constructions",
  "services",
  "service",
  "terrassement",
  "terrassements",
  "groundworks",
  "civil",
  "engineering",
  "belgium",
  "belgie",
  "france",
  "holding",
  "invest",
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function nameWords(name: string, land: "be" | "fr" | "uk"): string[] {
  const lower = stripAccents(name).toLowerCase();
  const words = lower
    .replace(/[&'"`.,;:!?()/\\]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const stop =
    land === "fr" ? STOP_WORDS_FR : land === "uk" ? STOP_WORDS_UK : STOP_WORDS_BE;
  return words.filter((w) => !stop.has(w));
}

export function slugifyName(name: string, land: "be" | "fr" | "uk"): string[] {
  const filtered = nameWords(name, land);
  if (filtered.length === 0) return [];

  const variants = new Set<string>();
  variants.add(filtered.join(""));
  variants.add(filtered.join("-"));
  if (filtered.length > 1) {
    variants.add(filtered[0]);
    variants.add(`${filtered[0]}-${filtered[filtered.length - 1]}`);
  }
  return [...variants].filter((v) => v.length >= 3 && v.length <= 50);
}

export function candidateDomains(
  name: string,
  land: "be" | "fr" | "uk",
): string[] {
  const slugs = slugifyName(name, land);
  const tlds =
    land === "fr"
      ? [".fr", ".com", ".eu"]
      : land === "uk"
        ? [".co.uk", ".com", ".uk"]
        : [".be", ".com", ".eu"];
  const out: string[] = [];
  for (const s of slugs) {
    for (const t of tlds) out.push(`${s}${t}`);
    if (out.length >= 10) break;
  }
  return out.slice(0, 10);
}

// HEAD-request met korte timeout. Volg redirects. Accepteert
// 200, 301, 302, 401, 403 als "site bestaat".
export async function probeDomain(host: string): Promise<boolean> {
  if (await validateHost(host)) return false;
  const url = `https://${host}/`;
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const r = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "StudioVM-WebsiteDiscovery/1.0 (+https://studio-vm.be; non-intrusive domain check)",
      },
    });
    clearTimeout(tm);
    // 200-499 (uitgezonderd 404, 410) = waarschijnlijk een echte site
    return r.status >= 200 && r.status < 500 && r.status !== 404 && r.status !== 410;
  } catch {
    return false;
  }
}

/**
 * Bevestig dat de homepage over deze onderneming gaat: een kenmerkend
 * woord uit de naam (≥ 4 tekens, niet generiek) moet op de pagina staan,
 * of anders de volledige naam aaneengeschreven.
 */
export async function bevestigNaam(
  host: string,
  name: string,
  land: "be" | "fr" | "uk",
): Promise<boolean> {
  const page = await safeFetchText(`https://${host}/`, {
    timeoutMs: 6000,
    maxBytes: 300_000,
    userAgent:
      "StudioVM-WebsiteDiscovery/1.0 (+https://studio-vm.be; non-intrusive domain check)",
  });
  if (!page || !page.ok) return false;
  // Te koop / geparkeerd: noemt vaak letterlijk de domeinnaam, dus eerst uitsluiten.
  if (isGeparkeerd(page.text)) return false;
  const tekst = htmlNaarTekst(page.text).replace(/[^a-z0-9]+/g, " ");
  const compact = tekst.replace(/ /g, "");
  const woorden = nameWords(name, land).filter(
    (w) => w.length >= 4 && !GENERIEK.has(w) && /[a-z]/.test(w),
  );
  if (woorden.some((w) => new RegExp(`\\b${w.replace(/[^a-z0-9]/g, "")}\\b`).test(tekst))) {
    return true;
  }
  const volledig = nameWords(name, land).join("").replace(/[^a-z0-9]/g, "");
  return volledig.length >= 5 && compact.includes(volledig);
}

// Vind de eerste werkende én bevestigde kandidaat voor een prospect-naam.
// Probeert maximaal `maxTries` (default: alle kandidaten).
export async function findWebsiteForName(
  name: string,
  land: "be" | "fr" | "uk",
  maxTries = 10,
): Promise<string | null> {
  const candidates = candidateDomains(name, land).slice(0, maxTries);
  for (const host of candidates) {
    if (!(await probeDomain(host))) continue;
    if (await bevestigNaam(host, name, land)) return `https://${host}`;
  }
  return null;
}
