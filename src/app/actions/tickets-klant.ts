"use server";

// Acties van de KLANT rond Support-tickets.
//
// Klanten schrijven nooit zelf in de databank: elke actie stelt eerst vast
// wie er aangemeld is (klantEmail), controleert dan of het ticket of project
// van die klant is (exacte e-mail of RLS via de klant-sessie), en pas daarna
// schrijft de server via de service-role (tickets-server.ts).
//
// Werkt met én zonder migratie 0049 (ticketSchema): zonder 0049 geen
// bijlagen en geen 'gelezen', de rest werkt zoals voorheen.

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import type { Categorie } from "@/lib/tarieven";
import type { ProjectStatus } from "@/lib/projecten";
import { klantGegevens } from "@/lib/projecten-admin";
import {
  BIJLAGE_MAX_AANTAL,
  MAX_BERICHT,
  MAX_BERICHTEN_PER_UUR,
  MAX_ONDERWERP,
  MAX_TICKETS_PER_UUR,
  PREFIX_AFSPRAAK,
  PREFIX_REVISIE,
  REVISIE_PROJECTSTATUS,
  isKlantSoort,
  isUuid,
  magHeropenen,
  type ActieResultaat,
  type KlantSoort,
  type TicketFout,
  type TicketRij,
  type UploadPlek,
} from "@/lib/tickets";
import {
  eigenTicket,
  herlaadTicket,
  klantEmail,
  maakTicketRij,
  markeerGelezen,
  telBerichtenLaatsteUur,
  telTicketsLaatsteUur,
  ticketSchema,
  voegBerichtToe,
  zetStatus,
} from "@/lib/tickets-server";
import { BUCKET, bijlageLink, klantMap, maakUploadPlekken, registreerBijlagen } from "@/lib/tickets-bijlagen";
import { mailKlantOntvangen, mailStudio } from "@/lib/tickets-mail";

const MAX_SYSTEEM = 80;
/** Opeenvolgende berichten van de klant binnen dit venster geven geen nieuwe studiomail. */
const STUDIO_MAIL_PAUZE_MS = 10 * 60_000;
/** Hoogstens zoveel bijlagen per klant per uur (uitgegeven upload-links én opgeladen bestanden). */
const MAX_BIJLAGEN_PER_UUR = 30;
const UUR_MS = 3600_000;

type EigenProject = {
  id: string;
  titel: string;
  status: ProjectStatus;
  categorie: Categorie;
  quote_id: string | null;
};

type BijlageItem = { naam: string; pad: string; grootte?: number };

function tekst(fd: FormData, naam: string): string {
  const v = fd.get(naam);
  return typeof v === "string" ? v : "";
}

/**
 * Onderwerp zonder de oude voorvoegsels ('Revisie — ', '[Afspraak]'). In de
 * basisstand (zonder 0049) bepalen die de soort (soortVan) en zet de backfill
 * van 0049 er soort='revisie'/'afspraak' mee; enkel het soort-veld mag ze dus
 * zetten (maakTicketRij voegt ze zelf toe), nooit de getypte tekst.
 */
function zonderVoorvoegsel(s: string): string {
  let r = s;
  for (;;) {
    const v = r.startsWith(PREFIX_REVISIE)
      ? PREFIX_REVISIE
      : r.startsWith(PREFIX_AFSPRAAK.trim())
        ? PREFIX_AFSPRAAK.trim()
        : null;
    if (!v) return r;
    r = r.slice(v.length).trim();
  }
}

/** Normaliseert regeleinden (\r\n → \n) en knipt witruimte aan begin en einde weg. */
function bericht(fd: FormData, naam: string): string {
  return tekst(fd, naam).replace(/\r\n?/g, "\n").trim();
}

/** Bijlagen-JSON uit het formulier: [] bij niets, null bij onleesbaar of te veel. */
function leesBijlagen(fd: FormData): { items: BijlageItem[] } | { fout: TicketFout } {
  const ruw = tekst(fd, "bijlagen").trim();
  if (!ruw) return { items: [] };
  let data: unknown;
  try {
    data = JSON.parse(ruw);
  } catch {
    return { fout: "bijlage_ontbreekt" };
  }
  if (!Array.isArray(data)) return { fout: "bijlage_ontbreekt" };
  if (data.length > BIJLAGE_MAX_AANTAL) return { fout: "bijlage_aantal" };
  const items: BijlageItem[] = [];
  for (const x of data) {
    const i = (x ?? {}) as { naam?: unknown; pad?: unknown; grootte?: unknown };
    if (typeof i.pad !== "string" || !i.pad) return { fout: "bijlage_ontbreekt" };
    items.push({
      naam: typeof i.naam === "string" ? i.naam : "",
      pad: i.pad,
      grootte: typeof i.grootte === "number" ? i.grootte : undefined,
    });
  }
  return { items };
}

/** Project van de aangemelde klant, gelezen met de KLANT-sessie: RLS bewijst het eigendom. */
async function eigenProject(id: string): Promise<EigenProject | null> {
  if (!isUuid(id)) return null;
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("projecten")
      .select("id,titel,status,categorie,quote_id")
      .eq("id", id)
      .maybeSingle();
    return (data as EigenProject | null) ?? null;
  } catch {
    return null;
  }
}

// ── Bijlagen opladen ────────────────────────────────────────────────────

type Uitgifte = { t: number; n: number };

/**
 * Upload-links die deze serverinstantie het voorbije uur uitgaf, per klantmap.
 * Vangt herhaalde aanvragen op vóór er iets is opgeladen; de telling in de
 * opslag (opgeladenLaatsteUur) geldt over alle instanties heen.
 */
const UITGEGEVEN = new Map<string, Uitgifte[]>();

function recenteUitgiften(map: string): Uitgifte[] {
  const sinds = Date.now() - UUR_MS;
  const recent = (UITGEGEVEN.get(map) ?? []).filter((u) => u.t > sinds);
  if (recent.length > 0) UITGEGEVEN.set(map, recent);
  else UITGEGEVEN.delete(map);
  return recent;
}

/** Reserveert `n` links voor deze map, of null als het uurmaximum dan overschreden wordt. */
function reserveerUitgifte(map: string, n: number): Uitgifte | null {
  const recent = recenteUitgiften(map);
  if (recent.reduce((s, u) => s + u.n, 0) + n > MAX_BIJLAGEN_PER_UUR) return null;
  const u: Uitgifte = { t: Date.now(), n };
  UITGEGEVEN.set(map, [...recent, u]);
  if (UITGEGEVEN.size > 2000) {
    for (const m of [...UITGEGEVEN.keys()]) recenteUitgiften(m);
  }
  return u;
}

function geefUitgifteTerug(map: string, u: Uitgifte): void {
  const rest = (UITGEGEVEN.get(map) ?? []).filter((x) => x !== u);
  if (rest.length > 0) UITGEGEVEN.set(map, rest);
  else UITGEGEVEN.delete(map);
}

/** Aantal bestanden dat het voorbije uur in deze klantmap werd opgeladen (0 als dat niet te lezen is). */
async function opgeladenLaatsteUur(map: string): Promise<number> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .list(map, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      console.error("[tickets] klantmap tellen mislukt:", error.message);
      return 0;
    }
    const sinds = Date.now() - UUR_MS;
    return (data ?? []).filter((o) => o.id && o.created_at && Date.parse(o.created_at) > sinds).length;
  } catch (e) {
    console.error("[tickets] klantmap tellen mislukt:", e);
    return 0;
  }
}

/**
 * Eenmalige upload-links in de map van deze klant (de browser laadt daarna
 * zelf op). Hoogstens MAX_BIJLAGEN_PER_UUR per klant per uur, anders 'te_veel'.
 */
export async function bijlagePlekkenKlant(
  bestanden: { naam: string; grootte: number }[],
): Promise<ActieResultaat<{ plekken: UploadPlek[] }>> {
  const email = await klantEmail();
  if (!email) return { ok: false, fout: "login" };
  if (!Array.isArray(bestanden)) return { ok: false, fout: "bijlage_ontbreekt" };
  if (bestanden.length > BIJLAGE_MAX_AANTAL) return { ok: false, fout: "bijlage_aantal" };
  if (!(await ticketSchema()).bijlagen) return { ok: false, fout: "migratie" };
  if (bestanden.length === 0) return { ok: true, plekken: [] };
  const lijst = bestanden.map((b) => ({ naam: String(b?.naam ?? ""), grootte: Number(b?.grootte) }));
  const map = klantMap(email);

  // Eerst (zonder wachten) reserveren, zodat gelijktijdige aanvragen elkaar zien.
  const uitgifte = reserveerUitgifte(map, lijst.length);
  if (!uitgifte) return { ok: false, fout: "te_veel" };
  if ((await opgeladenLaatsteUur(map)) + lijst.length > MAX_BIJLAGEN_PER_UUR) {
    geefUitgifteTerug(map, uitgifte);
    return { ok: false, fout: "te_veel" };
  }
  const r = await maakUploadPlekken(map, lijst);
  if (!r.ok) geefUitgifteTerug(map, uitgifte);
  return r;
}

// ── Nieuw ticket ────────────────────────────────────────────────────────

/**
 * Nieuw ticket van de klant. Velden: locale, soort, project_id, systeem,
 * subject, body, revisie_akkoord ('1'), bijlagen (JSON GeuploadBestand[]).
 */
export async function maakTicket(fd: FormData): Promise<ActieResultaat<{ id: string }>> {
  const email = await klantEmail();
  if (!email) return { ok: false, fout: "login" };

  const ruweLocale = tekst(fd, "locale");
  const locale: Locale = isValidLocale(ruweLocale) ? ruweLocale : "nl";
  const ruweSoort = tekst(fd, "soort");
  const soort: KlantSoort = isKlantSoort(ruweSoort) ? ruweSoort : "vraag";
  const projectId = tekst(fd, "project_id").trim();
  const systeem = tekst(fd, "systeem").replace(/\s+/g, " ").trim();
  const subject = zonderVoorvoegsel(tekst(fd, "subject").replace(/\s+/g, " ").trim());
  const body = bericht(fd, "body");
  const akkoord = tekst(fd, "revisie_akkoord") === "1";

  if (!subject || !body) return { ok: false, fout: "leeg" };
  if (subject.length > MAX_ONDERWERP || body.length > MAX_BERICHT || systeem.length > MAX_SYSTEEM) {
    return { ok: false, fout: "te_lang" };
  }

  const bijl = leesBijlagen(fd);
  if ("fout" in bijl) return { ok: false, fout: bijl.fout };

  // Project (optioneel, verplicht bij een revisie): eigendom via de klant-sessie.
  let project: EigenProject | null = null;
  if (projectId) {
    project = await eigenProject(projectId);
    if (!project) return { ok: false, fout: "project" };
  }
  if (soort === "revisie") {
    if (!project) return { ok: false, fout: "project" };
    if (!REVISIE_PROJECTSTATUS.includes(project.status)) return { ok: false, fout: "revisie_niet_mogelijk" };
    if (!akkoord) return { ok: false, fout: "akkoord" };
  }

  const schema = await ticketSchema();
  if (bijl.items.length > 0 && !schema.bijlagen) return { ok: false, fout: "migratie" };

  // Twee identieke verzoeken tegelijk (dubbelklik vóór de knop blokkeert):
  // het tweede wacht op het eerste en krijgt hetzelfde ticket. Na afloop vangt
  // maakTicketRij herhalingen op (zelfde onderwerp en bericht binnen 2 minuten).
  const sleutel = [email, soort, project?.id ?? "", subject, body].join("\u0000");
  const lopend = LOPEND.get(sleutel);
  if (lopend) return lopend;
  const werk = maakTicketNu({ email, locale, soort, project, systeem, subject, body, akkoord, items: bijl.items });
  LOPEND.set(sleutel, werk);
  try {
    return await werk;
  } finally {
    LOPEND.delete(sleutel);
  }
}

/** Nieuwe tickets die nu worden aangemaakt, per identiek verzoek (binnen deze serverinstantie). */
const LOPEND = new Map<string, Promise<ActieResultaat<{ id: string }>>>();

/**
 * Id van een identiek ticket van deze klant (zelfde onderwerp en eerste
 * bericht) uit de laatste 2 minuten, anders null. Zelfde regel als de
 * dubbel-controle in maakTicketRij; de basisstand (zonder 0049) bewaart het
 * onderwerp van een revisie of afspraak met voorvoegsel.
 */
async function recentDubbel(email: string, subject: string, body: string): Promise<string | null> {
  try {
    const db = getSupabaseAdmin();
    const sinds = new Date(Date.now() - 2 * 60_000).toISOString();
    const { data: kandidaten, error } = await db
      .from("tickets")
      .select("id, subject")
      .eq("client_email", email.trim().toLowerCase())
      .gte("created_at", sinds)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return null;
    const onderwerpen = new Set([subject, PREFIX_REVISIE + subject, PREFIX_AFSPRAAK + subject]);
    const ids = ((kandidaten as { id: string; subject: string }[] | null) ?? [])
      .filter((t) => onderwerpen.has(String(t.subject ?? "").trim()))
      .map((t) => t.id);
    if (ids.length === 0) return null;
    const { data: msgs, error: fout } = await db
      .from("ticket_messages")
      .select("ticket_id, body, created_at")
      .in("ticket_id", ids)
      .order("created_at", { ascending: true })
      .limit(50);
    if (fout) return null;
    const eerste = new Map<string, string>();
    for (const m of (msgs as { ticket_id: string; body: string }[] | null) ?? []) {
      if (!eerste.has(m.ticket_id)) eerste.set(m.ticket_id, String(m.body ?? ""));
    }
    return ids.find((id) => eerste.get(id)?.trim() === body) ?? null;
  } catch {
    return null;
  }
}

async function maakTicketNu(a: {
  email: string;
  locale: Locale;
  soort: KlantSoort;
  project: EigenProject | null;
  systeem: string;
  subject: string;
  body: string;
  akkoord: boolean;
  items: BijlageItem[];
}): Promise<ActieResultaat<{ id: string }>> {
  const { email, locale, soort, project, systeem, subject, body, akkoord } = a;
  if ((await telTicketsLaatsteUur(email)) >= MAX_TICKETS_PER_UUR) {
    // Een opnieuw verstuurd ticket dat er al is (antwoord onderweg verloren)
    // krijgt zijn bestaande ticket terug, niet de melding 'te veel'.
    const bestaand = await recentDubbel(email, subject, body);
    return bestaand ? { ok: true, id: bestaand } : { ok: false, fout: "te_veel" };
  }

  const r = await maakTicketRij({
    email,
    subject,
    body,
    soort,
    afzender: "klant",
    projectId: project?.id ?? null,
    locale,
    systeem: soort === "machine" ? systeem || null : null,
    revisieAkkoord: soort === "revisie" && akkoord,
  });
  if (!r.ok) return { ok: false, fout: "opslag" };
  // Dubbel verstuurd (dubbelklik, opnieuw proberen): het bestaande ticket, zonder nieuwe mails.
  if (r.dubbel) return { ok: true, id: r.ticket.id };

  let bijlageNamen: string[] = [];
  if (a.items.length > 0) {
    const reg = await registreerBijlagen({
      ticketId: r.ticket.id,
      messageId: r.berichtId,
      door: "klant",
      map: klantMap(email),
      items: a.items,
    });
    if (reg.ok) bijlageNamen = reg.bijlagen.map((b) => b.naam);
    else console.error("[tickets] bijlagen bij nieuw ticket niet geregistreerd:", reg.fout);
  }

  // Basisstand (zonder 0049) bewaart soort, project, taal en systeem niet als
  // kolom: geef ze de mails toch mee, zodat taal en details kloppen.
  const mailTicket: TicketRij = {
    ...r.ticket,
    soort: r.ticket.soort ?? soort,
    project_id: r.ticket.project_id ?? project?.id ?? null,
    locale: r.ticket.locale ?? locale,
    systeem: r.ticket.systeem ?? (soort === "machine" ? systeem || null : null),
    revisie_akkoord_op:
      r.ticket.revisie_akkoord_op ?? (soort === "revisie" && akkoord ? r.ticket.created_at : null),
  };
  const projectTitel = project?.titel ?? null;
  const categorie = project?.categorie ?? null;
  const quoteId = project?.quote_id ?? null;

  after(async () => {
    let bedrijf: string | null = null;
    try {
      bedrijf = (await klantGegevens(email, quoteId)).bedrijf;
    } catch {
      bedrijf = null;
    }
    await Promise.all([
      mailStudio(mailTicket, "nieuw", { body, bijlageNamen, projectTitel, bedrijf }),
      mailKlantOntvangen(mailTicket, { categorie }),
    ]);
  });

  herlaadTicket();
  return { ok: true, id: r.ticket.id };
}

// ── Antwoorden ──────────────────────────────────────────────────────────

/**
 * Antwoord van de klant op een eigen ticket. Een gesloten ticket gaat weer
 * open als het hoogstens HEROPEN_DAGEN geleden gesloten werd, anders 'te_oud'.
 * Velden: ticket_id, body, bijlagen (JSON GeuploadBestand[]).
 */
export async function antwoordTicket(fd: FormData): Promise<ActieResultaat> {
  const email = await klantEmail();
  if (!email) return { ok: false, fout: "login" };

  const ticketId = tekst(fd, "ticket_id").trim();
  const body = bericht(fd, "body");
  if (!body) return { ok: false, fout: "leeg" };
  if (body.length > MAX_BERICHT) return { ok: false, fout: "te_lang" };

  const t = await eigenTicket(email, ticketId);
  if (!t) return { ok: false, fout: "niet_gevonden" };

  const bijl = leesBijlagen(fd);
  if ("fout" in bijl) return { ok: false, fout: bijl.fout };

  const heropent = t.status === "gesloten";
  if (heropent && !magHeropenen(t)) return { ok: false, fout: "te_oud" };

  if (bijl.items.length > 0 && !(await ticketSchema()).bijlagen) return { ok: false, fout: "migratie" };
  if ((await telBerichtenLaatsteUur(t.id, "klant")) >= MAX_BERICHTEN_PER_UUR) return { ok: false, fout: "te_veel" };

  // Laatste bericht vóór dit antwoord: was dat net nog de klant zelf, dan
  // krijgt de studio geen tweede mail (enkel bij een heropening wel).
  let vorigeKlantMs: number | null = null;
  try {
    const { data } = await getSupabaseAdmin()
      .from("ticket_messages")
      .select("sender, created_at")
      .eq("ticket_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const m = data as { sender: string; created_at: string } | null;
    if (m?.sender === "klant") vorigeKlantMs = Date.parse(m.created_at);
  } catch {
    vorigeKlantMs = null;
  }

  const r = await voegBerichtToe(t.id, "klant", body);
  if (!r.ok) return { ok: false, fout: "opslag" };

  if (heropent && !(await zetStatus(t.id, "open"))) {
    console.error("[tickets] heropenen mislukt voor", t.id);
  }

  let bijlageNamen: string[] = [];
  if (bijl.items.length > 0) {
    const reg = await registreerBijlagen({
      ticketId: t.id,
      messageId: r.berichtId,
      door: "klant",
      map: klantMap(email),
      items: bijl.items,
    });
    if (reg.ok) bijlageNamen = reg.bijlagen.map((b) => b.naam);
    else console.error("[tickets] bijlagen bij antwoord niet geregistreerd:", reg.fout);
  }

  const kortNaVorige =
    vorigeKlantMs != null && Number.isFinite(vorigeKlantMs) && Date.now() - vorigeKlantMs < STUDIO_MAIL_PAUZE_MS;
  if (heropent || !kortNaVorige) {
    const mailTicket: TicketRij = { ...t, status: "open" };
    after(async () => {
      await mailStudio(mailTicket, heropent ? "heropend" : "reactie", { body, bijlageNamen });
    });
  }

  herlaadTicket();
  return { ok: true };
}

// ── Sluiten, gelezen, downloaden ────────────────────────────────────────

/** De klant sluit zijn eigen ticket (probleem opgelost). Geen mail. */
export async function sluitTicketKlant(ticketId: string): Promise<ActieResultaat> {
  const email = await klantEmail();
  if (!email) return { ok: false, fout: "login" };
  const t = await eigenTicket(email, String(ticketId ?? ""));
  if (!t) return { ok: false, fout: "niet_gevonden" };
  if (t.status !== "gesloten" && !(await zetStatus(t.id, "gesloten"))) return { ok: false, fout: "opslag" };
  herlaadTicket();
  return { ok: true };
}

/** Markeert het ticket als gelezen door de klant (teller en bolletje verdwijnen). */
export async function markeerGelezenKlant(ticketId: string): Promise<void> {
  const email = await klantEmail();
  if (!email || !isUuid(ticketId)) return;
  if (await markeerGelezen(ticketId, "klant", email)) {
    revalidatePath("/[locale]/portail/dashboard", "layout");
  }
}

/** Tijdelijke downloadlink (10 min) voor een bijlage van een EIGEN ticket. */
export async function bijlageLinkKlant(
  bijlageId: string,
): Promise<{ ok: true; url: string } | { ok: false; fout: TicketFout }> {
  const email = await klantEmail();
  if (!email) return { ok: false, fout: "login" };
  if (!isUuid(bijlageId)) return { ok: false, fout: "niet_gevonden" };
  const b = await (async (): Promise<{ ticket_id: string; pad: string; naam: string } | null> => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("ticket_bijlagen")
        .select("ticket_id, pad, naam")
        .eq("id", bijlageId)
        .maybeSingle();
      return error ? null : ((data as { ticket_id: string; pad: string; naam: string } | null) ?? null);
    } catch {
      return null;
    }
  })();
  if (!b) return { ok: false, fout: "niet_gevonden" };
  if (!(await eigenTicket(email, b.ticket_id))) return { ok: false, fout: "niet_gevonden" };
  const url = await bijlageLink(b.pad, b.naam, 600);
  return url ? { ok: true, url } : { ok: false, fout: "opslag" };
}
