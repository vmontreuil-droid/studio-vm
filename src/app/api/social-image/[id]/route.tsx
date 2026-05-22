// Dynamic brand-card-generator voor de AI Content Engine.
//
// URL: /api/social-image/{post_id} → 1200×630 PNG.
//
// Twee layouts afhankelijk van post-type:
//   1. SCREENSHOT-layout (showcase/case posts) — 2-koloms: tekst links,
//      live-screenshot van de portfolio-site rechts in een browser-mockup.
//      Detectie via "site:domain.be" in notes-veld.
//   2. QUOTE-layout (tips, positionering, persoonlijk) — gradient + grote
//      hero-quote + echte studio-vm logo.
//
// Geen authentication — image-routes worden door e-mailclients (Gmail,
// Outlook) zonder cookies opgehaald. Inhoud is sowieso marketing.

import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Logo wordt INLINE gerenderd als JSX (vm wit + . in amber #f59e0b), niet
// via SVG-data-URL omdat Satori daar wisselvallig mee omspringt. Brand-
// kleur (#f59e0b = amber-500) komt uit public/studio-vm-logo-white.svg.

// Screenshot via WordPress mShots — gratis, geen API-key. Werkt voor élke
// publieke URL. Cache ~1u op hun kant; we vragen 1200×900 voor scherpte.
function mShotsUrl(domain: string): string {
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const full = `https://${clean}`;
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(full)}?w=1200&h=900`;
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let hero = "Studio-vm — websites voor KMO's in Vlaanderen";
  let platform = "algemeen";
  let category = "story";
  let featuredSite: string | null = null;

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
      }
    } catch {
      // stil
    }
  }

  const theme = THEMES[platform] ?? THEMES.algemeen!;
  const useScreenshot = !!featuredSite;

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
              {/* Screenshot */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mShotsUrl(featuredSite!)}
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
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              fontFamily: "system-ui, -apple-system, sans-serif",
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
              websites voor KMO's in Vlaanderen
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Korte cache + must-revalidate zodat een design-fix snel zichtbaar
        // wordt. Edge cachet 60s, browser revalidates.
        "cache-control":
          "public, max-age=60, s-maxage=300, must-revalidate",
      },
    },
  );
}
