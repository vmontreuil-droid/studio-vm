import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  eur,
  dt,
  badge,
  PORTAL_T,
  type ScanRow,
  type Offer,
  type Invoice,
  type Sub,
  type Ticket,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const X: Record<Locale, { hi: string; sub: string; latestScan: string; openOffers: string; openInvoices: string; openTickets: string; sub2: string; none: string; go: string }> = {
  nl: {
    hi: "Welkom terug",
    sub: "Hier staat alles op één plek — je analyses, offertes, facturen, abonnement en support.",
    latestScan: "Laatste scan",
    openOffers: "Open offertes",
    openInvoices: "Openstaand",
    openTickets: "Open tickets",
    sub2: "Abonnement",
    none: "—",
    go: "Bekijken",
  },
  fr: {
    hi: "Bon retour",
    sub: "Tout au même endroit — vos analyses, devis, factures, abonnement et support.",
    latestScan: "Dernier scan",
    openOffers: "Devis ouverts",
    openInvoices: "À payer",
    openTickets: "Tickets ouverts",
    sub2: "Abonnement",
    none: "—",
    go: "Voir",
  },
  en: {
    hi: "Welcome back",
    sub: "Everything in one place — your analyses, quotes, invoices, subscription and support.",
    latestScan: "Latest scan",
    openOffers: "Open quotes",
    openInvoices: "Outstanding",
    openTickets: "Open tickets",
    sub2: "Subscription",
    none: "—",
    go: "View",
  },
};

export default async function PortalOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = PORTAL_T[locale];
  const x = X[locale];
  const base = `/${locale}/portail/dashboard`;

  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();

  const [scansR, offersR, invoicesR, subsR, ticketsR] = await Promise.all([
    sb
      .from("scan_requests")
      .select("token, url, scan, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    sb.from("offers").select("*").order("created_at", { ascending: false }),
    sb.from("invoices").select("*").order("issued_at", { ascending: false }),
    sb.from("subscriptions").select("*").order("created_at", { ascending: false }),
    sb.from("tickets").select("*").order("updated_at", { ascending: false }),
  ]);
  const scans = (scansR.data as ScanRow[]) ?? [];
  const offers = (offersR.data as Offer[]) ?? [];
  const invoices = (invoicesR.data as Invoice[]) ?? [];
  const subs = (subsR.data as Sub[]) ?? [];
  const tickets = (ticketsR.data as Ticket[]) ?? [];

  const latest = scans[0];
  const latestOk = latest && latest.scan && latest.scan.ok ? latest.scan : null;
  const openOffers = offers.filter((o) => o.status === "open").length;
  const openInvoiceSum = invoices
    .filter((i) => i.status === "open")
    .reduce((s, i) => s + i.amount_cents, 0);
  const openTickets = tickets.filter((tk) => tk.status !== "gesloten").length;
  const activeSub = subs.find((s) => s.status === "actief") ?? subs[0];

  const cards = [
    {
      k: x.latestScan,
      v: latestOk ? `${latestOk.grade} · ${latestOk.score}` : x.none,
      href: `${base}/scans`,
    },
    { k: x.openOffers, v: String(openOffers), href: `${base}/offertes` },
    {
      k: x.openInvoices,
      v: openInvoiceSum ? eur(openInvoiceSum) : x.none,
      href: `${base}/facturen`,
    },
    {
      k: x.sub2,
      v: activeSub ? activeSub.plan : x.none,
      href: `${base}/abonnement`,
    },
    { k: x.openTickets, v: String(openTickets), href: `${base}/tickets` },
  ];

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {x.hi}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.overview}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{x.sub}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.k}
            href={c.href}
            className="rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {c.k}
            </p>
            <p className="mt-1 truncate text-2xl font-semibold">{c.v}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 space-y-3">
        {offers
          .filter((o) => o.status === "open")
          .slice(0, 3)
          .map((o) => (
            <Link
              key={o.id}
              href={`${base}/offertes`}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              <span className="min-w-0">
                <span className="font-medium">{o.title}</span>{" "}
                <span className="text-muted">· {eur(o.amount_cents)}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  o.status,
                )}`}
              >
                {o.status}
              </span>
            </Link>
          ))}
        {latest && (
          <Link
            href={localePath(locale, `/portail/scan/${latest.token}`)}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <span className="min-w-0">
              <span className="font-medium">
                {latestOk ? latestOk.host : latest.url}
              </span>{" "}
              <span className="text-muted">· {dt(latest.created_at, locale)}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
          </Link>
        )}
      </div>
    </>
  );
}
