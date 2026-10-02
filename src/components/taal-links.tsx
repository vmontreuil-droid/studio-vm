"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAMES, isValidLocale, type Locale } from "@/lib/i18n/config";

/** Het pad zonder taalsegment, bv. "/fr/tarieven" → "/tarieven", "/fr" → "". */
export function padZonderTaal(pathname: string | null): string {
  const delen = (pathname ?? "/").split("/").filter(Boolean);
  if (delen.length > 0 && isValidLocale(delen[0])) delen.shift();
  return delen.length ? `/${delen.join("/")}` : "";
}

/** Onthoudt de taalkeuze, zodat de taalomleiding vanaf / haar volgt. */
export function bewaarTaal(l: Locale) {
  document.cookie = `locale=${l}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Gewone taallinks naar dezelfde pagina in elke taal. Ze staan al in de
 * server-HTML, zodat zoekmachines de taalversies via echte <a href> vinden.
 */
export function TaalLinks({ current }: { current: Locale }) {
  const rest = padZonderTaal(usePathname());
  return (
    <nav aria-label="Language / Taal">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              prefetch={false}
              href={`/${l}${rest}`}
              hrefLang={l}
              lang={l}
              aria-current={l === current ? "true" : undefined}
              onClick={() => bewaarTaal(l)}
              className={
                l === current
                  ? "text-foreground"
                  : "text-muted transition-colors hover:text-foreground"
              }
            >
              {LOCALE_NAMES[l]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
