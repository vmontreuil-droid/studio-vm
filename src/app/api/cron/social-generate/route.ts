// AI Content Engine — cron entry.
// Wordt dagelijks om 07u door Vercel-cron aangeroepen.
//
// Genereert 3 social-posts (FB + LinkedIn) rond 3D-modellen voor
// machinesturing, zet ze in social_posts met status='klaar' (drafts — er
// wordt niets automatisch gepost) en stuurt Vincent een digest-mail.
//
// Manual trigger: GET met Bearer-CRON_SECRET → returnt JSON.

import { NextResponse, type NextRequest } from "next/server";
import { cronSecret, monitorConfigured } from "@/lib/supabase/config";
import { generateDailyPosts } from "@/lib/admin/social-generator";
import { buildSocialDigestMail } from "@/lib/admin/social-mail";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function ownerInbox(): Promise<string> {
  try {
    const s = await getCompanySettings();
    return s.email || "vmontreuil@outlook.be";
  } catch {
    return "vmontreuil@outlook.be";
  }
}

export async function GET(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Stop op zaterdag/zondag — geen weekend-posts (anders is generator-output
  // anders dan wanneer Vincent ze handmatig zou plaatsen).
  const jsDay = new Date().getDay();
  if (jsDay === 0 || jsDay === 6) {
    return NextResponse.json({ ok: true, skipped: "weekend" });
  }

  const result = await generateDailyPosts({ count: 3 });

  if (result.generated > 0) {
    const to = await ownerInbox();
    const mail = buildSocialDigestMail(result.posts);
    await sendMail(to, mail).catch(() => false);
  }

  return NextResponse.json({
    ok: true,
    generated: result.generated,
    aiMode: !!process.env.ANTHROPIC_API_KEY,
    skipped: result.skipped,
    titles: result.posts.map((p) => p.title),
  });
}

// POST = handmatige trigger (admin-cookie of Bearer-CRON_SECRET). De
// "Genereer nu"-knop in /admin/social gebruikt de server-action
// generateNow; deze POST bestaat voor scripts.
export async function POST(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  const viaCron =
    !!cronSecret &&
    req.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!viaCron && !(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await generateDailyPosts({ count: 3 });

  if (result.generated > 0) {
    const to = await ownerInbox();
    const mail = buildSocialDigestMail(result.posts);
    await sendMail(to, mail).catch(() => false);
  }

  return NextResponse.json({
    ok: true,
    generated: result.generated,
    aiMode: !!process.env.ANTHROPIC_API_KEY,
    titles: result.posts.map((p) => p.title),
  });
}
