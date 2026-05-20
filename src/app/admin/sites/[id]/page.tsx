import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Gauge,
  ShieldAlert,
  Activity,
  Layers,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { BarList, ChartCard } from "@/components/charts";
import { FIND } from "@/lib/scan-findings";
import { scanOneSite, siteIssueToTicket } from "@/app/actions/sites-admin";
import { MY_SITES } from "@/lib/my-sites";

export const dynamic = "force-dynamic";

type Scan = {
  scanned_at: string;
  score: number | null;
  grade: string | null;
  stack: string | null;
  cert_days_left: number | null;
  critical_count: number | null;
  snapshot: Record<string, unknown> | null;
};

const fmtDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDateShort = (d: string) =>
  new Date(d).toLocaleDateString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
  });

const scoreCls = (s: number) =>
  s < 45
    ? "text-red-600 dark:text-red-400 border-red-500"
    : s < 65
      ? "text-amber-600 dark:text-amber-400 border-amber-500"
      : "text-green-600 dark:text-green-400 border-green-500";

export default async function AdminSiteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;

  const db = getSupabaseAdmin();
  const { data: monRow } = await db
    .from("monitors")
    .select("id, url, email, locale, token, last_scan_at, active")
    .eq("id", id)
    .maybeSingle();
  const mon = monRow as {
    id: string;
    url: string;
    email: string;
    locale: string;
    token: string;
    last_scan_at: string | null;
    active: boolean;
  } | null;
  if (!mon) notFound();

  const { data: scansRaw } = await db
    .from("monitor_scans")
    .select(
      "scanned_at, score, grade, stack, cert_days_left, critical_count, snapshot",
    )
    .eq("monitor_id", mon.id)
    .order("scanned_at", { ascending: false })
    .limit(200);
  const scans = (scansRaw as Scan[]) ?? [];
  const isPing = (sc: Scan) =>
    (sc.snapshot as Record<string, unknown> | null)?.kind === "ping";

  const deepScans = scans.filter((s) => !isPing(s) && s.score != null);
  const pings = scans.filter((s) => isPing(s));
  const latestDeep = deepScans[0] ?? null;
  const latest = scans[0] ?? null;
  const prevDeep = deepScans[1] ?? null;

  const myMeta = MY_SITES.find((s) => s.url === mon.url) ?? null;
  const siteName = myMeta?.name ?? new URL(mon.url).hostname;

  const latestSnap = (latestDeep?.snapshot ?? {}) as Record<string, unknown>;
  const pitfalls = Array.isArray(latestSnap.pitfalls)
    ? (latestSnap.pitfalls as unknown[]).map(String).filter(Boolean)
    : [];
  const categories =
    Array.isArray(latestSnap.categories) && latestSnap.categories
      ? (latestSnap.categories as { cat: string; score: number }[])
      : [];
  const techArr =
    Array.isArray(latestSnap.technologies) && latestSnap.technologies
      ? (latestSnap.technologies as { name: string; type: string }[])
      : [];

  // Score-trend laatste 30 diepe scans (oldest → newest voor grafiek).
  const scoreTrend = [...deepScans]
    .slice(0, 30)
    .reverse()
    .map((s) => ({
      label: fmtDateShort(s.scanned_at),
      value: s.score ?? 0,
    }));

  // Response-tijd-trend uit pings (oldest → newest, laatste 30).
  const responseTrend = [...pings]
    .filter((p) => {
      const sn = p.snapshot as Record<string, unknown> | null;
      return typeof sn?.responseMs === "number";
    })
    .slice(0, 30)
    .reverse()
    .map((p) => {
      const sn = p.snapshot as Record<string, unknown>;
      return {
        label: fmtDateShort(p.scanned_at),
        value: (sn.responseMs as number) ?? 0,
      };
    });

  // Critical-count-trend
  const critTrend = [...deepScans]
    .slice(0, 30)
    .reverse()
    .map((s) => ({
      label: fmtDateShort(s.scanned_at),
      value: s.critical_count ?? 0,
    }));

  const scoreDelta =
    latestDeep && prevDeep && latestDeep.score != null && prevDeep.score != null
      ? latestDeep.score - prevDeep.score
      : null;

  return (
    <>
      <Link
        href="/admin/sites"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Terug naar sites
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{siteName}</h1>
          <a
            href={mon.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-accent underline"
          >
            {mon.url.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
          </a>
          <p className="mt-1 font-mono text-[11px] text-muted">
            Laatste check: {fmtDateTime(latest?.scanned_at ?? mon.last_scan_at)}{" "}
            · Diepe scan: {fmtDateTime(latestDeep?.scanned_at ?? null)}
          </p>
        </div>
        <form action={scanOneSite}>
          <input type="hidden" name="url" value={mon.url} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            Scan nu
          </button>
        </form>
      </div>

      {/* KPI strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Gauge}
          label="Score"
          value={
            latestDeep?.score != null
              ? `${latestDeep.grade ?? "?"} · ${latestDeep.score}`
              : "—"
          }
          hint={
            scoreDelta != null
              ? `${scoreDelta >= 0 ? "+" : ""}${scoreDelta} vs vorige`
              : "geen vergelijking"
          }
          tone={
            !latestDeep?.score
              ? "neutral"
              : latestDeep.score >= 75
                ? "good"
                : latestDeep.score >= 45
                  ? "neutral"
                  : "bad"
          }
        />
        <Stat
          icon={ShieldAlert}
          label="SSL"
          value={
            latestDeep?.cert_days_left != null
              ? `${latestDeep.cert_days_left}d`
              : "—"
          }
          hint="dagen tot verloop"
          tone={
            latestDeep?.cert_days_left == null
              ? "neutral"
              : latestDeep.cert_days_left < 14
                ? "bad"
                : latestDeep.cert_days_left < 30
                  ? "neutral"
                  : "good"
          }
        />
        <Stat
          icon={AlertTriangle}
          label="Kritieke bevindingen"
          value={String(latestDeep?.critical_count ?? 0)}
          hint={`${pitfalls.length} pijnpunten totaal`}
          tone={
            (latestDeep?.critical_count ?? 0) === 0
              ? "good"
              : (latestDeep?.critical_count ?? 0) <= 2
                ? "neutral"
                : "bad"
          }
        />
        <Stat
          icon={Activity}
          label="Snapshots"
          value={String(deepScans.length)}
          hint={`${pings.length} pings · ${scans.length} totaal`}
        />
      </div>

      {/* Grafieken */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ChartCard
          title={`Score-evolutie · laatste ${scoreTrend.length} scans`}
        >
          {scoreTrend.length >= 2 ? (
            <TrendChart
              id="site-score"
              color="var(--accent)"
              height={160}
              points={scoreTrend}
            />
          ) : (
            <p className="text-sm text-muted">
              Nog niet genoeg historiek voor een grafiek. Klik &quot;Scan
              nu&quot; om er nu één toe te voegen.
            </p>
          )}
        </ChartCard>
        <ChartCard
          title={`Responstijd · laatste ${responseTrend.length} pings`}
        >
          {responseTrend.length >= 2 ? (
            <TrendChart
              id="site-resp"
              color="#0ea5e9"
              height={160}
              points={responseTrend}
              unit=" ms"
            />
          ) : (
            <p className="text-sm text-muted">Nog geen ping-historiek.</p>
          )}
        </ChartCard>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Scores per categorie">
          {categories.length > 0 ? (
            <BarList
              items={categories.map((c) => ({ label: c.cat, value: c.score }))}
              color="var(--accent)"
            />
          ) : (
            <p className="text-sm text-muted">Nog geen diepe scan.</p>
          )}
        </ChartCard>
        <ChartCard
          title={`Kritieke bevindingen-evolutie · laatste ${critTrend.length} scans`}
        >
          {critTrend.length >= 2 ? (
            <TrendChart
              id="site-crit"
              color="#dc2626"
              height={160}
              points={critTrend}
            />
          ) : (
            <p className="text-sm text-muted">Nog geen historiek.</p>
          )}
        </ChartCard>
      </div>

      {/* Kritische punten + tickets */}
      <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Open kritische punten
        </p>
        {pitfalls.length === 0 ? (
          <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">
            ✓ Geen kritische punten.
          </p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {pitfalls.map((p, k) => {
              const meta = FIND.nl[p];
              return (
                <li key={k} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{meta?.title ?? p}</p>
                    {meta?.fix && (
                      <p className="mt-0.5 text-[13px] text-muted">
                        → {meta.fix}
                      </p>
                    )}
                    <form action={siteIssueToTicket} className="mt-1">
                      <input
                        type="hidden"
                        name="site"
                        value={siteName}
                      />
                      <input type="hidden" name="key" value={p} />
                      <button
                        type="submit"
                        className="font-mono text-[10px] uppercase tracking-widest text-accent underline-offset-2 hover:underline"
                      >
                        + Zet om in taak
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Stack/technologie */}
      {techArr.length > 0 && (
        <div className="mt-4 rounded-2xl bg-card p-5 shadow-sm">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Layers className="h-3.5 w-3.5" strokeWidth={2.5} />
            Stack &amp; technologieën gedetecteerd
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techArr.map((tech, i) => (
              <span
                key={i}
                className="rounded-full bg-background px-2 py-0.5 text-[11px]"
                title={tech.type}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot-historiek-tabel */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="border-b bg-background/30 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Snapshot-historiek (laatste {Math.min(deepScans.length, 20)} diepe
            scans)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-5 py-3 font-medium">Datum</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Grade</th>
                <th className="px-5 py-3 font-medium">Kritiek</th>
                <th className="px-5 py-3 font-medium">SSL</th>
                <th className="px-5 py-3 font-medium">Stack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deepScans.slice(0, 20).map((s, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">
                    {fmtDateTime(s.scanned_at)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-full border-2 px-2 py-0.5 font-mono text-xs font-semibold ${scoreCls(s.score ?? 0)}`}
                    >
                      {s.score}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono">{s.grade ?? "—"}</td>
                  <td className="px-5 py-3 font-mono">
                    {s.critical_count ?? 0}
                  </td>
                  <td className="px-5 py-3 font-mono">
                    {s.cert_days_left != null ? `${s.cert_days_left}d` : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">{s.stack ?? "—"}</td>
                </tr>
              ))}
              {deepScans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted">
                    Nog geen diepe scans uitgevoerd.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Gauge;
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
