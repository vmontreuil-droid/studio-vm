// Dynamic brand-card-generator voor de AI Content Engine.
//
// URL: /api/social-image/{post_id} → 1200×630 PNG met:
//   - Gradient achtergrond (studio-vm blauw → paars)
//   - Highlight-quote uit de post-tekst (title of eerste zin)
//   - "vm." wordmark + URL onderaan
//   - Platform-badge bovenaan ("studio-vm · FACEBOOK")
//
// Geen authentication — image-routes worden door e-mailclients (Gmail,
// Outlook) zonder cookies opgehaald. Inhoud is sowieso marketing.

import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================================
// Hero-tekst-extractie: kies een korte impactvolle zin uit titel/body
// ============================================================================
function extractHero(post: { title: string; body: string | null }): string {
  // Verwijder interne titel-prefix zoals "FB persoonlijk — ..." of "LinkedIn — ..."
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

  // Bij voorkeur een zin die een cijfer of "%" bevat — meer punch
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
// Route
// ============================================================================
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Fallback hero als post niet bestaat (404 ipv exception → mooie blanco card)
  let hero = "Studio-vm — websites voor KMO's in Vlaanderen";
  let platform = "algemeen";
  let category = "story";

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
        // Subcategorie uit notes-veld (template:fb-tip-pagespeed → tip)
        const tmpl = post.notes?.match(/template:([\w-]+)/)?.[1] ?? "";
        if (tmpl.includes("tip")) category = "tip";
        else if (tmpl.includes("case")) category = "case";
        else if (tmpl.includes("showcase")) category = "showcase";
        else if (tmpl.includes("question")) category = "question";
      }
    } catch {
      // stil — fallback hero wordt gebruikt
    }
  }

  const theme = THEMES[platform] ?? THEMES.algemeen!;

  // Dynamische font-size — kortere quotes mogen groter
  const fontSize =
    hero.length < 40 ? 78 : hero.length < 70 ? 64 : hero.length < 100 ? 54 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: theme.gradient,
          padding: "70px 80px",
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decoratieve glow-blob rechtsonder */}
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

        {/* Decoratieve grid-stippen linksboven */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            width: 200,
            height: 100,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            display: "flex",
          }}
        />

        {/* TOP — platform + categorie-badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              background: theme.badgeBg,
              borderRadius: 9999,
              fontSize: 18,
              letterSpacing: 4,
              fontWeight: 600,
              border: `1px solid ${theme.accent}60`,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: theme.accent,
                display: "flex",
              }}
            />
            studio-vm · {theme.badge}
          </div>
          {category && category !== "story" && (
            <div
              style={{
                display: "flex",
                padding: "8px 14px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 9999,
                fontSize: 16,
                letterSpacing: 3,
                opacity: 0.8,
              }}
            >
              {category.toUpperCase()}
            </div>
          )}
        </div>

        {/* MIDDLE — hero-quote */}
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

        {/* BOTTOM — vm wordmark + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 110,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 0.9,
            }}
          >
            <span style={{ display: "flex" }}>vm</span>
            <span
              style={{
                display: "flex",
                color: theme.accent,
                fontSize: 90,
              }}
            >
              .
            </span>
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
                fontSize: 22,
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
                fontSize: 16,
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
        "cache-control": "public, max-age=86400, immutable",
      },
    },
  );
}
