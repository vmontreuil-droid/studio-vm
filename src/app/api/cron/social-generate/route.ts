// Contentmachine: wekelijkse cron.
// Vercel roept dit elke maandag om 06:00 UTC aan (07:00 Belgische wintertijd,
// 08:00 zomertijd). De machine plant de lege plaatsen van deze week
// (di NL-bericht, wo Google, do FR-bericht, vr story of reel) en stuurt een
// weekoverzicht met goedkeurknoppen voor berichten die op een akkoord wachten.
// Er wordt hier niets gepubliceerd; dat doet de publisher op scheduled_for.
//
// Manueel: GET of POST met Bearer CRON_SECRET (POST mag ook met de
// admin-cookie). ?week=2026-W42 plant een andere week, ?voorbeeld=1 toont
// enkel het voorstel zonder iets te schrijven.

import { NextResponse, type NextRequest } from "next/server";
import { cronSecret, monitorConfigured } from "@/lib/supabase/config";
import { parseWeek, planWeek } from "@/lib/admin/social-generator";
import { buildSocialDigestMail } from "@/lib/admin/social-mail";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function ownerInbox(): Promise<string> {
  try {
    const s = await getCompanySettings();
    return s.email || "info@studio-vm.be";
  } catch {
    return "info@studio-vm.be";
  }
}

async function voerUit(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const week = q.get("week");
  const r = await planWeek({ week: week && parseWeek(week) ? week : undefined, dryRun: q.get("voorbeeld") === "1" });

  let gemaild = false;
  if (!r.fout && r.nieuw.length > 0 && q.get("voorbeeld") !== "1") {
    const mail = buildSocialDigestMail({
      week: r.week,
      berichten: r.weekBerichten,
      links: r.links,
      allesAutomatisch: r.allesAutomatisch,
    });
    gemaild = await sendMail(await ownerInbox(), mail).catch(() => false);
  }

  return NextResponse.json({
    ok: !r.fout,
    week: r.week,
    soort: r.type,
    migratie: r.migratie,
    allesAutomatisch: r.allesAutomatisch,
    gepland: r.nieuw.map((p) => ({ id: p.id, wanneer: p.scheduled_for, titel: p.title, status: p.status, kanalen: p.kanalen })),
    overgeslagen: r.overgeslagen,
    gemaild,
    ...(r.fout ? { fout: r.fout } : {}),
  });
}

export async function GET(req: NextRequest) {
  if (!monitorConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return voerUit(req);
}

export async function POST(req: NextRequest) {
  if (!monitorConfigured) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const viaCron = !!cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!viaCron && !(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return voerUit(req);
}
