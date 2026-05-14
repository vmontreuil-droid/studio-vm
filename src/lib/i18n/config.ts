export const LOCALES = ["nl", "fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "nl";

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
};

export const LOCALE_LABELS: Record<Locale, string> = {
  nl: "NL",
  fr: "FR",
  en: "EN",
};
