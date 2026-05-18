import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setInvoiceStatus } from "@/app/actions/portal-admin";
import { TrendChart } from "@/components/admin/trend-chart";
import { forecast, trendPct } from "@/lib/forecast";

export const dynamic = "force-dynamic";

type Invoice = {
  id: string;
  client_email: string;
  number: string;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
};

const STATUSES = ["alle", "open", "betaald", "vervallen"] as const;

export default async function AdminFacturen({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "alle";

  const { data } = await getSupabaseAdmin()
    .from("invoices")
    .select(
      "id, client_email, number, amount_cents, status, issued_at, due_at",
    )
    .order("issued_at", { ascending: false })
    .limit(1000);
  const all = (data as Invoice[]) ?? [];
  const invoices =
    status === "alle" ? all : all.filter((i) => i.status === status);

  const eur = (c: number) => `€ ${(c / 100).toFixed(2)}`;
  const sum = (s: string) =>
    all
      .filter((i) => i.status === s)
      .reduce((t, i) => t + i.amount_cents, 0);
  const now = new Date();
  const ymThis = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paidThisMonth = all
    .filter(
      (i) => i.status === "betaald" && i.issued_at.startsWith(ymThis),
    )
    .reduce((t, i) => t + i.amount_cents, 0);
  const sBadge = (s: string) =>
    s === "betaald"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : s === "vervallen"
        ? "bg-red-500/15 text-red-500"
        : "bg-accent/15 text-accent";
  const isOverdue = (i: Invoice) =>
    i.status === "open" &&
    i.due_at != null &&
    new Date(i.due_at).getTime() < now.getTime();

  const stats = [
    { k: "Openstaand", v: eur(sum("open")) },
    { k: "Betaald (deze maand)", v: eur(paidThisMonth) },
    { k: "Vervallen", v: eur(sum("vervallen")) },
    { k: "Totaal facturen", v: String(all.length) },
  ];

  const MONTHS = 9;
  const FC = 3;
  const monthList = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - (MONTHS - 1 - i),
      1,
    );
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("nl-BE", { month: "short" }),
    };
  });
  const monthLabels = monthList.map((m) => m.label);
  const revenueByMonth = monthList.map((m) =>
    all
      .filter((i) => i.status === "betaald" && i.issued_at.startsWith(m.key))
      .reduce((t, i) => t + i.amount_cents, 0),
  );
  const revenueFc = forecast(revenueByMonth, FC);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Facturen</h1>
      <p className="mt-2 text-sm text-muted">
        Alle facturen over alle klanten heen.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 truncate text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border bg-card p-5">
        <TrendChart
          id="omzet-fact"
          caption="Betaalde omzet / maand + prognose"
          history={revenueByMonth}
          projection={revenueFc}
          labels={monthLabels}
          trend={trendPct(revenueByMonth)}
          format={(n) => `€ ${Math.round(n / 100).toLocaleString("nl-BE")}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/facturen${s === "alle" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "hover:bg-card-hover"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {invoices.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Geen facturen in deze weergave.
          </p>
        )}
        {invoices.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border bg-card p-5"
          >
            <Link
              href={`/admin/klanten/${encodeURIComponent(
                i.client_email,
              )}?tab=facturen`}
              className="min-w-0 flex-1"
            >
              <p className="font-medium">
                {i.number}{" "}
                <span className="text-muted">· {eur(i.amount_cents)}</span>
                {isOverdue(i) && (
                  <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-red-500">
                    te laat
                  </span>
                )}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted">
                {i.client_email} · uitgereikt{" "}
                {new Date(i.issued_at).toLocaleDateString("nl-BE")}
                {i.due_at
                  ? ` · vervalt ${new Date(i.due_at).toLocaleDateString("nl-BE")}`
                  : ""}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                  i.status,
                )}`}
              >
                {i.status}
              </span>
              {i.status !== "betaald" && (
                <form action={setInvoiceStatus.bind(null, i.id, "betaald")}>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    Betaald
                  </button>
                </form>
              )}
              {i.status === "open" && (
                <form action={setInvoiceStatus.bind(null, i.id, "vervallen")}>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                    Vervallen
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
