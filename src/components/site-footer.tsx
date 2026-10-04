import Link from "next/link";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { Logo } from "@/components/logo";
import { TaalLinks } from "@/components/taal-links";
import { getMessages } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";
import { BEDRIJF, LAND, identiteitsregel, socialProfielen } from "@/lib/bedrijf";
import { MerkIcoon } from "@/components/merk-iconen";

// Iconen naar de profielen van Studio VM: elk ingevuld profiel uit SOCIAL
// (lib/bedrijf), kaal adres zonder UTM, rel="me" voor de profielverificatie.

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
    voorwaarden: string;
    bereikbaar: string;
    /** "Studio VM op Facebook" */
    op: string;
  }
> = {
  nl: {
    dienst: "3D-modellen",
    modellen: "Wat een 3D-model bevat",
    werkwijze: "Werkwijze",
    realisaties: "Realisaties",
    tarieven: "Tarieven",
    offerte: "Offerte aanvragen",
    kennis: "Kennis",
    kennisbank: "Kennisbank",
    stelsels: "Coördinatenstelsels",
    over: "Over",
    voorwaarden: "Algemene voorwaarden",
    bereikbaar: "Altijd bereikbaar",
    op: "op",
  },
  fr: {
    dienst: "Modèles 3D",
    modellen: "Contenu d'un modèle 3D",
    werkwijze: "Méthode",
    realisaties: "Réalisations",
    tarieven: "Tarifs",
    offerte: "Demander un devis",
    kennis: "Savoir",
    kennisbank: "Base de connaissances",
    stelsels: "Systèmes de coordonnées",
    over: "À propos",
    voorwaarden: "Conditions générales",
    bereikbaar: "Toujours joignable",
    op: "sur",
  },
  en: {
    dienst: "3D models",
    modellen: "What a 3D model contains",
    werkwijze: "How it works",
    realisaties: "Projects",
    tarieven: "Rates",
    offerte: "Request a quote",
    kennis: "Knowledge",
    kennisbank: "Knowledge base",
    stelsels: "Coordinate systems",
    over: "About",
    voorwaarden: "Terms & conditions",
    bereikbaar: "Always reachable",
    op: "on",
  },
  de: {
    dienst: "3D-Modelle",
    modellen: "Inhalt eines 3D-Modells",
    werkwijze: "Arbeitsweise",
    realisaties: "Referenzen",
    tarieven: "Preise",
    offerte: "Angebot anfordern",
    kennis: "Wissen",
    kennisbank: "Wissensdatenbank",
    stelsels: "Koordinatensysteme",
    over: "Über uns",
    voorwaarden: "Allgemeine Geschäftsbedingungen",
    bereikbaar: "Jederzeit erreichbar",
    op: "auf",
  },
  es: {
    dienst: "Modelos 3D",
    modellen: "Contenido de un modelo 3D",
    werkwijze: "Cómo trabajamos",
    realisaties: "Proyectos",
    tarieven: "Tarifas",
    offerte: "Solicitar presupuesto",
    kennis: "Conocimientos",
    kennisbank: "Base de conocimientos",
    stelsels: "Sistemas de coordenadas",
    over: "Acerca de",
    voorwaarden: "Condiciones generales",
    bereikbaar: "Siempre disponible",
    op: "en",
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
        { href: localePath(locale, "/over"), label: t.nav.over },
        { href: localePath(locale, "/#contact"), label: t.nav.contact },
      ],
    },
    {
      title: t.footer.sections.legal,
      links: [
        { href: localePath(locale, "/privacy"), label: locale === "de" ? "Datenschutz" : locale === "es" ? "Privacidad" : "Privacy" },
        { href: localePath(locale, "/cookies"), label: "Cookies" },
        { href: localePath(locale, "/voorwaarden"), label: fl.voorwaarden },
      ],
    },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="wrap py-16 xl:py-20">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] xl:gap-14">
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
            <p aria-label="Studio VM" className="leading-none">
              <Logo className="text-6xl sm:text-7xl" />
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              {t.footer.tagline}
            </p>
            <div className="mt-4 space-y-1.5 text-sm text-muted">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>
                  {BEDRIJF.straat}
                  <br />
                  <span className="whitespace-nowrap">
                    {BEDRIJF.postcode} {BEDRIJF.gemeente}
                  </span>
                  <br />
                  {LAND[locale]}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <a
                  href={`tel:${BEDRIJF.telefoonE164}`}
                  className="transition-colors hover:text-foreground"
                >
                  {BEDRIJF.telefoon}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <a
                  href={`mailto:${BEDRIJF.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {BEDRIJF.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{fl.bereikbaar}</span>
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`mailto:${BEDRIJF.email}`}
                aria-label="E-mail"
                title="E-mail"
                className="rounded-full border p-2 text-muted transition-colors hover:border-muted-foreground! hover:text-foreground"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
              {socialProfielen().map((p) => (
                <a
                  key={p.platform}
                  href={p.url}
                  target="_blank"
                  rel="me noopener"
                  aria-label={`${BEDRIJF.naam} ${fl.op} ${p.naam}`}
                  title={p.naam}
                  className="rounded-full border p-2 text-muted transition-colors hover:border-muted-foreground! hover:text-foreground"
                >
                  <MerkIcoon merk={p.platform} />
                </a>
              ))}
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
          <div className="flex flex-col items-start justify-end gap-4 text-xs lg:items-end">
            <TaalLinks current={locale} />
            <div className="flex flex-wrap items-center gap-4 lg:justify-end">
              <p className="font-mono text-muted">{t.footer.built}</p>
              {/* Geen publieke knop naar /admin: het beheer bereik je via het
                  adres zelf, zodat de site er geen bezoekers naartoe leidt. */}
            </div>
          </div>
        </div>
        {/* Wettelijke identiteit van de eenmanszaak (naam, adres,
            ondernemingsnummer): de enige plek op de gewone pagina's met de
            naam van de houder. */}
        <p className="mt-8 text-xs leading-relaxed text-muted">
          © {new Date().getFullYear()} {identiteitsregel(locale)}
        </p>
      </div>
    </footer>
  );
}
