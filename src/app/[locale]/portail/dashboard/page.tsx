import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, FileText, Receipt, LifeBuoy, ArrowRight, FileUp, AlertCircle, MapPin } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { eur, dt, nieuweAntwoorden } from "@/lib/portal-shared";
import { STATUS_LABEL, statusKleur, werfTekst, type Project } from "@/lib/projecten";
import { datumTijd, soortVan, ticketRef, toonOnderwerp, type TicketRij } from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";
import { ticketSchema } from "@/lib/tickets-server";
import { PortaalWervenOverzicht } from "@/components/portaal-werven-overzicht";

export const dynamic = "force-dynamic";

const T: Record<Locale, Record<string, string>> = {
  nl: {
    welkom: "Welkom in uw portaal", intro: "Volg hier uw 3D-modellen: van aanvraag tot download.",
    actief: "Lopende projecten", offertes: "Open offertes", openstaand: "Openstaand bedrag", tickets: "Support · open tickets",
    aandacht: "Vraagt uw aandacht", offerteWacht: "Offerte wacht op uw akkoord", factuurOpen: "Factuur te betalen",
    nieuwAntwoord: "Nieuw antwoord op uw ticket",
    niets: "Alles is in orde — niets vraagt uw aandacht.", recent: "Recente projecten", alle: "Alle projecten",
    leeg: "Nog geen projecten.", nieuw: "Nieuwe aanvraag",
  },
  fr: {
    welkom: "Bienvenue dans votre espace", intro: "Suivez ici vos modèles 3D : de la demande au téléchargement.",
    actief: "Projets en cours", offertes: "Devis ouverts", openstaand: "Montant dû", tickets: "Support · tickets ouverts",
    aandacht: "Requiert votre attention", offerteWacht: "Devis en attente de votre accord", factuurOpen: "Facture à payer",
    nieuwAntwoord: "Nouvelle réponse à votre ticket",
    niets: "Tout est en ordre — rien ne requiert votre attention.", recent: "Projets récents", alle: "Tous les projets",
    leeg: "Pas encore de projet.", nieuw: "Nouvelle demande",
  },
  en: {
    welkom: "Welcome to your portal", intro: "Follow your 3D models here: from request to download.",
    actief: "Active projects", offertes: "Open quotes", openstaand: "Amount due", tickets: "Support · open tickets",
    aandacht: "Needs your attention", offerteWacht: "Quote awaiting your approval", factuurOpen: "Invoice to pay",
    nieuwAntwoord: "New reply to your ticket",
    niets: "All good — nothing needs your attention.", recent: "Recent projects", alle: "All projects",
    leeg: "No projects yet.", nieuw: "New request",
  },
  de: {
    welkom: "Willkommen in Ihrem Portal", intro: "Verfolgen Sie hier Ihre 3D-Modelle: von der Anfrage bis zum Download.",
    actief: "Laufende Projekte", offertes: "Offene Angebote", openstaand: "Offener Betrag", tickets: "Support · offene Tickets",
    aandacht: "Erfordert Ihre Aufmerksamkeit", offerteWacht: "Angebot wartet auf Ihre Zustimmung", factuurOpen: "Rechnung zu bezahlen",
    nieuwAntwoord: "Neue Antwort auf Ihr Ticket",
    niets: "Alles in Ordnung — nichts erfordert Ihre Aufmerksamkeit.", recent: "Aktuelle Projekte", alle: "Alle Projekte",
    leeg: "Noch keine Projekte.", nieuw: "Neue Anfrage",
  },
  es: {
    welkom: "Bienvenido a su portal", intro: "Siga aquí sus modelos 3D: desde la solicitud hasta la descarga.",
    actief: "Proyectos en curso", offertes: "Presupuestos abiertos", openstaand: "Importe pendiente", tickets: "Soporte · tickets abiertos",
    aandacht: "Requiere su atención", offerteWacht: "Presupuesto pendiente de su aprobación", factuurOpen: "Factura por pagar",
    nieuwAntwoord: "Nueva respuesta a su ticket",
    niets: "Todo en orden — nada requiere su atención.", recent: "Proyectos recientes", alle: "Todos los proyectos",
    leeg: "Todavía no hay proyectos.", nieuw: "Nueva solicitud",
  },
};

type OngelezenTicket = Pick<TicketRij, "id" | "nummer" | "subject" | "soort" | "laatste_bericht_op">;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const sb = await getSupabaseServer();

  // Support (sessie van de klant, RLS). Met migratie 0049: open tickets zonder
  // de interne site-meldingen, plus de tickets met een ongelezen antwoord van
  // de studio. Zonder 0049 (of als een query faalt): de oude telling, niets ongelezen.
  async function support(): Promise<{ open: number; ongelezen: number; nieuw: OngelezenTicket[] }> {
    const head = { count: "exact" as const, head: true };
    const oud = async () => (await sb.from("tickets").select("id", head).neq("status", "gesloten")).count ?? 0;
    if (!(await ticketSchema()).v2) return { open: await oud(), ongelezen: 0, nieuw: [] };
    const [o, n, l] = await Promise.all([
      sb.from("tickets").select("id", head).neq("status", "gesloten").neq("soort", "intern"),
      sb.from("tickets").select("id", head).eq("klant_ongelezen", true).neq("soort", "intern"),
      sb
        .from("tickets")
        .select("id, nummer, subject, soort, laatste_bericht_op")
        .eq("klant_ongelezen", true)
        .neq("soort", "intern")
        .order("laatste_bericht_op", { ascending: false })
        .limit(5),
    ]);
    const nieuw = l.error ? [] : ((l.data as OngelezenTicket[] | null) ?? []);
    return {
      open: o.error ? await oud() : (o.count ?? 0),
      ongelezen: n.error ? nieuw.length : (n.count ?? 0),
      nieuw,
    };
  }

  const [{ data: pr }, { data: of }, { data: inv }, sup] = await Promise.all([
    sb.from("projecten").select("*").order("created_at", { ascending: false }),
    sb.from("offers").select("id, title, amount_cents, offer_no").eq("status", "open").order("created_at", { ascending: false }),
    sb.from("invoices").select("id, number, amount_cents, due_at").eq("status", "open").order("issued_at", { ascending: false }),
    support(),
  ]);
  const projecten = (pr as Project[] | null) ?? [];
  const offertes = (of as { id: string; title: string; amount_cents: number; offer_no: string | null }[] | null) ?? [];
  const facturen = (inv as { id: string; number: string; amount_cents: number; due_at: string | null }[] | null) ?? [];
  const actief = projecten.filter((p) => !["afgesloten", "geannuleerd"].includes(p.status)).length;
  const openstaand = facturen.reduce((s, f) => s + (f.amount_cents ?? 0), 0);

  const kaarten: { label: string; waarde: string; icoon: typeof Boxes; href: string; nieuw?: string }[] = [
    { label: t.actief, waarde: String(actief), icoon: Boxes, href: "/portail/dashboard/projecten" },
    { label: t.offertes, waarde: String(offertes.length), icoon: FileText, href: "/portail/dashboard/offertes" },
    { label: t.openstaand, waarde: eur(openstaand), icoon: Receipt, href: "/portail/dashboard/facturen" },
    {
      label: t.tickets,
      waarde: String(sup.open),
      icoon: LifeBuoy,
      href: "/portail/dashboard/tickets",
      nieuw: sup.ongelezen > 0 ? nieuweAntwoorden(sup.ongelezen, locale) : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.welkom}</h1>
          <p className="mt-1 text-sm text-muted">{t.intro}</p>
        </div>
        <Link href={localePath(locale, "/portail/dashboard/projecten/nieuw")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90">
          <FileUp className="h-4 w-4" strokeWidth={2} />
          {t.nieuw}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kaarten.map(({ label, waarde, icoon: Icoon, href, nieuw }) => (
          <Link key={label} href={localePath(locale, href)} className="rounded-2xl border bg-card p-5 transition-colors hover:border-accent">
            <Icoon className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <p className="mt-4 text-2xl font-semibold tracking-tight">{waarde}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
            {nieuw && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-emerald-950">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-950" aria-hidden />
                {nieuw}
              </p>
            )}
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold tracking-tight">
          <AlertCircle className="h-4 w-4 text-accent" strokeWidth={1.75} />
          {t.aandacht}
        </h2>
        {sup.nieuw.length === 0 && offertes.length === 0 && facturen.length === 0 ? (
          <p className="text-sm text-muted">{t.niets}</p>
        ) : (
          <ul className="divide-y">
            {sup.nieuw.map((tk) => (
              <li key={tk.id}>
                <Link
                  href={localePath(locale, `/portail/dashboard/tickets/${tk.id}`)}
                  className="flex items-center justify-between gap-3 rounded-lg py-3 text-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      {t.nieuwAntwoord}
                      <span className="rounded-full border px-2 py-0.5 text-xs font-normal text-muted">
                        {SOORT_LABEL[soortVan(tk)][locale]}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-muted">
                      {ticketRef(tk)} · {toonOnderwerp(tk)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    {tk.laatste_bericht_op && (
                      <time dateTime={tk.laatste_bericht_op} className="hidden sm:inline">
                        {datumTijd(tk.laatste_bericht_op, locale)}
                      </time>
                    )}
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
            {offertes.map((o) => (
              <li key={o.id}>
                <Link href={localePath(locale, "/portail/dashboard/offertes")} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-accent">
                  <span>
                    <span className="block font-medium">{t.offerteWacht}</span>
                    <span className="text-muted">{o.offer_no ? `${o.offer_no} · ` : ""}{o.title}</span>
                  </span>
                  <span className="flex items-center gap-2 font-medium">{eur(o.amount_cents)}<ArrowRight className="h-4 w-4" strokeWidth={2} /></span>
                </Link>
              </li>
            ))}
            {facturen.map((f) => (
              <li key={f.id}>
                <Link href={localePath(locale, "/portail/dashboard/facturen")} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-accent">
                  <span>
                    <span className="block font-medium">{t.factuurOpen}</span>
                    <span className="text-muted">{f.number}{f.due_at ? ` · ${dt(f.due_at, locale)}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-2 font-medium">{eur(f.amount_cents)}<ArrowRight className="h-4 w-4" strokeWidth={2} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PortaalWervenOverzicht locale={locale} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold tracking-tight">{t.recent}</h2>
          <Link href={localePath(locale, "/portail/dashboard/projecten")} className="text-sm font-medium text-accent hover:underline">{t.alle}</Link>
        </div>
        {projecten.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">{t.leeg}</p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {projecten.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link href={localePath(locale, `/portail/dashboard/projecten/${p.id}`)} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-card-hover">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.titel}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-muted">
                      <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {werfTekst(p.werf)}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusKleur(p.status)}`}>{STATUS_LABEL[p.status][locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
