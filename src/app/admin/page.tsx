import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import type { ScanResult } from "@/app/actions/scan";

export const dynamic = "force-dynamic";

type ScanRow = {
  id: string;
  email: string;
  url: string;
  token: string;
  locale: string;
  scan: ScanResult;
  created_at: string;
};

const DAY = 86_400_000;

function weekBuckets<T>(rows: T[], at: (r: T) => string) {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weeks = Array.from({ length: 8 }, (_, i) => ({
    start: new Date(monday.getTime() - (7 - i) * 7 * DAY),
    count: 0,
  }));
  for (const r of rows) {
    const t = new Date(at(r)).getTime();
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (t >= weeks[i].start.getTime()) {
        weeks[i].count++;
        break;
      }
    }
  }
  return weeks;
}

export default async function AdminDashboard() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const db = getSupabaseAdmin();
  const [
    { data: q },
    { data: m },
    subsR,
    { data: sc },
    { data: offR },
    { data: invR },
    { data: subRows },
    { data: formR },
  ] = await Promise.all([
    db
      .from("quotes")
      .select("id, name, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    db.from("monitors").select("id, active").limit(500),
    db
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    db
      .from("scan_requests")
      .select("id, email, url, token, locale, scan, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    db
      .from("offers")
      .select("id, client_email, title, amount_cents, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("invoices")
      .select("id, client_email, number, amount_cents, status, issued_at")
      .order("issued_at", { ascending: false })
      .limit(500),
    db
      .from("subscriptions")
      .select("client_email, price_cents, period, status")
      .limit(1000),
    db
      .from("form_submissions")
      .select("id, client_email, visitor_name, visitor_email, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const quotes = q ?? [];
  const monitors = m ?? [];
  const subscribers = subsR.count ?? 0;
  const scanRows = (sc as ScanRow[]) ?? [];

  type Off = {
    id: string;
    client_email: string;
    title: string;
    amount_cents: number | null;
    status: string;
    created_at: string;
  };
  type Inv = {
    id: string;
    client_email: string;
    number: string;
    amount_cents: number;
    status: string;
    issued_at: string;
  };
  type SubR = {
    client_email: string;
    price_cents: number;
    period: string;
    status: string;
  };
  type Form = {
    id: string;
    client_email: string;
    visitor_name: string;
    visitor_email: string;
    is_read: boolean;
    created_at: string;
  };
  const offers = (offR as Off[]) ?? [];
  const invoices = (invR as Inv[]) ?? [];
  const subList = (subRows as SubR[]) ?? [];
  const forms = (formR as Form[]) ?? [];

  const eur = (c: number) => `€ ${(c / 100).toFixed(2)}`;
  const mrr = subList
    .filter((s) => s.status === "actief")
    .reduce(
      (t, s) =>
        t +
        (/jaar|year|annu/i.test(s.period)
          ? Math.round(s.price_cents / 12)
          : s.price_cents),
      0,
    );
  const openInvoiceTotal = invoices
    .filter((i) => i.status === "open")
    .reduce((t, i) => t + i.amount_cents, 0);
  const now = new Date();
  const ymThis = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paidThisMonth = invoices
    .filter((i) => i.status === "betaald" && i.issued_at.startsWith(ymThis))
    .reduce((t, i) => t + i.amount_cents, 0);
  const openOfferValue = offers
    .filter((o) => o.status === "open")
    .reduce((t, o) => t + (o.amount_cents ?? 0), 0);
  const unreadForms = forms.filter((f) => !f.is_read).length;

  const money = [
    { k: "MRR", v: eur(mrr), href: "/admin/abonnementen" },
    {
      k: "Openstaand",
      v: eur(openInvoiceTotal),
      href: "/admin/facturen?status=open",
    },
    {
      k: "Betaald deze maand",
      v: eur(paidThisMonth),
      href: "/admin/facturen?status=betaald",
    },
    {
      k: "Open offertes",
      v: eur(openOfferValue),
      href: "/admin/offertes?status=open",
    },
  ];

  type Activity = {
    at: string;
    label: string;
    sub: string;
    href: string;
  };
  const activity: Activity[] = [
    ...offers.slice(0, 12).map((o) => ({
      at: o.created_at,
      label: `Offerte · ${o.title}`,
      sub: `${o.client_email} · ${o.status}`,
      href: `/admin/klanten/${encodeURIComponent(o.client_email)}?tab=offertes`,
    })),
    ...invoices.slice(0, 12).map((i) => ({
      at: i.issued_at,
      label: `Factuur ${i.number} · ${eur(i.amount_cents)}`,
      sub: `${i.client_email} · ${i.status}`,
      href: `/admin/klanten/${encodeURIComponent(i.client_email)}?tab=facturen`,
    })),
    ...forms.slice(0, 12).map((f) => ({
      at: f.created_at,
      label: `Formulier · ${f.visitor_name || f.visitor_email || "bezoeker"}`,
      sub: `${f.client_email}${f.is_read ? "" : " · nieuw"}`,
      href: "/admin/formulieren",
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

  const okScans = scanRows
    .map((r) => (r.scan && r.scan.ok ? r.scan : null))
    .filter((s): s is ScanResult & { ok: true } => s != null);
  const uniqueClients = new Set(
    scanRows.map((r) => r.email?.toLowerCase().trim()).filter(Boolean),
  ).size;
  const avgScore =
    okScans.length > 0
      ? Math.round(
          okScans.reduce((s, x) => s + x.score, 0) / okScans.length,
        )
      : 0;

  const stats = [
    { k: "Aanvragen", v: quotes.length, href: "/admin/aanvragen" },
    {
      k: "Nieuw",
      v: quotes.filter((r) => r.status === "nieuw").length,
      href: "/admin/aanvragen?status=nieuw",
    },
    {
      k: "Builder",
      v: quotes.filter((r) => r.source === "builder").length,
      href: "/admin/aanvragen?src=builder",
    },
    { k: "Scans", v: scanRows.length, href: "/admin/scans" },
    { k: "Klanten", v: uniqueClients, href: "/admin/klanten" },
    { k: "Gem. score", v: avgScore, href: "/admin/scans" },
    {
      k: "Monitors actief",
      v: monitors.filter((r) => r.active).length,
      href: "/admin/monitors",
    },
    { k: "Abonnees", v: subscribers, href: "/admin/newsletter" },
  ];

  const aanvraagWeeks = weekBuckets(quotes, (r) => r.created_at);
  const aMax = Math.max(1, ...aanvraagWeeks.map((w) => w.count));
  const scanWeeks = weekBuckets(scanRows, (r) => r.created_at);
  const sMax = Math.max(1, ...scanWeeks.map((w) => w.count));

  const SOURCES = [
    { key: "builder", label: "Builder" },
    { key: "offerte-calculator", label: "Offerte" },
    { key: "contact", label: "Contact" },
  ];
  const known = new Set(SOURCES.map((s) => s.key));
  const bySource = [
    ...SOURCES.map((s) => ({
      label: s.label,
      n: quotes.filter((r) => r.source === s.key).length,
    })),
    {
      label: "Overig",
      n: quotes.filter((r) => !r.source || !known.has(r.source)).length,
    },
  ];
  const srcMax = Math.max(1, ...bySource.map((s) => s.n));

  const buckets = [
    {
      label: "Zwak (0–44)",
      n: okScans.filter((s) => s.score < 45).length,
      bar: "bg-red-500/70",
    },
    {
      label: "Degelijk (45–74)",
      n: okScans.filter((s) => s.score >= 45 && s.score < 75).length,
      bar: "bg-amber-500/70",
    },
    {
      label: "Sterk (75–100)",
      n: okScans.filter((s) => s.score >= 75).length,
      bar: "bg-green-500/70",
    },
  ];
  const bMax = Math.max(1, ...buckets.map((b) => b.n));

  const platformMap = new Map<string, number>();
  for (const s of okScans) {
    const k = (s.stack || "Onbekend").trim();
    platformMap.set(k, (platformMap.get(k) ?? 0) + 1);
  }
  const platforms = [...platformMap.entries()]
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const pMax = Math.max(1, ...platforms.map((p) => p.n));

  const gradeColor = (score: number) =>
    score >= 75
      ? "text-green-600 dark:text-green-400"
      : score >= 45
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-500";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {money.map((s) => (
          <Link
            key={s.k}
            href={s.href}
            className="rounded-2xl border border-accent/30 bg-accent/5 p-5 transition-colors hover:bg-accent/10"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              {s.k}
            </p>
            <p className="mt-1 truncate text-2xl font-semibold">{s.v}</p>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.k}
            href={s.href}
            className="rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 text-3xl font-semibold">{s.v}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Aanvragen per week
          </p>
          <div className="mt-5 flex h-28 items-end gap-2">
            {aanvraagWeeks.map((w, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="font-mono text-[10px] text-muted">
                  {w.count}
                </span>
                <div
                  className="w-full rounded-t bg-accent/70"
                  style={{ height: `${Math.max(2, (w.count / aMax) * 100)}%` }}
                />
                <span className="font-mono text-[9px] text-muted">
                  {w.start.toLocaleDateString("nl-BE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Aanvragen per bron
          </p>
          <div className="mt-5 space-y-3">
            {bySource.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>{s.label}</span>
                  <span>{s.n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{ width: `${(s.n / srcMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Scans per week
          </p>
          <div className="mt-5 flex h-28 items-end gap-2">
            {scanWeeks.map((w, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span className="font-mono text-[10px] text-muted">
                  {w.count}
                </span>
                <div
                  className="w-full rounded-t bg-sky-500/60"
                  style={{ height: `${Math.max(2, (w.count / sMax) * 100)}%` }}
                />
                <span className="font-mono text-[9px] text-muted">
                  {w.start.toLocaleDateString("nl-BE", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Score-verdeling gescande sites
          </p>
          <div className="mt-5 space-y-3">
            {buckets.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>{b.label}</span>
                  <span>{b.n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
                  <div
                    className={`h-full rounded-full ${b.bar}`}
                    style={{ width: `${(b.n / bMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 font-mono text-[10px] text-muted">
              Gemiddelde score: {avgScore}/100 over {okScans.length} scans
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Platforms van prospects
          </p>
          <div className="mt-5 space-y-3">
            {platforms.length === 0 && (
              <p className="text-sm text-muted">Nog geen scans.</p>
            )}
            {platforms.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span className="truncate">{p.label}</span>
                  <span>{p.n}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{ width: `${(p.n / pMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Recentste scans
            </p>
            <Link
              href="/admin/scans"
              className="text-xs text-muted hover:text-foreground"
            >
              Alle scans →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {scanRows.length === 0 && (
              <li className="py-4 text-sm text-muted">Nog geen scans.</li>
            )}
            {scanRows.slice(0, 6).map((r) => {
              const s = r.scan && r.scan.ok ? r.scan : null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/admin/scans/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition-opacity hover:opacity-80"
                  >
                    <span className="min-w-0">
                      {s && (
                        <strong className={`mr-2 font-mono ${gradeColor(s.score)}`}>
                          {s.grade}·{s.score}
                        </strong>
                      )}
                      <span className="text-muted">{r.email}</span>
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {(s ? s.host : r.url).slice(0, 28)} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("nl-BE")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Recentste aanvragen
        </h2>
        <Link
          href="/admin/aanvragen"
          className="text-xs text-muted hover:text-foreground"
        >
          Alle aanvragen →
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border bg-card">
        {quotes.length === 0 && (
          <li className="p-5 text-sm text-muted">Nog geen aanvragen.</li>
        )}
        {quotes.slice(0, 6).map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
          >
            <span>
              <strong>{r.name}</strong>{" "}
              <span className="text-muted">· {r.email}</span>
            </span>
            <span className="font-mono text-xs text-muted">
              {r.source === "builder" && (
                <span className="mr-2 rounded bg-accent/15 px-1.5 py-0.5 text-accent">
                  BUILDER
                </span>
              )}
              {r.status} ·{" "}
              {new Date(r.created_at).toLocaleDateString("nl-BE")}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
          Recente activiteit
          {unreadForms > 0 && (
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
              {unreadForms} nieuw formulier{unreadForms === 1 ? "" : "en"}
            </span>
          )}
        </h2>
      </div>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border bg-card">
        {activity.length === 0 && (
          <li className="p-5 text-sm text-muted">Nog geen activiteit.</li>
        )}
        {activity.map((a, i) => (
          <li key={i}>
            <Link
              href={a.href}
              className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm transition-colors hover:bg-card-hover"
            >
              <span className="min-w-0">
                <strong>{a.label}</strong>{" "}
                <span className="text-muted">· {a.sub}</span>
              </span>
              <span className="font-mono text-xs text-muted">
                {new Date(a.at).toLocaleDateString("nl-BE")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
