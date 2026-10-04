"use server";

// ─────────────────────────────────────────────────────────────────────────
// Admin-acties op één ticket (/admin/tickets/[id]): antwoorden met
// bijlagen, interne notities, status, soort en project, revisie-uren en de
// aparte revisiefactuur. Elke actie controleert eerst requireAdmin().
//
// Werkt ook zonder migratie 0049 (basisstand): antwoorden en sluiten/
// heropenen blijven werken; notities, uren, bijlagen, soort en project
// geven dan de melding 'migratie'.
// ─────────────────────────────────────────────────────────────────────────

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePortalUser } from "@/lib/portal-access";
import { UURTARIEF_CENT, MINIMUM_UREN, type Categorie } from "@/lib/tarieven";
import { klantGegevens } from "@/lib/projecten-admin";
import { bepaalBtw } from "@/lib/facturatie/btw";
import { slaFactuurOp } from "@/lib/facturatie/opslaan";
import { isValidLocale } from "@/lib/i18n/config";
import {
  BIJLAGE_MAX_AANTAL,
  MAX_BERICHT_STUDIO,
  MAX_NOTITIE,
  isTicketSoort,
  isUuid,
  toonOnderwerp,
  type ActieResultaat,
  type TicketFout,
  type TicketRij,
  type UploadPlek,
  type UrenRij,
} from "@/lib/tickets";
import { TICKET_MAIL } from "@/lib/tickets-teksten";
import {
  herlaadTicket,
  isOntbrekend,
  laadTicket,
  markeerGelezen,
  ticketSchema,
  voegBerichtToe,
  zetStatus,
} from "@/lib/tickets-server";
import { kopieerNaarPlannen, maakUploadPlekken, registreerBijlagen, studioMap } from "@/lib/tickets-bijlagen";
import { mailKlantAntwoord, mailKlantGesloten, mailKlantRevisieFactuur } from "@/lib/tickets-mail";
import { logBewijs } from "@/lib/invordering/bewijslog";

const CATEGORIEEN: Categorie[] = ["vroegtijdig", "normaal", "last-minute"];
const SNELLE_UREN = [0.25, 0.5, 1];
const MAX_UREN = 99;

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
/**
 * Vrije tekst (antwoord, notitie): de browser verstuurt multipart-formulieren
 * met CRLF; terug naar \n vóór de lengtecontrole, zodat de teller in het
 * formulier en de grens hier hetzelfde tellen.
 */
const tekstVeld = (fd: FormData, k: string) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n").trim();

function isCategorie(x: unknown): x is Categorie {
  return typeof x === "string" && (CATEGORIEEN as string[]).includes(x);
}

/** Terug naar het ticket met een melding (vervangt de geschiedenis: geen stapel meldingen bij 'Terug'). */
function terug(id: string, melding: string, mailOk: boolean = true): never {
  redirect(`/admin/tickets/${id}?melding=${melding}${mailOk ? "" : "&mail=0"}`, RedirectType.replace);
}

/** "1,25" / "1.25" → 1.25, afgerond op een kwartier; null buiten 0 < u ≤ 99. */
function kwartieren(v: string): number | null {
  if (!v) return null;
  const n = Math.round(parseFloat(v.replace(",", ".")) * 4) / 4;
  return Number.isFinite(n) && n > 0 && n <= MAX_UREN ? n : null;
}

type ProjectKern = {
  id: string;
  client_email: string;
  titel: string;
  categorie: Categorie;
  quote_id: string | null;
  offer_id: string | null;
  invoice_id: string | null;
  gewerkte_uren: number | null;
  geschatte_uren: number | null;
  plannen: { naam: string; pad: string; grootte?: number }[] | null;
};

async function laadProject(id: string | null | undefined): Promise<ProjectKern | null> {
  if (!isUuid(id)) return null;
  const { data } = await getSupabaseAdmin()
    .from("projecten")
    .select("id, client_email, titel, categorie, quote_id, offer_id, invoice_id, gewerkte_uren, geschatte_uren, plannen")
    .eq("id", id)
    .maybeSingle();
  return (data as ProjectKern | null) ?? null;
}

const zelfdeKlant = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Het gekoppelde project van het ticket, maar ENKEL als het van dezelfde
 * klant is. Wijst project_id (onverwacht) naar een project van een andere
 * klant, dan geldt het ticket als 'zonder project': geen tarief, titel,
 * offerte- of klantgegevens van die andere klant op uren of facturen.
 */
async function projectVan(t: TicketRij): Promise<ProjectKern | null> {
  const p = await laadProject(t.project_id);
  return p && zelfdeKlant(p.client_email, t.client_email) ? p : null;
}

/** Open revisie-uren van dit ticket: nog niet gefactureerd en niet bij het project gevoegd. */
async function openUren(ticketId: string): Promise<UrenRij[] | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("ticket_uren")
    .select("*")
    .eq("ticket_id", ticketId)
    .is("invoice_id", null)
    .is("naar_project_op", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[tickets] uren lezen mislukt:", error.code, error.message);
    return null;
  }
  return ((data as UrenRij[] | null) ?? []).map((r) => ({ ...r, uren: Number(r.uren), tarief_cent: Number(r.tarief_cent) }));
}

// ── Antwoorden en bijlagen ──────────────────────────────────────────────

/**
 * Antwoord van de studio. Velden: ticket_id, body (1..8000), bijlagen (JSON
 * van GeuploadBestand[] onder studioMap(id)/), sluiten='1', mail='1'.
 * Een gesloten ticket gaat eerst weer open. ok:true met een `fout` betekent:
 * het bericht staat er, maar de bijlagen konden niet bewaard worden.
 */
export async function antwoordStudio(fd: FormData): Promise<{ ok: boolean; mail: boolean; fout?: TicketFout }> {
  if (!(await requireAdmin())) return { ok: false, mail: false, fout: "login" };
  const id = s(fd, "ticket_id");
  const t = await laadTicket(id);
  if (!t) return { ok: false, mail: false, fout: "niet_gevonden" };

  const body = tekstVeld(fd, "body");
  if (!body) return { ok: false, mail: false, fout: "leeg" };
  if (body.length > MAX_BERICHT_STUDIO) return { ok: false, mail: false, fout: "te_lang" };

  let items: { naam?: unknown; pad?: unknown; grootte?: unknown }[] = [];
  try {
    const x = JSON.parse(s(fd, "bijlagen") || "[]");
    items = Array.isArray(x) ? x : [];
  } catch {
    return { ok: false, mail: false, fout: "bijlage_ontbreekt" };
  }
  if (items.length > BIJLAGE_MAX_AANTAL) return { ok: false, mail: false, fout: "bijlage_aantal" };
  const map = studioMap(t.id);
  if (items.some((i) => typeof i?.pad !== "string" || !i.pad.startsWith(`${map}/`))) {
    return { ok: false, mail: false, fout: "bijlage_ontbreekt" };
  }
  if (items.length > 0 && !(await ticketSchema()).bijlagen) return { ok: false, mail: false, fout: "migratie" };

  const sluiten = s(fd, "sluiten") === "1";
  const mailen = s(fd, "mail") === "1";

  if (t.status === "gesloten" && !(await zetStatus(t.id, "open"))) return { ok: false, mail: false, fout: "opslag" };

  const bericht = await voegBerichtToe(t.id, "studio", body);
  if (!bericht.ok) {
    herlaadTicket();
    return { ok: false, mail: false, fout: "opslag" };
  }

  let namen: string[] = [];
  let waarschuwing: TicketFout | undefined;
  if (items.length > 0) {
    const reg = await registreerBijlagen({ ticketId: t.id, messageId: bericht.berichtId, door: "studio", map, items });
    if (reg.ok) {
      namen = reg.bijlagen.map((b) => b.naam);
      if (reg.overgeslagen > 0) waarschuwing = "bijlage_ontbreekt";
    } else {
      waarschuwing = reg.fout;
    }
  }

  if (sluiten) await zetStatus(t.id, "gesloten");

  const mail = mailen ? await mailKlantAntwoord(t, body, namen, { gesloten: sluiten }) : false;
  herlaadTicket();
  return waarschuwing ? { ok: true, mail, fout: waarschuwing } : { ok: true, mail };
}

/** Eenmalige upload-links voor bijlagen bij een antwoord (map s/<ticketId>/). */
export async function bijlagePlekkenStudio(
  ticketId: string,
  bestanden: { naam: string; grootte: number }[],
): Promise<ActieResultaat<{ plekken: UploadPlek[] }>> {
  if (!(await requireAdmin())) return { ok: false, fout: "login" };
  const t = await laadTicket(ticketId);
  if (!t) return { ok: false, fout: "niet_gevonden" };
  return maakUploadPlekken(studioMap(t.id), Array.isArray(bestanden) ? bestanden : []);
}

/** Bijlage kopiëren naar de plannen van het gekoppelde project. Veld: bijlage_id. */
export async function bijlageNaarPlan(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const bijlageId = s(fd, "bijlage_id");
  if (!isUuid(bijlageId)) return;
  const db = getSupabaseAdmin();
  const { data: b } = await db
    .from("ticket_bijlagen")
    .select("id, ticket_id, naam, pad, grootte")
    .eq("id", bijlageId)
    .maybeSingle();
  const bijlage = b as { id: string; ticket_id: string; naam: string; pad: string; grootte: number | null } | null;
  if (!bijlage) return;
  const t = await laadTicket(bijlage.ticket_id);
  if (!t) return;
  const p = await projectVan(t);
  if (!p) terug(t.id, "geen-project");

  const bestaand = p.plannen ?? [];
  const grootte = bijlage.grootte != null ? Number(bijlage.grootte) : null;
  if (bestaand.some((x) => x.naam === bijlage.naam && grootte != null && Number(x.grootte) === grootte)) {
    terug(t.id, "plan-bestaat");
  }
  const kopie = await kopieerNaarPlannen(bijlage.pad, p.id, bijlage.naam, grootte);
  if (!kopie) terug(t.id, "plan-fout");

  const { error } = await db
    .from("projecten")
    .update({ plannen: [...bestaand.filter((x) => x.pad !== kopie.pad), kopie], updated_at: new Date().toISOString() })
    .eq("id", p.id);
  if (error) {
    console.error("[tickets] plan toevoegen mislukt:", error.code, error.message);
    await db.storage.from("plannen").remove([kopie.pad]);
    terug(t.id, "plan-fout");
  }
  revalidatePath(`/admin/projecten/${p.id}`);
  herlaadTicket();
  terug(t.id, "plan");
}

/** Ticket gelezen door de studio (bij het openen van de detailpagina). */
export async function markeerGelezenStudio(ticketId: string): Promise<boolean> {
  if (!(await requireAdmin())) return false;
  const ok = await markeerGelezen(ticketId, "studio");
  if (ok) herlaadTicket();
  return ok;
}

// ── Interne notities ────────────────────────────────────────────────────

/** Interne notitie (NOOIT zichtbaar voor de klant). Velden: ticket_id, body. */
export async function notitieToevoegen(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const body = tekstVeld(fd, "body");
  if (!body || body.length > MAX_NOTITIE) terug(t.id, "notitie-fout");
  if (!(await ticketSchema()).notities) terug(t.id, "migratie");
  const { error } = await getSupabaseAdmin().from("ticket_notities").insert({ ticket_id: t.id, body });
  if (error) {
    console.error("[tickets] notitie opslaan mislukt:", error.code, error.message);
    terug(t.id, isOntbrekend(error) ? "migratie" : "notitie-fout");
  }
  herlaadTicket();
  terug(t.id, "notitie");
}

/** Velden: notitie_id, ticket_id. */
export async function notitieVerwijderen(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const ticketId = s(fd, "ticket_id");
  const notitieId = s(fd, "notitie_id");
  if (!isUuid(ticketId) || !isUuid(notitieId)) return;
  if (!(await ticketSchema()).notities) terug(ticketId, "migratie");
  const { error } = await getSupabaseAdmin()
    .from("ticket_notities")
    .delete()
    .eq("id", notitieId)
    .eq("ticket_id", ticketId);
  if (error) {
    console.error("[tickets] notitie verwijderen mislukt:", error.code, error.message);
    terug(ticketId, isOntbrekend(error) ? "migratie" : "fout");
  }
  herlaadTicket();
  terug(ticketId, "notitie-weg");
}

// ── Status, soort, project ──────────────────────────────────────────────

/** Velden: ticket_id, status ('open' | 'gesloten'), mail='1' (enkel bij sluiten). */
export async function zetStatusAdmin(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const status = s(fd, "status");
  if (status !== "open" && status !== "gesloten") return;
  // Al in die toestand (dubbel verzonden, 'Terug' + opnieuw, verouderd tabblad):
  // niets herschrijven en vooral geen tweede 'gesloten'-mail.
  const nuGesloten = t.status === "gesloten";
  if (status === "gesloten" && nuGesloten) terug(t.id, "al-gesloten");
  if (status === "open" && !nuGesloten) terug(t.id, "al-open");
  if (!(await zetStatus(t.id, status))) terug(t.id, "fout");
  herlaadTicket();
  if (status === "open") terug(t.id, "heropend");
  if (s(fd, "mail") !== "1") terug(t.id, "gesloten-stil");
  const verstuurd = await mailKlantGesloten(t, { automatisch: false });
  terug(t.id, "gesloten", verstuurd);
}

/** Velden: ticket_id, soort (één van de 5 soorten). */
export async function zetSoort(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const soort = s(fd, "soort");
  if (!isTicketSoort(soort)) return;
  if (!(await ticketSchema()).v2) terug(t.id, "migratie");
  const { error } = await getSupabaseAdmin().from("tickets").update({ soort }).eq("id", t.id);
  if (error) {
    console.error("[tickets] soort wijzigen mislukt:", error.code, error.message);
    terug(t.id, isOntbrekend(error) ? "migratie" : "fout");
  }
  herlaadTicket();
  terug(t.id, "soort");
}

/**
 * Velden: ticket_id, project_id (leeg = loskoppelen). Het project moet van
 * dezelfde klant zijn (exacte vergelijking in kleine letters). Open uren
 * verhuizen mee naar het nieuwe project en krijgen het tarief van zijn
 * categorie (revisies worden aan het projecttarief gefactureerd); bij
 * loskoppelen behouden ze hun tarief.
 */
export async function koppelProject(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const schema = await ticketSchema();
  if (!schema.v2) terug(t.id, "migratie");
  const projectId = s(fd, "project_id");
  let nieuw: ProjectKern | null = null;
  if (projectId) {
    const p = await laadProject(projectId);
    if (!p || !zelfdeKlant(p.client_email, t.client_email)) terug(t.id, "project-fout");
    nieuw = p;
  }
  const db = getSupabaseAdmin();
  const { error } = await db.from("tickets").update({ project_id: nieuw?.id ?? null }).eq("id", t.id);
  if (error) {
    console.error("[tickets] project koppelen mislukt:", error.code, error.message);
    terug(t.id, isOntbrekend(error) ? "migratie" : "fout");
  }
  if (schema.uren) {
    const { error: urenFout } = await db
      .from("ticket_uren")
      .update(nieuw ? { project_id: nieuw.id, tarief_cent: UURTARIEF_CENT[nieuw.categorie] } : { project_id: null })
      .eq("ticket_id", t.id)
      .is("invoice_id", null)
      .is("naar_project_op", null);
    if (urenFout) console.error("[tickets] open uren verhuizen mislukt:", urenFout.code, urenFout.message);
  }
  if (t.project_id) revalidatePath(`/admin/projecten/${t.project_id}`);
  if (nieuw) revalidatePath(`/admin/projecten/${nieuw.id}`);
  herlaadTicket();
  terug(t.id, nieuw ? "project" : "project-los");
}

// ── Revisie-uren ────────────────────────────────────────────────────────

/**
 * Boekt uren op een ticket. Tarief = momentopname: categorie van het
 * project; zonder project de gekozen categorie, anders het tarief van de
 * vorige boeking op dit ticket, anders 'normaal'.
 */
async function boek(t: TicketRij, uren: number, omschrijving: string, categorie: Categorie | null): Promise<string> {
  if (!(await ticketSchema()).uren) return "migratie";
  const db = getSupabaseAdmin();
  const p = await projectVan(t);
  let tarief = UURTARIEF_CENT[p?.categorie ?? categorie ?? "normaal"];
  if (!p && !categorie) {
    const { data } = await db
      .from("ticket_uren")
      .select("tarief_cent")
      .eq("ticket_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const vorig = Number((data as { tarief_cent?: number } | null)?.tarief_cent);
    if (Number.isFinite(vorig) && vorig > 0) tarief = vorig;
  }
  const { error } = await db.from("ticket_uren").insert({
    ticket_id: t.id,
    project_id: p?.id ?? null,
    uren,
    tarief_cent: tarief,
    omschrijving: omschrijving || null,
  });
  if (error) {
    console.error("[tickets] uren boeken mislukt:", error.code, error.message);
    return isOntbrekend(error) ? "migratie" : "fout";
  }
  if (p) revalidatePath(`/admin/projecten/${p.id}`);
  herlaadTicket();
  return "uren";
}

/** Velden: ticket_id, uren (komma mag; per kwartier, 0 < u ≤ 99), omschrijving (≤ 300), categorie (enkel zonder project). */
export async function boekUren(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const uren = kwartieren(s(fd, "uren"));
  if (uren == null) terug(t.id, "uren-fout");
  const cat = s(fd, "categorie");
  terug(t.id, await boek(t, uren, s(fd, "omschrijving").slice(0, 300), isCategorie(cat) ? cat : null));
}

/** Snelknoppen +0,25 / +0,5 / +1 u (via .bind). */
export async function snelUren(ticketId: string, uren: number): Promise<void> {
  if (!(await requireAdmin())) return;
  if (!SNELLE_UREN.includes(uren)) return;
  const t = await laadTicket(ticketId);
  if (!t) return;
  terug(t.id, await boek(t, uren, "", null));
}

/** Velden: uren_id, ticket_id. Enkel open rijen (niet gefactureerd, niet bij het project). */
export async function verwijderUren(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const ticketId = s(fd, "ticket_id");
  const urenId = s(fd, "uren_id");
  if (!isUuid(ticketId) || !isUuid(urenId)) return;
  if (!(await ticketSchema()).uren) terug(ticketId, "migratie");
  const { data, error } = await getSupabaseAdmin()
    .from("ticket_uren")
    .delete()
    .eq("id", urenId)
    .eq("ticket_id", ticketId)
    .is("invoice_id", null)
    .is("naar_project_op", null)
    .select("id, project_id");
  if (error) {
    console.error("[tickets] uren verwijderen mislukt:", error.code, error.message);
    terug(ticketId, "fout");
  }
  const weg = (data as { id: string; project_id: string | null }[] | null) ?? [];
  if (weg.length === 0) terug(ticketId, "uren-vast");
  if (weg[0].project_id) revalidatePath(`/admin/projecten/${weg[0].project_id}`);
  herlaadTicket();
  terug(ticketId, "uren-weg");
}

/**
 * Aparte revisiefactuur voor de open uren van dit ticket. Velden: ticket_id,
 * termijn (14 | 30), btw_verlegd='1', omschrijving (optioneel).
 * Bedrag = Σ round(uren × tarief); onder het minimum wordt aangevuld tot
 * MINIMUM_UREN aan het tarief van de eerste rij. Geen offer_id, en
 * projecten.invoice_id blijft ONGEMOEID (de projectfactuur staat los).
 */
export async function factureerRevisie(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  const schema = await ticketSchema();
  if (!schema.uren || !schema.factuurKoppeling) terug(t.id, "migratie");

  const rijen = await openUren(t.id);
  if (rijen == null) terug(t.id, "fout");
  if (rijen.length === 0) terug(t.id, "geen-uren");

  const totaal = Math.round(rijen.reduce((x, r) => x + r.uren, 0) * 100) / 100;
  let bedrag = rijen.reduce((x, r) => x + Math.round(r.uren * r.tarief_cent), 0);
  if (totaal < MINIMUM_UREN) bedrag += Math.round((MINIMUM_UREN - totaal) * rijen[0].tarief_cent);
  const aangerekend = Math.max(totaal, MINIMUM_UREN);
  if (bedrag <= 0) terug(t.id, "factuur-nul");
  const tarieven = new Set(rijen.map((r) => r.tarief_cent));
  const tarief = tarieven.size === 1 ? rijen[0].tarief_cent : Math.round(bedrag / aangerekend);

  const termijn = s(fd, "termijn") === "30" ? 30 : 14;
  const db = getSupabaseAdmin();

  const p = await projectVan(t);
  type OfferteRef = {
    client_name: string | null;
    client_company: string | null;
    client_address: string | null;
    vat_number: string | null;
  };
  let offerte: OfferteRef | null = null;
  if (p?.offer_id) {
    const { data: o } = await db
      .from("offers")
      .select("client_name, client_company, client_address, vat_number")
      .eq("id", p.offer_id)
      .maybeSingle();
    offerte = (o as OfferteRef | null) ?? null;
  }
  const email = t.client_email.trim().toLowerCase();
  const k = await klantGegevens(email, p?.quote_id ?? null);
  const taal = isValidLocale(t.locale) ? t.locale : k.taal; // = ticketTaal(t), zonder tweede opzoeking
  const titel = p?.titel ?? toonOnderwerp(t);
  const omschrijving = (s(fd, "omschrijving") || TICKET_MAIL[taal].revisieOmschrijving(titel, aangerekend, tarief)).slice(0, 300);

  const dueAt = new Date(Date.now() + termijn * 86400000).toISOString().slice(0, 10);
  // Btw automatisch (VIES), zoals bij elke factuur.
  const klantBtw = offerte?.vat_number || k.btw || null;
  const besluit = await bepaalBtw(klantBtw);
  const verlegd = besluit.nulTarief;
  const opgeslagen = await slaFactuurOp({
    client_email: email,
    description: omschrijving,
    amount_cents: bedrag,
    status: "open",
    due_at: dueAt,
    public_token: randomBytes(18).toString("base64url"),
    client_name: offerte?.client_company || offerte?.client_name || k.bedrijf || k.naam || null,
    client_address: offerte?.client_address || k.adres || null,
    client_vat: klantBtw,
    ticket_id: t.id,
    vat_reverse: verlegd,
    btw_regime: besluit.regime,
    btw_controle: besluit.controle,
  }, db);
  if (!opgeslagen.ok) {
    terug(t.id, /column|ticket_id|42703/i.test(opgeslagen.fout) ? "migratie" : "factuur-fout");
  }
  const factuurId = opgeslagen.doc.id;
  const nummer = opgeslagen.doc.nummer;

  // De rijen opeisen; liep er intussen een tweede factuur of 'bij project'
  // (dubbelklik), dan deze factuur terugdraaien.
  const ids = rijen.map((r) => r.id);
  const { data: geclaimd, error: claimFout } = await db
    .from("ticket_uren")
    .update({ invoice_id: factuurId })
    .in("id", ids)
    .is("invoice_id", null)
    .is("naar_project_op", null)
    .select("id");
  if (claimFout || ((geclaimd as { id: string }[] | null) ?? []).length !== ids.length) {
    console.error("[tickets] uren aan factuur koppelen mislukt:", claimFout?.code, claimFout?.message);
    await db.from("ticket_uren").update({ invoice_id: null }).eq("invoice_id", factuurId);
    await db.from("invoices").delete().eq("id", factuurId);
    herlaadTicket();
    terug(t.id, claimFout ? "factuur-fout" : "factuur-dubbel");
  }

  await ensurePortalUser(email);
  const verstuurd = await mailKlantRevisieFactuur({
    t: { ...t, locale: taal },
    nummer,
    titel,
    bedragExclCent: bedrag,
    verlegd,
    uren: aangerekend,
    dueAt,
  });
  await logBewijs({
    soort: "factuur_verstuurd",
    invoice_id: factuurId,
    project_id: p?.id ?? null,
    client_email: email,
    details: { verstuurd, aan: email, revisie: true, ticket: t.nummer ?? t.id },
  });
  revalidatePath("/admin/facturen");
  if (p) revalidatePath(`/admin/projecten/${p.id}`);
  herlaadTicket();
  terug(t.id, "factuur", verstuurd);
}

/**
 * Open uren bij de gewerkte uren van het project voegen — enkel zolang het
 * project geen lopende factuur heeft (geen, of een vervallen). Veld: ticket_id.
 */
export async function urenNaarProject(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const t = await laadTicket(s(fd, "ticket_id"));
  if (!t) return;
  if (!(await ticketSchema()).uren) terug(t.id, "migratie");
  const p = await projectVan(t);
  if (!p) terug(t.id, "geen-project");
  const db = getSupabaseAdmin();
  if (p.invoice_id) {
    const { data: f } = await db.from("invoices").select("status").eq("id", p.invoice_id).maybeSingle();
    const st = (f as { status?: string } | null)?.status;
    if (st && st !== "vervallen") terug(t.id, "factuur-bestaat");
  }

  const rijen = await openUren(t.id);
  if (rijen == null) terug(t.id, "fout");
  if (rijen.length === 0) terug(t.id, "geen-uren");

  // Eerst opeisen (voorwaardelijk), dan pas optellen: zo telt een dubbelklik niet dubbel.
  const { data: geclaimd, error } = await db
    .from("ticket_uren")
    .update({ naar_project_op: new Date().toISOString(), project_id: p.id })
    .in(
      "id",
      rijen.map((r) => r.id),
    )
    .is("invoice_id", null)
    .is("naar_project_op", null)
    .select("id, uren");
  if (error) {
    console.error("[tickets] uren naar project mislukt:", error.code, error.message);
    terug(t.id, "fout");
  }
  const som = ((geclaimd as { id: string; uren: number }[] | null) ?? []).reduce((x, r) => x + Number(r.uren), 0);
  if (som <= 0) terug(t.id, "geen-uren");

  // Basis = wat de projectfactuur nu zou aanrekenen: de gewerkte uren, of —
  // zolang die leeg zijn — de geschatte uren (zoals het factuurformulier in de
  // cockpit). Zo verdwijnt een schatting niet stil onder enkel de revisie-uren.
  const { data: vers } = await db.from("projecten").select("gewerkte_uren, geschatte_uren").eq("id", p.id).maybeSingle();
  const v = vers as { gewerkte_uren?: number | null; geschatte_uren?: number | null } | null;
  const huidig = Number(v?.gewerkte_uren ?? v?.geschatte_uren ?? 0) || 0;
  const { error: fout } = await db
    .from("projecten")
    .update({ gewerkte_uren: Math.round((huidig + som) * 100) / 100, updated_at: new Date().toISOString() })
    .eq("id", p.id);
  if (fout) {
    console.error("[tickets] gewerkte uren bijwerken mislukt:", fout.code, fout.message);
    await db
      .from("ticket_uren")
      .update({ naar_project_op: null })
      .in(
        "id",
        ((geclaimd as { id: string }[] | null) ?? []).map((r) => r.id),
      );
    terug(t.id, "fout");
  }
  revalidatePath(`/admin/projecten/${p.id}`);
  herlaadTicket();
  terug(t.id, "naar-project");
}
