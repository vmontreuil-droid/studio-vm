import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n/config";
import { ogBeeld as merkOgBeeld, type PaginaSleutel } from "./social/paginakaart";

// Het eindadres van de site: studio-vm.be stuurt door naar www, dus
// canonieke en hreflang-adressen wijzen rechtstreeks naar www.
export const SITE = "https://www.studio-vm.be";

/**
 * Canoniek adres van een pagina. `pad` zonder taal, met voorloop-slash
 * (of "" / "/" voor de startpagina).
 */
export function canoniek(locale: Locale, pad: string): string {
  return `${SITE}/${locale}${pad === "/" ? "" : pad}`;
}

/**
 * hreflang-varianten voor een pagina die in alle talen bestaat, plus
 * x-default. x-default wijst naar het Engels: de meeste landen die we
 * bedienen spreken geen van de vijf sitetalen.
 */
export function taalVarianten(pad: string): Record<string, string> {
  const p = pad === "/" ? "" : pad;
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE}/${l}${p}`])),
    "x-default": `${SITE}/en${p}`,
  };
}

/** Canoniek adres + hreflang-varianten, klaar voor `alternates`. */
export function talen(
  locale: Locale,
  pad: string,
): { canonical: string; languages: Record<string, string> } {
  return { canonical: canoniek(locale, pad), languages: taalVarianten(pad) };
}

/** og:locale per taal. */
export const OG_LOCALE: Record<Locale, string> = {
  nl: "nl_BE",
  fr: "fr_BE",
  en: "en_GB",
  de: "de_DE",
  es: "es_ES",
};

/** Alt-tekst van de standaard OG-kaart per taal. */
export const OG_ALT: Record<Locale, string> = {
  nl: "3D-modellen voor machinesturing — Studio VM",
  fr: "Modèles 3D pour le guidage d'engins — Studio VM",
  en: "3D models for machine control — Studio VM",
  de: "3D-Modelle für Maschinensteuerung — Studio VM",
  es: "Modelos 3D para control de maquinaria — Studio VM",
};

/** Eerste schakel van elk kruimelpad. */
export const HOME_LABEL: Record<Locale, string> = {
  nl: "Home",
  fr: "Accueil",
  en: "Home",
  de: "Startseite",
  es: "Inicio",
};

export type KruimelPad =
  | "/3d-modellen"
  | "/realisaties"
  | "/tarieven"
  | "/offerte"
  | "/kennis"
  | "/over"
  | "/voorwaarden"
  | "/privacy"
  | "/cookies";

/** Kruimelpad-labels per pagina en taal (zichtbaar én in BreadcrumbList). */
export const KRUIMEL: Record<KruimelPad, Record<Locale, string>> = {
  "/3d-modellen": {
    nl: "3D-modellen",
    fr: "Modèles 3D",
    en: "3D models",
    de: "3D-Modelle",
    es: "Modelos 3D",
  },
  "/realisaties": {
    nl: "Realisaties",
    fr: "Réalisations",
    en: "Projects",
    de: "Referenzen",
    es: "Proyectos realizados",
  },
  "/tarieven": {
    nl: "Tarieven",
    fr: "Tarifs",
    en: "Rates",
    de: "Preise",
    es: "Tarifas",
  },
  "/offerte": {
    nl: "Offerte aanvragen",
    fr: "Demander un devis",
    en: "Request a quote",
    de: "Angebot anfordern",
    es: "Solicitar presupuesto",
  },
  "/kennis": {
    nl: "Kennisbank",
    fr: "Base de connaissances",
    en: "Knowledge base",
    de: "Wissensdatenbank",
    es: "Base de conocimiento",
  },
  "/over": {
    nl: "Over Studio VM",
    fr: "À propos de Studio VM",
    en: "About Studio VM",
    de: "Über Studio VM",
    es: "Sobre Studio VM",
  },
  "/voorwaarden": {
    nl: "Algemene voorwaarden",
    fr: "Conditions générales",
    en: "Terms and conditions",
    de: "Allgemeine Geschäftsbedingungen",
    es: "Condiciones generales",
  },
  "/privacy": {
    nl: "Privacyverklaring",
    fr: "Déclaration de confidentialité",
    en: "Privacy statement",
    de: "Datenschutzerklärung",
    es: "Declaración de privacidad",
  },
  "/cookies": {
    nl: "Cookieverklaring",
    fr: "Déclaration relative aux cookies",
    en: "Cookie statement",
    de: "Cookie-Erklärung",
    es: "Declaración de cookies",
  },
};

/**
 * Deelbeeld (og:image) van een pagina: JPEG 1200×630 met een echte render,
 * op /beeld/og/… met ?v=<inhoudshash>. Zie src/lib/social/paginakaart.ts.
 */
export function ogBeeld(locale: Locale, pagina: PaginaSleutel): { url: string; alt: string } {
  return merkOgBeeld(locale, pagina);
}

export type PaginaMetaOpties = {
  /** De VOLLEDIGE titel zoals hij getoond wordt, inclusief " | Studio VM". */
  title: string;
  description: string;
  type?: "website" | "article";
  /** Eigen deelbeeld (1200×630); zonder: de merkkaart van de startpagina. */
  ogBeeld?: { url: string; alt: string };
  robots?: Metadata["robots"];
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Volledige metadata van een publieke pagina: titel, beschrijving, canoniek
 * + hreflang, Open Graph en Twitter.
 *
 * De afbeelding staat er altijd expliciet in: een openGraph op paginaniveau
 * vervangt die van de layout volledig, en zou anders ook het
 * opengraph-image-bestand van [locale] laten vallen.
 * Twitter krijgt enkel de kaartsoort; titel, beschrijving en beeld vult Next
 * zelf aan uit openGraph.
 */
export function paginaMeta(locale: Locale, pad: string, o: PaginaMetaOpties): Metadata {
  const beeld = o.ogBeeld ?? ogBeeld(locale, "home");
  const basis = {
    url: canoniek(locale, pad),
    title: o.title,
    description: o.description,
    siteName: "Studio VM",
    locale: OG_LOCALE[locale],
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    images: [
      {
        url: beeld.url,
        width: 1200,
        height: 630,
        alt: beeld.alt,
        // Merkkaarten zijn JPEG; oudere opengraph-image-adressen ook.
        type: "image/jpeg",
      },
    ],
  };

  const openGraph: NonNullable<Metadata["openGraph"]> =
    o.type === "article"
      ? {
          type: "article",
          ...basis,
          publishedTime: o.publishedTime,
          modifiedTime: o.modifiedTime,
          authors: [`${SITE}/${locale}/over`],
        }
      : { type: "website", ...basis };

  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: talen(locale, pad),
    openGraph,
    twitter: { card: "summary_large_image" },
    ...(o.robots ? { robots: o.robots } : {}),
  };
}
