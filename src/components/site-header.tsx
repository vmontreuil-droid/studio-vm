import Link from "next/link";
import { Lock, FileUp, House, Layers, Route, Images, Euro, BookOpen, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchTrigger } from "@/components/search";
import { MobileMenu } from "@/components/mobile-menu";
import { NavLink } from "@/components/nav-link";
import { Logo } from "@/components/logo";
import { LangSwitcher } from "@/components/lang-switcher";
import { getMessages } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const home = localePath(locale, "/");
  const L = {
    nl: { home: 'Home', modellen: '3D-modellen', werkwijze: 'Werkwijze', realisaties: 'Realisaties', tarieven: 'Tarieven', kennis: 'Kennisbank', offerte: 'Offerte aanvragen' },
    fr: { home: 'Accueil', modellen: 'Modèles 3D', werkwijze: 'Méthode', realisaties: 'Réalisations', tarieven: 'Tarifs', kennis: 'Savoir', offerte: 'Demander un devis' },
    en: { home: 'Home', modellen: '3D models', werkwijze: 'How it works', realisaties: 'Projects', tarieven: 'Rates', kennis: 'Knowledge', offerte: 'Request a quote' },
    de: { home: 'Start', modellen: '3D-Modelle', werkwijze: 'Arbeitsweise', realisaties: 'Referenzen', tarieven: 'Preise', kennis: 'Wissen', offerte: 'Angebot anfordern' },
    es: { home: 'Inicio', modellen: 'Modelos 3D', werkwijze: 'Cómo trabajamos', realisaties: 'Proyectos', tarieven: 'Tarifas', kennis: 'Conocimientos', offerte: 'Solicitar presupuesto' },
  }[locale];
  const items = [
    { href: home, label: L.home, icoon: House },
    { href: localePath(locale, '/3d-modellen'), label: L.modellen, icoon: Layers },
    { href: localePath(locale, '/#werkwijze'), label: L.werkwijze, icoon: Route },
    { href: localePath(locale, '/realisaties'), label: L.realisaties, icoon: Images },
    { href: localePath(locale, '/tarieven'), label: L.tarieven, icoon: Euro },
    { href: localePath(locale, '/kennis'), label: L.kennis, icoon: BookOpen },
    { href: localePath(locale, '/#contact'), label: t.nav.contact, icoon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="wrap flex items-center justify-between gap-3 py-4">
        <Link
          href={home}
          aria-label="Studio VM"
          className="shrink-0 leading-none"
        >
          <Logo className="text-5xl sm:text-6xl" />
        </Link>
        <nav className="hidden items-center gap-4 text-sm xl:flex 2xl:gap-6">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              homePath={home.replace(/\/$/, "")}
              icoon={<item.icoon className="hidden h-3.5 w-3.5 text-accent/80 2xl:inline-block" strokeWidth={1.75} aria-hidden />}
            />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LangSwitcher current={locale} compact />
          </div>
          <SearchTrigger locale={locale} />
          <ThemeToggle />
          <Link
            href={localePath(locale, '/offerte')}
            className="hidden items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 xl:inline-flex"
          >
            <FileUp className="h-3.5 w-3.5" strokeWidth={2} />
            {L.offerte}
          </Link>
          <Link
            href="/admin"
            aria-label="Admin"
            title="Admin"
            className="hidden h-8 w-8 items-center justify-center rounded-full border text-muted transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
          </Link>
          <MobileMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
