import Link from "next/link";
import {
  Activity,
  Eye,
  MousePointerClick,
  Mail,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  Globe,
  Clock,
  Sparkles,
  Inbox,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

const eur = (cents: number | null | undefined) =>
  cents == null
    ? "—"
    : "€ " +
      (cents / 100).toLocaleString("nl-BE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("nl-BE", {
        timeZone: "Europe/Brussels",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function relative(iso: string) {
  const d = new Date(iso);
  const m = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (m < 1) return "net";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}u`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export default async function AdminWebActivity() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const db = getSupabaseAdmin();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const last30 = new Date(now.getTime() - 30 * 86_400_000);
  const last7 = new Date(now.getTime() - 7 * 86_400_000);
  const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);

  // Parallel-data-fetches — alles via 1 db-trip waar mogelijk.
  const [
    scanReqsToday,
    scanReqsWeek,
    scanReqs30d,
    quotesToday,
    quotesWeek,
    healthChecksToday,
    healthChecksAll,
    outreachSentToday,
    outreachSentWeek,
    outreachSentAll,
    ticketsActive,
    recentScans,
    recentQuotes,
    recentHealthChecks,
    recentOutreach,
    activeNow,
  ] = await Promise.all([
    db
      .from("scan_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    db
      .from("scan_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last7.toISOString()),
    db
      .from("scan_requests")
      .select("created_at, locale, url, email")
      .gte("created_at", last30.toISOString())
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    db
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last7.toISOString()),
    db
      .from("health_checks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    db
      .from("health_checks")
      .select("id, name, email, website, package, status, amount_cents, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("prospect_outreach")
      .select("prospect_id", { count: "exact", head: true })
      .gte("mail_sent_at", todayStart.toISOString()),
    db
      .from("prospect_outreach")
      .select("prospect_id", { count: "exact", head: true })
      .gte("mail_sent_at", last7.toISOString()),
    db
      .from("prospect_outreach")
      .select("prospect_id", { count: "exact", head: true })
      .not("mail_sent_at", "is", null),
    db
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "gesloten"),
    db
      .from("scan_requests")
      .select("created_at, url, email, locale")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("quotes")
      .select("created_at, name, email, est_high, source")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("health_checks")
      .select("created_at, name, email, website, package, status, amount_cents")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("prospect_outreach")
      .select("mail_sent_at, mail_to, land, scan_score, scan_grade")
      .not("mail_sent_at", "is", null)
      .order("mail_sent_at", { ascending: false })
      .limit(10),
    db
      .from("scan_requests")
      .select("created_at")
      .gte("created_at", fiveMinAgo.toISOString()),
  ]);

  // Trend laatste 30 dagen: scan_requests per dag.
  type Row = { created_at: string; locale?: string; url?: string };
  const scanRows = (scanReqs30d.data as Row[]) ?? [];
  const trend = Array.from({ length: 30 }, (_, k) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - (29 - k));
    const ymd = dt.toISOString().slice(0, 10);
    return {
      label: dt.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" }),
      value: scanRows.filter((r) => r.created_at.startsWith(ymd)).length,
    };
  });

  // Verdeling per locale
  const byLocale = new Map<string, number>();
  for (const r of scanRows) {
    const l = (r.locale ?? "nl").toLowerCase();
    byLocale.set(l, (byLocale.get(l) ?? 0) + 1);
  }
  const localeSegs = [
    { key: "nl", label: "🇳🇱 Nederlands", color: "var(--accent)" },
    { key: "fr", label: "🇫🇷 Français", color: "#0ea5e9" },
    { key: "en", label: "🇬🇧 English", color: "#16a34a" },
  ]
    .map((s) => ({ ...s, value: byLocale.get(s.key) ?? 0 }))
    .filter((s) => s.value > 0);

  // Top-domeinen (uit scanned URLs)
  const domCount = new Map<string, number>();
  for (const r of scanRows) {
    if (!r.url) continue;
    let host = "";
    try {
      host = new URL(r.url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    if (!host) continue;
    domCount.set(host, (domCount.get(host) ?? 0) + 1);
  }
  const topDomains = [...domCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  // Health-check-sales-overzicht
  const hcAll = (healthChecksAll.data as Array<{
    status?: string;
    amount_cents?: number;
    package?: string;
  }> | null) ?? [];
  const hcPaid = hcAll.filter((h) => h.status === "betaald");
  const hcRevenueToday =
    (recentHealthChecks.data as Array<{
      created_at: string;
      status?: string;
      amount_cents?: number;
    }> | null)
      ?.filter(
        (h) =>
          h.status === "betaald" &&
          h.created_at.slice(0, 10) === now.toISOString().slice(0, 10),
      )
      .reduce((s, h) => s + (h.amount_cents ?? 0), 0) ?? 0;
  const hcRevenueTotal = hcPaid.reduce(
    (s, h) => s + (h.amount_cents ?? 0),
    0,
  );

  // Trafiek per tijdstip (laatste 24u, per uur)
  const last24 = new Date(now.getTime() - 24 * 60 * 60_000);
  const hours = Array.from({ length: 24 }, (_, k) => {
    const dt = new Date(now.getTime() - (23 - k) * 60 * 60_000);
    const hr = dt.getHours();
    const startMs = new Date(dt).setMinutes(0, 0, 0);
    const endMs = startMs + 60 * 60_000;
    return {
      label: `${String(hr).padStart(2, "0")}u`,
      value: scanRows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= startMs && t < endMs;
      }).length,
    };
  });
  void last24;

  // Activity feed: laatste 20 events uit alle bronnen, gemerged
  type Event = {
    when: string;
    kind: "scan" | "quote" | "health" | "mail";
    title: string;
    sub: string;
    badge?: string;
  };
  const feed: Event[] = [];
  for (const r of (recentScans.data as Array<{
    created_at: string;
    url?: string;
    email?: string;
    locale?: string;
  }> | null) ?? []) {
    feed.push({
      when: r.created_at,
      kind: "scan",
      title: r.url ? r.url.replace(/^https?:\/\//, "") : "(onbekende URL)",
      sub: `${r.email ?? "—"} · ${(r.locale ?? "nl").toUpperCase()}`,
    });
  }
  for (const r of (recentQuotes.data as Array<{
    created_at: string;
    name?: string;
    email?: string;
    est_high?: number;
    source?: string;
  }> | null) ?? []) {
    feed.push({
      when: r.created_at,
      kind: "quote",
      title: r.name ?? "(geen naam)",
      sub: `${r.email ?? "—"}${r.est_high ? ` · ~€${r.est_high}` : ""}`,
      badge: r.source ?? undefined,
    });
  }
  for (const r of (recentHealthChecks.data as Array<{
    created_at: string;
    name?: string;
    email?: string;
    website?: string;
    package?: string;
    status?: string;
    amount_cents?: number;
  }> | null) ?? []) {
    feed.push({
      when: r.created_at,
      kind: "health",
      title: r.name ?? r.email ?? "(Health Check)",
      sub: `${r.website ?? "—"} · ${r.package ?? "—"} · ${r.status ?? "—"}${r.amount_cents ? ` · ${eur(r.amount_cents)}` : ""}`,
      badge: r.status,
    });
  }
  for (const r of (recentOutreach.data as Array<{
    mail_sent_at: string;
    mail_to?: string;
    land?: string;
    scan_score?: number;
    scan_grade?: string;
  }> | null) ?? []) {
    feed.push({
      when: r.mail_sent_at,
      kind: "mail",
      title: r.mail_to ?? "(geen adres)",
      sub: `${(r.land ?? "?").toUpperCase()} · score ${r.scan_score ?? "?"} (${r.scan_grade ?? "-"})`,
    });
  }
  feed.sort((a, b) => (a.when < b.when ? 1 : -1));
  const feedTop = feed.slice(0, 24);

  const activeNowCount = activeNow.data?.length ?? 0;

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <Activity className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Web-activiteit
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Real-time overzicht van wat er gebeurt op studio-vm.be —
              bezoek, scans, leads, sales en outreach in één blik.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live-pulse */}
          <span className="relative inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {activeNowCount} actief
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Clock className="h-3 w-3" strokeWidth={2.5} />
            {now.toLocaleTimeString("nl-BE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* KPI-strip — 6 metingen */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi
          icon={Eye}
          label="Scans vandaag"
          value={String(scanReqsToday.count ?? 0)}
          hint={`${scanReqsWeek.count ?? 0} deze week`}
          tone="accent"
        />
        <Kpi
          icon={Inbox}
          label="Aanvragen vandaag"
          value={String(quotesToday.count ?? 0)}
          hint={`${quotesWeek.count ?? 0} deze week`}
        />
        <Kpi
          icon={ShoppingCart}
          label="Health Checks vandaag"
          value={String(healthChecksToday.count ?? 0)}
          hint={`${hcPaid.length} totaal betaald`}
          tone={hcPaid.length > 0 ? "good" : "neutral"}
        />
        <Kpi
          icon={Mail}
          label="Mails vandaag verstuurd"
          value={String(outreachSentToday.count ?? 0)}
          hint={`${outreachSentWeek.count ?? 0} deze week · ${outreachSentAll.count ?? 0} totaal`}
        />
        <Kpi
          icon={TrendingUp}
          label="Omzet vandaag"
          value={hcRevenueToday > 0 ? eur(hcRevenueToday) : "€ 0"}
          hint={`${eur(hcRevenueTotal)} totaal`}
          tone={hcRevenueToday > 0 ? "good" : "neutral"}
        />
        <Kpi
          icon={MessageSquare}
          label="Open tickets"
          value={String(ticketsActive.count ?? 0)}
          hint="vereisen reactie"
          tone={(ticketsActive.count ?? 0) > 0 ? "bad" : "good"}
        />
      </div>

      {/* Grafieken — eerste rij: trend 30d + locale-mix */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Scans — laatste 30 dagen">
            <TrendChart
              id="web-30d"
              color="var(--accent)"
              height={180}
              points={trend}
            />
          </ChartCard>
        </div>
        <ChartCard title="Per taal">
          {localeSegs.length === 0 ? (
            <p className="text-sm text-muted">Geen scans deze maand.</p>
          ) : (
            <Donut
              segments={localeSegs}
              centerTop={String(scanRows.length)}
              centerSub="scans"
            />
          )}
        </ChartCard>
      </div>

      {/* Tweede rij: uur-distributie + top-domeinen */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Activiteit per uur (laatste 24u)">
          <TrendChart
            id="web-24h"
            color="#0ea5e9"
            height={160}
            points={hours}
          />
        </ChartCard>
        <ChartCard title="Top 10 gescande sites">
          {topDomains.length === 0 ? (
            <p className="text-sm text-muted">
              Nog geen gescande sites in deze periode.
            </p>
          ) : (
            <BarList items={topDomains} color="var(--accent)" />
          )}
        </ChartCard>
      </div>

      {/* Activity feed */}
      <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Sparkles className="h-3 w-3" strokeWidth={2.5} />
            Laatste activiteit
          </p>
          <span className="font-mono text-[10px] text-muted">
            {feedTop.length} events
          </span>
        </div>
        {feedTop.length === 0 ? (
          <p className="mt-6 rounded-xl bg-background/30 p-6 text-center text-sm text-muted">
            Nog geen activiteit. Engine is gestart maar wacht op de eerste
            bezoekers/sends.
          </p>
        ) : (
          <ul className="mt-4 space-y-1">
            {feedTop.map((e, i) => (
              <FeedRow key={i} event={e} />
            ))}
          </ul>
        )}
      </div>

      {/* Quick-links naar diepere views */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/scans"
          icon={Eye}
          label="Alle scans"
          desc="Detail per scan + score"
        />
        <QuickLink
          href="/admin/aanvragen"
          icon={Inbox}
          label="Aanvragen"
          desc="Builder/configurator inzendingen"
        />
        <QuickLink
          href="/admin/outreach"
          icon={Mail}
          label="Outreach-engine"
          desc="Queue + verzonden mails"
        />
        <QuickLink
          href="/admin/facturen"
          icon={CheckCircle2}
          label="Facturen"
          desc="Health Check + andere"
        />
      </div>
    </>
  );
}

// Kompacte KPI-tile (uniform met andere admin-views).
function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "accent";
}) {
  const toneCls =
    tone === "good"
      ? "text-green-600 dark:text-green-400"
      : tone === "bad"
        ? "text-red-500"
        : tone === "accent"
          ? "text-accent"
          : "text-foreground";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted" strokeWidth={2} />
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}

function FeedRow({
  event,
}: {
  event: {
    when: string;
    kind: "scan" | "quote" | "health" | "mail";
    title: string;
    sub: string;
    badge?: string;
  };
}) {
  const cfg: Record<
    typeof event.kind,
    { icon: typeof Activity; bg: string; color: string; label: string }
  > = {
    scan: {
      icon: Eye,
      bg: "bg-accent/15",
      color: "text-accent",
      label: "Scan",
    },
    quote: {
      icon: MousePointerClick,
      bg: "bg-sky-500/15",
      color: "text-sky-600 dark:text-sky-400",
      label: "Aanvraag",
    },
    health: {
      icon: ShoppingCart,
      bg: "bg-green-500/15",
      color: "text-green-600 dark:text-green-400",
      label: "Health Check",
    },
    mail: {
      icon: Mail,
      bg: "bg-purple-500/15",
      color: "text-purple-600 dark:text-purple-400",
      label: "Mail uit",
    },
  };
  const c = cfg[event.kind];
  const Icon = c.icon;
  return (
    <li className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background/40">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${c.bg} ${c.color}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          <span className="truncate">{event.title}</span>
          {event.badge && (
            <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted">
              {event.badge}
            </span>
          )}
        </p>
        <p className="truncate font-mono text-[10px] text-muted">
          <span className={c.color}>{c.label}</span> · {event.sub}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted">
        {relative(event.when)}
      </span>
    </li>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: typeof Activity;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm transition-all hover:bg-card-hover hover:shadow-md"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-[11px] text-muted">{desc}</p>
      </div>
      <ExternalLink
        className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
      {/* Globe-marker mt undefined keeps prop alive */}
      <span className="sr-only">
        <Globe className="h-0 w-0" />
      </span>
    </Link>
  );
}
