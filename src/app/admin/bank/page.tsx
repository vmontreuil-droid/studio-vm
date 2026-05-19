import { ArrowDownLeft, ArrowUpRight, Link2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { BankImporter } from "@/components/bank-importer";
import {
  matchTransaction,
  setTransactionStatus,
} from "@/app/actions/accounting";
import { TrendChart } from "@/components/trend-chart";
import { Gauge } from "@/components/gauge";
import { Donut, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type Tx = {
  id: string;
  booked_at: string;
  amount_cents: number;
  counterparty: string | null;
  communication: string | null;
  matched_invoice_id: string | null;
  status: string;
};

export default async function AdminBank() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const db = getSupabaseAdmin();

  const [{ data: txData }, { data: invData }] = await Promise.all([
    db
      .from("bank_transactions")
      .select(
        "id, booked_at, amount_cents, counterparty, communication, matched_invoice_id, status",
      )
      .order("booked_at", { ascending: false })
      .limit(500),
    db
      .from("invoices")
      .select("id, number, client_email, amount_cents")
      .eq("status", "open")
      .order("issued_at", { ascending: false })
      .limit(300),
  ]);

  const txs = (txData as Tx[] | null) ?? [];
  const openInv =
    (invData as
      | { id: string; number: string; client_email: string; amount_cents: number }[]
      | null) ?? [];

  const eur = (c: number) =>
    (c < 0 ? "− € " : "€ ") +
    (Math.abs(c) / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const openCount = txs.filter((t) => t.status === "open").length;
  const inSum = txs
    .filter((t) => t.amount_cents > 0)
    .reduce((s, t) => s + t.amount_cents, 0);
  const outSum = txs
    .filter((t) => t.amount_cents < 0)
    .reduce((s, t) => s + t.amount_cents, 0);

  const now = new Date();
  const flowMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: Math.round(
        txs
          .filter((t) => (t.booked_at ?? "").startsWith(ym))
          .reduce((s, t) => s + t.amount_cents, 0) / 100,
      ),
    };
  });
  const matchedCnt = txs.filter((t) => t.status === "gematcht").length;
  const matchRate =
    txs.length > 0 ? Math.round((matchedCnt / txs.length) * 100) : 0;
  const statusSegs = [
    {
      label: "Open",
      value: txs.filter((t) => t.status === "open").length,
      color: "var(--accent)",
    },
    { label: "Gematcht", value: matchedCnt, color: "#16a34a" },
    {
      label: "Genegeerd",
      value: txs.filter((t) => t.status === "genegeerd").length,
      color: "#64748b",
    },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bank</h1>
        <p className="mt-0.5 text-sm text-muted">
          {txs.length} transactie(s) · {openCount} nog af te punten ·
          in {eur(inSum)} / uit {eur(outSum)}
        </p>
      </div>

      <div className="mt-6">
        <BankImporter />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Nettocashflow — laatste 6 maanden">
            <TrendChart
              id="bank-flow"
              color="#16a34a"
              height={150}
              unit=" €"
              points={flowMonths}
            />
          </ChartCard>
        </div>
        <ChartCard title="Afpunt-graad">
          <Gauge
            value={matchRate}
            label="Gematcht"
            sub={`${matchedCnt} van ${txs.length} transacties`}
          />
        </ChartCard>
      </div>
      <div className="mt-3">
        <ChartCard title="Status-verdeling">
          <Donut
            segments={statusSegs}
            centerTop={String(txs.length)}
            centerSub="transacties"
          />
        </ChartCard>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {txs.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Nog geen transacties — importeer een CSV hierboven.
            </li>
          )}
          {txs.map((t) => {
            const inflow = t.amount_cents > 0;
            return (
              <li key={t.id} className="p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        inflow
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {inflow ? (
                        <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {t.counterparty || "—"}
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                            t.status === "gematcht"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : t.status === "genegeerd"
                                ? "bg-card-hover text-muted"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {new Date(t.booked_at).toLocaleDateString("nl-BE")}
                        {t.communication ? ` · ${t.communication}` : ""}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`whitespace-nowrap font-mono text-sm ${
                      inflow
                        ? "text-green-700 dark:text-green-400"
                        : "text-muted"
                    }`}
                  >
                    {eur(t.amount_cents)}
                  </span>
                </div>

                {t.status === "open" && inflow && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-11">
                    <Link2 className="h-4 w-4 text-muted" strokeWidth={2} />
                    {openInv.length > 0 && (
                      <form
                        action={matchTransaction}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="id" value={t.id} />
                        <select
                          name="invoice_id"
                          required
                          defaultValue=""
                          className="rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
                        >
                          <option value="" disabled>
                            Koppel aan openstaande factuur…
                          </option>
                          {openInv.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.number} · {i.client_email} ·{" "}
                              {eur(i.amount_cents)}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-full border border-accent px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-card-hover">
                          Afpunten
                        </button>
                      </form>
                    )}
                    <form action={setTransactionStatus}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="status" value="genegeerd" />
                      <button className="rounded-full border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-card-hover">
                        Negeren
                      </button>
                    </form>
                  </div>
                )}
                {t.status !== "open" && (
                  <form
                    action={setTransactionStatus}
                    className="mt-2 pl-11"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value="open" />
                    <button className="text-xs text-muted underline-offset-2 hover:underline">
                      Terug op open
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
