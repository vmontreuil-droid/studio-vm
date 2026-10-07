import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { KENNIS_ICONEN as ICONEN } from "@/lib/kennis-iconen";
import { KOPBEELD } from "@/components/kennis-illustraties";
import { KENNIS } from "@/lib/kennis";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KRUIMEL, canoniek, ogBeeld, paginaMeta } from "@/lib/seo";
import { siteNodes, kruimels, webPagina, itemLijst, graph } from "@/lib/schema";
import { Broodkruimel } from "@/components/broodkruimel";
import { JsonLd } from "@/components/json-ld";

const T: Record<Locale, { meta: { title: string; description: string }; eyebrow: string; titel: string; intro: string; lees: string }> = {
  nl: {
    meta: { title: "Kennisbank 3D-modellen en machinebesturing | Studio VM", description: "Uitleg over terreinmodellen (DTM), breeklijnen, Lambert/TAW en RD/NAP, bestanden voor Trimble, Topcon en Leica, en wat u aanlevert. Voor aannemers en machinisten." },
    eyebrow: "Kennisbank",
    titel: "Alles over 3D-modellen voor machinesturing",
    intro: "Praktische uitleg voor aannemers, werfleiders en uitvoerders: hoe een model in elkaar zit, welk stelsel u nodig hebt en wat u best aanlevert.",
    lees: "Lees meer",
  },
  fr: {
    meta: { title: "Guide des modèles 3D pour le guidage d'engins | Studio VM", description: "Modèles de terrain, lignes de rupture, systèmes de coordonnées, fichiers par marque et ce qu'il faut fournir : des explications pratiques pour entrepreneurs." },
    eyebrow: "Base de connaissances",
    titel: "Tout sur les modèles 3D pour le guidage d'engins",
    intro: "Des explications pratiques pour entrepreneurs et conducteurs de travaux : comment un modèle est construit, quel système il vous faut et quoi fournir.",
    lees: "Lire la suite",
  },
  en: {
    meta: { title: "Machine control 3D model knowledge base | Studio VM", description: "Terrain models, breaklines, coordinate systems, files per brand and what to supply: practical explanations for contractors and machine operators." },
    eyebrow: "Knowledge base",
    titel: "All about 3D models for machine control",
    intro: "Practical explanations for contractors and site managers: how a model is built, which system you need and what to supply.",
    lees: "Read more",
  },
  de: {
    meta: { title: "Wissen: 3D-Modelle für Maschinensteuerung | Studio VM", description: "Geländemodelle, Bruchkanten, Koordinatensysteme, Dateien je Marke und was Sie liefern sollten: praxisnahe Erklärungen für Bauunternehmen." },
    eyebrow: "Wissensdatenbank",
    titel: "Alles über 3D-Modelle für Maschinensteuerung",
    intro: "Praxisnahe Erklärungen für Bauunternehmen und Bauleiter: wie ein Modell aufgebaut ist, welches Koordinatensystem Sie benötigen und was Sie am besten liefern.",
    lees: "Weiterlesen",
  },
  es: {
    meta: { title: "Guía de modelos 3D para control de maquinaria | Studio VM", description: "Modelos de terreno, líneas de ruptura, sistemas de coordenadas, archivos por marca y qué aportar: explicaciones prácticas para contratistas." },
    eyebrow: "Base de conocimiento",
    titel: "Todo sobre modelos 3D para control de maquinaria",
    intro: "Explicaciones prácticas para contratistas y jefes de obra: cómo se construye un modelo, qué sistema de coordenadas necesita y qué conviene aportar.",
    lees: "Leer más",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, "/kennis", { ...T[locale].meta, ogBeeld: ogBeeld(locale, "kennis") });
}

export default async function KennisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const kruimel = KRUIMEL["/kennis"][locale];

  const schema = graph(
    siteNodes(locale),
    kruimels(locale, "/kennis", [{ naam: kruimel, pad: "/kennis" }]),
    webPagina(locale, "/kennis", {
      type: "CollectionPage",
      naam: t.meta.title,
      beschrijving: t.meta.description,
      mainEntity: itemLijst(
        KENNIS.map((a) => ({ url: canoniek(locale, `/kennis/${a.slug}`), naam: a.i18n[locale].titel })),
      ),
    }),
  );

  return (
    <main className="border-b">
      <JsonLd data={schema} />
      <section className="wrap py-16 sm:py-20 2xl:py-24">
        <Broodkruimel locale={locale} items={[{ naam: kruimel }]} />
        <div className="mt-8 max-w-3xl 2xl:max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {KENNIS.map((a, idx) => {
            const Icoon = ICONEN[a.icoon];
            const x = a.i18n[locale];
            // Oneven aantal → in de 2-koloms weergave (sm–lg) de laatste kaart liggend over de volle breedte.
            const wees = idx === KENNIS.length - 1 && KENNIS.length % 2 === 1;
            return (
              <Link
                key={a.slug}
                href={localePath(locale, `/kennis/${a.slug}`)}
                className={`group flex flex-col overflow-hidden rounded-3xl border bg-card transition-colors hover:border-accent ${wees ? "sm:max-lg:col-span-2 sm:max-lg:flex-row" : ""}`}
              >
                <div className={`relative aspect-[16/9] overflow-hidden bg-card ${wees ? "sm:max-lg:w-1/2 sm:max-lg:shrink-0" : ""}`}>
                  <Image src={KOPBEELD[a.slug].licht} alt={x.titel} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="alleen-licht object-cover transition-transform duration-700 group-hover:scale-105" />
                  <Image src={KOPBEELD[a.slug].donker} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="alleen-donker object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="flex items-start gap-2 font-semibold tracking-tight">
                    <Icoon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                    {x.titel}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{x.samenvatting}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {t.lees}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
