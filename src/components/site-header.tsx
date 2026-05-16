import Link from "next/link";
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
  const items = [
    { href: localePath(locale, "/#werk"), label: t.nav.werk },
    { href: localePath(locale, "/mogelijkheden"), label: t.nav.mogelijkheden },
    { href: localePath(locale, "/pricing"), label: t.nav.pricing },
    {
      href: localePath(locale, "/scan"),
      label: locale === "fr" ? "Scan" : "Scan",
    },
    {
      href: localePath(locale, "/offerte"),
      label:
        locale === "fr" ? "Devis" : locale === "en" ? "Quote" : "Offerte",
    },
    { href: localePath(locale, "/#contact"), label: t.nav.contact },
    {
      href: localePath(locale, "/portail"),
      label:
        locale === "fr"
          ? "Portail"
          : locale === "en"
            ? "Portal"
            : "Portaal",
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href={home}
          aria-label="Studio VM"
          className="shrink-0 leading-none"
        >
          <Logo className="text-4xl sm:text-5xl" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              homePath={home.replace(/\/$/, "")}
            />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LangSwitcher current={locale} />
          </div>
          <SearchTrigger locale={locale} />
          <ThemeToggle />
          <MobileMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
