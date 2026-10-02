export const LOCALES = ["nl", "fr", "en", "de", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "nl";

// Verzoekheader die middleware.ts zet op elk adres met een taal. Enkel
// global-not-found.tsx leest hem: die staat buiten [locale] en kent anders
// de taal van een onbekend adres (/es/foo) niet.
export const TAAL_HEADER = "x-taal";

export function isValidLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function localePath(locale: Locale, path: string): string {
  if (
    path.startsWith("http") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    path.startsWith("#")
  ) {
    return path;
  }
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  if (path.startsWith("/")) return `/${locale}${path}`;
  return `/${locale}/${path}`;
}

export const LOCALE_NAMES: Record<Locale, string> = {
  nl: "Nederlands",
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  nl: "NL",
  fr: "FR",
  en: "EN",
  de: "DE",
  es: "ES",
};
