import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, mollieConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { payInvoice } from "@/app/actions/portal-client";
import { eur, dt, badge, PORTAL_T, type Invoice } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  { paid: string; open: string; overdue: string; history: string; none: string }
> = {
  nl: {
    paid: "Betaald",
    open: "Openstaand",
    overdue: "Vervallen",
    history: "Betalingshistoriek",
    none: "Nog geen betalingen of facturen.",
  },
  fr: {
    paid: "Payé",
    open: "À payer",
    overdue: "Échu",
    history: "Historique des paiements",
    none: "Aucun paiement ou facture.",
  },
  en: {
    paid: "Paid",
    open: "Outstanding",
    overdue: "Overdue",
    history: "Payment history",
    none: "No payments or invoices yet.",
  },
};

export default async function PortalPayments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false });
  const invoices = (data as Invoice[]) ?? [];

  const sum = (st: string) =>
    invoices
      .filter((i) => i.status === st)
      .reduce((s, i) => s + i.amount_cents, 0);
  const cards = [
    { k: l.paid, v: eur(sum("betaald")), c: "text-green-600 dark:text-green-400" },
    { k: l.open, v: eur(sum("open")), c: "text-accent" },
    { k: l.overdue, v: eur(sum("vervallen")), c: "text-red-500" },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.payments}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {c.k}
            </p>
            <p className={`mt-1 text-2xl font-semibold ${c.c}`}>{c.v}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-accent">
        {l.history}
      </h2>
      <div className="mt-4 space-y-3">
        {invoices.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {invoices.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {i.number}{" "}
                <span className="text-muted">· {eur(i.amount_cents)}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {dt(i.issued_at, locale)}
                {i.due_at ? ` → ${dt(i.due_at, locale)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  i.status,
                )}`}
              >
                {i.status}
              </span>
              {i.pdf_url && (
                <a
                  href={i.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover"
                >
                  PDF
                </a>
              )}
              {mollieConfigured && i.status !== "betaald" && (
                <form action={payInvoice.bind(null, i.id)}>
                  <button className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90">
                    {locale === "fr" ? "Payer" : locale === "en" ? "Pay now" : "Betaal nu"}
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
