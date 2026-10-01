import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/cta-banner";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

type Item = { beeld: string; donker?: string; groot?: boolean; nl: [string, string]; fr: [string, string]; en: [string, string] };

// Echte modellen, anoniem: geen klant- of werfnamen. Elk beeld bestaat in een
// lichte én donkere versie en wisselt mee met het thema.
const ITEMS: Item[] = [
  { beeld: "/3d/relief-bouwput-licht.png", donker: "/3d/relief-bouwput-donker.png", groot: true,
    nl: ["Bouwput", "Uitgraving met taluds en werkvloer op niveau"], fr: ["Fouille", "Excavation avec talus et fond de fouille à niveau"], en: ["Excavation", "Pit with embankments and formation level"] },
  { beeld: "/3d/weg-kruispunt-licht.png", donker: "/3d/weg-kruispunt-donker.png",
    nl: ["Weg met kruispunt", "Tracé met aansluiting en hoogtekleuren"], fr: ["Route avec carrefour", "Tracé avec raccord et couleurs hypsométriques"], en: ["Road with junction", "Alignment with tie-in and height colours"] },
  { beeld: "/3d/weg-trace-licht.png", donker: "/3d/weg-trace-donker.png",
    nl: ["Wegtracé", "Lang tracé met profielen"], fr: ["Tracé routier", "Long tracé avec profils"], en: ["Road alignment", "Long alignment with profiles"] },
  { beeld: "/3d/rotondes-licht.png", donker: "/3d/rotondes-donker.png", groot: true,
    nl: ["Rotondes en wegenis", "Meerdere rotondes met lijnwerk per laag"], fr: ["Giratoires et voiries", "Plusieurs giratoires avec filaire par couche"], en: ["Roundabouts and roads", "Several roundabouts with linework per layer"] },
  { beeld: "/3d/terrein-hoogtelijnen-licht.png", donker: "/3d/terrein-hoogtelijnen-donker.png",
    nl: ["Terrein op inplantingsplan", "Hoogtelijnen en lijnwerk over het plan"], fr: ["Terrain sur plan d'implantation", "Courbes et filaire sur le plan"], en: ["Site on layout plan", "Contours and linework over the plan"] },
  { beeld: "/3d/driehoeksnet-licht.png", donker: "/3d/driehoeksnet-donker.png",
    nl: ["Driehoeksnet (TIN)", "Het oppervlak waarop de machine stuurt"], fr: ["Réseau de triangles (TIN)", "La surface sur laquelle la machine se guide"], en: ["Triangle network (TIN)", "The surface the machine guides on"] },
  { beeld: "/3d/relief-sportterrein-licht.png", donker: "/3d/relief-sportterrein-donker.png",
    nl: ["Sportterrein", "Vlak speelveld met afwatering naar de randen"], fr: ["Terrain de sport", "Aire de jeu plane avec écoulement vers les bords"], en: ["Sports field", "Level pitch draining to the edges"] },
  { beeld: "/3d/relief-grondwerk-licht.png", donker: "/3d/relief-grondwerk-donker.png",
    nl: ["Grondwerk", "Platformen op verschillende niveaus"], fr: ["Terrassement", "Plateformes à plusieurs niveaux"], en: ["Earthworks", "Platforms at different levels"] },
];

const T: Record<Locale, { meta: { title: string; description: string }; eyebrow: string; titel: string; intro: string; cta: { eyebrow: string; titel: string; sub: string; knop: string } }> = {
  nl: {
    meta: { title: "Realisaties — 3D-modellen voor machinesturing | Studio VM", description: "Voorbeelden van 3D-modellen voor bouwputten, wegenis, bedrijfsterreinen, sportterreinen en parkings." },
    eyebrow: "Realisaties",
    titel: "Modellen die op de werf liggen",
    intro: "Een greep uit gerealiseerde modellen. Namen en locaties laat ik uit discretie weg — de modellen spreken voor zich.",
    cta: { eyebrow: "Uw project volgende?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Van bouwput tot wegtracé: elk project met GPS-gestuurde machines.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: { title: "Réalisations — modèles 3D pour le guidage d'engins | Studio VM", description: "Exemples de modèles 3D pour fouilles, voiries, zones d'activité, terrains de sport et parkings." },
    eyebrow: "Réalisations",
    titel: "Des modèles qui tombent sur le chantier",
    intro: "Une sélection de modèles réalisés. Par discrétion, je n'indique ni noms ni lieux — les modèles parlent d'eux-mêmes.",
    cta: { eyebrow: "Votre projet ensuite ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "De la fouille au tracé routier : tout projet avec engins guidés par GPS.", knop: "Demander un devis" },
  },
  en: {
    meta: { title: "Projects — 3D models for machine control | Studio VM", description: "Examples of 3D models for excavations, roads, industrial sites, sports fields and car parks." },
    eyebrow: "Projects",
    titel: "Models that land on site",
    intro: "A selection of completed models. Out of discretion I leave out names and locations — the models speak for themselves.",
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
          <div className="mt-14 grid auto-rows-[18rem] grid-flow-dense gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((it) => {
              const [titel, tekst] = it[locale];
              return (
                <figure
                  key={it.beeld}
                  className={`group relative isolate overflow-hidden rounded-3xl border bg-card ${it.groot ? "sm:col-span-2 sm:row-span-2" : ""}`}
                >
                  <Image src={it.beeld} alt={titel} fill sizes="(max-width: 640px) 100vw, 66vw" className={`${it.donker ? "alleen-licht " : ""}-z-10 object-cover transition-transform duration-700 group-hover:scale-105`} />
                  {it.donker && <Image src={it.donker} alt="" fill sizes="(max-width: 640px) 100vw, 66vw" className="alleen-donker -z-10 object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-14 text-white">
                    <p className="font-semibold tracking-tight">{titel}</p>
                    <p className="mt-0.5 text-sm text-white/80">{tekst}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
