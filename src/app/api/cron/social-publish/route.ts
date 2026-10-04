// Publisher: elk half uur (vercel.json, 5 en 35 na het uur).
//
// Zet goedgekeurde social-berichten waarvan het tijdstip voorbij is op alle
// verbonden kanalen (via Buffer), bevestigt eerder verzonden berichten,
// bevriest de beelden van wat de komende 26 uur uitgaat en kijkt één keer per
// week de API-sleutel en de verbindingen na. Mislukt er iets, dan gaat er
// hoogstens één (lichte) mail per dag naar de eigen inbox.
//
// Alles staat uit zolang BUFFER_API_KEY ontbreekt of migratie 0050 niet
// gedraaid is: dan antwoordt deze route met { actief: false, reden } en
// schrijft ze niets. Zie lib/social/publish.ts voor de werking.
//
// Manueel: GET met Bearer CRON_SECRET, of POST met de admin-cookie.
// ?droog=1 toont enkel wat er zou gebeuren (niets naar Buffer, niets
// geschreven).

import { NextResponse, type NextRequest } from "next/server";
import { cronSecret, monitorConfigured } from "@/lib/supabase/config";
import { voerPublisherUit } from "@/lib/social/publish";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
// Beelden bevriezen kan per bericht enkele seconden per formaat duren.
export const maxDuration = 300;

async function eigenInbox(): Promise<string> {
  try {
    const s = await getCompanySettings();
    return s.email || "info@studio-vm.be";
  } catch {
    return "info@studio-vm.be";
  }
}

async function voerUit(req: NextRequest) {
  const droog = req.nextUrl.searchParams.get("droog") === "1";
  try {
    const verslag = await voerPublisherUit({
      droog,
      mail: async (m) => sendMail(await eigenInbox(), m).catch(() => false),
    });
    return NextResponse.json(verslag);
  } catch (e) {
    console.error("[social-publish] run mislukt:", e);
    return NextResponse.json({ actief: false, fout: "Onverwachte fout in de publisher" }, { status: 500 });
  }
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
