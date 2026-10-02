// Relatief importeren: Playwright (e2e/i18n-parity.spec.ts) laadt dit bestand
// zonder het @/-pad.
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "../../tarieven";

const P = euro(UURTARIEF_CENT.vroegtijdig, "nl");

const nl = {
  meta: {
    siteName: "Studio VM",
    title: "3D-modellen voor GPS-machinebesturing | Studio VM",
    description: `Uw 2D-plannen als 3D-model voor uw GPS-gestuurde kraan, grader of dozer: Trimble, Topcon, Leica, Unicontrol en meer. Vanaf ${P} per uur excl. btw.`,
    locale: "nl_BE",
  },
  nav: {
    werk: "Realisaties",
    mogelijkheden: "Mogelijkheden",
    pricing: "Pricing",
    contact: "Contact",
    search: "Zoek",
    menu: "Menu",
    over: "Over Studio VM",
  },
  aanbod: {
    prijsregel: `Vanaf ${P} per uur excl. btw · minimum ${MINIMUM_UREN} uur · extra systemen gratis · last-minute binnen 5 werkdagen`,
  },
  contact: {
    eyebrow: "Contact",
    title: "Een project in voorbereiding of gewoon een vraag?",
    intro:
      "Stuur ons een bericht, of bel of mail rechtstreeks. We antwoorden meestal dezelfde dag. Hebt u al plannen? Vraag dan meteen een offerte aan, dan kunnen we ze bekijken.",
    location: "West-Vlaanderen, België",
  },
  contactForm: {
    name: "Naam",
    email: "E-mail",
    subject: "Onderwerp",
    body: "Bericht",
    namePlaceholder: "Jan Peeters",
    emailPlaceholder: "jan@bouwbedrijf.be",
    subjectPlaceholder: "Grondwerk bedrijfsterrein Kortrijk",
    bodyPlaceholder:
      "Wat voor project? Welke machinesturing gebruikt u? Tegen wanneer hebt u het model nodig?",
    submit: "Verstuur bericht",
    submitting: "Verzenden...",
    openMail: "Open in mail-client",
  },
  footer: {
    tagline: "Studio VM — 3D-modellen voor machinesturing, overal in Europa.",
    sections: {
      studio: "Studio",
      diensten: "Diensten",
      klanten: "Voor klanten",
      over: "Over Studio VM",
      legal: "Juridisch",
    },
    built: "Gemodelleerd in Anzegem, geleverd in heel Europa.",
  },
};

export default nl;
export type Messages = typeof nl;
