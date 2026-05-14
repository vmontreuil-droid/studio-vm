import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight, Quote } from "lucide-react";
import { projects } from "@/lib/projects";
import { capabilities } from "@/lib/capabilities";
import { testimonials } from "@/lib/testimonials";
import { ProjectCard } from "@/components/project-card";
import { ContactForm } from "@/components/contact-form";

export default function Home() {
  return (
    <main>
      <Hero />
      <Werk />
      <Testimonials />
      <Mogelijkheden />
      <Contact />
    </main>
  );
}

function Testimonials() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Klanten
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Wat ze achteraf zeggen
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="flex h-full flex-col rounded-2xl border bg-background p-6"
            >
              <Quote className="h-5 w-5 text-accent" strokeWidth={1.5} />
              <blockquote className="mt-4 flex-1 leading-relaxed">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {t.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
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
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            Pricing
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
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
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              Contact
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Een nieuwe site, een verbouwing of gewoon een vraag?
            </h2>
            <p className="mt-6 max-w-xl text-muted">
              Stuur me een berichtje hier — of bel/mail rechtstreeks. Ik antwoord meestal
              dezelfde dag. Voor een eerste gesprek kom ik graag bij je langs.
            </p>
            <div className="mt-8 space-y-3">
              <a
                href="mailto:vmontreuil@outlook.be"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.5} />
                vmontreuil@outlook.be
              </a>
              <p className="flex items-center gap-3 text-sm text-muted">
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.5} />
                [telefoonnummer toevoegen]
              </p>
              <p className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />
                West-Vlaanderen, België
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
