import nl from "./messages/nl";
import fr from "./messages/fr";
import en from "./messages/en";
import { type Locale, DEFAULT_LOCALE } from "./config";

const messagesByLocale = { nl, fr, en } as const;

export type Messages = typeof nl;

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}

export { LOCALES, type Locale, DEFAULT_LOCALE, isValidLocale, localePath, LOCALE_NAMES, LOCALE_LABELS } from "./config";
