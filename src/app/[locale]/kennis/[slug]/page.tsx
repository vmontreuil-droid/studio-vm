import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { KENNIS, kennisArtikel } from "@/lib/kennis";
import { CtaBanner } from "@/components/cta-banner";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KENNIS_ICONEN as ICONEN } from "@/lib/kennis-iconen";

const T: Record<Locale, { terug: string; verder: string; cta: { eyebrow: string; titel: string; sub: string; knop: string } }> = {
  nl: { terug: "Kennisbank", verder: "Volgend artikel", cta: { eyebrow: "Klaar om te starten?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Laad uw plannen op, geef het werfadres en kies uw machinesturingen.", knop: "Offerte aanvragen" } },
  fr: { terug: "Base de connaissances", verder: "Article suivant", cta: { eyebrow: "Prêt à démarrer ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Chargez vos plans, indiquez l'adresse du chantier et choisissez vos systèmes de guidage.", knop: "Demander un devis" } },
  en: { terug: "Knowledge base", verder: "Next article", cta: { eyebrow: "Ready to start?", titel: "Send your plans, get a tailored quote", sub: "Upload your plans, give the site address and pick your machine control systems.", knop: "Request a quote" } },
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
    alternates: { canonical: `https://studio-vm.be/${locale}/kennis/${slug}` },
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
        <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
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
          {a.beeld && (
            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl border bg-[#0b1220]">
              <Image src={a.beeld} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            </div>
          )}
          <div className="mt-12 space-y-12">
            {x.secties.map((s) => (
              <section key={s.kop}>
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
      </article>
      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
