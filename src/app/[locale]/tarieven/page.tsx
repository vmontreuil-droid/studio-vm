import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Zap, CalendarCheck, Check, ShieldAlert, FileUp, ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { UURTARIEF_CENT, MINIMUM_UREN, euro, type Categorie } from "@/lib/tarieven";

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
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
    meta: {
      title: "Tarieven — 3D-modellen voor machinesturing | Studio VM",
      description: "Transparante uurtarieven voor 3D-modellen voor machinesturing: vroegtijdig, normaal of last-minute. Alle formaten inbegrepen.",
    },
    eyebrow: "Tarieven",
    titel: "Eerlijke uurtarieven, vooraf geschat",
    intro: "U betaalt per uur modelleerwerk. Elke offerte vermeldt het geschatte aantal uren, zodat u vooraf weet waar u aan toe bent. Hoe vroeger u aanvraagt, hoe voordeliger.",
    perUur: "per uur",
    exBtw: "excl. btw",
    cats: {
      vroegtijdig: { titel: "Vroegtijdig", termijn: "Meer dan 3 weken op voorhand" },
      normaal: { titel: "Normaal", termijn: "Levering binnen 1 à 3 weken" },
      "last-minute": { titel: "Last-minute", termijn: "Levering binnen 5 werkdagen" },
    },
    aanbevolen: "Meest gekozen",
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
    meta: {
      title: "Tarifs — modèles 3D pour le guidage d'engins | Studio VM",
      description: "Tarifs horaires transparents pour modèles 3D de guidage d'engins : anticipé, normal ou urgent. Tous les formats inclus.",
    },
    eyebrow: "Tarifs",
    titel: "Des tarifs horaires honnêtes, estimés à l'avance",
    intro: "Vous payez à l'heure de modélisation. Chaque devis indique le nombre d'heures estimé, pour que vous sachiez à quoi vous attendre. Plus vous demandez tôt, plus c'est avantageux.",
    perUur: "par heure",
    exBtw: "HTVA",
    cats: {
      vroegtijdig: { titel: "Anticipé", termijn: "Plus de 3 semaines à l'avance" },
      normaal: { titel: "Normal", termijn: "Livraison dans 1 à 3 semaines" },
      "last-minute": { titel: "Urgent", termijn: "Livraison dans les 5 jours ouvrables" },
    },
    aanbevolen: "Le plus choisi",
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
    meta: {
      title: "Rates — 3D models for machine control | Studio VM",
      description: "Transparent hourly rates for machine control 3D models: early, standard or last-minute. All formats included.",
    },
    eyebrow: "Rates",
    titel: "Fair hourly rates, estimated up front",
    intro: "You pay per hour of modelling. Every quote states the estimated number of hours, so you know where you stand. The earlier you ask, the better the rate.",
    perUur: "per hour",
    exBtw: "excl. VAT",
    cats: {
      vroegtijdig: { titel: "Early", termijn: "More than 3 weeks ahead" },
      normaal: { titel: "Standard", termijn: "Delivery within 1 to 3 weeks" },
      "last-minute": { titel: "Last-minute", termijn: "Delivery within 5 working days" },
    },
    aanbevolen: "Most chosen",
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
    meta: {
      title: "Preise — 3D-Modelle für Maschinensteuerung | Studio VM",
      description: "Transparente Stundensätze für 3D-Modelle für Maschinensteuerung: frühzeitig, normal oder kurzfristig. Alle Formate inklusive.",
    },
    eyebrow: "Preise",
    titel: "Faire Stundensätze, vorab geschätzt",
    intro: "Sie zahlen pro Stunde Modellierungsarbeit. Jedes Angebot nennt die geschätzte Stundenzahl, damit Sie vorab wissen, woran Sie sind. Je früher Sie anfragen, desto günstiger.",
    perUur: "pro Stunde",
    exBtw: "zzgl. MwSt.",
    cats: {
      vroegtijdig: { titel: "Frühzeitig", termijn: "Mehr als 3 Wochen im Voraus" },
      normaal: { titel: "Normal", termijn: "Lieferung innerhalb von 1 bis 3 Wochen" },
      "last-minute": { titel: "Kurzfristig", termijn: "Lieferung innerhalb von 5 Werktagen" },
    },
    aanbevolen: "Am häufigsten gewählt",
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
    meta: {
      title: "Tarifas — modelos 3D para control de maquinaria | Studio VM",
      description: "Tarifas por hora transparentes para modelos 3D de control de maquinaria: anticipada, normal o urgente. Todos los formatos incluidos.",
    },
    eyebrow: "Tarifas",
    titel: "Tarifas por hora justas, estimadas de antemano",
    intro: "Usted paga por hora de modelado. Cada presupuesto indica el número estimado de horas, para que sepa de antemano a qué atenerse. Cuanto antes lo solicite, más ventajoso.",
    perUur: "por hora",
    exBtw: "IVA no incluido",
    cats: {
      vroegtijdig: { titel: "Anticipada", termijn: "Con más de 3 semanas de antelación" },
      normaal: { titel: "Normal", termijn: "Entrega en un plazo de 1 a 3 semanas" },
      "last-minute": { titel: "Urgente", termijn: "Entrega en un plazo de 5 días laborables" },
    },
    aanbevolen: "La más elegida",
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
  return { ...T[locale].meta, alternates: { canonical: `https://studio-vm.be/${locale}/tarieven` } };
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

  return (
    <main className="border-b">
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.titel}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{t.intro}</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CATS.map(({ id, icoon: Icoon }) => {
            const uitgelicht = id === "normaal";
            return (
              <div
                key={id}
                className={`relative rounded-3xl border p-8 ${uitgelicht ? "border-accent bg-card shadow-xl shadow-accent/5" : "bg-card"}`}
              >
                {uitgelicht && (
                  <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                    {t.aanbevolen}
                  </span>
                )}
                <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{t.cats[id].titel}</h2>
                <p className="mt-1 text-sm text-muted">{t.cats[id].termijn}</p>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">{euro(UURTARIEF_CENT[id], locale)}</span>
                  <span className="text-sm text-muted">{t.perUur}</span>
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">{t.exBtw}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
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
          <div className="space-y-6">
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
      </section>
    </main>
  );
}
