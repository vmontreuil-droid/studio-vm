import type { Messages } from "./nl";
// Relative import: Playwright loads this file without the @/ path alias.
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "../../tarieven";

const P = euro(UURTARIEF_CENT.vroegtijdig, "en");

const en: Messages = {
  meta: {
    siteName: "Studio VM",
    title: "Machine control 3D models for earthworks | Studio VM",
    description: `Your 2D drawings as 3D terrain models (DTM) for GPS machine control on excavators, graders and dozers: Trimble, Topcon, Leica, Unicontrol. From ${P}/h excl. VAT.`,
    locale: "en_GB",
  },
  nav: {
    werk: "Work",
    mogelijkheden: "Capabilities",
    pricing: "Pricing",
    contact: "Contact",
    search: "Search",
    menu: "Menu",
    over: "About Studio VM",
  },
  aanbod: {
    prijsregel: `From ${P} per hour excl. VAT · ${MINIMUM_UREN}-hour minimum · extra systems free · last-minute within 5 working days`,
  },
  contact: {
    eyebrow: "Contact",
    title: "A project in the pipeline or just a question?",
    intro:
      "Send us a message, or call or email us directly. We usually reply the same day. Already have plans? Request a quote straight away so we can take a look.",
    location: "West Flanders, Belgium",
  },
  contactForm: {
    name: "Name",
    email: "Email",
    subject: "Subject",
    body: "Message",
    namePlaceholder: "John Smith",
    emailPlaceholder: "john@contractor.com",
    subjectPlaceholder: "Earthworks for an industrial site",
    bodyPlaceholder:
      "What kind of project? Which machine control do you use? When do you need the model?",
    submit: "Send message",
    submitting: "Sending...",
    openMail: "Open in mail client",
  },
  footer: {
    tagline: "Studio VM — 3D models for machine control, anywhere in Europe.",
    sections: {
      studio: "Studio",
      diensten: "Services",
      klanten: "For clients",
      over: "About Studio VM",
      legal: "Legal",
    },
    built: "Modelled in Anzegem, delivered across Europe.",
  },
};

export default en;
