"use server";

import {
  lookup,
  resolveTxt,
  resolveMx,
  resolve6,
  resolveCaa,
} from "node:dns/promises";
import { isIP } from "node:net";
import { connect as tlsConnect } from "node:tls";

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
      cwvRisk: "low" | "medium" | "high";
      tls: {
        issuer: string | null;
        validTo: string | null;
        daysLeft: number | null;
        protocol: string | null;
        valid: boolean;
      } | null;
      dns: {
        spf: boolean;
        dmarc: boolean;
        mx: boolean;
        caa: boolean;
        ipv6: boolean;
      } | null;
      crawledPages: number;
      brokenLinks: string[];
      inventory: {
        pages: number | null;
        shop: boolean;
        multilingual: boolean;
        forms: boolean;
        booking: boolean;
        blog: boolean;
        members: boolean;
        mediaHeavy: boolean;
        pageBuilder: boolean;
      };
      flags: {
        diyPlatform: boolean;
        outdated: boolean;
        insecure: boolean;
        slow: boolean;
        bloated: boolean;
        modern: boolean;
        abandoned: boolean;
        gdprRisk: boolean;
        mailSpoofable: boolean;
        certExpiring: boolean;
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

const UA =
  "StudioVM-SiteCheck/1.0 (+https://studio-vm.be; vriendelijke diagnose, geen crawl)";

type Probe = {
  status: number;
  ok: boolean;
  text: string;
  location: string | null;
  cache: string;
} | null;

// Veilige same-origin sub-probe: opnieuw DNS-gevalideerd, korte timeout, kleine cap.
async function probe(
  origin: string,
  path: string,
  manualRedirect = false,
): Promise<Probe> {
  let u: URL;
  try {
    u = new URL(path, origin);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (await validateHost(u.hostname)) return null;

  const c = new AbortController();
  const tm = setTimeout(() => c.abort(), 4500);
  try {
    const r = await fetch(u.toString(), {
      method: "GET",
      redirect: manualRedirect ? "manual" : "follow",
      signal: c.signal,
      headers: { "User-Agent": UA, Accept: "*/*" },
    });
    if (!manualRedirect) {
      try {
        const fh = new URL(r.url).hostname;
        if (fh !== u.hostname && (await validateHost(fh))) return null;
      } catch {}
    }
    const cap = 64_000;
    let got = 0;
    const parts: Uint8Array[] = [];
    const rd = r.body?.getReader();
    if (rd) {
      while (got < cap) {
        const { done, value } = await rd.read();
        if (done) break;
        if (value) {
          parts.push(value);
          got += value.length;
        }
      }
      await rd.cancel().catch(() => {});
    }
    const buf = new Uint8Array(Math.min(got, cap));
    let o = 0;
    for (const p of parts) {
      if (o >= cap) break;
      buf.set(p.subarray(0, cap - o), o);
      o += p.length;
    }
    return {
      status: r.status,
      ok: r.ok,
      text: new TextDecoder().decode(buf),
      location: r.headers.get("location"),
      cache: [
        r.headers.get("cache-control"),
        r.headers.get("etag"),
        r.headers.get("last-modified"),
        r.headers.get("expires"),
      ]
        .filter(Boolean)
        .join(" | "),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(tm);
  }
}

// DNS- & mailhygiëne: enkel DNS-queries, geen HTTP — SSRF-irrelevant.
async function dnsAudit(host: string): Promise<{
  spf: boolean;
  dmarc: boolean;
  mx: boolean;
  caa: boolean;
  ipv6: boolean;
} | null> {
  const apex = host.replace(/^www\./, "");
  const txt = async (name: string) => {
    try {
      return (await resolveTxt(name)).map((r) => r.join(""));
    } catch {
      return [] as string[];
    }
  };
  try {
    const [root, dmarcTxt, mx, caa, aaaa] = await Promise.all([
      txt(apex),
      txt(`_dmarc.${apex}`),
      resolveMx(apex).catch(() => []),
      resolveCaa(apex).catch(() => []),
      resolve6(host).catch(() => []),
    ]);
    return {
      spf: root.some((r) => /v=spf1/i.test(r)),
      dmarc: dmarcTxt.some((r) => /v=DMARC1/i.test(r)),
      mx: mx.length > 0,
      caa: caa.length > 0,
      ipv6: aaaa.length > 0,
    };
  } catch {
    return null;
  }
}

// TLS-certificaat inspecteren (verbinding naar de reeds gevalideerde host:443).
async function tlsAudit(host: string): Promise<{
  issuer: string | null;
  validTo: string | null;
  daysLeft: number | null;
  protocol: string | null;
  valid: boolean;
} | null> {
  if (isIP(host)) return null;
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: Awaited<ReturnType<typeof tlsAudit>>) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {}
      resolve(v);
    };
    const socket = tlsConnect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: 4000,
      },
      () => {
        try {
          const c = socket.getPeerCertificate();
          const proto = socket.getProtocol();
          const validTo = c?.valid_to || null;
          const daysLeft = validTo
            ? Math.round(
                (new Date(validTo).getTime() - Date.now()) / 86_400_000,
              )
            : null;
          const iss = c?.issuer as
            | Record<string, string | string[]>
            | undefined;
          const issRaw = iss?.O || iss?.CN || iss?.OU || null;
          const issuer = Array.isArray(issRaw)
            ? issRaw[0] || null
            : issRaw;
          finish({
            issuer,
            validTo,
            daysLeft,
            protocol: proto,
            valid: socket.authorized,
          });
        } catch {
          finish(null);
        }
      },
    );
    socket.on("error", () => finish(null));
    socket.on("timeout", () => finish(null));
    setTimeout(() => finish(null), 4500);
  });
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
  if (h.includes("et_pb_") || /\/themes\/divi[/-]/.test(h))
    add("Divi", "builder");
  if (h.includes("js_composer") || /\bvc_row\b/.test(h))
    add("WPBakery", "builder");
  if (h.includes("fl-builder")) add("Beaver Builder", "builder");
  if (h.includes("brizy-")) add("Brizy", "builder");
  if (h.includes("oxygen-builder")) add("Oxygen Builder", "builder");

  // ---- E-commerce ----
  if (h.includes("woocommerce") || h.includes("/wc-ajax/"))
    add("WooCommerce", "ecommerce");
  if (
    /\bmagento\b/.test(h) ||
    h.includes("mage-cache") ||
    h.includes("/static/frontend/")
  )
    add("Magento", "ecommerce");
  if (h.includes("webshopapp.com") || h.includes("seoshop"))
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
  if (/bootstrap(\.min)?\.(css|js)|bootstrapcdn/.test(h)) {
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
  return runScan(String(formData.get("url") ?? "").trim());
}

export async function runScan(rawInput: string): Promise<ScanResult> {
  const raw = rawInput.trim();
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
    // Render-blokkerende externe scripts: <script src> zonder async/defer/
    // module. Inline scripts (incl. streaming-frameworks zoals Next RSC) en
    // JSON-LD blokkeren het renderen niet en tellen dus niet mee — dit meet
    // wat de check bedoelt: plugin-/script-stapeling die de pagina ophoudt.
    const blockingScripts = (html.match(/<script\b[^>]*>/gi) || []).filter(
      (t) =>
        /\bsrc\s*=/i.test(t) &&
        !/\b(?:async|defer)\b/i.test(t) &&
        !/type\s*=\s*["'](?:module|application\/ld\+json)["']/i.test(t),
    ).length;
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
      isHttps &&
      (/<(?:script|img|iframe)[^>]+src=["']http:\/\//i.test(html) ||
        /<link[^>]+rel=["'](?:stylesheet|preload|preconnect)["'][^>]+href=["']http:\/\//i.test(
          html,
        ) ||
        /<link[^>]+href=["']http:\/\/[^"']+["'][^>]+rel=["'](?:stylesheet|preload)["']/i.test(
          html,
        ));

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

    // ---- Diepere HTML-kwaliteit ----
    const headSection = html.split(/<\/head>/i)[0] || html;
    const renderBlockingCss = (
      headSection.match(/<link[^>]+rel=["']stylesheet["']/gi) || []
    ).filter((l) => !/\bmedia=["']print["']/i.test(l)).length;
    const headingSeq = (html.match(/<h([1-6])[\s>]/gi) || []).map((m) =>
      parseInt(m.replace(/\D/g, ""), 10),
    );
    let headingSkip = false;
    for (let i = 1; i < headingSeq.length; i++) {
      if (headingSeq[i] - headingSeq[i - 1] > 1) {
        headingSkip = true;
        break;
      }
    }
    const deprecatedHtml =
      /<(?:center|font|marquee|blink|big|strike|tt)[\s>]/i.test(html) ||
      /\bbgcolor=|\balign=["'](?:left|right|center)["'][^>]*>\s*<t[dr]/i.test(
        html,
      );
    const inlineHandlers = (
      html.match(/\son(?:click|load|error|mouseover|submit)\s*=/gi) || []
    ).length;
    const imgTagsAll = imgTags;
    const responsiveImg =
      /<picture[\s>]/i.test(html) || /<img[^>]+srcset=/i.test(html);
    const lazyImg = imgCount
      ? (html.match(/<img[^>]+loading=["']lazy["']/gi) || []).length /
        imgCount
      : 1;
    const consentBanner =
      /cookiebot|onetrust|cookieyes|complianz|cookie-?consent|axeptio|tarteaucitron|usercentrics|borlabs|iubenda|didomi/i.test(
        html,
      );
    const years = (html.match(/(?:©|&copy;|copyright)[^0-9]{0,16}(20[0-9]{2})/gi) || [])
      .map((s) => parseInt(s.match(/20[0-9]{2}/)?.[0] || "0", 10))
      .filter((y) => y > 2000 && y <= new Date().getFullYear() + 1);
    const copyrightYear = years.length ? Math.max(...years) : 0;
    const nowYear = new Date().getFullYear();
    const staleCopyright = copyrightYear > 0 && copyrightYear < nowYear - 1;
    const textOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = textOnly ? textOnly.split(" ").length : 0;
    const anchors = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
    const emptyLinks = anchors.filter((a) => {
      const inner = a
        .replace(/<a\b[^>]*>/i, "")
        .replace(/<\/a>/i, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      const hasAria = /aria-label=|title=/i.test(a.match(/<a\b[^>]*>/i)?.[0] || "");
      const hasImgAlt = /<img[^>]+alt=["'][^"']+["']/i.test(a);
      return !inner && !hasAria && !hasImgAlt;
    }).length;
    const docCache = [
      head.get("cache-control"),
      head.get("etag"),
      head.get("last-modified"),
      head.get("expires"),
    ]
      .filter(Boolean)
      .join(" | ");

    // ---- Same-origin probes (SSRF-veilig, parallel) ----
    const origin = (() => {
      try {
        return new URL(res.url).origin;
      } catch {
        return url.origin;
      }
    })();
    const httpOrigin = `http://${(() => {
      try {
        return new URL(origin).hostname;
      } catch {
        return url.hostname;
      }
    })()}`;
    const probePath = `/studio-vm-check-${Date.now().toString(36)}`;
    const [robotsP, securityP, notfoundP, httpP] = await Promise.all([
      probe(origin, "/robots.txt"),
      probe(origin, "/.well-known/security.txt"),
      probe(origin, probePath),
      isHttps ? probe(httpOrigin, "/", true) : Promise.resolve(null),
    ]);
    const robotsTxt = !!(
      robotsP &&
      robotsP.status === 200 &&
      !/^\s*<(?:!doctype|html)/i.test(robotsP.text)
    );
    const robotsBlocksAll =
      robotsTxt && /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*(?:\n|$)/i.test(robotsP!.text);
    const sitemapRef = robotsTxt
      ? robotsP!.text.match(/sitemap:\s*(\S+)/i)?.[1]
      : undefined;
    const sitemapP = await probe(origin, sitemapRef || "/sitemap.xml");
    const sitemapXml = !!(
      sitemapP &&
      sitemapP.status === 200 &&
      /<(?:urlset|sitemapindex)/i.test(sitemapP.text)
    );
    const sitemapUrls = sitemapXml
      ? (sitemapP!.text.match(/<loc>/gi) || []).length
      : 0;
    const securityTxt = !!(
      securityP &&
      securityP.status === 200 &&
      /contact:/i.test(securityP.text)
    );
    const soft404 = !!(notfoundP && notfoundP.status === 200);
    const httpsRedirect = !isHttps
      ? false
      : !httpP
        ? null
        : [301, 302, 307, 308].includes(httpP.status) &&
          /^https:/i.test(httpP.location || "");

    // ---- Interne links + DNS/mail + TLS-certificaat (parallel) ----
    const finalHostName = (() => {
      try {
        return new URL(origin).hostname;
      } catch {
        return url.hostname;
      }
    })();
    const baseDom = finalHostName.replace(/^www\./, "");
    const rootPath = (() => {
      try {
        return new URL(origin).pathname || "/";
      } catch {
        return "/";
      }
    })();
    const internal = new Set<string>();
    for (const m of html.matchAll(
      /<a\b[^>]+href=["']([^"'#][^"']*)["']/gi,
    )) {
      if (internal.size >= 40) break;
      const hrefRaw = m[1];
      if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(hrefRaw)) continue;
      let abs: URL;
      try {
        abs = new URL(hrefRaw, origin);
      } catch {
        continue;
      }
      if (abs.protocol !== "https:" && abs.protocol !== "http:") continue;
      if (abs.hostname.replace(/^www\./, "") !== baseDom) continue;
      abs.hash = "";
      if (abs.pathname === rootPath || abs.pathname === "/") continue;
      internal.add(abs.toString());
    }
    const internalList = [...internal];
    const linkSample = internalList.slice(0, 16);
    const pageSample = internalList.slice(0, 10);

    const [dns, tls, linkRes, pageRes] = await Promise.all([
      dnsAudit(finalHostName),
      isHttps ? tlsAudit(finalHostName) : Promise.resolve(null),
      Promise.all(linkSample.map((u) => probe(u, ""))),
      Promise.all(pageSample.map((u) => probe(u, ""))),
    ]);
    const brokenLinks: string[] = [];
    linkSample.forEach((u, i) => {
      const p = linkRes[i];
      if (p && p.status >= 400) {
        try {
          brokenLinks.push(`${p.status} · ${new URL(u).pathname}`);
        } catch {
          brokenLinks.push(`${p.status} · ${u}`);
        }
      }
    });
    let subpageIssues = 0;
    for (const p of pageRes) {
      if (!p || p.status >= 400) continue;
      const hasT = /<title[^>]*>[^<]*\S[^<]*<\/title>/i.test(p.text);
      const hasH = /<h1[\s>]/i.test(p.text);
      if (!hasT || !hasH) subpageIssues++;
    }
    const crawledPages = pageSample.length;

    const cwvScore =
      (responseMs > 1500 ? 2 : responseMs > 800 ? 1 : 0) +
      (htmlKb > 400 ? 2 : htmlKb > 150 ? 1 : 0) +
      (renderBlockingCss > 4 ? 2 : renderBlockingCss > 2 ? 1 : 0) +
      (blockingScripts > 10 ? 2 : blockingScripts > 4 ? 1 : 0) +
      (imgCount > 0 && !responsiveImg ? 1 : 0) +
      (imgCount > 3 && lazyImg < 0.3 ? 1 : 0);
    const cwvRisk: "low" | "medium" | "high" =
      cwvScore >= 6 ? "high" : cwvScore >= 3 ? "medium" : "low";

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

    // ---- Extra (diepere) HTML-signalen — geen extra requests ----
    const hasLandmarks =
      /<(?:main|header|footer|nav)[\s>]/i.test(html) ||
      /\brole=["'](?:main|banner|navigation|contentinfo)["']/i.test(html);
    const imgWithDims = imgTags.filter(
      (t) => /\bwidth\s*=/.test(t) && /\bheight\s*=/.test(t),
    ).length;
    const imgDimRatio = imgCount ? imgWithDims / imgCount : 1;
    const viewportTag =
      html.match(
        /<meta\s+name=["']viewport["'][^>]*content=["']([^"']*)["']/i,
      )?.[1] || "";
    const zoomBlocked =
      /user-scalable\s*=\s*no/i.test(viewportTag) ||
      /maximum-scale\s*=\s*1(?:\.0)?\b/i.test(viewportTag);
    const httpLinks =
      isHttps &&
      new RegExp(
        `<a\\b[^>]+href=["']http://(?!${url.hostname.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )})`,
        "i",
      ).test(html);
    const hasPreconnect =
      /<link[^>]+rel=["'](?:preconnect|dns-prefetch)["']/i.test(html);
    const hasCharset = /<meta[^>]+charset/i.test(html);
    const skipNav =
      /href=["']#(?:main|content|inhoud)["']|class=["'][^"']*skip-link/i.test(
        html,
      ) || /<a[^>]+class=["'][^"']*(?:visually-hidden|sr-only)/i.test(html);

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
        blockingScripts < 4
          ? "good"
          : blockingScripts < 10
            ? "warning"
            : "critical",
        `${blockingScripts}`,
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
      F("deprecatedHtml", "platform", deprecatedHtml ? "warning" : "good"),
      F(
        "staleCopyright",
        "platform",
        staleCopyright ? "warning" : copyrightYear ? "good" : "info",
        copyrightYear ? `© ${copyrightYear}` : undefined,
      ),
      // Config / crawlbaarheid
      F(
        "httpsRedirect",
        "security",
        httpsRedirect === null
          ? "info"
          : httpsRedirect
            ? "good"
            : isHttps
              ? "warning"
              : "critical",
      ),
      F(
        "securityTxt",
        "security",
        securityTxt ? "good" : "info",
      ),
      F(
        "inlineHandlers",
        "security",
        inlineHandlers === 0
          ? "good"
          : inlineHandlers < 5
            ? "warning"
            : "critical",
        inlineHandlers ? `${inlineHandlers}` : undefined,
      ),
      F(
        "consentBanner",
        "security",
        consentBanner ? "good" : "warning",
      ),
      F(
        "robotsTxt",
        "seo",
        !robotsTxt ? "warning" : robotsBlocksAll ? "critical" : "good",
      ),
      F(
        "sitemapXml",
        "seo",
        sitemapXml ? "good" : "warning",
        sitemapXml ? `${sitemapUrls} URL's` : undefined,
      ),
      F("soft404", "seo", soft404 ? "warning" : "good"),
      F("headingOrder", "seo", headingSkip ? "warning" : "good"),
      F(
        "thinContent",
        "seo",
        wordCount === 0
          ? "info"
          : wordCount < 250
            ? "warning"
            : "good",
        wordCount ? `${wordCount}` : undefined,
      ),
      F(
        "cacheHeaders",
        "speed",
        docCache ? "good" : "warning",
      ),
      F(
        "renderBlockingCss",
        "speed",
        renderBlockingCss <= 2
          ? "good"
          : renderBlockingCss <= 4
            ? "warning"
            : "critical",
        `${renderBlockingCss}`,
      ),
      F(
        "responsiveImg",
        "speed",
        imgCount === 0 ? "info" : responsiveImg ? "good" : "warning",
      ),
      F(
        "lazyImg",
        "speed",
        imgCount <= 3 ? "info" : lazyImg >= 0.5 ? "good" : "warning",
      ),
      F(
        "linkText",
        "mobile",
        emptyLinks === 0
          ? "good"
          : emptyLinks < 4
            ? "warning"
            : "critical",
        emptyLinks ? `${emptyLinks}` : undefined,
      ),
      // DNS / mail
      F("spf", "security", !dns ? "info" : dns.spf ? "good" : "warning"),
      F("dmarc", "security", !dns ? "info" : dns.dmarc ? "good" : "warning"),
      F("caaRecord", "security", !dns ? "info" : dns.caa ? "good" : "info"),
      F("mxRecord", "platform", !dns ? "info" : dns.mx ? "good" : "info"),
      F("ipv6", "platform", !dns ? "info" : dns.ipv6 ? "good" : "info"),
      // TLS
      F(
        "tlsExpiry",
        "security",
        !tls || tls.daysLeft === null
          ? "info"
          : tls.daysLeft < 0
            ? "critical"
            : tls.daysLeft < 21
              ? "warning"
              : "good",
        tls && tls.daysLeft !== null ? `${tls.daysLeft} d` : undefined,
      ),
      F(
        "tlsProtocol",
        "security",
        !tls || !tls.protocol
          ? "info"
          : /TLSv1\.[23]/.test(tls.protocol)
            ? "good"
            : "warning",
        tls?.protocol || undefined,
      ),
      // Crawl
      F(
        "brokenLinks",
        "seo",
        linkSample.length === 0
          ? "info"
          : brokenLinks.length === 0
            ? "good"
            : "critical",
        brokenLinks.length
          ? `${brokenLinks.length}/${linkSample.length}`
          : undefined,
      ),
      F(
        "crossPage",
        "seo",
        crawledPages === 0
          ? "info"
          : subpageIssues === 0
            ? "good"
            : "warning",
        subpageIssues ? `${subpageIssues}/${crawledPages}` : undefined,
      ),
      // ---- Diepere checks ----
      F("ariaLandmarks", "mobile", hasLandmarks ? "good" : "warning"),
      F(
        "imgDims",
        "speed",
        imgCount === 0
          ? "info"
          : imgDimRatio >= 0.8
            ? "good"
            : imgDimRatio >= 0.4
              ? "warning"
              : "critical",
        imgCount ? `${imgWithDims}/${imgCount}` : undefined,
      ),
      F("zoomBlocked", "mobile", zoomBlocked ? "warning" : "good"),
      F("httpLinks", "security", httpLinks ? "warning" : "good"),
      F(
        "preconnect",
        "speed",
        extDomains >= 4 ? (hasPreconnect ? "good" : "warning") : "info",
      ),
      F("metaCharset", "seo", hasCharset ? "good" : "warning"),
      F("skipNav", "mobile", skipNav ? "good" : "info"),
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

    const hl = html.toLowerCase();
    const techTypes = new Set(det.technologies.map((x) => x.type));
    const inventory = {
      pages:
        sitemapUrls > 0
          ? sitemapUrls
          : internalList.length
            ? internalList.length + 1
            : null,
      shop:
        techTypes.has("ecommerce") ||
        /woocommerce|add-to-cart|cdn\.shopify|snipcart|winkelmand|panier|warenkorb/.test(
          hl,
        ),
      multilingual:
        /wpml|polylang|sitepress/.test(hl) ||
        (html.match(/hreflang=/gi) || []).length >= 2,
      forms:
        /contact-form-7|wpcf7|wpforms|gravityforms|ninja-forms|formidable/.test(
          hl,
        ) || /<form[\s>][\s\S]{0,800}?<(?:input|textarea)/i.test(html),
      booking:
        /bookly|ameliabooking|simply-schedule|calendly\.com|reserveer online|afspraak online|rendez-vous en ligne|book (?:a |an )?(?:table|appointment|room)/.test(
          hl,
        ),
      blog:
        stack === "WordPress" ||
        /<article[\s>]/i.test(html) ||
        /\/blog\b|\/category\/|\/nieuws\b|\/actualit|wp-json\/wp\/v2\/posts/.test(
          hl,
        ),
      members:
        /memberpress|restrict-content|wishlist-member|woocommerce-memberships|learndash|tutor-lms|s2member/.test(
          hl,
        ),
      mediaHeavy:
        imgCount >= 30 ||
        det.technologies.some((x) =>
          ["Swiper", "Slick Carousel", "Owl Carousel", "Lottie"].includes(
            x.name,
          ),
        ),
      pageBuilder: techTypes.has("builder"),
    };

    const flags = {
      diyPlatform,
      outdated: det.hasOutdatedLib || det.pluginCount >= 15,
      insecure: !isHttps || !!mixedContent || (!hsts && !csp),
      slow,
      bloated:
        blockingScripts >= 12 || htmlKb >= 400 || det.pluginCount >= 15,
      modern:
        ["Next.js", "Nuxt", "Astro", "SvelteKit", "Gatsby"].includes(stack) &&
        score >= 75,
      abandoned:
        staleCopyright && (det.hasOutdatedLib || heavyCms || score < 55),
      gdprRisk: !consentBanner && (extDomains >= 4 || det.pluginCount > 0),
      mailSpoofable: !!dns && !dns.spf && !dns.dmarc,
      certExpiring:
        !!tls && tls.daysLeft !== null && tls.daysLeft < 21,
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
      cwvRisk,
      tls,
      dns,
      crawledPages,
      brokenLinks: brokenLinks.slice(0, 5),
      inventory,
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
