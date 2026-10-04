import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { siteUrl } from "@/lib/supabase/config";
import { BEDRIJF } from "@/lib/bedrijf";
import { logBewijs } from "./bewijslog";
import { arrondissementNaam, deurwaarders, laadDossier } from "./dossier";
import { euro } from "./teksten";

// Dagelijks (vanuit de herinneringen-cron): 14 dagen na de laatste
// herinnering een dossier voor de deurwaarder klaarzetten — enkel voor
// facturen die nog altijd openstaan. Er vertrekt niets: Studio VM kijkt het
// dossier na en verstuurt het met één klik. Wordt een factuur intussen
// betaald, dan gaat het dossier vanzelf dicht.

export const WACHTTIJD_DAGEN = 14;
const DAG = 86_400_000;
const ADMIN = `${siteUrl.replace(/\/$/, "")}/admin/invordering`;

type Fout = { code?: string; message?: string } | null;
const ontbreekt = (e: Fout) => !!e && /invorderingen|42P01|PGRST205/i.test(`${e.code} ${e.message}`);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export type KlaarzetResultaat = { actief: boolean; klaargezet: string[]; afgesloten: string[] };

export async function zetDossiersKlaar(nu = Date.now()): Promise<KlaarzetResultaat> {
  const db = getSupabaseAdmin();
  const res: KlaarzetResultaat = { actief: true, klaargezet: [], afgesloten: [] };

  const { data: lopend, error } = await db
    .from("invorderingen")
    .select("id, invoice_id, status")
    .in("status", ["klaar", "gepauzeerd", "verstuurd"])
    .limit(500);
  if (error) {
    if (!ontbreekt(error)) console.error("[invordering]", error.code, error.message);
    return { ...res, actief: false };
  }

  // 1. Intussen betaald → dossier dicht. Lag het al bij de deurwaarder, dan
  //    krijgt Studio VM een seintje om hem te verwittigen.
  const rijen = (lopend as { id: string; invoice_id: string; status: string }[] | null) ?? [];
  if (rijen.length) {
    const { data: inv } = await db
      .from("invoices")
      .select("id, number, status, paid_at")
      .in("id", rijen.map((r) => r.invoice_id));
    const betaald = new Map(
      ((inv as { id: string; number: string; status: string; paid_at: string | null }[] | null) ?? [])
        .filter((i) => i.status === "betaald")
        .map((i) => [i.id, i]),
    );
    for (const r of rijen) {
      const i = betaald.get(r.invoice_id);
      if (!i) continue;
      const { error: e } = await db
        .from("invorderingen")
        .update({ status: "afgesloten", updated_at: new Date(nu).toISOString() })
        .eq("id", r.id)
        .eq("status", r.status);
      if (e) continue;
      res.afgesloten.push(i.number);
      await logBewijs({ soort: "invordering", invoice_id: i.id, details: { actie: "afgesloten", reden: "betaald", was: r.status } });
      if (r.status === "verstuurd") {
        await sendMail(BEDRIJF.email, {
          subject: `Betaald: ${i.number} — verwittig de deurwaarder`,
          html: portalEmailHtml({
            eyebrow: "Invordering",
            title: `Factuur ${esc(i.number)} is betaald`,
            bodyLines: [
              `De factuur werd betaald${i.paid_at ? ` op ${i.paid_at.slice(0, 10)}` : ""}, maar het dossier lag al bij de deurwaarder.`,
              "Laat de deurwaarder weten dat hij de invordering mag stopzetten. Het dossier staat nu op afgesloten.",
            ],
            ctaLabel: "Dossier bekijken",
            ctaHref: `${ADMIN}/${r.id}`,
          }),
        });
      }
    }
  }

  // 2. Nieuwe dossiers: laatste herinnering verstuurd, 14 dagen later nog
  //    altijd niet betaald.
  const grens = new Date(nu - WACHTTIJD_DAGEN * DAG).toISOString();
  const { data: kand } = await db
    .from("invoices")
    .select("id, number")
    .eq("status", "vervallen")
    .gte("reminder_level", 3)
    .lte("last_reminder_at", grens)
    .limit(100);
  const kandidaten = (kand as { id: string; number: string }[] | null) ?? [];
  if (!kandidaten.length) return res;

  const { data: al } = await db
    .from("invorderingen")
    .select("invoice_id")
    .in("invoice_id", kandidaten.map((k) => k.id));
  const bestaand = new Set(((al as { invoice_id: string }[] | null) ?? []).map((r) => r.invoice_id));
  const dws = await deurwaarders();

  const regels: string[] = [];
  let eersteId: string | null = null;
  for (const k of kandidaten) {
    if (bestaand.has(k.id)) continue;
    const d = await laadDossier(k.id);
    if (!d || d.factuur.status === "betaald") continue;
    const dw = d.gebied ? dws.get(d.gebied) ?? null : null;
    const { data: nieuw, error: e } = await db
      .from("invorderingen")
      .insert({
        invoice_id: d.factuur.id,
        status: "klaar",
        arrondissement: d.gebied,
        deurwaarder: dw,
        hoofdsom_cent: d.vordering.hoofdsomCent,
        interest_cent: d.vordering.interestCent,
        forfait_cent: d.vordering.forfaitCent,
        berekend_op: d.vordering.berekendOp,
      })
      .select("id")
      .single();
    if (e || !nieuw) {
      if (e?.code !== "23505") console.error("[invordering] klaarzetten mislukt:", e?.code, e?.message);
      continue;
    }
    const id = (nieuw as { id: string }).id;
    eersteId ??= id;
    res.klaargezet.push(d.factuur.nummer);
    await logBewijs({
      soort: "invordering",
      invoice_id: d.factuur.id,
      client_email: d.klant.email,
      details: { actie: "klaargezet", totaal_cent: d.vordering.totaalCent, gebied: d.gebied },
    });
    const wie = dw
      ? `deurwaarder: ${esc(dw.naam)}`
      : d.gebied
        ? `<b>nog geen deurwaarder ingesteld</b> voor ${esc(arrondissementNaam(d.gebied) ?? "")}`
        : "<b>kies zelf een deurwaarder</b>";
    const let_op = d.waarschuwingen.length ? `<br><span style="color:#b45309">Let op: ${d.waarschuwingen.map((w) => esc(w.tekst)).join(" ")}</span>` : "";
    regels.push(
      `<b>${esc(d.factuur.nummer)}</b> — ${esc(d.klant.naam)} — ${euro(d.vordering.totaalCent, "nl")}<br>${
        d.gebied ? `${d.buitenland ? "Land" : "Arrondissement"} ${esc(arrondissementNaam(d.gebied) ?? "")}, ` : ""
      }${wie}${let_op}`,
    );
  }

  if (regels.length) {
    const een = regels.length === 1;
    await sendMail(BEDRIJF.email, {
      subject: een ? `Dossier klaar voor de deurwaarder — ${res.klaargezet[0]}` : `${regels.length} dossiers klaar voor de deurwaarder`,
      html: portalEmailHtml({
        eyebrow: "Invordering",
        title: een ? "Dossier klaar voor de deurwaarder" : `${regels.length} dossiers klaar voor de deurwaarder`,
        bodyLines: [
          `${WACHTTIJD_DAGEN} dagen na de laatste herinnering is er nog altijd niet betaald. Het dossier staat klaar: begeleidende brief, factuur en bewijsdossier.`,
          ...regels,
          "Er vertrekt niets zonder jou: kijk het dossier na en verstuur het met één klik.",
        ],
        ctaLabel: een ? "Dossier nakijken" : "Dossiers nakijken",
        ctaHref: een && eersteId ? `${ADMIN}/${eersteId}` : ADMIN,
      }),
    });
  }
  return res;
}
