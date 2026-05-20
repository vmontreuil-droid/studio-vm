import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale } from "@/lib/i18n/config";
import { getCompanySettings } from "@/lib/admin/settings";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type Inv = {
  client_email: string;
  client_name: string | null;
  client_address: string | null;
  client_vat: string | null;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  paid_at: string | null;
};

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const L = {
  nl: {
    title: "Factuur",
    from: "Van",
    to: "Voor",
    desc: "Omschrijving",
    excl: "Subtotaal (excl. btw)",
    vat: "Btw 21%",
    incl: "Totaal incl. btw",
    paid: "BETAALD",
    paidOn: "Betaald op",
    issuedOn: "Uitgereikt op",
    print: "Afdrukken / PDF",
  },
  fr: {
    title: "Facture",
    from: "De",
    to: "Pour",
    desc: "Description",
    excl: "Sous-total (hors TVA)",
    vat: "TVA 21%",
    incl: "Total TTC",
    paid: "PAYÉE",
    paidOn: "Payée le",
    issuedOn: "Émise le",
    print: "Imprimer / PDF",
  },
  en: {
    title: "Invoice",
    from: "From",
    to: "To",
    desc: "Description",
    excl: "Subtotal (excl. VAT)",
    vat: "VAT 21%",
    incl: "Total incl. VAT",
    paid: "PAID",
    paidOn: "Paid on",
    issuedOn: "Issued on",
    print: "Print / PDF",
  },
} as const;

export default async function PublicInvoice({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = L[locale];

  const { data } = await getSupabaseAdmin()
    .from("invoices")
    .select(
      "client_email, client_name, client_address, client_vat, number, description, amount_cents, status, issued_at, paid_at",
    )
    .eq("public_token", token)
    .maybeSingle();
  const i = data as Inv | null;
  if (!i) notFound();

  const settings = await getCompanySettings();
  const vat = Math.round(i.amount_cents * 0.21);
  const incl = i.amount_cents + vat;
  const d = (s: string | null) =>
    s
      ? new Date(s).toLocaleDateString("nl-BE", {
          timeZone: "Europe/Brussels",
        })
      : "—";

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-end px-6 py-4">
          <PrintButton label={t.print} />
        </div>
      </div>

      <div id="print-area" className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <article className="doc rounded-2xl bg-card p-6 shadow-sm sm:p-9">
          {/* Letterhead */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
            <div>
              <p className="text-6xl font-extrabold lowercase leading-none tracking-tighter sm:text-7xl">
                vm<span className="text-accent">.</span>
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                {settings.company_name} ·{" "}
                {(settings.website ?? "").replace(/^https?:\/\//, "")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {t.title}
              </p>
              <p className="mt-1 font-semibold tracking-tight">{i.number}</p>
              <p className="text-xs text-muted">
                {t.issuedOn} {d(i.issued_at)}
              </p>
              {i.status === "betaald" && (
                <span className="mt-2 inline-block rounded-full bg-green-500/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-green-700 dark:text-green-400">
                  ✓ {t.paid}
                </span>
              )}
            </div>
          </div>

          {/* Van/Voor */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                {t.from}
              </p>
              <p className="font-medium">
                {settings.company_name}
                {settings.bank_holder ? ` — ${settings.bank_holder}` : ""}
              </p>
              {settings.address && (
                <p className="text-muted">{settings.address}</p>
              )}
              {settings.vat_number && (
                <p className="font-mono text-xs text-muted">
                  {settings.vat_number}
                </p>
              )}
              {settings.iban && (
                <p className="mt-2 font-mono text-xs text-muted">
                  IBAN {settings.iban}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-background p-4 text-sm shadow-sm">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                {t.to}
              </p>
              {i.client_name && (
                <p className="font-medium">{i.client_name}</p>
              )}
              {i.client_address && (
                <p className="whitespace-pre-line text-muted">
                  {i.client_address}
                </p>
              )}
              {i.client_vat && (
                <p className="font-mono text-xs text-muted">
                  BTW {i.client_vat}
                </p>
              )}
              <p className="mt-1 font-mono text-xs text-muted">
                {i.client_email}
              </p>
            </div>
          </div>

          {/* Description */}
          {i.description && (
            <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
              {i.description}
            </h2>
          )}

          {/* Bedragen */}
          <div className="mt-6 space-y-1.5 rounded-xl bg-background p-5 text-sm shadow-sm">
            <div className="flex items-center justify-between text-muted">
              <span>{t.excl}</span>
              <span className="whitespace-nowrap font-mono">
                {eur(i.amount_cents)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>{t.vat}</span>
              <span className="whitespace-nowrap font-mono">{eur(vat)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
              <span>{t.incl}</span>
              <span className="whitespace-nowrap font-mono">{eur(incl)}</span>
            </div>
          </div>

          {/* Paid stamp */}
          {i.status === "betaald" && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex -rotate-3 items-center gap-2 rounded-lg border-2 border-green-600 px-4 py-2 text-base font-extrabold uppercase tracking-widest text-green-600">
                ✓ {t.paid}
              </span>
              {i.paid_at && (
                <span className="text-sm text-muted">
                  {t.paidOn}{" "}
                  <strong className="text-foreground">{d(i.paid_at)}</strong>
                </span>
              )}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
