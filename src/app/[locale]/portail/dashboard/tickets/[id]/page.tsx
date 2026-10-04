import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, CheckCircle2, Clock, Cpu, FolderOpen, Info, Lock, Paperclip, Plus } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import { CATEGORIE_LABEL } from "@/lib/projecten";
import { UURTARIEF_CENT, euro, type Categorie } from "@/lib/tarieven";
import {
  HEROPEN_DAGEN,
  afgeleid,
  datumTijd,
  isUuid,
  magHeropenen,
  soortVan,
  ticketRef,
  toonOnderwerp,
  type BerichtRij,
  type BijlageRij,
  type KlantStatus,
  type TicketRij,
} from "@/lib/tickets";
import { KLANT_STATUS_LABEL, SOORT_LABEL, revisieTariefZin } from "@/lib/tickets-teksten";
import { ticketSchema } from "@/lib/tickets-server";
import { KlantAntwoord, SluitTicketKnop } from "@/components/tickets/klant-antwoord";
import { BijlageDownload } from "@/components/tickets/bijlage-download";
import { MarkeerGelezen } from "@/components/tickets/markeer-gelezen";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    terug: string;
    geopend: string;
    nieuwTitel: string;
    nieuwTekst: string;
    systeem: string;
    akkoordOp: (d: string) => string;
    gesprek: string;
    u: string;
    studio: string;
    bijlagen: string;
    antwoorden: string;
    geslotenOp: (d: string) => string;
    teOud: string;
    vervolg: string;
    vervolgOnderwerp: (ref: string) => string;
    opgelost: string;
  }
> = {
  nl: {
    terug: "Alle tickets",
    geopend: "Geopend op",
    nieuwTitel: "Uw ticket is goed ontvangen.",
    nieuwTekst: "Ik antwoord op werkdagen binnen 24 uur. U krijgt een mail zodra mijn antwoord klaarstaat.",
    systeem: "Machinesturing",
    akkoordOp: (d) => `U ging op ${d} akkoord met de facturatie van deze revisie.`,
    gesprek: "Gesprek",
    u: "U",
    studio: "Studio VM",
    bijlagen: "Bijlagen",
    antwoorden: "Antwoorden",
    geslotenOp: (d) => `Dit ticket is gesloten op ${d}.`,
    teOud: `Na ${HEROPEN_DAGEN} dagen kan een gesloten ticket niet meer heropend worden. Hebt u nog een vraag? Open dan een nieuw ticket.`,
    vervolg: "Nieuw ticket openen",
    vervolgOnderwerp: (ref) => `Vervolg op ${ref}`,
    opgelost: "Is uw vraag beantwoord? Dan kunt u het ticket zelf sluiten.",
  },
  fr: {
    terug: "Tous les tickets",
    geopend: "Ouvert le",
    nieuwTitel: "Votre ticket a bien été reçu.",
    nieuwTekst: "Je réponds sous 24 heures les jours ouvrables. Vous recevrez un e-mail dès que ma réponse sera disponible.",
    systeem: "Système de guidage",
    akkoordOp: (d) => `Vous avez accepté la facturation de cette révision le ${d}.`,
    gesprek: "Conversation",
    u: "Vous",
    studio: "Studio VM",
    bijlagen: "Pièces jointes",
    antwoorden: "Répondre",
    geslotenOp: (d) => `Ce ticket a été fermé le ${d}.`,
    teOud: `Après ${HEROPEN_DAGEN} jours, un ticket fermé ne peut plus être rouvert. Vous avez encore une question ? Veuillez ouvrir un nouveau ticket.`,
    vervolg: "Ouvrir un nouveau ticket",
    vervolgOnderwerp: (ref) => `Suite de ${ref}`,
    opgelost: "Votre question a reçu une réponse ? Vous pouvez fermer le ticket vous-même.",
  },
  en: {
    terug: "All tickets",
    geopend: "Opened on",
    nieuwTitel: "Your ticket has been received.",
    nieuwTekst: "I reply within 24 hours on working days. You will receive an email as soon as my reply is ready.",
    systeem: "Machine control system",
    akkoordOp: (d) => `You agreed to this revision being invoiced on ${d}.`,
    gesprek: "Conversation",
    u: "You",
    studio: "Studio VM",
    bijlagen: "Attachments",
    antwoorden: "Reply",
    geslotenOp: (d) => `This ticket was closed on ${d}.`,
    teOud: `After ${HEROPEN_DAGEN} days, a closed ticket can no longer be reopened. Do you have another question? Please open a new ticket.`,
    vervolg: "Open a new ticket",
    vervolgOnderwerp: (ref) => `Follow-up to ${ref}`,
    opgelost: "Has your question been answered? You can close the ticket yourself.",
  },
  de: {
    terug: "Alle Tickets",
    geopend: "Eröffnet am",
    nieuwTitel: "Ihr Ticket ist eingegangen.",
    nieuwTekst: "Ich antworte an Werktagen innerhalb von 24 Stunden. Sie erhalten eine E-Mail, sobald meine Antwort bereitsteht.",
    systeem: "Maschinensteuerung",
    akkoordOp: (d) => `Sie haben der Abrechnung dieser Revision am ${d} zugestimmt.`,
    gesprek: "Verlauf",
    u: "Sie",
    studio: "Studio VM",
    bijlagen: "Anhänge",
    antwoorden: "Antworten",
    geslotenOp: (d) => `Dieses Ticket wurde am ${d} geschlossen.`,
    teOud: `Nach ${HEROPEN_DAGEN} Tagen kann ein geschlossenes Ticket nicht mehr geöffnet werden. Haben Sie noch eine Frage? Dann eröffnen Sie bitte ein neues Ticket.`,
    vervolg: "Neues Ticket eröffnen",
    vervolgOnderwerp: (ref) => `Fortsetzung von ${ref}`,
    opgelost: "Wurde Ihre Frage beantwortet? Dann können Sie das Ticket selbst schließen.",
  },
  es: {
    terug: "Todos los tickets",
    geopend: "Abierto el",
    nieuwTitel: "Su ticket se ha recibido correctamente.",
    nieuwTekst: "Respondo en un plazo de 24 horas en días laborables. Recibirá un correo en cuanto mi respuesta esté lista.",
    systeem: "Sistema de control de máquina",
    akkoordOp: (d) => `Aceptó la facturación de esta revisión el ${d}.`,
    gesprek: "Conversación",
    u: "Usted",
    studio: "Studio VM",
    bijlagen: "Archivos adjuntos",
    antwoorden: "Responder",
    geslotenOp: (d) => `Este ticket se cerró el ${d}.`,
    teOud: `Pasados ${HEROPEN_DAGEN} días, un ticket cerrado ya no se puede reabrir. ¿Tiene otra pregunta? Abra un nuevo ticket.`,
    vervolg: "Abrir un nuevo ticket",
    vervolgOnderwerp: (ref) => `Continuación de ${ref}`,
    opgelost: "¿Se ha respondido a su pregunta? Puede cerrar el ticket usted mismo.",
  },
};

const STATUS_KLEUR: Record<KlantStatus, string> = {
  wacht_op_studio: "border-amber-400 bg-amber-200 text-amber-950",
  antwoord_ontvangen: "border-emerald-500 bg-emerald-300 text-emerald-950",
  gesloten: "border-border bg-card text-muted",
};

/** Ticket via de KLANT-sessie: RLS toont enkel eigen tickets (ook voor generateMetadata, één vraag per verzoek). */
const laadEigenTicket = cache(async (id: string): Promise<TicketRij | null> => {
  if (!supabaseConfigured || !isUuid(id)) return null;
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb.from("tickets").select("*").eq("id", id).maybeSingle();
    return (data as TicketRij | null) ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return {};
  const t = await laadEigenTicket(id);
  const support = PORTAL_T[locale].tickets;
  return { title: { absolute: t ? `${ticketRef(t)} · ${support} — Studio VM` : `${support} — Studio VM` } };
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ nieuw?: string | string[] }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!isUuid(id)) notFound();
  if (!supabaseConfigured) return null;
  const sp = await searchParams;
  const isNieuw = (Array.isArray(sp.nieuw) ? sp.nieuw[0] : sp.nieuw) === "1";
  const l = L[locale];

  const t = await laadEigenTicket(id);
  if (!t || soortVan(t) === "intern") notFound();

  const sb = await getSupabaseServer();
  const schema = await ticketSchema();
  const [msgRes, bijlRes, projRes] = await Promise.all([
    sb.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true }).limit(1000),
    schema.bijlagen
      ? sb.from("ticket_bijlagen").select("*").eq("ticket_id", id).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as BijlageRij[], error: null }),
    isUuid(t.project_id)
      ? sb.from("projecten").select("id, titel, categorie").eq("id", t.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const berichten = (msgRes.data as BerichtRij[] | null) ?? [];
  const bijlagen = bijlRes.error ? [] : ((bijlRes.data as BijlageRij[] | null) ?? []);
  const project = projRes.data as { id: string; titel: string; categorie: Categorie } | null;

  const a = afgeleid(t, berichten);
  const status: KlantStatus = a.gesloten ? "gesloten" : a.wachtOp === "klant" ? "antwoord_ontvangen" : "wacht_op_studio";
  const soort = soortVan(t);
  const ref = ticketRef(t);
  const kanHeropenen = a.gesloten && magHeropenen(t);
  const bijlagenAan = schema.bijlagen;
  // '?nieuw=1' blijft in het adres staan; na een antwoord, sluiten of heropenen
  // (de pagina ververst enkel) hoort de ontvangstmelding niet meer.
  const toonOntvangen = isNieuw && !a.gesloten && berichten.length <= 1;

  const perBericht = new Map<string, BijlageRij[]>();
  const los: BijlageRij[] = [];
  const berichtIds = new Set(berichten.map((m) => m.id));
  for (const b of bijlagen) {
    if (b.message_id && berichtIds.has(b.message_id)) {
      const lijst = perBericht.get(b.message_id);
      if (lijst) lijst.push(b);
      else perBericht.set(b.message_id, [b]);
    } else los.push(b);
  }

  const tarief =
    soort === "revisie" && project && UURTARIEF_CENT[project.categorie]
      ? revisieTariefZin(locale, euro(UURTARIEF_CENT[project.categorie], locale), CATEGORIE_LABEL[project.categorie][locale])
      : null;
  const vervolgHref = localePath(
    locale,
    `/portail/dashboard/tickets/nieuw?${new URLSearchParams({
      ...(project ? { project: project.id } : {}),
      onderwerp: l.vervolgOnderwerp(ref),
    }).toString()}`,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {a.klantOngelezen && <MarkeerGelezen ticketId={t.id} />}

      <Link
        href={localePath(locale, "/portail/dashboard/tickets")}
        className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        {l.terug}
      </Link>

      {toonOntvangen && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-500 bg-emerald-300 p-4 text-emerald-950"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold">
              {l.nieuwTitel} <span className="font-mono text-sm">{ref}</span>
            </p>
            <p className="mt-0.5 text-sm">{l.nieuwTekst}</p>
          </div>
        </div>
      )}

      <header className="space-y-3">
        <p className="font-mono text-xs text-muted">{ref}</p>
        <h1 className="break-words text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">{toonOnderwerp(t)}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-0.5 font-medium ${STATUS_KLEUR[status]}`}>
            {KLANT_STATUS_LABEL[status][locale]}
          </span>
          <span className="rounded-full border px-2.5 py-0.5">{SOORT_LABEL[soort][locale]}</span>
          {project && (
            <Link
              href={localePath(locale, `/portail/dashboard/projecten/${project.id}`)}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <FolderOpen className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate">{project.titel}</span>
            </Link>
          )}
          {t.systeem && (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-muted">
              <Cpu className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              <span className="sr-only">{l.systeem}: </span>
              <span className="truncate">{t.systeem}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            {l.geopend} <time dateTime={t.created_at}>{datumTijd(t.created_at, locale)}</time>
          </span>
        </div>
      </header>

      {tarief && (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 text-sm leading-relaxed">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p>{tarief}</p>
            {t.revisie_akkoord_op && (
              <p className="mt-1 text-muted">{l.akkoordOp(datumTijd(t.revisie_akkoord_op, locale))}</p>
            )}
          </div>
        </div>
      )}

      <section aria-labelledby="gesprek-titel">
        <h2 id="gesprek-titel" className="sr-only">
          {l.gesprek}
        </h2>
        <ol className="space-y-4">
          {berichten.map((m) => {
            const studio = m.sender === "studio";
            const eigen = perBericht.get(m.id) ?? [];
            return (
              <li key={m.id} className={`flex items-start gap-2 sm:gap-3 ${studio ? "" : "flex-row-reverse"}`}>
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    studio ? "bg-accent text-background" : "bg-foreground/10 text-foreground"
                  }`}
                >
                  {studio ? "VM" : l.u.slice(0, 1)}
                </span>
                <div
                  className={`min-w-0 max-w-full rounded-2xl px-4 py-3 sm:max-w-[85%] ${
                    studio ? "border border-accent/30 bg-accent/10" : "border bg-card"
                  }`}
                >
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-semibold">{studio ? l.studio : l.u}</span>
                    <time dateTime={m.created_at} className="font-mono text-muted">
                      {datumTijd(m.created_at, locale)}
                    </time>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed wrap-anywhere">{m.body}</p>
                  {eigen.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label={l.bijlagen}>
                      {eigen.map((b) => (
                        <li key={b.id} className="min-w-0 max-w-full">
                          <BijlageDownload locale={locale} id={b.id} naam={b.naam} grootte={b.grootte} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {los.length > 0 && (
          <div className="mt-5 rounded-2xl border bg-card p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="h-4 w-4 text-accent" strokeWidth={2} aria-hidden />
              {l.bijlagen}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {los.map((b) => (
                <li key={b.id} className="min-w-0 max-w-full">
                  <BijlageDownload locale={locale} id={b.id} naam={b.naam} grootte={b.grootte} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {!a.gesloten || kanHeropenen ? (
        <section aria-labelledby="antwoord-titel" className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
          <h2 id="antwoord-titel" className="font-semibold tracking-tight">
            {l.antwoorden}
          </h2>
          {a.gesloten && (
            <p className="flex items-start gap-2 text-sm text-muted">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>
                {l.geslotenOp(datumTijd(t.gesloten_op ?? t.updated_at, locale))}
              </span>
            </p>
          )}
          <KlantAntwoord locale={locale} ticketId={t.id} heropent={a.gesloten} bijlagenAan={bijlagenAan} />
        </section>
      ) : (
        <div className="space-y-3 rounded-2xl border border-dashed bg-card/40 p-5 text-sm">
          <p className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={2} aria-hidden />
            <span>
              {l.geslotenOp(datumTijd(t.gesloten_op ?? t.updated_at, locale))} {l.teOud}
            </span>
          </p>
          <Link
            href={vervolgHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {l.vervolg}
          </Link>
        </div>
      )}

      {!a.gesloten && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="min-w-0 text-sm text-muted">{l.opgelost}</p>
          <SluitTicketKnop locale={locale} ticketId={t.id} />
        </div>
      )}
    </div>
  );
}
