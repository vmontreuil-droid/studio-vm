import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { MY_SITES, SITES_OWNER_EMAIL } from "@/lib/my-sites";
import {
  ensureSiteMonitors,
  scanAllSites,
} from "@/app/actions/sites-admin";

export const dynamic = "force-dynamic";

type Mon = { id: string; url: string; last_scan_at: string | null };
type Scan = {
  scanned_at: string;
  score: number | null;
  grade: string | null;
  stack: string | null;
  cert_days_left: number | null;
  snapshot: Record<string, unknown> | null;
};

const DAY = 86_400_000;

export default async function AdminSites() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  await ensureSiteMonitors();
  const db = getSupabaseAdmin();
  const { data: monData } = await db
    .from("monitors")
    .select("id, url, last_scan_at")
    .eq("email", SITES_OWNER_EMAIL);
  const mons = (monData as Mon[]) ?? [];
  const byUrl = new Map(mons.map((m) => [m.url, m]));

  const scansByMon = new Map<string, Scan[]>();
  await Promise.all(
    mons.map(async (m) => {
      const { data } = await db
        .from("monitor_scans")
        .select("scanned_at, score, grade, stack, cert_days_left, snapshot")
        .eq("monitor_id", m.id)
        .order("scanned_at", { ascending: false })
        .limit(26);
      scansByMon.set(m.id, (data as Scan[]) ?? []);
    }),
  );

  const sites = MY_SITES.map((s) => {
    const mon = byUrl.get(s.url);
    const scans = mon ? (scansByMon.get(mon.id) ?? []) : [];
    const latest = scans[0] ?? null;
    const snap = (latest?.snapshot ?? {}) as Record<string, unknown>;
    const everScanned = scans.length > 0;
    const down = everScanned && snap.ok === false;
    const checkedAt = latest?.scanned_at ?? mon?.last_scan_at ?? null;
    const stale =
      checkedAt != null &&
      Date.now() - new Date(checkedAt).getTime() > 9 * DAY;
    const sslDays =
      typeof latest?.cert_days_left === "number"
        ? latest.cert_days_left
        : null;
    const score = down ? 0 : (latest?.score ?? null);
    const responseMs =
      typeof snap.responseMs === "number"
        ? (snap.responseMs as number)
        : null;
    const hosting =
      typeof snap.hosting === "string" ? (snap.hosting as string) : null;
    const alarms: string[] = [];
    if (!everScanned) alarms.push("nog niet gescand");
    if (down) alarms.push("OFFLINE");
    if (sslDays != null && sslDays < 14)
      alarms.push(`SSL verloopt over ${sslDays}d`);
    if (!down && score != null && score < 45)
      alarms.push(`zwakke score (${score})`);
    if (stale && !down) alarms.push("check verouderd");
    const history = [...scans]
      .reverse()
      .slice(-14)
      .map((sc) => ({
        label: new Date(sc.scanned_at).toLocaleDateString("nl-BE", {
          day: "2-digit",
          month: "2-digit",
        }),
        value:
          (sc.snapshot as Record<string, unknown> | null)?.ok === false
            ? 0
            : (sc.score ?? 0),
      }));
    return {
      ...s,
      down,
      everScanned,
      checkedAt,
      sslDays,
      score,
      grade: latest?.grade ?? null,
      stack: latest?.stack ?? null,
      hosting,
      responseMs,
      alarms,
      history,
    };
  });

  const alarmSites = sites.filter((s) => s.alarms.length > 0);

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleString("nl-BE", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
        <form action={scanAllSites}>
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Scan nu
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">
        Alle sites die ik gemaakt heb — uptime, SSL, score en alarmen.
        De weekcron ververst dit automatisch; “Scan nu” forceert direct.
      </p>

      {alarmSites.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-red-600 bg-red-100 p-5 dark:border-red-700 dark:bg-red-950">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-red-800 dark:text-red-200">
            ⚠ Aandacht nodig — {alarmSites.length} site
            {alarmSites.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-red-900 dark:text-red-100">
            {alarmSites.map((s) => (
              <li key={s.url} className="flex flex-wrap gap-x-2">
                <strong>{s.name}</strong>
                <span className="opacity-80">— {s.alarms.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-green-700 bg-green-100 p-4 text-sm font-semibold text-green-900 dark:border-green-700 dark:bg-green-900 dark:text-green-50">
          ✓ Alles in orde — geen alarmen.
        </div>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {sites.map((s) => {
          const ok = s.everScanned && !s.down;
          return (
            <div
              key={s.url}
              className={`rounded-2xl border bg-card p-5 ${
                s.down
                  ? "border-red-500/50"
                  : s.alarms.length > 0
                    ? "border-amber-500/50"
                    : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight">{s.name}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-accent underline"
                  >
                    {s.url.replace(/^https?:\/\//, "")}
                  </a>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${
                    !s.everScanned
                      ? "bg-card-hover text-muted"
                      : s.down
                        ? "bg-red-500/15 text-red-500"
                        : "bg-green-500/15 text-green-600 dark:text-green-400"
                  }`}
                >
                  {!s.everScanned
                    ? "—"
                    : s.down
                      ? "Offline"
                      : "Online"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Score
                  </p>
                  <p className="font-semibold">
                    {ok && s.score != null
                      ? `${s.grade ?? "?"}·${s.score}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Responstijd
                  </p>
                  <p className="font-semibold">
                    {ok && s.responseMs != null
                      ? `${s.responseMs} ms`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    SSL
                  </p>
                  <p
                    className={`font-semibold ${
                      s.sslDays != null && s.sslDays < 14
                        ? "text-red-500"
                        : s.sslDays != null && s.sslDays < 30
                          ? "text-amber-600 dark:text-amber-400"
                          : ""
                    }`}
                  >
                    {s.sslDays != null ? `${s.sslDays} d` : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    Gecheckt
                  </p>
                  <p className="font-semibold">{fmt(s.checkedAt)}</p>
                </div>
              </div>

              {(s.hosting || s.stack) && (
                <p className="mt-3 truncate font-mono text-[11px] text-muted">
                  {[s.hosting, s.stack].filter(Boolean).join(" · ")}
                </p>
              )}

              {s.history.length >= 2 ? (
                <TrendChart
                  id={`site-${s.url.replace(/[^a-z0-9]/gi, "")}`}
                  color={s.down ? "#ef4444" : "var(--accent)"}
                  height={104}
                  points={s.history}
                />
              ) : (
                <p className="mt-4 text-xs text-muted">
                  Nog te weinig historiek voor een grafiek — klik “Scan
                  nu” of wacht op de wekelijkse check.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">
        Bezoekersaantallen per site volgen later — daarvoor moet er een
        kleine meet-tag op elke site komen (of Vercel-Analytics-toegang).
        Zeg het en ik zet die fase op.
      </p>
    </>
  );
}
