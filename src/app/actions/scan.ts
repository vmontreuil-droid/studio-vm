"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ScanSignal = {
  key: string;
  ok: boolean | "warn";
  label: string;
  detail: string;
};

export type ScanResult =
  | {
      ok: true;
      url: string;
      finalUrl: string;
      score: number;
      stack: string;
      responseMs: number;
      htmlKb: number;
      signals: ScanSignal[];
    }
  | { ok: false; error: string };

const MAX_BYTES = 600_000;
const TIMEOUT_MS = 9000;

// SSRF-bescherming: blokkeer private / loopback / link-local / metadata ranges.
function isBlockedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split(".").map(Number);
    if (p[0] === 10) return true;
    if (p[0] === 127) return true;
    if (p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true; // link-local + metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] >= 224) return true; // multicast/reserved
    return false;
  }
  if (isIP(ip) === 6) {
    const x = ip.toLowerCase();
    if (x === "::1" || x === "::") return true;
    if (x.startsWith("fe80") || x.startsWith("fc") || x.startsWith("fd"))
      return true;
    if (x.startsWith("::ffff:")) return isBlockedIp(x.replace("::ffff:", ""));
    return false;
  }
  return true;
}

async function validateHost(hostname: string): Promise<string | null> {
  const h = hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "metadata.google.internal"
  ) {
    return "host niet toegelaten";
  }
  if (isIP(h)) {
    return isBlockedIp(h) ? "intern IP-adres niet toegelaten" : null;
  }
  try {
    const records = await lookup(h, { all: true });
    if (records.length === 0) return "host niet vindbaar";
    for (const r of records) {
      if (isBlockedIp(r.address)) return "host wijst naar een intern adres";
    }
    return null;
  } catch {
    return "host niet vindbaar (DNS)";
  }
}

function detectStack(headers: Headers, html: string): string {
  const server = (headers.get("server") || "").toLowerCase();
  const powered = (headers.get("x-powered-by") || "").toLowerCase();
  const gen = (
    html.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i)?.[1] ||
    ""
  ).toLowerCase();
  const h = html.toLowerCase();

  if (headers.get("x-shopid") || h.includes("cdn.shopify.com"))
    return "Shopify";
  if (server.includes("squarespace") || gen.includes("squarespace") || h.includes("static1.squarespace"))
    return "Squarespace";
  if (h.includes("wix.com") || headers.get("x-wix-request-id"))
    return "Wix";
  if (h.includes("assets.website-files.com") || server.includes("webflow"))
    return "Webflow";
  if (gen.includes("wordpress") || h.includes("/wp-content/") || h.includes("/wp-json"))
    return "WordPress";
  if (gen.includes("drupal")) return "Drupal";
  if (gen.includes("joomla")) return "Joomla";
  if (powered.includes("next.js") || h.includes("/_next/"))
    return "Next.js";
  if (h.includes("__nuxt") || powered.includes("nuxt")) return "Nuxt";
  if (gen.includes("hugo")) return "Hugo";
  if (gen) return gen.split(" ")[0].replace(/^\w/, (c) => c.toUpperCase());
  return "onbekend";
}

export async function scanSite(formData: FormData): Promise<ScanResult> {
  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return { ok: false, error: "Geef een website-adres in." };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, error: "Dat is geen geldig webadres." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Enkel http(s)-adressen worden ondersteund." };
  }

  const hostError = await validateHost(url.hostname);
  if (hostError) return { ok: false, error: hostError };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "StudioVM-SiteCheck/1.0 (+https://studio-vm.be; vriendelijke diagnose, geen crawl)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const responseMs = Date.now() - started;

    // Eindbestemming opnieuw valideren (redirect-rebinding mitigatie)
    try {
      const finalHost = new URL(res.url).hostname;
      if (finalHost !== url.hostname) {
        const fe = await validateHost(finalHost);
        if (fe) return { ok: false, error: `redirect: ${fe}` };
      }
    } catch {}

    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (received < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
        }
      }
      await reader.cancel().catch(() => {});
    }
    const html = new TextDecoder().decode(
      chunks.length
        ? (() => {
            const all = new Uint8Array(received);
            let o = 0;
            for (const ch of chunks) {
              all.set(ch.subarray(0, Math.max(0, MAX_BYTES - o)), o);
              o += ch.length;
            }
            return all;
          })()
        : new Uint8Array(),
    );

    const htmlKb = Math.round(received / 102.4) / 10;
    const stack = detectStack(res.headers, html);
    const isHttps = url.protocol === "https:" || res.url.startsWith("https:");
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    const hasDesc =
      /<meta\s+name=["']description["']\s+content=["'][^"']{20,}/i.test(html);
    const hasOg = /<meta\s+property=["']og:/i.test(html);
    const enc = (res.headers.get("content-encoding") || "").toLowerCase();
    const compressed = enc.includes("gzip") || enc.includes("br");
    const scriptCount = (html.match(/<script[\s>]/gi) || []).length;
    const heavyCms = ["WordPress", "Drupal", "Joomla", "Wix"].includes(stack);

    const slow = responseMs > 1500;
    const okSpeed = responseMs <= 800;

    const signals: ScanSignal[] = [
      {
        key: "https",
        ok: isHttps,
        label: "HTTPS",
        detail: isHttps
          ? "Verbinding is versleuteld."
          : "Geen HTTPS — Google en browsers straffen dit af.",
      },
      {
        key: "speed",
        ok: okSpeed ? true : slow ? false : "warn",
        label: "Reactietijd",
        detail: `${responseMs} ms tot eerste byte${
          okSpeed ? " — snel." : slow ? " — traag, bezoekers haken af." : " — kan beter."
        }`,
      },
      {
        key: "weight",
        ok: htmlKb < 150 ? true : htmlKb < 400 ? "warn" : false,
        label: "HTML-gewicht",
        detail: `${htmlKb} KB HTML${
          htmlKb < 150 ? " — licht." : htmlKb < 400 ? " — aan de zware kant." : " — fors, vertraagt mobiel."
        }`,
      },
      {
        key: "compression",
        ok: compressed,
        label: "Compressie",
        detail: compressed
          ? `Actief (${enc}).`
          : "Geen compressie — onnodig veel data over de lijn.",
      },
      {
        key: "viewport",
        ok: hasViewport,
        label: "Mobiel-meta",
        detail: hasViewport
          ? "Viewport-tag aanwezig."
          : "Geen viewport-tag — mobiel zal slecht schalen.",
      },
      {
        key: "title",
        ok: !!title,
        label: "Titel",
        detail: title ? `"${title.slice(0, 60)}"` : "Geen <title> gevonden.",
      },
      {
        key: "description",
        ok: hasDesc,
        label: "Meta-omschrijving",
        detail: hasDesc
          ? "Aanwezig — goed voor de zoekresultaat-snippet."
          : "Ontbreekt of te kort — Google verzint dan zelf je snippet.",
      },
      {
        key: "og",
        ok: hasOg,
        label: "Open Graph",
        detail: hasOg
          ? "Deellinks tonen een nette preview."
          : "Geen Open Graph — links delen geeft een kale preview.",
      },
      {
        key: "scripts",
        ok: scriptCount < 12 ? true : scriptCount < 25 ? "warn" : false,
        label: "Scripts",
        detail: `${scriptCount} <script>-tags${
          scriptCount < 12 ? " — beheersbaar." : scriptCount < 25 ? " — veel, kost laadtijd." : " — zeer veel, klassiek plugin-symptoom."
        }`,
      },
      {
        key: "stack",
        ok: heavyCms ? "warn" : true,
        label: "Platform",
        detail: heavyCms
          ? `${stack} gedetecteerd — vaak traag en plugin-afhankelijk.`
          : `Gedetecteerd: ${stack}.`,
      },
    ];

    const scored = signals.reduce(
      (s, x) => s + (x.ok === true ? 1 : x.ok === "warn" ? 0.5 : 0),
      0,
    );
    const score = Math.round((scored / signals.length) * 100);

    return {
      ok: true,
      url: url.toString(),
      finalUrl: res.url,
      score,
      stack,
      responseMs,
      htmlKb,
      signals,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: aborted
        ? "De site reageerde niet binnen 9 seconden — dat is op zich al een signaal."
        : "Kon de site niet bereiken. Bestaat het adres, en staat de site online?",
    };
  } finally {
    clearTimeout(timer);
  }
}
