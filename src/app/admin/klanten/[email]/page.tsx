import Link from "next/link";
import { ArrowLeft, Mail, BarChart3 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import type { ScanResult } from "@/app/actions/scan";
import {
  createOffer,
  setOfferStatus,
  addInvoice,
  setInvoiceStatus,
  setSubscription,
  replyTicketStudio,
  setTicketStatus,
  addSite,
  setSiteStatus,
  setProgress,
  addChecklistItem,
  deleteChecklistItem,
  addDocument,
  deleteDocument,
  setDomain,
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
    msgsR,
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
      .order("updated_at", { ascending: false }),
    db
      .from("ticket_messages")
      .select("*")
      .order("created_at", { ascending: true }),
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
    title: string;
    amount_cents: number | null;
    status: string;
    created_at: string;
  };
  type Invoice = {
    id: string;
    number: string;
    amount_cents: number;
    status: string;
    issued_at: string;
  };
  type Sub = {
    id: string;
    plan: string;
    price_cents: number;
    status: string;
  };
  type Ticket = { id: string; subject: string; status: string };
  type Msg = {
    id: string;
    ticket_id: string;
    sender: string;
    body: string;
    created_at: string;
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
  const tickets = (ticketsR.data as Ticket[]) ?? [];
  const sites = (sitesR.data as SiteRow[]) ?? [];
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
    tickets: tickets.filter((tk) => tk.status !== "gesloten").length,
  };
  const allMsgs = (msgsR.data as Msg[]) ?? [];
  const ticketIds = new Set(tickets.map((tk) => tk.id));
  const msgsByTicket = new Map<string, Msg[]>();
  for (const m of allMsgs) {
    if (!ticketIds.has(m.ticket_id)) continue;
    const arr = msgsByTicket.get(m.ticket_id);
    if (arr) arr.push(m);
    else msgsByTicket.set(m.ticket_id, [m]);
  }
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
          </div>
        </nav>

        <div className="min-w-0 flex-1">
      {tab === "overzicht" && (
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
              v: String(
                tickets.filter((tk) => tk.status !== "gesloten").length,
              ),
            },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.k}
              </p>
              <p className="mt-1 truncate text-2xl font-semibold">{c.v}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "scans" && (
        <>
      <h2 className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
        Alle scans
      </h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border bg-card p-5 text-sm text-muted">
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
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5"
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
      </div>

      </>
      )}

      {tab === "offertes" && (
        <>
      {/* OFFERTES */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Offertes
      </h2>
      <div className="mt-4 space-y-3">
        {offers.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {o.title}{" "}
                <span className="text-muted">· {eur(o.amount_cents)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  o.status,
                )}`}
              >
                {o.status}
              </span>
              <form action={setOfferStatus.bind(null, o.id, "akkoord")}>
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                  ✓
                </button>
              </form>
              <form action={setOfferStatus.bind(null, o.id, "afgewezen")}>
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                  ✕
                </button>
              </form>
            </div>
          </div>
        ))}
        <form
          action={createOffer}
          className="rounded-2xl border border-dashed bg-card/50 p-4"
        >
          <input type="hidden" name="client_email" value={email} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Titel" className={field} />
            <input
              name="amount"
              placeholder="Bedrag €"
              className={field}
            />
          </div>
          <textarea
            name="body"
            rows={2}
            placeholder="Omschrijving (optioneel)"
            className={`mt-2 ${field}`}
          />
          <div className="mt-2 flex items-center gap-2">
            <input type="date" name="valid_until" className={field} />
            <button className="whitespace-nowrap rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
              Offerte sturen
            </button>
          </div>
        </form>
      </div>

      </>
      )}

      {tab === "facturen" && (
        <>
      {/* FACTUREN */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Facturen
      </h2>
      <div className="mt-4 space-y-3">
        {invoices.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <p className="font-medium">
              {i.number} <span className="text-muted">· {eur(i.amount_cents)}</span>
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  i.status,
                )}`}
              >
                {i.status}
              </span>
              <form action={setInvoiceStatus.bind(null, i.id, "betaald")}>
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                  Betaald
                </button>
              </form>
              <form action={setInvoiceStatus.bind(null, i.id, "vervallen")}>
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                  Vervallen
                </button>
              </form>
            </div>
          </div>
        ))}
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
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
      {/* TICKETS */}
      <h2 className="mt-12 font-mono text-xs uppercase tracking-widest text-accent">
        Tickets
      </h2>
      <div className="mt-4 space-y-4">
        {tickets.length === 0 && (
          <p className="text-sm text-muted">Nog geen tickets.</p>
        )}
        {tickets.map((tk) => (
          <div key={tk.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold tracking-tight">{tk.subject}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                    tk.status,
                  )}`}
                >
                  {tk.status}
                </span>
                <form action={setTicketStatus.bind(null, tk.id, "gesloten")}>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    Sluiten
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {(msgsByTicket.get(tk.id) ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl px-4 py-2.5 text-sm ${
                    m.sender === "studio" ? "bg-accent/10" : "border bg-background"
                  }`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {m.sender === "studio" ? "Studio VM" : "Klant"} ·{" "}
                    {new Date(m.created_at).toLocaleString("nl-BE", {
                      timeZone: "Europe/Brussels",
                    })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
            {tk.status !== "gesloten" && (
              <form
                action={replyTicketStudio}
                className="mt-3 flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="ticket_id" value={tk.id} />
                <input type="hidden" name="client_email" value={email} />
                <input
                  name="body"
                  required
                  placeholder="Antwoord aan klant…"
                  className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                />
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                  Antwoorden
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
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
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
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
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
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
