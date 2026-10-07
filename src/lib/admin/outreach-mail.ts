// Outreach-mail van Studio VM — naar aannemers, ontwerpers (architecten en
// studiebureaus) en landmeters.
//
// Vincent (4/10): geen persoonsnaam, geen merk of "op uw website zag ik",
// algemeen gehouden, met logo en in de huisstijl — "echt mooi". Dus: dezelfde
// lichte kaart als de klantmails (lib/email.ts), het vm.-wordmerk, een groot
// projectbeeld, vinkjes, de systemen als labels, de drie tarieven als
// kaartjes en een amberkleurige knop. De mail spreekt als "Studio VM" (wij).
//
// Beelden staan als JPG in /public/mail (geen WebP: Outlook en een deel van
// de mailprogramma's tonen dat niet). Talen: nl / fr / en / de. Elke mail
// heeft een afmeldlink en een wettelijke voet uit de bedrijfsinstellingen.

import type { OutreachConfig } from "@/lib/admin/outreach";
import type { CompanySettings } from "@/lib/admin/settings";
import { siteUrl } from "@/lib/supabase/config";
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "@/lib/tarieven";
import { BEDRIJF } from "@/lib/bedrijf";
import type { Doelgroep, MailTaal, ProspectLand, Signalen } from "@/lib/admin/aannemers";

export type OutreachProspect = {
  land: ProspectLand;
  website: string | null;
  /** Niet meer gebruikt in de tekst (de mail blijft algemeen); blijft voor de bestaande aanroepen. */
  signalen: Signalen | null;
  /** Token voor de afmeldlink (prospect_outreach.scan_token). */
  token: string;
  /** Uit de NACE-code (doelgroepVoorNace); zonder: aannemer. */
  doelgroep?: Doelgroep;
};

/** Gegevens voor de wettelijke voet — uit de bedrijfsinstellingen. */
export type MailBedrijf = {
  naam: string;
  adres: string | null;
  btw: string | null;
  email: string | null;
  website: string;
};

export function bedrijfVoorMail(s: Pick<CompanySettings, "address" | "vat_number" | "email" | "website">): MailBedrijf {
  return {
    // Handelsnaam — bewust vast, ook als de juridische naam anders is.
    naam: "Studio VM",
    adres: s.address?.trim() || null,
    btw: s.vat_number?.trim() || null,
    email: s.email?.trim() || null,
    website: (s.website || siteUrl || "https://www.studio-vm.be").replace(/\/$/, ""),
  };
}

export type OutreachMail = {
  subject: string;
  html: string;
  text: string;
  from: string;
};

const BASE = () => (process.env.NEXT_PUBLIC_SITE_URL || siteUrl || "https://www.studio-vm.be").replace(/\/$/, "");

function prijs(cat: keyof typeof UURTARIEF_CENT, lang: MailTaal): string {
  return euro(UURTARIEF_CENT[cat], lang);
}

// Het stelsel van het land van de klant (Vincent, 4/10): Belgische klanten
// enkel Lambert 72 met TAW-hoogtes; elk ander land zijn eigen stelsel. NL, DE
// en LU staan er al voor wanneer die landen bij de outreach komen.
const STELSEL: Record<string, Record<MailTaal, string>> = {
  be: {
    nl: "Lambert 72, TAW-hoogtes",
    fr: "Lambert 72, altitudes DNG",
    en: "Belgian Lambert 72, TAW heights",
    de: "Lambert 72, Höhen TAW/DNG",
  },
  fr: {
    nl: "Lambert-93 of CC-zones, NGF-IGN69-hoogtes",
    fr: "Lambert-93 ou zones CC, altitudes NGF-IGN69",
    en: "Lambert-93 or CC zones, NGF-IGN69 heights",
    de: "Lambert-93 oder CC-Zonen, Höhen NGF-IGN69",
  },
  nl: {
    nl: "RD (Rijksdriehoeksstelsel), NAP-hoogtes",
    fr: "RD (Rijksdriehoeksstelsel), altitudes NAP",
    en: "Dutch RD grid, NAP heights",
    de: "RD (Rijksdriehoeksstelsel), Höhen NAP",
  },
  de: {
    nl: "ETRS89/UTM, DHHN2016-hoogtes",
    fr: "ETRS89/UTM, altitudes DHHN2016",
    en: "ETRS89/UTM, DHHN2016 heights",
    de: "ETRS89/UTM, Höhen DHHN2016 (NHN)",
  },
  lu: {
    nl: "LUREF, NG95-hoogtes",
    fr: "LUREF, altitudes NG95",
    en: "LUREF, NG95 heights",
    de: "LUREF, Höhen NG95",
  },
  uk: {
    nl: "British National Grid, ODN-hoogtes",
    fr: "British National Grid, altitudes ODN",
    en: "British National Grid, ODN heights",
    de: "British National Grid, Höhen ODN",
  },
};

function stelselVoorbeeld(land: ProspectLand | string, lang: MailTaal): string {
  return (STELSEL[land] ?? STELSEL.be!)[lang];
}

const LAND_NAAM: Record<MailTaal, string> = { nl: "België", fr: "Belgique", en: "Belgium", de: "Belgien" };

const SYSTEMEN = ["Trimble", "Topcon", "Leica", "Unicontrol", "CHCNAV", "Komatsu", "Caterpillar"];

// ─────────────────────────────────────────────────────────────────────
// Teksten
// ─────────────────────────────────────────────────────────────────────

/** Vaste delen per taal (prijs, knoppen, groet, voet). */
type Vast = {
  greeting: string;
  systemenKop: string;
  prijsKop: string;
  tarieven: [string, string, string];
  perUur: string;
  prijsVoet: string;
  ctaOfferte: string;
  ctaVoorbeelden: string;
  meerKop: string;
  antwoord: string;
  followupStop: string;
  signOff: string;
  ondertitel: string;
  afmelden: string;
  btwLabel: string;
  beeldBijschrift: Record<Doelgroep, string>;
};

/** Per doelgroep en taal: de boodschap. */
type Boodschap = {
  subject: string;
  eyebrow: string;
  titel: string;
  intro: string;
  watKop: string;
  wat: (stelsel: string) => string[];
  followup: string[];
  waarom: string;
};

const VAST: Record<MailTaal, Vast> = {
  nl: {
    greeting: "Goedendag,",
    systemenKop: "Voor elk systeem",
    prijsKop: "Transparant uurtarief, excl. btw",
    tarieven: ["Meer dan 3 weken vooraf", "Normaal", "Last-minute"],
    perUur: "/u",
    prijsVoet: `Minimum ${MINIMUM_UREN} uur. U krijgt eerst een offerte met het geschatte aantal uren.`,
    ctaOfferte: "Vraag een offerte aan",
    ctaVoorbeelden: "Bekijk onze realisaties",
    meerKop: "Uit onze realisaties",
    antwoord: "Of antwoord gewoon op deze mail, met uw plannen in bijlage.",
    followupStop: "Geen interesse? Laat het ons gerust weten, dan hoort u niets meer van ons.",
    signOff: "Met vriendelijke groeten,",
    ondertitel: "3D-modellen voor machinesturing",
    afmelden: "afmelden",
    btwLabel: "btw",
    beeldBijschrift: {
      aannemer: "Rotonde · 3D-model op de luchtfoto",
      ontwerper: "Funderingen voor drie gebouwen · 3D-model op de luchtfoto",
      landmeter: "Ronde bouwput · 3D-model op de luchtfoto",
    },
  },
  fr: {
    greeting: "Bonjour,",
    systemenKop: "Pour chaque système",
    prijsKop: "Tarif horaire transparent, HTVA",
    tarieven: ["Plus de 3 semaines à l'avance", "Normal", "Urgence"],
    perUur: "/h",
    prijsVoet: `Minimum ${MINIMUM_UREN} heure. Vous recevez d'abord un devis avec le nombre d'heures estimé.`,
    ctaOfferte: "Demander un devis",
    ctaVoorbeelden: "Voir nos réalisations",
    meerKop: "Quelques réalisations",
    antwoord: "Ou répondez simplement à ce mail, avec vos plans en pièce jointe.",
    followupStop: "Pas intéressé ? Dites-le-nous simplement, vous n'aurez plus de nouvelles de notre part.",
    signOff: "Bien cordialement,",
    ondertitel: "Modèles 3D pour le guidage d'engins",
    afmelden: "se désinscrire",
    btwLabel: "TVA",
    beeldBijschrift: {
      aannemer: "Giratoire · modèle 3D sur photo aérienne",
      ontwerper: "Fondations pour trois bâtiments · modèle 3D sur photo aérienne",
      landmeter: "Fouille circulaire · modèle 3D sur photo aérienne",
    },
  },
  en: {
    greeting: "Hello,",
    systemenKop: "For every system",
    prijsKop: "Transparent hourly rate, excl. VAT",
    tarieven: ["More than 3 weeks ahead", "Standard", "Last-minute"],
    perUur: "/h",
    prijsVoet: `Minimum ${MINIMUM_UREN} hour. You get a quote with the estimated hours first.`,
    ctaOfferte: "Request a quote",
    ctaVoorbeelden: "See our projects",
    meerKop: "From our projects",
    antwoord: "Or simply reply to this email with your drawings attached.",
    followupStop: "Not interested? Just let us know and you won't hear from us again.",
    signOff: "Kind regards,",
    ondertitel: "3D models for machine control",
    afmelden: "unsubscribe",
    btwLabel: "VAT",
    beeldBijschrift: {
      aannemer: "Roundabout · 3D model on the aerial photo",
      ontwerper: "Foundations for three buildings · 3D model on the aerial photo",
      landmeter: "Circular excavation · 3D model on the aerial photo",
    },
  },
  de: {
    greeting: "Guten Tag,",
    systemenKop: "Für jedes System",
    prijsKop: "Transparenter Stundensatz, zzgl. MwSt.",
    tarieven: ["Mehr als 3 Wochen im Voraus", "Regulär", "Kurzfristig"],
    perUur: "/h",
    prijsVoet: `Mindestens ${MINIMUM_UREN} Stunde. Sie erhalten vorab ein Angebot mit der geschätzten Stundenzahl.`,
    ctaOfferte: "Angebot anfordern",
    ctaVoorbeelden: "Unsere Projekte ansehen",
    meerKop: "Aus unseren Projekten",
    antwoord: "Oder antworten Sie einfach auf diese E-Mail und senden Sie Ihre Pläne mit.",
    followupStop: "Kein Interesse? Sagen Sie uns einfach Bescheid, dann hören Sie nichts mehr von uns.",
    signOff: "Mit freundlichen Grüßen",
    ondertitel: "3D-Modelle für Maschinensteuerung",
    afmelden: "abmelden",
    btwLabel: "USt-IdNr.",
    beeldBijschrift: {
      aannemer: "Kreisverkehr · 3D-Modell auf dem Luftbild",
      ontwerper: "Fundamente für drei Gebäude · 3D-Modell auf dem Luftbild",
      landmeter: "Runde Baugrube · 3D-Modell auf dem Luftbild",
    },
  },
};

const BOODSCHAP: Record<Doelgroep, Record<MailTaal, Boodschap>> = {
  aannemer: {
    nl: {
      subject: "3D-modellen voor uw machinesturing",
      eyebrow: "3D-modellen voor machinesturing",
      titel: "Uw plannen als 3D-model, klaar voor de machine",
      intro:
        "Studio VM maakt 3D-ontwerpmodellen voor machinesturing. Van uw plannen (PDF, DWG of profielen) naar een model dat uw graafmachine, grader of dozer meteen kan inladen: zonder piketten, rechtstreeks op hoogte.",
      watKop: "Wat u krijgt",
      wat: (st) => [
        "ontwerpoppervlak, lijnwerk en hoogtelijnen, klaar om in te laden",
        `in het coördinatenstelsel en de hoogtereferentie van uw werf (${st})`,
        "voor elk systeem in het juiste formaat, meerdere systemen zonder meerprijs",
        "snelle levering, ook last-minute binnen 5 werkdagen",
      ],
      followup: [
        "Een korte opvolging van onze vorige mail over 3D-modellen voor machinesturing.",
        `Staat er binnenkort een werf gepland waarvoor u een model nodig heeft? Stuur gerust de plannen door: u krijgt eerst een offerte met het geschatte aantal uren, pas daarna beginnen we eraan. Hoe vroeger u aanvraagt, hoe voordeliger (${prijs("vroegtijdig", "nl")}/u vanaf 3 weken op voorhand).`,
      ],
      waarom:
        "U ontvangt deze e-mail omdat uw bedrijf actief is in grond-, weg- of waterbouw. Liever geen e-mails meer? Afmelden met één klik:",
    },
    fr: {
      subject: "Modèles 3D pour votre guidage d'engins",
      eyebrow: "Modèles 3D pour le guidage d'engins",
      titel: "Vos plans en modèle 3D, prêts pour la machine",
      intro:
        "Studio VM réalise des modèles 3D de conception pour le guidage d'engins. De vos plans (PDF, DWG ou profils) à un modèle que votre pelle, niveleuse ou bouteur charge directement : sans piquets, directement à la bonne cote.",
      watKop: "Ce que vous recevez",
      wat: (st) => [
        "surface de conception, lignes et courbes de niveau, prêtes à charger",
        `dans le système de coordonnées et la référence altimétrique de votre chantier (${st})`,
        "pour chaque système au bon format, plusieurs systèmes sans supplément",
        "livraison rapide, y compris en urgence sous 5 jours ouvrables",
      ],
      followup: [
        "Un petit suivi de notre précédent message au sujet des modèles 3D pour le guidage d'engins.",
        `Avez-vous bientôt un chantier pour lequel il vous faut un modèle ? Envoyez-nous simplement les plans : vous recevez d'abord un devis avec le nombre d'heures estimé, nous ne commençons qu'après. Plus vous demandez tôt, plus c'est avantageux (${prijs("vroegtijdig", "fr")}/h à partir de 3 semaines à l'avance).`,
      ],
      waarom:
        "Vous recevez cet e-mail car votre entreprise est active en terrassement, voirie ou génie civil. Vous ne souhaitez plus recevoir d'e-mails ? Désinscription en un clic :",
    },
    en: {
      subject: "3D models for your machine control",
      eyebrow: "3D models for machine control",
      titel: "Your drawings as a 3D model, ready for the machine",
      intro:
        "Studio VM builds 3D design models for machine control. From your drawings (PDF, DWG or sections) to a model your excavator, grader or dozer can load straight away: no pegs, straight to level.",
      watKop: "What you get",
      wat: (st) => [
        "design surface, linework and contours, ready to load",
        `in the coordinate system and height datum of your site (${st})`,
        "for every system in the right format, several systems at no extra cost",
        "fast delivery, including last-minute within 5 working days",
      ],
      followup: [
        "A short follow-up to our previous email about 3D models for machine control.",
        `Do you have a site coming up that needs a model? Just send us the drawings: you get a quote with the estimated hours first, and we only start after that. The earlier you ask, the better the rate (${prijs("vroegtijdig", "en")}/h from 3 weeks ahead).`,
      ],
      waarom:
        "You are receiving this email because your company works in earthworks, roads or civil engineering. Prefer not to hear from us? Unsubscribe in one click:",
    },
    de: {
      subject: "3D-Modelle für Ihre Maschinensteuerung",
      eyebrow: "3D-Modelle für Maschinensteuerung",
      titel: "Ihre Pläne als 3D-Modell, bereit für die Maschine",
      intro:
        "Studio VM erstellt 3D-Planungsmodelle für Maschinensteuerungen. Aus Ihren Plänen (PDF, DWG oder Profile) ein Modell, das Ihr Bagger, Grader oder Dozer direkt laden kann: ohne Pflöcke, direkt auf Höhe.",
      watKop: "Was Sie erhalten",
      wat: (st) => [
        "Planungsoberfläche, Linien und Höhenlinien, fertig zum Laden",
        `im Koordinatensystem und Höhenbezug Ihrer Baustelle (${st})`,
        "für jedes System im passenden Format, mehrere Systeme ohne Aufpreis",
        "schnelle Lieferung, auch kurzfristig innerhalb von 5 Werktagen",
      ],
      followup: [
        "eine kurze Nachfrage zu unserer letzten E-Mail über 3D-Modelle für Maschinensteuerungen.",
        `Steht bald eine Baustelle an, für die Sie ein Modell brauchen? Senden Sie uns einfach die Pläne: Sie erhalten zuerst ein Angebot mit der geschätzten Stundenzahl, erst danach fangen wir an. Je früher Sie anfragen, desto günstiger (${prijs("vroegtijdig", "de")}/h ab 3 Wochen im Voraus).`,
      ],
      waarom:
        "Sie erhalten diese E-Mail, weil Ihr Unternehmen im Erd-, Straßen- oder Tiefbau tätig ist. Keine E-Mails mehr erwünscht? Mit einem Klick abmelden:",
    },
  },
  ontwerper: {
    nl: {
      subject: "Uw ontwerp, klaar voor de machine van de aannemer",
      eyebrow: "Voor architecten en studiebureaus",
      titel: "Uw ontwerp als 3D-model voor de machine",
      intro:
        "Steeds meer aannemers werken met machinesturing en vragen een 3D-model van het ontwerp. Studio VM maakt dat model uit uw plannen (PDF, DWG, profielen of LandXML), voor u of rechtstreeks voor de aannemer. Zo komt uw ontwerp exact zo op de werf.",
      watKop: "Wat u (of de aannemer) krijgt",
      wat: (st) => [
        "het ontwerpoppervlak, lijnwerk en hoogtelijnen, rechtstreeks uit uw plannen",
        `in het coördinatenstelsel en de hoogtereferentie van de werf (${st})`,
        "voor elk systeem dat de aannemer gebruikt, zonder meerprijs",
        "een controle van het ontwerp: tegenstrijdige hoogtes of ontbrekende profielen melden we vóór de werf start",
      ],
      followup: [
        "Een korte opvolging van onze vorige mail over 3D-modellen van uw ontwerpen.",
        "Vraagt een aannemer binnenkort een 3D-model van een van uw ontwerpen? Verwijs hem gerust naar ons door, of stuur zelf de plannen: u krijgt eerst een offerte met het geschatte aantal uren, pas daarna beginnen we eraan.",
      ],
      waarom:
        "U ontvangt deze e-mail omdat uw bureau actief is als architect of studiebureau. Liever geen e-mails meer? Afmelden met één klik:",
    },
    fr: {
      subject: "Votre projet, prêt pour la machine de l'entrepreneur",
      eyebrow: "Pour architectes et bureaux d'études",
      titel: "Votre projet en modèle 3D pour la machine",
      intro:
        "De plus en plus d'entrepreneurs travaillent avec le guidage d'engins et demandent un modèle 3D du projet. Studio VM réalise ce modèle depuis vos plans (PDF, DWG, profils ou LandXML), pour vous ou directement pour l'entrepreneur. Votre projet arrive ainsi tel quel sur le chantier.",
      watKop: "Ce que vous (ou l'entrepreneur) recevez",
      wat: (st) => [
        "la surface de projet, les lignes et courbes de niveau, directement depuis vos plans",
        `dans le système de coordonnées et la référence altimétrique du chantier (${st})`,
        "pour chaque système utilisé par l'entrepreneur, sans supplément",
        "un contrôle du projet : nous signalons les altitudes contradictoires ou les profils manquants avant le début du chantier",
      ],
      followup: [
        "Un petit suivi de notre précédent message au sujet des modèles 3D de vos projets.",
        "Un entrepreneur vous demande bientôt un modèle 3D d'un de vos projets ? Orientez-le simplement vers nous, ou envoyez-nous les plans : vous recevez d'abord un devis avec le nombre d'heures estimé, nous ne commençons qu'après.",
      ],
      waarom:
        "Vous recevez cet e-mail car votre bureau est actif en architecture ou en bureau d'études. Vous ne souhaitez plus recevoir d'e-mails ? Désinscription en un clic :",
    },
    en: {
      subject: "Your design, ready for the contractor's machine",
      eyebrow: "For architects and engineering practices",
      titel: "Your design as a 3D model for the machine",
      intro:
        "More and more contractors use machine control and ask for a 3D model of the design. Studio VM builds that model from your drawings (PDF, DWG, sections or LandXML), for you or directly for the contractor, so your design reaches the site exactly as drawn.",
      watKop: "What you (or the contractor) get",
      wat: (st) => [
        "the design surface, linework and contours, straight from your drawings",
        `in the coordinate system and height datum of the site (${st})`,
        "for every system the contractor uses, at no extra cost",
        "a check of the design: we flag conflicting levels or missing sections before the works start",
      ],
      followup: [
        "A short follow-up to our previous email about 3D models of your designs.",
        "Will a contractor soon ask you for a 3D model of one of your designs? Feel free to refer them to us, or send us the drawings: you get a quote with the estimated hours first, and we only start after that.",
      ],
      waarom:
        "You are receiving this email because your practice works in architecture or engineering design. Prefer not to hear from us? Unsubscribe in one click:",
    },
    de: {
      subject: "Ihre Planung, bereit für die Maschine des Bauunternehmens",
      eyebrow: "Für Architekten und Planungsbüros",
      titel: "Ihre Planung als 3D-Modell für die Maschine",
      intro:
        "Immer mehr Bauunternehmen arbeiten mit Maschinensteuerung und fragen nach einem 3D-Modell der Planung. Studio VM erstellt dieses Modell aus Ihren Plänen (PDF, DWG, Profile oder LandXML), für Sie oder direkt für das Bauunternehmen. So kommt Ihre Planung genau so auf die Baustelle.",
      watKop: "Was Sie (oder das Bauunternehmen) erhalten",
      wat: (st) => [
        "Planungsoberfläche, Linien und Höhenlinien, direkt aus Ihren Plänen",
        `im Koordinatensystem und Höhenbezug der Baustelle (${st})`,
        "für jedes System des Bauunternehmens, ohne Aufpreis",
        "eine Prüfung der Planung: Widersprüchliche Höhen oder fehlende Profile melden wir vor Baubeginn",
      ],
      followup: [
        "eine kurze Nachfrage zu unserer letzten E-Mail über 3D-Modelle Ihrer Planungen.",
        "Fragt ein Bauunternehmen bald nach einem 3D-Modell einer Ihrer Planungen? Verweisen Sie es gern an uns, oder senden Sie uns die Pläne: Sie erhalten zuerst ein Angebot mit der geschätzten Stundenzahl, erst danach fangen wir an.",
      ],
      waarom:
        "Sie erhalten diese E-Mail, weil Ihr Büro in Architektur oder Ingenieurplanung tätig ist. Keine E-Mails mehr erwünscht? Mit einem Klick abmelden:",
    },
  },
  landmeter: {
    nl: {
      subject: "Te veel werk? Wij maken uw 3D-modellen voor machinesturing",
      eyebrow: "Voor landmeters",
      titel: "Uw 3D-modellen, gemaakt wanneer het druk is",
      intro:
        "Vragen uw klanten 3D-modellen voor hun machines en ontbreekt de tijd? Studio VM maakt ze voor u, als onderaannemer en discreet onder uw eigen naam. U houdt de klant, wij doen het tekenwerk.",
      watKop: "Wat u krijgt",
      wat: (st) => [
        "het 3D-model uit de plannen van het studiebureau: oppervlak, lijnwerk en hoogtelijnen",
        `in het stelsel en de hoogtereferentie van de werf (${st}), aansluitend op uw eigen meting`,
        "voor elk systeem, zonder meerprijs",
        "discreet: u levert het model aan uw klant, onder uw eigen naam",
      ],
      followup: [
        "Een korte opvolging van onze vorige mail over 3D-modellen voor machinesturing.",
        "Loopt het werk binnenkort hoog op? Stuur gerust de plannen van een werf door: u krijgt eerst een offerte met het geschatte aantal uren, pas daarna beginnen we eraan.",
      ],
      waarom:
        "U ontvangt deze e-mail omdat uw bureau actief is als landmeter. Liever geen e-mails meer? Afmelden met één klik:",
    },
    fr: {
      subject: "Trop de travail ? Nous réalisons vos modèles 3D pour le guidage d'engins",
      eyebrow: "Pour les géomètres",
      titel: "Vos modèles 3D, réalisés quand le travail s'accumule",
      intro:
        "Vos clients demandent des modèles 3D pour leurs machines et le temps manque ? Studio VM les réalise pour vous, en sous-traitance et en toute discrétion, sous votre propre nom. Vous gardez le client, nous faisons le dessin.",
      watKop: "Ce que vous recevez",
      wat: (st) => [
        "le modèle 3D depuis les plans du bureau d'études : surface, lignes et courbes de niveau",
        `dans le système et la référence altimétrique du chantier (${st}), raccordé à vos propres mesures`,
        "pour chaque système, sans supplément",
        "en toute discrétion : vous livrez le modèle à votre client, sous votre propre nom",
      ],
      followup: [
        "Un petit suivi de notre précédent message au sujet des modèles 3D pour le guidage d'engins.",
        "Votre charge de travail augmente bientôt ? Envoyez-nous simplement les plans d'un chantier : vous recevez d'abord un devis avec le nombre d'heures estimé, nous ne commençons qu'après.",
      ],
      waarom:
        "Vous recevez cet e-mail car votre bureau est actif comme géomètre. Vous ne souhaitez plus recevoir d'e-mails ? Désinscription en un clic :",
    },
    en: {
      subject: "Too much work? We'll build your machine control models",
      eyebrow: "For surveying practices",
      titel: "Your 3D models, built when work piles up",
      intro:
        "Clients asking for 3D models for their machines and short on time? Studio VM builds them for you, as a subcontractor and discreetly under your own name. You keep the client, we do the drafting.",
      watKop: "What you get",
      wat: (st) => [
        "the 3D model from the designer's drawings: surface, linework and contours",
        `in the site's coordinate system and height datum (${st}), tied to your own survey`,
        "for every system, at no extra cost",
        "discreet: you deliver the model to your client, under your own name",
      ],
      followup: [
        "A short follow-up to our previous email about 3D models for machine control.",
        "Busy period coming up? Just send us the drawings for a site: you get a quote with the estimated hours first, and we only start after that.",
      ],
      waarom:
        "You are receiving this email because your practice works in surveying. Prefer not to hear from us? Unsubscribe in one click:",
    },
    de: {
      subject: "Zu viel Arbeit? Wir erstellen Ihre 3D-Modelle für Maschinensteuerungen",
      eyebrow: "Für Vermessungsbüros",
      titel: "Ihre 3D-Modelle, erstellt wenn es eng wird",
      intro:
        "Ihre Kunden fragen nach 3D-Modellen für ihre Maschinen und die Zeit fehlt? Studio VM erstellt sie für Sie, als Subunternehmer und diskret unter Ihrem eigenen Namen. Sie behalten den Kunden, wir übernehmen das Zeichnen.",
      watKop: "Was Sie erhalten",
      wat: (st) => [
        "das 3D-Modell aus den Plänen des Planungsbüros: Oberfläche, Linien und Höhenlinien",
        `im Koordinatensystem und Höhenbezug der Baustelle (${st}), angeschlossen an Ihre eigene Vermessung`,
        "für jedes System, ohne Aufpreis",
        "diskret: Sie liefern das Modell unter Ihrem eigenen Namen an Ihren Kunden",
      ],
      followup: [
        "eine kurze Nachfrage zu unserer letzten E-Mail über 3D-Modelle für Maschinensteuerungen.",
        "Steht bald viel Arbeit an? Senden Sie uns einfach die Pläne einer Baustelle: Sie erhalten zuerst ein Angebot mit der geschätzten Stundenzahl, erst danach fangen wir an.",
      ],
      waarom:
        "Sie erhalten diese E-Mail, weil Ihr Büro im Vermessungswesen tätig ist. Keine E-Mails mehr erwünscht? Mit einem Klick abmelden:",
    },
  },
};

/** Campagnenaam in de UTM: zo zie je per doelgroep wie klikt. */
const CAMPAGNE: Record<Doelgroep, string> = {
  aannemer: "aannemers-3d",
  ontwerper: "ontwerpers-3d",
  landmeter: "landmeters-3d",
};

/**
 * utm_content = variant-taal-code: de code (begin van scan_token) laat de
 * bezoekersteller zien welk bedrijf echt op de site kwam ("warme lead",
 * zie lib/admin/warme-leads). Scanners husselen de waarde en vallen weg.
 */
export const LEAD_CODE_LENGTE = 12;

function utm(url: string, variant: "first" | "followup", lang: MailTaal, doelgroep: Doelgroep, token: string): string {
  const code = token.replace(/[^A-Za-z0-9_-]/g, "").slice(0, LEAD_CODE_LENGTE);
  const q = new URLSearchParams({
    utm_source: "outreach",
    utm_medium: "email",
    utm_campaign: CAMPAGNE[doelgroep],
    utm_content: code ? `${variant}-${lang}-${code}` : `${variant}-${lang}`,
  });
  return `${url}?${q.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────
// Opmaak (zelfde huisstijl als lib/email.ts: lichte kaart, vm.-wordmerk)
// ─────────────────────────────────────────────────────────────────────

const ACCENT = "#e08214";
const INKT = "#1c1917";
const TEKST = "#44403c";
const ZACHT = "#78716c";
const RAND = "#e7e5e4";
const FONT = "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const p = (html: string, extra = "") => `<p style="margin:0 0 18px;font:400 16px/1.7 ${FONT};color:${TEKST}${extra}">${html}</p>`;

function knop(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0;border-collapse:collapse"><tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td bgcolor="${ACCENT}" style="background:${ACCENT};border-radius:10px"><a href="${esc(href)}" style="display:inline-block;padding:17px 38px;font:700 16px/1 ${FONT};color:#ffffff;text-decoration:none">${esc(label)} &nbsp;&rarr;</a></td></tr></table></td></tr></table>`;
}

function vinkjes(regels: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border-collapse:collapse">${regels
    .map(
      (r) =>
        `<tr><td valign="top" width="34" style="padding:0 0 12px"><div style="width:22px;height:22px;border-radius:11px;background:#fff4e6;color:${ACCENT};font:700 13px/22px ${FONT};text-align:center">&#10003;</div></td><td valign="top" style="padding:1px 0 12px;font:400 15px/1.6 ${FONT};color:${TEKST}">${esc(r)}</td></tr>`,
    )
    .join("")}</table>`;
}

function systemen(kop: string): string {
  const labels = SYSTEMEN.map(
    (s) =>
      `<span style="display:inline-block;margin:0 6px 8px 0;padding:6px 11px;border:1px solid ${RAND};border-radius:999px;font:600 12px/1 ${FONT};color:${INKT};white-space:nowrap">${esc(s)}</span>`,
  ).join("");
  return `<p style="margin:0 0 10px;font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${ZACHT}">${esc(kop)}</p><div style="margin:0 0 26px">${labels}</div>`;
}

function tarieven(v: Vast, lang: MailTaal): string {
  const cats = ["vroegtijdig", "normaal", "last-minute"] as const;
  const tegels = cats
    .map((c, i) => {
      const uit = i === 0;
      return `<td class="svm-tegel" width="33%" valign="top" style="padding:0 ${i < 2 ? 8 : 0}px 0 0"><div style="border:${uit ? `2px solid ${ACCENT}` : `1px solid ${RAND}`};background:${uit ? "#fff8ef" : "#ffffff"};border-radius:12px;padding:${uit ? 15 : 16}px 12px;text-align:center"><div style="font:800 24px/1.1 ${FONT};color:${uit ? ACCENT : INKT}">${esc(prijs(c, lang))}<span style="font:600 13px/1 ${FONT};color:${ZACHT}">${esc(v.perUur)}</span></div><div style="margin-top:7px;font:500 12px/1.35 ${FONT};color:${ZACHT}">${esc(v.tarieven[i]!)}</div></div></td>`;
    })
    .join("");
  return `<p style="margin:0 0 10px;font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${ZACHT}">${esc(v.prijsKop)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border-collapse:collapse"><tr>${tegels}</tr></table>
    <p style="margin:0 0 28px;font:400 13px/1.6 ${FONT};color:${ZACHT}">${esc(v.prijsVoet)}</p>`;
}

function strook(base: string, link: string, kop: string): string {
  const beelden = [1, 2, 3]
    .map(
      (n, i) =>
        `<td width="33%" style="padding:0 ${i < 2 ? 6 : 0}px 0 0"><a href="${esc(link)}"><img src="${base}/mail/outreach-project-${n}.jpg" width="168" alt="" style="display:block;width:100%;height:auto;border:0;border-radius:10px"></a></td>`,
    )
    .join("");
  return `<p style="margin:30px 0 10px;font:700 11px/1 ${MONO};letter-spacing:.16em;text-transform:uppercase;color:${ZACHT}">${esc(kop)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${beelden}</tr></table>`;
}

function omhulsel(lang: MailTaal, titel: string, kaart: string, voet: string): string {
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(titel)}</title><style>@media (max-width:520px){.svm-buiten{padding:16px 8px !important}.svm-kaart{padding:28px 20px !important}.svm-tegel{display:block !important;width:100% !important;padding:0 0 8px 0 !important}.svm-titel{font-size:24px !important}}</style></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td class="svm-buiten" align="center" style="padding:40px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse">
  <tr><td class="svm-kaart" style="background:#ffffff;border:1px solid ${RAND};border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);padding:44px 40px">
${kaart}
  </td></tr>
  <tr><td style="padding:22px 6px 0;text-align:center;font:400 11px/1.7 ${FONT};color:#a8a29e">${voet}</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

// ─────────────────────────────────────────────────────────────────────
// De mail
// ─────────────────────────────────────────────────────────────────────

export function buildOutreachMail(
  pr: OutreachProspect,
  cfg: Pick<OutreachConfig, "senderName" | "senderEmail">,
  bedrijf: MailBedrijf,
  lang: MailTaal,
  variant: "first" | "followup" = "first",
): OutreachMail {
  const doelgroep = pr.doelgroep ?? "aannemer";
  const v = VAST[lang] ?? VAST.nl;
  const b = (BOODSCHAP[doelgroep] ?? BOODSCHAP.aannemer)[lang] ?? BOODSCHAP.aannemer.nl;
  const base = BASE();
  const realisaties = utm(`${base}/${lang}/realisaties`, variant, lang, doelgroep, pr.token);
  const offerte = utm(`${base}/${lang}/offerte`, variant, lang, doelgroep, pr.token);
  const unsub = `${base}/api/outreach/unsubscribe?t=${encodeURIComponent(pr.token)}&l=${lang}`;
  const subject = variant === "first" ? b.subject : `Re: ${b.subject}`;
  const dp = lang === "fr" ? " : " : ": ";
  const siteLabel = bedrijf.website.replace(/^https?:\/\//, "").replace(/^www\./, "");

  // Wettelijke voet
  const adres = bedrijf.adres
    ? new RegExp(LAND_NAAM[lang], "i").test(bedrijf.adres) || /belgi/i.test(bedrijf.adres)
      ? bedrijf.adres
      : `${bedrijf.adres}, ${LAND_NAAM[lang]}`
    : null;
  const voetDelen = [bedrijf.naam, adres, bedrijf.btw ? `${v.btwLabel} ${bedrijf.btw}` : null, bedrijf.email].filter(
    (x): x is string => !!x,
  );
  const voetHtml = `${esc(voetDelen.join(" · "))}<br>${esc(b.waarom)} <a href="${esc(unsub)}" style="color:#a8a29e;text-decoration:underline">${esc(v.afmelden)}</a>`;

  const logo = `<p style="margin:0 0 30px;padding:0;font-family:${FONT};font-size:56px;line-height:56px;font-weight:800;letter-spacing:-3.5px;color:${INKT};mso-line-height-rule:exactly">vm<span style="color:${ACCENT}">.</span></p>`;
  const ondertekening = `<p style="margin:30px 0 4px;font:400 15px/1.6 ${FONT};color:${TEKST}">${esc(v.signOff)}</p>
    <p style="margin:0;font:800 17px/1.4 ${FONT};color:${INKT}">Studio VM</p>
    <p style="margin:2px 0 0;font:400 13px/1.6 ${FONT};color:${ZACHT}">${esc(v.ondertitel)} · <a href="tel:${BEDRIJF.telefoonE164}" style="color:${ZACHT};text-decoration:none">${esc(BEDRIJF.telefoon)}</a> · <a href="${esc(bedrijf.website)}" style="color:${ZACHT};text-decoration:none">${esc(siteLabel)}</a></p>`;

  let kaart: string;
  let tekst: string;
  if (variant === "first") {
    const wat = b.wat(stelselVoorbeeld(pr.land, lang));
    kaart = `${logo}
    <p style="margin:0 0 10px;font:700 12px/1.3 ${MONO};letter-spacing:.18em;text-transform:uppercase;color:${ACCENT}">${esc(b.eyebrow)}</p>
    <h1 class="svm-titel" style="margin:0 0 24px;font:800 28px/1.25 ${FONT};letter-spacing:-.5px;color:${INKT}">${esc(b.titel)}</h1>
    <a href="${esc(realisaties)}"><img src="${base}/mail/outreach-${doelgroep}.jpg" width="520" alt="${esc(v.beeldBijschrift[doelgroep])}" style="display:block;width:100%;height:auto;border:0;border-radius:12px"></a>
    <p style="margin:8px 0 26px;font:500 12px/1.4 ${FONT};color:#a8a29e">${esc(v.beeldBijschrift[doelgroep])}</p>
    ${p(esc(v.greeting))}
    ${p(esc(b.intro), ";margin-bottom:26px")}
    <p style="margin:0 0 14px;font:700 17px/1.3 ${FONT};color:${INKT}">${esc(b.watKop)}</p>
    ${vinkjes(wat)}
    ${systemen(v.systemenKop)}
    ${tarieven(v, lang)}
    ${knop(offerte, v.ctaOfferte)}
    <p style="margin:16px 0 0;text-align:center;font:600 14px/1.5 ${FONT}"><a href="${esc(realisaties)}" style="color:${ACCENT};text-decoration:none">${esc(v.ctaVoorbeelden)} &rarr;</a></p>
    ${strook(base, realisaties, v.meerKop)}
    <p style="margin:26px 0 0;font:400 15px/1.7 ${FONT};color:${TEKST}">${esc(v.antwoord)}</p>
    ${ondertekening}`;
    tekst = [
      v.greeting,
      b.titel,
      b.intro,
      `${b.watKop}\n${wat.map((w) => `- ${w}`).join("\n")}`,
      `${v.systemenKop}${dp}${SYSTEMEN.join(", ")}`,
      `${v.prijsKop}\n${(["vroegtijdig", "normaal", "last-minute"] as const).map((c, i) => `- ${v.tarieven[i]}${dp}${prijs(c, lang)}${v.perUur}`).join("\n")}\n${v.prijsVoet}`,
      `${v.ctaOfferte}${dp}${offerte}\n${v.ctaVoorbeelden}${dp}${realisaties}`,
      v.antwoord,
    ].join("\n\n");
  } else {
    kaart = `${logo}
    ${p(esc(v.greeting))}
    ${b.followup.map((f) => p(esc(f))).join("\n    ")}
    ${knop(offerte, v.ctaOfferte)}
    <p style="margin:16px 0 0;text-align:center;font:600 14px/1.5 ${FONT}"><a href="${esc(realisaties)}" style="color:${ACCENT};text-decoration:none">${esc(v.ctaVoorbeelden)} &rarr;</a></p>
    <p style="margin:26px 0 0;font:400 14px/1.6 ${FONT};color:${ZACHT}">${esc(v.followupStop)}</p>
    ${ondertekening}`;
    tekst = [
      v.greeting,
      ...b.followup,
      `${v.ctaOfferte}${dp}${offerte}\n${v.ctaVoorbeelden}${dp}${realisaties}`,
      v.followupStop,
    ].join("\n\n");
  }

  const ondertekeningTekst = `${v.signOff}\nStudio VM\n${v.ondertitel} · ${BEDRIJF.telefoon} · ${siteLabel}`;
  return {
    subject,
    html: omhulsel(lang, subject, kaart, voetHtml),
    text: `${tekst}\n\n${ondertekeningTekst}\n\n--\n${voetDelen.join(" · ")}\n${b.waarom} ${unsub}\n`,
    // Geen persoonsnaam als afzender (Vincent, 4/10): de mail komt van Studio VM.
    from: `Studio VM <${cfg.senderEmail}>`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Voorbeeldmails — voor /admin/mail-preview en de testmail-knop.
// Fictieve bedrijven, nooit een echte prospect.
// ─────────────────────────────────────────────────────────────────────

export type OutreachSample = {
  id: string;
  title: string;
  mail: OutreachMail;
};

type SampleDef = { key: string; label: string; lang: MailTaal; land: ProspectLand; doelgroep: Doelgroep };

const SAMPLE_DEFS: SampleDef[] = [
  { key: "nl", label: "NL — aannemer", lang: "nl", land: "be", doelgroep: "aannemer" },
  { key: "fr", label: "FR — entrepreneur (Wallonie)", lang: "fr", land: "be", doelgroep: "aannemer" },
  { key: "en", label: "EN — contractor (UK)", lang: "en", land: "uk", doelgroep: "aannemer" },
  { key: "de", label: "DE — Bauunternehmen (Ostbelgien)", lang: "de", land: "be", doelgroep: "aannemer" },
  { key: "nl-ontwerper", label: "NL — architect of studiebureau", lang: "nl", land: "be", doelgroep: "ontwerper" },
  { key: "fr-ontwerper", label: "FR — architecte ou bureau d'études", lang: "fr", land: "be", doelgroep: "ontwerper" },
  { key: "nl-landmeter", label: "NL — landmeter", lang: "nl", land: "be", doelgroep: "landmeter" },
  { key: "fr-landmeter", label: "FR — géomètre", lang: "fr", land: "be", doelgroep: "landmeter" },
];

export function buildOutreachSamples(
  cfg: Pick<OutreachConfig, "senderName" | "senderEmail">,
  bedrijf: MailBedrijf,
): OutreachSample[] {
  const out: OutreachSample[] = [];
  for (const d of SAMPLE_DEFS) {
    for (const variant of ["first", "followup"] as const) {
      out.push({
        id: `outreach-${variant}-${d.key}`,
        title: `${variant === "first" ? "Eerste mail" : "Opvolgmail"} · ${d.label}`,
        mail: buildOutreachMail(
          { land: d.land, website: null, signalen: null, token: "voorbeeld-token", doelgroep: d.doelgroep },
          cfg,
          bedrijf,
          d.lang,
          variant,
        ),
      });
    }
  }
  return out;
}
