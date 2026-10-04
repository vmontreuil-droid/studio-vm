import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { schoneUtm, utmContentOntbreekt } from "@/lib/utm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zout van de dagcode. Uit een geheime omgevingsvariabele, zodat wie de
// broncode en de tabel heeft een dagcode niet kan narekenen uit een
// IP-adres. Zonder variabele de vroegere vaste waarde (zelfde dagcodes als
// voorheen). Wissel het zout niet midden op een dag: dan telt één bezoeker
// die dag dubbel.
const DAGCODE_ZOUT = process.env.PV_HASH_SALT || "svm-pv-2026";

// Wissen na de bewaartermijn gebeurt hier bewust niet (publieke route): zie
// /api/cron/bezoek-opruimen.

// Kolom page_views.utm_content komt met migratie 0050. Tot die gedraaid is,
// faalt een insert met utm_content; dan bewaren we de rij zonder en proberen
// we het pas na KOLOM_HERTEST opnieuw (geen deploy nodig na de migratie).
const KOLOM_HERTEST = 10 * 60_000;
let utmContentOntbreektSinds = 0;

// Privacy-light bezoekers-tracker — accepteert page-view-pings van een
// client-component (PageViewTracker). Geen cookies, geen IP-opslag — alleen
// een dagcode (sha256 van ip+ua+dag+zout, ingekort) zodat we per dag 'unieke
// bezoekers' kunnen tellen. UTM-schema: src/lib/utm.ts.
export async function POST(req: NextRequest) {
  if (!adminConfigured) return NextResponse.json({ ok: true });
  // Lokale ontwikkeling niet meetellen: de dev-server schrijft anders in de
  // live statistieken (zelfde database).
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (
    process.env.NODE_ENV !== "production" ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  ) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = (await req.json().catch(() => null)) as
      | {
          path?: string;
          locale?: string;
          referrer?: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
        }
      | null;
    if (!body) return NextResponse.json({ ok: true });

    const path = String(body.path ?? "").slice(0, 500);
    if (!path) return NextResponse.json({ ok: true });

    // Niets uit admin/portail/api meten — alleen publieke site
    if (
      path.startsWith("/admin") ||
      path.startsWith("/api") ||
      path.startsWith("/portail") ||
      path.startsWith("/_next") ||
      path === "/robots.txt" ||
      path === "/sitemap.xml"
    ) {
      return NextResponse.json({ ok: true });
    }

    const locale = String(body.locale ?? "").slice(0, 8) || null;
    const referrer = String(body.referrer ?? "").slice(0, 500) || null;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0";
    const ua = req.headers.get("user-agent") ?? "";
    const country = req.headers.get("x-vercel-ip-country") ?? null;

    // Bots eruit
    const uaLower = ua.toLowerCase();
    const isBot =
      /bot|crawl|spider|preview|fetch|http|monitor|lighthouse|headless|pingdom|uptime|axios|curl|wget/.test(
        uaLower,
      );
    if (isBot) return NextResponse.json({ ok: true });

    const uaFamily = /mobile|android|iphone|ipad/i.test(ua)
      ? "mobile"
      : "desktop";

    const day = new Date().toISOString().slice(0, 10);
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${day}|${DAGCODE_ZOUT}`)
      .digest("hex")
      .slice(0, 16);

    const db = getSupabaseAdmin();
    const rij = {
      path,
      locale,
      referrer,
      visitor_hash: visitorHash,
      ua_family: uaFamily,
      country,
      utm_source: schoneUtm(body.utm_source),
      utm_medium: schoneUtm(body.utm_medium),
      utm_campaign: schoneUtm(body.utm_campaign),
    };
    // utm_content (bericht-id) enkel meesturen als er een is én de kolom
    // bestaat; anders zou elke ping de ontbrekende kolom raken.
    const utmContent = schoneUtm(body.utm_content, { kleineLetters: false });
    const probeerContent =
      !!utmContent && Date.now() - utmContentOntbreektSinds > KOLOM_HERTEST;

    if (probeerContent) {
      const { error } = await db
        .from("page_views")
        .insert({ ...rij, utm_content: utmContent });
      if (utmContentOntbreekt(error)) {
        utmContentOntbreektSinds = Date.now();
        await db.from("page_views").insert(rij);
      } else if (!error) {
        utmContentOntbreektSinds = 0;
      }
    } else {
      await db.from("page_views").insert(rij);
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Tracker mag NOOIT user-flow breken — altijd ok terug
    return NextResponse.json({ ok: true });
  }
}
