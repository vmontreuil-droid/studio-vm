import type { Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";

export type ScanRow = {
  token: string;
  url: string;
  scan: ScanResult;
  created_at: string;
};
export type Offer = {
  id: string;
  title: string;
  body: string | null;
  amount_cents: number | null;
  status: string;
  valid_until: string | null;
  created_at: string;
};
export type Invoice = {
  id: string;
  number: string;
  description: string | null;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  pdf_url: string | null;
};
export type Sub = {
  id: string;
  plan: string;
  price_cents: number;
  period: string;
  status: string;
  started_at: string;
};
export type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
};
export type Msg = {
  id: string;
  ticket_id: string;
  sender: string;
  body: string;
  created_at: string;
};

export const eur = (c: number | null | undefined) =>
  c == null ? "—" : `€ ${(c / 100).toFixed(2)}`;

export const dt = (s: string, loc: Locale) =>
  new Date(s).toLocaleDateString(
    loc === "fr" ? "fr-BE" : loc === "en" ? "en-GB" : "nl-BE",
  );

export function badge(status: string): string {
  const m: Record<string, string> = {
    open: "bg-accent/15 text-accent",
    akkoord: "bg-green-500/15 text-green-600 dark:text-green-400",
    betaald: "bg-green-500/15 text-green-600 dark:text-green-400",
    actief: "bg-green-500/15 text-green-600 dark:text-green-400",
    afgewezen: "bg-red-500/15 text-red-500",
    vervallen: "bg-red-500/15 text-red-500",
    gestopt: "bg-red-500/15 text-red-500",
    in_behandeling: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    gepauzeerd: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    gesloten: "bg-muted/15 text-muted",
  };
  return m[status] ?? "bg-muted/15 text-muted";
}

export type PortalCounts = {
  offers: number;
  invoices: number;
  tickets: number;
};

export const PORTAL_T: Record<
  Locale,
  {
    portal: string;
    overview: string;
    scans: string;
    offers: string;
    invoices: string;
    subscription: string;
    tickets: string;
    account: string;
    signout: string;
    website: string;
  }
> = {
  nl: {
    portal: "portaal",
    overview: "Overzicht",
    scans: "Mijn scans",
    offers: "Offertes",
    invoices: "Facturen",
    subscription: "Abonnement",
    tickets: "Support",
    account: "Account",
    signout: "Uitloggen",
    website: "Naar de website",
  },
  fr: {
    portal: "portail",
    overview: "Aperçu",
    scans: "Mes scans",
    offers: "Devis",
    invoices: "Factures",
    subscription: "Abonnement",
    tickets: "Support",
    account: "Compte",
    signout: "Déconnexion",
    website: "Vers le site",
  },
  en: {
    portal: "portal",
    overview: "Overview",
    scans: "My scans",
    offers: "Quotes",
    invoices: "Invoices",
    subscription: "Subscription",
    tickets: "Support",
    account: "Account",
    signout: "Sign out",
    website: "To the website",
  },
};
