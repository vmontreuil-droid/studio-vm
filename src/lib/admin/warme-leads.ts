// Warme leads: bedrijven uit de outreach die echt op de site kwamen.
//
// De links in de outreachmail dragen utm_content = variant-taal-code (code =
// begin van scan_token, zie outreach-mail). De bezoekersteller herkent zo'n
// bezoek en zet opened_at, zoals de Resend-webhook dat bij een klik doet —
// maar zonder de klikken van mailscanners: die husselen de UTM-waarden (de
// teller gooit ze weg) of klikken binnen enkele minuten na verzending.
// Elke ochtend gaat er een lijstje naar Studio VM (cron warme-leads).

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { LEAD_CODE_LENGTE } from "@/lib/admin/outreach-mail";
import { portalEmailHtml, siteLink } from "@/lib/email";

/** Scanners klikken meteen na aflevering; een mens zelden binnen 2 minuten. */
const SCANNER_VENSTER_MS = 2 * 60_000;

const CODE = new RegExp(`^(?:first|followup)-[a-z]{2}-([A-Za-z0-9_-]{${LEAD_CODE_LENGTE}})$`);

export function leadCodeUit(utmContent: string | null | undefined): string | null {
  return utmContent?.match(CODE)?.[1] ?? null;
}

/** Bezoek met een leadcode: eerste keer → opened_at + status geopend. */
export async function markeerLeadBezoek(code: string, nu = new Date()): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("prospect_outreach")
    .select("land, prospect_id, mail_sent_at, followup_sent_at, opened_at, status")
    .like("scan_token", `${code}%`)
    .limit(2);
  const rijen = (data as { land: string; prospect_id: string; mail_sent_at: string | null; followup_sent_at: string | null; opened_at: string | null; status: string }[] | null) ?? [];
  if (rijen.length !== 1) return false;
  const r = rijen[0]!;
  if (r.opened_at || !["verzonden", "opgevolgd"].includes(r.status)) return false;
  const laatsteMail = Math.max(Date.parse(r.mail_sent_at ?? "") || 0, Date.parse(r.followup_sent_at ?? "") || 0);
  if (laatsteMail && nu.getTime() - laatsteMail < SCANNER_VENSTER_MS) return false;
  const iso = nu.toISOString();
  const { error } = await db
    .from("prospect_outreach")
    .update({ opened_at: iso, status: "geopend", updated_at: iso })
    .eq("land", r.land)
    .eq("prospect_id", r.prospect_id)
    .is("opened_at", null);
  return !error;
}

export type WarmeLead = {
  land: string;
  naam: string;
  plaats: string | null;
  telefoon: string | null;
  website: string | null;
  mailAan: string | null;
  geopend: string;
  doelgroep: string | null;
  paginas: string[];
};

/** Leads die sinds `sinds` voor het eerst op de site kwamen, met wat ze bekeken. */
export async function warmeLeadsSinds(sinds: Date): Promise<WarmeLead[]> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("prospect_outreach")
    .select("land, prospect_id, website, mail_to, opened_at, scan_token, scan_grade")
    .gte("opened_at", sinds.toISOString())
    .order("opened_at", { ascending: true })
    .limit(200);
  const rijen = (data as { land: Land; prospect_id: string; website: string | null; mail_to: string | null; opened_at: string; scan_token: string | null; scan_grade: string | null }[] | null) ?? [];
  const uit: WarmeLead[] = [];
  for (const r of rijen) {
    const src = sourceFromLand(r.land);
    const { data: b } = await db.from(src.table).select("name, city, postcode, phone, website").eq(src.idCol, r.prospect_id).maybeSingle();
    const bedrijf = (b as { name: string | null; city: string | null; postcode: string | null; phone: string | null; website: string | null } | null) ?? null;

    // Wat ze bekeken: de landingspagina (met code) en alles van dezelfde dagcode die dag.
    const paginas: string[] = [];
    const code = r.scan_token?.slice(0, LEAD_CODE_LENGTE);
    if (code) {
      const { data: land } = await db
        .from("page_views")
        .select("visitor_hash, created_at")
        .like("utm_content", `%-${code}`)
        .gte("created_at", sinds.toISOString())
        .limit(20);
      const hashes = [...new Set(((land as { visitor_hash: string }[] | null) ?? []).map((x) => x.visitor_hash))];
      if (hashes.length) {
        const { data: pv } = await db
          .from("page_views")
          .select("path")
          .in("visitor_hash", hashes)
          .gte("created_at", sinds.toISOString())
          .order("created_at", { ascending: true })
          .limit(50);
        for (const p of (pv as { path: string }[] | null) ?? []) if (!paginas.includes(p.path)) paginas.push(p.path);
      }
    }
    uit.push({
      land: r.land,
      naam: bedrijf?.name ?? r.prospect_id,
      plaats: [bedrijf?.postcode, bedrijf?.city].filter(Boolean).join(" ") || null,
      telefoon: bedrijf?.phone ?? null,
      website: bedrijf?.website ?? r.website,
      mailAan: r.mail_to,
      geopend: r.opened_at,
      doelgroep: r.scan_grade,
      paginas,
    });
  }
  return uit;
}

// ─── Ochtendmail ─────────────────────────────────────────────────────

const LAND: Record<string, string> = { be: "België", fr: "Frankrijk", uk: "Verenigd Koninkrijk", nl: "Nederland", de: "Duitsland" };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function leadHtml(l: WarmeLead): string {
  const regel = (s: string) => `<div style="margin-top:4px;font-size:14px;line-height:1.5;color:#44403c">${s}</div>`;
  const site = l.website ? l.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const tel = l.telefoon?.trim() || null;
  return `<div style="border:1px solid #e7e5e4;border-radius:12px;padding:14px 16px;margin:0 0 10px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="font-size:16px;font-weight:700;color:#1c1917">${esc(l.naam)}</div>
${regel(esc([LAND[l.land] ?? l.land.toUpperCase(), l.plaats].filter(Boolean).join(" · ")))}
${tel ? regel(`Tel. <a href="tel:${esc(tel.replace(/[^\d+]/g, ""))}" style="color:#e08214;text-decoration:none">${esc(tel)}</a>`) : ""}
${site ? regel(`<a href="${esc(l.website!)}" style="color:#e08214;text-decoration:none">${esc(site)}</a>`) : ""}
${l.mailAan ? regel(`Gemaild aan ${esc(l.mailAan)}`) : ""}
${l.paginas.length ? regel(`Bekeek: ${l.paginas.map((p) => esc(p)).join(", ")}`) : ""}
</div>`;
}

export function warmeLeadsMail(leads: WarmeLead[]): { subject: string; html: string } {
  const n = leads.length;
  return {
    subject: n === 1 ? `Warme lead: ${leads[0]!.naam}` : `${n} warme leads van gisteren`,
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Warme leads",
      title: n === 1 ? "1 aangeschreven bedrijf bekeek gisteren de site" : `${n} aangeschreven bedrijven bekeken gisteren de site`,
      bodyLines: [
        "Ze klikten in de outreachmail en kwamen echt op studio-vm.be (mailscanners zijn eruit gefilterd). Nu bellen is het beste moment.",
      ],
      extraHtml: leads.map(leadHtml).join(""),
      ctaLabel: "Naar de outreach",
      ctaHref: siteLink("/admin/outreach"),
    }),
  };
}
