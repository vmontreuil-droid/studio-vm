"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Ruwe import van een bestaande site: we halen de homepage op en
// distilleren naam, baseline, intro, koppen, foto's en contact zodat
// de builder een eerste invulling heeft. Bewust "grof" — de klant
// schaaft daarna bij. SSRF-bescherming zoals in de scan.

export type ImportedSite = {
  businessName: string;
  tagline: string;
  heading: string;
  about: string;
  features: { title: string; desc: string }[];
  images: string[];
  email: string;
  phone: string;
  address: string;
  accent: string;
};

export type ImportResult =
  | { ok: true; site: ImportedSite }
  | { ok: false; error: string };

function isBlockedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = ip.split(".").map(Number);
    if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
    if (p[0] >= 224) return true;
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
  )
    return "host niet toegelaten";
  if (isIP(h))
    return isBlockedIp(h) ? "intern IP-adres niet toegelaten" : null;
  try {
    const records = await lookup(h, { all: true });
    if (records.length === 0) return "host niet vindbaar";
    for (const r of records)
      if (isBlockedIp(r.address)) return "host wijst naar een intern adres";
    return null;
  } catch {
    return "host niet vindbaar (DNS)";
  }
}

const MAX = 700_000;

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n));
      } catch {
        return "";
      }
    })
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, " "));
}

export async function importSite(rawInput: string): Promise<ImportResult> {
  const raw = (rawInput || "").trim();
  if (!raw) return { ok: false, error: "Geef een website-adres in." };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, error: "Dat is geen geldig webadres." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return { ok: false, error: "Enkel http(s)-adressen." };
  const he = await validateHost(url.hostname);
  if (he) return { ok: false, error: he };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "StudioVM-SiteImport/1.0 (+https://studio-vm.be; eenmalige import)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    try {
      const fh = new URL(res.url).hostname;
      if (fh !== url.hostname && (await validateHost(fh)))
        return { ok: false, error: "redirect naar intern adres" };
    } catch {}

    const reader = res.body?.getReader();
    let got = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (got < MAX) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          got += value.length;
        }
      }
      await reader.cancel().catch(() => {});
    }
    const all = new Uint8Array(got);
    let o = 0;
    for (const c of chunks) {
      all.set(c.subarray(0, Math.max(0, got - o)), o);
      o += c.length;
    }
    const html = new TextDecoder().decode(all);
    const base = res.url || url.toString();

    const meta = (re: RegExp) => html.match(re)?.[1]?.trim() || "";
    const ogSite = meta(
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    );
    const ogTitle = meta(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    );
    const titleTag = meta(/<title[^>]*>([^<]+)<\/title>/i);
    const desc =
      meta(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      ) ||
      meta(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      );
    const themeColor = meta(
      /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
    );

    const rawName = ogSite || titleTag || ogTitle;
    const businessName =
      decode(rawName).split(/\s[|–—\-·:]\s/)[0].trim() ||
      decode(rawName);

    const h1 = meta(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const heading = h1 ? stripTags(h1).slice(0, 90) : businessName;

    // Langste zinnige <p> als "over ons".
    let about = "";
    for (const m of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
      const t = stripTags(m[1]);
      if (t.length > about.length && t.length >= 60 && t.length <= 600)
        about = t;
      if (about.length > 280) break;
    }

    // Koppen → troeven.
    const features: { title: string; desc: string }[] = [];
    const seen = new Set<string>();
    for (const m of html.matchAll(
      /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    )) {
      const t = stripTags(m[2]).slice(0, 70);
      const key = t.toLowerCase();
      if (t.length >= 3 && t.length <= 70 && !seen.has(key)) {
        seen.add(key);
        features.push({ title: t, desc: "" });
      }
      if (features.length >= 6) break;
    }

    // Beelden: absolute URL's, geen icoontjes/sprites/data.
    const imgs: string[] = [];
    const pushImg = (src: string) => {
      if (!src || imgs.length >= 8) return;
      if (/^data:|sprite|icon|logo|favicon|\.svg(?:$|\?)/i.test(src)) return;
      let abs = "";
      try {
        abs = new URL(src, base).toString();
      } catch {
        return;
      }
      if (!/^https?:/i.test(abs)) return;
      if (!imgs.includes(abs)) imgs.push(abs);
    };
    pushImg(
      meta(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ),
    );
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0];
      const src =
        tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
        tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ||
        "";
      pushImg(src);
      if (imgs.length >= 8) break;
    }

    const text = stripTags(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " "),
    );
    const email =
      html.match(/mailto:([^"'?]+)/i)?.[1] ||
      text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] ||
      "";
    const phone =
      decode(html.match(/tel:([+0-9()\s.-]{6,})/i)?.[1] || "") ||
      text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] ||
      "";
    const address =
      text.match(
        /[A-ZÀ-Ÿ][\w.'-]+(?:straat|laan|weg|plein|baan|steenweg|dreef|rue|avenue|chaussée|street|road)\s*\d+[^,.]{0,40},?\s*\d{4,5}\s+[A-ZÀ-Ÿ][\w-]+/i,
      )?.[0] || "";

    const accent = /^#[0-9a-f]{3,8}$/i.test(themeColor) ? themeColor : "";

    return {
      ok: true,
      site: {
        businessName: businessName.slice(0, 80) || "Mijn Zaak",
        tagline: decode(desc).slice(0, 200),
        heading: heading || businessName,
        about: about.slice(0, 600),
        features: features.slice(0, 6),
        images: imgs.slice(0, 8),
        email: email.trim().slice(0, 120),
        phone: phone.trim().slice(0, 40),
        address: address.trim().slice(0, 160),
        accent,
      },
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: aborted
        ? "De site reageerde niet op tijd."
        : "Kon de site niet ophalen. Klopt het adres en staat de site online?",
    };
  } finally {
    clearTimeout(timer);
  }
}
