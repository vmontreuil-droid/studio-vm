import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Zap, CalendarCheck, Check, ShieldAlert, FileUp, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { UURTARIEF_CENT, MINIMUM_UREN, euro, type Categorie } from "@/lib/tarieven";
import { KRUIMEL, ogBeeld, paginaMeta } from "@/lib/seo";
import { ID, dienstNodes, graph, kruimels, siteNodes, webPagina } from "@/lib/schema";
import { kennisArtikel } from "@/lib/kennis";

const PAD = "/tarieven";

// Titel en beschrijving met de echte prijzen uit lib/tarieven: zo lopen ze
// nooit uit de pas met de kaarten op de pagina.
function meta(l: Locale): { title: string; description: string } {
  const v = euro(UURTARIEF_CENT.vroegtijdig, l);
  const n = euro(UURTARIEF_CENT.normaal, l);
  const lm = euro(UURTARIEF_CENT["last-minute"], l);
  const min = MINIMUM_UREN;
  switch (l) {
    case "nl":
      return {
        title: `Prijs 3D-model machinebesturing: vanaf ${v}/uur | Studio VM`,
        description: `${v} vroegtijdig, ${n} normaal, ${lm} last-minute per uur excl. btw. Minimum ${min} uur, extra systemen zonder meerprijs. Vraag een offerte op maat aan.`,
      };
    case "fr":
      return {
        title: `Prix d'un modèle 3D de guidage : dès ${v}/h | Studio VM`,
        description: `${v} anticipé, ${n} normal, ${lm} urgent par heure HTVA. Minimum ${min} heure, systèmes supplémentaires sans surcoût. Demandez un devis sur mesure.`,
      };
    case "en":
      return {
        title: `Machine control model pricing: from ${v}/hour | Studio VM`,
        description: `${v} early, ${n} standard, ${lm} last-minute per hour excl. VAT. Minimum ${min} hour, extra machine control systems at no extra cost. Request a tailored quote.`,
      };
    case "de":
      return {
        title: `Preise 3D-Modell Maschinensteuerung ab ${v}/Std. | Studio VM`,
        description: `${v} frühzeitig, ${n} normal, ${lm} kurzfristig pro Stunde zzgl. MwSt. Mindestens ${min} Stunde, weitere Systeme ohne Aufpreis. Angebot anfordern.`,
      };
    case "es":
      return {
        title: `Modelos 3D para maquinaria: precio desde ${v}/h | Studio VM`,
        description: `${v} anticipada, ${n} normal, ${lm} urgente por hora, IVA no incluido. Mínimo ${min} hora, sistemas adicionales sin coste extra. Solicite un presupuesto.`,
      };
  }
}

const T: Record<
  Locale,
  {
    eyebrow: string;
    titel: string;
    intro: string;
    perUur: string;
    exBtw: string;
    cats: Record<Categorie, { titel: string; termijn: string }>;
    aanbevolen: string;
    inbegrepenKop: string;
    inbegrepen: string[];
    hoeKop: string;
    hoe: string[];
    btwKop: string;
    btw: string;
    verantwKop: string;
    verantw: string;
    cta: string;
  }
> = {
  nl: {
    eyebrow: "Tarieven",
    titel: "Uurtarieven voor 3D-modellen, vooraf geschat",
    intro: "U betaalt per uur modelleerwerk. Elke offerte vermeldt het geschatte aantal uren, zodat u vooraf weet waar u aan toe bent. Hoe vroeger u aanvraagt, hoe voordeliger.",
    perUur: "per uur",
    exBtw: "excl. btw",
    cats: {
      vroegtijdig: { titel: "Vroegtijdig", termijn: "Meer dan 3 weken op voorhand" },
      normaal: { titel: "Normaal", termijn: "Levering binnen 1 à 3 weken" },
      "last-minute": { titel: "Last-minute", termijn: "Levering binnen 5 werkdagen" },
    },
    aanbevolen: "Aanbevolen",
    inbegrepenKop: "Altijd inbegrepen",
    inbegrepen: [
      "Ontwerpoppervlak, lijnwerk en hoogtelijnen",
      "Levering in het formaat van al uw machinesturingen — meerdere systemen zonder meerprijs",
      "Het juiste coördinatenstelsel en hoogtereferentie van de werf",
      "Controle van niveaus en hellingen vóór levering",
      "Downloaden in uw eigen klantenportaal, met elke revisie",
    ],
    hoeKop: "Hoe wordt er gerekend?",
    hoe: [
      `Minimum ${MINIMUM_UREN} uur per opdracht.`,
      "De offerte vermeldt het geschatte aantal uren op basis van uw plannen.",
      "Revisies na een planwijziging aan hetzelfde uurtarief.",
      "Na betaling komen de bestanden vrij in uw portaal.",
    ],
    btwKop: "Btw",
    btw: "Alle prijzen zijn exclusief btw. Voor bedrijven in een ander EU-land met een geldig btw-nummer wordt de btw verlegd.",
    verantwKop: "Uw systeem, uw verantwoordelijkheid",
    verantw: "Studio VM levert enkel het 3D-model. De werking, instelling en kalibratie van uw machinesturing en de controle op de werf blijven de verantwoordelijkheid van de klant.",
    cta: "Offerte aanvragen",
  },
  fr: {
    eyebrow: "Tarifs",
    titel: "Tarifs horaires des modèles 3D, estimés à l'avance",
    intro: "Vous payez à l'heure de modélisation. Chaque devis indique le nombre d'heures estimé, pour que vous sachiez à quoi vous attendre. Plus vous demandez tôt, plus c'est avantageux.",
    perUur: "par heure",
    exBtw: "HTVA",
    cats: {
      vroegtijdig: { titel: "Anticipé", termijn: "Plus de 3 semaines à l'avance" },
      normaal: { titel: "Normal", termijn: "Livraison dans 1 à 3 semaines" },
      "last-minute": { titel: "Urgent", termijn: "Livraison dans les 5 jours ouvrables" },
    },
    aanbevolen: "Recommandé",
    inbegrepenKop: "Toujours inclus",
    inbegrepen: [
      "Surface de projet, filaire et courbes de niveau",
      "Livraison dans le format de tous vos systèmes de guidage — plusieurs systèmes sans supplément",
      "Le bon système de coordonnées et la référence altimétrique du chantier",
      "Contrôle des niveaux et des pentes avant livraison",
      "Téléchargement dans votre espace client, avec chaque révision",
    ],
    hoeKop: "Comment est-ce calculé ?",
    hoe: [
      `Minimum ${MINIMUM_UREN} heure par mission.`,
      "Le devis indique le nombre d'heures estimé sur base de vos plans.",
      "Révisions après modification des plans au même tarif horaire.",
      "Après paiement, les fichiers sont disponibles dans votre espace.",
    ],
    btwKop: "TVA",
    btw: "Tous les prix s'entendent hors TVA. Pour les entreprises d'un autre pays de l'UE avec un numéro de TVA valide, la TVA est autoliquidée.",
    verantwKop: "Votre système, votre responsabilité",
    verantw: "Studio VM livre uniquement le modèle 3D. Le fonctionnement, le réglage et la calibration de votre guidage ainsi que le contrôle sur chantier restent sous la responsabilité du client.",
    cta: "Demander un devis",
  },
  en: {
    eyebrow: "Rates",
    titel: "Hourly rates for 3D models, estimated up front",
    intro: "You pay per hour of modelling. Every quote states the estimated number of hours, so you know where you stand. The earlier you ask, the better the rate.",
    perUur: "per hour",
    exBtw: "excl. VAT",
    cats: {
      vroegtijdig: { titel: "Early", termijn: "More than 3 weeks ahead" },
      normaal: { titel: "Standard", termijn: "Delivery within 1 to 3 weeks" },
      "last-minute": { titel: "Last-minute", termijn: "Delivery within 5 working days" },
    },
    aanbevolen: "Recommended",
    inbegrepenKop: "Always included",
    inbegrepen: [
      "Design surface, linework and contour lines",
      "Delivery in the format of all your machine control systems — multiple systems at no extra cost",
      "The site's coordinate system and height datum",
      "Level and slope checks before delivery",
      "Download in your own client portal, with every revision",
    ],
    hoeKop: "How is it charged?",
    hoe: [
      `Minimum ${MINIMUM_UREN} hour per job.`,
      "The quote states the estimated number of hours based on your plans.",
      "Revisions after plan changes at the same hourly rate.",
      "After payment, the files are released in your portal.",
    ],
    btwKop: "VAT",
    btw: "All prices exclude VAT. For businesses in another EU country with a valid VAT number, VAT is reverse-charged.",
    verantwKop: "Your system, your responsibility",
    verantw: "Studio VM only delivers the 3D model. The operation, setup and calibration of your machine control system and the checks on site remain the client's responsibility.",
    cta: "Request a quote",
  },
  de: {
    eyebrow: "Preise",
    titel: "Stundensätze für 3D-Modelle, vorab geschätzt",
    intro: "Sie zahlen pro Stunde Modellierungsarbeit. Jedes Angebot nennt die geschätzte Stundenzahl, damit Sie vorab wissen, woran Sie sind. Je früher Sie anfragen, desto günstiger.",
    perUur: "pro Stunde",
    exBtw: "zzgl. MwSt.",
    cats: {
      vroegtijdig: { titel: "Frühzeitig", termijn: "Mehr als 3 Wochen im Voraus" },
      normaal: { titel: "Normal", termijn: "Lieferung innerhalb von 1 bis 3 Wochen" },
      "last-minute": { titel: "Kurzfristig", termijn: "Lieferung innerhalb von 5 Werktagen" },
    },
    aanbevolen: "Empfohlen",
    inbegrepenKop: "Immer inklusive",
    inbegrepen: [
      "Planungsoberfläche, Linien und Höhenlinien",
      "Lieferung im Format all Ihrer Maschinensteuerungen — mehrere Systeme ohne Aufpreis",
      "Das richtige Koordinatensystem und der Höhenbezug der Baustelle",
      "Prüfung von Höhen und Neigungen vor der Lieferung",
      "Download in Ihrem eigenen Kundenportal, mit jeder Revision",
    ],
    hoeKop: "Wie wird abgerechnet?",
    hoe: [
      `Mindestens ${MINIMUM_UREN} Stunde pro Auftrag.`,
      "Das Angebot nennt die geschätzte Stundenzahl auf Grundlage Ihrer Pläne.",
      "Revisionen nach Planänderungen zum gleichen Stundensatz.",
      "Nach der Zahlung werden die Dateien in Ihrem Portal freigegeben.",
    ],
    btwKop: "MwSt.",
    btw: "Alle Preise verstehen sich zuzüglich MwSt. Für Unternehmen in einem anderen EU-Land mit gültiger USt-IdNr. gilt das Reverse-Charge-Verfahren.",
    verantwKop: "Ihr System, Ihre Verantwortung",
    verantw: "Studio VM liefert ausschließlich das 3D-Modell. Betrieb, Einrichtung und Kalibrierung Ihrer Maschinensteuerung sowie die Kontrolle auf der Baustelle bleiben in der Verantwortung des Kunden.",
    cta: "Angebot anfordern",
  },
  es: {
    eyebrow: "Tarifas",
    titel: "Tarifas por hora de modelos 3D, estimadas de antemano",
    intro: "Usted paga por hora de modelado. Cada presupuesto indica el número estimado de horas, para que sepa de antemano a qué atenerse. Cuanto antes lo solicite, más ventajoso.",
    perUur: "por hora",
    exBtw: "IVA no incluido",
    cats: {
      vroegtijdig: { titel: "Anticipada", termijn: "Con más de 3 semanas de antelación" },
      normaal: { titel: "Normal", termijn: "Entrega en un plazo de 1 a 3 semanas" },
      "last-minute": { titel: "Urgente", termijn: "Entrega en un plazo de 5 días laborables" },
    },
    aanbevolen: "Recomendado",
    inbegrepenKop: "Siempre incluido",
    inbegrepen: [
      "Superficie de proyecto, líneas y curvas de nivel",
      "Entrega en el formato de todos sus sistemas de control de maquinaria — varios sistemas sin coste adicional",
      "El sistema de coordenadas y la referencia altimétrica correctos de la obra",
      "Control de cotas y pendientes antes de la entrega",
      "Descarga en su propio portal de cliente, con cada revisión",
    ],
    hoeKop: "¿Cómo se factura?",
    hoe: [
      `Mínimo ${MINIMUM_UREN} hora por encargo.`,
      "El presupuesto indica el número estimado de horas según sus planos.",
      "Revisiones tras un cambio de planos a la misma tarifa por hora.",
      "Tras el pago, los archivos quedan disponibles en su portal.",
    ],
    btwKop: "IVA",
    btw: "Todos los precios son sin IVA. Para empresas de otro país de la UE con un número de IVA válido, se aplica la inversión del sujeto pasivo.",
    verantwKop: "Su sistema, su responsabilidad",
    verantw: "Studio VM entrega únicamente el modelo 3D. El funcionamiento, la configuración y la calibración de su sistema de control de maquinaria, así como el control en obra, siguen siendo responsabilidad del cliente.",
    cta: "Solicitar presupuesto",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, { ...meta(locale), ogBeeld: ogBeeld(locale, "tarieven") });
}

// Verder lezen onder de offerteknop: twee kennisartikels en de voorwaarden.
const VERDER: string[] = ["/kennis/veelgestelde-vragen", "/kennis/wat-aanleveren", "/voorwaarden"];

function verderLabel(pad: string, l: Locale): string {
  if (pad === "/voorwaarden") return KRUIMEL["/voorwaarden"][l];
  const slug = pad.replace("/kennis/", "");
  return kennisArtikel(slug)?.i18n[l].titel ?? slug;
}

const CATS: { id: Categorie; icoon: typeof Clock }[] = [
  { id: "vroegtijdig", icoon: CalendarCheck },
  { id: "normaal", icoon: Clock },
  { id: "last-minute", icoon: Zap },
];

export default async function TarievenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const m = meta(locale);

  return (
    <main className="border-b">
      <JsonLd
        data={graph(
          siteNodes(locale, { metDienst: true }),
          dienstNodes(locale),
          kruimels(locale, PAD, [{ naam: KRUIMEL[PAD][locale], pad: PAD }]),
          webPagina(locale, PAD, {
            naam: m.title,
            beschrijving: m.description,
            about: ID.dienst,
            mainEntity: { "@id": ID.tarieven },
          }),
        )}
      />
      <section className="wrap py-16 sm:py-20 2xl:py-24">
        <div className="max-w-3xl 2xl:max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 xl:gap-8">
          {CATS.map(({ id, icoon: Icoon }) => {
            const uitgelicht = id === "normaal";
            return (
              <div
                key={id}
                className={`relative rounded-3xl border p-8 xl:p-10 ${uitgelicht ? "border-accent bg-card shadow-xl shadow-accent/5" : "bg-card"}`}
              >
                {uitgelicht && (
                  <span className="absolute -top-3 left-8 rounded-full bg-accent xl:left-10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                    {t.aanbevolen}
                  </span>
                )}
                <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{t.cats[id].titel}</h2>
                <p className="mt-1 text-sm text-muted">{t.cats[id].termijn}</p>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight 2xl:text-6xl">{euro(UURTARIEF_CENT[id], locale)}</span>
                  <span className="text-sm text-muted">{t.perUur}</span>
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">{t.exBtw}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 xl:gap-8 2xl:grid-cols-3">
          <div className="rounded-3xl border bg-card p-8">
            <h2 className="text-lg font-semibold tracking-tight">{t.inbegrepenKop}</h2>
            <ul className="mt-5 space-y-3">
              {t.inbegrepen.map((i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6 2xl:contents 2xl:space-y-0">
            <div className="rounded-3xl border bg-card p-8">
              <h2 className="text-lg font-semibold tracking-tight">{t.hoeKop}</h2>
              <ul className="mt-5 space-y-3">
                {t.hoe.map((h) => (
                  <li key={h} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t pt-5 text-sm leading-relaxed text-muted">
                <strong className="text-foreground">{t.btwKop}.</strong> {t.btw}
              </p>
            </div>
            <div className="flex gap-4 rounded-3xl border border-accent/30 bg-accent/5 p-8">
              <ShieldAlert className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} />
              <div>
                <h2 className="font-semibold tracking-tight">{t.verantwKop}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.verantw}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href={localePath(locale, "/offerte")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <FileUp className="h-4 w-4" strokeWidth={2} />
            {t.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {VERDER.map((pad) => (
            <li key={pad}>
              <Link
                href={localePath(locale, pad)}
                className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
              >
                {verderLabel(pad, locale)}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
