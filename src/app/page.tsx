import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import { capabilities } from "@/lib/capabilities";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Werk />
        <Mogelijkheden />
        <Contact />
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
          <a href="#werk" className="text-muted transition-colors hover:text-foreground">
            Werk
          </a>
          <a
            href="#mogelijkheden"
            className="text-muted transition-colors hover:text-foreground"
          >
            Mogelijkheden
          </a>
          <a
            href="#contact"
            className="text-muted transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
          Vincent Montreuil — webdeveloper
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          Websites die werken voor wie ze gebruiken.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          Ik bouw snelle, tweetalige websites en webshops voor lokale ondernemers in
          Vlaanderen. Zonder plugin-spaghetti, zonder maandelijkse kostenexplosie, met
          een admin die voor jou werkt.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#werk"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Bekijk werk
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            Praat met me
            <Mail className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Werk() {
  return (
    <section id="werk" className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              Werk
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Recent werk
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted">
            Een greep uit de sites en webshops die ik de afgelopen maanden bouwde —
            restaurants, ateliers, fotografen en bedrijven.
          </p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const card = (
    <article className="group flex h-full flex-col bg-card p-8 transition-colors hover:bg-card-hover">
      <div
        aria-hidden
        className="mb-6 flex h-32 items-center justify-center rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${project.accent}, ${project.accent}cc)`,
        }}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-white/80">
          {project.slug}
        </span>
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {project.tagline}
      </p>
      <h3 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {project.name}
        {project.url && (
          <ArrowUpRight
            className="h-5 w-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
            strokeWidth={1.5}
          />
        )}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {project.description}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded-full bg-background px-3 py-1 font-mono text-xs text-muted"
          >
            {s}
          </span>
        ))}
      </div>
    </article>
  );
  return project.url ? (
    <a href={project.url} target="_blank" rel="noopener noreferrer" className="block">
      {card}
    </a>
  ) : (
    card
  );
}

function Mogelijkheden() {
  return (
    <section id="mogelijkheden" className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Mogelijkheden
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Wat ik allemaal kan bouwen
          </h2>
          <p className="mt-6 text-muted">
            Onder de motorkap zit telkens dezelfde stack — Next.js, Supabase, Tailwind.
            Welke modules je nodig hebt hangt af van je zaak. Hieronder een overzicht.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div key={c.title} className="rounded-2xl border bg-background p-6">
              <c.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              Contact
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Een nieuwe site, een verbouwing of gewoon een vraag?
            </h2>
            <p className="mt-6 max-w-xl text-muted">
              Stuur me een mail of bel. Ik antwoord meestal dezelfde dag. Voor een eerste
              gesprek kom ik graag bij je langs — koffie van jou, ideeën van mij.
            </p>
          </div>
          <div className="space-y-4">
            <a
              href="mailto:vmontreuil@outlook.be"
              className="flex items-start gap-4 rounded-2xl border bg-card p-6 transition-colors hover:bg-card-hover"
            >
              <Mail className="mt-0.5 h-5 w-5 text-accent" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  E-mail
                </p>
                <p className="mt-1 text-base font-medium">vmontreuil@outlook.be</p>
              </div>
            </a>
            <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
              <Phone className="mt-0.5 h-5 w-5 text-accent" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Telefoon
                </p>
                <p className="mt-1 text-base font-medium text-muted">
                  [telefoonnummer toevoegen]
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border bg-card p-6">
              <MapPin className="mt-0.5 h-5 w-5 text-accent" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Locatie
                </p>
                <p className="mt-1 text-base font-medium">West-Vlaanderen, België</p>
              </div>
            </div>
          </div>
        </div>
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
