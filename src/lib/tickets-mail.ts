import "server-only";
// Mails rond tickets, in de lichte huisstijl (portalEmailHtml).
//
// Klant: in de taal van het ticket (ticketTaal), onderwerp met het
// ticketnummer, knop rechtstreeks naar het ticket in het portaal (via de
// login met ?next=), replyTo = de inbox van Studio VM. De mails zelf worden
// gebouwd in src/lib/klant-mails.ts (puur, ook gebruikt door de mail-preview).
// Studio: in het Nederlands naar studioInbox(), knop 'Open ticket' naar de
// admin, GEEN replyTo (antwoorden gebeurt in de admin, zodat de klant het in
// zijn portaal ziet).
//
// Alle tekst van de klant gaat door esc() of tekstNaarHtml(). Elke functie
// geeft true/false terug, gooit nooit en logt wat niet vertrok (lokaal zonder
// RESEND_API_KEY wordt er enkel gelogd).

import { sendMail } from "@/lib/monitor";
import { portalEmailHtml, siteLink } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { type Categorie } from "@/lib/tarieven";
import { LOCALE_NAMES, type Locale } from "@/lib/i18n/config";
import { esc, isUuid, soortVan, tekstNaarHtml, ticketRef, toonOnderwerp, type TicketRij } from "@/lib/tickets";
import { SOORT_LABEL, STUDIO_MAIL, type StudioGebeurtenis } from "@/lib/tickets-teksten";
import {
  alineaHtml,
  citaatHtml,
  revisieFactuurMail,
  ticketAntwoordMail,
  ticketGeslotenMail,
  ticketOntvangenMail,
  type KlantMail,
} from "@/lib/klant-mails";
import { studioInbox, ticketTaal } from "@/lib/tickets-server";
import { betaalLink } from "@/lib/facturatie/online-betalen";

/** Een ticket of een deel ervan: id, e-mail en onderwerp zijn genoeg. */
type MailTicket = Pick<TicketRij, "id" | "client_email" | "subject"> & Partial<TicketRij>;

async function verstuur(
  naar: string,
  onderwerp: string,
  html: string,
  replyTo: string | undefined,
  label: string,
): Promise<boolean> {
  try {
    const ok = await sendMail(naar, { subject: onderwerp, html, ...(replyTo ? { replyTo } : {}) });
    if (!ok) console.info(`[tickets] mail niet verstuurd (geen RESEND_API_KEY of fout) — ${label} → ${naar}: ${onderwerp}`);
    return ok;
  } catch (e) {
    console.error(`[tickets] mail mislukt — ${label} → ${naar}:`, e);
    return false;
  }
}

async function projectVan(id: string | null | undefined): Promise<{ titel: string; categorie: Categorie } | null> {
  if (!isUuid(id)) return null;
  try {
    const { data } = await getSupabaseAdmin().from("projecten").select("titel, categorie").eq("id", id).maybeSingle();
    return (data as { titel: string; categorie: Categorie } | null) ?? null;
  } catch {
    return null;
  }
}

/** Taal van het ticket opzoeken, de mail bouwen en versturen naar de klant. */
async function mailKlant(
  t: MailTicket,
  label: string,
  bouw: (taal: Locale, replyTo: string) => KlantMail,
): Promise<boolean> {
  try {
    const email = String(t.client_email ?? "").trim().toLowerCase();
    if (!email) return false;
    const taal = await ticketTaal(t);
    const m = bouw(taal, await studioInbox());
    return await verstuur(email, m.subject, m.html, m.replyTo, label);
  } catch (e) {
    console.error(`[tickets] mail mislukt — ${label}:`, e);
    return false;
  }
}

/** Ontvangstbevestiging aan de klant (met de 24-u-belofte; bij een revisie ook het tarief). */
export async function mailKlantOntvangen(t: MailTicket, extra?: { categorie?: Categorie | null }): Promise<boolean> {
  const revisie = soortVan(t) === "revisie";
  const project = revisie && !extra?.categorie ? await projectVan(t.project_id) : null;
  const categorie = extra?.categorie ?? project?.categorie ?? null;
  return mailKlant(t, "ontvangen", (taal, replyTo) => ticketOntvangenMail(taal, t, { categorie }, replyTo));
}

/** Antwoord van de studio aan de klant, met de VOLLEDIGE tekst (regeleinden blijven). */
export async function mailKlantAntwoord(
  t: MailTicket,
  body: string,
  bijlageNamen: string[] = [],
  opts?: { gesloten?: boolean },
): Promise<boolean> {
  return mailKlant(t, "antwoord", (taal, replyTo) =>
    ticketAntwoordMail(taal, t, { body, bijlageNamen, gesloten: opts?.gesloten }, replyTo),
  );
}

/** Ticket gesloten (door de studio of automatisch na stilte van de klant). */
export async function mailKlantGesloten(t: MailTicket, opts: { automatisch: boolean }): Promise<boolean> {
  return mailKlant(t, opts?.automatisch ? "automatisch gesloten" : "gesloten", (taal, replyTo) =>
    ticketGeslotenMail(taal, t, { automatisch: !!opts?.automatisch }, replyTo),
  );
}

/** Aparte revisiefactuur staat klaar; knop naar de facturen in het portaal. */
export async function mailKlantRevisieFactuur(a: {
  t: MailTicket;
  nummer: string;
  titel: string;
  /** Bedrag excl. btw (uren × tarief). */
  bedragExclCent: number;
  /** Btw verlegd (zoals op de offerte van het project). */
  verlegd: boolean;
  uren: number;
  dueAt: string;
  /** public_token van de factuur: knop "Online betalen" zonder aanmelden. */
  token?: string | null;
}): Promise<boolean> {
  return mailKlant(a.t, "revisiefactuur", (taal, replyTo) =>
    revisieFactuurMail(
      taal,
      a.t,
      {
        nummer: a.nummer,
        titel: a.titel,
        bedragExclCent: Math.round(a.bedragExclCent),
        verlegd: a.verlegd,
        uren: a.uren,
        dueAt: a.dueAt,
        betaalHref: betaalLink(taal, a.token),
      },
      replyTo,
    ),
  );
}

/** Melding aan Studio VM (Nederlands): nieuw ticket, reactie of heropend. */
export async function mailStudio(
  t: MailTicket,
  gebeurtenis: StudioGebeurtenis,
  info: { body: string; bijlageNamen?: string[]; projectTitel?: string | null; bedrijf?: string | null },
): Promise<boolean> {
  try {
    const email = String(t.client_email ?? "").trim().toLowerCase();
    const ref = ticketRef(t);
    const soort = soortVan(t);
    const soortLabel = SOORT_LABEL[soort].nl;
    const onderwerp = STUDIO_MAIL.onderwerp(ref, soortLabel, toonOnderwerp(t), email);
    const projectTitel = info?.projectTitel ?? (await projectVan(t.project_id))?.titel ?? null;
    const wie = info?.bedrijf ? `${esc(info.bedrijf)} (${esc(email)})` : esc(email);

    const regels = [STUDIO_MAIL.l1(gebeurtenis, wie, esc(toonOnderwerp(t)))];
    const details = [
      STUDIO_MAIL.soort(esc(soortLabel)),
      projectTitel ? STUDIO_MAIL.project(esc(projectTitel)) : "",
      t.systeem ? STUDIO_MAIL.systeem(esc(t.systeem)) : "",
      t.locale && t.locale in LOCALE_NAMES ? STUDIO_MAIL.taal(esc(LOCALE_NAMES[t.locale as Locale])) : "",
      soort === "revisie" && t.revisie_akkoord_op ? STUDIO_MAIL.akkoord : "",
    ].filter(Boolean);
    const namen = (info?.bijlageNamen ?? []).filter(Boolean).map((n) => esc(n));
    const extra = [
      citaatHtml(tekstNaarHtml(info?.body ?? "")),
      namen.length ? alineaHtml(STUDIO_MAIL.bijlagen(namen), true) : "",
      details.length ? alineaHtml(details.join("<br>"), true) : "",
      alineaHtml(STUDIO_MAIL.viaAdmin, true),
    ].join("");

    const html = portalEmailHtml({
      locale: "nl",
      eyebrow: STUDIO_MAIL.eyebrow,
      title: esc(STUDIO_MAIL.titel(gebeurtenis, ref)),
      bodyLines: regels,
      extraHtml: extra,
      ctaLabel: STUDIO_MAIL.cta,
      ctaHref: siteLink(`/admin/tickets/${t.id}`),
    });
    // Bewust geen replyTo: antwoorden via de admin, zodat het bij het ticket staat.
    return await verstuur(await studioInbox(), onderwerp, html, undefined, `studio ${gebeurtenis}`);
  } catch (e) {
    console.error("[tickets] studiomail mislukt:", e);
    return false;
  }
}
