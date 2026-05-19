// Vindt het PUBLIEK vermelde contact-e-mailadres op één website
// (mailto-links + tekst op homepage en typische contactpagina's,
// uitsluitend op hetzelfde domein). Bewust geen massa-crawl, geen
// adres-gokken, geen zoekmachines — enkel wat het bedrijf zelf
// publiek als contact toont.

const TIMEOUT_MS = 8000;
const MAX_PAGES = 8;

const CANDIDATE_PATHS = [
  "",
  "/contact",
  "/contact-us",
  "/contacteer-ons",
  "/over",
  "/over-ons",
  "/about",
  "/about-us",
  "/colofon",
  "/impressum",
  "/team",
  "/privacy",
];

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Ruis die geen echt contactadres is.
const JUNK = [
  /\.(png|jpe?g|gif|svg|webp|css|js|woff2?)$/i,
  /@(sentry|wixpress|example|domain|email|sentry\.io)/i,
  /^(no-?reply|postmaster|mailer-daemon)@/i,
  /\.(png|jpg)@/i,
  /u00|u003|%[0-9a]/i,
];

function isPrivateHost(h: string): boolean {
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

export type FoundEmail = { address: string; source: string };

export async function findEmails(rawUrl: string): Promise<{
  ok: boolean;
  error?: string;
  site?: string;
  emails?: FoundEmail[];
  pagesTried?: number;
}> {
  let base: URL;
  try {
    const withProto = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    base = new URL(withProto);
  } catch {
    return { ok: false, error: "Ongeldige URL." };
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") {
    return { ok: false, error: "Enkel http/https." };
  }
  if (isPrivateHost(base.hostname)) {
    return { ok: false, error: "Interne adressen zijn niet toegelaten." };
  }

  const domain = base.hostname.replace(/^www\./, "");
  const found = new Map<string, string>(); // address -> source path
  let pagesTried = 0;

  for (const path of CANDIDATE_PATHS) {
    if (pagesTried >= MAX_PAGES) break;
    if (found.size >= 5 && pagesTried >= 3) break; // genoeg gevonden
    let target: string;
    try {
      target = new URL(path || "/", base).toString();
    } catch {
      continue;
    }
    pagesTried++;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(target, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "StudioVM-ContactFinder/1.0 (+https://studio-vm.be; haalt enkel publiek contactadres)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("html")) continue;
      const html = (await res.text()).slice(0, 600_000);

      // 1) mailto:-links (sterkste signaal)
      for (const m of html.matchAll(
        /mailto:([^"'?>\s]+)/gi,
      )) {
        const a = decodeURIComponent(m[1]).toLowerCase().trim();
        if (a && !found.has(a)) found.set(a, path || "/");
      }
      // 2) e-mails in de tekst
      for (const m of html.matchAll(EMAIL_RE)) {
        const a = m[0].toLowerCase().trim();
        if (!found.has(a)) found.set(a, path || "/");
      }
    } catch {
      /* time-out of netwerk — volgende pagina */
    }
  }

  const emails: FoundEmail[] = [...found.entries()]
    .filter(([a]) => !JUNK.some((re) => re.test(a)))
    .map(([address, source]) => ({ address, source }))
    // adressen op hetzelfde domein eerst (waarschijnlijk het juiste)
    .sort((x, y) => {
      const xd = x.address.endsWith(domain) ? 0 : 1;
      const yd = y.address.endsWith(domain) ? 0 : 1;
      return xd - yd;
    })
    .slice(0, 15);

  return {
    ok: true,
    site: base.hostname,
    emails,
    pagesTried,
  };
}
