import nl from "./messages/nl";
import fr from "./messages/fr";
import en from "./messages/en";
import de from "./messages/de";
import es from "./messages/es";
import { type Locale, DEFAULT_LOCALE } from "./config";

export type Messages = typeof nl;

const messagesByLocale: Record<Locale, Messages> = { nl, fr, en, de, es };

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}

export { LOCALES, type Locale, DEFAULT_LOCALE, isValidLocale, localePath, LOCALE_NAMES, LOCALE_LABELS } from "./config";
