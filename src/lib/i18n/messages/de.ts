import type { Messages } from "./nl";
// Relativ importieren: Playwright lädt diese Datei ohne den @/-Pfad.
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "../../tarieven";

const P = euro(UURTARIEF_CENT.vroegtijdig, "de");

const de: Messages = {
  meta: {
    siteName: "Studio VM",
    title: "3D-Modelle für Maschinensteuerung im Erdbau | Studio VM",
    description: `Ihre 2D-Pläne als Geländemodell (DGM, Bruchkanten) für die Maschinensteuerung von Bagger, Grader und Raupe: Trimble, Topcon, Leica. Ab ${P}/Std. zzgl. MwSt.`,
    locale: "de_DE",
  },
  nav: {
    werk: "Referenzen",
    mogelijkheden: "Leistungen",
    pricing: "Preise",
    contact: "Kontakt",
    search: "Suche",
    menu: "Menü",
    over: "Über Studio VM",
  },
  aanbod: {
    prijsregel: `Ab ${P} pro Stunde zzgl. MwSt. · mindestens ${MINIMUM_UREN} Stunde · weitere Systeme gratis · kurzfristig innerhalb von 5 Werktagen`,
  },
  contact: {
    eyebrow: "Kontakt",
    title: "Ein Projekt in Planung oder einfach eine Frage?",
    intro:
      "Schreiben Sie uns eine Nachricht, oder rufen Sie uns an bzw. mailen Sie uns direkt. Wir antworten meist noch am selben Tag. Liegen Ihnen bereits Pläne vor? Fordern Sie direkt ein Angebot an, dann sehen wir sie uns an.",
    location: "Westflandern, Belgien",
  },
  contactForm: {
    name: "Name",
    email: "E-Mail",
    subject: "Betreff",
    body: "Nachricht",
    namePlaceholder: "Max Mustermann",
    emailPlaceholder: "max@tiefbau-firma.de",
    subjectPlaceholder: "Erdarbeiten für ein Gewerbegebiet",
    bodyPlaceholder:
      "Um welches Projekt geht es? Welche Maschinensteuerung verwenden Sie? Bis wann benötigen Sie das Modell?",
    submit: "Nachricht senden",
    submitting: "Wird gesendet...",
    openMail: "Im E-Mail-Programm öffnen",
  },
  footer: {
    tagline: "Studio VM — 3D-Modelle für Maschinensteuerung, überall in Europa.",
    sections: {
      studio: "Studio",
      diensten: "Leistungen",
      klanten: "Für Kunden",
      over: "Über Studio VM",
      legal: "Rechtliches",
    },
    built: "Modelliert in Anzegem, geliefert in ganz Europa.",
  },
};

export default de;
