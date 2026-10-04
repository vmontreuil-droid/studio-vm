import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, FolderOpen, LifeBuoy, MessageSquare, Plus } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import {
  afgeleid,
  datumTijd,
  isUuid,
  soortVan,
  ticketRef,
  toonOnderwerp,
  type BerichtKern,
  type KlantStatus,
  type TicketRij,
} from "@/lib/tickets";
import { KLANT_STATUS_LABEL, SOORT_LABEL } from "@/lib/tickets-teksten";
import { isOntbrekend, ticketSchema } from "@/lib/tickets-server";

export const dynamic = "force-dynamic";

type Toon = "open" | "gesloten" | "alle";
const TOON: Toon[] = ["open", "gesloten", "alle"];

const L: Record<
  Locale,
  {
    intro: string;
    nieuw: string;
    filter: string;
    toon: Record<Toon, string>;
    leeg: string;
    leegCta: string;
    leegFilter: Record<Toon, string>;
    toonAlle: string;
    ongelezen: string;
    u: string;
    studio: string;
    laatste: string;
  }
> = {
  nl: {
    intro:
      "Een vraag over een model, een revisie na een planwijziging of een probleem met het model op de machine? Open een ticket — ik antwoord op werkdagen binnen 24 uur.",
    nieuw: "Nieuw ticket",
    filter: "Tickets filteren",
    toon: { open: "Open", gesloten: "Gesloten", alle: "Alle" },
    leeg: "U hebt nog geen tickets.",
    leegCta: "Open uw eerste ticket",
    leegFilter: { open: "Geen open tickets.", gesloten: "Geen gesloten tickets.", alle: "Geen tickets." },
    toonAlle: "Alle tickets tonen",
    ongelezen: "Nieuw antwoord",
    u: "U",
    studio: "Studio VM",
    laatste: "Laatste bericht",
  },
  fr: {
    intro:
      "Une question sur un modèle, une révision après une modification de plan ou un problème avec le modèle sur la machine ? Ouvrez un ticket — je réponds sous 24 heures les jours ouvrables.",
    nieuw: "Nouveau ticket",
    filter: "Filtrer les tickets",
    toon: { open: "Ouverts", gesloten: "Fermés", alle: "Tous" },
    leeg: "Vous n'avez pas encore de ticket.",
    leegCta: "Ouvrir votre premier ticket",
    leegFilter: { open: "Aucun ticket ouvert.", gesloten: "Aucun ticket fermé.", alle: "Aucun ticket." },
    toonAlle: "Afficher tous les tickets",
    ongelezen: "Nouvelle réponse",
    u: "Vous",
    studio: "Studio VM",
    laatste: "Dernier message",
  },
  en: {
    intro:
      "A question about a model, a revision after a plan change or an issue with the model on the machine? Open a ticket — I reply within 24 hours on working days.",
    nieuw: "New ticket",
    filter: "Filter tickets",
    toon: { open: "Open", gesloten: "Closed", alle: "All" },
    leeg: "You do not have any tickets yet.",
    leegCta: "Open your first ticket",
    leegFilter: { open: "No open tickets.", gesloten: "No closed tickets.", alle: "No tickets." },
    toonAlle: "Show all tickets",
    ongelezen: "New reply",
    u: "You",
    studio: "Studio VM",
    laatste: "Last message",
  },
  de: {
    intro:
      "Eine Frage zu einem Modell, eine Revision nach einer Planänderung oder ein Problem mit dem Modell auf der Maschine? Eröffnen Sie ein Ticket — ich antworte an Werktagen innerhalb von 24 Stunden.",
    nieuw: "Neues Ticket",
    filter: "Tickets filtern",
    toon: { open: "Offen", gesloten: "Geschlossen", alle: "Alle" },
    leeg: "Sie haben noch keine Tickets.",
    leegCta: "Ihr erstes Ticket eröffnen",
    leegFilter: { open: "Keine offenen Tickets.", gesloten: "Keine geschlossenen Tickets.", alle: "Keine Tickets." },
    toonAlle: "Alle Tickets anzeigen",
    ongelezen: "Neue Antwort",
    u: "Sie",
    studio: "Studio VM",
    laatste: "Letzte Nachricht",
  },
  es: {
    intro:
      "¿Una pregunta sobre un modelo, una revisión tras un cambio de plano o un problema con el modelo en la máquina? Abra un ticket — respondo en un plazo de 24 horas en días laborables.",
    nieuw: "Nuevo ticket",
    filter: "Filtrar tickets",
    toon: { open: "Abiertos", gesloten: "Cerrados", alle: "Todos" },
    leeg: "Todavía no tiene tickets.",
    leegCta: "Abrir su primer ticket",
    leegFilter: { open: "No hay tickets abiertos.", gesloten: "No hay tickets cerrados.", alle: "No hay tickets." },
    toonAlle: "Mostrar todos los tickets",
    ongelezen: "Nueva respuesta",
    u: "Usted",
    studio: "Studio VM",
    laatste: "Último mensaje",
  },
};

const STATUS_KLEUR: Record<KlantStatus, string> = {
  wacht_op_studio: "border-amber-400 bg-amber-200 text-amber-950",
  antwoord_ontvangen: "border-emerald-500 bg-emerald-300 text-emerald-950",
  gesloten: "border-border bg-card text-muted",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  // De [locale]-layout zet het sjabloon '%s': het merk staat er dus één keer bij.
  return { title: { absolute: `${PORTAL_T[locale].tickets} — Studio VM` } };
}

/** Basisstand (zonder 0049): het laatste bericht per ticket, in twee kleine vragen. */
async function laatsteBerichten(
  sb: Awaited<ReturnType<typeof getSupabaseServer>>,
  ids: string[],
): Promise<BerichtKern[]> {
  const laatste = new Map<string, { id: string; ticket_id: string; sender: string; created_at: string }>();
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await sb
      .from("ticket_messages")
      .select("id, ticket_id, sender, created_at")
      .in("ticket_id", ids.slice(i, i + 100))
      .order("created_at", { ascending: false })
      .limit(2000);
    for (const m of (data as { id: string; ticket_id: string; sender: string; created_at: string }[] | null) ?? []) {
      if (!laatste.has(m.ticket_id)) laatste.set(m.ticket_id, m);
    }
  }
  const berichtIds = [...laatste.values()].map((m) => m.id);
  const bodies = new Map<string, string>();
  for (let i = 0; i < berichtIds.length; i += 100) {
    const { data } = await sb
      .from("ticket_messages")
      .select("id, body")
      .in("id", berichtIds.slice(i, i + 100));
    for (const m of (data as { id: string; body: string }[] | null) ?? []) bodies.set(m.id, m.body);
  }
  return [...laatste.values()].map((m) => ({ ...m, body: bodies.get(m.id) ?? "" }));
}

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ toon?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const sp = await searchParams;
  const ruw = Array.isArray(sp.toon) ? sp.toon[0] : sp.toon;
  const toon: Toon = TOON.includes(ruw as Toon) ? (ruw as Toon) : "open";
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const schema = await ticketSchema();

  const basis = () => sb.from("tickets").select("*").order("updated_at", { ascending: false }).limit(200);
  let res = schema.v2 ? await basis().neq("soort", "intern") : await basis();
  if (res.error && schema.v2 && isOntbrekend(res.error)) res = await basis();
  if (res.error) console.error("[tickets] lijst laden mislukt:", res.error.code, res.error.message);
  const tickets = ((res.data as TicketRij[] | null) ?? []).filter((tk) => soortVan(tk) !== "intern");

  const v2 = tickets.some((tk) => typeof tk.wacht_op === "string");
  const ids = tickets.map((tk) => tk.id);
  const projectIds = [...new Set(tickets.map((tk) => tk.project_id).filter(isUuid))];
  const [berichten, projectRes] = await Promise.all([
    v2 || ids.length === 0 ? Promise.resolve([] as BerichtKern[]) : laatsteBerichten(sb, ids),
    projectIds.length > 0
      ? sb.from("projecten").select("id, titel").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; titel: string }[] }),
  ]);
  const projectTitel = new Map(
    ((projectRes.data as { id: string; titel: string }[] | null) ?? []).map((p) => [p.id, p.titel]),
  );

  const rijen = tickets.map((tk) => {
    const a = afgeleid(tk, berichten);
    return { tk, a, status: a.gesloten ? ("gesloten" as const) : a.wachtOp === "klant" ? ("antwoord_ontvangen" as const) : ("wacht_op_studio" as const) };
  });
  const aantal: Record<Toon, number> = {
    open: rijen.filter((r) => !r.a.gesloten).length,
    gesloten: rijen.filter((r) => r.a.gesloten).length,
    alle: rijen.length,
  };
  const zichtbaar = rijen.filter((r) => (toon === "alle" ? true : toon === "gesloten" ? r.a.gesloten : !r.a.gesloten));
  const nieuwHref = localePath(locale, "/portail/dashboard/tickets/nieuw");
  const lijstHref = (x: Toon) => localePath(locale, `/portail/dashboard/tickets${x === "open" ? "" : `?toon=${x}`}`);

  return (
    // pb-20 op gsm: de laatste kaart schuift boven de zwevende knop uit.
    <div className="space-y-6 pb-20 sm:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent" aria-hidden>
            <LifeBuoy className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.tickets}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{l.intro}</p>
          </div>
        </div>
        <Link
          href={nieuwHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {l.nieuw}
        </Link>
      </header>

      {tickets.length > 0 && (
        <nav aria-label={l.filter} className="flex flex-wrap gap-2">
          {TOON.map((x) => {
            const actief = x === toon;
            return (
              <Link
                key={x}
                href={lijstHref(x)}
                aria-current={actief ? "page" : undefined}
                className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  actief ? "border-foreground bg-foreground text-background" : "bg-card hover:border-accent"
                }`}
              >
                {l.toon[x]}
                <span className={`font-mono text-xs ${actief ? "opacity-80" : "text-muted"}`}>{aantal[x]}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center sm:p-10">
          <MessageSquare className="mx-auto h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden />
          <p className="mt-3 text-sm text-muted">{l.leeg}</p>
          <Link
            href={nieuwHref}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {l.leegCta}
          </Link>
        </div>
      ) : zichtbaar.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
          <p className="text-sm text-muted">{l.leegFilter[toon]}</p>
          {toon !== "alle" && (
            <Link
              href={lijstHref("alle")}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {l.toonAlle}
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {zichtbaar.map(({ tk, a, status }) => {
            const soort = soortVan(tk);
            const titel = tk.project_id ? projectTitel.get(tk.project_id) : undefined;
            const wie = a.laatsteAfzender === "studio" ? l.studio : a.laatsteAfzender === "klant" ? l.u : null;
            return (
              <li key={tk.id}>
                <Link
                  href={localePath(locale, `/portail/dashboard/tickets/${tk.id}`)}
                  className={`group block rounded-2xl border bg-card p-4 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-5 ${
                    a.klantOngelezen ? "border-emerald-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted">
                        {a.klantOngelezen && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2 py-0.5 font-sans font-semibold text-emerald-950">
                            <span className="h-2 w-2 rounded-full bg-emerald-950" aria-hidden />
                            {l.ongelezen}
                          </span>
                        )}
                        <span>{ticketRef(tk)}</span>
                      </p>
                      <h2
                        className={`mt-1 line-clamp-2 break-words text-base tracking-tight wrap-anywhere ${
                          a.klantOngelezen ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {toonOnderwerp(tk)}
                      </h2>
                    </div>
                    <ChevronRight
                      className="mt-1 h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2.5 py-0.5 font-medium ${STATUS_KLEUR[status]}`}>
                      {KLANT_STATUS_LABEL[status][locale]}
                    </span>
                    <span className="rounded-full border px-2.5 py-0.5">{SOORT_LABEL[soort][locale]}</span>
                    {titel && (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-muted">
                        <FolderOpen className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                        <span className="truncate">{titel}</span>
                      </span>
                    )}
                    {a.laatsteOp && (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                        <span className="sr-only">{l.laatste}: </span>
                        <time dateTime={a.laatsteOp}>{datumTijd(a.laatsteOp, locale)}</time>
                      </span>
                    )}
                  </div>

                  {a.fragment && (
                    <p className="mt-2 line-clamp-1 break-words text-sm text-muted wrap-anywhere">
                      {wie && <span className="font-medium text-foreground/80">{wie}: </span>}
                      {a.fragment}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={nieuwHref}
        aria-label={l.nieuw}
        className="fixed bottom-5 right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
  );
}
