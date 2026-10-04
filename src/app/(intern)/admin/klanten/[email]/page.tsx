import Link from "next/link";
import { ArrowLeft, Mail, BarChart3, ExternalLink, Plus } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  afgeleid,
  datumTijd,
  soortVan,
  ticketRef,
  toonOnderwerp,
  type BerichtKern,
  type TicketRij,
  type TicketSoort,
} from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionTiers,
} from "@/lib/pricing";
import { OfferBuilder } from "@/components/offer-builder";
import { lookupVat } from "@/app/actions/quote";
import type { ScanResult } from "@/app/actions/scan";
import {
  createOffer,
  setOfferStatus,
  createOfferInvoice,
  addInvoice,
  setInvoiceStatus,
  setSubscription,
  addSite,
  setSiteStatus,
  setProgress,
  addChecklistItem,
  deleteChecklistItem,
  addDocument,
  deleteDocument,
  setDomain,
  deleteClient,
  activateWebsiteClient,
  addClientScan,
  impersonatePortal,
} from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  token: string;
  email: string;
  url: string;
  locale: string;
  scan: ScanResult;
  created_at: string;
};

const TABS = [
  { k: "overzicht", l: "Overzicht" },
  { k: "scans", l: "Scans" },
  { k: "offertes", l: "Offertes" },
  { k: "facturen", l: "Facturen" },
  { k: "abonnement", l: "Abonnement" },
  { k: "voortgang", l: "Voortgang" },
  { k: "checklist", l: "Checklist" },
  { k: "documenten", l: "Documenten" },
  { k: "website", l: "Website" },
  { k: "domein", l: "Domein" },
  { k: "tickets", l: "Tickets" },
] as const;

// Zelfde kleuren als de ticketlijst (/admin/tickets).
const SOORT_KLEUR: Record<TicketSoort, string> = {
  vraag: "border-border text-muted",
  revisie: "border-violet-300 bg-violet-200 text-violet-950",
  machine: "border-teal-300 bg-teal-200 text-teal-950",
  afspraak: "border-blue-300 bg-blue-200 text-blue-950",
  intern: "border-dashed border-border text-muted",
};

/** Zoveel tickets van één klant tonen (nieuwste activiteit eerst). */
const TICKETS_MAX = 200;

export default async function AdminKlantDetail({
  params,
  searchParams,
}: {
  params: Promise<{ email: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { email: raw } = await params;
  const email = decodeURIComponent(raw).toLowerCase().trim();
  const { tab: tabRaw } = await searchParams;
  const tab = TABS.some((x) => x.k === tabRaw)
    ? (tabRaw as string)
    : "overzicht";
  const tabHref = (k: string) =>
    `/admin/klanten/${encodeURIComponent(email)}?tab=${k}`;

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("id, token, email, url, locale, scan, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data as Row[]) ?? [];
  // Geen scans = handmatig toegevoegde klant; toon hem gewoon, geen 404.
  const first: Row | undefined = rows[rows.length - 1];

  const db = getSupabaseAdmin();
  const [
    offersR,
    invoicesR,
    subsR,
    ticketsR,
    sitesR,
    progressR,
    checklistR,
    documentsR,
  ] = await Promise.all([
    db
      .from("offers")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false }),
    db
      .from("invoices")
      .select("*")
      .eq("client_email", email)
      .order("issued_at", { ascending: false }),
    db
      .from("subscriptions")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false }),
    db
      .from("tickets")
      .select("*")
      .eq("client_email", email)
      .order("updated_at", { ascending: false })
      .limit(TICKETS_MAX),
    db
      .from("sites")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false }),
    db
      .from("project_progress")
      .select("*")
      .eq("client_email", email)
      .maybeSingle(),
    db
      .from("checklist_items")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: true }),
    db
      .from("documents")
      .select("*")
      .eq("client_email", email)
      .order("created_at", { ascending: false }),
  ]);
  type Offer = {
    id: string;
    offer_no: string | null;
    title: string;
    amount_cents: number | null;
    status: string;
    valid_until: string | null;
    items:
      | { label: string; desc?: string; cents: number; kind?: string }[]
      | null;
    vat_number: string | null;
    vat_valid: boolean | null;
    vat_reverse: boolean | null;
    vat_name: string | null;
    viewed_at: string | null;
    created_at: string;
  };
  type Invoice = {
    id: string;
    number: string;
    amount_cents: number;
    status: string;
    issued_at: string;
    // Btw-verlegging per losse factuur (revisiefactuur), vanaf migratie 0049.
    vat_reverse?: boolean | null;
  };
  type Sub = {
    id: string;
    plan: string;
    price_cents: number;
    status: string;
  };
  type SiteRow = {
    id: string;
    name: string;
    url: string | null;
    status: string;
    last_deploy: string | null;
    domain: string | null;
    registrar: string | null;
    domain_renewal: string | null;
    hosting: string | null;
    dns_note: string | null;
  };
  const offers = (offersR.data as Offer[]) ?? [];
  const invoices = (invoicesR.data as Invoice[]) ?? [];
  const subs = (subsR.data as Sub[]) ?? [];
  const tickets = (ticketsR.data as TicketRij[] | null) ?? [];
  const sites = (sitesR.data as SiteRow[]) ?? [];

  // Toestand per ticket. Met migratie 0049 staat alles op de ticketrij
  // (wacht_op, laatste_bericht_op, ongelezen); zonder enkel het laatste
  // bericht van DEZE tickets ophalen — nooit alle berichten van alle klanten.
  const laatsteMsg = new Map<string, BerichtKern>();
  const zonderV2 = tickets.filter((tk) => tk.wacht_op == null).map((tk) => tk.id);
  for (let i = 0; i < zonderV2.length; i += 100) {
    const blok = zonderV2.slice(i, i + 100);
    const { data: msgs } = await db
      .from("ticket_messages")
      .select("ticket_id, sender, created_at")
      .in("ticket_id", blok)
      .order("created_at", { ascending: false })
      .limit(1000);
    for (const m of (msgs as BerichtKern[] | null) ?? []) {
      if (m.ticket_id && !laatsteMsg.has(m.ticket_id)) laatsteMsg.set(m.ticket_id, m);
    }
  }
  const ticketRijen = tickets
    .map((tk) => {
      const m = laatsteMsg.get(tk.id);
      return { t: tk, a: afgeleid(tk, m ? [m] : null), soort: soortVan(tk) };
    })
    .sort((x, y) => {
      // Open eerst, daarna de recentste activiteit bovenaan.
      if (x.a.gesloten !== y.a.gesloten) return x.a.gesloten ? 1 : -1;
      return (Date.parse(y.a.laatsteOp) || 0) - (Date.parse(x.a.laatsteOp) || 0);
    });
  const openTickets = ticketRijen.filter((r) => !r.a.gesloten).length;
  const nieuwTicketHref = `/admin/tickets/nieuw?email=${encodeURIComponent(email)}`;
  type ProgressRow = { step: string; note: string | null } | null;
  type CheckRow = { id: string; label: string; done: boolean };
  type DocRow = { id: string; name: string; url: string; kind: string };
  const progress = progressR.data as ProgressRow;
  const checklist = (checklistR.data as CheckRow[]) ?? [];
  const documents = (documentsR.data as DocRow[]) ?? [];
  const tabBadge: Record<string, number> = {
    scans: rows.length,
    offertes: offers.filter((o) => o.status === "open").length,
    facturen: invoices.filter((i) => i.status === "open").length,
    abonnement: subs.length,
    checklist: checklist.filter((c) => !c.done).length,
    documenten: documents.length,
    website: sites.length,
    domein: sites.filter((s) => s.domain).length,
    tickets: openTickets,
  };
  const eur = (c: number | null | undefined) =>
    c == null ? "—" : `€ ${(c / 100).toFixed(2)}`;
  const sBadge = (s: string) =>
    ["akkoord", "betaald", "actief"].includes(s)
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : ["afgewezen", "vervallen", "gestopt"].includes(s)
        ? "bg-red-500/15 text-red-500"
        : s === "in_behandeling"
          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
          : "bg-accent/15 text-accent";
  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
  const catalog = offerCatalog();
  const cEur = (c: number) => `€ ${(c / 100).toFixed(2)}`;
  const tiers = subscriptionTiers();
  const activeSub = subs.find((s) => s.status === "actief") ?? subs[0];

  const gradeColor = (s: number) =>
    s >= 75
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s >= 45
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-red-500/15 text-red-500";

  return (
    <>
      <Link
        href="/admin/klanten"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar klanten
      </Link>

      <div className="mt-4 min-w-0">
        <h1 className="break-all text-2xl font-semibold tracking-tight">
          {email}
        </h1>
        <p className="mt-1 font-mono text-[11px] text-muted">
          {rows.length} scan{rows.length === 1 ? "" : "s"}
          {first
            ? ` · klant sinds ${new Date(
                first.created_at,
              ).toLocaleDateString("nl-BE", {
                timeZone: "Europe/Brussels",
              })}`
            : " · handmatig toegevoegd"}
        </p>
      </div>

      {/* Tab-layout: verticale rail links + paneel rechts */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto pb-2 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((x) => {
            const n = tabBadge[x.k] ?? 0;
            return (
              <Link
                key={x.k}
                href={tabHref(x.k)}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  tab === x.k
                    ? "bg-card-hover font-medium text-foreground"
                    : "text-muted hover:bg-card-hover hover:text-foreground"
                }`}
              >
                <span>{x.l}</span>
                {n > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                      tab === x.k
                        ? "bg-accent/15 text-accent"
                        : "bg-background text-muted"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mt-3 border-t pt-3">
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-card-hover hover:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
              Mail klant
            </a>
            <form action={impersonatePortal}>
              <input type="hidden" name="client_email" value={email} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm text-accent transition-colors hover:bg-card-hover"
              >
                <ExternalLink
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2}
                />
                Bekijk portaal als klant
              </button>
            </form>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
      {tab === "overzicht" && (
        <>
        <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Website-klant
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {activeSub
              ? `Actief als klant — abonnement ${activeSub.plan} (${activeSub.status}). Portaaltoegang staat klaar.`
              : "Nog geen abonnement. Steek deze persoon achteraf in als website-klant: portaaltoegang + het gekozen abonnement worden meteen aangemaakt en verschijnen in zijn portaal."}
          </p>
          <form
            action={activateWebsiteClient}
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="client_email" value={email} />
            <select
              name="plan"
              defaultValue={
                tiers.find((tr) => tr.name === activeSub?.plan)?.slug ??
                tiers[0]?.slug
              }
              className={field}
            >
              {tiers.map((tr) => (
                <option key={tr.slug} value={tr.slug}>
                  {tr.name} — {cEur(tr.cents)}/maand
                </option>
              ))}
            </select>
            <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
              {activeSub
                ? "Abonnement bijwerken"
                : "Activeer als website-klant"}
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { k: "Scans", v: String(rows.length) },
            {
              k: "Open offertes",
              v: String(offers.filter((o) => o.status === "open").length),
            },
            {
              k: "Openstaand",
              v: eur(
                invoices
                  .filter((i) => i.status === "open")
                  .reduce((s, i) => s + i.amount_cents, 0),
              ),
            },
            {
              k: "Abonnement",
              v:
                subs.find((s) => s.status === "actief")?.plan ??
                subs[0]?.plan ??
                "—",
            },
            { k: "Projectfase", v: progress?.step ?? "—" },
            {
              k: "Checklist",
              v: `${checklist.filter((c) => c.done).length}/${checklist.length}`,
            },
            { k: "Documenten", v: String(documents.length) },
            {
              k: "Open tickets",
              v: String(openTickets),
            },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl bg-card shadow-sm p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.k}
              </p>
              <p className="mt-1 truncate text-2xl font-semibold">{c.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-red-500/40 bg-red-500/5 p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-red-500">
            Gevarenzone
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Verwijdert deze klant definitief: alle scans, offertes,
            facturen, abonnement, tickets (met bijlagen), documenten, website-info én de
            portaaltoegang. Dit kan niet ongedaan gemaakt worden. Typ ter
            bevestiging het e-mailadres.
          </p>
          <form
            action={deleteClient}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input type="hidden" name="client_email" value={email} />
            <input
              name="confirm"
              required
              autoComplete="off"
              placeholder={email}
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="whitespace-nowrap rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Klant definitief verwijderen
            </button>
          </form>
        </div>
        </>
      )}

      {tab === "scans" && (
        <>
      <h2 className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
        Alle scans
      </h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl bg-card shadow-sm p-5 text-sm text-muted">
            Geen scans — handmatig toegevoegde klant. Zet hieronder een
            offerte, factuur, abonnement of website voor hem klaar.
          </p>
        )}
        {rows.map((r) => {
          const sc = r.scan && r.scan.ok ? r.scan : null;
          const host = sc ? sc.host : r.url;
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-card shadow-sm p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {sc && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${gradeColor(
                        sc.score,
                      )}`}
                    >
                      {sc.grade} · {sc.score}
                    </span>
                  )}
                  <span className="truncate font-medium">{host}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {new Date(r.created_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}{" "}
                  · {r.locale.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/scans/${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Analyse
                </Link>
              </div>
            </div>
          );
        })}
        <form
          action={addClientScan}
          className="grid gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:grid-cols-[1fr_auto]"
        >
          <input type="hidden" name="client_email" value={email} />
          <input
            name="url"
            required
            placeholder="Site scannen (bv. klant.be) — zonder de klant te mailen"
            className={field}
          />
          <button className="rounded-full border px-5 py-2 text-sm font-medium hover:bg-card-hover">
            Scan toevoegen
          </button>
        </form>
      </div>

      </>
      )}

      {tab === "offertes" && (
        <>
      {/* OFFERTES */}
      <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
        Offertes
      </h2>
      {offers.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed bg-card/40 p-4 text-sm text-muted">
          Nog geen offertes voor deze klant.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {offers.map((o) => (
            <div
              key={o.id}
              className="rounded-xl bg-card shadow-sm px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <span className="font-mono text-xs text-muted">
                      {o.offer_no ?? "—"}
                    </span>{" "}
                    {o.title}{" "}
                    <span className="text-muted">
                      · {eur(o.amount_cents)}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    {o.valid_until ? `t/m ${o.valid_until}` : "—"}
                    {o.vat_number
                      ? ` · ${o.vat_number}${
                          o.vat_valid === true
                            ? " ✓"
                            : o.vat_valid === false
                              ? " ✕"
                              : ""
                        }`
                      : ""}
                    {o.vat_reverse ? " · btw verlegd" : ""}
                    {" · "}
                    {o.viewed_at ? "bekeken" : "niet bekeken"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                      o.status,
                    )}`}
                  >
                    {o.status}
                  </span>
                  {o.status !== "akkoord" && (
                    <form
                      action={setOfferStatus.bind(null, o.id, "akkoord")}
                    >
                      <button
                        title="Op akkoord zetten"
                        className="rounded-full border px-2.5 py-1 text-xs hover:bg-card-hover"
                      >
                        ✓
                      </button>
                    </form>
                  )}
                  {o.status !== "afgewezen" && (
                    <form
                      action={setOfferStatus.bind(
                        null,
                        o.id,
                        "afgewezen",
                      )}
                    >
                      <button
                        title="Afwijzen"
                        className="rounded-full border px-2.5 py-1 text-xs hover:bg-card-hover"
                      >
                        ✕
                      </button>
                    </form>
                  )}
                  {o.status === "akkoord" && (
                    <form action={createOfferInvoice}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="whitespace-nowrap rounded-full border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-card-hover">
                        + Voorschotfactuur
                      </button>
                    </form>
                  )}
                </div>
              </div>
              {o.items && o.items.length > 0 && (
                <details className="mt-2 text-xs text-muted">
                  <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-widest hover:text-foreground">
                    {o.items.length} lijnen — details
                  </summary>
                  <ul className="mt-2 space-y-1 border-t pt-2">
                    {o.items.map((it, i) => (
                      <li key={i}>
                        <span className="text-foreground">{it.label}</span>{" "}
                        —{" "}
                        {it.kind === "sub"
                          ? "maandelijks (verplicht)"
                          : it.cents > 0
                            ? cEur(it.cents)
                            : it.cents < 0
                              ? `− ${cEur(-it.cents)}`
                              : "inbegrepen"}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 border-t pt-8">
        <h3 className="mb-1 text-sm font-semibold">Nieuwe offerte</h3>
        <p className="mb-4 text-xs text-muted">
          Vul het BTW-nummer in — bedrijf &amp; adres komen automatisch.
          Laat de omschrijving leeg voor een automatische intro op maat.
        </p>
        <OfferBuilder
          email={email}
          bases={catalog.bases}
          addons={catalog.addons}
          subs={tiers.map((s) => ({
            key: s.slug,
            slug: s.slug,
            name: s.name,
            cents: s.cents,
            desc: s.tagline,
          }))}
          included={OFFER_INCLUDED}
          action={createOffer}
          lookupVat={lookupVat}
        />
      </div>

      </>
      )}

      {tab === "facturen" && (
        <>
      {/* FACTUREN */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Facturen
      </h2>
      {invoices.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed bg-card/40 p-4 text-sm text-muted">
          Nog geen facturen voor deze klant.
        </p>
      )}
      <div className="mt-4 space-y-2">
        {invoices.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card shadow-sm px-4 py-3"
          >
            {(() => {
              const oid = (i as unknown as { offer_id?: string | null })
                .offer_id;
              const ref = oid
                ? offers.find((o) => o.id === oid)
                : undefined;
              // Eigen keuze van de factuur (revisiefactuur) wint; anders die van de offerte.
              const rev =
                typeof i.vat_reverse === "boolean"
                  ? i.vat_reverse
                  : !!ref?.vat_reverse;
              const incl = rev
                ? i.amount_cents
                : Math.round(i.amount_cents * 1.21);
              const isDeposit = /voorschot\s*30%/i.test(
                (i as unknown as { description?: string | null })
                  .description ?? "",
              );
              return (
            <div className="min-w-0">
              <p className="font-medium">
                {i.number}{" "}
                <span className="text-muted">
                  · {eur(i.amount_cents)} excl. ·{" "}
                  <span className="text-foreground">
                    {eur(incl)} incl. btw
                  </span>
                </span>
                {isDeposit && (
                  <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                    voorschot 30%
                  </span>
                )}
              </p>
              {(i as unknown as { paid_at?: string | null })
                .paid_at && (
                <p className="mt-0.5 font-mono text-[11px] text-green-700 dark:text-green-400">
                  ✓ Betaald op{" "}
                  {new Date(
                    (i as unknown as { paid_at: string }).paid_at,
                  ).toLocaleDateString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}
                </p>
              )}
            </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  i.status,
                )}`}
              >
                {i.status}
              </span>
              {i.status !== "betaald" && (
                <form action={setInvoiceStatus.bind(null, i.id, "betaald")}>
                  <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                    Betaald
                  </button>
                </form>
              )}
              {i.status === "open" && (
                <form
                  action={setInvoiceStatus.bind(null, i.id, "vervallen")}
                >
                  <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                    Vervallen
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        <p className="mt-6 mb-2 text-xs font-semibold text-muted">
          Handmatig een factuur toevoegen
        </p>
        <form
          action={addInvoice}
          className="grid gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:grid-cols-4"
        >
          <input type="hidden" name="client_email" value={email} />
          <input name="number" required placeholder="Nummer" className={field} />
          <input name="amount" required placeholder="Bedrag €" className={field} />
          <input type="date" name="due_at" className={field} />
          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Factuur sturen
          </button>
        </form>
      </div>

      </>
      )}

      {tab === "abonnement" && (
        <>
      {/* ABONNEMENT */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Abonnement
      </h2>
      <div className="mt-4 space-y-3">
        {subs.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card shadow-sm p-4"
          >
            <p className="font-medium">
              {s.plan} <span className="text-muted">· {eur(s.price_cents)} / maand</span>
            </p>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                s.status,
              )}`}
            >
              {s.status}
            </span>
          </div>
        ))}
        <form
          action={setSubscription}
          className="grid gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:grid-cols-4"
        >
          <input type="hidden" name="client_email" value={email} />
          <input name="plan" required placeholder="Plan (bv. Care)" className={field} />
          <input name="price" required placeholder="Prijs €/maand" className={field} />
          <select name="status" className={field} defaultValue="actief">
            <option value="actief">actief</option>
            <option value="gepauzeerd">gepauzeerd</option>
            <option value="gestopt">gestopt</option>
          </select>
          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Opslaan
          </button>
        </form>
      </div>

      </>
      )}

      {tab === "tickets" && (
        <>
      {/* TICKETS — beantwoorden en sluiten gebeurt op /admin/tickets/<id> */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Tickets
        </h2>
        <Link
          href={nieuwTicketHref}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Nieuw ticket voor deze klant
        </Link>
      </div>
      {ticketRijen.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed bg-card/40 p-4 text-sm text-muted">
          Nog geen tickets voor deze klant.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {ticketRijen.map(({ t, a, soort }) => {
            const ongelezen = a.studioOngelezen;
            const status = a.gesloten
              ? { label: "Gesloten", cls: "border text-muted" }
              : a.wachtOp === "studio"
                ? { label: "Aan mij", cls: "bg-accent text-background" }
                : { label: "Wacht op klant", cls: "bg-sky-200 text-sky-950" };
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/tickets/${t.id}`}
                  className="flex flex-col gap-2 rounded-xl bg-card px-4 py-3 shadow-sm transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {ongelezen && (
                        <>
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Ongelezen:</span>
                        </>
                      )}
                      <span className="font-mono">{ticketRef(t)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 ${SOORT_KLEUR[soort]}`}
                      >
                        {SOORT_LABEL[soort].nl}
                      </span>
                    </p>
                    <p
                      className={`mt-1 break-words ${ongelezen ? "font-semibold" : "font-medium"}`}
                    >
                      {toonOnderwerp(t) || t.subject}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-muted">
                      <span className="sr-only">Laatste activiteit: </span>
                      {datumTijd(a.laatsteOp, "nl")}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {tickets.length >= TICKETS_MAX && (
        <p className="mt-3 text-xs text-muted">
          De {TICKETS_MAX} recentste tickets worden getoond —{" "}
          <Link
            href={`/admin/tickets?weergave=alle&klant=${encodeURIComponent(email)}`}
            className="text-accent underline-offset-2 hover:underline"
          >
            alle tickets van deze klant
          </Link>
          .
        </p>
      )}

      </>
      )}

      {tab === "website" && (
        <>
      {/* WEBSITE */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Website
      </h2>
      <div className="mt-4 space-y-3">
        {sites.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card shadow-sm p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{s.name}</p>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {s.url}
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  s.status === "online"
                    ? "actief"
                    : s.status === "offline"
                      ? "gestopt"
                      : s.status === "onderhoud"
                        ? "in_behandeling"
                        : "open",
                )}`}
              >
                {s.status}
              </span>
              {(
                ["in_aanbouw", "online", "onderhoud", "offline"] as const
              ).map((st) => (
                <form key={st} action={setSiteStatus.bind(null, s.id, st)}>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    {st}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
        <form
          action={addSite}
          className="rounded-2xl border border-dashed bg-card/50 p-4"
        >
          <input type="hidden" name="client_email" value={email} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="name" required placeholder="Naam" className={field} />
            <input
              name="url"
              placeholder="https://… (live URL)"
              className={field}
            />
          </div>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notities voor de klant (optioneel)"
            className={`mt-2 ${field}`}
          />
          <div className="mt-2 flex items-center gap-2">
            <select
              name="status"
              defaultValue="in_aanbouw"
              className={field}
            >
              <option value="in_aanbouw">in aanbouw</option>
              <option value="online">online</option>
              <option value="onderhoud">onderhoud</option>
              <option value="offline">offline</option>
            </select>
            <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
              Website toevoegen
            </button>
          </div>
        </form>
      </div>

      </>
      )}

      {tab === "voortgang" && (
        <>
      {/* PROJECTVOORTGANG */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Projectvoortgang
      </h2>
      <form
        action={setProgress}
        className="mt-4 rounded-2xl border border-dashed bg-card/50 p-4"
      >
        <input type="hidden" name="client_email" value={email} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="step"
            defaultValue={progress?.step ?? "briefing"}
            className={field}
          >
            <option value="briefing">briefing</option>
            <option value="ontwerp">ontwerp</option>
            <option value="bouw">bouw</option>
            <option value="online">online</option>
            <option value="nazorg">nazorg</option>
          </select>
          <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Voortgang opslaan
          </button>
        </div>
        <textarea
          name="note"
          rows={2}
          defaultValue={progress?.note ?? ""}
          placeholder="Notitie voor de klant (optioneel)"
          className={`mt-2 ${field}`}
        />
      </form>

      </>
      )}

      {tab === "checklist" && (
        <>
      {/* CHECKLIST */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Onboarding-checklist
      </h2>
      <div className="mt-4 space-y-2">
        {checklist.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-sm p-3"
          >
            <span className="text-sm">
              {c.done ? "✓ " : "○ "}
              {c.label}
            </span>
            <form action={deleteChecklistItem.bind(null, c.id)}>
              <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                Verwijder
              </button>
            </form>
          </div>
        ))}
        <form
          action={addChecklistItem}
          className="flex flex-col gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:flex-row"
        >
          <input type="hidden" name="client_email" value={email} />
          <input
            name="label"
            required
            placeholder="Nieuw checklist-item (bv. Logo aanleveren)"
            className={field}
          />
          <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Toevoegen
          </button>
        </form>
      </div>

      </>
      )}

      {tab === "documenten" && (
        <>
      {/* DOCUMENTEN */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Documenten
      </h2>
      <div className="mt-4 space-y-2">
        {documents.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-sm p-3"
          >
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm text-accent hover:underline"
            >
              {d.name}{" "}
              <span className="font-mono text-[10px] uppercase text-muted">
                {d.kind}
              </span>
            </a>
            <form action={deleteDocument.bind(null, d.id)}>
              <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                Verwijder
              </button>
            </form>
          </div>
        ))}
        <form
          action={addDocument}
          className="grid gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:grid-cols-4"
        >
          <input type="hidden" name="client_email" value={email} />
          <input name="name" required placeholder="Naam" className={field} />
          <input
            name="url"
            required
            placeholder="Link (Drive/PDF)"
            className={field}
          />
          <input
            name="kind"
            placeholder="Type (contract…)"
            className={field}
          />
          <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
            Document toevoegen
          </button>
        </form>
      </div>

      </>
      )}

      {tab === "domein" && (
        <>
      {/* DOMEIN & HOSTING */}
      {sites.length > 0 && (
        <>
          <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
            Domein &amp; hosting
          </h2>
          <div className="mt-4 space-y-3">
            {sites.map((s) => (
              <form
                key={s.id}
                action={setDomain}
                className="rounded-2xl border border-dashed bg-card/50 p-4"
              >
                <input type="hidden" name="site_id" value={s.id} />
                <p className="mb-2 text-sm font-medium">{s.name}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="domain"
                    defaultValue={s.domain ?? ""}
                    placeholder="Domein (bv. klant.be)"
                    className={field}
                  />
                  <input
                    name="registrar"
                    defaultValue={s.registrar ?? ""}
                    placeholder="Registrar (one.com…)"
                    className={field}
                  />
                  <input
                    type="date"
                    name="domain_renewal"
                    defaultValue={s.domain_renewal ?? ""}
                    className={field}
                  />
                  <input
                    name="hosting"
                    defaultValue={s.hosting ?? ""}
                    placeholder="Hosting (Vercel…)"
                    className={field}
                  />
                </div>
                <input
                  name="dns_note"
                  defaultValue={s.dns_note ?? ""}
                  placeholder="DNS-notitie (optioneel)"
                  className={`mt-2 ${field}`}
                />
                <button className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
                  Opslaan
                </button>
              </form>
            ))}
          </div>
        </>
      )}
        </>
      )}
        </div>
      </div>
    </>
  );
}
