import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, mollieConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { payInvoice } from "@/app/actions/portal-client";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Invoice,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<Locale, { none: string; pdf: string; pay: string }> = {
  nl: { none: "Nog geen facturen.", pdf: "PDF", pay: "Betaal nu" },
  fr: { none: "Aucune facture.", pdf: "PDF", pay: "Payer" },
  en: { none: "No invoices.", pdf: "PDF", pay: "Pay now" },
};

export default async function PortalInvoices({
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

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.invoices}
      </h1>
      <div className="mt-8 space-y-3">
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
              {i.description && (
                <p className="mt-0.5 text-sm text-muted">{i.description}</p>
              )}
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
                {statusLabel(i.status, locale)}
              </span>
              {i.pdf_url && (
                <a
                  href={i.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover"
                >
                  {l.pdf}
                </a>
              )}
              {mollieConfigured && i.status !== "betaald" && (
                <form action={payInvoice.bind(null, i.id)}>
                  <button className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90">
                    {l.pay}
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
