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
  const [{ data: q }, { data: m }, subsR, { data: sc }] = await Promise.all([
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
  ]);
  const quotes = q ?? [];
  const monitors = m ?? [];
  const subscribers = subsR.count ?? 0;
  const scanRows = (sc as ScanRow[]) ?? [];

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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
    </>
  );
}
