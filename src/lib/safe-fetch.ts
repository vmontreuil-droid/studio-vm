// SSRF-veilig ophalen van een externe webpagina.
//
// Gedeeld door de site-scan (src/app/actions/scan.ts) en de outreach-
// engine (homepage van een aannemer lezen op machinesturing-signalen,
// website-discovery die een geraden domein nakijkt).
//
// Bescherming:
//   - enkel http/https;
//   - host mag niet naar een privé-, loopback-, link-local- of
//     metadata-adres wijzen (DNS wordt vooraf opgelost en gecontroleerd);
//   - redirects worden MANUEEL gevolgd (max. 4 sprongen) en elke
//     tussenstap wordt opnieuw gevalideerd;
//   - korte time-out en een harde limiet op het aantal gelezen bytes.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Blokkeer private / loopback / link-local / metadata ranges.
export function isBlockedIp(ip: string): boolean {
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

// Geeft een foutmelding terug als de host niet bevraagd mag worden,
// anders null.
export async function validateHost(hostname: string): Promise<string | null> {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
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

export type SafePage = {
  ok: boolean;
  status: number;
  finalUrl: string;
  contentType: string;
  text: string;
};

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  accept?: string;
};

const DEFAULT_UA =
  "StudioVM/1.0 (+https://studio-vm.be; leest enkel de publieke homepage)";

/** Normaliseer een ruwe website-waarde ("www.x.be", "x.be/", "http://x.be"). */
export function toHttpUrl(raw: string): URL | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * Haal één pagina op (GET) met SSRF-bescherming. Geeft null bij een
 * geblokkeerde host, netwerkfout of time-out. Leest hoogstens maxBytes.
 */
export async function safeFetchText(
  rawUrl: string,
  opts: SafeFetchOptions = {},
): Promise<SafePage | null> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxBytes = opts.maxBytes ?? 400_000;
  const maxRedirects = opts.maxRedirects ?? 4;

  let url: URL | null = toHttpUrl(rawUrl);
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      if (await validateHost(url.hostname)) return null;

      const res: Response = await fetch(url.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": opts.userAgent ?? DEFAULT_UA,
          Accept: opts.accept ?? "text/html,application/xhtml+xml",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const loc: string | null = res.headers.get("location");
        await res.body?.cancel().catch(() => {});
        if (!loc) return null;
        try {
          url = new URL(loc, url);
        } catch {
          return null;
        }
        continue;
      }

      const contentType = res.headers.get("content-type") ?? "";
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      if (reader) {
        while (received < maxBytes) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
          }
        }
        await reader.cancel().catch(() => {});
      }
      const all = new Uint8Array(Math.min(received, maxBytes));
      let o = 0;
      for (const ch of chunks) {
        if (o >= all.length) break;
        const part = ch.subarray(0, all.length - o);
        all.set(part, o);
        o += part.length;
      }
      return {
        ok: res.ok,
        status: res.status,
        finalUrl: url.toString(),
        contentType,
        text: new TextDecoder().decode(all),
      };
    }
    return null; // te veel redirects
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
