import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/cta-banner";
import { RealisatiesViewer } from "@/components/realisaties-viewer";
import { RealisatiesGalerij } from "@/components/realisaties-galerij";
import { REALISATIES } from "@/lib/realisaties";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { talen } from "@/lib/seo";

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    eyebrow: string;
    titel: string;
    intro: string;
    uitgelichtEyebrow: string;
    uitgelichtTitel: string;
    uitgelichtIntro: string;
    galerijEyebrow: string;
    galerijTitel: string;
    galerijIntro: string;
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: {
    meta: { title: "Realisaties — 3D-modellen voor machinesturing | Studio VM", description: "Gerealiseerde 3D-modellen voor wegenis, grondwerk, bouwputten, bekkens en terreinen — bekijk ze in hoogtekleuren, helling, hoogtelijnen en driehoeksnet." },
    eyebrow: "Realisaties",
    titel: "Modellen die op de werf liggen",
    intro: "Een greep uit gerealiseerde modellen voor machinesturing. Namen en locaties laat ik uit discretie weg — de modellen spreken voor zich.",
    uitgelichtEyebrow: "Uitgelicht",
    uitgelichtTitel: "Eén model, vier blikken",
    uitgelichtIntro: "Elk model wordt gecontroleerd in verschillende weergaven. Klik door en zie hetzelfde ontwerp in hoogtekleuren, als hellingskaart, met hoogtelijnen en als driehoeksnet.",
    galerijEyebrow: "Galerij",
    galerijTitel: "Van wegtracé tot bouwput",
    galerijIntro: "Filter op soort werk en klik op een model om het groot te bekijken.",
    cta: { eyebrow: "Uw project volgende?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Van bouwput tot wegtracé: elk project met GPS-gestuurde machines.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: { title: "Réalisations — modèles 3D pour le guidage d'engins | Studio VM", description: "Modèles 3D réalisés pour voiries, terrassements, fouilles, bassins et terrains — en couleurs hypsométriques, pentes, courbes et réseau de triangles." },
    eyebrow: "Réalisations",
    titel: "Des modèles qui tombent sur le chantier",
    intro: "Une sélection de modèles réalisés pour le guidage d'engins. Par discrétion, je n'indique ni noms ni lieux — les modèles parlent d'eux-mêmes.",
    uitgelichtEyebrow: "À la une",
    uitgelichtTitel: "Un modèle, quatre regards",
    uitgelichtIntro: "Chaque modèle est contrôlé sous plusieurs vues. Passez de l'une à l'autre : couleurs hypsométriques, carte des pentes, courbes de niveau et réseau de triangles.",
    galerijEyebrow: "Galerie",
    galerijTitel: "Du tracé routier à la fouille",
    galerijIntro: "Filtrez par type de travaux et cliquez sur un modèle pour l'agrandir.",
    cta: { eyebrow: "Votre projet ensuite ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "De la fouille au tracé routier : tout projet avec engins guidés par GPS.", knop: "Demander un devis" },
  },
  en: {
    meta: { title: "Projects — 3D models for machine control | Studio VM", description: "Completed 3D models for roads, earthworks, excavations, basins and terrain — in height colours, slope, contours and triangle network." },
    eyebrow: "Projects",
    titel: "Models that land on site",
    intro: "A selection of completed machine control models. Out of discretion I leave out names and locations — the models speak for themselves.",
    uitgelichtEyebrow: "Featured",
    uitgelichtTitel: "One model, four views",
    uitgelichtIntro: "Every model is checked in several views. Switch between height colours, slope map, contours and triangle network.",
    galerijEyebrow: "Gallery",
    galerijTitel: "From road alignment to excavation",
    galerijIntro: "Filter by type of work and click a model to view it large.",
    cta: { eyebrow: "Your project next?", titel: "Send your plans, get a tailored quote", sub: "From excavation to road alignment: any project with GPS-guided machines.", knop: "Request a quote" },
  },
  de: {
    meta: { title: "Referenzen — 3D-Modelle für Maschinensteuerung | Studio VM", description: "Realisierte 3D-Modelle für Straßenbau, Erdbau, Baugruben, Becken und Gelände — in Höhenfarben, Neigung, Höhenlinien und Dreiecksnetz." },
    eyebrow: "Referenzen",
    titel: "Modelle, die auf der Baustelle sitzen",
    intro: "Eine Auswahl realisierter Modelle für Maschinensteuerung. Namen und Orte lasse ich aus Diskretion weg — die Modelle sprechen für sich.",
    uitgelichtEyebrow: "Im Fokus",
    uitgelichtTitel: "Ein Modell, vier Ansichten",
    uitgelichtIntro: "Jedes Modell wird in mehreren Ansichten geprüft. Klicken Sie sich durch und sehen Sie denselben Entwurf in Höhenfarben, als Neigungskarte, mit Höhenlinien und als Dreiecksnetz.",
    galerijEyebrow: "Galerie",
    galerijTitel: "Von der Straßentrasse bis zur Baugrube",
    galerijIntro: "Filtern Sie nach Art der Arbeiten und klicken Sie auf ein Modell, um es groß anzuzeigen.",
    cta: { eyebrow: "Ihr Projekt als Nächstes?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Von der Baugrube bis zur Straßentrasse: jedes Projekt mit GPS-gesteuerten Maschinen.", knop: "Angebot anfordern" },
  },
  es: {
    meta: { title: "Proyectos realizados — modelos 3D para control de maquinaria | Studio VM", description: "Modelos 3D realizados para viales, movimiento de tierras, excavaciones, balsas y terrenos — en colores hipsométricos, pendientes, curvas de nivel y red de triángulos." },
    eyebrow: "Proyectos realizados",
    titel: "Modelos que encajan en la obra",
    intro: "Una selección de modelos realizados para control de maquinaria. Por discreción omito nombres y ubicaciones — los modelos hablan por sí mismos.",
    uitgelichtEyebrow: "Destacado",
    uitgelichtTitel: "Un modelo, cuatro miradas",
    uitgelichtIntro: "Cada modelo se comprueba en varias vistas. Pase de una a otra y vea el mismo proyecto en colores hipsométricos, como mapa de pendientes, con curvas de nivel y como red de triángulos.",
    galerijEyebrow: "Galería",
    galerijTitel: "Del trazado de carreteras a la excavación",
    galerijIntro: "Filtre por tipo de trabajo y haga clic en un modelo para verlo en grande.",
    cta: { eyebrow: "¿Su proyecto es el siguiente?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "De la excavación al trazado de carreteras: cualquier proyecto con máquinas guiadas por GPS.", knop: "Solicitar presupuesto" },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { ...T[locale].meta, alternates: talen(locale, "/realisaties") };
}

export default async function RealisatiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      <section className="border-b">
        <div className="wrap py-16 sm:py-20 2xl:py-24">
          <div className="max-w-3xl 2xl:max-w-4xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="wrap py-20 2xl:py-24">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">{t.uitgelichtEyebrow}</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.uitgelichtTitel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.uitgelichtIntro}</p>
          </div>
          <div className="mt-14">
            <RealisatiesViewer locale={locale} />
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="wrap py-20 2xl:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.galerijEyebrow} · {REALISATIES.length}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.galerijTitel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.galerijIntro}</p>
          </div>
          <RealisatiesGalerij locale={locale} />
        </div>
      </section>

      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
