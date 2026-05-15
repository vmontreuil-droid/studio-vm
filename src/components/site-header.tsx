import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchTrigger } from "@/components/search";
import { MobileMenu } from "@/components/mobile-menu";
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
    { href: localePath(locale, "/#contact"), label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-header backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
        <Link
          href={home}
          aria-label="Studio VM"
          className="font-mono text-base font-semibold tracking-tight"
        >
          <span className="text-accent">&lt;</span>
          vm
          <span className="text-accent">/&gt;</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LangSwitcher current={locale} />
          <SearchTrigger locale={locale} />
          <ThemeToggle />
          <MobileMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
