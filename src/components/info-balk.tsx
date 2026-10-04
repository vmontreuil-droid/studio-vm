import Link from "next/link";
import { Mail, Phone, TicketPlus } from "lucide-react";
import { BEDRIJF } from "@/lib/bedrijf";
import { localePath, type Locale } from "@/lib/i18n/config";

// Smalle balk boven de header: mail, telefoon en een ticket openen.
// Scrollt weg; de header eronder blijft plakken. Op een gsm staat alles
// gecentreerd op één regel (ticket heet daar kort "Ticket"); is het scherm
// toch te smal, dan loopt het netjes door naar een tweede regel.

const TICKET: Record<Locale, { lang: string; kort: string }> = {
  nl: { lang: "Ticket openen", kort: "Ticket" },
  fr: { lang: "Ouvrir un ticket", kort: "Ticket" },
  en: { lang: "Open a ticket", kort: "Ticket" },
  de: { lang: "Ticket eröffnen", kort: "Ticket" },
  es: { lang: "Abrir un ticket", kort: "Ticket" },
};

const BELLEN: Record<Locale, string> = {
  nl: "Bel ons",
  fr: "Appelez-nous",
  en: "Call us",
  de: "Rufen Sie uns an",
  es: "Llámenos",
};

const MAILEN: Record<Locale, string> = {
  nl: "Mail ons",
  fr: "Écrivez-nous",
  en: "Email us",
  de: "Schreiben Sie uns",
  es: "Escríbanos",
};

const CONTACT: Record<Locale, string> = {
  nl: "Contact",
  fr: "Contact",
  en: "Contact",
  de: "Kontakt",
  es: "Contacto",
};

const tint = (pct: number) => ({
  background: `color-mix(in srgb, var(--accent) ${pct}%, transparent)`,
});

function Icoon({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-accent transition-transform group-hover:scale-110"
      style={tint(14)}
      aria-hidden
    >
      {children}
    </span>
  );
}

function Streep() {
  return <span className="hidden h-3 w-px bg-current opacity-20 sm:block" aria-hidden />;
}

export function InfoBalk({ locale }: { locale: Locale }) {
  // Rechtstreeks naar het formulier voor een nieuw ticket; wie nog niet
  // aangemeld is, meldt zich eerst aan en komt daarna op het formulier.
  const ticketPad = localePath(locale, "/portail/dashboard/tickets/nieuw");
  const ticketHref = `${localePath(locale, "/portail")}?next=${encodeURIComponent(ticketPad)}`;
  const t = TICKET[locale];
  const item =
    "group inline-flex items-center gap-1.5 whitespace-nowrap py-1 transition-colors hover:text-foreground";

  return (
    <div
      className="border-b text-[11px] text-muted sm:text-xs"
      style={{ background: "color-mix(in srgb, var(--foreground) 3%, var(--background))" }}
    >
      <nav
        aria-label={CONTACT[locale]}
        className="wrap flex flex-wrap items-center justify-center gap-x-3.5 gap-y-0.5 py-1 sm:gap-x-5"
      >
        <a href={`mailto:${BEDRIJF.email}`} className={item} title={MAILEN[locale]}>
          <Icoon>
            <Mail className="h-2.5 w-2.5" strokeWidth={2.25} />
          </Icoon>
          {BEDRIJF.email}
        </a>
        <Streep />
        <a href={`tel:${BEDRIJF.telefoonE164}`} className={item} title={BELLEN[locale]}>
          <Icoon>
            <Phone className="h-2.5 w-2.5" strokeWidth={2.25} />
          </Icoon>
          <span className="tabular-nums">{BEDRIJF.telefoon}</span>
        </a>
        <Streep />
        <Link href={ticketHref} prefetch={false} className={`${item} font-medium text-accent hover:text-accent`}>
          <Icoon>
            <TicketPlus className="h-2.5 w-2.5" strokeWidth={2.25} />
          </Icoon>
          <span className="sm:hidden">{t.kort}</span>
          <span className="hidden sm:inline">{t.lang}</span>
        </Link>
      </nav>
    </div>
  );
}
