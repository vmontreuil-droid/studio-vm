import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Images } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { RealisatiesViewer } from "@/components/realisaties-viewer";
import { RealisatiesGalerij } from "@/components/realisaties-galerij";
import { CATEGORIEEN, REALISATIES } from "@/lib/realisaties";
import { ARCHIEF, archiefBeeld, archiefPad } from "@/lib/archief";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KRUIMEL, SITE, ogBeeld, paginaMeta } from "@/lib/seo";
import { galerij, graph, kruimels, siteNodes } from "@/lib/schema";
import { kennisArtikel } from "@/lib/kennis";

const PAD = "/realisaties";
const N = REALISATIES.length;

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    eyebrow: string;
    titel: string;
    intro: string;
    systemen: string;
    uitgelichtEyebrow: string;
    uitgelichtTitel: string;
    uitgelichtIntro: string;
    galerijEyebrow: string;
    galerijTitel: string;
    galerijIntro: string;
    archief: { eyebrow: string; titel: string; intro: string; beelden: (n: number) => string };
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: {
    meta: {
      title: "Realisaties: 3D-modellen wegenis en grondwerk | Studio VM",
      description: `${N} voorbeelden van 3D-terreinmodellen voor wegenis, grondwerk, bouwputten en bekkens, in hoogtekleuren, helling, hoogtelijnen en driehoeksnet. Bekijk de galerij.`,
    },
    eyebrow: "Realisaties",
    titel: "3D-modellen die op de werf liggen",
    intro: "Een greep uit gerealiseerde modellen voor machinesturing. Klant- en werfnamen laten we uit discretie weg — de modellen spreken voor zich.",
    systemen: "Elk van deze modellen leveren we voor Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu en Caterpillar, in het coördinatenstelsel en de hoogtereferentie van de werf.",
    uitgelichtEyebrow: "Uitgelicht",
    uitgelichtTitel: "Eén model, vier blikken",
    uitgelichtIntro: "Elk model wordt gecontroleerd in verschillende weergaven. Klik door en zie hetzelfde ontwerp in hoogtekleuren, als hellingskaart, met hoogtelijnen en als driehoeksnet.",
    galerijEyebrow: "Galerij",
    galerijTitel: "Van wegtracé tot bouwput",
    galerijIntro: "Filter op soort werk en klik op een model om het groot te bekijken.",
    archief: { eyebrow: "Projecten in beeld", titel: "Elk project van alle kanten", intro: "Hetzelfde model in 3D, op de luchtfoto, met hoogtelijnen en als driehoeksnet. Klik een project open.", beelden: (n) => `${n} beelden` },
    cta: { eyebrow: "Uw project volgende?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Van bouwput tot wegtracé: elk project met GPS-gestuurde machines.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: {
      title: "Réalisations : modèles 3D voirie et terrassement | Studio VM",
      description: `${N} exemples de modèles 3D pour voiries, terrassements, fouilles et bassins, en couleurs hypsométriques, pentes, courbes et triangles. Voir la galerie.`,
    },
    eyebrow: "Réalisations",
    titel: "Des modèles 3D qui tombent juste sur le chantier",
    intro: "Une sélection de modèles réalisés pour le guidage d'engins. Par discrétion, nous ne citons ni clients ni chantiers — les modèles parlent d'eux-mêmes.",
    systemen: "Nous livrons chacun de ces modèles pour Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu et Caterpillar, dans le système de coordonnées et la référence altimétrique du chantier.",
    uitgelichtEyebrow: "À la une",
    uitgelichtTitel: "Un modèle, quatre regards",
    uitgelichtIntro: "Chaque modèle est contrôlé sous plusieurs vues. Passez de l'une à l'autre : couleurs hypsométriques, carte des pentes, courbes de niveau et réseau de triangles.",
    galerijEyebrow: "Galerie",
    galerijTitel: "Du tracé routier à la fouille",
    galerijIntro: "Filtrez par type de travaux et cliquez sur un modèle pour l'agrandir.",
    archief: { eyebrow: "Projets en images", titel: "Chaque projet sous tous les angles", intro: "Le même modèle en 3D, sur photo aérienne, en courbes de niveau et en réseau de triangles. Ouvrez un projet.", beelden: (n) => `${n} images` },
    cta: { eyebrow: "Votre projet ensuite ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "De la fouille au tracé routier : tout projet avec engins guidés par GPS.", knop: "Demander un devis" },
  },
  en: {
    meta: {
      title: "Projects: 3D models for roads and earthworks | Studio VM",
      description: `${N} examples of 3D models for roads, earthworks, excavations and basins, shown in height colours, slope, contours and triangle network. Browse the gallery.`,
    },
    eyebrow: "Projects",
    titel: "3D models that land on site",
    intro: "A selection of completed machine control models. Out of discretion we leave out client and site names — the models speak for themselves.",
    systemen: "We deliver each of these models for Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu and Caterpillar, in the coordinate system and height datum of the site.",
    uitgelichtEyebrow: "Featured",
    uitgelichtTitel: "One model, four views",
    uitgelichtIntro: "Every model is checked in several views. Switch between height colours, slope map, contours and triangle network.",
    galerijEyebrow: "Gallery",
    galerijTitel: "From road alignment to excavation",
    galerijIntro: "Filter by type of work and click a model to view it large.",
    archief: { eyebrow: "Projects in pictures", titel: "Every project from every angle", intro: "The same model in 3D, on the aerial photo, as contours and as a triangle network. Open a project.", beelden: (n) => `${n} images` },
    cta: { eyebrow: "Your project next?", titel: "Send your plans, get a tailored quote", sub: "From excavation to road alignment: any project with GPS-guided machines.", knop: "Request a quote" },
  },
  de: {
    meta: {
      title: "Referenzen: 3D-Modelle für Straßen- und Erdbau | Studio VM",
      description: `${N} Beispiele für 3D-Modelle im Straßenbau, Erdbau, für Baugruben und Becken, in Höhenfarben, Neigung, Höhenlinien und Dreiecksnetz. Zur Galerie.`,
    },
    eyebrow: "Referenzen",
    titel: "3D-Modelle, die auf der Baustelle sitzen",
    intro: "Eine Auswahl realisierter Modelle für Maschinensteuerung. Kunden- und Baustellennamen lassen wir aus Diskretion weg — die Modelle sprechen für sich.",
    systemen: "Jedes dieser Modelle liefern wir für Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu und Caterpillar, im Koordinatensystem und Höhenbezug der Baustelle.",
    uitgelichtEyebrow: "Im Fokus",
    uitgelichtTitel: "Ein Modell, vier Ansichten",
    uitgelichtIntro: "Jedes Modell wird in mehreren Ansichten geprüft. Klicken Sie sich durch und sehen Sie denselben Entwurf in Höhenfarben, als Neigungskarte, mit Höhenlinien und als Dreiecksnetz.",
    galerijEyebrow: "Galerie",
    galerijTitel: "Von der Straßentrasse bis zur Baugrube",
    galerijIntro: "Filtern Sie nach Art der Arbeiten und klicken Sie auf ein Modell, um es groß anzuzeigen.",
    archief: { eyebrow: "Projekte in Bildern", titel: "Jedes Projekt von allen Seiten", intro: "Dasselbe Modell in 3D, auf dem Luftbild, mit Höhenlinien und als Dreiecksnetz. Öffnen Sie ein Projekt.", beelden: (n) => `${n} Bilder` },
    cta: { eyebrow: "Ihr Projekt als Nächstes?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Von der Baugrube bis zur Straßentrasse: jedes Projekt mit GPS-gesteuerten Maschinen.", knop: "Angebot anfordern" },
  },
  es: {
    meta: {
      title: "Proyectos: modelos 3D para viales y tierras | Studio VM",
      description: `${N} ejemplos de modelos 3D para viales, movimiento de tierras, excavaciones y balsas, en colores hipsométricos, pendientes y curvas de nivel. Vea la galería.`,
    },
    eyebrow: "Proyectos realizados",
    titel: "Modelos 3D que encajan en la obra",
    intro: "Una selección de modelos realizados para control de maquinaria. Por discreción omitimos los nombres de clientes y obras — los modelos hablan por sí mismos.",
    systemen: "Cada uno de estos modelos lo entregamos para Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu y Caterpillar, en el sistema de coordenadas y la referencia altimétrica de la obra.",
    uitgelichtEyebrow: "Destacado",
    uitgelichtTitel: "Un modelo, cuatro miradas",
    uitgelichtIntro: "Cada modelo se comprueba en varias vistas. Pase de una a otra y vea el mismo proyecto en colores hipsométricos, como mapa de pendientes, con curvas de nivel y como red de triángulos.",
    galerijEyebrow: "Galería",
    galerijTitel: "Del trazado de carreteras a la excavación",
    galerijIntro: "Filtre por tipo de trabajo y haga clic en un modelo para verlo en grande.",
    archief: { eyebrow: "Proyectos en imágenes", titel: "Cada proyecto desde todos los ángulos", intro: "El mismo modelo en 3D, sobre la foto aérea, con curvas de nivel y como red de triángulos. Abra un proyecto.", beelden: (n) => `${n} imágenes` },
    cta: { eyebrow: "¿Su proyecto es el siguiente?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "De la excavación al trazado de carreteras: cualquier proyecto con máquinas guiadas por GPS.", knop: "Solicitar presupuesto" },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, { ...T[locale].meta, ogBeeld: ogBeeld(locale, "realisaties") });
}

export default async function RealisatiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const wat3d = kennisArtikel("wat-is-een-3d-model")?.i18n[locale].titel ?? KRUIMEL["/kennis"][locale];
  const verder = [
    { href: localePath(locale, "/3d-modellen"), label: KRUIMEL["/3d-modellen"][locale] },
    { href: localePath(locale, "/kennis/wat-is-een-3d-model"), label: wat3d },
  ];

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale),
          kruimels(locale, PAD, [{ naam: KRUIMEL[PAD][locale], pad: PAD }]),
          galerij(locale, PAD, {
            naam: t.meta.title,
            beschrijving: t.meta.description,
            beelden: REALISATIES.map((r) => ({
              url: `${SITE}${r.licht}`,
              naam: r[locale].titel,
              bijschrift: r[locale].tekst,
              trefwoorden: [CATEGORIEEN[r.cat][locale], ...r.systemen].join(", "),
            })),
          }),
        )}
      />
      <section className="border-b">
        <div className="wrap py-16 sm:py-20 2xl:py-24">
          <div className="max-w-3xl 2xl:max-w-4xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted">{t.systemen}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {verder.map((v) => (
                <li key={v.href}>
                  <Link href={v.href} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                    {v.label}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b" aria-labelledby="archief">
        <div className="wrap py-20 2xl:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.archief.eyebrow} · {ARCHIEF.length}
            </p>
            <h2 id="archief" className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.archief.titel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.archief.intro}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
            {ARCHIEF.map((p) => (
              <li key={p.code}>
                <Link
                  href={localePath(locale, archiefPad(p.code))}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-colors hover:border-accent"
                >
                  <span className="relative aspect-[16/10] w-full overflow-hidden bg-[#0c0a09]">
                    <Image
                      src={archiefBeeld(p.code, "3d")}
                      alt={p[locale].titel}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                      <Images className="h-3.5 w-3.5" strokeWidth={2} />
                      {t.archief.beelden(p.weergaven.length)}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{CATEGORIEEN[p.cat][locale]}</span>
                    <span className="mt-1.5 font-semibold tracking-tight group-hover:text-accent">{p[locale].titel}</span>
                    <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{p[locale].tekst}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
              {t.galerijEyebrow} · {N}
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
