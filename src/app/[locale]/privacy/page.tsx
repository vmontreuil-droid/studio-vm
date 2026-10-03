import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";
import { InhoudToc } from "@/components/inhoud-toc";
import { JsonLd } from "@/components/json-ld";
import { KRUIMEL, paginaMeta } from "@/lib/seo";
import { graph, kruimels, siteNodes, webPagina } from "@/lib/schema";
import { PAGINA_BIJGEWERKT, datumLabel } from "@/lib/bijgewerkt";
import { PRIVACY, PrivacyInhoud, privacyToc } from "@/components/juridisch/privacy-inhoud";

const PAD = "/privacy";

// De tekst staat in components/juridisch/privacy-inhoud.tsx (gedeeld met het
// klantenportaal: /portail/dashboard/privacy).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, PRIVACY[locale].meta);
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = PRIVACY[locale];

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale),
          kruimels(locale, PAD, [{ naam: KRUIMEL[PAD][locale], pad: PAD }]),
          webPagina(locale, PAD, { naam: c.meta.title, beschrijving: c.meta.description }),
        )}
      />
      <article>
        <header className="border-b">
          <div className="wrap py-16 sm:py-20">
            <div className="mx-auto max-w-3xl lg:max-w-[72rem]">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                {c.eyebrow}
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">
                {c.title}
              </h1>
              <p className="mt-4 text-sm text-muted">
                {c.updated}: {datumLabel(locale, PAGINA_BIJGEWERKT[PAD])}
              </p>
            </div>
          </div>
        </header>
        <div className="wrap py-16">
          <div className="mx-auto grid max-w-3xl gap-12 lg:max-w-[72rem] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-20">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
              <InhoudToc kop={c.eyebrow} items={privacyToc(locale)} />
            </aside>
            <div className="max-w-3xl space-y-8 text-foreground">
              <PrivacyInhoud locale={locale} />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
