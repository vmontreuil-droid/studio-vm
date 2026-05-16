import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  LogOut,
  Gauge,
  FileText,
  Receipt,
  RefreshCcw,
  LifeBuoy,
} from "lucide-react";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/portail";
import { decideOffer, openTicket, replyTicket } from "@/app/actions/portal-client";
import { PortailLogin } from "@/components/portail-login";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Portaal — Studio VM",
  robots: { index: false, follow: false },
};

type ScanRow = { token: string; url: string; scan: ScanResult; created_at: string };
type Offer = {
  id: string;
  title: string;
  body: string | null;
  amount_cents: number | null;
  status: string;
  valid_until: string | null;
  created_at: string;
};
type Invoice = {
  id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  pdf_url: string | null;
};
type Sub = {
  id: string;
  plan: string;
  price_cents: number;
  period: string;
  status: string;
  started_at: string;
};
type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
};
type Msg = {
  id: string;
  ticket_id: string;
  sender: string;
  body: string;
  created_at: string;
};

const T: Record<
  Locale,
  Record<string, string>
> = {
  nl: {
    welcome: "Welkom terug",
    signout: "Uitloggen",
    scans: "Mijn scans",
    noScans: "Nog geen scans op dit adres.",
    analysis: "Volledige analyse",
    offers: "Offertes",
    noOffers: "Nog geen offerte. Zodra ik er een klaarzet, zie je 'm hier.",
    accept: "Aanvaarden",
    reject: "Afwijzen",
    invoices: "Facturen",
    noInvoices: "Nog geen facturen.",
    pdf: "PDF",
    subscription: "Abonnement",
    noSub: "Geen lopend abonnement.",
    perMonth: "/ maand",
    tickets: "Support",
    noTickets: "Nog geen tickets.",
    newTicket: "Nieuw ticket",
    subject: "Onderwerp",
    message: "Bericht",
    send: "Versturen",
    reply: "Antwoorden",
    you: "Jij",
    studio: "Studio VM",
    open: "open",
    since: "sinds",
  },
  fr: {
    welcome: "Bon retour",
    signout: "Déconnexion",
    scans: "Mes scans",
    noScans: "Aucun scan sur cette adresse.",
    analysis: "Analyse complète",
    offers: "Devis",
    noOffers: "Aucun devis pour l'instant. Dès que j'en prépare un, il s'affiche ici.",
    accept: "Accepter",
    reject: "Refuser",
    invoices: "Factures",
    noInvoices: "Aucune facture.",
    pdf: "PDF",
    subscription: "Abonnement",
    noSub: "Aucun abonnement en cours.",
    perMonth: "/ mois",
    tickets: "Support",
    noTickets: "Aucun ticket.",
    newTicket: "Nouveau ticket",
    subject: "Sujet",
    message: "Message",
    send: "Envoyer",
    reply: "Répondre",
    you: "Vous",
    studio: "Studio VM",
    open: "ouvert",
    since: "depuis",
  },
  en: {
    welcome: "Welcome back",
    signout: "Sign out",
    scans: "My scans",
    noScans: "No scans on this address yet.",
    analysis: "Full analysis",
    offers: "Quotes",
    noOffers: "No quote yet. As soon as I prepare one, it shows here.",
    accept: "Accept",
    reject: "Decline",
    invoices: "Invoices",
    noInvoices: "No invoices.",
    pdf: "PDF",
    subscription: "Subscription",
    noSub: "No active subscription.",
    perMonth: "/ month",
    tickets: "Support",
    noTickets: "No tickets.",
    newTicket: "New ticket",
    subject: "Subject",
    message: "Message",
    send: "Send",
    reply: "Reply",
    you: "You",
    studio: "Studio VM",
    open: "open",
    since: "since",
  },
};

const eur = (c: number | null | undefined) =>
  c == null ? "—" : `€ ${(c / 100).toFixed(2)}`;
const dt = (s: string, loc: Locale) =>
  new Date(s).toLocaleDateString(
    loc === "fr" ? "fr-BE" : loc === "en" ? "en-GB" : "nl-BE",
  );

const badge = (status: string) => {
  const m: Record<string, string> = {
    open: "bg-accent/15 text-accent",
    akkoord: "bg-green-500/15 text-green-600 dark:text-green-400",
    betaald: "bg-green-500/15 text-green-600 dark:text-green-400",
    actief: "bg-green-500/15 text-green-600 dark:text-green-400",
    afgewezen: "bg-red-500/15 text-red-500",
    vervallen: "bg-red-500/15 text-red-500",
    gestopt: "bg-red-500/15 text-red-500",
    in_behandeling: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    gepauzeerd: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    gesloten: "bg-muted/15 text-muted",
  };
  return m[status] ?? "bg-muted/15 text-muted";
};

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Gauge;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <Icon className="h-4 w-4" strokeWidth={2} />
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  if (!supabaseConfigured) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const t = T[locale];

  const [scansR, offersR, invoicesR, subsR, ticketsR, msgsR] =
    await Promise.all([
      sb
        .from("scan_requests")
        .select("token, url, scan, created_at")
        .order("created_at", { ascending: false }),
      sb
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false }),
      sb
        .from("invoices")
        .select("*")
        .order("issued_at", { ascending: false }),
      sb
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
      sb.from("tickets").select("*").order("updated_at", { ascending: false }),
      sb
        .from("ticket_messages")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

  const scans = (scansR.data as ScanRow[]) ?? [];
  const offers = (offersR.data as Offer[]) ?? [];
  const invoices = (invoicesR.data as Invoice[]) ?? [];
  const subs = (subsR.data as Sub[]) ?? [];
  const tickets = (ticketsR.data as Ticket[]) ?? [];
  const msgs = (msgsR.data as Msg[]) ?? [];
  const msgsByTicket = new Map<string, Msg[]>();
  for (const m of msgs) {
    const arr = msgsByTicket.get(m.ticket_id);
    if (arr) arr.push(m);
    else msgsByTicket.set(m.ticket_id, [m]);
  }

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-4 px-6 py-14">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {t.welcome}
            </p>
            <h1 className="mt-2 break-all text-2xl font-semibold tracking-tight sm:text-3xl">
              {user.email}
            </h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
              redirect(localePath(locale, "/portail"));
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              {t.signout}
            </button>
          </form>
        </div>
      </section>

      <Section icon={Gauge} title={t.scans}>
        {scans.length === 0 ? (
          <p className="text-sm text-muted">{t.noScans}</p>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => {
              const ok = s.scan && s.scan.ok ? s.scan : null;
              return (
                <div
                  key={s.token}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {ok ? `${ok.grade} · ${ok.score}/100` : "—"}{" "}
                      <span className="text-muted">
                        · {ok ? ok.host : s.url}
                      </span>
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {dt(s.created_at, locale)}
                    </p>
                  </div>
                  <Link
                    href={localePath(locale, `/portail/scan/${s.token}`)}
                    className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                  >
                    {t.analysis} →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section icon={FileText} title={t.offers}>
        {offers.length === 0 ? (
          <p className="text-sm text-muted">{t.noOffers}</p>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <div key={o.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{o.title}</p>
                    {o.amount_cents != null && (
                      <p className="mt-1 font-mono text-sm">
                        {eur(o.amount_cents)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                      o.status,
                    )}`}
                  >
                    {o.status}
                  </span>
                </div>
                {o.body && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {o.body}
                  </p>
                )}
                {o.status === "open" && (
                  <div className="mt-4 flex gap-2">
                    <form action={decideOffer.bind(null, o.id, "akkoord")}>
                      <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                        {t.accept}
                      </button>
                    </form>
                    <form action={decideOffer.bind(null, o.id, "afgewezen")}>
                      <button className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
                        {t.reject}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Receipt} title={t.invoices}>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted">{t.noInvoices}</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {i.number}{" "}
                    <span className="text-muted">
                      · {eur(i.amount_cents)}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {dt(i.issued_at, locale)}
                    {i.due_at ? ` → ${dt(i.due_at, locale)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                      i.status,
                    )}`}
                  >
                    {i.status}
                  </span>
                  {i.pdf_url && (
                    <a
                      href={i.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover"
                    >
                      {t.pdf}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={RefreshCcw} title={t.subscription}>
        {subs.length === 0 ? (
          <p className="text-sm text-muted">{t.noSub}</p>
        ) : (
          <div className="space-y-3">
            {subs.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
              >
                <div>
                  <p className="font-semibold tracking-tight">{s.plan}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {eur(s.price_cents)} {t.perMonth} · {t.since}{" "}
                    {dt(s.started_at, locale)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                    s.status,
                  )}`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={LifeBuoy} title={t.tickets}>
        <div className="space-y-4">
          {tickets.length === 0 && (
            <p className="text-sm text-muted">{t.noTickets}</p>
          )}
          {tickets.map((tk) => (
            <div key={tk.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold tracking-tight">{tk.subject}</p>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                    tk.status,
                  )}`}
                >
                  {tk.status}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {(msgsByTicket.get(tk.id) ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl px-4 py-2.5 text-sm ${
                      m.sender === "studio"
                        ? "bg-accent/10"
                        : "bg-background border"
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {m.sender === "studio" ? t.studio : t.you} ·{" "}
                      {dt(m.created_at, locale)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
              {tk.status !== "gesloten" && (
                <form
                  action={replyTicket}
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                >
                  <input type="hidden" name="ticket_id" value={tk.id} />
                  <input
                    name="body"
                    required
                    placeholder={t.message}
                    className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                    {t.reply}
                  </button>
                </form>
              )}
            </div>
          ))}

          <form
            action={openTicket}
            className="rounded-2xl border border-dashed bg-card/50 p-5"
          >
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
              {t.newTicket}
            </p>
            <input
              name="subject"
              required
              placeholder={t.subject}
              className="mb-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <textarea
              name="body"
              required
              rows={3}
              placeholder={t.message}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button className="mt-3 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
              {t.send}
            </button>
          </form>
        </div>
      </Section>
    </main>
  );
}
