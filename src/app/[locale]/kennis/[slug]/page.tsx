import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { KENNIS, kennisArtikel } from "@/lib/kennis";
import { CtaBanner } from "@/components/cta-banner";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KENNIS_ICONEN as ICONEN } from "@/lib/kennis-iconen";
import { ILLUSTRATIES, KOPBEELD } from "@/components/kennis-illustraties";
import { InhoudToc } from "@/components/inhoud-toc";
import { Broodkruimel } from "@/components/broodkruimel";
import { JsonLd } from "@/components/json-ld";
import { KRUIMEL, SITE, canoniek, paginaMeta, type KruimelPad } from "@/lib/seo";
import { siteNodes, kruimels, webPagina, artikel, faqPagina, graph } from "@/lib/schema";
import { BEDRIJF, FUNCTIE } from "@/lib/bedrijf";
import { kennisDatum, datumLabel } from "@/lib/bijgewerkt";

const T: Record<
  Locale,
  {
    terug: string;
    verder: string;
    door: string;
    bij: string;
    leesOok: string;
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: { terug: "Kennisbank", verder: "Volgend artikel", door: "Door", bij: "bijgewerkt", leesOok: "Lees ook", cta: { eyebrow: "Klaar om te starten?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Laad uw plannen op, geef het werfadres en kies uw machinesturingen.", knop: "Offerte aanvragen" } },
  fr: { terug: "Base de connaissances", verder: "Article suivant", door: "Par", bij: "mis à jour le", leesOok: "À lire aussi", cta: { eyebrow: "Prêt à démarrer ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Chargez vos plans, indiquez l'adresse du chantier et choisissez vos systèmes de guidage.", knop: "Demander un devis" } },
  en: { terug: "Knowledge base", verder: "Next article", door: "By", bij: "updated", leesOok: "Read next", cta: { eyebrow: "Ready to start?", titel: "Send your plans, get a tailored quote", sub: "Upload your plans, give the site address and pick your machine control systems.", knop: "Request a quote" } },
  de: { terug: "Wissensdatenbank", verder: "Nächster Artikel", door: "Von", bij: "aktualisiert am", leesOok: "Weiterlesen", cta: { eyebrow: "Bereit loszulegen?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Laden Sie Ihre Pläne hoch, nennen Sie die Baustellenadresse und wählen Sie Ihre Maschinensteuerungen.", knop: "Angebot anfordern" } },
  es: { terug: "Base de conocimiento", verder: "Siguiente artículo", door: "Por", bij: "actualizado el", leesOok: "Lea también", cta: { eyebrow: "¿Listo para empezar?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "Suba sus planos, indique la dirección de la obra y elija sus sistemas de control de maquinaria.", knop: "Solicitar presupuesto" } },
};

// Enkel de negen artikels bestaan; elke andere slug is een echte 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => KENNIS.map((a) => ({ locale, slug: a.slug })));
}

/** Label van een "Lees ook"-link: titel van het artikel, anders het kruimellabel. */
function verwantLabel(pad: string, locale: Locale): string {
  if (pad.startsWith("/kennis/")) {
    const doel = kennisArtikel(pad.slice("/kennis/".length));
    if (doel) return doel.i18n[locale].titel;
  }
  return KRUIMEL[pad as KruimelPad]?.[locale] ?? pad;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = kennisArtikel(slug);
  if (!isValidLocale(locale) || !a) return {};
  const x = a.i18n[locale];
  const d = kennisDatum(slug);
  return paginaMeta(locale, `/kennis/${slug}`, {
    title: `${x.metaTitel} | Studio VM`,
    description: x.metaBeschrijving,
    type: "article",
    publishedTime: d.gepubliceerd,
    modifiedTime: d.bijgewerkt,
    ogBeeld: { url: `/${locale}/kennis/${slug}/opengraph-image`, alt: x.titel },
  });
}

export default async function ArtikelPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const a = kennisArtikel(slug);
  if (!isValidLocale(locale) || !a) notFound();
  const t = T[locale];
  const x = a.i18n[locale];
  const d = kennisDatum(slug);
  const Icoon = ICONEN[a.icoon];
  const i = KENNIS.findIndex((k) => k.slug === slug);
  const volgend = KENNIS[(i + 1) % KENNIS.length];

  const pad = `/kennis/${slug}`;
  const kruimelItems = [
    { naam: t.terug, pad: "/kennis" },
    { naam: x.titel, pad },
  ];
  const beeld = `${SITE}${KOPBEELD[slug].licht}`;
  const schema =
    slug === "veelgestelde-vragen"
      ? graph(
          siteNodes(locale),
          kruimels(locale, pad, kruimelItems),
          faqPagina(locale, pad, {
            naam: x.titel,
            beschrijving: x.metaBeschrijving,
            vragen: x.secties.map((s) => ({
              vraag: s.kop,
              antwoord: [...s.tekst, ...(s.lijst ?? [])].join("\n\n"),
            })),
          }),
        )
      : graph(
          siteNodes(locale),
          kruimels(locale, pad, kruimelItems),
          webPagina(locale, pad, {
            naam: x.titel,
            beschrijving: x.metaBeschrijving,
            mainEntity: { "@id": `${canoniek(locale, pad)}#article` },
            beeld,
          }),
          artikel(locale, pad, {
            titel: x.titel,
            beschrijving: x.metaBeschrijving,
            beeld,
            gepubliceerd: d.gepubliceerd,
            bijgewerkt: d.bijgewerkt,
            sectie: t.terug,
          }),
        );

  return (
    <main>
      <JsonLd data={schema} />
      <article className="border-b">
        <div className="wrap py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[15rem_minmax(0,1fr)_16rem] xl:gap-14 2xl:grid-cols-[17rem_minmax(0,1fr)_18rem] 2xl:gap-20">
            <div className="mx-auto w-full min-w-0 max-w-3xl">
              <Broodkruimel locale={locale} items={[{ naam: t.terug, pad: "/kennis" }, { naam: x.titel }]} />
              <p className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
                <Icoon className="h-4 w-4" strokeWidth={1.5} />
                {t.terug}
              </p>
              <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{x.titel}</h1>
              <p className="mt-6 text-xl leading-relaxed text-muted">{x.samenvatting}</p>
              <p className="mt-6 text-sm text-muted">
                {t.door}{" "}
                <Link href={localePath(locale, "/over")} className="font-medium text-foreground hover:text-accent">
                  {BEDRIJF.naam}
                </Link>
                , {FUNCTIE[locale]} · {t.bij} <time dateTime={d.bijgewerkt}>{datumLabel(locale, d.bijgewerkt)}</time>
              </p>
              <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border bg-card">
                <Image src={KOPBEELD[slug].licht} alt={x.titel} fill fetchPriority="high" sizes="(max-width: 768px) 100vw, 768px" className="alleen-licht object-cover" />
                <Image src={KOPBEELD[slug].donker} alt="" fill fetchPriority="high" sizes="(max-width: 768px) 100vw, 768px" className="alleen-donker object-cover" />
              </div>
              <div className="mt-12 space-y-12">
                {x.secties.map((s, si) => (
                  <section key={s.kop} id={`sectie-${si + 1}`} className="scroll-mt-28">
                    <h2 className="text-2xl font-semibold tracking-tight">{s.kop}</h2>
                    <div className="mt-4 space-y-4 text-lg leading-relaxed text-muted">
                      {s.tekst.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                    {s.lijst && (
                      <ul className="mt-5 space-y-2">
                        {s.lijst.map((l) => (
                          <li key={l} className="flex gap-3 leading-relaxed">
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            {l}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(ILLUSTRATIES[slug] ?? []).filter((il) => il.naSectie === si).map((il, k) => (
                      <div key={k}>{il.render(locale)}</div>
                    ))}
                  </section>
                ))}
              </div>
              {a.verwant.length > 0 && (
                <section aria-labelledby="lees-ook" className="mt-16">
                  <h2 id="lees-ook" className="text-xl font-semibold tracking-tight">
                    {t.leesOok}
                  </h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                    {a.verwant.map((v) => (
                      <li key={v}>
                        <Link
                          href={localePath(locale, v)}
                          className="group flex h-full items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-sm font-medium leading-snug transition-colors hover:border-accent"
                        >
                          <span>{verwantLabel(v, locale)}</span>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {volgend && volgend.slug !== slug && (
                <Link
                  href={localePath(locale, `/kennis/${volgend.slug}`)}
                  className="group mt-16 flex items-center justify-between gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-accent"
                >
                  <span>
                    <span className="block font-mono text-xs uppercase tracking-widest text-muted">{t.verder}</span>
                    <span className="mt-1 block font-semibold tracking-tight">{volgend.i18n[locale].titel}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:translate-x-1" strokeWidth={2} />
                </Link>
              )}
            </div>

            {/* Links (xl+): inhoud van dit artikel */}
            <aside className="hidden xl:sticky xl:top-28 xl:order-first xl:block xl:max-h-[calc(100vh-8rem)] xl:self-start xl:overflow-y-auto xl:pt-[4.5rem]">
              <InhoudToc
                ariaLabel={x.titel}
                genummerd
                items={x.secties.map((s, si) => ({ id: `sectie-${si + 1}`, label: s.kop }))}
              />
            </aside>

            {/* Rechts (lg+): de andere artikels uit de kennisbank */}
            <aside className="hidden lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pt-[4.5rem]">
              <nav aria-label={t.terug} className="text-sm">
                <Link
                  href={localePath(locale, "/kennis")}
                  className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-muted hover:text-accent"
                >
                  {t.terug}
                </Link>
                <ul className="space-y-1">
                  {KENNIS.map((k) => {
                    const KIcoon = ICONEN[k.icoon];
                    const actief = k.slug === slug;
                    return (
                      <li key={k.slug}>
                        <Link
                          href={localePath(locale, `/kennis/${k.slug}`)}
                          aria-current={actief ? "page" : undefined}
                          className={`flex items-start gap-2.5 rounded-xl px-3 py-2 leading-snug transition-colors ${
                            actief ? "bg-card font-medium text-foreground" : "text-muted hover:bg-card hover:text-foreground"
                          }`}
                        >
                          <KIcoon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                          {k.i18n[locale].titel}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </article>
      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
