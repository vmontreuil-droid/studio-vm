import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Crosshair, Cpu, FileText, Package, Receipt, MessageSquareWarning, Check, CreditCard, ExternalLink, ShieldAlert, ChevronRight, Clock } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  STAPPEN,
  STATUS_LABEL,
  CATEGORIE_LABEL,
  werfTekst,
  grootteTekst,
  perVersie,
  statusKleur,
  type Project,
  type Levering,
} from "@/lib/projecten";
import { eur, dt } from "@/lib/portal-shared";
import { isBetaald } from "@/lib/projecten-server";
import { UURTARIEF_CENT, euro } from "@/lib/tarieven";
import {
  REVISIE_PROJECTSTATUS,
  afgeleid,
  datumTijd,
  klantStatus,
  soortVan,
  ticketRef,
  toonOnderwerp,
  type BerichtKern,
  type KlantStatus,
  type TicketRij,
} from "@/lib/tickets";
import { KLANT_STATUS_LABEL, SOORT_LABEL, revisieTariefZin } from "@/lib/tickets-teksten";
import { ticketSchema } from "@/lib/tickets-server";
import { payInvoice } from "@/app/actions/portal-client";
import { LeveringKnop, PlanKnop } from "@/components/project-acties";
import { NieuwTicketFormulier } from "@/components/tickets/nieuw-ticket-formulier";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const T: Record<Locale, Record<string, string>> = {
  nl: {
    terug: "Projecten", werf: "Werf", stelsel: "Coördinatenstelsel", hoogte: "Hoogte", systemen: "Machinesturingen", categorie: "Categorie", ingediend: "Ingediend op",
    plannen: "Uw plannen", geenPlannen: "Geen plannen opgeladen.", offerte: "Offerte & betaling", geenOfferte: "U ontvangt hier uw offerte zodra ik uw plannen bekeken heb.",
    bekijkOfferte: "Offerte bekijken", factuur: "Factuur", betaal: "Betaal via Mollie", betaald: "Betaald", uren: "Geschat aantal uren", inclBtw: "incl. 21 % btw", btwVerlegd: "btw verlegd (0 %)",
    leveringen: "Modelbestanden", geenLeveringen: "Hier verschijnen de modelbestanden per machinesturing zodra ze klaar zijn.", versie: "Versie", slotUitleg: "De bestanden worden vrijgegeven zodra de factuur betaald is.",
    revisie: "Revisie of vraag", revisieUitleg: "Is er iets aan te passen of hebt u een vraag over dit model? Open hieronder een ticket: ik antwoord op werkdagen binnen 24 uur.",
    tickets: "Tickets over dit project", alleTickets: "Alle tickets", nieuw: "Nieuwe vraag of revisie", ongelezen: "Nieuw antwoord", laatste: "Laatste bericht",
    verantw: "Controleer het model vóór de start op een gekend punt, in ligging én hoogte. Werking en kalibratie van uw machinesturing blijven uw verantwoordelijkheid.",
    kaart: "Kaart",
  },
  fr: {
    terug: "Projets", werf: "Chantier", stelsel: "Système de coordonnées", hoogte: "Altitude", systemen: "Systèmes de guidage", categorie: "Catégorie", ingediend: "Introduit le",
    plannen: "Vos plans", geenPlannen: "Aucun plan chargé.", offerte: "Devis & paiement", geenOfferte: "Vous recevrez ici votre devis dès que j'aurai examiné vos plans.",
    bekijkOfferte: "Voir le devis", factuur: "Facture", betaal: "Payer via Mollie", betaald: "Payée", uren: "Nombre d'heures estimé", inclBtw: "TVA 21 % comprise", btwVerlegd: "TVA autoliquidée (0 %)",
    leveringen: "Fichiers du modèle", geenLeveringen: "Les fichiers par système de guidage apparaîtront ici dès qu'ils seront prêts.", versie: "Version", slotUitleg: "Les fichiers sont mis à disposition dès que la facture est payée.",
    revisie: "Révision ou question", revisieUitleg: "Quelque chose à adapter ou une question sur ce modèle ? Ouvrez un ticket ci-dessous : je réponds sous 24 heures les jours ouvrables.",
    tickets: "Tickets de ce projet", alleTickets: "Tous les tickets", nieuw: "Nouvelle question ou révision", ongelezen: "Nouvelle réponse", laatste: "Dernier message",
    verantw: "Vérifiez le modèle avant de commencer sur un point connu, en position et en altitude. Le fonctionnement et la calibration de votre guidage restent sous votre responsabilité.",
    kaart: "Carte",
  },
  en: {
    terug: "Projects", werf: "Site", stelsel: "Coordinate system", hoogte: "Height", systemen: "Machine control systems", categorie: "Category", ingediend: "Submitted on",
    plannen: "Your plans", geenPlannen: "No plans uploaded.", offerte: "Quote & payment", geenOfferte: "Your quote will appear here once I've reviewed your plans.",
    bekijkOfferte: "View quote", factuur: "Invoice", betaal: "Pay via Mollie", betaald: "Paid", uren: "Estimated hours", inclBtw: "incl. 21% VAT", btwVerlegd: "VAT reverse-charged (0%)",
    leveringen: "Model files", geenLeveringen: "The model files per machine control system will appear here once they're ready.", versie: "Version", slotUitleg: "Files are released once the invoice is paid.",
    revisie: "Revision or question", revisieUitleg: "Anything to change or a question about this model? Open a ticket below: I reply within 24 hours on working days.",
    tickets: "Tickets for this project", alleTickets: "All tickets", nieuw: "New question or revision", ongelezen: "New reply", laatste: "Last message",
    verantw: "Check the model on a known point before you start, in position and height. Operation and calibration of your machine control remain your responsibility.",
    kaart: "Map",
  },
  de: {
    terug: "Projekte", werf: "Baustelle", stelsel: "Koordinatensystem", hoogte: "Höhe", systemen: "Maschinensteuerungen", categorie: "Kategorie", ingediend: "Eingereicht am",
    plannen: "Ihre Pläne", geenPlannen: "Keine Pläne hochgeladen.", offerte: "Angebot & Zahlung", geenOfferte: "Ihr Angebot erscheint hier, sobald ich Ihre Pläne geprüft habe.",
    bekijkOfferte: "Angebot ansehen", factuur: "Rechnung", betaal: "Über Mollie bezahlen", betaald: "Bezahlt", uren: "Geschätzte Stundenzahl", inclBtw: "inkl. 21 % MwSt.", btwVerlegd: "Reverse-Charge (0 % MwSt.)",
    leveringen: "Modelldateien", geenLeveringen: "Die Modelldateien pro Maschinensteuerung erscheinen hier, sobald sie fertig sind.", versie: "Version", slotUitleg: "Die Dateien werden freigegeben, sobald die Rechnung bezahlt ist.",
    revisie: "Revision oder Frage", revisieUitleg: "Muss etwas angepasst werden oder haben Sie eine Frage zu diesem Modell? Eröffnen Sie unten ein Ticket: Ich antworte an Werktagen innerhalb von 24 Stunden.",
    tickets: "Tickets zu diesem Projekt", alleTickets: "Alle Tickets", nieuw: "Neue Frage oder Revision", ongelezen: "Neue Antwort", laatste: "Letzte Nachricht",
    verantw: "Prüfen Sie das Modell vor Beginn an einem bekannten Punkt, in Lage und Höhe. Betrieb und Kalibrierung Ihrer Maschinensteuerung bleiben in Ihrer Verantwortung.",
    kaart: "Karte",
  },
  es: {
    terug: "Proyectos", werf: "Obra", stelsel: "Sistema de coordenadas", hoogte: "Altura", systemen: "Sistemas de control de máquina", categorie: "Categoría", ingediend: "Enviado el",
    plannen: "Sus planos", geenPlannen: "No se han subido planos.", offerte: "Presupuesto y pago", geenOfferte: "Su presupuesto aparecerá aquí en cuanto haya revisado sus planos.",
    bekijkOfferte: "Ver presupuesto", factuur: "Factura", betaal: "Pagar con Mollie", betaald: "Pagada", uren: "Número estimado de horas", inclBtw: "IVA del 21 % incluido", btwVerlegd: "inversión del sujeto pasivo (0 % IVA)",
    leveringen: "Archivos del modelo", geenLeveringen: "Los archivos del modelo por sistema de control de máquina aparecerán aquí en cuanto estén listos.", versie: "Versión", slotUitleg: "Los archivos se liberan en cuanto se paga la factura.",
    revisie: "Revisión o pregunta", revisieUitleg: "¿Hay algo que modificar o tiene alguna pregunta sobre este modelo? Abra un ticket a continuación: respondo en un plazo de 24 horas en días laborables.",
    tickets: "Tickets de este proyecto", alleTickets: "Todos los tickets", nieuw: "Nueva pregunta o revisión", ongelezen: "Nueva respuesta", laatste: "Último mensaje",
    verantw: "Compruebe el modelo antes de empezar en un punto conocido, en planimetría y en altura. El funcionamiento y la calibración de su sistema de control de máquina siguen siendo responsabilidad suya.",
    kaart: "Mapa",
  },
};

// vat_reverse op de factuur bestaat pas na migratie 0049 (daarom select "*").
type Factuur = { id: string; number: string; amount_cents: number; status: string; due_at: string | null; vat_reverse?: boolean | null };
type Offerte = { id: string; status: string; amount_cents: number; offer_no: string | null; vat_reverse: boolean | null };

// Zelfde kleuren als de Support-lijst.
const STATUS_KLEUR: Record<KlantStatus, string> = {
  wacht_op_studio: "border-amber-400 bg-amber-200 text-amber-950",
  antwoord_ontvangen: "border-emerald-500 bg-emerald-300 text-emerald-950",
  gesloten: "border-border bg-card text-muted",
};
const MAX_TICKETS_GETOOND = 10;

/**
 * De tickets van dit project, via de sessie van de klant (RLS: enkel de
 * eigen tickets). Met migratie 0049 via project_id; zonder (kolom ontbreekt)
 * op de projecttitel in het onderwerp, zoals oude revisies ('Revisie — titel').
 * In de basisstand komt de toestand uit het laatste bericht per ticket.
 */
async function projectTickets(
  sb: Awaited<ReturnType<typeof getSupabaseServer>>,
  projectId: string,
  titel: string,
): Promise<{ tickets: TicketRij[]; berichten: BerichtKern[] }> {
  const leeg = { tickets: [], berichten: [] };
  let rijen: TicketRij[] | null = null;
  if ((await ticketSchema()).v2) {
    const { data, error } = await sb
      .from("tickets")
      .select("*")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (!error) rijen = (data as TicketRij[] | null) ?? [];
  }
  if (!rijen) {
    rijen = await ticketsOpTitel(sb, projectId, titel);
    if (!rijen) return leeg;
  }
  const tickets = rijen.filter((tk) => soortVan(tk) !== "intern");
  if (tickets.length === 0) return leeg;
  if (tickets.every((tk) => tk.wacht_op === "klant" || tk.wacht_op === "studio")) return { tickets, berichten: [] };

  const { data: msgs } = await sb
    .from("ticket_messages")
    .select("ticket_id, sender, created_at")
    .in(
      "ticket_id",
      tickets.map((tk) => tk.id),
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  return { tickets, berichten: (msgs as BerichtKern[] | null) ?? [] };
}

/**
 * Basisstand (vóór 0049, geen project_id): tickets met de projecttitel in het
 * onderwerp. Jokertekens uit de titel worden één willekeurig teken ('_'), zodat
 * de titel zichzelf nog vindt. Een ticket dat ook de langere titel van een
 * ander eigen project bevat ('Brug 2' bij project 'Brug') hoort bij dat project.
 */
async function ticketsOpTitel(
  sb: Awaited<ReturnType<typeof getSupabaseServer>>,
  projectId: string,
  titel: string,
): Promise<TicketRij[] | null> {
  const schoon = titel.replace(/\s+/g, " ").trim();
  if (!schoon) return null;
  const zoek = schoon.replace(/[%_*\\]/g, "_");
  const [{ data, error }, { data: eigen }] = await Promise.all([
    sb
      .from("tickets")
      .select("*")
      .ilike("subject", `%${zoek}%`)
      .order("updated_at", { ascending: false })
      .limit(50),
    sb.from("projecten").select("id, titel"),
  ]);
  if (error) return null;
  const klein = schoon.toLowerCase();
  const langer = ((eigen as { id: string; titel: string | null }[] | null) ?? [])
    .filter((o) => o.id !== projectId)
    .map((o) => (o.titel ?? "").replace(/\s+/g, " ").trim().toLowerCase())
    .filter((o) => o.length > klein.length && o.includes(klein));
  return ((data as TicketRij[] | null) ?? []).filter((tk) => {
    const onderwerp = String(tk.subject ?? "").replace(/\s+/g, " ").toLowerCase();
    return !langer.some((o) => onderwerp.includes(o));
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const sb = await getSupabaseServer();
  const { data } = await sb.from("projecten").select("*").eq("id", id).maybeSingle();
  const p = data as Project | null;
  if (!p) notFound();

  const [{ data: lev }, offerRes, invRes, tk, schema] = await Promise.all([
    sb.from("leveringen").select("*").eq("project_id", id).order("versie", { ascending: false }),
    p.offer_id ? sb.from("offers").select("id, status, amount_cents, offer_no, vat_reverse").eq("id", p.offer_id).maybeSingle() : Promise.resolve({ data: null }),
    p.invoice_id ? sb.from("invoices").select("*").eq("id", p.invoice_id).maybeSingle() : Promise.resolve({ data: null }),
    projectTickets(sb, p.id, p.titel ?? ""),
    ticketSchema(),
  ]);
  const tarief = UURTARIEF_CENT[p.categorie];
  const tariefZin = tarief ? revisieTariefZin(locale, euro(tarief, locale), CATEGORIE_LABEL[p.categorie][locale]) : null;
  const leveringen = (lev as Levering[] | null) ?? [];
  const offerte = offerRes.data as Offerte | null;
  const factuur = invRes.data as Factuur | null;
  // amount_cents van een projectfactuur is excl. btw; Mollie rekent het
  // bedrag incl. btw aan (payInvoice): toon dus wat de klant betaalt.
  const factuurVerlegd =
    typeof factuur?.vat_reverse === "boolean" ? factuur.vat_reverse : !!offerte?.vat_reverse;
  const factuurIncl = factuur
    ? factuur.amount_cents + (factuurVerlegd ? 0 : Math.round(factuur.amount_cents * 0.21))
    : 0;
  const betaald = await isBetaald(p);
  const stapIndex = STAPPEN.indexOf(p.status);
  const kaart = p.werf?.lat ? `https://www.openstreetmap.org/?mlat=${p.werf.lat}&mlon=${p.werf.lon}#map=17/${p.werf.lat}/${p.werf.lon}` : null;

  return (
    <div className="space-y-8">
      <Link href={localePath(locale, "/portail/dashboard/projecten")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {t.terug}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.titel}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.ingediend} {dt(p.created_at, locale)} · {t.categorie}: {CATEGORIE_LABEL[p.categorie][locale]}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusKleur(p.status)}`}>{STATUS_LABEL[p.status][locale]}</span>
      </header>

      {p.status !== "geannuleerd" && (
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAPPEN.map((s, i) => {
            const klaar = i <= stapIndex;
            return (
              <li key={s} className={`rounded-xl border p-3 text-xs ${klaar ? "border-accent/40 bg-accent/5" : "opacity-60"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${klaar ? "bg-accent text-white" : "border"}`}>
                  {klaar ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                </span>
                <span className="mt-2 block font-medium leading-tight">{STATUS_LABEL[s][locale]}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Blok icoon={Package} titel={t.leveringen}>
            {leveringen.length === 0 ? (
              <p className="text-sm text-muted">{t.geenLeveringen}</p>
            ) : (
              <div className="space-y-5">
                {!betaald && <p className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">{t.slotUitleg}</p>}
                {perVersie(leveringen).map((v) => (
                  <div key={v.versie}>
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
                      {t.versie} {v.versie} · {dt(v.items[0].created_at, locale)}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {v.items.map((l) => (
                        <LeveringKnop key={l.id} id={l.id} naam={l.naam} systeem={l.systeem} grootte={grootteTekst(l.grootte)} betaald={betaald} locale={locale} />
                      ))}
                    </div>
                    {v.items[0].opmerking && <p className="mt-2 text-sm text-muted">{v.items[0].opmerking}</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 flex gap-2 border-t pt-4 text-xs leading-relaxed text-muted">
              <ShieldAlert className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
              {t.verantw}
            </p>
          </Blok>
        </div>

        <div className="space-y-6">
          <Blok icoon={Receipt} titel={t.offerte}>
            {!offerte && !factuur ? (
              <p className="text-sm text-muted">{t.geenOfferte}</p>
            ) : (
              <div className="space-y-4 text-sm">
                {p.geschatte_uren != null && (
                  <Rij k={t.uren} v={`${Number(p.geschatte_uren).toLocaleString(locale)} u`} />
                )}
                {offerte && (
                  <Link href={localePath(locale, "/portail/dashboard/offertes")} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                    {t.bekijkOfferte} {offerte.offer_no ? `(${offerte.offer_no})` : ""}
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                )}
                {factuur && (
                  <div className="rounded-xl border p-4">
                    <Rij k={`${t.factuur} ${factuur.number}`} v={eur(factuurIncl)} />
                    <p className="mt-0.5 text-right text-xs text-muted">{factuurVerlegd ? t.btwVerlegd : t.inclBtw}</p>
                    {betaald ? (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-emerald-500">
                        <Check className="h-4 w-4" strokeWidth={2} />
                        {t.betaald}
                      </p>
                    ) : (
                      <form action={payInvoice.bind(null, factuur.id)} className="mt-3">
                        <SubmitButton className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90">
                          <CreditCard className="h-4 w-4" strokeWidth={2} />
                          {t.betaal}
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </Blok>

          <Blok icoon={MapPin} titel={t.werf}>
            <div className="space-y-3 text-sm">
              <p>
                {werfTekst(p.werf)}
                {kaart && (
                  <a href={kaart} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-accent hover:underline">
                    {t.kaart}
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                )}
              </p>
              {p.stelsel && (
                <div className="flex gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  <div>
                    <p className="font-medium">
                      {p.stelsel.stelsel} <span className="font-mono text-xs text-muted">({p.stelsel.epsg})</span>
                    </p>
                    <p className="text-muted">
                      {t.hoogte}: {p.stelsel.hoogte}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Blok>

          <Blok icoon={Cpu} titel={t.systemen}>
            <div className="flex flex-wrap gap-2">
              {p.merken.map((m) => (
                <span key={m} className="rounded-full border px-3 py-1 text-sm">{m}</span>
              ))}
            </div>
          </Blok>

          <Blok icoon={FileText} titel={t.plannen}>
            {p.plannen.length === 0 ? (
              <p className="text-sm text-muted">{t.geenPlannen}</p>
            ) : (
              <ul className="divide-y">
                {p.plannen.map((pl) => (
                  <PlanKnop key={pl.pad} projectId={p.id} pad={pl.pad} naam={pl.naam} grootte={grootteTekst(pl.grootte)} locale={locale} />
                ))}
              </ul>
            )}
          </Blok>
        </div>
      </div>

      {/* Volle breedte onder het raster: in de smalle linkerkolom passen de
          soortkaarten van het ticketformulier niet naast elkaar. */}
      <Blok icoon={MessageSquareWarning} titel={t.revisie}>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {t.revisieUitleg}
          {tariefZin && <> {tariefZin}</>}
        </p>

        {tk.tickets.length > 0 && (
          <div className="mt-5 max-w-3xl">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-sm font-semibold">{t.tickets}</h3>
              <Link
                href={localePath(locale, "/portail/dashboard/tickets")}
                className="rounded text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t.alleTickets}
              </Link>
            </div>
            <ul className="space-y-2">
              {tk.tickets.slice(0, MAX_TICKETS_GETOOND).map((tkt) => {
                const a = afgeleid(tkt, tk.berichten);
                const status = klantStatus(tkt, tk.berichten);
                return (
                  <li key={tkt.id}>
                    <Link
                      href={localePath(locale, `/portail/dashboard/tickets/${tkt.id}`)}
                      className={`group flex items-start gap-3 rounded-xl border bg-background p-3 text-sm transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        a.klantOngelezen ? "border-emerald-500" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted">
                          {a.klantOngelezen && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2 py-0.5 font-sans font-semibold text-emerald-950">
                              <span className="h-2 w-2 rounded-full bg-emerald-950" aria-hidden />
                              {t.ongelezen}
                            </span>
                          )}
                          <span>{ticketRef(tkt)}</span>
                        </span>
                        <span
                          className={`mt-0.5 line-clamp-2 break-words wrap-anywhere ${a.klantOngelezen ? "font-bold" : "font-medium"}`}
                        >
                          {toonOnderwerp(tkt)}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full border px-2.5 py-0.5 font-medium ${STATUS_KLEUR[status]}`}>
                            {KLANT_STATUS_LABEL[status][locale]}
                          </span>
                          <span className="rounded-full border px-2.5 py-0.5">{SOORT_LABEL[soortVan(tkt)][locale]}</span>
                          {a.laatsteOp && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                              <span className="sr-only">{t.laatste}: </span>
                              <time dateTime={a.laatsteOp}>{datumTijd(a.laatsteOp, locale)}</time>
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 border-t pt-5">
          <div className="max-w-3xl">
            <h3 className="mb-4 text-sm font-semibold">{t.nieuw}</h3>
            {/* Onderwerp begint met de projecttitel: vóór migratie 0049 (geen
                project_id) vindt deze pagina het ticket daarop terug, en 0049
                koppelt een revisie 'Revisie — <titel>' aan dit project. */}
            <NieuwTicketFormulier
              locale={locale}
              projecten={[{ id: p.id, titel: p.titel, status: p.status, categorie: p.categorie, merken: p.merken ?? [] }]}
              vastProjectId={p.id}
              standaardSoort={REVISIE_PROJECTSTATUS.includes(p.status) ? "revisie" : "vraag"}
              standaardOnderwerp={p.titel || undefined}
              bijlagenAan={schema.bijlagen}
              compact
            />
          </div>
        </div>
      </Blok>
    </div>
  );
}

function Blok({ icoon: Icoon, titel, children }: { icoon: React.ComponentType<{ className?: string; strokeWidth?: number }>; titel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
        <Icoon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        {titel}
      </h2>
      {children}
    </section>
  );
}

function Rij({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex items-baseline justify-between gap-4">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </p>
  );
}
