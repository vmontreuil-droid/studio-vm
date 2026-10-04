import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidLocale } from "@/lib/i18n/config";
import { getCompanySettings } from "@/lib/admin/settings";
import { PrintButton } from "@/components/print-button";
import { BANK, structuredComm } from "@/lib/bank";
import { btwLabel, btwVermelding, regimeVan } from "@/lib/facturatie/btw";
import { FactuurVoorwaarden } from "@/components/factuur-voorwaarden";
import { FACTUUR_AFDRUK_CSS } from "@/lib/facturatie/afdruk";
import { mollieConfigured } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";
import { factuurBedrag } from "@/lib/factuur-klant";

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
  due_at?: string | null;
  vat_reverse?: boolean | null;
  btw_regime?: string | null;
  ogm?: string | null;
  id?: string;
  ticket_id?: string | null;
  offer_id?: string | null;
  mollie_payment_id?: string | null;
};

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


const L = {
  nl: {
    title: "Factuur",
    payOnline: "Online betalen",
    betaalOk: "Bedankt! Uw betaling is ontvangen.",
    betaalBezig: "Bedankt! We verwerken uw betaling; dit duurt meestal enkele seconden. Vernieuw de pagina om de status te zien.",
    betaalFout: "Online betalen lukte niet. Probeer het opnieuw of betaal per overschrijving.",
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
    payTitle: "Betaling",
    payBefore: "Te betalen vóór",
    comm: "Gestructureerde mededeling",
    beneficiary: "Begunstigde",
  },
  fr: {
    title: "Facture",
    payOnline: "Payer en ligne",
    betaalOk: "Merci ! Votre paiement a bien été reçu.",
    betaalBezig: "Merci ! Nous traitons votre paiement ; cela ne prend généralement que quelques secondes. Actualisez la page pour voir le statut.",
    betaalFout: "Le paiement en ligne n'a pas abouti. Réessayez ou payez par virement.",
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
    payTitle: "Paiement",
    payBefore: "À payer avant le",
    comm: "Communication structurée",
    beneficiary: "Bénéficiaire",
  },
  en: {
    title: "Invoice",
    payOnline: "Pay online",
    betaalOk: "Thank you! Your payment has been received.",
    betaalBezig: "Thank you! We are processing your payment; this usually takes a few seconds. Refresh the page to see the status.",
    betaalFout: "Online payment did not go through. Please try again or pay by bank transfer.",
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
    payTitle: "Payment",
    payBefore: "Due by",
    comm: "Structured reference",
    beneficiary: "Beneficiary",
  },
  de: {
    title: "Rechnung",
    payOnline: "Online bezahlen",
    betaalOk: "Vielen Dank! Ihre Zahlung ist eingegangen.",
    betaalBezig: "Vielen Dank! Wir verarbeiten Ihre Zahlung; das dauert meist nur wenige Sekunden. Laden Sie die Seite neu, um den Status zu sehen.",
    betaalFout: "Die Online-Zahlung hat nicht geklappt. Bitte versuchen Sie es erneut oder zahlen Sie per Überweisung.",
    from: "Von",
    to: "An",
    desc: "Beschreibung",
    excl: "Zwischensumme (exkl. MwSt.)",
    vat: "MwSt. 21%",
    incl: "Gesamt inkl. MwSt.",
    paid: "BEZAHLT",
    paidOn: "Bezahlt am",
    issuedOn: "Ausgestellt am",
    print: "Drucken / PDF",
    payTitle: "Zahlung",
    payBefore: "Zahlbar bis",
    comm: "Strukturierte Mitteilung",
    beneficiary: "Empfänger",
  },
  es: {
    title: "Factura",
    payOnline: "Pagar en línea",
    betaalOk: "¡Gracias! Hemos recibido su pago.",
    betaalBezig: "¡Gracias! Estamos procesando su pago; suele tardar unos segundos. Actualice la página para ver el estado.",
    betaalFout: "El pago en línea no se ha completado. Inténtelo de nuevo o pague por transferencia.",
    from: "De",
    to: "Para",
    desc: "Descripción",
    excl: "Subtotal (IVA no incluido)",
    vat: "IVA 21%",
    incl: "Total IVA incluido",
    paid: "PAGADA",
    paidOn: "Pagada el",
    issuedOn: "Emitida el",
    print: "Imprimir / PDF",
    payTitle: "Pago",
    payBefore: "A pagar antes del",
    comm: "Comunicación estructurada",
    beneficiary: "Beneficiario",
  },
} as const;

export default async function PublicInvoice({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ betaling?: string }>;
}) {
  const [{ locale, token }, { betaling }] = await Promise.all([params, searchParams]);
  if (!isValidLocale(locale)) notFound();
  const t = L[locale];

  const { data } = await getSupabaseAdmin()
    .from("invoices")
    // "*": werkt vóór en na migratie 0051 (btw_regime, ogm).
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  const i = data as Inv | null;
  if (!i) notFound();

  const settings = await getCompanySettings();
  // 3D-werk (project of revisie bij een ticket) → uurwerkvoorwaarden; anders
  // een oude websitefactuur. Zelfde regel als in het beheer en het portaal.
  let uurwerk = !!i.ticket_id || typeof i.vat_reverse === "boolean";
  if (!uurwerk && i.id) {
    const { data: pr } = await getSupabaseAdmin().from("projecten").select("id").eq("invoice_id", i.id).limit(1);
    uurwerk = !!pr?.length;
  }
  const regime = regimeVan(i);
  const vat = regime === "binnenland" ? Math.round(i.amount_cents * 0.21) : 0;
  const incl = i.amount_cents + vat;
  const vatLabel = btwLabel(regime, locale);
  const vermelding = btwVermelding(regime, locale);
  const iban = settings.iban || BANK.iban;
  const bic = settings.bic || BANK.bic;
  const ogm = structuredComm(i.number, i.ogm);
  // Online betalen enkel als Mollie hetzelfde bedrag zou vragen als hier staat.
  const teBetalen = i.id ? (await factuurBedrag({ ...i, id: i.id }))?.totaalCent : null;
  const kanOnline = mollieConfigured && i.status !== "betaald" && teBetalen === incl;
  // Terug van Mollie zonder dat de betaling al verwerkt is: echte status
  // opvragen (geannuleerd of mislukt ≠ "we verwerken uw betaling").
  let melding: "ok" | "bezig" | "fout" | null = null;
  if (betaling) {
    if (i.status === "betaald") melding = "ok";
    else if (betaling === "terug" && i.mollie_payment_id) {
      const st = (await getMolliePayment(i.mollie_payment_id))?.status;
      melding = st === "paid" || st === "authorized" ? "ok" : st === "pending" ? "bezig" : "fout";
    } else melding = betaling === "fout" ? "fout" : "bezig";
  }
  const d = (s: string | null) =>
    s
      ? new Date(s).toLocaleDateString("nl-BE", {
          timeZone: "Europe/Brussels",
        })
      : "—";

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: FACTUUR_AFDRUK_CSS }} />

      <div className="no-print border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-end px-6 py-4">
          <PrintButton label={t.print} />
        </div>
      </div>

      {melding && (
        <div className="no-print mx-auto max-w-3xl px-6 pt-6">
          <p
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              melding === "ok"
                ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                : melding === "fout"
                  ? "border-red-300 bg-red-100 text-red-900"
                  : "border-amber-400 bg-amber-200 text-amber-950"
            }`}
          >
            {melding === "ok" ? t.betaalOk : melding === "fout" ? t.betaalFout : t.betaalBezig}
          </p>
        </div>
      )}

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
              <span>{vatLabel}</span>
              <span className="whitespace-nowrap font-mono">{eur(vat)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
              <span>{t.incl}</span>
              <span className="whitespace-nowrap font-mono">{eur(incl)}</span>
            </div>
            {vermelding && (
              <p className="pt-1.5 text-xs text-muted">
                {vermelding}
                {i.client_vat ? ` · ${i.client_vat}` : ""}
              </p>
            )}
          </div>

          {/* Betaling (enkel zolang de factuur openstaat) */}
          {i.status !== "betaald" && (
            <div className="mt-6 rounded-xl border-2 border-accent bg-background p-5 text-sm">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent">{t.payTitle}</p>
              <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[auto_1fr]">
                {i.due_at && (
                  <>
                    <dt className="text-muted">{t.payBefore}</dt>
                    <dd className="font-medium">{d(i.due_at)}</dd>
                  </>
                )}
                <dt className="text-muted">{t.beneficiary}</dt>
                <dd>{settings.bank_holder || BANK.holder}</dd>
                <dt className="text-muted">IBAN</dt>
                <dd className="font-mono">{iban}{bic ? ` · BIC ${bic}` : ""}</dd>
                <dt className="text-muted">{t.comm}</dt>
                <dd className="font-mono text-base font-semibold tracking-wide">{ogm}</dd>
              </dl>
              {kanOnline && (
                <a
                  href={`/${locale}/factuur/${encodeURIComponent(token)}/betaal`}
                  className="no-print mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
                >
                  {t.payOnline}
                  <span aria-hidden>&rarr;</span>
                </a>
              )}
            </div>
          )}

          <FactuurVoorwaarden taal={locale} soort={uurwerk ? "uurwerk" : "website"} />

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
