import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { KENNIS, kennisArtikel } from "@/lib/kennis";
import { CtaBanner } from "@/components/cta-banner";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KENNIS_ICONEN as ICONEN } from "@/lib/kennis-iconen";
import { ILLUSTRATIES, KOPBEELD } from "@/components/kennis-illustraties";
import { InhoudToc } from "@/components/inhoud-toc";
import { talen } from "@/lib/seo";

const T: Record<Locale, { terug: string; verder: string; cta: { eyebrow: string; titel: string; sub: string; knop: string } }> = {
  nl: { terug: "Kennisbank", verder: "Volgend artikel", cta: { eyebrow: "Klaar om te starten?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Laad uw plannen op, geef het werfadres en kies uw machinesturingen.", knop: "Offerte aanvragen" } },
  fr: { terug: "Base de connaissances", verder: "Article suivant", cta: { eyebrow: "Prêt à démarrer ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Chargez vos plans, indiquez l'adresse du chantier et choisissez vos systèmes de guidage.", knop: "Demander un devis" } },
  en: { terug: "Knowledge base", verder: "Next article", cta: { eyebrow: "Ready to start?", titel: "Send your plans, get a tailored quote", sub: "Upload your plans, give the site address and pick your machine control systems.", knop: "Request a quote" } },
  de: { terug: "Wissensdatenbank", verder: "Nächster Artikel", cta: { eyebrow: "Bereit loszulegen?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Laden Sie Ihre Pläne hoch, nennen Sie die Baustellenadresse und wählen Sie Ihre Maschinensteuerungen.", knop: "Angebot anfordern" } },
  es: { terug: "Base de conocimiento", verder: "Siguiente artículo", cta: { eyebrow: "¿Listo para empezar?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "Suba sus planos, indique la dirección de la obra y elija sus sistemas de control de maquinaria.", knop: "Solicitar presupuesto" } },
};

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => KENNIS.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const a = kennisArtikel(slug);
  if (!isValidLocale(locale) || !a) return {};
  const x = a.i18n[locale];
  return {
    title: `${x.titel} | Studio VM`,
    description: x.samenvatting,
    alternates: talen(locale, `/kennis/${slug}`),
  };
}

export default async function ArtikelPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const a = kennisArtikel(slug);
  if (!isValidLocale(locale) || !a) notFound();
  const t = T[locale];
  const x = a.i18n[locale];
  const Icoon = ICONEN[a.icoon];
  const i = KENNIS.findIndex((k) => k.slug === slug);
  const volgend = KENNIS[(i + 1) % KENNIS.length];

  return (
    <main>
      <article className="border-b">
        <div className="wrap py-14 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] xl:grid-cols-[15rem_minmax(0,1fr)_16rem] xl:gap-14 2xl:grid-cols-[17rem_minmax(0,1fr)_18rem] 2xl:gap-20">
            <div className="mx-auto w-full min-w-0 max-w-3xl">
              <Link href={localePath(locale, "/kennis")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                {t.terug}
              </Link>
              <p className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
                <Icoon className="h-4 w-4" strokeWidth={1.5} />
                {t.terug}
              </p>
              <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{x.titel}</h1>
              <p className="mt-6 text-xl leading-relaxed text-muted">{x.samenvatting}</p>
              <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border bg-card">
                <Image src={KOPBEELD[slug].licht} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="alleen-licht object-cover" />
                <Image src={KOPBEELD[slug].donker} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="alleen-donker object-cover" />
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
