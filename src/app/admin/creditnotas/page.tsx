import Link from "next/link";
import { FileMinus } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { CreditNoteForm } from "@/components/credit-note-form";
import { TrendChart } from "@/components/trend-chart";
import { ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

type CN = {
  id: string;
  number: string;
  client_email: string;
  amount_cents: number;
  vat_rate: number;
  status: string;
  issued_at: string;
  reason: string | null;
};

export default async function AdminCreditnotas() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const db = getSupabaseAdmin();

  const [cnR, invR] = await Promise.all([
    db
      .from("credit_notes")
      .select(
        "id, number, client_email, amount_cents, vat_rate, status, issued_at, reason",
      )
      .order("issued_at", { ascending: false })
      .limit(500),
    db
      .from("invoices")
      .select("id, number, client_email")
      .order("issued_at", { ascending: false })
      .limit(300),
  ]);

  const notes = (cnR.data as CN[] | null) ?? [];
  const invoices =
    (invR.data as { id: string; number: string; client_email: string }[] | null) ??
    [];

  const eur = (c: number) =>
    "€ " +
    (c / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const total = notes.reduce(
    (t, n) => t + Math.round(n.amount_cents * (1 + n.vat_rate / 100)),
    0,
  );
  const now = new Date();
  const cnMonths = Array.from({ length: 6 }, (_, k) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      value: Math.round(
        notes
          .filter((n) => (n.issued_at ?? "").startsWith(ym))
          .reduce(
            (t, n) =>
              t + Math.round(n.amount_cents * (1 + n.vat_rate / 100)),
            0,
          ) / 100,
      ),
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Creditnota&apos;s
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Terugbetalingen / correcties op facturen — totaal{" "}
            {eur(total)} incl. btw over {notes.length} stuk(s).
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CreditNoteForm invoices={invoices} />
      </div>

      <div className="mt-3">
        <ChartCard title="Creditnota's — laatste 6 maanden (incl. btw)">
          <TrendChart
            id="cn-maand"
            color="#dc2626"
            height={140}
            unit=" €"
            points={cnMonths}
          />
        </ChartCard>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {notes.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Nog geen creditnota&apos;s.
            </li>
          )}
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/admin/creditnotas/${n.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm transition-colors hover:bg-card-hover"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                    <FileMinus className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {n.number}
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          n.status === "verwerkt"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-card-hover text-muted"
                        }`}
                      >
                        {n.status}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {n.client_email}
                      {n.reason ? ` · ${n.reason}` : ""}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4 text-xs text-muted">
                  <span className="whitespace-nowrap font-mono">
                    {eur(
                      Math.round(
                        n.amount_cents * (1 + n.vat_rate / 100),
                      ),
                    )}
                  </span>
                  <span className="whitespace-nowrap">
                    {new Date(n.issued_at).toLocaleDateString("nl-BE")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
