import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/cta-banner";
import { RealisatiesViewer } from "@/components/realisaties-viewer";
import { RealisatiesGalerij } from "@/components/realisaties-galerij";
import { REALISATIES } from "@/lib/realisaties";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

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
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { ...T[locale].meta, alternates: { canonical: `https://studio-vm.be/${locale}/realisaties` } };
}

export default async function RealisatiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.titel}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{t.intro}</p>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20">
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
        <div className="mx-auto max-w-7xl px-6 py-20">
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
