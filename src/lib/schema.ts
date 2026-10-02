// ─────────────────────────────────────────────────────────────────────────
// Gestructureerde gegevens (schema.org, JSON-LD) als één @graph per pagina.
//
// Zuivere module zonder JSX: elke pagina stelt haar graph samen met
// graph(siteNodes(l), …) en geeft die aan <JsonLd>.
//
// Regel voor alle koppelingen: elke {"@id"} waarnaar een pagina verwijst,
// moet in dezelfde graph gedefinieerd zijn. Daarom verschijnt
// hasOfferCatalog enkel met { metDienst: true }, samen met dienstNodes().
//
// Prijzen komen uitsluitend uit lib/tarieven. Geen verzonnen beoordelingen,
// klanten, cijfers of onderscheidingen.
// ─────────────────────────────────────────────────────────────────────────

import { SITE, canoniek, HOME_LABEL } from "./seo";
import { BEDRIJF, FUNCTIE } from "./bedrijf";
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "./tarieven";
import { LANDEN } from "./stelsel";
import { getMessages } from "./i18n";
import { LOCALES, type Locale } from "./i18n/config";

export type Node = Record<string, unknown>;

export const ID = {
  org: `${SITE}/#organization`,
  person: `${SITE}/#vincent`,
  website: `${SITE}/#website`,
  logo: `${SITE}/#logo`,
  dienst: `${SITE}/#dienst`,
  tarieven: `${SITE}/#tarieven`,
} as const;

const TALEN: string[] = [...LOCALES];

const CATEGORIEEN = ["vroegtijdig", "normaal", "last-minute"] as const;
type Cat = (typeof CATEGORIEEN)[number];

const tariefId = (c: Cat) => `${SITE}/#tarief-${c}`;

// ── vertalingen ───────────────────────────────────────────────────────────

const SUFFIX: Record<Locale, string> = {
  nl: "per uur, excl. btw",
  fr: "de l'heure, HTVA",
  en: "per hour, excl. VAT",
  de: "pro Stunde, zzgl. MwSt.",
  es: "por hora, IVA no incluido",
};

const KNOWS: Record<Locale, string[]> = {
  nl: [
    "Machinesturing",
    "3D-ontwerpmodellen",
    "Digitaal terreinmodel (TIN)",
    "Breeklijnen",
    "Coördinatenstelsels en hoogtereferenties",
    "Grondverzet",
  ],
  fr: [
    "Guidage d'engins",
    "Modèles 3D de conception",
    "Modèle numérique de terrain (TIN)",
    "Lignes de rupture",
    "Systèmes de coordonnées et références altimétriques",
    "Terrassement",
  ],
  en: [
    "Machine control",
    "3D design models",
    "Digital terrain model (TIN)",
    "Breaklines",
    "Coordinate reference systems and height datums",
    "Earthworks",
  ],
  de: [
    "Maschinensteuerung",
    "3D-Planungsmodelle",
    "Digitales Geländemodell (TIN)",
    "Bruchkanten",
    "Koordinatensysteme und Höhenbezugssysteme",
    "Erdbau",
  ],
  es: [
    "Control de maquinaria",
    "Modelos 3D de proyecto",
    "Modelo digital del terreno (TIN)",
    "Líneas de ruptura",
    "Sistemas de coordenadas y referencias altimétricas",
    "Movimiento de tierras",
  ],
};

const MERKEN = [
  "Trimble",
  "Topcon",
  "Leica Geosystems",
  "Unicontrol",
  "CHCNAV",
  "Komatsu",
  "Caterpillar",
  "LandXML",
  "DXF",
];

const NAAM: Record<Locale, string> = {
  nl: "3D-modellen voor machinesturing",
  fr: "Modèles 3D pour le guidage d'engins",
  en: "3D models for machine control",
  de: "3D-Modelle für Maschinensteuerung",
  es: "Modelos 3D para control de maquinaria",
};

const TYPE: Record<Locale, string> = {
  nl: "3D-ontwerpmodellen voor GPS-machinebesturing",
  fr: "Modèles 3D de conception pour guidage d'engins GPS",
  en: "3D design models for GPS machine control",
  de: "3D-Planungsmodelle für GPS-Maschinensteuerung",
  es: "Modelos 3D de proyecto para control de maquinaria GPS",
};

const DOEL: Record<Locale, string> = {
  nl: "Aannemers in grond-, weg- en waterbouw",
  fr: "Entreprises de terrassement, de voirie et de travaux hydrauliques",
  en: "Earthworks, road and civil engineering contractors",
  de: "Unternehmen im Erd-, Straßen- und Wasserbau",
  es: "Empresas de movimiento de tierras, viales y obra hidráulica",
};

// Letterlijk zoals T[l].cats op de tarievenpagina.
const CAT: Record<Locale, Record<Cat, { titel: string; termijn: string }>> = {
  nl: {
    vroegtijdig: { titel: "Vroegtijdig", termijn: "Meer dan 3 weken op voorhand" },
    normaal: { titel: "Normaal", termijn: "Levering binnen 1 à 3 weken" },
    "last-minute": { titel: "Last-minute", termijn: "Levering binnen 5 werkdagen" },
  },
  fr: {
    vroegtijdig: { titel: "Anticipé", termijn: "Plus de 3 semaines à l'avance" },
    normaal: { titel: "Normal", termijn: "Livraison dans 1 à 3 semaines" },
    "last-minute": { titel: "Urgent", termijn: "Livraison dans les 5 jours ouvrables" },
  },
  en: {
    vroegtijdig: { titel: "Early", termijn: "More than 3 weeks ahead" },
    normaal: { titel: "Standard", termijn: "Delivery within 1 to 3 weeks" },
    "last-minute": { titel: "Last-minute", termijn: "Delivery within 5 working days" },
  },
  de: {
    vroegtijdig: { titel: "Frühzeitig", termijn: "Mehr als 3 Wochen im Voraus" },
    normaal: { titel: "Normal", termijn: "Lieferung innerhalb von 1 bis 3 Wochen" },
    "last-minute": { titel: "Kurzfristig", termijn: "Lieferung innerhalb von 5 Werktagen" },
  },
  es: {
    vroegtijdig: { titel: "Anticipada", termijn: "Con más de 3 semanas de antelación" },
    normaal: { titel: "Normal", termijn: "Entrega en un plazo de 1 a 3 semanas" },
    "last-minute": { titel: "Urgente", termijn: "Entrega en un plazo de 5 días laborables" },
  },
};

const EENHEID: Record<Locale, string> = {
  nl: "uur",
  fr: "heure",
  en: "hour",
  de: "Stunde",
  es: "hora",
};

// ── gedeelde bouwstenen ───────────────────────────────────────────────────

/** De Europese landen waarvoor we werken, met de landnaam in de paginataal. */
function landen(l: Locale): Node[] {
  const namen = new Intl.DisplayNames([l === "en" ? "en-GB" : l], { type: "region" });
  return LANDEN.map((c) => ({ "@type": "Country", name: namen.of(c) ?? c, identifier: c }));
}

function adres(volledig: boolean): Node {
  return {
    "@type": "PostalAddress",
    ...(volledig ? { streetAddress: BEDRIJF.straat, postalCode: BEDRIJF.postcode } : {}),
    addressLocality: BEDRIJF.gemeente,
    addressRegion: BEDRIJF.provincie,
    addressCountry: BEDRIJF.landCode,
  };
}

const isHome = (pad: string) => pad === "" || pad === "/";

// ── site: bedrijf, persoon, website ───────────────────────────────────────

/**
 * De drie vaste knopen van elke pagina: LocalBusiness, Person en WebSite.
 * `metDienst` voegt hasOfferCatalog toe; gebruik het enkel samen met
 * dienstNodes(l) in dezelfde graph.
 */
export function siteNodes(l: Locale, opts?: { metDienst?: boolean }): Node[] {
  const m = getMessages(l);
  const logo = `${SITE}/logo-square-light.png`;

  const bedrijf: Node = {
    "@type": "LocalBusiness",
    "@id": ID.org,
    name: BEDRIJF.naam,
    alternateName: "studio-vm.be",
    legalName: BEDRIJF.houder,
    description: m.meta.description,
    url: `${SITE}/`,
    logo: {
      "@type": "ImageObject",
      "@id": ID.logo,
      url: logo,
      contentUrl: logo,
      width: 2048,
      height: 2048,
      caption: BEDRIJF.naam,
    },
    image: [`${SITE}/${l}/opengraph-image`, { "@id": ID.logo }],
    telephone: BEDRIJF.telefoonE164,
    email: BEDRIJF.email,
    vatID: BEDRIJF.btwCompact,
    // 0208 = Belgisch ondernemingsnummer (KBO) in ISO 6523.
    iso6523Code: `0208:${BEDRIJF.btwCompact.slice(2)}`,
    address: adres(true),
    areaServed: landen(l),
    priceRange: `${euro(UURTARIEF_CENT.vroegtijdig, l)}–${euro(UURTARIEF_CENT["last-minute"], l)} ${SUFFIX[l]}`,
    currenciesAccepted: "EUR",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: BEDRIJF.telefoonE164,
        email: BEDRIJF.email,
        url: `${SITE}/${l}/offerte`,
        availableLanguage: TALEN,
      },
    ],
    founder: { "@id": ID.person },
    knowsAbout: [...KNOWS[l], ...MERKEN],
    knowsLanguage: TALEN,
    ...(opts?.metDienst ? { hasOfferCatalog: { "@id": ID.tarieven } } : {}),
  };

  const persoon: Node = {
    "@type": "Person",
    "@id": ID.person,
    name: BEDRIJF.houder,
    givenName: "Vincent",
    familyName: "Montreuil",
    url: `${SITE}/${l}/over`,
    jobTitle: FUNCTIE[l],
    worksFor: { "@id": ID.org },
    address: adres(false),
    knowsLanguage: TALEN,
    knowsAbout: KNOWS[l],
    sameAs: [BEDRIJF.linkedin],
  };

  const website: Node = {
    "@type": "WebSite",
    "@id": ID.website,
    url: `${SITE}/`,
    name: BEDRIJF.naam,
    alternateName: ["studio-vm.be"],
    description: m.meta.description,
    inLanguage: TALEN,
    publisher: { "@id": ID.org },
  };

  return [bedrijf, persoon, website];
}

// ── dienst + tarieven ─────────────────────────────────────────────────────

/** Service + OfferCatalog met de drie uurtarieven. */
export function dienstNodes(l: Locale): Node[] {
  const m = getMessages(l);

  const dienst: Node = {
    "@type": "Service",
    "@id": ID.dienst,
    name: NAAM[l],
    serviceType: TYPE[l],
    description: m.meta.description,
    provider: { "@id": ID.org },
    areaServed: landen(l),
    audience: { "@type": "BusinessAudience", audienceType: DOEL[l] },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE}/${l}/offerte`,
      servicePhone: {
        "@type": "ContactPoint",
        telephone: BEDRIJF.telefoonE164,
        contactType: "customer service",
      },
      availableLanguage: TALEN,
    },
    termsOfService: `${SITE}/${l}/voorwaarden`,
    hasOfferCatalog: { "@id": ID.tarieven },
    offers: CATEGORIEEN.map((c) => ({ "@id": tariefId(c) })),
  };

  const catalogus: Node = {
    "@type": "OfferCatalog",
    "@id": ID.tarieven,
    name: NAAM[l],
    url: `${SITE}/${l}/tarieven`,
    itemListElement: CATEGORIEEN.map((c) => {
      const prijs = UURTARIEF_CENT[c] / 100;
      return {
        "@type": "Offer",
        "@id": tariefId(c),
        name: `${NAAM[l]} — ${CAT[l][c].titel}`,
        description: CAT[l][c].termijn,
        url: `${SITE}/${l}/tarieven`,
        itemOffered: { "@id": ID.dienst },
        offeredBy: { "@id": ID.org },
        price: prijs,
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: prijs,
          priceCurrency: "EUR",
          unitCode: "HUR",
          unitText: EENHEID[l],
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "HUR" },
          valueAddedTaxIncluded: false,
        },
        eligibleQuantity: { "@type": "QuantitativeValue", minValue: MINIMUM_UREN, unitCode: "HUR" },
      };
    }),
  };

  return [dienst, catalogus];
}

// ── paginaknopen ──────────────────────────────────────────────────────────

/**
 * BreadcrumbList. Home komt er automatisch vooraan bij; `items` zijn de
 * volgende schakels, met hun pad zonder taal.
 */
export function kruimels(
  l: Locale,
  pad: string,
  items: { naam: string; pad: string }[],
): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canoniek(l, pad)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: HOME_LABEL[l], item: `${SITE}/${l}` },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.naam,
        item: canoniek(l, it.pad),
      })),
    ],
  };
}

/**
 * De pagina zelf (WebPage of een subtype). Verwijst naar het kruimelpad
 * `${url}#breadcrumb`, behalve op de startpagina of met metKruimels: false;
 * zet in dat geval kruimels(l, pad, …) mee in de graph.
 */
export function webPagina(
  l: Locale,
  pad: string,
  o: {
    type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";
    naam: string;
    beschrijving: string;
    metKruimels?: boolean;
    about?: string;
    mainEntity?: unknown;
    beeld?: string;
  },
): Node {
  const url = canoniek(l, pad);
  return {
    "@type": o.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: o.naam,
    description: o.beschrijving,
    inLanguage: l,
    isPartOf: { "@id": ID.website },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: o.beeld ?? `${SITE}/${l}/opengraph-image`,
    },
    ...(o.metKruimels === false || isHome(pad) ? {} : { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    ...(o.about ? { about: { "@id": o.about } } : {}),
    ...(o.mainEntity !== undefined ? { mainEntity: o.mainEntity } : {}),
  };
}

/** Kennisartikel. Hoort bij een webPagina met mainEntity `${url}#article`. */
export function artikel(
  l: Locale,
  pad: string,
  o: {
    titel: string;
    beschrijving: string;
    beeld: string;
    gepubliceerd: string;
    bijgewerkt: string;
    sectie: string;
  },
): Node {
  const url = canoniek(l, pad);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: o.titel,
    description: o.beschrijving,
    image: [o.beeld],
    datePublished: o.gepubliceerd,
    dateModified: o.bijgewerkt,
    author: {
      "@type": "Person",
      "@id": ID.person,
      name: BEDRIJF.houder,
      url: `${SITE}/${l}/over`,
    },
    publisher: { "@id": ID.org },
    inLanguage: l,
    articleSection: o.sectie,
    isAccessibleForFree: true,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isPartOf: { "@id": ID.website },
  };
}

/** FAQPage: de pagina zelf, met de vragen als mainEntity. */
export function faqPagina(
  l: Locale,
  pad: string,
  o: { naam: string; beschrijving: string; vragen: { vraag: string; antwoord: string }[] },
): Node {
  return {
    ...webPagina(l, pad, { naam: o.naam, beschrijving: o.beschrijving }),
    "@type": "FAQPage",
    mainEntity: o.vragen.map((v) => ({
      "@type": "Question",
      name: v.vraag,
      acceptedAnswer: { "@type": "Answer", text: v.antwoord },
    })),
  };
}

/** Eenvoudige ItemList, bv. als mainEntity van een overzichtspagina. */
export function itemLijst(items: { url: string; naam: string }[]): Node {
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: x.url,
      name: x.naam,
    })),
  };
}

/** ImageGallery: de pagina zelf, met de beelden als ItemList. */
export function galerij(
  l: Locale,
  pad: string,
  o: {
    naam: string;
    beschrijving: string;
    beelden: { url: string; naam: string; bijschrift: string; trefwoorden: string }[];
  },
): Node {
  return {
    ...webPagina(l, pad, { naam: o.naam, beschrijving: o.beschrijving }),
    "@type": "ImageGallery",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: o.beelden.length,
      itemListElement: o.beelden.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "ImageObject",
          contentUrl: b.url,
          name: b.naam,
          caption: b.bijschrift,
          keywords: b.trefwoorden,
          creator: { "@id": ID.person },
          creditText: BEDRIJF.naam,
          copyrightNotice: `© ${BEDRIJF.naam}`,
        },
      })),
    },
  };
}

/** Voegt knopen (los of in lijsten) samen tot één JSON-LD-document. */
export function graph(...delen: (Node | Node[])[]): Node {
  return { "@context": "https://schema.org", "@graph": delen.flat() };
}
