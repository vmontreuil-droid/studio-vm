import Link from "next/link";
import {
  Mail,
  Eye,
  Reply,
  XCircle,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { setOutreachStatus, toggleOutreachPaused } from "@/app/actions/outreach";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type Row = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_token: string | null;
  mail_to: string | null;
  mail_sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  status: string;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  nieuw: "bg-card-hover text-muted",
  gescand: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  verzonden: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  opgevolgd: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  geopend: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  beantwoord: "bg-green-500/10 text-green-700 dark:text-green-400",
  klant: "bg-emerald-600 text-white",
  geen_interesse: "bg-card-hover text-muted",
};

export default async function AdminOutreach({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = sp.status ?? "";

  const cfg = await getOutreachConfig();
  const db = getSupabaseAdmin();

  // KPI's
  const head = { count: "exact" as const, head: true };
  const [tot, scd, snt, opn, rpl, klt, ngi] = await Promise.all([
    db.from("prospect_outreach").select("prospect_id", head),
    db.from("prospect_outreach").select("prospect_id", head).eq("status", "gescand"),
    db.from("prospect_outreach").select("prospect_id", head).not("mail_sent_at", "is", null),
    db.from("prospect_outreach").select("prospect_id", head).not("opened_at", "is", null),
    db.from("prospect_outreach").select("prospect_id", head).not("replied_at", "is", null),
    db.from("prospect_outreach").select("prospect_id", head).eq("status", "klant"),
    db.from("prospect_outreach").select("prospect_id", head).eq("status", "geen_interesse"),
  ]);

  const kpi = [
    { k: "Pre-gescand", v: scd.count ?? 0, icon: Loader2 },
    { k: "Verzonden", v: snt.count ?? 0, icon: Mail },
    { k: "Geopend", v: opn.count ?? 0, icon: Eye },
    { k: "Beantwoord", v: rpl.count ?? 0, icon: Reply },
    { k: "Klant geworden", v: klt.count ?? 0, icon: CheckCircle2 },
    { k: "Geen interesse", v: ngi.count ?? 0, icon: XCircle },
  ];

  // Conversie-funnel: per stap, hoeveel mensen er door geraakten.
  const funnel = [
    { label: "Pre-gescand", value: scd.count ?? 0 },
    { label: "Verzonden", value: snt.count ?? 0 },
    { label: "Geopend", value: opn.count ?? 0 },
    { label: "Beantwoord", value: rpl.count ?? 0 },
    { label: "Klant", value: klt.count ?? 0 },
  ];

  // Status-donut.
  const statusSegs = [
    { label: "Gescand", value: scd.count ?? 0, color: "#3b82f6" },
    { label: "Verzonden", value: snt.count ?? 0, color: "var(--accent)" },
    { label: "Geopend", value: opn.count ?? 0, color: "#a855f7" },
    { label: "Beantwoord", value: rpl.count ?? 0, color: "#16a34a" },
    { label: "Klant", value: klt.count ?? 0, color: "#059669" },
    { label: "Geen interesse", value: ngi.count ?? 0, color: "#64748b" },
  ];

  // Mails per dag — laatste 14 dagen.
  const since = new Date(Date.now() - 14 * 86_400_000);
  const { data: sentRows } = await db
    .from("prospect_outreach")
    .select("mail_sent_at")
    .not("mail_sent_at", "is", null)
    .gte("mail_sent_at", since.toISOString())
    .limit(2000);
  const mailsByDay = Array.from({ length: 14 }, (_, k) => {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - (13 - k));
    const ymd = dt.toISOString().slice(0, 10);
    return {
      label: dt.toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
      }),
      value: (
        (sentRows as { mail_sent_at: string }[] | null) ?? []
      ).filter((r) => r.mail_sent_at.startsWith(ymd)).length,
    };
  });

  const tot_n = tot.count ?? 0;
  const sent_n = snt.count ?? 0;
  const opn_n = opn.count ?? 0;
  const klt_n = klt.count ?? 0;
  const openRate =
    sent_n > 0 ? Math.round((opn_n / sent_n) * 100) : 0;
  const convRate =
    sent_n > 0 ? Math.round((klt_n / sent_n) * 1000) / 10 : 0; // 1 decimaal
  void tot_n;

  // Lijst
  let q = db
    .from("prospect_outreach")
    .select(
      "land, prospect_id, website, scan_score, scan_token, mail_to, mail_sent_at, opened_at, replied_at, status, created_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data as Row[] | null) ?? [];

  const d = (s: string | null) =>
    s
      ? new Date(s).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })
      : "—";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Outreach-engine
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {cfg.paused ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Pause className="h-3 w-3" strokeWidth={2} /> gepauzeerd
                </span>{" "}
                — niemand wordt momenteel automatisch gemaild
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  <Play className="h-3 w-3" strokeWidth={2} /> actief
                </span>{" "}
                — quota {cfg.dailyQuota} mails/dag, score-range {cfg.minScore}–
                {cfg.maxScore}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={toggleOutreachPaused}>
            <button
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${
                cfg.paused
                  ? "bg-accent text-white"
                  : "border border-red-500/40 text-red-600 dark:text-red-400"
              }`}
            >
              {cfg.paused ? (
                <>
                  <Play className="h-4 w-4" strokeWidth={2.5} />
                  Start engine
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" strokeWidth={2.5} />
                  Pauzeer engine
                </>
              )}
            </button>
          </form>
          <Link
            href="/admin/instellingen"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Configuratie
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpi.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.k} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {s.k}
                </p>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {s.v.toLocaleString("nl-BE")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title={`Verzonden mails — laatste 14 dagen (open-rate ${openRate}% · conversie ${convRate}%)`}
          >
            <TrendChart
              id="outreach-trend"
              color="var(--accent)"
              height={140}
              points={mailsByDay}
            />
          </ChartCard>
        </div>
        <ChartCard title="Status-verdeling">
          <Donut
            segments={statusSegs}
            centerTop={String(tot.count ?? 0)}
            centerSub="prospects"
          />
        </ChartCard>
      </div>
      <div className="mt-3">
        <ChartCard title="Conversie-funnel">
          <BarList items={funnel} />
        </ChartCard>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { k: "", l: "Alles" },
          { k: "gescand", l: "Klaar om te mailen" },
          { k: "verzonden", l: "Verzonden" },
          { k: "opgevolgd", l: "Opgevolgd" },
          { k: "geopend", l: "Geopend" },
          { k: "beantwoord", l: "Beantwoord" },
          { k: "klant", l: "Klant" },
          { k: "geen_interesse", l: "Geen interesse" },
        ].map((f) => (
          <Link
            key={f.k}
            href={f.k ? `/admin/outreach?status=${f.k}` : "/admin/outreach"}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === f.k
                ? "bg-accent/15 text-accent"
                : "border text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {f.l}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Prospect</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Mail</th>
                <th className="px-4 py-3 font-medium">Verzonden</th>
                <th className="px-4 py-3 font-medium">Geopend</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    Nog geen prospects in deze status.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={`${r.land}-${r.prospect_id}`}
                  className="transition-colors hover:bg-card-hover"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {r.website ? (
                        <a
                          href={
                            /^https?:\/\//.test(r.website)
                              ? r.website
                              : `https://${r.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-accent"
                        >
                          {r.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="block font-mono text-[10px] text-muted">
                      {r.land.toUpperCase()} · {r.prospect_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {r.scan_score ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.mail_to ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {d(r.mail_sent_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {d(r.opened_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${STATUS_BADGE[r.status] ?? "bg-card-hover text-muted"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {r.scan_token && (
                        <a
                          href={`/nl/portail/scan/${r.scan_token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-card-hover"
                        >
                          Portaal
                        </a>
                      )}
                      <form action={setOutreachStatus}>
                        <input type="hidden" name="land" value={r.land} />
                        <input
                          type="hidden"
                          name="prospect_id"
                          value={r.prospect_id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value="beantwoord"
                        />
                        <button className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-green-500/10 hover:text-green-700">
                          Reply
                        </button>
                      </form>
                      <form action={setOutreachStatus}>
                        <input type="hidden" name="land" value={r.land} />
                        <input
                          type="hidden"
                          name="prospect_id"
                          value={r.prospect_id}
                        />
                        <input type="hidden" name="status" value="klant" />
                        <button className="rounded-md border border-emerald-600 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950">
                          Klant
                        </button>
                      </form>
                      <form action={setOutreachStatus}>
                        <input type="hidden" name="land" value={r.land} />
                        <input
                          type="hidden"
                          name="prospect_id"
                          value={r.prospect_id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value="geen_interesse"
                        />
                        <button className="rounded-md border px-2.5 py-1 text-xs text-muted transition-colors hover:bg-red-500/10 hover:text-red-600">
                          Stop
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
