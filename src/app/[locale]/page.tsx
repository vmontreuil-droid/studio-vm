import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, ArrowRight, Quote } from "lucide-react";
import { getProjects } from "@/lib/projects";
import { getCapabilities } from "@/lib/capabilities";
import { getTestimonials } from "@/lib/testimonials";
import { ProjectCard } from "@/components/project-card";
import { ContactForm } from "@/components/contact-form";
import { RotatingHeadline } from "@/components/rotating-headline";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getMessages(locale);

  return (
    <main>
      <Hero locale={locale} t={t} />
      <Stats t={t} />
      <Werk locale={locale} t={t} />
      <Testimonials t={t} locale={locale} />
      <Mogelijkheden t={t} locale={locale} />
      <Contact t={t} />
    </main>
  );
}

type T = ReturnType<typeof getMessages>;

function Hero({ locale, t }: { locale: Locale; t: T }) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
          {t.hero.eyebrow}
        </p>
        <RotatingHeadline
          titles={t.hero.titles}
          subtitles={t.hero.subtitles}
          className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          subtitleClassName="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="#werk"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.hero.ctaWerk}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
          <Link
            href={localePath(locale, "/pricing")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {t.hero.ctaPricing}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {t.hero.ctaContact}
            <Mail className="h-4 w-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Stats({ t }: { t: T }) {
  const stats = [
    { value: "14+", label: t.stats.projects },
    { value: "3", label: t.stats.languages },
    { value: "100", label: t.stats.pagespeed },
    { value: "100%", label: t.stats.stack },
    { value: "99.9%", label: t.stats.uptime },
    { value: "8", label: t.stats.ervaring },
    { value: "< 1d", label: t.stats.respons },
    { value: "0", label: t.stats.plugins },
  ];
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-6 py-8 text-center">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {s.label}
              </dt>
              <dd className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Werk({ locale, t }: { locale: Locale; t: T }) {
  return (
    <section id="werk" className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.werk.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.werk.title}
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted">{t.werk.intro}</p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {getProjects(locale).map((p) => (
            <ProjectCard key={p.slug} project={p} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {t.testimonials.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.testimonials.title}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {getTestimonials(locale).map((tm) => (
            <figure
              key={tm.author}
              className="flex h-full flex-col rounded-2xl border bg-background p-6"
            >
              <Quote className="h-5 w-5 text-accent" strokeWidth={1.5} />
              <blockquote className="mt-4 flex-1 leading-relaxed">
                "{tm.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 font-mono text-xs font-semibold text-accent">
                  {tm.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{tm.author}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {tm.role}
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

function Mogelijkheden({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section id="mogelijkheden" className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {t.mogelijkheden.eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.mogelijkheden.title}
          </h2>
          <p className="mt-6 text-muted">{t.mogelijkheden.intro}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getCapabilities(locale).map((c) => (
            <Link
              key={c.slug}
              href={localePath(locale, `/mogelijkheden/${c.slug}`)}
              className="group rounded-2xl border bg-background p-6 transition-colors hover:bg-card-hover"
            >
              <c.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 flex items-center gap-1.5 font-semibold tracking-tight">
                {c.title}
                <ArrowRight
                  className="h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  strokeWidth={2}
                />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {c.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href={localePath(locale, "/mogelijkheden")}
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            {locale === "fr"
              ? "Toutes les capacités en détail"
              : locale === "en"
                ? "All capabilities in detail"
                : "Alle mogelijkheden in detail"}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Contact({ t }: { t: T }) {
  return (
    <section id="contact" className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.contact.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.contact.title}
            </h2>
            <p className="mt-6 max-w-xl text-muted">{t.contact.intro}</p>
            <div className="mt-8 space-y-3">
              <a
                href="mailto:info@studio-vm.be"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.5} />
                info@studio-vm.be
              </a>
              <a
                href="tel:+32477995651"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.5} />
                +32 477 99 56 51
              </a>
              <p className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {t.contact.location}
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
