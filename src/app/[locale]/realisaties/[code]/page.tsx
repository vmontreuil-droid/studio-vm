import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { Broodkruimel } from "@/components/broodkruimel";
import { DeelKnoppen } from "@/components/deel-knoppen";
import { SysteemChips } from "@/components/systeem-chips";
import {
  ARCHIEF,
  ARCHIEF_WEERGAVE,
  LUCHTFOTO_BRON,
  LUCHTFOTO_LABEL,
  archiefBeeld,
  archiefPad,
  archiefProject,
  metLuchtfoto,
  type ArchiefProject,
  type ArchiefWeergave,
} from "@/lib/archief";
import { CATEGORIEEN } from "@/lib/realisaties";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KRUIMEL, SITE, canoniek, ogBeeld, paginaMeta } from "@/lib/seo";
import { galerij, graph, kruimels, siteNodes } from "@/lib/schema";

// Eén project uit het archief, in al zijn weergaven. Enkel de codes uit
// lib/archief bestaan; elke andere is een echte 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => ARCHIEF.map((p) => ({ locale, code: p.code })));
}

const T: Record<
  Locale,
  {
    meta: string;
    weergaven: (n: number) => string;
    discreet: string;
    systemen: string;
    vorig: string;
    volgend: string;
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: {
    meta: "Bekijk het 3D-model voor machinesturing in hoogtekleuren en op de luchtfoto.",
    weergaven: (n) => `Hetzelfde model, ${n} weergaven`,
    discreet: "Klant en werf noemen we uit discretie niet.",
    systemen: "Dit model leveren we voor elk systeem dat u opgeeft, in het coördinatenstelsel van de werf.",
    vorig: "Vorig project",
    volgend: "Volgend project",
    cta: { eyebrow: "Uw project volgende?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Van bouwput tot wegtracé: elk project met GPS-gestuurde machines.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: "Découvrez le modèle 3D pour le guidage d'engins en couleurs hypsométriques et sur photo aérienne.",
    weergaven: (n) => `Le même modèle, ${n} vues`,
    discreet: "Par discrétion, nous ne citons ni le client ni le chantier.",
    systemen: "Nous livrons ce modèle pour le système de votre choix, dans le système de coordonnées du chantier.",
    vorig: "Projet précédent",
    volgend: "Projet suivant",
    cta: { eyebrow: "Votre projet est le prochain ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "De la fouille au tracé routier : tout projet avec des engins guidés par GPS.", knop: "Demander un devis" },
  },
  en: {
    meta: "See the 3D model for machine control in height colours and on the aerial photo.",
    weergaven: (n) => `One model, ${n} views`,
    discreet: "Out of discretion, we do not name the client or the site.",
    systemen: "We deliver this model for whichever system you specify, in the site's coordinate system.",
    vorig: "Previous project",
    volgend: "Next project",
    cta: { eyebrow: "Your project next?", titel: "Send your plans, get a tailored quote", sub: "From excavation to road alignment: any project with GPS-guided machines.", knop: "Request a quote" },
  },
  de: {
    meta: "Sehen Sie das 3D-Modell für die Maschinensteuerung in Höhenfarben und auf dem Luftbild.",
    weergaven: (n) => `Ein Modell, ${n} Ansichten`,
    discreet: "Aus Diskretion nennen wir weder Auftraggeber noch Baustelle.",
    systemen: "Wir liefern dieses Modell für jedes System, das Sie angeben, im Koordinatensystem der Baustelle.",
    vorig: "Vorheriges Projekt",
    volgend: "Nächstes Projekt",
    cta: { eyebrow: "Ihr Projekt als Nächstes?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Von der Baugrube bis zur Straßentrasse: jedes Projekt mit GPS-gesteuerten Maschinen.", knop: "Angebot anfordern" },
  },
  es: {
    meta: "Vea el modelo 3D para control de maquinaria en colores hipsométricos y sobre la foto aérea.",
    weergaven: (n) => `Un modelo, ${n} vistas`,
    discreet: "Por discreción, no mencionamos al cliente ni la obra.",
    systemen: "Entregamos este modelo para el sistema que usted indique, en el sistema de coordenadas de la obra.",
    vorig: "Proyecto anterior",
    volgend: "Proyecto siguiente",
    cta: { eyebrow: "¿Su proyecto es el siguiente?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "De la excavación al trazado de carreteras: cualquier proyecto con máquinas guiadas por GPS.", knop: "Solicitar presupuesto" },
  },
};

function bijschrift(p: ArchiefProject, w: ArchiefWeergave, l: Locale): string {
  const x = ARCHIEF_WEERGAVE[w][l];
  return `${x.naam}: ${x.uitleg}`;
}

/** Een weergave met haar bijschrift; de luchtfoto's met hun bron. */
function Beeld({ p, w, l, groot = false }: { p: ArchiefProject; w: ArchiefWeergave; l: Locale; groot?: boolean }) {
  const x = ARCHIEF_WEERGAVE[w][l];
  return (
    <figure>
      {/* Donkere renders: in beide thema's op hun eigen steen. */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-[#0c0a09]">
        <Image
          src={archiefBeeld(p.code, w)}
          alt={`${p[l].titel}, ${x.naam.toLowerCase()}`}
          fill
          {...(groot ? { fetchPriority: "high" as const } : {})}
          sizes={groot ? "(max-width: 1280px) 100vw, 1200px" : "(max-width: 640px) 100vw, 50vw"}
          className="object-cover"
        />
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">
        <span className="font-semibold text-foreground">{x.naam}.</span> {x.uitleg}
        {metLuchtfoto(w) && (
          <span className="mt-1 block text-xs">
            {LUCHTFOTO_LABEL[l]}: © {LUCHTFOTO_BRON[p.luchtfoto]}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { locale, code } = await params;
  const p = archiefProject(code);
  if (!isValidLocale(locale) || !p) return {};
  return paginaMeta(locale, archiefPad(code), {
    title: `${p[locale].titel} | Studio VM`,
    description: `${p[locale].tekst} ${T[locale].meta}`,
    ogBeeld: ogBeeld(locale, `realisaties/${code}`),
  });
}

export default async function ArchiefProjectPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  const p = archiefProject(code);
  if (!isValidLocale(locale) || !p) notFound();
  const t = T[locale];
  const pad = archiefPad(code);
  const i = ARCHIEF.findIndex((x) => x.code === code);
  const vorig = ARCHIEF[(i - 1 + ARCHIEF.length) % ARCHIEF.length]!;
  const volgend = ARCHIEF[(i + 1) % ARCHIEF.length]!;
  const [eerste, ...rest] = p.weergaven;
  const terug = KRUIMEL["/realisaties"][locale];

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale),
          kruimels(locale, pad, [
            { naam: terug, pad: "/realisaties" },
            { naam: p[locale].titel, pad },
          ]),
          galerij(locale, pad, {
            naam: p[locale].titel,
            beschrijving: p[locale].tekst,
            beelden: p.weergaven.map((w) => ({
              url: `${SITE}${archiefBeeld(p.code, w)}`,
              naam: `${p[locale].titel}, ${ARCHIEF_WEERGAVE[w][locale].naam.toLowerCase()}`,
              bijschrift: bijschrift(p, w, locale),
              trefwoorden: [CATEGORIEEN[p.cat][locale], ...p.systemen].join(", "),
            })),
          }),
        )}
      />
      <section className="border-b">
        <div className="wrap py-14 sm:py-20">
          <div className="max-w-3xl">
            <Broodkruimel locale={locale} items={[{ naam: terug, pad: "/realisaties" }, { naam: p[locale].titel }]} />
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">{CATEGORIEEN[p.cat][locale]}</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{p[locale].titel}</h1>
            <p className="mt-6 text-xl leading-relaxed text-muted">{p[locale].tekst}</p>
            <SysteemChips systemen={p.systemen} locale={locale} className="mt-6" />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {t.systemen} {t.discreet}
            </p>
          </div>
          {eerste && (
            <div className="mt-12">
              <Beeld p={p} w={eerste} l={locale} groot />
            </div>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="border-b bg-card">
          <div className="wrap py-16 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.weergaven(p.weergaven.length)}</h2>
            <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {rest.map((w) => (
                <Beeld key={w} p={p} w={w} l={locale} />
              ))}
            </div>
            <DeelKnoppen locale={locale} url={canoniek(locale, pad)} tekst={p[locale].titel} className="mt-12 border-t pt-6" />
          </div>
        </section>
      )}

      <nav aria-label={terug} className="border-b">
        <div className="wrap grid gap-4 py-10 sm:grid-cols-2">
          <Link href={localePath(locale, archiefPad(vorig.code))} className="group flex items-center gap-4 rounded-3xl border bg-card p-4 hover:border-accent">
            <ArrowLeft className="h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
            <span className="relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xl bg-[#0c0a09]">
              <Image src={archiefBeeld(vorig.code, "3d")} alt="" fill sizes="112px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">{t.vorig}</span>
              <span className="mt-1 block font-semibold tracking-tight group-hover:text-accent">{vorig[locale].titel}</span>
            </span>
          </Link>
          <Link href={localePath(locale, archiefPad(volgend.code))} className="group flex items-center gap-4 rounded-3xl border bg-card p-4 hover:border-accent sm:flex-row-reverse sm:text-right">
            <ArrowRight className="h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
            <span className="relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xl bg-[#0c0a09]">
              <Image src={archiefBeeld(volgend.code, "3d")} alt="" fill sizes="112px" className="object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">{t.volgend}</span>
              <span className="mt-1 block font-semibold tracking-tight group-hover:text-accent">{volgend[locale].titel}</span>
            </span>
          </Link>
        </div>
      </nav>

      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
