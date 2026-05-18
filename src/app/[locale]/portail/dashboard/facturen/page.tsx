import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, mollieConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { payInvoice } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";
import { PrintButton } from "@/components/print-button";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

type Inv = {
  id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  pdf_url: string | null;
  offer_id: string | null;
  client_email: string | null;
};
type OfferRef = {
  id: string;
  client_name: string | null;
  client_company: string | null;
  client_address: string | null;
  vat_number: string | null;
  vat_reverse: boolean | null;
};

const L: Record<
  Locale,
  {
    none: string;
    pdf: string;
    pay: string;
    print: string;
    invoice: string;
    from: string;
    forWhom: string;
    subtotal: string;
    vat: string;
    reverse: string;
    inclVat: string;
    due: string;
    paidNote: string;
  }
> = {
  nl: {
    none: "Nog geen facturen.",
    pdf: "PDF",
    pay: "Betaal via Mollie",
    print: "Afdrukken / PDF",
    invoice: "Factuur",
    from: "Van",
    forWhom: "Voor",
    subtotal: "Subtotaal (excl. btw)",
    vat: "Btw 21%",
    reverse: "Btw (0% — verlegd, intracommunautair)",
    inclVat: "Totaal incl. btw",
    due: "Te betalen tegen",
    paidNote: "Betaald — bedankt!",
  },
  fr: {
    none: "Aucune facture.",
    pdf: "PDF",
    pay: "Payer via Mollie",
    print: "Imprimer / PDF",
    invoice: "Facture",
    from: "De",
    forWhom: "Pour",
    subtotal: "Sous-total (HTVA)",
    vat: "TVA 21%",
    reverse: "TVA (0% — autoliquidée, intracommunautaire)",
    inclVat: "Total TVAC",
    due: "À payer pour le",
    paidNote: "Payée — merci !",
  },
  en: {
    none: "No invoices.",
    pdf: "PDF",
    pay: "Pay via Mollie",
    print: "Print / PDF",
    invoice: "Invoice",
    from: "From",
    forWhom: "For",
    subtotal: "Subtotal (excl. VAT)",
    vat: "VAT 21%",
    reverse: "VAT (0% — reverse-charged, intra-EU)",
    inclVat: "Total incl. VAT",
    due: "Due by",
    paidNote: "Paid — thank you!",
  },
};

const PRINT_CSS = `@page { margin: 0; }
@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 14mm 12mm; }
  .no-print { display: none !important; }
  .doc { border: none !important; box-shadow: none !important; page-break-after: always; }
}`;

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
  const invoices = (data as Inv[]) ?? [];

  const offerIds = [
    ...new Set(invoices.map((i) => i.offer_id).filter(Boolean)),
  ] as string[];
  const offerMap = new Map<string, OfferRef>();
  if (offerIds.length > 0) {
    const { data: offs } = await sb
      .from("offers")
      .select(
        "id, client_name, client_company, client_address, vat_number, vat_reverse",
      )
      .in("id", offerIds);
    for (const o of (offs as OfferRef[]) ?? []) offerMap.set(o.id, o);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.invoices}
      </h1>

      <div id="print-area" className="mt-8 space-y-8">
        {invoices.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {invoices.map((i) => {
          const ref = i.offer_id ? offerMap.get(i.offer_id) : undefined;
          const reverse = !!ref?.vat_reverse;
          const amount = i.amount_cents;
          const vat = reverse ? 0 : Math.round(amount * 0.21);
          const incl = amount + vat;
          const paid = i.status === "betaald";

          return (
            <article
              key={i.id}
              className="doc rounded-2xl border bg-card p-6 sm:p-9"
            >
              {/* Briefhoofd */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
                <div>
                  <p className="text-6xl font-extrabold lowercase leading-none tracking-tighter sm:text-7xl">
                    vm<span className="text-accent">.</span>
                  </p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                    Studio VM · studio-vm.be
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {l.invoice}
                  </p>
                  <p className="mt-1 font-semibold tracking-tight">
                    {i.number}
                  </p>
                  <p className="text-xs text-muted">
                    {dt(i.issued_at, locale)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                      i.status,
                    )}`}
                  >
                    {statusLabel(i.status, locale)}
                  </span>
                </div>
              </div>

              {/* Van / Voor */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {l.from}
                  </p>
                  <p className="font-medium">
                    Studio VM — Vincent Montreuil
                  </p>
                  <p className="text-muted">studio-vm.be</p>
                </div>
                {(ref?.client_name ||
                  ref?.client_company ||
                  ref?.client_address ||
                  ref?.vat_number ||
                  i.client_email) && (
                  <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.forWhom}
                    </p>
                    {ref?.client_company && (
                      <p className="font-medium">{ref.client_company}</p>
                    )}
                    {ref?.client_name && <p>{ref.client_name}</p>}
                    {ref?.client_address && (
                      <p className="text-muted">{ref.client_address}</p>
                    )}
                    {ref?.vat_number ? (
                      <p className="font-mono text-xs text-muted">
                        {ref.vat_number}
                      </p>
                    ) : (
                      i.client_email && (
                        <p className="font-mono text-xs text-muted">
                          {i.client_email}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>

              {i.description && (
                <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
                  {i.description}
                </h2>
              )}

              {/* Bedragen */}
              <div className="mt-6 rounded-xl border bg-background p-5 text-sm">
                <div className="flex items-center justify-between text-muted">
                  <span>{l.subtotal}</span>
                  <span className="font-mono">{eur(amount)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-muted">
                  <span>{reverse ? l.reverse : l.vat}</span>
                  <span className="font-mono">{eur(vat)}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                  <span>{l.inclVat}</span>
                  <span className="font-mono">{eur(incl)}</span>
                </div>
                {i.due_at && !paid && (
                  <p className="mt-3 text-xs text-muted">
                    {l.due}{" "}
                    <strong className="text-foreground">
                      {dt(i.due_at, locale)}
                    </strong>
                  </p>
                )}
                {paid && (
                  <p className="mt-3 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white">
                    ✓ {l.paidNote}
                  </p>
                )}
              </div>

              {/* Acties */}
              <div className="no-print mt-7 grid grid-cols-1 gap-2 border-t pt-6 sm:grid-cols-3">
                <PrintButton label={l.print} />
                {mollieConfigured && !paid && (
                  <form action={payInvoice.bind(null, i.id)} className="w-full">
                    <SubmitButton className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-accent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-card-hover">
                      {l.pay}
                      <span aria-hidden>&rarr;</span>
                    </SubmitButton>
                  </form>
                )}
                {i.pdf_url && (
                  <a
                    href={i.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-full border bg-card-hover px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground"
                  >
                    {l.pdf}
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
