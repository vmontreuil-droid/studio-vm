import Link from "next/link";
import { Mail, Lock, MapPin, Clock, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { Logo } from "@/components/logo";
import { getMessages } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

function brandIconBase(props: { className?: string }) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg {...brandIconBase({ className })}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg {...brandIconBase({ className })}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const FL: Record<
  Locale,
  {
    dienst: string;
    modellen: string;
    werkwijze: string;
    realisaties: string;
    tarieven: string;
    offerte: string;
    kennis: string;
    kennisbank: string;
    stelsels: string;
    over: string;
    overVincent: string;
    voorwaarden: string;
  }
> = {
  nl: {
    dienst: "3D-modellen",
    modellen: "Wat ik lever",
    werkwijze: "Werkwijze",
    realisaties: "Realisaties",
    tarieven: "Tarieven",
    offerte: "Offerte aanvragen",
    kennis: "Kennis",
    kennisbank: "Kennisbank",
    stelsels: "Coördinatenstelsels",
    over: "Over",
    overVincent: "Over Vincent",
    voorwaarden: "Algemene voorwaarden",
  },
  fr: {
    dienst: "Modèles 3D",
    modellen: "Ce que je livre",
    werkwijze: "Méthode",
    realisaties: "Réalisations",
    tarieven: "Tarifs",
    offerte: "Demander un devis",
    kennis: "Savoir",
    kennisbank: "Base de connaissances",
    stelsels: "Systèmes de coordonnées",
    over: "À propos",
    overVincent: "À propos de Vincent",
    voorwaarden: "Conditions générales",
  },
  en: {
    dienst: "3D models",
    modellen: "What I deliver",
    werkwijze: "How it works",
    realisaties: "Projects",
    tarieven: "Rates",
    offerte: "Request a quote",
    kennis: "Knowledge",
    kennisbank: "Knowledge base",
    stelsels: "Coordinate systems",
    over: "About",
    overVincent: "About Vincent",
    voorwaarden: "Terms & conditions",
  },
};

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const fl = FL[locale];

  const sections = [
    {
      title: fl.dienst,
      links: [
        { href: localePath(locale, "/3d-modellen"), label: fl.modellen },
        { href: localePath(locale, "/#werkwijze"), label: fl.werkwijze },
        { href: localePath(locale, "/realisaties"), label: fl.realisaties },
        { href: localePath(locale, "/tarieven"), label: fl.tarieven },
        { href: localePath(locale, "/offerte"), label: fl.offerte },
      ],
    },
    {
      title: fl.kennis,
      links: [
        { href: localePath(locale, "/kennis"), label: fl.kennisbank },
        { href: localePath(locale, "/kennis/coordinatenstelsels"), label: fl.stelsels },
        { href: localePath(locale, "/kennis/veelgestelde-vragen"), label: "FAQ" },
      ],
    },
    {
      title: fl.over,
      links: [
        { href: localePath(locale, "/over"), label: fl.overVincent },
        { href: localePath(locale, "/#contact"), label: t.nav.contact },
      ],
    },
    {
      title: t.footer.sections.legal,
      links: [
        { href: localePath(locale, "/privacy"), label: "Privacy" },
        { href: localePath(locale, "/cookies"), label: "Cookies" },
        { href: localePath(locale, "/voorwaarden"), label: fl.voorwaarden },
      ],
    },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p aria-label="Studio VM" className="leading-none">
              <Logo className="text-6xl sm:text-7xl" />
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t.footer.tagline}
            </p>
            <div className="mt-4 space-y-1.5 text-sm text-muted">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>
                  Nieuwpoortstraat 14-301
                  <br />
                  <span className="whitespace-nowrap">8570 Anzegem</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <a
                  href="tel:+32477995651"
                  className="transition-colors hover:text-foreground"
                >
                  +32 477 99 56 51
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <a
                  href="mailto:info@studio-vm.be"
                  className="transition-colors hover:text-foreground"
                >
                  info@studio-vm.be
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>
                  {locale === "fr"
                    ? "Toujours joignable"
                    : locale === "en"
                      ? "Always reachable"
                      : "Altijd bereikbaar"}
                </span>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href="mailto:info@studio-vm.be"
                aria-label="E-mail"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href="https://github.com/vmontreuil-droid"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/vincentmontreuil"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-foreground transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-t pt-8 lg:grid-cols-2">
          <NewsletterForm locale={locale} source="footer" />
          <div className="flex flex-wrap items-end justify-end gap-4 text-xs">
            <p className="font-mono text-muted">
              © {new Date().getFullYear()} Studio VM · BE 0672.960.066
            </p>
            <p className="font-mono text-muted">{t.footer.built}</p>
            <Link
              href="/admin"
              aria-label="Admin"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono uppercase tracking-widest text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              <Lock className="h-3 w-3" strokeWidth={1.75} />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
