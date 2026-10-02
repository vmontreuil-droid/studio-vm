import Link from "next/link";
import { ExternalLink, BarChart3 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";
import type { ScanResult } from "@/app/actions/scan";

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

export default async function AdminScans({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;

  const { data } = await getSupabaseAdmin()
    .from("scan_requests")
    .select("id, token, email, url, locale, scan, created_at")
    .order("created_at", { ascending: false })
    .limit(400);
  let rows = (data as Row[]) ?? [];
  if (sp.q) {
    const n = sp.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(n) ||
        r.url?.toLowerCase().includes(n),
    );
  }

  const okScans = rows
    .map((r) => (r.scan && r.scan.ok ? r.scan : null))
    .filter((s): s is ScanResult & { ok: true } => s != null);
  const scoreSegs = [
    {
      label: "Zwak (0–44)",
      value: okScans.filter((s) => s.score < 45).length,
      color: "#dc2626",
    },
    {
      label: "Degelijk (45–74)",
      value: okScans.filter((s) => s.score >= 45 && s.score < 75).length,
      color: "#f59e0b",
    },
    {
      label: "Sterk (75–100)",
      value: okScans.filter((s) => s.score >= 75).length,
      color: "#16a34a",
    },
  ];
  const avgScore =
    okScans.length > 0
      ? Math.round(
          okScans.reduce((s, x) => s + x.score, 0) / okScans.length,
        )
      : 0;
  const nowS = new Date();
  const scanMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(nowS.getFullYear(), nowS.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: rows.filter((r) => (r.created_at ?? "").startsWith(ym))
        .length,
    };
  });
  const platMap = new Map<string, number>();
  for (const s of okScans) {
    const k = (s.stack || "Onbekend").trim();
    platMap.set(k, (platMap.get(k) ?? 0) + 1);
  }
  const platforms = [...platMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const gradeColor = (score: number) =>
    score >= 75
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : score >= 45
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-red-500/15 text-red-500";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Scans &amp; klantenportalen
        </h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Zoek op e-mail of site…"
            className="rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Zoek
          </button>
        </form>
      </div>

      <p className="mt-2 text-sm text-muted">
        {rows.length} scan{rows.length === 1 ? "" : "s"} — elke regel is een
        potentiële klant met een eigen klantenportaal.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Scans — laatste 6 maanden">
            <TrendChart
              id="scan-maand"
              color="#0ea5e9"
              height={150}
              points={scanMonths}
            />
          </ChartCard>
        </div>
        <ChartCard title={`Score-verdeling · gem. ${avgScore}/100`}>
          <Donut
            segments={scoreSegs}
            centerTop={String(okScans.length)}
            centerSub="scans"
          />
        </ChartCard>
      </div>
      <div className="mt-3">
        <ChartCard title="Platforms van prospects">
          <BarList items={platforms} color="#0ea5e9" />
        </ChartCard>
      </div>

      <div className="mt-6 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl bg-card shadow-sm p-6 text-sm text-muted">
            Nog geen scans met e-mail.
          </p>
        )}
        {rows.map((r) => {
          const sc = r.scan;
          const ok = sc && sc.ok;
          const score = ok ? sc.score : 0;
          const host = ok ? sc.host : r.url;
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-card shadow-sm p-5"
            >
              <Link
                href={`/admin/scans/${r.id}`}
                className="min-w-0 flex-1 transition-opacity hover:opacity-80"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {ok && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${gradeColor(
                        score,
                      )}`}
                    >
                      {sc.grade} · {score}
                    </span>
                  )}
                  <span className="truncate font-medium">{host}</span>
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {r.email}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {new Date(r.created_at).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                  })}{" "}
                  · {r.locale.toUpperCase()}
                </p>
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/scans/${r.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Detail
                </Link>
                <Link
                  href={`/admin/klanten/${encodeURIComponent(r.email)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                >
                  Klant
                </Link>
                <a
                  href={`mailto:${r.email}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                >
                  Mail
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
