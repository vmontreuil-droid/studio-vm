import "server-only";
// Server-hulpjes voor tickets (service-role). Geen server actions — die staan
// in src/app/actions/tickets-*.ts en controleren eerst wie er aanmeldt en of
// het ticket of project van die klant is. Klanten schrijven nooit zelf in de
// databank: alle inserts/updates hieronder lopen via de service-role.
//
// Werkt met én zonder migratie 0049: ticketSchema() peilt welke kolommen en
// tabellen er zijn; zonder 0049 valt alles terug op de basisstand (enkel
// client_email, subject, status en de berichten).

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { monitorConfigured, supabaseConfigured } from "@/lib/supabase/config";
import { getCompanySettings } from "@/lib/admin/settings";
import { klantGegevens } from "@/lib/projecten-admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import {
  MAX_BERICHT_STUDIO,
  PREFIX_AFSPRAAK,
  PREFIX_REVISIE,
  isTicketSoort,
  isUuid,
  type Afzender,
  type BerichtRij,
  type BijlageRij,
  type TicketRij,
  type TicketSoort,
} from "@/lib/tickets";

const STUDIO_INBOX_FALLBACK = "info@studio-vm.be";
const MAX_ONDERWERP_DB = 200; // controle in 0049: 1..200 (incl. voorvoegsel van de basisstand)

// ── Welk schema staat er live? ──────────────────────────────────────────

export type TicketSchema = {
  /** Migratie 0049: nieuwe kolommen op tickets (soort, nummer, wacht_op, gelezen …). */
  v2: boolean;
  bijlagen: boolean;
  notities: boolean;
  uren: boolean;
  /** invoices.ticket_id + invoices.vat_reverse. */
  factuurKoppeling: boolean;
};

const ALLES_UIT: TicketSchema = { v2: false, bijlagen: false, notities: false, uren: false, factuurKoppeling: false };
const CACHE_MS = 60_000;

let schemaCache: { tot: number; waarde: TicketSchema } | null = null;
let schemaBezig: Promise<TicketSchema> | null = null;

type DbFout = { code?: string | null; message?: string | null } | null | undefined;

/** Ontbrekende kolom/tabel/relatie (migratie nog niet gedraaid). Andere fouten tellen niet. */
export function isOntbrekend(error: DbFout): boolean {
  const c = error?.code ?? "";
  return c === "42703" || c === "42P01" || c === "PGRST204" || c === "PGRST205" || c === "PGRST200";
}

async function peilSchema(): Promise<TicketSchema> {
  if (!monitorConfigured) return ALLES_UIT;
  try {
    const db = getSupabaseAdmin();
    const [t, b, n, u, f] = await Promise.all([
      db.from("tickets").select("id,soort,wacht_op,nummer,klant_ongelezen").limit(1),
      db.from("ticket_bijlagen").select("id").limit(1),
      db.from("ticket_notities").select("id").limit(1),
      db.from("ticket_uren").select("id").limit(1),
      db.from("invoices").select("id,ticket_id,vat_reverse").limit(1),
    ]);
    let zeker = true;
    const vlag = (r: { error: DbFout }) => {
      if (!r.error) return true;
      if (!isOntbrekend(r.error)) {
        zeker = false;
        console.error("[tickets] schema-peiling mislukt:", r.error.code, r.error.message);
      }
      return false;
    };
    const waarde: TicketSchema = {
      v2: vlag(t),
      bijlagen: vlag(b),
      notities: vlag(n),
      uren: vlag(u),
      factuurKoppeling: vlag(f),
    };
    // Enkel een zeker antwoord bewaren; een netwerkfout wordt de volgende keer opnieuw gepeild.
    if (zeker) schemaCache = { tot: Date.now() + CACHE_MS, waarde };
    return waarde;
  } catch (e) {
    console.error("[tickets] schema-peiling mislukt:", e);
    return ALLES_UIT;
  }
}

/** Welke 0049-onderdelen er zijn. Gooit nooit; 60 s gecachet per serverinstantie. */
export async function ticketSchema(): Promise<TicketSchema> {
  if (schemaCache && schemaCache.tot > Date.now()) return schemaCache.waarde;
  if (!schemaBezig) {
    schemaBezig = peilSchema().finally(() => {
      schemaBezig = null;
    });
  }
  return schemaBezig;
}

/** Cache vergeten (bv. na een fout die op een gewijzigd schema wijst). */
export function vergeetTicketSchema(): void {
  schemaCache = null;
}

// ── Wie ─────────────────────────────────────────────────────────────────

/** E-mail van de aangemelde klant (kleine letters), of null. */
export async function klantEmail(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  try {
    const sb = await getSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const e = user?.email?.trim().toLowerCase();
    return e || null;
  } catch {
    return null;
  }
}

/** Inbox van Studio VM (bedrijfsinstellingen), anders info@studio-vm.be. */
export async function studioInbox(): Promise<string> {
  try {
    const s = await getCompanySettings();
    return (s.email ?? "").trim() || STUDIO_INBOX_FALLBACK;
  } catch {
    return STUDIO_INBOX_FALLBACK;
  }
}

// ── Lezen ───────────────────────────────────────────────────────────────

/** Ticket van DEZE klant (exacte e-mail, kleine letters), anders null. */
export async function eigenTicket(email: string, id: string): Promise<TicketRij | null> {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e || !isUuid(id)) return null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("tickets")
      .select("*")
      .eq("id", id)
      .eq("client_email", e)
      .maybeSingle();
    return (data as TicketRij | null) ?? null;
  } catch {
    return null;
  }
}

/** Ticket op id, zonder eigendomscontrole — enkel voor de admin of na een eigen controle. */
export async function laadTicket(id: string): Promise<TicketRij | null> {
  if (!isUuid(id)) return null;
  try {
    const { data } = await getSupabaseAdmin().from("tickets").select("*").eq("id", id).maybeSingle();
    return (data as TicketRij | null) ?? null;
  } catch {
    return null;
  }
}

/** Alle berichten van één ticket, oudste eerst. */
export async function laadBerichten(ticketId: string): Promise<BerichtRij[]> {
  if (!isUuid(ticketId)) return [];
  try {
    const { data } = await getSupabaseAdmin()
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(1000);
    return (data as BerichtRij[] | null) ?? [];
  } catch {
    return [];
  }
}

/** Bijlagen van deze tickets, oudste eerst. [] als de tabel (nog) niet bestaat. */
export async function laadBijlagen(ticketIds: string[]): Promise<BijlageRij[]> {
  const ids = [...new Set((ticketIds ?? []).filter(isUuid))];
  if (ids.length === 0) return [];
  try {
    const db = getSupabaseAdmin();
    const uit: BijlageRij[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db
        .from("ticket_bijlagen")
        .select("*")
        .in("ticket_id", ids.slice(i, i + 100))
        .order("created_at", { ascending: true })
        .limit(2000);
      if (error) return [];
      uit.push(...((data as BijlageRij[] | null) ?? []));
    }
    return uit;
  } catch {
    return [];
  }
}

/** Taal waarin we de klant over dit ticket aanschrijven: ticket → project/aanvraag → klant → 'nl'. */
export async function ticketTaal(t: Pick<TicketRij, "client_email"> & Partial<TicketRij>): Promise<Locale> {
  if (isValidLocale(t.locale)) return t.locale;
  try {
    let quoteId: string | null = null;
    if (isUuid(t.project_id)) {
      const { data } = await getSupabaseAdmin()
        .from("projecten")
        .select("quote_id")
        .eq("id", t.project_id)
        .maybeSingle();
      quoteId = (data as { quote_id?: string | null } | null)?.quote_id ?? null;
    }
    const taal = (await klantGegevens(t.client_email, quoteId)).taal;
    return isValidLocale(taal) ? taal : "nl";
  } catch {
    return "nl";
  }
}

// ── Schrijven ───────────────────────────────────────────────────────────

export type NieuwTicket = {
  email: string;
  subject: string;
  body: string;
  soort: TicketSoort;
  afzender: Afzender;
  projectId?: string | null;
  locale?: string | null;
  systeem?: string | null;
  revisieAkkoord?: boolean;
};

export type NieuwTicketResultaat =
  | { ok: true; ticket: TicketRij; berichtId: string; dubbel?: boolean }
  | { ok: false; fout: "opslag" };

/** Onderwerp zoals het in de basisstand (zonder kolom 'soort') bewaard wordt. */
function basisOnderwerp(subject: string, soort: TicketSoort): string {
  if (soort === "revisie" && !subject.startsWith(PREFIX_REVISIE)) return PREFIX_REVISIE + subject;
  if (soort === "afspraak" && !subject.startsWith(PREFIX_AFSPRAAK.trim())) return PREFIX_AFSPRAAK + subject;
  return subject;
}

/** Hetzelfde ticket werd net al aangemaakt (dubbelklik, opnieuw versturen)? */
async function zoekDubbel(email: string, subject: string, body: string): Promise<{ ticket: TicketRij; berichtId: string } | null> {
  const db = getSupabaseAdmin();
  const sinds = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data: kandidaten } = await db
    .from("tickets")
    .select("*")
    .eq("client_email", email)
    .eq("subject", subject)
    .gte("created_at", sinds)
    .order("created_at", { ascending: false })
    .limit(5);
  const tickets = (kandidaten as TicketRij[] | null) ?? [];
  if (tickets.length === 0) return null;
  const { data: msgs } = await db
    .from("ticket_messages")
    .select("id, ticket_id, body, created_at")
    .in(
      "ticket_id",
      tickets.map((t) => t.id),
    )
    .order("created_at", { ascending: true })
    .limit(50);
  const eerste = new Map<string, { id: string; body: string }>();
  for (const m of (msgs as { id: string; ticket_id: string; body: string }[] | null) ?? []) {
    if (!eerste.has(m.ticket_id)) eerste.set(m.ticket_id, m);
  }
  for (const t of tickets) {
    const m = eerste.get(t.id);
    if (m && m.body.trim() === body) return { ticket: t, berichtId: m.id };
  }
  return null;
}

/**
 * Maakt een ticket + het eerste bericht aan (service-role). Een identiek
 * ticket (zelfde e-mail, onderwerp en eerste bericht) van de laatste 2 minuten
 * wordt teruggegeven met dubbel: true in plaats van een tweede aan te maken.
 * Faalt het bericht, dan wordt het ticket weer verwijderd.
 */
export async function maakTicketRij(n: NieuwTicket): Promise<NieuwTicketResultaat> {
  const email = String(n.email ?? "").trim().toLowerCase();
  const subject = String(n.subject ?? "").trim();
  const body = String(n.body ?? "").trim().slice(0, MAX_BERICHT_STUDIO);
  if (!email || !subject || !body) return { ok: false, fout: "opslag" };

  try {
    const db = getSupabaseAdmin();
    let schema = await ticketSchema();
    const nu = new Date().toISOString();

    const v2Rij = () => ({
      client_email: email,
      subject: subject.slice(0, MAX_ONDERWERP_DB),
      status: "open",
      soort: isTicketSoort(n.soort) ? n.soort : "vraag",
      project_id: isUuid(n.projectId) ? n.projectId : null,
      locale: isValidLocale(n.locale) ? n.locale : null,
      systeem: n.systeem ? String(n.systeem).trim().slice(0, 80) || null : null,
      revisie_akkoord_op: n.revisieAkkoord ? nu : null,
      wacht_op: n.afzender === "studio" ? "klant" : "studio",
    });
    const v1Rij = () => ({
      client_email: email,
      subject: basisOnderwerp(subject, n.soort).slice(0, MAX_ONDERWERP_DB),
    });

    const dubbel = await zoekDubbel(email, (schema.v2 ? v2Rij() : v1Rij()).subject, body);
    if (dubbel) return { ok: true, ticket: dubbel.ticket, berichtId: dubbel.berichtId, dubbel: true };

    let ins = await db.from("tickets").insert(schema.v2 ? v2Rij() : v1Rij()).select("*").single();
    if (ins.error && schema.v2 && isOntbrekend(ins.error)) {
      // Cache zei v2, de databank niet (meer): opnieuw in de basisstand.
      vergeetTicketSchema();
      schema = { ...schema, v2: false };
      ins = await db.from("tickets").insert(v1Rij()).select("*").single();
    }
    if (ins.error || !ins.data) {
      console.error("[tickets] ticket opslaan mislukt:", ins.error?.code, ins.error?.message);
      return { ok: false, fout: "opslag" };
    }
    const ticket = ins.data as TicketRij;

    const msg = await db
      .from("ticket_messages")
      .insert({ ticket_id: ticket.id, sender: n.afzender, body })
      .select("id")
      .single();
    if (msg.error || !msg.data) {
      console.error("[tickets] eerste bericht opslaan mislukt:", msg.error?.code, msg.error?.message);
      await db.from("tickets").delete().eq("id", ticket.id);
      return { ok: false, fout: "opslag" };
    }

    // Met 0049 werkt een trigger het ticket bij (wacht_op, laatste_*): vers ophalen.
    let vers = ticket;
    if (schema.v2) {
      const { data } = await db.from("tickets").select("*").eq("id", ticket.id).maybeSingle();
      if (data) vers = data as TicketRij;
    }
    return { ok: true, ticket: vers, berichtId: (msg.data as { id: string }).id };
  } catch (e) {
    console.error("[tickets] ticket opslaan mislukt:", e);
    return { ok: false, fout: "opslag" };
  }
}

/** Voegt een bericht toe. Met 0049 werkt een trigger het ticket bij; zonder enkel updated_at. */
export async function voegBerichtToe(
  ticketId: string,
  sender: Afzender,
  body: string,
): Promise<{ ok: true; berichtId: string } | { ok: false; fout: "opslag" }> {
  const tekst = String(body ?? "").trim().slice(0, MAX_BERICHT_STUDIO);
  if (!isUuid(ticketId) || !tekst || (sender !== "klant" && sender !== "studio")) return { ok: false, fout: "opslag" };
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("ticket_messages")
      .insert({ ticket_id: ticketId, sender, body: tekst })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[tickets] bericht opslaan mislukt:", error?.code, error?.message);
      return { ok: false, fout: "opslag" };
    }
    if (!(await ticketSchema()).v2) {
      await db.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
    }
    return { ok: true, berichtId: (data as { id: string }).id };
  } catch (e) {
    console.error("[tickets] bericht opslaan mislukt:", e);
    return { ok: false, fout: "opslag" };
  }
}

/** Open of gesloten zetten (met 0049 ook gesloten_op). */
export async function zetStatus(ticketId: string, status: "open" | "gesloten"): Promise<boolean> {
  if (!isUuid(ticketId) || (status !== "open" && status !== "gesloten")) return false;
  try {
    const db = getSupabaseAdmin();
    const nu = new Date().toISOString();
    const basis = { status, updated_at: nu };
    if ((await ticketSchema()).v2) {
      const { error } = await db
        .from("tickets")
        .update({ ...basis, gesloten_op: status === "gesloten" ? nu : null })
        .eq("id", ticketId);
      if (!error) return true;
      if (!isOntbrekend(error)) {
        console.error("[tickets] status wijzigen mislukt:", error.code, error.message);
        return false;
      }
      vergeetTicketSchema();
    }
    const { error } = await db.from("tickets").update(basis).eq("id", ticketId);
    if (error) console.error("[tickets] status wijzigen mislukt:", error.code, error.message);
    return !error;
  } catch (e) {
    console.error("[tickets] status wijzigen mislukt:", e);
    return false;
  }
}

/**
 * Markeert het ticket als gelezen door de klant of door de studio:
 * gelezen_op = max(nu, laatste_bericht_op + 1 ms), zodat een klokverschil
 * tussen server en databank het nooit ongelezen laat. Voor de klant is
 * `email` verplicht en telt het enkel als het ticket van die klant is
 * (zonder e-mail: niets). Zonder 0049: niets.
 */
export async function markeerGelezen(ticketId: string, wie: Afzender, email?: string): Promise<boolean> {
  if (!isUuid(ticketId) || (wie !== "klant" && wie !== "studio")) return false;
  const e = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (wie === "klant" && !e) return false;
  try {
    if (!(await ticketSchema()).v2) return false;
    const db = getSupabaseAdmin();
    const kol = wie === "klant" ? "klant_gelezen_op" : "studio_gelezen_op";
    let q = db.from("tickets").select(`id, laatste_bericht_op, ${kol}`).eq("id", ticketId);
    if (wie === "klant") q = q.eq("client_email", e);
    const { data, error } = await q.maybeSingle();
    if (error || !data) return false;
    const rij = data as unknown as Record<string, string | null>;
    const laatste = rij.laatste_bericht_op ? Date.parse(rij.laatste_bericht_op) : NaN;
    const gelezen = rij[kol] ? Date.parse(rij[kol] as string) : NaN;
    if (Number.isFinite(laatste) && Number.isFinite(gelezen) && gelezen > laatste) return true; // al gelezen
    const ts = new Date(Math.max(Date.now(), Number.isFinite(laatste) ? laatste + 1 : 0)).toISOString();
    let u = db.from("tickets").update({ [kol]: ts }).eq("id", ticketId);
    if (wie === "klant") u = u.eq("client_email", e);
    const { error: fout } = await u;
    if (fout) console.error("[tickets] gelezen markeren mislukt:", fout.code, fout.message);
    return !fout;
  } catch {
    return false;
  }
}

// ── Limieten tegen spam ─────────────────────────────────────────────────

/** Aantal tickets dat deze klant het voorbije uur opende. */
export async function telTicketsLaatsteUur(email: string): Promise<number> {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return 0;
  try {
    const { count } = await getSupabaseAdmin()
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("client_email", e)
      .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Aantal berichten van deze afzender op dit ticket het voorbije uur. */
export async function telBerichtenLaatsteUur(ticketId: string, sender: Afzender): Promise<number> {
  if (!isUuid(ticketId)) return 0;
  try {
    const { count } = await getSupabaseAdmin()
      .from("ticket_messages")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticketId)
      .eq("sender", sender)
      .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ── Verversen ───────────────────────────────────────────────────────────

/** Portaal (teller, lijsten) en admin (badge, lijsten) opnieuw laten renderen. */
export function herlaadTicket(): void {
  try {
    revalidatePath("/[locale]/portail/dashboard", "layout");
    revalidatePath("/admin", "layout");
    // De admin staat in de routegroep (intern); de impliciete tag draagt die naam mee.
    revalidatePath("/(intern)/admin", "layout");
  } catch (e) {
    // Buiten een request (bv. in een script) is er niets te verversen.
    console.warn("[tickets] verversen overgeslagen:", e instanceof Error ? e.message : e);
  }
}
