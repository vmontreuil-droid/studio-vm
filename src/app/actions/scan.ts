"use server";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ScanCat = "speed" | "seo" | "mobile" | "security" | "platform";
export type Severity = "critical" | "warning" | "good" | "info";

export type TechType =
  | "cms"
  | "ecommerce"
  | "builder"
  | "theme"
  | "plugin"
  | "analytics"
  | "marketing"
  | "library"
  | "font"
  | "framework"
  | "cdn"
  | "host";

export type Tech = { name: string; type: TechType; version?: string };

export type Finding = {
  key: string;
  cat: ScanCat;
  severity: Severity;
  value?: string;
};

export type HeaderCheck = { key: string; present: boolean; value?: string };

export type CategoryScore = { cat: ScanCat; score: number };

export type ScanResult =
  | {
      ok: true;
      url: string;
      finalUrl: string;
      host: string;
      ip: string | null;
      score: number;
      grade: string;
      stack: string;
      builtBy: string | null;
      hosting: string | null;
      responseMs: number;
      htmlKb: number;
      title: string | null;
      titleLen: number;
      metaDescLen: number;
      h1Count: number;
      imgCount: number;
      imgMissingAlt: number;
      technologies: Tech[];
      headers: HeaderCheck[];
      findings: Finding[];
      categories: CategoryScore[];
      pitfalls: string[];
      flags: {
        diyPlatform: boolean;
        outdated: boolean;
        insecure: boolean;
        slow: boolean;
        bloated: boolean;
        modern: boolean;
      };
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

async function resolveIp(hostname: string): Promise<string | null> {
  if (isIP(hostname)) return hostname;
  try {
    const r = await lookup(hostname, { all: true });
    return r[0]?.address ?? null;
  } catch {
    return null;
  }
}

const WP_PLUGIN_NAMES: Record<string, string> = {
  woocommerce: "WooCommerce",
  elementor: "Elementor",
  "elementor-pro": "Elementor Pro",
  "js_composer": "WPBakery Page Builder",
  divi: "Divi Builder",
  "contact-form-7": "Contact Form 7",
  wpforms: "WPForms",
  "wpforms-lite": "WPForms Lite",
  "wordpress-seo": "Yoast SEO",
  "all-in-one-seo-pack": "All in One SEO",
  "seo-by-rank-math": "Rank Math SEO",
  "wp-rocket": "WP Rocket",
  "w3-total-cache": "W3 Total Cache",
  "wp-super-cache": "WP Super Cache",
  litespeed_cache: "LiteSpeed Cache",
  "wp-optimize": "WP-Optimize",
  akismet: "Akismet",
  jetpack: "Jetpack",
  wordfence: "Wordfence Security",
  "better-wp-security": "iThemes Security",
  updraftplus: "UpdraftPlus Backup",
  "wp-mail-smtp": "WP Mail SMTP",
  mailchimp: "Mailchimp",
  "mailchimp-for-wp": "Mailchimp for WP",
  "ninja-forms": "Ninja Forms",
  "gravityforms": "Gravity Forms",
  "really-simple-ssl": "Really Simple SSL",
  "cookie-law-info": "CookieYes",
  "complianz-gdpr": "Complianz GDPR",
  "wp-google-maps": "WP Google Maps",
  "smush": "Smush (image opt.)",
  "ewww-image-optimizer": "EWWW Image Optimizer",
  "redirection": "Redirection",
  "duplicate-post": "Yoast Duplicate Post",
  "classic-editor": "Classic Editor",
  "advanced-custom-fields": "ACF",
  "wp-super-cache/": "WP Super Cache",
  "loco-translate": "Loco Translate",
  polylang: "Polylang",
  wpml: "WPML",
  "sitepress-multilingual-cms": "WPML",
};

const HEAVY_PLUGINS = new Set([
  "elementor",
  "elementor-pro",
  "js_composer",
  "divi",
  "jetpack",
  "revslider",
  "wp-google-maps",
]);

function pretty(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

type Detection = {
  technologies: Tech[];
  stack: string;
  hosting: string | null;
  builtBy: string | null;
  pluginCount: number;
  hasOutdatedLib: boolean;
  outdatedLibName: string | null;
};

function detect(headers: Headers, html: string, finalUrl: string): Detection {
  const tech: Tech[] = [];
  const seen = new Set<string>();
  const add = (name: string, type: TechType, version?: string) => {
    const id = `${type}:${name.toLowerCase()}`;
    if (seen.has(id)) return;
    seen.add(id);
    tech.push({ name, type, version });
  };

  const server = (headers.get("server") || "").toLowerCase();
  const powered = (headers.get("x-powered-by") || "").toLowerCase();
  const via = (headers.get("via") || "").toLowerCase();
  const gen = (
    html.match(
      /<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i,
    )?.[1] || ""
  ).trim();
  const genL = gen.toLowerCase();
  const author = (
    html.match(
      /<meta\s+name=["']author["']\s+content=["']([^"']{2,80})["']/i,
    )?.[1] || ""
  ).trim();
  const h = html.toLowerCase();

  // ---- Hosting / CDN ----
  let hosting: string | null = null;
  if (headers.get("x-vercel-id") || server.includes("vercel"))
    hosting = "Vercel";
  else if (headers.get("cf-ray") || server.includes("cloudflare"))
    hosting = "Cloudflare";
  else if (headers.get("x-nf-request-id")) hosting = "Netlify";
  else if (headers.get("x-github-request-id")) hosting = "GitHub Pages";
  else if (headers.get("x-amz-cf-id") || headers.get("x-amz-cf-pop"))
    hosting = "AWS CloudFront";
  else if (server.includes("amazons3")) hosting = "AWS S3";
  else if (headers.get("x-azure-ref")) hosting = "Microsoft Azure";
  else if (
    headers.get("x-served-by") &&
    (via.includes("varnish") || headers.get("x-cache"))
  )
    hosting = "Fastly";
  else if (h.includes("static1.squarespace") || server.includes("squarespace"))
    hosting = "Squarespace (gesloten platform)";
  else if (h.includes("wix.com") || headers.get("x-wix-request-id"))
    hosting = "Wix (gesloten platform)";
  else if (headers.get("x-shopid") || h.includes("cdn.shopify.com"))
    hosting = "Shopify";
  else if (server.includes("openresty")) hosting = "OpenResty (nginx)";
  else if (server.includes("litespeed")) hosting = "LiteSpeed-server";
  else if (server.includes("microsoft-iis")) hosting = "Microsoft IIS";
  else if (server.includes("nginx")) hosting = "Nginx-server";
  else if (server.includes("apache")) hosting = "Apache-server";
  else if (server.includes("gse")) hosting = "Google";
  else if (server) hosting = gen ? null : server;
  if (hosting) add(hosting.replace(/\s*\(.*$/, ""), "host");

  // ---- CMS / platform ----
  let stack = "onbekend";
  const isWP =
    genL.includes("wordpress") ||
    h.includes("/wp-content/") ||
    h.includes("/wp-json") ||
    h.includes("/wp-includes/");
  if (headers.get("x-shopid") || h.includes("cdn.shopify.com")) {
    stack = "Shopify";
    add("Shopify", "ecommerce");
  } else if (
    server.includes("squarespace") ||
    genL.includes("squarespace") ||
    h.includes("static1.squarespace")
  ) {
    stack = "Squarespace";
    add("Squarespace", "builder");
  } else if (h.includes("wix.com") || headers.get("x-wix-request-id")) {
    stack = "Wix";
    add("Wix", "builder");
  } else if (
    h.includes("assets.website-files.com") ||
    h.includes(".webflow.io") ||
    server.includes("webflow")
  ) {
    stack = "Webflow";
    add("Webflow", "builder");
  } else if (genL.includes("jimdo") || h.includes("jimdo")) {
    stack = "Jimdo";
    add("Jimdo", "builder");
  } else if (h.includes("weebly.com") || genL.includes("weebly")) {
    stack = "Weebly";
    add("Weebly", "builder");
  } else if (h.includes("sites.google.com")) {
    stack = "Google Sites";
    add("Google Sites", "builder");
  } else if (genL.includes("godaddy")) {
    stack = "GoDaddy Website Builder";
    add("GoDaddy Builder", "builder");
  } else if (genL.includes("duda") || h.includes("dudamobile")) {
    stack = "Duda";
    add("Duda", "builder");
  } else if (isWP) {
    stack = "WordPress";
    const wpVer = gen.match(/WordPress\s+([0-9.]+)/i)?.[1];
    add("WordPress", "cms", wpVer);
  } else if (genL.includes("drupal") || h.includes("drupal.settings")) {
    stack = "Drupal";
    add("Drupal", "cms", gen.match(/Drupal\s+([0-9.]+)/i)?.[1]);
  } else if (genL.includes("joomla")) {
    stack = "Joomla";
    add("Joomla", "cms");
  } else if (genL.includes("typo3")) {
    stack = "TYPO3";
    add("TYPO3", "cms");
  } else if (genL.includes("prestashop") || h.includes("prestashop")) {
    stack = "PrestaShop";
    add("PrestaShop", "ecommerce");
  } else if (
    powered.includes("next.js") ||
    h.includes("/_next/") ||
    h.includes("__next_data__")
  ) {
    stack = "Next.js";
    add("Next.js", "framework");
  } else if (h.includes("__nuxt") || powered.includes("nuxt")) {
    stack = "Nuxt";
    add("Nuxt", "framework");
  } else if (h.includes("___gatsby")) {
    stack = "Gatsby";
    add("Gatsby", "framework");
  } else if (h.includes("__sveltekit") || h.includes("svelte")) {
    stack = "SvelteKit";
    add("SvelteKit", "framework");
  } else if (h.includes("data-astro") || h.includes("astro-island")) {
    stack = "Astro";
    add("Astro", "framework");
  } else if (genL.includes("hugo")) {
    stack = "Hugo";
    add("Hugo", "framework");
  } else if (genL.includes("jekyll")) {
    stack = "Jekyll";
    add("Jekyll", "framework");
  } else if (gen) {
    stack = gen.split(/[\s/]/)[0];
    add(stack, "cms");
  }

  // ---- WordPress plugins + theme ----
  let pluginCount = 0;
  if (isWP) {
    const slugs = new Set<string>();
    const re = /\/wp-content\/plugins\/([a-z0-9][a-z0-9._-]+?)[/?'"]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) slugs.add(m[1].toLowerCase());
    for (const s of slugs) {
      pluginCount++;
      add(WP_PLUGIN_NAMES[s] || pretty(s), "plugin");
    }
    const themeRe = /\/wp-content\/themes\/([a-z0-9][a-z0-9._-]+?)[/?'"]/i;
    const theme = html.match(themeRe)?.[1];
    if (theme) add(pretty(theme), "theme");
  }

  // ---- Page builders (non-WP-slug detection) ----
  if (h.includes("elementor") && !seen.has("plugin:elementor"))
    add("Elementor", "builder");
  if (h.includes("et_pb_") || h.includes("divi")) add("Divi", "builder");
  if (h.includes("vc_row") || h.includes("js_composer"))
    add("WPBakery", "builder");
  if (h.includes("fl-builder")) add("Beaver Builder", "builder");
  if (h.includes("brizy")) add("Brizy", "builder");
  if (h.includes("oxygen-")) add("Oxygen Builder", "builder");

  // ---- E-commerce ----
  if (h.includes("woocommerce") || h.includes("/wc-ajax/"))
    add("WooCommerce", "ecommerce");
  if (h.includes("mage/") || h.includes("magento")) add("Magento", "ecommerce");
  if (h.includes("webshopapp") || h.includes("seoshop"))
    add("Lightspeed eCom", "ecommerce");

  // ---- Analytics ----
  if (h.includes("googletagmanager.com/gtm.js"))
    add("Google Tag Manager", "analytics");
  if (
    h.includes("google-analytics.com/analytics.js") ||
    /gtag\/js\?id=g-/i.test(html) ||
    /gtag\/js\?id=ua-/i.test(html)
  )
    add("Google Analytics", "analytics");
  if (h.includes("static.hotjar.com")) add("Hotjar", "analytics");
  if (h.includes("clarity.ms")) add("Microsoft Clarity", "analytics");
  if (h.includes("plausible.io")) add("Plausible", "analytics");
  if (h.includes("matomo") || h.includes("piwik")) add("Matomo", "analytics");
  if (h.includes("connect.facebook.net") && h.includes("fbq("))
    add("Meta Pixel", "marketing");

  // ---- Marketing / e-mail ----
  if (h.includes("chimpstatic.com") || h.includes("list-manage.com"))
    add("Mailchimp", "marketing");
  if (h.includes("js.hs-scripts.com") || h.includes("hsforms"))
    add("HubSpot", "marketing");
  if (h.includes("klaviyo")) add("Klaviyo", "marketing");
  if (h.includes("activehosted.com")) add("ActiveCampaign", "marketing");

  // ---- Libraries (+ versies / verouderd) ----
  let hasOutdatedLib = false;
  let outdatedLibName: string | null = null;
  const jqVer =
    html.match(/jquery[/-]?v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i)?.[1] ||
    html.match(/jQuery\s+v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i)?.[1];
  if (h.includes("jquery")) {
    add("jQuery", "library", jqVer);
    const major = jqVer ? parseInt(jqVer.split(".")[0], 10) : null;
    const minor = jqVer ? parseInt(jqVer.split(".")[1] || "0", 10) : null;
    if (major !== null && (major < 3 || (major === 3 && (minor ?? 0) < 5))) {
      hasOutdatedLib = true;
      outdatedLibName = `jQuery ${jqVer}`;
    }
  }
  const bsVer = html.match(/bootstrap[/-]?v?([0-9]+\.[0-9]+)/i)?.[1];
  if (h.includes("bootstrap")) {
    add("Bootstrap", "library", bsVer);
    if (bsVer && parseInt(bsVer.split(".")[0], 10) < 4) {
      hasOutdatedLib = true;
      outdatedLibName = outdatedLibName || `Bootstrap ${bsVer}`;
    }
  }
  if (h.includes("font-awesome") || h.includes("fontawesome"))
    add("Font Awesome", "library");
  if (h.includes("swiper")) add("Swiper", "library");
  if (h.includes("slick.") || h.includes("slick-carousel"))
    add("Slick Carousel", "library");
  if (h.includes("owl.carousel") || h.includes("owl-carousel"))
    add("Owl Carousel", "library");
  if (h.includes("gsap") || h.includes("tweenmax")) add("GSAP", "library");
  if (h.includes("aos.js") || h.includes("aos.css"))
    add("AOS (scroll-animaties)", "library");
  if (
    (h.includes("react-dom") || h.includes("__next_data__")) &&
    stack !== "Next.js"
  )
    add("React", "library");
  if (h.includes("vue.js") || h.includes("__vue__")) add("Vue", "library");
  if (/ng-version=["'][0-9]/.test(html)) add("Angular", "library");

  // ---- Fonts ----
  if (h.includes("fonts.googleapis.com") || h.includes("fonts.gstatic.com"))
    add("Google Fonts", "font");
  if (h.includes("use.typekit.net") || h.includes("adobe fonts"))
    add("Adobe Fonts", "font");

  // ---- CDN ----
  if (h.includes("cdnjs.cloudflare.com")) add("cdnjs", "cdn");
  if (h.includes("jsdelivr.net")) add("jsDelivr", "cdn");
  if (h.includes("unpkg.com")) add("unpkg", "cdn");
  if (h.includes("bootstrapcdn.com")) add("BootstrapCDN", "cdn");

  // ---- Wie heeft het gebouwd ----
  let builtBy: string | null = null;
  const diy = ["Wix", "Squarespace", "Weebly", "Jimdo", "Google Sites"];
  if (diy.includes(stack)) {
    builtBy = `Zelf gebouwd op ${stack} (DIY-bouwplatform)`;
  } else {
    const credit =
      html.match(
        /(?:gemaakt|ontworpen|ontwikkeld|webdesign|website|realisatie|made|built|designed|developed|created|powered|site|réalisé|conçu|développé|création)\s*(?:door|by|par|:)\s*<a[^>]*href=["']([^"']+)["'][^>]*>\s*([^<]{2,60}?)\s*<\/a>/i,
      ) ||
      html.match(
        /<a[^>]*href=["']([^"']+)["'][^>]*>\s*([^<]{2,40}?)\s*<\/a>\s*(?:heeft deze (?:site|website))/i,
      );
    if (credit) {
      let dom = "";
      try {
        dom = new URL(credit[1], finalUrl).hostname.replace(/^www\./, "");
      } catch {}
      const label = credit[2].trim();
      builtBy = dom && !label.toLowerCase().includes(dom) ? `${label} (${dom})` : label;
    } else if (author) {
      builtBy = author;
    } else if (gen && !/wordpress|^drupal|joomla/i.test(genL)) {
      builtBy = `Gegenereerd met ${gen}`;
    }
  }

  return {
    technologies: tech,
    stack,
    hosting,
    builtBy,
    pluginCount,
    hasOutdatedLib,
    outdatedLibName,
  };
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

  const ip = await resolveIp(url.hostname);

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
    const det = detect(res.headers, html, res.url);
    const stack = det.stack;
    const head = res.headers;
    const isHttps =
      url.protocol === "https:" || res.url.startsWith("https:");

    // ---- HTML-analyse ----
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
    const titleLen = title?.length ?? 0;
    const metaDesc =
      html
        .match(
          /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
        )?.[1]
        ?.trim() || "";
    const metaDescLen = metaDesc.length;
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const imgCount = imgTags.length;
    const imgMissingAlt = imgTags.filter(
      (t) => !/\balt\s*=/.test(t),
    ).length;
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    const noindex =
      /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
      (head.get("x-robots-tag") || "").toLowerCase().includes("noindex");
    const langAttr = /<html[^>]+lang=["'][a-z]/i.test(html);
    const ogCount = (
      html.match(/<meta\s+property=["']og:(title|description|image)["']/gi) ||
      []
    ).length;
    const hasTwitter = /<meta\s+name=["']twitter:card["']/i.test(html);
    const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(
      html,
    );
    const hasFavicon =
      /<link[^>]+rel=["'][^"']*icon["']/i.test(html) ||
      /<link[^>]+rel=["']apple-touch-icon["']/i.test(html);
    const enc = (head.get("content-encoding") || "").toLowerCase();
    const compressed = enc.includes("gzip") || enc.includes("br");
    const scriptCount = (html.match(/<script[\s>]/gi) || []).length;
    const inlineStyle = (html.match(/style\s*=\s*["']/gi) || []).length;
    const extDomains = new Set(
      (html.match(/https?:\/\/([a-z0-9.-]+)/gi) || [])
        .map((u) => {
          try {
            return new URL(u).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })
        .filter(
          (d) => d && d !== url.hostname.replace(/^www\./, ""),
        ),
    ).size;
    const mixedContent =
      isHttps && /<(?:script|img|link)[^>]+(?:src|href)=["']http:\/\//i.test(html);

    // ---- Security headers ----
    const hsts = head.get("strict-transport-security");
    const csp = head.get("content-security-policy");
    const xfo = head.get("x-frame-options");
    const xcto = head.get("x-content-type-options");
    const refpol = head.get("referrer-policy");
    const permpol = head.get("permissions-policy");
    const setCookie = head.get("set-cookie") || "";
    const serverHdr = head.get("server") || "";
    const poweredHdr = head.get("x-powered-by") || "";
    const versionLeak =
      /[0-9]/.test(serverHdr) || /[0-9]/.test(poweredHdr) || !!poweredHdr;

    const headers: HeaderCheck[] = [
      { key: "hsts", present: !!hsts, value: hsts || undefined },
      { key: "csp", present: !!csp },
      { key: "xfo", present: !!xfo, value: xfo || undefined },
      { key: "xcto", present: !!xcto, value: xcto || undefined },
      { key: "referrer", present: !!refpol, value: refpol || undefined },
      { key: "permissions", present: !!permpol },
    ];

    const slow = responseMs > 1500;
    const okSpeed = responseMs <= 800;
    const heavyCms = ["WordPress", "Drupal", "Joomla", "Wix"].includes(stack);
    const diyPlatform = ["Wix", "Squarespace", "Weebly", "Jimdo", "Google Sites"].includes(
      stack,
    );

    const F = (
      key: string,
      cat: ScanCat,
      severity: Severity,
      value?: string,
    ): Finding => ({ key, cat, severity, value });

    const findings: Finding[] = [
      // Security
      F("https", "security", isHttps ? "good" : "critical"),
      F("hsts", "security", hsts ? "good" : isHttps ? "warning" : "info"),
      F("csp", "security", csp ? "good" : "warning"),
      F("xfo", "security", xfo ? "good" : "warning"),
      F("xcto", "security", xcto ? "good" : "warning"),
      F("referrer", "security", refpol ? "good" : "info"),
      F("permissions", "security", permpol ? "good" : "info"),
      F(
        "versionLeak",
        "security",
        versionLeak ? "warning" : "good",
        [serverHdr, poweredHdr].filter(Boolean).join(" · ") || undefined,
      ),
      F(
        "mixedContent",
        "security",
        mixedContent ? "critical" : "good",
      ),
      F(
        "cookieFlags",
        "security",
        !setCookie
          ? "info"
          : /httponly/i.test(setCookie) && /secure/i.test(setCookie)
            ? "good"
            : "warning",
      ),
      // Speed
      F(
        "ttfb",
        "speed",
        okSpeed ? "good" : slow ? "critical" : "warning",
        `${responseMs} ms`,
      ),
      F(
        "htmlWeight",
        "speed",
        htmlKb < 150 ? "good" : htmlKb < 400 ? "warning" : "critical",
        `${htmlKb} KB`,
      ),
      F("compression", "speed", compressed ? "good" : "warning", enc || undefined),
      F(
        "scripts",
        "speed",
        scriptCount < 12 ? "good" : scriptCount < 25 ? "warning" : "critical",
        `${scriptCount}`,
      ),
      F(
        "externalDomains",
        "speed",
        extDomains < 6 ? "good" : extDomains < 12 ? "warning" : "critical",
        `${extDomains}`,
      ),
      F(
        "inlineCss",
        "speed",
        inlineStyle < 15 ? "good" : inlineStyle < 40 ? "warning" : "critical",
        `${inlineStyle}`,
      ),
      // SEO
      F("title", "seo", title ? "good" : "critical", title || undefined),
      F(
        "titleLen",
        "seo",
        !title
          ? "critical"
          : titleLen >= 30 && titleLen <= 65
            ? "good"
            : "warning",
        `${titleLen}`,
      ),
      F(
        "metaDesc",
        "seo",
        metaDescLen >= 50 ? "good" : metaDescLen > 0 ? "warning" : "critical",
      ),
      F(
        "metaDescLen",
        "seo",
        metaDescLen >= 70 && metaDescLen <= 165
          ? "good"
          : metaDescLen > 0
            ? "warning"
            : "info",
        `${metaDescLen}`,
      ),
      F(
        "h1",
        "seo",
        h1Count === 1 ? "good" : h1Count === 0 ? "critical" : "warning",
        `${h1Count}`,
      ),
      F("canonical", "seo", hasCanonical ? "good" : "warning"),
      F("noindex", "seo", noindex ? "critical" : "good"),
      F("og", "seo", ogCount >= 2 ? "good" : "warning", `${ogCount}/3`),
      F("twitter", "seo", hasTwitter ? "good" : "info"),
      F("structuredData", "seo", hasJsonLd ? "good" : "warning"),
      F("favicon", "seo", hasFavicon ? "good" : "info"),
      F(
        "imgAlt",
        "seo",
        imgCount === 0
          ? "info"
          : imgMissingAlt === 0
            ? "good"
            : imgMissingAlt / imgCount > 0.3
              ? "critical"
              : "warning",
        imgCount ? `${imgMissingAlt}/${imgCount}` : undefined,
      ),
      // Mobile
      F("viewport", "mobile", hasViewport ? "good" : "critical"),
      F("langAttr", "mobile", langAttr ? "good" : "warning"),
      // Platform
      F(
        "stack",
        "platform",
        diyPlatform ? "warning" : heavyCms ? "warning" : "good",
        stack,
      ),
      F(
        "pluginBloat",
        "platform",
        det.pluginCount === 0
          ? "good"
          : det.pluginCount < 8
            ? "info"
            : det.pluginCount < 15
              ? "warning"
              : "critical",
        det.pluginCount ? `${det.pluginCount}` : undefined,
      ),
      F(
        "outdatedLib",
        "platform",
        det.hasOutdatedLib ? "critical" : "good",
        det.outdatedLibName || undefined,
      ),
      F(
        "builderLockin",
        "platform",
        diyPlatform ? "warning" : "good",
        diyPlatform ? stack : undefined,
      ),
    ];

    const W: Record<Severity, number> = {
      good: 1,
      info: 1,
      warning: 0.5,
      critical: 0,
    };
    const scoreable = findings.filter((f) => f.severity !== "info");
    const score = Math.round(
      (scoreable.reduce((s, f) => s + W[f.severity], 0) /
        Math.max(1, scoreable.length)) *
        100,
    );
    const grade =
      score >= 90
        ? "A"
        : score >= 75
          ? "B"
          : score >= 60
            ? "C"
            : score >= 45
              ? "D"
              : score >= 30
                ? "E"
                : "F";

    const cats: ScanCat[] = ["speed", "seo", "mobile", "security", "platform"];
    const categories: CategoryScore[] = cats.map((cat) => {
      const sig = findings.filter(
        (s) => s.cat === cat && s.severity !== "info",
      );
      const sc = sig.reduce((s, x) => s + W[x.severity], 0);
      return {
        cat,
        score: sig.length ? Math.round((sc / sig.length) * 100) : 100,
      };
    });

    const pitfalls = findings
      .filter((f) => f.severity === "critical")
      .concat(findings.filter((f) => f.severity === "warning"))
      .slice(0, 6)
      .map((f) => f.key);

    const flags = {
      diyPlatform,
      outdated: det.hasOutdatedLib || det.pluginCount >= 15,
      insecure: !isHttps || !!mixedContent || (!hsts && !csp),
      slow,
      bloated: scriptCount >= 25 || htmlKb >= 400 || det.pluginCount >= 15,
      modern:
        ["Next.js", "Nuxt", "Astro", "SvelteKit", "Gatsby"].includes(stack) &&
        score >= 75,
    };

    let host = url.hostname;
    try {
      host = new URL(res.url).hostname;
    } catch {}

    return {
      ok: true,
      url: url.toString(),
      finalUrl: res.url,
      host,
      ip,
      score,
      grade,
      stack,
      builtBy: det.builtBy,
      hosting: det.hosting,
      responseMs,
      htmlKb,
      title,
      titleLen,
      metaDescLen,
      h1Count,
      imgCount,
      imgMissingAlt,
      technologies: det.technologies,
      headers,
      findings,
      categories,
      pitfalls,
      flags,
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
