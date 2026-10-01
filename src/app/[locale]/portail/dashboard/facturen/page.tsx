import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured, mollieConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { payInvoice } from "@/app/actions/portal-client";
import { BANK, structuredComm } from "@/lib/bank";
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
  paid_at: string | null;
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
    choosePay: string;
    recommended: string;
    mollieName: string;
    mollieDesc: string;
    transferName: string;
    noDiscount: string;
    holder: string;
    ibanL: string;
    bicL: string;
    commL: string;
    amountL: string;
    promoInv: string;
    termsTitle: string;
    terms: string;
    youSave: string;
    insteadOf: string;
    paid: string;
    paidOn: string;
    // 3D-projecten (uurtarief, geen voorschot/abonnement/domein)
    pThisInvoice: string;
    pChoosePay: string;
    pMollieDesc: string;
    pTransferDesc: string;
    pTerms: string;
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
    choosePay: "Hoe wil je dit voorschot betalen?",
    recommended: "Aanbevolen",
    mollieName: "Online via Mollie",
    mollieDesc:
      "Direct & veilig (Bancontact, kaart…). Je betaling is meteen verwerkt en je project start zonder vertraging.",
    transferName: "Via overschrijving",
    noDiscount:
      "Geen korting, geen gratis maanden. Trager: je project start pas zodra de overschrijving binnen is.",
    holder: "Begunstigde",
    ibanL: "IBAN",
    bicL: "BIC",
    commL: "Gestructureerde mededeling",
    amountL: "Bedrag (incl. btw)",
    promoInv:
      "Je behield 7% korting + 2 maanden gratis support door tijdig te tekenen. Betaal dit voorschot om je project te starten.",
    termsTitle: "Voorwaarden",
    terms:
      "Betaling: 30% voorschot om te starten, de resterende 70% vóór de site live gaat. Alle betalingen verlopen uitsluitend via je beveiligde klantenportaal — geen uitzonderingen. Het onderhoudsabonnement heeft een minimumlooptijd van 1 jaar en wordt, zonder schriftelijke opzegging minstens 1 maand vóór het einde van de jaarperiode, telkens stilzwijgend met één jaar verlengd. Domein & e-mail (overname/verlenging) zijn ten laste van de klant en worden, afhankelijk van het geval, op de slotfactuur verrekend. Volledige voorwaarden: studio-vm.be/nl/voorwaarden.",
    youSave: "Je bespaart",
    insteadOf: "i.p.v.",
    paid: "Betaald",
    paidOn: "Betaald op",
    pThisInvoice: "Deze factuur — nu te betalen",
    pChoosePay: "Hoe wil je deze factuur betalen?",
    pMollieDesc:
      "Direct & veilig (Bancontact, kaart…). Je betaling is meteen verwerkt en je modelbestanden komen zonder vertraging vrij.",
    pTransferDesc:
      "Trager: je modelbestanden komen pas vrij zodra de overschrijving binnen is.",
    pTerms:
      "Uurtarief excl. btw, op basis van de werkelijk gepresteerde uren (minimum 1 uur). Revisies na planwijzigingen worden aan hetzelfde uurtarief aangerekend. De modelbestanden worden in je klantenportaal vrijgegeven zodra deze factuur betaald is. Alle betalingen verlopen via je beveiligde klantenportaal. Volledige voorwaarden: studio-vm.be/nl/voorwaarden.",
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
    choosePay: "Comment payer cet acompte ?",
    recommended: "Recommandé",
    mollieName: "En ligne via Mollie",
    mollieDesc:
      "Direct & sécurisé (Bancontact, carte…). Paiement traité immédiatement, votre projet démarre sans délai.",
    transferName: "Par virement",
    noDiscount:
      "Pas de remise, pas de mois offerts. Plus lent : le projet démarre une fois le virement reçu.",
    holder: "Bénéficiaire",
    ibanL: "IBAN",
    bicL: "BIC",
    commL: "Communication structurée",
    amountL: "Montant (TVAC)",
    promoInv:
      "Vous avez conservé 7% de remise + 2 mois de support offerts en signant à temps. Payez cet acompte pour démarrer votre projet.",
    termsTitle: "Conditions",
    terms:
      "Paiement : acompte de 30% pour démarrer, les 70% restants avant la mise en ligne. Tous les paiements se font exclusivement via votre portail client sécurisé — sans exception. L'abonnement de maintenance a une durée minimale d'1 an et est, sauf résiliation écrite au moins 1 mois avant la fin de la période annuelle, reconduit tacitement pour un an à chaque fois. Domaine & e-mail (reprise/renouvellement) sont à charge du client et, selon le cas, décomptés sur la facture finale. Conditions complètes : studio-vm.be/fr/voorwaarden.",
    youSave: "Vous économisez",
    insteadOf: "au lieu de",
    paid: "Payée",
    paidOn: "Payée le",
    pThisInvoice: "Cette facture — à payer maintenant",
    pChoosePay: "Comment payer cette facture ?",
    pMollieDesc:
      "Direct & sécurisé (Bancontact, carte…). Paiement traité immédiatement, vos fichiers du modèle sont débloqués sans délai.",
    pTransferDesc:
      "Plus lent : vos fichiers du modèle sont débloqués une fois le virement reçu.",
    pTerms:
      "Tarif horaire HTVA, sur base des heures réellement prestées (minimum 1 heure). Les révisions suite à une modification des plans sont facturées au même tarif horaire. Les fichiers du modèle sont débloqués dans votre espace client dès que cette facture est payée. Tous les paiements se font via votre espace client sécurisé. Conditions complètes : studio-vm.be/fr/voorwaarden.",
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
    choosePay: "How would you like to pay this deposit?",
    recommended: "Recommended",
    mollieName: "Online via Mollie",
    mollieDesc:
      "Instant & secure (Bancontact, card…). Payment is processed immediately and your project starts without delay.",
    transferName: "By bank transfer",
    noDiscount:
      "No discount, no free months. Slower: your project starts once the transfer arrives.",
    holder: "Beneficiary",
    ibanL: "IBAN",
    bicL: "BIC",
    commL: "Structured reference",
    amountL: "Amount (incl. VAT)",
    promoInv:
      "You kept 7% off + 2 months of support free by signing in time. Pay this deposit to start your project.",
    termsTitle: "Terms",
    terms:
      "Payment: 30% deposit to start, the remaining 70% before the site goes live. All payments go exclusively through your secure client portal — no exceptions. The maintenance subscription has a minimum term of 1 year and, unless cancelled in writing at least 1 month before the end of the yearly term, renews tacitly for one year each time. Domain & email (transfer/renewal) are borne by the client and, depending on the case, settled on the final invoice. Full terms: studio-vm.be/en/voorwaarden.",
    youSave: "You save",
    insteadOf: "instead of",
    paid: "Paid",
    paidOn: "Paid on",
    pThisInvoice: "This invoice — to pay now",
    pChoosePay: "How would you like to pay this invoice?",
    pMollieDesc:
      "Instant & secure (Bancontact, card…). Payment is processed immediately and your model files are released without delay.",
    pTransferDesc:
      "Slower: your model files are released once the transfer arrives.",
    pTerms:
      "Hourly rate excl. VAT, based on the hours actually worked (1 hour minimum). Revisions after plan changes are charged at the same hourly rate. The model files are released in your client portal as soon as this invoice is paid. All payments go through your secure client portal. Full terms: studio-vm.be/en/voorwaarden.",
  },
  de: {
    none: "Keine Rechnungen.",
    pdf: "PDF",
    pay: "Über Mollie bezahlen",
    print: "Drucken / PDF",
    invoice: "Rechnung",
    from: "Von",
    forWhom: "Für",
    subtotal: "Zwischensumme (exkl. MwSt.)",
    vat: "MwSt. 21%",
    reverse: "MwSt. (0 % — Reverse-Charge, innergemeinschaftlich)",
    inclVat: "Gesamt inkl. MwSt.",
    due: "Zahlbar bis",
    paidNote: "Bezahlt — vielen Dank!",
    whatYouGet: "Was Sie erhalten",
    included: "inklusive",
    monthly: "pro Monat",
    discountLine: "Festschreibungsrabatt (direkte Unterzeichnung) −7%",
    afterDiscount: "Nach Rabatt (exkl. MwSt.)",
    freeMonthsLine: "Die ersten 2 Monate Support kostenlos",
    offerTotal: "Angebotssumme (inkl. MwSt.)",
    thisInvoice: "Diese Anzahlungsrechnung — jetzt zu bezahlen",
    choosePay: "Wie möchten Sie diese Anzahlung bezahlen?",
    recommended: "Empfohlen",
    mollieName: "Online über Mollie",
    mollieDesc:
      "Sofort & sicher (Bancontact, Karte…). Ihre Zahlung wird umgehend verarbeitet und Ihr Projekt startet ohne Verzögerung.",
    transferName: "Per Überweisung",
    noDiscount:
      "Kein Rabatt, keine kostenlosen Monate. Langsamer: Ihr Projekt startet erst, wenn die Überweisung eingegangen ist.",
    holder: "Empfänger",
    ibanL: "IBAN",
    bicL: "BIC",
    commL: "Strukturierte Mitteilung",
    amountL: "Betrag (inkl. MwSt.)",
    promoInv:
      "Durch rechtzeitige Unterzeichnung haben Sie 7 % Rabatt + 2 Monate kostenlosen Support behalten. Bezahlen Sie diese Anzahlung, um Ihr Projekt zu starten.",
    termsTitle: "Bedingungen",
    terms:
      "Zahlung: 30 % Anzahlung zum Start, die restlichen 70 % bevor die Website live geht. Alle Zahlungen erfolgen ausschließlich über Ihr gesichertes Kundenportal — ohne Ausnahme. Das Wartungsabonnement hat eine Mindestlaufzeit von 1 Jahr und verlängert sich, sofern es nicht mindestens 1 Monat vor Ende des Jahreszeitraums schriftlich gekündigt wird, jeweils stillschweigend um ein Jahr. Domain & E-Mail (Übernahme/Verlängerung) gehen zu Lasten des Kunden und werden je nach Fall mit der Schlussrechnung verrechnet. Vollständige Bedingungen: studio-vm.be/de/voorwaarden.",
    youSave: "Sie sparen",
    insteadOf: "statt",
    paid: "Bezahlt",
    paidOn: "Bezahlt am",
    pThisInvoice: "Diese Rechnung — jetzt zu bezahlen",
    pChoosePay: "Wie möchten Sie diese Rechnung bezahlen?",
    pMollieDesc:
      "Sofort & sicher (Bancontact, Karte…). Ihre Zahlung wird umgehend verarbeitet und Ihre Modelldateien werden ohne Verzögerung freigegeben.",
    pTransferDesc:
      "Langsamer: Ihre Modelldateien werden erst freigegeben, wenn die Überweisung eingegangen ist.",
    pTerms:
      "Stundensatz exkl. MwSt., auf Basis der tatsächlich geleisteten Stunden (mindestens 1 Stunde). Revisionen nach Planänderungen werden zum gleichen Stundensatz berechnet. Die Modelldateien werden in Ihrem Kundenportal freigegeben, sobald diese Rechnung bezahlt ist. Alle Zahlungen erfolgen über Ihr gesichertes Kundenportal. Vollständige Bedingungen: studio-vm.be/de/voorwaarden.",
  },
  es: {
    none: "No hay facturas.",
    pdf: "PDF",
    pay: "Pagar con Mollie",
    print: "Imprimir / PDF",
    invoice: "Factura",
    from: "De",
    forWhom: "Para",
    subtotal: "Subtotal (IVA no incluido)",
    vat: "IVA 21%",
    reverse: "IVA (0 % — inversión del sujeto pasivo, intracomunitario)",
    inclVat: "Total IVA incluido",
    due: "Pagadera antes del",
    paidNote: "Pagada — ¡muchas gracias!",
    whatYouGet: "Lo que obtiene",
    included: "incluido",
    monthly: "al mes",
    discountLine: "Descuento por compromiso (firma inmediata) −7%",
    afterDiscount: "Tras el descuento (IVA no incluido)",
    freeMonthsLine: "Los 2 primeros meses de soporte gratis",
    offerTotal: "Total del presupuesto (IVA incluido)",
    thisInvoice: "Esta factura de anticipo — a pagar ahora",
    choosePay: "¿Cómo desea pagar este anticipo?",
    recommended: "Recomendado",
    mollieName: "En línea con Mollie",
    mollieDesc:
      "Inmediato y seguro (Bancontact, tarjeta…). Su pago se procesa al instante y su proyecto empieza sin demora.",
    transferName: "Por transferencia bancaria",
    noDiscount:
      "Sin descuento ni meses gratis. Más lento: su proyecto no empieza hasta que se recibe la transferencia.",
    holder: "Beneficiario",
    ibanL: "IBAN",
    bicL: "BIC",
    commL: "Comunicación estructurada",
    amountL: "Importe (IVA incluido)",
    promoInv:
      "Ha conservado el 7 % de descuento + 2 meses de soporte gratis al firmar a tiempo. Pague este anticipo para iniciar su proyecto.",
    termsTitle: "Condiciones",
    terms:
      "Pago: anticipo del 30 % para empezar y el 70 % restante antes de que el sitio se publique. Todos los pagos se realizan exclusivamente a través de su portal de cliente seguro — sin excepciones. La suscripción de mantenimiento tiene una duración mínima de 1 año y, salvo cancelación por escrito al menos 1 mes antes del final del periodo anual, se renueva tácitamente por un año cada vez. El dominio y el correo electrónico (traslado/renovación) corren a cargo del cliente y, según el caso, se liquidan en la factura final. Condiciones completas: studio-vm.be/es/voorwaarden.",
    youSave: "Ahorra",
    insteadOf: "en lugar de",
    paid: "Pagada",
    paidOn: "Pagada el",
    pThisInvoice: "Esta factura — a pagar ahora",
    pChoosePay: "¿Cómo desea pagar esta factura?",
    pMollieDesc:
      "Inmediato y seguro (Bancontact, tarjeta…). Su pago se procesa al instante y sus archivos del modelo se liberan sin demora.",
    pTransferDesc:
      "Más lento: sus archivos del modelo se liberan cuando se recibe la transferencia.",
    pTerms:
      "Tarifa por hora, IVA no incluido, según las horas realmente trabajadas (mínimo 1 hora). Las revisiones por cambios en los planos se facturan a la misma tarifa por hora. Los archivos del modelo se liberan en su portal de cliente en cuanto se paga esta factura. Todos los pagos se realizan a través de su portal de cliente seguro. Condiciones completas: studio-vm.be/es/voorwaarden.",
  },
};

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

  // Facturen van een 3D-project (rechtstreeks gekoppeld of via de
  // offerte): uurtarief, zonder voorschot/korting/abonnement/domein.
  const projectFacturen = new Set<string>();
  const projectOffertes = new Set<string>();
  if (invoices.length > 0) {
    const invIds = invoices.map((i) => i.id);
    const [{ data: viaFactuur }, { data: viaOfferte }] = await Promise.all([
      sb.from("projecten").select("invoice_id").in("invoice_id", invIds),
      offerIds.length > 0
        ? sb.from("projecten").select("offer_id").in("offer_id", offerIds)
        : Promise.resolve({ data: [] }),
    ]);
    for (const r of (viaFactuur as { invoice_id: string }[] | null) ?? [])
      projectFacturen.add(r.invoice_id);
    for (const r of (viaOfferte as { offer_id: string }[] | null) ?? [])
      projectOffertes.add(r.offer_id);
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
          const isProject =
            projectFacturen.has(i.id) ||
            (!!i.offer_id && projectOffertes.has(i.offer_id));
          const reverse = !!ref?.vat_reverse;
          const amount = i.amount_cents;
          const vat = reverse ? 0 : Math.round(amount * 0.21);
          const incl = amount + vat;
          const paid = i.status === "betaald";
          // Mollie = voordeligst (7% korting verrekend). Bij
          // overschrijving vervalt de korting → hoger bedrag.

          // Volledige offerte-opbouw (zelfde detail als de offerte).
          const oItems = ref?.items ?? [];
          const oFull = ref?.amount_cents ?? 0;
          // Bij een project is een negatieve lijn een gewone korting,
          // geen vastlegkorting — die logica (7%, voorschot) geldt niet.
          const oDiscount = isProject
            ? 0
            : oItems.reduce(
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
          // Projectfactuur = gewerkte uren; de offerte-opbouw (raming)
          // tonen we daar niet.
          const showDetail = !!ref && oItems.length > 0 && !isProject;

          // Betaalbedragen: Mollie = met korting (= deze factuur);
          // overschrijving = zonder de 7% → evenredig hoger.
          const hasDiscount =
            oFull > 0 && oDiscount > 0 && amount < oFull;
          const mollieIncl = incl;
          const transferExcl = hasDiscount
            ? Math.round(amount / 0.93)
            : amount;
          const transferVat = reverse
            ? 0
            : Math.round(transferExcl * 0.21);
          const transferIncl = transferExcl + transferVat;
          const savings = Math.max(0, transferIncl - mollieIncl);

          return (
            <article
              key={i.id}
              className="doc rounded-2xl bg-card shadow-sm p-6 sm:p-9"
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
                      <span className="shrink-0 whitespace-nowrap font-mono">
                        {eur(oDiscount > 0 ? oGross : oFull)}
                      </span>
                    </div>
                    {oDiscount > 0 && (
                      <>
                        <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                          <span>{l.discountLine}</span>
                          <span className="shrink-0 whitespace-nowrap font-mono">
                            − {eur(oDiscount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted">
                          <span>{l.afterDiscount}</span>
                          <span className="shrink-0 whitespace-nowrap font-mono">{eur(oFull)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-muted">
                      <span>{reverse ? l.reverse : l.vat}</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">{eur(oVat)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                      <span>{l.offerTotal}</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">{eur(oIncl)}</span>
                    </div>
                    {oSubItem && (
                      <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
                        <span>{oSubItem.label}</span>
                        <span className="shrink-0 whitespace-nowrap font-mono">{l.monthly}</span>
                      </div>
                    )}
                    {oFreeMonths > 0 && (
                      <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
                        <span>{l.freeMonthsLine}</span>
                        <span className="shrink-0 whitespace-nowrap font-mono">
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
                  {isProject ? l.pThisInvoice : l.thisInvoice}
                </p>
                <div className="flex items-center justify-between text-muted">
                  <span>{l.subtotal}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">{eur(amount)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-muted">
                  <span>{reverse ? l.reverse : l.vat}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">{eur(vat)}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-base font-semibold">
                  <span>{l.inclVat}</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">{eur(incl)}</span>
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
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
                    <span className="inline-flex -rotate-3 items-center gap-2 rounded-lg border-2 border-green-600 px-4 py-2 text-base font-extrabold uppercase tracking-widest text-green-600">
                      ✓ {l.paid}
                    </span>
                    {i.paid_at && (
                      <span className="text-sm text-muted">
                        {l.paidOn}{" "}
                        <strong className="text-foreground">
                          {dt(i.paid_at, locale)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Voorwaarden — print mee met de factuur */}
              <div className="mt-6 rounded-xl border bg-background p-5 text-sm shadow-sm">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {l.termsTitle}
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  {isProject ? l.pTerms : l.terms}
                </p>
              </div>

              {/* Betaalkeuze — Mollie vs overschrijving */}
              {!paid && (
                <div className="mt-12 border-t pt-10">
                  {oDiscount > 0 && (
                    <div className="-mx-1 mb-5 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white">
                      ⚡ {l.promoInv}
                    </div>
                  )}
                  <p className="mb-4 text-base font-semibold">
                    {isProject ? l.pChoosePay : l.choosePay}
                  </p>
                  <div className="grid items-stretch gap-3 sm:grid-cols-2">
                    {/* Online via Mollie — voordeligst */}
                    <div className="flex flex-col rounded-xl border-2 border-accent bg-background p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{l.mollieName}</p>
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white">
                          {l.recommended}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {isProject ? l.pMollieDesc : l.mollieDesc}
                      </p>
                      <div className="mt-4 flex-1 border-t pt-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {l.amountL}
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold text-accent">
                          {eur(mollieIncl)}
                        </p>
                        {savings > 0 && (
                          <p className="mt-1 text-xs text-muted">
                            <span className="line-through">
                              {eur(transferIncl)}
                            </span>{" "}
                            ·{" "}
                            <span className="font-semibold text-green-700 dark:text-green-400">
                              {l.youSave} {eur(savings)}
                            </span>
                          </p>
                        )}
                      </div>
                      {mollieConfigured && (
                        <form
                          action={payInvoice.bind(null, i.id)}
                          className="no-print mt-4"
                        >
                          <SubmitButton className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                            {l.pay}
                            <span aria-hidden>&rarr;</span>
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                    {/* Via overschrijving */}
                    <div className="flex flex-col rounded-xl border bg-background p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{l.transferName}</p>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {isProject ? l.pTransferDesc : l.noDiscount}
                      </p>
                      <dl className="mt-4 flex-1 space-y-3 border-t pt-4 text-sm">
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            {l.holder}
                          </dt>
                          <dd className="mt-0.5 font-medium">
                            {BANK.holder}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            {l.ibanL}
                          </dt>
                          <dd className="mt-0.5 font-mono text-base font-semibold tracking-wide">
                            {BANK.iban}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            {l.bicL}
                          </dt>
                          <dd className="mt-0.5 font-mono">{BANK.bic}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                            {l.commL}
                          </dt>
                          <dd className="mt-0.5 break-all font-mono text-base font-semibold text-accent">
                            {structuredComm(i.number)}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-4 border-t pt-4">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {l.amountL}
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold">
                          {eur(transferIncl)}
                        </p>
                        {savings > 0 && (
                          <p className="mt-1 text-xs text-muted">
                            {l.insteadOf} {eur(mollieIncl)}{" "}
                            <span aria-hidden>·</span> Mollie
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Acties — gecentreerd, naast elkaar */}
              <div className="no-print mt-7 flex flex-wrap items-center justify-center gap-3 border-t pt-6">
                <PrintButton label={l.print} />
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
