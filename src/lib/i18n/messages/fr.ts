import type { Messages } from "./nl";
// Relatief importeren: Playwright laadt dit bestand zonder het @/-pad.
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "../../tarieven";

const P = euro(UURTARIEF_CENT.vroegtijdig, "fr");

const fr: Messages = {
  meta: {
    siteName: "Studio VM",
    title: "Modèles 3D pour le guidage d'engins GPS | Studio VM",
    description: `Vos plans 2D en modèle numérique de terrain (MNT) pour le guidage de votre pelle, niveleuse ou bouteur GPS : Trimble, Topcon, Leica, Unicontrol. Dès ${P}/h HTVA.`,
    locale: "fr_BE",
  },
  nav: {
    werk: "Réalisations",
    mogelijkheden: "Capacités",
    pricing: "Tarifs",
    contact: "Contact",
    search: "Recherche",
    menu: "Menu",
    over: "À propos de Studio VM",
  },
  aanbod: {
    prijsregel: `Dès ${P} de l'heure HTVA · minimum ${MINIMUM_UREN} heure · systèmes supplémentaires gratuits · urgent sous 5 jours ouvrables`,
  },
  contact: {
    eyebrow: "Contact",
    title: "Un projet en préparation ou simplement une question ?",
    intro:
      "Envoyez-nous un message, ou appelez-nous ou écrivez-nous directement. Nous répondons en général le jour même. Vous avez déjà des plans ? Demandez directement un devis pour que nous puissions les examiner.",
    location: "Flandre-Occidentale, Belgique",
  },
  contactForm: {
    name: "Nom",
    email: "E-mail",
    subject: "Objet",
    body: "Message",
    namePlaceholder: "Jean Dupont",
    emailPlaceholder: "jean@entreprise.be",
    subjectPlaceholder: "Terrassement zone d'activité Namur",
    bodyPlaceholder:
      "Quel type de projet ? Quel système de guidage utilisez-vous ? Pour quand vous faut-il le modèle ?",
    submit: "Envoyer le message",
    submitting: "Envoi...",
    openMail: "Ouvrir dans le client mail",
  },
  footer: {
    tagline: "Studio VM — modèles 3D pour le guidage d'engins, partout en Europe.",
    sections: {
      studio: "Studio",
      diensten: "Services",
      klanten: "Espace clients",
      over: "À propos de Studio VM",
      legal: "Mentions légales",
    },
    built: "Modélisé à Anzegem, livré dans toute l'Europe.",
  },
};

export default fr;
