import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Privacy-light bezoekers-tracker — accepteert anonieme page-view-pings van
// een client-component (PageViewTracker). Geen cookies, geen IP-opslag —
// alleen een dagelijks-geroteerde sha256-hash van ip+ua zodat we per dag
// 'unieke bezoekers' kunnen tellen zonder iemand te kunnen identificeren.
export async function POST(req: NextRequest) {
  if (!adminConfigured) return NextResponse.json({ ok: true });

  try {
    const body = (await req.json().catch(() => null)) as
      | {
          path?: string;
          locale?: string;
          referrer?: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
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
      .update(`${ip}|${ua}|${day}|svm-pv-2026`)
      .digest("hex")
      .slice(0, 16);

    // UTM-velden — lichte sanitatie
    const cleanUtm = (v: unknown) => {
      if (!v) return null;
      const s = String(v).slice(0, 80).replace(/[^a-zA-Z0-9_\-\.]/g, "");
      return s || null;
    };

    await getSupabaseAdmin().from("page_views").insert({
      path,
      locale,
      referrer,
      visitor_hash: visitorHash,
      ua_family: uaFamily,
      country,
      utm_source: cleanUtm(body.utm_source),
      utm_medium: cleanUtm(body.utm_medium),
      utm_campaign: cleanUtm(body.utm_campaign),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Tracker mag NOOIT user-flow breken — altijd ok terug
    return NextResponse.json({ ok: true });
  }
}
