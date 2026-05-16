import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Gauge,
  FileText,
  Receipt,
  RefreshCcw,
  LifeBuoy,
  Globe,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type ScanRow,
  type Offer,
  type Invoice,
  type Sub,
  type Ticket,
  type Site,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const X: Record<
  Locale,
  {
    hi: string;
    sub: string;
    latestScan: string;
    openOffers: string;
    openInvoices: string;
    openTickets: string;
    sub2: string;
    site: string;
    none: string;
    needsYou: string;
    activity: string;
    noActivity: string;
    quick: string;
    review: string;
    siteStatus: Record<string, string>;
    kind: Record<string, string>;
  }
> = {
  nl: {
    hi: "Welkom terug",
    sub: "Alles op één plek — je analyses, website, offertes, facturen, abonnement en support.",
    latestScan: "Laatste scan",
    openOffers: "Open offertes",
    openInvoices: "Openstaand",
    openTickets: "Open tickets",
    sub2: "Abonnement",
    site: "Website",
    none: "—",
    needsYou: "Wacht op jou",
    activity: "Recente activiteit",
    noActivity: "Nog niets te tonen. Zodra er iets gebeurt verschijnt het hier.",
    quick: "Snel naar",
    review: "Bekijk en beslis",
    siteStatus: {
      in_aanbouw: "in aanbouw",
      online: "online",
      onderhoud: "onderhoud",
      offline: "offline",
    },
    kind: {
      offer: "Offerte",
      invoice: "Factuur",
      scan: "Scan",
      ticket: "Ticket",
      site: "Website",
      sub: "Abonnement",
    },
  },
  fr: {
    hi: "Bon retour",
    sub: "Tout au même endroit — analyses, site, devis, factures, abonnement et support.",
    latestScan: "Dernier scan",
    openOffers: "Devis ouverts",
    openInvoices: "À payer",
    openTickets: "Tickets ouverts",
    sub2: "Abonnement",
    site: "Site web",
    none: "—",
    needsYou: "En attente de vous",
    activity: "Activité récente",
    noActivity: "Rien à afficher pour l'instant.",
    quick: "Accès rapide",
    review: "Voir et décider",
    siteStatus: {
      in_aanbouw: "en construction",
      online: "en ligne",
      onderhoud: "maintenance",
      offline: "hors ligne",
    },
    kind: {
      offer: "Devis",
      invoice: "Facture",
      scan: "Scan",
      ticket: "Ticket",
      site: "Site",
      sub: "Abonnement",
    },
  },
  en: {
    hi: "Welcome back",
    sub: "Everything in one place — analyses, website, quotes, invoices, subscription and support.",
    latestScan: "Latest scan",
    openOffers: "Open quotes",
    openInvoices: "Outstanding",
    openTickets: "Open tickets",
    sub2: "Subscription",
    site: "Website",
    none: "—",
    needsYou: "Waiting on you",
    activity: "Recent activity",
    noActivity: "Nothing to show yet.",
    quick: "Quick links",
    review: "Review and decide",
    siteStatus: {
      in_aanbouw: "in progress",
      online: "online",
      onderhoud: "maintenance",
      offline: "offline",
    },
    kind: {
      offer: "Quote",
      invoice: "Invoice",
      scan: "Scan",
      ticket: "Ticket",
      site: "Website",
      sub: "Subscription",
    },
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

  const [scansR, offersR, invoicesR, subsR, ticketsR, sitesR] =
    await Promise.all([
      sb
        .from("scan_requests")
        .select("token, url, scan, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      sb.from("offers").select("*").order("created_at", { ascending: false }),
      sb.from("invoices").select("*").order("issued_at", { ascending: false }),
      sb
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
      sb.from("tickets").select("*").order("updated_at", { ascending: false }),
      sb.from("sites").select("*").order("created_at", { ascending: false }),
    ]);
  const scans = (scansR.data as ScanRow[]) ?? [];
  const offers = (offersR.data as Offer[]) ?? [];
  const invoices = (invoicesR.data as Invoice[]) ?? [];
  const subs = (subsR.data as Sub[]) ?? [];
  const tickets = (ticketsR.data as Ticket[]) ?? [];
  const sites = (sitesR.data as Site[]) ?? [];

  const latest = scans[0];
  const latestOk = latest && latest.scan && latest.scan.ok ? latest.scan : null;
  const openOffers = offers.filter((o) => o.status === "open");
  const openInvoiceSum = invoices
    .filter((i) => i.status === "open")
    .reduce((s, i) => s + i.amount_cents, 0);
  const openTickets = tickets.filter((tk) => tk.status !== "gesloten").length;
  const activeSub = subs.find((s) => s.status === "actief") ?? subs[0];
  const site = sites[0];

  const cards = [
    {
      k: x.latestScan,
      v: latestOk ? `${latestOk.grade} · ${latestOk.score}` : x.none,
      href: `${base}/scans`,
      icon: Gauge,
    },
    {
      k: x.site,
      v: site ? (x.siteStatus[site.status] ?? site.status) : x.none,
      href: `${base}/mijn-website`,
      icon: Globe,
    },
    {
      k: x.openOffers,
      v: String(openOffers.length),
      href: `${base}/offertes`,
      icon: FileText,
    },
    {
      k: x.openInvoices,
      v: openInvoiceSum ? eur(openInvoiceSum) : x.none,
      href: `${base}/betalingen`,
      icon: Receipt,
    },
    {
      k: x.sub2,
      v: activeSub ? activeSub.plan : x.none,
      href: `${base}/abonnement`,
      icon: RefreshCcw,
    },
    {
      k: x.openTickets,
      v: String(openTickets),
      href: `${base}/tickets`,
      icon: LifeBuoy,
    },
  ];

  // Activiteitenfeed over alles heen
  type Feed = { kind: string; label: string; at: string; href: string; status?: string };
  const feed: Feed[] = [];
  for (const o of offers)
    feed.push({
      kind: "offer",
      label: o.title,
      at: o.created_at,
      href: `${base}/offertes`,
      status: o.status,
    });
  for (const i of invoices)
    feed.push({
      kind: "invoice",
      label: `${i.number} · ${eur(i.amount_cents)}`,
      at: i.issued_at,
      href: `${base}/facturen`,
      status: i.status,
    });
  for (const s of scans)
    feed.push({
      kind: "scan",
      label:
        s.scan && s.scan.ok ? `${s.scan.host} · ${s.scan.grade}` : s.url,
      at: s.created_at,
      href: localePath(locale, `/portail/scan/${s.token}`),
    });
  for (const tk of tickets)
    feed.push({
      kind: "ticket",
      label: tk.subject,
      at: tk.created_at,
      href: `${base}/tickets`,
      status: tk.status,
    });
  for (const s of sites)
    feed.push({
      kind: "site",
      label: s.name,
      at: s.created_at,
      href: `${base}/mijn-website`,
      status: s.status,
    });
  feed.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const recent = feed.slice(0, 8);

  return (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {x.hi}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.overview}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{x.sub}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.k}
              href={c.href}
              className="rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.k}
              </p>
              <p className="mt-1 truncate text-xl font-semibold">{c.v}</p>
            </Link>
          );
        })}
      </div>

      {openOffers.length > 0 && (
        <>
          <h2 className="mt-10 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            {x.needsYou}
          </h2>
          <div className="mt-4 space-y-3">
            {openOffers.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href={`${base}/offertes`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-5 transition-colors hover:bg-accent/10"
              >
                <span className="min-w-0">
                  <span className="font-medium">{o.title}</span>{" "}
                  <span className="text-muted">· {eur(o.amount_cents)}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent">
                  {x.review}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-accent">
        {x.activity}
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        {recent.length === 0 && (
          <p className="p-6 text-sm text-muted">{x.noActivity}</p>
        )}
        <ul className="divide-y divide-border">
          {recent.map((f, idx) => (
            <li key={idx}>
              <Link
                href={f.href}
                className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm transition-colors hover:bg-card-hover"
              >
                <span className="min-w-0">
                  <span className="mr-2 rounded bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {x.kind[f.kind] ?? f.kind}
                  </span>
                  <span className="font-medium">{f.label}</span>
                </span>
                <span className="flex items-center gap-3">
                  {f.status && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${badge(
                        f.status,
                      )}`}
                    >
                      {statusLabel(f.status, locale)}
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted">
                    {dt(f.at, locale)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
