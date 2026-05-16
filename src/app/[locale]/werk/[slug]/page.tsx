import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";
import {
  projectSlugs,
  getProjectBySlug,
  getOtherProjects,
  type Project,
} from "@/lib/projects";
import { getCaseStudy } from "@/lib/case-studies";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { ProjectCard } from "@/components/project-card";
import { BrowserFrame } from "@/components/browser-frame";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    projectSlugs.map((slug) => ({ locale, slug })),
  );
}

const ui: Record<
  Locale,
  {
    back: string;
    visit: string;
    frameNote: string;
    scope: string;
    stack: string;
    year: string;
    challenge: string;
    solution: string;
    result: string;
    other: string;
    seeAll: string;
    ctaEyebrow: string;
    ctaTitle: string;
    ctaButton: string;
  }
> = {
  nl: {
    back: "Terug naar werk",
    visit: "Bezoek live site",
    frameNote: "De échte site. Klik om 'm groot en live te openen — klik gerust rond, je blijft hier.",
    scope: "Scope",
    stack: "Stack",
    year: "Jaar",
    challenge: "De vraag",
    solution: "De oplossing",
    result: "Resultaat",
    other: "Ander werk",
    seeAll: "Alles bekijken →",
    ctaEyebrow: "Een soortgelijk project?",
    ctaTitle: "Laten we eens praten over wat jij wil bouwen.",
    ctaButton: "Neem contact op",
  },
  fr: {
    back: "Retour aux travaux",
    visit: "Voir le site en ligne",
    frameNote: "Le vrai site. Cliquez pour l'ouvrir en grand et en direct — cliquez partout, vous restez ici.",
    scope: "Périmètre",
    stack: "Stack",
    year: "Année",
    challenge: "Le besoin",
    solution: "La solution",
    result: "Résultat",
    other: "Autres travaux",
    seeAll: "Tout voir →",
    ctaEyebrow: "Un projet similaire ?",
    ctaTitle: "Parlons de ce que vous voulez construire.",
    ctaButton: "Prendre contact",
  },
  en: {
    back: "Back to work",
    visit: "Visit live site",
    frameNote: "The real site. Click to open it large and live — click around, you stay here.",
    scope: "Scope",
    stack: "Stack",
    year: "Year",
    challenge: "The brief",
    solution: "The solution",
    result: "Result",
    other: "Other work",
    seeAll: "See all →",
    ctaEyebrow: "A similar project?",
    ctaTitle: "Let's talk about what you want to build.",
    ctaButton: "Get in touch",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const project = getProjectBySlug(slug, locale);
  if (!project) return {};
  return {
    title: `${project.name} — Studio VM`,
    description: project.description,
    openGraph: {
      title: `${project.name} — Studio VM`,
      description: project.description,
    },
  };
}

export default async function WerkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const project = getProjectBySlug(slug, locale);
  if (!project) notFound();
  const others = getOtherProjects(slug, locale, 3);
  const t = ui[locale];
  const cs = getCaseStudy(slug, locale);

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Studio VM", url: `https://studio-vm.be/${locale}` },
          { name: "Werk", url: `https://studio-vm.be/${locale}#werk` },
          {
            name: project.name,
            url: `https://studio-vm.be/${locale}/werk/${project.slug}`,
          },
        ]}
      />
      <article>
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-20"
            style={{
              background: `radial-gradient(60% 60% at 30% 20%, ${project.accent}, transparent)`,
            }}
          />
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Link
              href={localePath(locale, "/#werk")}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              {t.back}
            </Link>
            <p className="mt-8 font-mono text-xs uppercase tracking-widest text-accent">
              {project.tagline} · {project.year}
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {project.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {project.description}
            </p>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <BrowserFrame
              url={project.url}
              image={project.image}
              name={project.name}
              accent={project.accent}
              locale={locale}
            />
            <p className="mt-3 text-center font-mono text-xs text-muted">
              {t.frameNote}
            </p>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-3">
              <aside className="lg:col-span-1">
                <dl className="space-y-8">
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                      {t.scope}
                    </dt>
                    <dd className="mt-3 flex flex-wrap gap-2">
                      {project.scope.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-card px-3 py-1 font-mono text-xs text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                      {t.stack}
                    </dt>
                    <dd className="mt-3 flex flex-wrap gap-2">
                      {project.stack.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-card px-3 py-1 font-mono text-xs text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                      {t.year}
                    </dt>
                    <dd className="mt-2 font-medium">{project.year}</dd>
                  </div>
                </dl>
              </aside>

              <div className="space-y-12 lg:col-span-2">
                <section>
                  <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                    {t.challenge}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed">{project.challenge}</p>
                </section>
                <section>
                  <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                    {t.solution}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed">{project.solution}</p>
                </section>
                <section>
                  <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                    {t.result}
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3">
                        <Check
                          className="mt-1 h-4 w-4 flex-shrink-0 text-accent"
                          strokeWidth={2.5}
                        />
                        <span className="text-base">{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </section>
      </article>

      {cs && (
        <>
          <section className="border-b">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <p className="max-w-3xl text-lg leading-relaxed text-foreground/90">
                {cs.context}
              </p>
            </div>
          </section>

          <section className="border-b bg-card">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
                {cs.metricsTitle}
              </h2>
              <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
                {cs.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="flex min-h-[9rem] flex-col bg-background p-6"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {m.label}
                    </p>
                    <p className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-accent">
                      {m.after}
                    </p>
                    <p className="mt-auto pt-4 text-xs leading-snug text-muted">
                      {locale === "fr"
                        ? "avant : "
                        : locale === "en"
                          ? "before: "
                          : "voorheen: "}
                      <span className="line-through decoration-muted/40">
                        {m.before}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
                {cs.decisionsTitle}
              </h2>
              <div className="space-y-6">
                {cs.decisions.map((d) => (
                  <div
                    key={d.title}
                    className="rounded-2xl border bg-card p-6"
                  >
                    <h3 className="font-semibold tracking-tight">{d.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">
                      {d.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b bg-card">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-accent">
                {cs.timelineTitle}
              </h2>
              <ol className="relative space-y-8 border-l pl-8">
                {cs.timeline.map((p) => (
                  <li key={p.phase} className="relative">
                    <span className="absolute -left-[2.55rem] top-1 h-3 w-3 rounded-full border-2 border-accent bg-background" />
                    <h3 className="font-semibold tracking-tight">{p.phase}</h3>
                    <p className="mt-1 text-sm text-muted">{p.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="border-b">
            <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
              <h2 className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
                {cs.reflectionTitle}
              </h2>
              <p className="max-w-3xl text-lg italic leading-relaxed text-foreground/90">
                {cs.reflection}
              </p>
            </div>
          </section>
        </>
      )}

      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.other}
            </h2>
            <Link
              href={localePath(locale, "/#werk")}
              className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
            >
              {t.seeAll}
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((p: Project) => (
              <ProjectCard key={p.slug} project={p} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.ctaEyebrow}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.ctaTitle}
          </h2>
          <Link
            href={localePath(locale, "/#contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
