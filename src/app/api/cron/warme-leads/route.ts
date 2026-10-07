import { NextResponse, type NextRequest } from "next/server";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { warmeLeadsMail, warmeLeadsSinds } from "@/lib/admin/warme-leads";
import { verstuurMail } from "@/lib/monitor";
import { BEDRIJF } from "@/lib/bedrijf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Elke ochtend: welke aangeschreven bedrijven kwamen het voorbije etmaal
// echt op de site (warme leads, zie lib/admin/warme-leads)? Lijstje met
// telefoon en bekeken pagina's naar Studio VM. Geen leads → geen mail.
export async function GET(req: NextRequest) {
  if (!monitorConfigured || !cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const leads = await warmeLeadsSinds(new Date(Date.now() - 24 * 3_600_000));
  if (!leads.length) return NextResponse.json({ ok: true, leads: 0 });
  const r = await verstuurMail(BEDRIJF.email, warmeLeadsMail(leads));
  return NextResponse.json({ ok: r.ok, leads: leads.length });
}
