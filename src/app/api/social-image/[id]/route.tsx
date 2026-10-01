// Dynamic brand-card-generator voor de AI Content Engine.
//
// URL: /api/social-image/{post_id} → 1200×630 PNG.
//
// Twee layouts afhankelijk van post-type:
//   1. SCREENSHOT-layout (showcase/case posts) — 2-koloms: tekst links,
//      live-screenshot van de portfolio-site rechts in een browser-mockup.
//      Detectie via "site:domain.be" in notes-veld.
//      Of een 3D-beeld via "kaart:/3d/….png" in notes (aannemers-posts).
//   2. QUOTE-layout (tips, positionering, persoonlijk) — gradient + grote
//      hero-quote + echte studio-vm logo.
//
// Geen authentication — image-routes worden door e-mailclients (Gmail,
// Outlook) zonder cookies opgehaald. Inhoud is sowieso marketing.

import { ImageResponse } from "next/og";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Logo wordt INLINE gerenderd als JSX (vm wit + . in amber #f59e0b) in
// Montserrat ExtraBold zodat het exact matcht met de site's huisstijl
// (layout.tsx gebruikt Montserrat als --font-geist-sans).
//
// Font wordt gebundeld via @fontsource/montserrat — geen onbetrouwbare
// runtime-CDN-fetch. Wordt 1× geladen en in memory gecached.
let MONTSERRAT_CACHE: ArrayBuffer | null = null;
async function getMontserratExtraBold(): Promise<ArrayBuffer | null> {
  if (MONTSERRAT_CACHE) return MONTSERRAT_CACHE;
  try {
    const p = path.join(
      process.cwd(),
      "node_modules",
      "@fontsource",
      "montserrat",
      "files",
      "montserrat-latin-800-normal.woff",
    );
    const buf = await fs.readFile(p);
    MONTSERRAT_CACHE = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
    return MONTSERRAT_CACHE;
  } catch {
    return null;
  }
}

// Screenshot via lokale files in public/social/portfolio/{slug}.png —
// vooraf gegenereerd via `node scripts/screenshot-portfolio.mjs`. Geeft
// betrouwbare images zonder externe API-afhankelijkheid (mShots geeft 403
// sinds mei 2026). Domain → slug via mapping.
const SCREENSHOT_SLUG: Record<string, string> = {
  "celineinterieur.com": "celineinterieur",
  "montreuil.be": "montreuil",
  "allardphilippe.vercel.app": "allardphilippe",
  "mari-lines.be": "mari-lines",
  "barbotte.vercel.app": "barbotte",
  "cottage-waregem.vercel.app": "cottage-waregem",
  "favesan.be": "favesan",
  "studio-vm.be": "studio-vm",
};

function screenshotPathFor(domain: string): string | null {
  const slug = SCREENSHOT_SLUG[domain];
  return slug ? `/social/portfolio/${slug}.png` : null;
}

// 3D-beelden (aannemers-posts): notes-marker "kaart:/3d/….png|jpg".
// Satori kan geen WebP inlinen, daarom enkel PNG/JPG uit public/3d.
const KAART_CACHE = new Map<string, string>();
async function getKaartDataUrl(rel: string): Promise<string | null> {
  if (!/^\/3d\/[a-z0-9\-/]+\.(png|jpe?g)$/i.test(rel) || rel.includes("..")) return null;
  const cached = KAART_CACHE.get(rel);
  if (cached) return cached;
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "public", ...rel.split("/").filter(Boolean)));
    const mime = /.png$/i.test(rel) ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
    KAART_CACHE.set(rel, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

// Cache screenshots als data-URLs zodat Satori ze betrouwbaar inlinet
const SHOT_CACHE = new Map<string, string>();
async function getScreenshotDataUrl(domain: string): Promise<string | null> {
  const cached = SHOT_CACHE.get(domain);
  if (cached) return cached;
  const slug = SCREENSHOT_SLUG[domain];
  if (!slug) return null;
  try {
    const p = path.join(
      process.cwd(),
      "public",
      "social",
      "portfolio",
      `${slug}.png`,
    );
    const buf = await fs.readFile(p);
    const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    SHOT_CACHE.set(domain, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

// ============================================================================
// Hero-tekst-extractie: korte impactvolle zin uit titel/body
// ============================================================================
function extractHero(post: { title: string; body: string | null }): string {
  const titleClean = post.title
    .replace(/^(FB|LinkedIn|LI|Facebook|Instagram)\s*[-–—]\s*/i, "")
    .replace(/\s*[-–—]\s*(FB|LinkedIn|LI|Facebook|Instagram).*$/i, "")
    .trim();

  if (titleClean.length >= 12 && titleClean.length <= 90) return titleClean;

  const body = post.body ?? "";
  const sentences = body
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 140);

  const punchy = sentences.find((s) => /\d+\s*(s|sec|%|€|×|x)/.test(s));
  if (punchy) return punchy;

  const first = sentences[0] ?? titleClean;
  if (first.length <= 130) return first;
  return first.slice(0, 125) + "…";
}

// ============================================================================
// Platform-thema's
// ============================================================================
type Theme = {
  gradient: string;
  badgeBg: string;
  badge: string;
  accent: string;
};

const THEMES: Record<string, Theme> = {
  facebook: {
    gradient:
      "linear-gradient(135deg, #0f172a 0%, #1e3a8a 35%, #1877F2 85%, #6366f1 100%)",
    badgeBg: "rgba(24, 119, 242, 0.25)",
    badge: "FACEBOOK",
    accent: "#60a5fa",
  },
  linkedin: {
    gradient:
      "linear-gradient(135deg, #0f172a 0%, #075985 40%, #0A66C2 80%, #0ea5e9 100%)",
    badgeBg: "rgba(10, 102, 194, 0.25)",
    badge: "LINKEDIN",
    accent: "#38bdf8",
  },
  instagram: {
    gradient:
      "linear-gradient(135deg, #1e1b4b 0%, #9d174d 50%, #ec4899 100%)",
    badgeBg: "rgba(236, 72, 153, 0.25)",
    badge: "INSTAGRAM",
    accent: "#f472b6",
  },
  x: {
    gradient: "linear-gradient(135deg, #000000 0%, #1f2937 50%, #374151 100%)",
    badgeBg: "rgba(255, 255, 255, 0.1)",
    badge: "X",
    accent: "#a1a1aa",
  },
  algemeen: {
    gradient:
      "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #be185d 100%)",
    badgeBg: "rgba(168, 85, 247, 0.25)",
    badge: "STUDIO-VM",
    accent: "#c084fc",
  },
};

// ============================================================================
// GET — render image
// ============================================================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // ?format=story → vertikaal 1080×1920 voor Facebook/Instagram Stories
  // Of: post heeft 'format:story' marker in notes (auto-detect uit DB hieronder)
  const queryStory = new URL(req.url).searchParams.get("format") === "story";

  let hero = "Studio VM — 3D-modellen voor machinesturing";
  let platform = "algemeen";
  let category = "story";
  let featuredSite: string | null = null;
  let kaartBeeld: string | null = null;
  let postMarkedAsStory = false;

  if (adminConfigured && id) {
    try {
      const { data } = await getSupabaseAdmin()
        .from("social_posts")
        .select("title, body, platform, notes")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const post = data as {
          title: string;
          body: string | null;
          platform: string;
          notes: string | null;
        };
        hero = extractHero(post);
        platform = post.platform ?? "algemeen";
        const tmpl = post.notes?.match(/template:([\w-]+)/)?.[1] ?? "";
        if (tmpl.includes("tip")) category = "tip";
        else if (tmpl.includes("case")) category = "case";
        else if (tmpl.includes("showcase")) category = "showcase";
        else if (tmpl.includes("question")) category = "question";
        else if (tmpl.includes("service")) category = "service";
        else if (tmpl.includes("positie")) category = "positie";

        // Featured-site uit notes — bv. "site:celine-interieur.be"
        const siteMatch = post.notes?.match(/site:([a-z0-9.\-]+)/i)?.[1];
        if (siteMatch) featuredSite = siteMatch;
        // 3D-beeld uit notes — bv. "kaart:/3d/relief-bouwput-licht.png"
        const kaartMatch = post.notes?.match(/kaart:(\/3d\/[a-z0-9\-/]+\.(?:png|jpe?g))/i)?.[1];
        if (kaartMatch) {
          kaartBeeld = kaartMatch;
          featuredSite = "studio-vm.be/realisaties";
        }
        // format:story marker → default story-layout
        if (post.notes?.includes("format:story")) postMarkedAsStory = true;
      }
    } catch {
      // stil
    }
  }

  // Effectief story-modus = query OF post-marker
  const isStory = queryStory || postMarkedAsStory;
  const theme = THEMES[platform] ?? THEMES.algemeen!;
  const useScreenshot = !!featuredSite && !isStory; // stories = tekst-eerst
  const montserratData = await getMontserratExtraBold();
  const screenshotData = kaartBeeld
    ? await getKaartDataUrl(kaartBeeld)
    : featuredSite
      ? await getScreenshotDataUrl(featuredSite)
      : null;
  void screenshotPathFor; // alias-only — niet rechtstreeks gebruikt

  // Story-layout: vertikaal 1080×1920, ander render-pad onderaan
  if (isStory) {
    return renderStoryImage({
      hero,
      platform,
      category,
      theme,
      featuredSite,
      screenshotData,
      montserratData,
    });
  }

  // Schaal hero-tekst op basis van lengte. In screenshot-layout iets kleiner.
  const fontSize = useScreenshot
    ? hero.length < 40
      ? 52
      : hero.length < 70
        ? 44
        : hero.length < 100
          ? 36
          : 30
    : hero.length < 40
      ? 78
      : hero.length < 70
        ? 64
        : hero.length < 100
          ? 54
          : 46;

  // ===================================================================
  // RENDER
  // ===================================================================
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: theme.gradient,
          padding: useScreenshot ? "60px 70px" : "70px 80px",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decoratieve glow */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}40 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Grid-stippen */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 200,
            height: 100,
            opacity: 0.15,
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            display: "flex",
          }}
        />

        {/* TOP — platform-badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: theme.badgeBg,
              borderRadius: 9999,
              fontSize: 16,
              letterSpacing: 3,
              fontWeight: 600,
              border: `1px solid ${theme.accent}60`,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 9999,
                background: theme.accent,
                display: "flex",
              }}
            />
            studio-vm · {theme.badge}
          </div>
          {category !== "story" && (
            <div
              style={{
                display: "flex",
                padding: "8px 14px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 9999,
                fontSize: 14,
                letterSpacing: 3,
                opacity: 0.8,
              }}
            >
              {category.toUpperCase()}
            </div>
          )}
        </div>

        {/* MIDDLE — afhankelijk van layout */}
        {useScreenshot ? (
          // 2-koloms: tekst links, screenshot rechts
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              gap: 40,
              marginTop: 20,
            }}
          >
            {/* Tekst-kolom */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 480,
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize,
                  fontWeight: 700,
                  lineHeight: 1.18,
                  letterSpacing: -1.2,
                }}
              >
                {hero}
              </div>
              {featuredSite && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 18,
                    fontFamily: "ui-monospace, Menlo, monospace",
                    opacity: 0.85,
                    color: theme.accent,
                  }}
                >
                  → {featuredSite}
                </div>
              )}
            </div>

            {/* Screenshot in browser-mockup */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "rgba(0,0,0,0.4)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Browser-titelbalk */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(0,0,0,0.55)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 12,
                    height: 12,
                    borderRadius: 9999,
                    background: "#ef4444",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 12,
                    height: 12,
                    borderRadius: 9999,
                    background: "#f59e0b",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 12,
                    height: 12,
                    borderRadius: 9999,
                    background: "#10b981",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    marginLeft: 14,
                    padding: "4px 14px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: "ui-monospace, Menlo, monospace",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {featuredSite}
                </div>
              </div>
              {/* Screenshot — local file via data-URL voor betrouwbaarheid */}
              {screenshotData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotData}
                  alt={featuredSite!}
                  width={620}
                  height={400}
                  style={{
                    display: "flex",
                    width: "100%",
                    height: 360,
                    objectFit: "cover",
                    objectPosition: "top center",
                  }}
                />
              ) : (
                // Fallback: gradient-placeholder als screenshot-file ontbreekt
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: 360,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "ui-monospace, Menlo, monospace",
                    fontSize: 16,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {featuredSite}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Single-koloms: grote hero-quote
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              fontSize,
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: -1.5,
              paddingRight: 40,
              maxWidth: "92%",
              marginTop: 20,
            }}
          >
            {hero}
          </div>
        )}

        {/* BOTTOM — logo (inline JSX matching SVG exact: vm in wit, . in amber #f59e0b) + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 110,
              fontWeight: 800,
              letterSpacing: -5,
              lineHeight: 1,
              fontFamily: "Montserrat, system-ui, sans-serif",
            }}
          >
            <span style={{ display: "flex", color: "#ffffff" }}>vm</span>
            <span style={{ display: "flex", color: "#f59e0b" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              opacity: 0.7,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                letterSpacing: 4,
                fontFamily: "ui-monospace, Menlo, monospace",
                textTransform: "uppercase",
              }}
            >
              studio-vm.be
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 14,
                opacity: 0.6,
              }}
            >
              3D-modellen voor machinesturing
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: montserratData
        ? [
            {
              name: "Montserrat",
              data: montserratData,
              weight: 800,
              style: "normal",
            },
          ]
        : undefined,
      headers: {
        // Korte cache + must-revalidate zodat een design-fix snel zichtbaar
        // wordt. Edge cachet 60s, browser revalidates.
        "cache-control":
          "public, max-age=60, s-maxage=300, must-revalidate",
      },
    },
  );
}

// =============================================================================
// STORY-LAYOUT — vertikaal 1080×1920 voor FB/IG Stories
// =============================================================================
function renderStoryImage(opts: {
  hero: string;
  platform: string;
  category: string;
  theme: Theme;
  featuredSite: string | null;
  screenshotData: string | null;
  montserratData: ArrayBuffer | null;
}): ImageResponse {
  const { hero, theme, featuredSite, screenshotData, montserratData, category } =
    opts;

  // Stories worden mobiel-vol-scherm bekeken — tekst mag GROOT en kort.
  const fontSize =
    hero.length < 40 ? 110 : hero.length < 70 ? 88 : hero.length < 100 ? 72 : 60;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: theme.gradient,
          padding: "80px 70px",
          color: "white",
          fontFamily: "Montserrat, Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decoratieve glow boven */}
        <div
          style={{
            position: "absolute",
            top: -300,
            left: -200,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}55 0%, transparent 70%)`,
            display: "flex",
          }}
        />
        {/* Decoratieve glow onder */}
        <div
          style={{
            position: "absolute",
            bottom: -300,
            right: -200,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.accent}40 0%, transparent 70%)`,
            display: "flex",
          }}
        />
        {/* Grid-stippen */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 200,
            height: 200,
            opacity: 0.12,
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            display: "flex",
          }}
        />

        {/* TOP — platform-badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 22px",
              background: theme.badgeBg,
              borderRadius: 9999,
              fontSize: 26,
              letterSpacing: 4,
              fontWeight: 600,
              border: `1px solid ${theme.accent}60`,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 9999,
                background: theme.accent,
                display: "flex",
              }}
            />
            studio-vm · STORY
          </div>
        </div>

        {/* MIDDLE — hero quote, gecentreerd */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-start",
            fontSize,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -3,
            marginTop: 50,
          }}
        >
          {hero}
        </div>

        {/* Optionele site-vermelding + screenshot-thumbnail in story */}
        {featuredSite && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              marginBottom: 40,
            }}
          >
            {screenshotData && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 18px",
                    background: "rgba(0,0,0,0.55)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 14,
                      height: 14,
                      borderRadius: 9999,
                      background: "#ef4444",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      width: 14,
                      height: 14,
                      borderRadius: 9999,
                      background: "#f59e0b",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      width: 14,
                      height: 14,
                      borderRadius: 9999,
                      background: "#10b981",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 16,
                      padding: "6px 18px",
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      fontSize: 22,
                      fontFamily: "ui-monospace, Menlo, monospace",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {featuredSite}
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotData}
                  alt={featuredSite}
                  width={940}
                  height={500}
                  style={{
                    display: "flex",
                    width: "100%",
                    height: 500,
                    objectFit: "cover",
                    objectPosition: "top center",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* BOTTOM — vm. + URL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: -6,
              lineHeight: 1,
              fontFamily: "Montserrat, system-ui, sans-serif",
            }}
          >
            <span style={{ display: "flex", color: "#ffffff" }}>vm</span>
            <span style={{ display: "flex", color: "#f59e0b" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 5,
              fontFamily: "ui-monospace, Menlo, monospace",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            studio-vm.be
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              opacity: 0.6,
            }}
          >
            3D-modellen voor machinesturing
          </div>
        </div>

        {/* tone-of-voice marker */}
        {category !== "story" && (
          <div
            style={{
              position: "absolute",
              top: 100,
              right: 70,
              display: "flex",
              padding: "10px 18px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 9999,
              fontSize: 20,
              letterSpacing: 4,
              opacity: 0.75,
            }}
          >
            {category.toUpperCase()}
          </div>
        )}
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: montserratData
        ? [
            {
              name: "Montserrat",
              data: montserratData,
              weight: 800,
              style: "normal",
            },
          ]
        : undefined,
      headers: {
        "cache-control":
          "public, max-age=60, s-maxage=300, must-revalidate",
      },
    },
  );
}
