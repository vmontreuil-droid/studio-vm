import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/admin/settings";
import { setCreditNoteStatus } from "@/app/actions/accounting";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type CN = {
  id: string;
  number: string;
  invoice_id: string | null;
  client_email: string;
  amount_cents: number;
  vat_rate: number;
  reason: string | null;
  status: string;
  issued_at: string;
};

const d = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" })
    : "—";

const PRINT_CSS = `@page { margin: 18mm 14mm; }
@media print {
  html { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; }
  .no-print { display: none !important; }
  .doc { border: none !important; box-shadow: none !important; }
}`;

export default async function AdminCreditNoteDoc({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("credit_notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const c = data as CN | null;
  if (!c) notFound();

  const s = await getCompanySettings();
  let invNumber: string | null = null;
  if (c.invoice_id) {
    const { data: inv } = await db
      .from("invoices")
      .select("number")
      .eq("id", c.invoice_id)
      .maybeSingle();
    invNumber = (inv as { number: string } | null)?.number ?? null;
  }

  const eur = (n: number) =>
    "€ " +
    (n / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const net = c.amount_cents;
  const vat = Math.round(net * (c.vat_rate / 100));
  const incl = net + vat;
  const done = c.status === "verwerkt";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/creditnotas"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Terug naar creditnota&apos;s
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton label="Afdrukken / PDF" />
          <Link
            href={`/admin/klanten/${encodeURIComponent(
              c.client_email,
            )}?tab=facturen`}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
          >
            Klantfiche
          </Link>
          <form action={setCreditNoteStatus}>
            <input type="hidden" name="id" value={c.id} />
            <input
              type="hidden"
              name="status"
              value={done ? "open" : "verwerkt"}
            />
            <button className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
              {done ? "Terug op open" : "Markeer verwerkt"}
            </button>
          </form>
        </div>
      </div>

      <div id="print-area" className="mt-6">
        <article className="doc rounded-2xl border bg-card p-6 sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
            <div>
              <p className="text-6xl font-extrabold lowercase leading-none tracking-tighter sm:text-7xl">
                vm<span className="text-accent">.</span>
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                {s.company_name} · {(s.website ?? "").replace(/^https?:\/\//, "")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                Creditnota
              </p>
              <p className="mt-1 font-semibold tracking-tight">{c.number}</p>
              <p className="text-xs text-muted">{d(c.issued_at)}</p>
              {invNumber && (
                <p className="mt-1 text-xs text-muted">
                  bij factuur {invNumber}
                </p>
              )}
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                  done
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {c.status}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                Van
              </p>
              <p className="font-medium">
                {s.company_name}
                {s.bank_holder ? ` — ${s.bank_holder}` : ""}
              </p>
              {s.address && <p className="text-muted">{s.address}</p>}
              {s.vat_number && (
                <p className="font-mono text-xs text-muted">{s.vat_number}</p>
              )}
            </div>
            <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                Voor
              </p>
              <p className="font-mono text-xs text-muted">{c.client_email}</p>
            </div>
          </div>

          {c.reason && (
            <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
              {c.reason}
            </h2>
          )}

          <div className="mt-6 rounded-xl border-2 border-accent bg-background p-5 text-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent">
              Tegoed — wordt teruggestort of verrekend
            </p>
            <div className="flex items-center justify-between text-muted">
              <span>Bedrag (excl. btw)</span>
              <span className="whitespace-nowrap font-mono">− {eur(net)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-muted">
              <span>Btw {c.vat_rate}%</span>
              <span className="whitespace-nowrap font-mono">− {eur(vat)}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-base font-semibold">
              <span>Totaal credit (incl. btw)</span>
              <span className="whitespace-nowrap font-mono">− {eur(incl)}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-background p-5 text-sm shadow-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              Toelichting
            </p>
            <p className="text-xs leading-relaxed text-muted">
              Deze creditnota verlaagt het verschuldigde bedrag
              {invNumber ? ` van factuur ${invNumber}` : ""} met het
              hierboven vermelde tegoed. Terugbetaling gebeurt op het
              gekende rekeningnummer, of wordt verrekend met een
              volgende factuur.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
