// Website-discovery: voor prospects zonder URL probeer een handvol
// veel voorkomende domein-varianten op basis van hun naam.
// Geen externe API nodig — gewoon HEAD-requests met timeout.

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

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slugifyName(name: string, land: "be" | "fr" | "uk"): string[] {
  const lower = stripAccents(name).toLowerCase();
  const words = lower
    .replace(/[&'"`.,;:!?()/\\]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const stop =
    land === "fr" ? STOP_WORDS_FR : land === "uk" ? STOP_WORDS_UK : STOP_WORDS_BE;
  const filtered = words.filter((w) => !stop.has(w));
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
  const url = `https://${host}/`;
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const r = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
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

// Vind de eerste werkende kandidaat voor een prospect-naam.
// Probeert maximaal `maxTries` (default: alle kandidaten).
export async function findWebsiteForName(
  name: string,
  land: "be" | "fr" | "uk",
  maxTries = 10,
): Promise<string | null> {
  const candidates = candidateDomains(name, land).slice(0, maxTries);
  for (const host of candidates) {
    if (await probeDomain(host)) {
      return `https://${host}`;
    }
  }
  return null;
}
