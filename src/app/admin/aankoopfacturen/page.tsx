import { ReceiptText } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured, mindeeConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { PurchaseUploader } from "@/components/purchase-uploader";
import { setPurchaseStatus, deletePurchaseInvoice } from "@/app/actions/accounting";
import { TrendChart } from "@/components/trend-chart";
import { Donut, BarList, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type PI = {
  id: string;
  supplier_name: string | null;
  number: string | null;
  net_cents: number;
  vat_cents: number;
  total_cents: number;
  status: string;
  invoice_date: string;
  due_date: string | null;
  category: string | null;
};

export default async function AdminAankoopfacturen() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const { data } = await getSupabaseAdmin()
    .from("purchase_invoices")
    .select(
      "id, supplier_name, number, net_cents, vat_cents, total_cents, status, invoice_date, due_date, category",
    )
    .order("invoice_date", { ascending: false })
    .limit(500);

  const rows = (data as PI[] | null) ?? [];
  const eur = (c: number) =>
    "€ " +
    (c / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const openTotal = rows
    .filter((r) => r.status === "open")
    .reduce((t, r) => t + r.total_cents, 0);
  const vatTotal = rows.reduce((t, r) => t + r.vat_cents, 0);

  const now = new Date();
  const costMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: Math.round(
        rows
          .filter((r) => (r.invoice_date ?? "").startsWith(ym))
          .reduce((t, r) => t + r.total_cents, 0) / 100,
      ),
    };
  });
  const PALETTE = [
    "var(--accent)",
    "#0ea5e9",
    "#16a34a",
    "#a855f7",
    "#dc2626",
    "#64748b",
  ];
  const catMap = new Map<string, number>();
  for (const r of rows) {
    const k = (r.category || "Overig").trim();
    catMap.set(k, (catMap.get(k) ?? 0) + r.total_cents);
  }
  const catSegs = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({
      label,
      value: Math.round(value / 100),
      color: PALETTE[i % PALETTE.length],
    }));
  const supMap = new Map<string, number>();
  for (const r of rows) {
    const k = r.supplier_name || "Onbekend";
    supMap.set(k, (supMap.get(k) ?? 0) + r.total_cents);
  }
  const topSup = [...supMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Aankoopfacturen
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Bonnen &amp; aankoopfacturen — openstaand {eur(openTotal)} ·
            aftrekbare btw {eur(vatTotal)}.
          </p>
        </div>
        {!mindeeConfigured && (
          <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            OCR uit — zet <code>MINDEE_API_KEY</code> voor auto-uitlezen
          </span>
        )}
      </div>

      <div className="mt-6">
        <PurchaseUploader />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Aankoopkosten — laatste 6 maanden (incl. btw)">
            <TrendChart
              id="aank-kosten"
              color="#0ea5e9"
              height={150}
              unit=" €"
              points={costMonths}
            />
          </ChartCard>
        </div>
        <ChartCard title="Per categorie">
          <Donut
            segments={catSegs}
            centerTop={String(rows.length)}
            centerSub="facturen"
          />
        </ChartCard>
      </div>
      <div className="mt-3">
        <ChartCard title="Top-leveranciers (incl. btw)">
          <BarList
            items={topSup}
            color="#0ea5e9"
            format={(n) =>
              "€ " +
              (n / 100).toLocaleString("nl-BE", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            }
          />
        </ChartCard>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {rows.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Nog geen aankoopfacturen.
            </li>
          )}
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                  <ReceiptText className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {r.supplier_name || "Onbekende leverancier"}
                    {r.number ? (
                      <span className="text-muted"> · {r.number}</span>
                    ) : null}
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                        r.status === "betaald"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {new Date(r.invoice_date).toLocaleDateString("nl-BE")}
                    {r.category ? ` · ${r.category}` : ""}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="whitespace-nowrap font-mono text-xs text-muted">
                  {eur(r.total_cents)}{" "}
                  <span className="text-[10px]">
                    (btw {eur(r.vat_cents)})
                  </span>
                </span>
                <form action={setPurchaseStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={r.status === "betaald" ? "open" : "betaald"}
                  />
                  <button className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover">
                    {r.status === "betaald"
                      ? "Terug op open"
                      : "Markeer betaald"}
                  </button>
                </form>
                <form action={deletePurchaseInvoice}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    aria-label="Verwijderen"
                    className="rounded-full border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Wis
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
