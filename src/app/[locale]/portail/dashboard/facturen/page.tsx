import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, mollieConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { payInvoice } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";
import { PrintButton } from "@/components/print-button";
import {
  Package,
  Languages,
  MailCheck,
  CalendarCheck,
  Newspaper,
  Lock,
  Search,
  Camera,
  ShieldCheck,
  PenLine,
  LayoutDashboard,
  Smartphone,
  Share2,
  BarChart3,
  Mail,
  RefreshCw,
  CreditCard,
  Tag,
  Repeat,
  Check,
  type LucideIcon,
} from "lucide-react";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
} from "@/lib/portal-shared";
import { subscriptionTiers } from "@/lib/pricing";

function lineIcon(label: string): LucideIcon {
  const s = label.toLowerCase();
  if (s.includes("korting")) return Tag;
  if (s.includes("abonnement") || /\b(care|plus|scale|partner)\b/.test(s))
    return Repeat;
  if (s.includes("basispakket") || s.includes("aanbetaling")) return Package;
  if (s.includes("taal")) return Languages;
  if (s.includes("formulier")) return MailCheck;
  if (s.includes("reservatie") || s.includes("afspra")) return CalendarCheck;
  if (s.includes("blog") || s.includes("nieuws-cms")) return Newspaper;
  if (s.includes("leden")) return Lock;
  if (s.includes("seo")) return Search;
  if (s.includes("foto")) return Camera;
  if (s.includes("cookie") || s.includes("gdpr")) return ShieldCheck;
  if (s.includes("tekst") || s.includes("copywriting")) return PenLine;
  if (s.includes("admin") || s.includes("cms")) return LayoutDashboard;
  if (s.includes("mobile") || s.includes("dark mode")) return Smartphone;
  if (s.includes("open graph") || s.includes("sitemap")) return Share2;
  if (s.includes("analytics") || s.includes("structured data"))
    return BarChart3;
  if (s.includes("newsletter") || s.includes("nieuwsbrief")) return Mail;
  if (s.includes("ronde") || s.includes("revisie")) return RefreshCw;
  if (s.includes("mollie") || s.includes("stripe") || s.includes("betaal"))
    return CreditCard;
  return Check;
}

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
  title: string | null;
  offer_no: string | null;
  amount_cents: number | null;
  items: { label: string; desc?: string; cents: number; kind?: string }[] | null;
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
    whatYouGet: string;
    included: string;
    monthly: string;
    discountLine: string;
    afterDiscount: string;
    freeMonthsLine: string;
    offerTotal: string;
    thisInvoice: string;
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
    whatYouGet: "Wat je krijgt",
    included: "inbegrepen",
    monthly: "per maand",
    discountLine: "Vastlegkorting (directe ondertekening) −7%",
    afterDiscount: "Na korting (excl. btw)",
    freeMonthsLine: "Eerste 2 maanden support gratis",
    offerTotal: "Totaal offerte (incl. btw)",
    thisInvoice: "Deze voorschotfactuur — nu te betalen",
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
    whatYouGet: "Ce que vous obtenez",
    included: "inclus",
    monthly: "par mois",
    discountLine: "Remise d'engagement (signature directe) −7%",
    afterDiscount: "Après remise (HTVA)",
    freeMonthsLine: "2 premiers mois de support offerts",
    offerTotal: "Total du devis (TVAC)",
    thisInvoice: "Cette facture d'acompte — à payer maintenant",
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
    whatYouGet: "What you get",
    included: "included",
    monthly: "per month",
    discountLine: "Lock-in discount (direct signature) −7%",
    afterDiscount: "After discount (excl. VAT)",
    freeMonthsLine: "First 2 months of support free",
    offerTotal: "Quote total (incl. VAT)",
    thisInvoice: "This deposit invoice — to pay now",
  },
};

const PRINT_CSS = `@page { margin: 0; }
@media print {
  html { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute !important; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 16mm 14mm; }
  .no-print { display: none !important; }
  .doc { border: none !important; box-shadow: none !important; }
  .doc + .doc { break-before: page; page-break-before: always; }
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
        "id, client_name, client_company, client_address, vat_number, vat_reverse, title, offer_no, amount_cents, items",
      )
      .in("id", offerIds);
    for (const o of (offs as OfferRef[]) ?? []) offerMap.set(o.id, o);
  }
  const subTiers = subscriptionTiers();

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

          // Volledige offerte-opbouw (zelfde detail als de offerte).
          const oItems = ref?.items ?? [];
          const oFull = ref?.amount_cents ?? 0;
          const oDiscount = oItems.reduce(
            (s, it) =>
              typeof it.cents === "number" && it.cents < 0
                ? s - it.cents
                : s,
            0,
          );
          const oGross = oFull + oDiscount;
          const oSubItem = oItems.find((it) => it.kind === "sub");
          const oSubTier = oSubItem
            ? subTiers.find((tier) =>
                oSubItem.label
                  .toLowerCase()
                  .includes(tier.name.toLowerCase()),
              )
            : undefined;
          const oFreeMonths =
            oDiscount > 0 && oSubTier ? oSubTier.cents * 2 : 0;
          const oVat = reverse ? 0 : Math.round(oFull * 0.21);
          const oIncl = oFull + oVat;
          const showDetail = !!ref && oItems.length > 0;

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

              {/* Volledige offerte-detail */}
              {showDetail && (
                <>
                  <div className="mt-7">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.whatYouGet}
                    </p>
                    <ul className="space-y-2.5">
                      {oItems.map((it, k) => {
                        const Icon = lineIcon(it.label);
                        const neg = it.cents < 0;
                        return (
                          <li
                            key={k}
                            className="flex items-start justify-between gap-4 border-b pb-2.5 text-sm last:border-0"
                          >
                            <span className="flex min-w-0 gap-3">
                              <Icon
                                className={`mt-0.5 h-4 w-4 shrink-0 ${
                                  it.kind === "sub"
                                    ? "text-orange-600 dark:text-orange-400"
                                    : neg
                                      ? "text-green-700 dark:text-green-400"
                                      : it.cents > 0
                                        ? "text-muted"
                                        : "text-accent"
                                }`}
                                strokeWidth={2}
                              />
                              <span className="min-w-0">
                                <span className="font-medium">
                                  {it.label}
                                </span>
                                {it.desc && (
                                  <span className="mt-0.5 block text-xs text-muted">
                                    {it.desc}
                                  </span>
                                )}
                              </span>
                            </span>
                            <span
                              className={`shrink-0 font-mono text-xs ${
                                it.kind === "sub"
                                  ? "text-orange-600 dark:text-orange-400"
                                  : neg
                                    ? "text-green-700 dark:text-green-400"
                                    : it.cents > 0
                                      ? "text-muted"
                                      : "text-accent"
                              }`}
                            >
                              {it.kind === "sub"
                                ? l.monthly
                                : neg
                                  ? `− ${eur(-it.cents)}`
                                  : it.cents > 0
                                    ? eur(it.cents)
                                    : l.included}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-6 space-y-1.5 rounded-xl border bg-background p-5 text-sm shadow-sm">
                    <div className="flex items-center justify-between text-muted">
                      <span>{l.subtotal}</span>
                      <span className="font-mono">
                        {eur(oDiscount > 0 ? oGross : oFull)}
                      </span>
                    </div>
                    {oDiscount > 0 && (
                      <>
                        <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                          <span>{l.discountLine}</span>
                          <span className="font-mono">
                            − {eur(oDiscount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted">
                          <span>{l.afterDiscount}</span>
                          <span className="font-mono">{eur(oFull)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-muted">
                      <span>{reverse ? l.reverse : l.vat}</span>
                      <span className="font-mono">{eur(oVat)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                      <span>{l.offerTotal}</span>
                      <span className="font-mono">{eur(oIncl)}</span>
                    </div>
                    {oSubItem && (
                      <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                        <span>{oSubItem.label}</span>
                        <span className="font-mono">{l.monthly}</span>
                      </div>
                    )}
                    {oFreeMonths > 0 && (
                      <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                        <span>{l.freeMonthsLine}</span>
                        <span className="font-mono">
                          − {eur(oFreeMonths)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Deze voorschotfactuur — nu te betalen */}
              <div className="mt-6 rounded-xl border-2 border-accent bg-background p-5 text-sm shadow-sm">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                  {l.thisInvoice}
                </p>
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

              {/* Acties — gecentreerd, naast elkaar */}
              <div className="no-print mt-7 flex flex-wrap items-center justify-center gap-3 border-t pt-6">
                <PrintButton label={l.print} />
                {mollieConfigured && !paid && (
                  <form action={payInvoice.bind(null, i.id)}>
                    <SubmitButton className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-card-hover sm:min-w-[190px]">
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
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full border bg-card-hover px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground sm:min-w-[140px]"
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
