import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { decideOffer } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";
import { PrintButton } from "@/components/print-button";
import {
  eur,
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Offer,
} from "@/lib/portal-shared";
import { subscriptionTiers } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type Doc = Offer & {
  client_name?: string | null;
  client_company?: string | null;
  client_address?: string | null;
  vat_number?: string | null;
  created_at: string;
};

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

const L: Record<
  Locale,
  {
    none: string;
    accept: string;
    reject: string;
    proof: string;
    print: string;
    daysLeft: (n: number) => string;
    expired: string;
    expiredNote: string;
    reverse: string;
    vat: string;
    subtotal: string;
    inclVat: string;
    valid: string;
    forWhom: string;
    from: string;
    whatYouGet: string;
    included: string;
    monthly: string;
    deposit: string;
    payToStart: string;
    terms: string;
    discountLine: string;
    afterDiscount: string;
    freeMonthsLine: string;
    payMollie: string;
    payTransfer: string;
    recommended: string;
    mollieKeep: string;
    transferLoss: string;
    chooseHint: string;
    promo: (validUntil: string) => string;
    lockinClause: (validUntil: string, deposit: string) => string;
    domainClause: string;
  }
> = {
  nl: {
    none: "Nog geen offerte. Zodra ik er een klaarzet, zie je 'm hier.",
    accept: "Goedkeuren",
    reject: "Afwijzen",
    proof: "Bevestiging / PDF",
    print: "Afdrukken / PDF",
    daysLeft: (n) => (n === 1 ? "nog 1 dag geldig" : `nog ${n} dagen geldig`),
    expired: "vervallen",
    expiredNote:
      "Deze offerte is vervallen — vraag gerust een nieuwe aan.",
    reverse: "Btw (0% — verlegd, intracommunautair)",
    vat: "Btw 21%",
    subtotal: "Subtotaal (excl. btw)",
    inclVat: "Totaal incl. btw",
    valid: "Geldig tot",
    forWhom: "Voor",
    from: "Van",
    whatYouGet: "Wat je krijgt",
    included: "inbegrepen",
    monthly: "per maand",
    deposit: "Voorschot 30% om te starten (incl. btw)",
    discountLine: "Vastlegkorting (directe ondertekening) −7%",
    afterDiscount: "Na korting (excl. btw)",
    freeMonthsLine: "Eerste 2 maanden support gratis",
    payMollie: "Online via Mollie",
    payTransfer: "Via overschrijving",
    recommended: "aanbevolen",
    mollieKeep: "Je behoudt 7% korting + 2 maanden support gratis.",
    transferLoss: "Geen korting, geen gratis maanden.",
    chooseHint:
      "Twee manieren om te betalen — online via Mollie is voordeliger:",
    promo: (v) =>
      `Beslis vóór ${v} en betaal online via Mollie: zo behoud je 7% korting én de eerste 2 maanden support gratis. Daarna of bij overschrijving vervalt dit voordeel.`,
    payToStart: "Bekijk je voorschotfactuur",
    terms: "Voorwaarden",
    lockinClause: (v, d) =>
      `Beslis je vóór ${v}, dan ligt de scope vast en behoud je 7% korting op het eenmalige bedrag én de eerste 2 maanden van het abonnement gratis. Na die datum vervalt dit aanbod automatisch. Het onderhoudsabonnement loopt minimum 12 maanden en wordt daarna stilzwijgend verlengd (opzegbaar mits opzeg). Betaling: 30% voorschot (${d}) om te starten, de resterende 70% vóór de site live gaat. Alle betalingen verlopen uitsluitend via je beveiligde klantenportaal — geen uitzonderingen. Zodra je akkoord geeft staat de voorschotfactuur meteen klaar; na betaling start het project en vind je de betaalde factuur onmiddellijk in je portaal.`,
    domainClause:
      "Domein & e-mail: of we je bestaande domein vlot kunnen meenemen hangt af van hoe makkelijk je huidige provider de gegevens vrijgeeft. Daar kunnen kosten aan verbonden zijn, en het domeinabonnement (de jaarlijkse verlenging) blijft steeds ten laste van jou. Dit bespreken we samen en wordt — afhankelijk van het geval — verrekend op de slotfactuur; een exact bedrag kunnen we hier dus nog niet vastleggen.",
  },
  fr: {
    none: "Aucun devis pour l'instant.",
    accept: "Approuver",
    reject: "Refuser",
    proof: "Confirmation / PDF",
    print: "Imprimer / PDF",
    daysLeft: (n) =>
      n === 1 ? "valable encore 1 jour" : `valable encore ${n} jours`,
    expired: "expiré",
    expiredNote: "Ce devis a expiré — demandez-en un nouveau.",
    reverse: "TVA (0% — autoliquidée, intracommunautaire)",
    vat: "TVA 21%",
    subtotal: "Sous-total (HTVA)",
    inclVat: "Total TVAC",
    valid: "Valable jusqu'au",
    forWhom: "Pour",
    from: "De",
    whatYouGet: "Ce que vous obtenez",
    included: "inclus",
    monthly: "par mois",
    deposit: "Acompte 30% pour démarrer (TVAC)",
    discountLine: "Remise d'engagement (signature directe) −7%",
    afterDiscount: "Après remise (HTVA)",
    freeMonthsLine: "2 premiers mois de support offerts",
    payMollie: "En ligne via Mollie",
    payTransfer: "Par virement",
    recommended: "recommandé",
    mollieKeep:
      "Vous conservez 7% de remise + 2 mois de support offerts.",
    transferLoss: "Pas de remise, pas de mois offerts.",
    chooseHint:
      "Deux façons de payer — en ligne via Mollie est plus avantageux :",
    promo: (v) =>
      `Décidez avant le ${v} et payez en ligne via Mollie : vous conservez 7% de remise et les 2 premiers mois de support offerts. Passé ce délai ou par virement, cet avantage expire.`,
    payToStart: "Voir votre facture d'acompte",
    terms: "Conditions",
    lockinClause: (v, d) =>
      `Si vous décidez avant le ${v}, le périmètre est fixé et vous conservez 7% de remise sur le montant unique ainsi que les 2 premiers mois d'abonnement gratuits. Passé cette date, l'offre expire automatiquement. L'abonnement de maintenance court minimum 12 mois, puis est reconduit tacitement (résiliable moyennant préavis). Paiement : acompte de 30% (${d}) pour démarrer, les 70% restants avant la mise en ligne. Tous les paiements se font exclusivement via votre portail client sécurisé — sans exception. Dès votre accord, la facture d'acompte est disponible ; après paiement le projet démarre et la facture payée apparaît aussitôt dans votre portail.`,
    domainClause:
      "Domaine & e-mail : la reprise de votre domaine existant dépend de la facilité avec laquelle votre fournisseur actuel libère les données. Des frais peuvent s'appliquer, et l'abonnement du domaine (le renouvellement annuel) reste toujours à votre charge. Nous en discutons ensemble ; selon le cas, cela est décompté sur la facture finale — un montant exact ne peut donc pas être fixé ici.",
  },
  en: {
    none: "No quote yet.",
    accept: "Approve",
    reject: "Decline",
    proof: "Confirmation / PDF",
    print: "Print / PDF",
    daysLeft: (n) => (n === 1 ? "1 day left" : `${n} days left`),
    expired: "expired",
    expiredNote: "This quote has expired — request a new one.",
    reverse: "VAT (0% — reverse-charged, intra-EU)",
    vat: "VAT 21%",
    subtotal: "Subtotal (excl. VAT)",
    inclVat: "Total incl. VAT",
    valid: "Valid until",
    forWhom: "For",
    from: "From",
    whatYouGet: "What you get",
    included: "included",
    monthly: "per month",
    deposit: "30% deposit to start (incl. VAT)",
    discountLine: "Lock-in discount (direct signature) −7%",
    afterDiscount: "After discount (excl. VAT)",
    freeMonthsLine: "First 2 months of support free",
    payMollie: "Online via Mollie",
    payTransfer: "By bank transfer",
    recommended: "recommended",
    mollieKeep: "You keep 7% off + 2 months of free support.",
    transferLoss: "No discount, no free months.",
    chooseHint:
      "Two ways to pay — online via Mollie is the better deal:",
    promo: (v) =>
      `Decide before ${v} and pay online via Mollie: you keep 7% off and the first 2 months of support free. After that, or by bank transfer, this benefit expires.`,
    payToStart: "View your deposit invoice",
    terms: "Terms",
    lockinClause: (v, d) =>
      `If you decide before ${v}, the scope is locked and you keep 7% off the one-off amount plus the first 2 months of the subscription free. After that date this offer expires automatically. The maintenance subscription runs for a minimum of 12 months and then renews automatically (cancellable with notice). Payment: 30% deposit (${d}) to start, the remaining 70% before the site goes live. All payments go exclusively through your secure client portal — no exceptions. Once you approve, the deposit invoice is ready immediately; after payment the project starts and the paid invoice appears in your portal right away.`,
    domainClause:
      "Domain & email: whether we can smoothly migrate your existing domain depends on how easily your current provider releases the data. Costs may apply, and the domain subscription (the yearly renewal) always remains your responsibility. We discuss this together and, depending on the case, it is settled on the final invoice — an exact amount can't be fixed here.",
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
  .offer-doc { border: none !important; box-shadow: none !important; }
  .offer-doc + .offer-doc { break-before: page; page-break-before: always; }
  .page-break { break-before: page; page-break-before: always; padding-top: 16mm; }
  .print-head { display: flex !important; }
}
.print-head { display: none; }`;

export default async function PortalOffers({
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
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  const offers = (data as Doc[]) ?? [];
  const subTiers = subscriptionTiers();

  const unseen = offers
    .filter((o) => o.status === "open")
    .map((o) => o.id);
  if (unseen.length > 0) {
    await sb
      .from("offers")
      .update({ viewed_at: new Date().toISOString() })
      .in("id", unseen)
      .is("viewed_at", null);
  }

  // eslint-disable-next-line react-hooks/purity
  const todayMs = Date.now();
  const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - todayMs) / 86400000);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.offers}
      </h1>

      <div id="print-area" className="mt-8 space-y-8">
        {offers.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {offers.map((o) => {
          const amount = o.amount_cents ?? 0;
          const vat = o.vat_reverse ? 0 : Math.round(amount * 0.21);
          const incl = amount + vat;
          const items = o.items ?? [];
          const discount = items.reduce(
            (s, it) =>
              typeof it.cents === "number" && it.cents < 0
                ? s - it.cents
                : s,
            0,
          );
          const hasLockin = discount > 0;
          const gross = amount + discount;
          const subItem = items.find((it) => it.kind === "sub");
          const subTier = subItem
            ? subTiers.find((tier) =>
                subItem.label
                  .toLowerCase()
                  .includes(tier.name.toLowerCase()),
              )
            : undefined;
          const freeMonths =
            hasLockin && subTier ? subTier.cents * 2 : 0;
          // Online via Mollie = met korting; via overschrijving =
          // volle prijs (geen 7%, geen 2 gratis maanden).
          const grossVat = o.vat_reverse
            ? 0
            : Math.round(gross * 0.21);
          const grossIncl = gross + grossVat;
          const molInclCents = incl; // korting al verrekend
          const molDeposit = Math.round(molInclCents * 0.3);
          const transDeposit = Math.round(grossIncl * 0.3);
          const deposit = hasLockin ? molDeposit : 0;
          const expired =
            !!o.valid_until && daysUntil(o.valid_until) < 0;
          // Oude offertes hadden de voorwaarden in de klanttekst.
          // Die worden nu apart onder de bedragen getoond — filter de
          // legacy-clausules zodat ze niet dubbel verschijnen.
          const paragraphs = (o.body ?? "")
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean)
            .filter(
              (p) =>
                !/^Beslis je v[oó]{2}r de vervaldatum/i.test(p) &&
                !/^Domein\s*&(amp;)?\s*e-?mail/i.test(p) &&
                !/^(Si vous d[ée]cidez avant|If you decide before)/i.test(
                  p,
                ) &&
                !/^(Domaine\s*&|Domain\s*&)/i.test(p),
            );

          return (
            <article
              key={o.id}
              className="offer-doc rounded-2xl border bg-card p-6 sm:p-9"
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
                    Offerte
                  </p>
                  <p className="mt-1 font-semibold tracking-tight">
                    {o.offer_no ?? "—"}
                  </p>
                  <p className="text-xs text-muted">
                    {dt(o.created_at, locale)}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                      o.status,
                    )}`}
                  >
                    {statusLabel(o.status, locale)}
                  </span>
                </div>
              </div>

              {/* Van / Voor */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {l.from}
                  </p>
                  <p className="font-medium">Studio VM — Vincent Montreuil</p>
                  <p className="text-muted">studio-vm.be</p>
                </div>
                {(o.client_name ||
                  o.client_company ||
                  o.client_address ||
                  o.vat_number) && (
                  <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.forWhom}
                    </p>
                    {o.client_company && (
                      <p className="font-medium">{o.client_company}</p>
                    )}
                    {o.client_name && <p>{o.client_name}</p>}
                    {o.client_address && (
                      <p className="text-muted">{o.client_address}</p>
                    )}
                    {o.vat_number && (
                      <p className="font-mono text-xs text-muted">
                        {o.vat_number}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <h2 className="mt-7 text-xl font-semibold tracking-tight sm:text-2xl">
                {o.title}
              </h2>

              {/* Toelichting */}
              {paragraphs.length > 0 && (
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Lijnen — op een nieuwe pagina bij afdrukken */}
              {items.length > 0 && (
                <div className="page-break mt-7">
                  <div className="print-head mb-6 items-end justify-between border-b pb-4">
                    <p className="text-3xl font-extrabold lowercase leading-none tracking-tighter">
                      vm<span className="text-accent">.</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Offerte {o.offer_no ?? ""}
                    </p>
                  </div>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {l.whatYouGet}
                  </p>
                  <ul className="space-y-2.5">
                    {items.map((it, i) => {
                      const Icon = lineIcon(it.label);
                      const neg =
                        typeof it.cents === "number" && it.cents < 0;
                      return (
                        <li
                          key={i}
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
              )}

              {/* Totalen */}
              {o.amount_cents != null && (
                <div className="page-break mt-6 rounded-xl border bg-background p-5 text-sm">
                  {hasLockin ? (
                    <>
                      <div className="-mx-1 mb-4 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white">
                        ⚡{" "}
                        {l.promo(
                          o.valid_until
                            ? dt(o.valid_until, locale)
                            : "—",
                        )}
                      </div>
                      <p className="mb-3 text-xs font-medium text-muted">
                        {l.chooseHint}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Online via Mollie — met korting */}
                        <div className="rounded-xl border-2 border-accent bg-card p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">
                              {l.payMollie}
                            </p>
                            <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white">
                              {l.recommended}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-muted">
                              <span>{l.subtotal}</span>
                              <span className="font-mono">
                                {eur(gross)}
                              </span>
                            </div>
                            <div className="-mx-1 flex justify-between rounded-lg bg-green-600 px-2 py-1 font-semibold text-white">
                              <span>{l.discountLine}</span>
                              <span className="font-mono">
                                − {eur(discount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>
                                {o.vat_reverse ? l.reverse : l.vat}
                              </span>
                              <span className="font-mono">
                                {eur(vat)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-bold">
                              <span>{l.inclVat}</span>
                              <span className="font-mono">
                                {eur(incl)}
                              </span>
                            </div>
                            {freeMonths > 0 && (
                              <div className="-mx-1 flex justify-between rounded-lg bg-green-600 px-2 py-1 font-semibold text-white">
                                <span>{l.freeMonthsLine}</span>
                                <span className="font-mono">
                                  − {eur(freeMonths)}
                                </span>
                              </div>
                            )}
                            {molDeposit > 0 && (
                              <div className="-mx-1 mt-1 flex justify-between rounded-lg bg-foreground px-3 py-2 font-semibold text-background">
                                <span>{l.deposit}</span>
                                <span className="font-mono">
                                  {eur(molDeposit)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] font-medium text-green-700 dark:text-green-400">
                            ✓ {l.mollieKeep}
                          </p>
                        </div>
                        {/* Via overschrijving — volle prijs */}
                        <div className="rounded-xl border bg-background p-4">
                          <p className="font-semibold text-muted">
                            {l.payTransfer}
                          </p>
                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-muted">
                              <span>{l.subtotal}</span>
                              <span className="font-mono">
                                {eur(gross)}
                              </span>
                            </div>
                            <div className="flex justify-between text-muted">
                              <span>
                                {o.vat_reverse ? l.reverse : l.vat}
                              </span>
                              <span className="font-mono">
                                {eur(grossVat)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-base font-bold">
                              <span>{l.inclVat}</span>
                              <span className="font-mono">
                                {eur(grossIncl)}
                              </span>
                            </div>
                            {transDeposit > 0 && (
                              <div className="-mx-1 mt-1 flex justify-between rounded-lg border px-3 py-2 font-semibold">
                                <span>{l.deposit}</span>
                                <span className="font-mono">
                                  {eur(transDeposit)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="mt-2 text-[11px] text-muted">
                            {l.transferLoss}
                          </p>
                        </div>
                      </div>
                      {subItem && (
                        <div className="mt-3 flex justify-between text-orange-600 dark:text-orange-400">
                          <span>{subItem.label}</span>
                          <span className="font-mono">{l.monthly}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-muted">
                        <span>{l.subtotal}</span>
                        <span className="font-mono">{eur(amount)}</span>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>
                          {o.vat_reverse ? l.reverse : l.vat}
                        </span>
                        <span className="font-mono">{eur(vat)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2.5 text-base font-semibold">
                        <span>{l.inclVat}</span>
                        <span className="font-mono">{eur(incl)}</span>
                      </div>
                      {subItem && (
                        <div className="flex justify-between text-orange-600 dark:text-orange-400">
                          <span>{subItem.label}</span>
                          <span className="font-mono">{l.monthly}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                      {l.terms}
                    </p>
                    {deposit > 0 && (
                      <p className="mb-2 text-xs leading-relaxed text-muted">
                        {l.lockinClause(
                          o.valid_until
                            ? dt(o.valid_until, locale)
                            : "—",
                          eur(deposit),
                        )}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed text-muted">
                      {l.domainClause}
                    </p>
                  </div>
                </div>
              )}

              {o.valid_until && (
                <p className="mt-4 text-xs text-muted">
                  {l.valid}{" "}
                  <strong className="text-foreground">
                    {dt(o.valid_until, locale)}
                  </strong>
                  {o.status === "open" && !expired
                    ? ` · ${l.daysLeft(daysUntil(o.valid_until))}`
                    : ""}
                </p>
              )}

              {/* Acties — gecentreerd, naast elkaar */}
              <div className="no-print mt-7 flex flex-wrap items-center justify-center gap-3 border-t pt-6">
                <PrintButton label={l.print} />
                {o.status === "open" && !expired && (
                  <>
                    <form
                      action={decideOffer.bind(null, o.id, "akkoord")}
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <SubmitButton className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-card-hover sm:min-w-[190px]">
                        {l.accept}
                      </SubmitButton>
                    </form>
                    <form
                      action={decideOffer.bind(null, o.id, "afgewezen")}
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <SubmitButton className="inline-flex items-center justify-center whitespace-nowrap rounded-full border bg-card-hover px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground sm:min-w-[160px]">
                        {l.reject}
                      </SubmitButton>
                    </form>
                  </>
                )}
                {o.status === "open" && expired && (
                  <span className="flex items-center justify-center rounded-full bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white">
                    {l.expiredNote}
                  </span>
                )}
                {o.status === "akkoord" && (
                  <Link
                    href={`/${locale}/portail/dashboard/facturen`}
                    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-card-hover sm:min-w-[190px]"
                  >
                    {l.payToStart}
                    <span aria-hidden>&rarr;</span>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
