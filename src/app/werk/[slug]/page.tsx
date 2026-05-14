import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check, ArrowRight } from "lucide-react";
import { projects, getProjectBySlug, getOtherProjects } from "@/lib/projects";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
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
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const others = getOtherProjects(slug, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <article>
          <ProjectHero project={project} />
          <ProjectBody project={project} />
        </article>
        <OtherProjects projects={others} />
        <NextProjectCTA />
      </main>
      <SiteFooter />
    </>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
          studio-vm
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/#werk"
            className="text-muted transition-colors hover:text-foreground"
          >
            Werk
          </Link>
          <Link
            href="/#mogelijkheden"
            className="text-muted transition-colors hover:text-foreground"
          >
            Mogelijkheden
          </Link>
          <Link
            href="/#contact"
            className="text-muted transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

function ProjectHero({ project }: { project: ReturnType<typeof getProjectBySlug> & {} }) {
  return (
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
          href="/#werk"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Terug naar werk
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
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Bezoek live site
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </a>
        )}
      </div>
    </section>
  );
}

function ProjectBody({ project }: { project: ReturnType<typeof getProjectBySlug> & {} }) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <aside className="lg:col-span-1">
            <dl className="space-y-8">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                  Scope
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
                  Stack
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
                  Jaar
                </dt>
                <dd className="mt-2 font-medium">{project.year}</dd>
              </div>
            </dl>
          </aside>

          <div className="space-y-12 lg:col-span-2">
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                De vraag
              </h2>
              <p className="mt-3 text-lg leading-relaxed">{project.challenge}</p>
            </section>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                De oplossing
              </h2>
              <p className="mt-3 text-lg leading-relaxed">{project.solution}</p>
            </section>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                Resultaat
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
  );
}

function OtherProjects({
  projects,
}: {
  projects: ReturnType<typeof getOtherProjects>;
}) {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ander werk
          </h2>
          <Link
            href="/#werk"
            className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
          >
            Alles bekijken →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/werk/${p.slug}`}
              className="group rounded-2xl border bg-background p-6 transition-colors hover:bg-card-hover"
            >
              <div
                aria-hidden
                className="mb-4 h-20 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`,
                }}
              />
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {p.tagline}
              </p>
              <h3 className="mt-1 flex items-center gap-1.5 text-lg font-semibold tracking-tight">
                {p.name}
                <ArrowUpRight
                  className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function NextProjectCTA() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Een soortgelijk project?
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Laten we eens praten over wat jij wil bouwen.
        </h2>
        <Link
          href="/#contact"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Neem contact op
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} Studio VM
        </p>
        <p className="font-mono text-xs text-muted">
          Gebouwd met Next.js, Tailwind en koffie.
        </p>
      </div>
    </footer>
  );
}
