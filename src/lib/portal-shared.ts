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
  offer_no: string | null;
  title: string;
  body: string | null;
  amount_cents: number | null;
  status: string;
  valid_until: string | null;
  items:
    | { label: string; desc?: string; cents: number; kind?: string }[]
    | null;
  vat_reverse: boolean | null;
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
export type Site = {
  id: string;
  name: string;
  url: string | null;
  status: string;
  last_deploy: string | null;
  repo_url: string | null;
  notes: string | null;
  domain: string | null;
  registrar: string | null;
  domain_renewal: string | null;
  hosting: string | null;
  dns_note: string | null;
  created_at: string;
};
export type Progress = {
  client_email: string;
  step: string;
  note: string | null;
  updated_at: string;
};
export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  sort: number;
};
export type DocItem = {
  id: string;
  name: string;
  url: string;
  kind: string;
  created_at: string;
};
export const PROGRESS_STEPS = [
  "briefing",
  "ontwerp",
  "bouw",
  "online",
  "nazorg",
] as const;

export const eur = (c: number | null | undefined) =>
  c == null ? "—" : `€ ${(c / 100).toFixed(2)}`;

export const dt = (s: string, loc: Locale) =>
  new Date(s).toLocaleDateString(
    loc === "fr"
      ? "fr-BE"
      : loc === "en"
        ? "en-GB"
        : loc === "de"
          ? "de-DE"
          : loc === "es"
            ? "es-ES"
            : "nl-BE",
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

const STATUS_LABEL: Record<string, Record<Locale, string>> = {
  open: { nl: "open", fr: "ouvert", en: "open", de: "offen", es: "abierto" },
  akkoord: { nl: "akkoord", fr: "accepté", en: "accepted", de: "angenommen", es: "aceptado" },
  afgewezen: { nl: "afgewezen", fr: "refusé", en: "declined", de: "abgelehnt", es: "rechazado" },
  betaald: { nl: "betaald", fr: "payé", en: "paid", de: "bezahlt", es: "pagado" },
  vervallen: { nl: "vervallen", fr: "échu", en: "overdue", de: "überfällig", es: "vencido" },
  actief: { nl: "actief", fr: "actif", en: "active", de: "aktiv", es: "activo" },
  gepauzeerd: { nl: "gepauzeerd", fr: "en pause", en: "paused", de: "pausiert", es: "en pausa" },
  gestopt: { nl: "gestopt", fr: "arrêté", en: "stopped", de: "beendet", es: "detenido" },
  gesloten: { nl: "gesloten", fr: "fermé", en: "closed", de: "geschlossen", es: "cerrado" },
  in_behandeling: {
    nl: "in behandeling",
    fr: "en traitement",
    en: "in progress",
    de: "in Bearbeitung",
    es: "en curso",
  },
  vastgelegd: { nl: "vastgelegd", fr: "verrouillé", en: "locked in", de: "verbindlich", es: "confirmado" },
};

export function statusLabel(status: string, loc: Locale): string {
  return STATUS_LABEL[status]?.[loc] ?? status.replace(/_/g, " ");
}

export type PortalCounts = {
  projecten?: number;
  offers: number;
  invoices: number;
  tickets: number;
  /** Tickets met een nog niet gelezen antwoord van de studio (migratie 0049; anders 0). */
  ticketsOngelezen?: number;
  sites: number; // aantal actieve site-abonnementen (= sites toegelaten)
};

/** "1 nieuw antwoord" / "3 nieuwe antwoorden" — voor de groene teller en het overzicht. */
export function nieuweAntwoorden(n: number, loc: Locale): string {
  const een = n === 1;
  const w: Record<Locale, string> = {
    nl: een ? "nieuw antwoord" : "nieuwe antwoorden",
    fr: een ? "nouvelle réponse" : "nouvelles réponses",
    en: een ? "new reply" : "new replies",
    de: een ? "neue Antwort" : "neue Antworten",
    es: een ? "nueva respuesta" : "nuevas respuestas",
  };
  return `${n} ${w[loc]}`;
}

// Labels voor het klantenportaal (3D-modellen voor machinesturing).
// scans / subscription / mywebsite / progress / checklist / domain zijn
// restanten uit de websiteperiode: niet meer in het portaalmenu, enkel
// bewaard zodat het type stabiel blijft.
export const PORTAL_T: Record<
  Locale,
  {
    portal: string;
    overview: string;
    scans: string;
    offers: string;
    invoices: string;
    subscription: string;
    payments: string;
    mywebsite: string;
    progress: string;
    checklist: string;
    documents: string;
    appointment: string;
    domain: string;
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
    payments: "Betalingen",
    mywebsite: "Mijn website",
    progress: "Voortgang",
    checklist: "Checklist",
    documents: "Documenten",
    appointment: "Afspraak",
    domain: "Domein & hosting",
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
    payments: "Paiements",
    mywebsite: "Mon site",
    progress: "Avancement",
    checklist: "Checklist",
    documents: "Documents",
    appointment: "Rendez-vous",
    domain: "Domaine & hébergement",
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
    payments: "Payments",
    mywebsite: "My website",
    progress: "Progress",
    checklist: "Checklist",
    documents: "Documents",
    appointment: "Appointment",
    domain: "Domain & hosting",
    tickets: "Support",
    account: "Account",
    signout: "Sign out",
    website: "To the website",
  },
  de: {
    portal: "Portal",
    overview: "Übersicht",
    scans: "Meine Scans",
    offers: "Angebote",
    invoices: "Rechnungen",
    subscription: "Abonnement",
    payments: "Zahlungen",
    mywebsite: "Meine Website",
    progress: "Fortschritt",
    checklist: "Checkliste",
    documents: "Dokumente",
    appointment: "Termin",
    domain: "Domain & Hosting",
    tickets: "Support",
    account: "Konto",
    signout: "Abmelden",
    website: "Zur Website",
  },
  es: {
    portal: "portal",
    overview: "Resumen",
    scans: "Mis análisis",
    offers: "Presupuestos",
    invoices: "Facturas",
    subscription: "Suscripción",
    payments: "Pagos",
    mywebsite: "Mi sitio web",
    progress: "Progreso",
    checklist: "Lista de verificación",
    documents: "Documentos",
    appointment: "Cita",
    domain: "Dominio y alojamiento",
    tickets: "Soporte",
    account: "Cuenta",
    signout: "Cerrar sesión",
    website: "Ir al sitio web",
  },
};
