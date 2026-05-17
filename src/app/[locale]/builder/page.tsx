"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { submitBuild } from "@/app/actions/build-lead";
import { saveDesign } from "@/app/actions/builder-designs";
import { useParams } from "next/navigation";
import {
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Copy,
  Send,
  ArrowRight,
  Palette,
  Layers,
  Type,
  ImagePlus,
  Loader2,
  Check,
  Pencil,
  ChevronDown,
  MapPin,
  Clock,
  Monitor,
  Smartphone,
  RotateCcw,
} from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type SectionKind =
  | "hero"
  | "features"
  | "steps"
  | "team"
  | "logos"
  | "about"
  | "stats"
  | "testimonials"
  | "pricing"
  | "gallery"
  | "faq"
  | "pricelist"
  | "hours"
  | "map"
  | "richtext"
  | "banner"
  | "newsletter"
  | "cta"
  | "footer"
  | "contact";

type SectionData = Record<string, unknown>;
type Section = { id: string; kind: SectionKind; data: SectionData };
type Page = { id: string; name: string; sections: Section[] };

const PG: Record<
  Locale,
  {
    panel: string;
    add: string;
    name: string;
    del: string;
    menuHint: string;
  }
> = {
  nl: {
    panel: "Pagina's & menu",
    add: "Nieuwe pagina",
    name: "Paginanaam",
    del: "Verwijder pagina",
    menuHint: "Dit wordt je navigatiemenu — sleep met de pijltjes.",
  },
  fr: {
    panel: "Pages & menu",
    add: "Nouvelle page",
    name: "Nom de la page",
    del: "Supprimer la page",
    menuHint: "Ceci devient votre menu de navigation — réordonnez avec les flèches.",
  },
  en: {
    panel: "Pages & menu",
    add: "New page",
    name: "Page name",
    del: "Delete page",
    menuHint: "This becomes your navigation menu — reorder with the arrows.",
  },
};

type Theme = { slug: string; bg: string; fg: string; accent: string };

const themes: Theme[] = [
  { slug: "warm", bg: "#fafaf9", fg: "#1c1917", accent: "#b45309" },
  { slug: "cool", bg: "#f8fafc", fg: "#0f172a", accent: "#0ea5e9" },
  { slug: "bos", bg: "#f7faf6", fg: "#14271d", accent: "#15803d" },
  { slug: "noir", bg: "#0c0a09", fg: "#fafaf9", accent: "#f59e0b" },
  { slug: "zee", bg: "#f0fdfa", fg: "#0f2e2a", accent: "#0d9488" },
  { slug: "roze", bg: "#fff1f5", fg: "#3f1320", accent: "#e11d48" },
  { slug: "mono", bg: "#fafafa", fg: "#171717", accent: "#525252" },
  { slug: "paars", bg: "#faf5ff", fg: "#2b1147", accent: "#7c3aed" },
];

const sectionKinds: SectionKind[] = [
  "hero",
  "features",
  "steps",
  "team",
  "logos",
  "about",
  "stats",
  "testimonials",
  "pricing",
  "gallery",
  "faq",
  "pricelist",
  "hours",
  "map",
  "richtext",
  "banner",
  "newsletter",
  "cta",
  "footer",
  "contact",
];

const fontStacks = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'Cascadia Code', Menlo, monospace",
  display: "'Trebuchet MS', 'Segoe UI', sans-serif",
} as const;
type FontKey = keyof typeof fontStacks;

const radiusPx = { strak: "2px", zacht: "12px", rond: "24px" } as const;
type RadiusKey = keyof typeof radiusPx;

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    panelTheme: string;
    bizName: string;
    themeLabels: Record<string, string>;
    panelSections: string;
    sectionLabels: Record<SectionKind, string>;
    add: string;
    panelReady: string;
    readyText: string;
    emptyPreview: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    panelStyle: string;
    taglineLabel: string;
    fontLabel: string;
    fonts: { sans: string; serif: string; mono: string; display: string };
    radiusLabel: string;
    radii: { strak: string; zacht: string; rond: string };
    dup: string;
    edit: string;
    addItem: string;
    colorsLabel: string;
    colorBg: string;
    colorFg: string;
    colorAccent: string;
    imagesLabel: string;
    uploadHint: string;
    buildEmail: string;
    buildSite: string;
    buildSiteNote: string;
    buildSend: string;
    buildSending: string;
    buildSent: string;
    buildErr: string;
    fields: Record<string, string>;
    preview: {
      welcome: string;
      tagline: string;
      discover: string;
      featuresTitle: string;
      feature: string;
      featureDesc: string;
      testiTitle: string;
      testi: { q: string; w: string }[];
      pricingTitle: string;
      tiers: { n: string; p: string }[];
      perMonth: string;
      galleryTitle: string;
      contactTitle: string;
      name: string;
      email: string;
      message: string;
      send: string;
      aboutTitle: string;
      aboutText: string;
      statsTitle: string;
      statsItems: { v: string; l: string }[];
      faqTitle: string;
      faqs: { q: string; a: string }[];
      ctaTitle2: string;
      ctaText2: string;
      ctaBtn2: string;
      pricelistTitle: string;
      hoursTitle: string;
      mapTitle: string;
      hoursSeed: { day: string; time: string }[];
      priceSeed: { name: string; price: string; desc: string }[];
    };
  }
> = {
  nl: {
    eyebrow: "Builder",
    title: "Bouw je eigen site, tot in detail.",
    intro:
      "Kies een thema, voeg secties toe en vul je eigen teksten in. Wat je hier maakt, komt volledig in mijn admin — ik geef het de finishing touch en zet 'm live.",
    panelTheme: "Naam + thema",
    bizName: "Zaak-naam",
    themeLabels: { warm: "Warm", cool: "Koel", bos: "Bos", noir: "Noir", zee: "Zee", roze: "Roze", mono: "Mono", paars: "Paars" },
    panelSections: "Secties & inhoud",
    sectionLabels: { hero: "Hero", features: "Features", steps: "Werkwijze", team: "Team", logos: "Klanten", about: "Over ons", stats: "Cijfers", testimonials: "Testimonials", pricing: "Pricing", gallery: "Galerij", faq: "FAQ", pricelist: "Prijslijst", hours: "Openingsuren", map: "Kaart", richtext: "Tekstblok", banner: "Aankondiging", newsletter: "Nieuwsbrief", cta: "Oproep", footer: "Footer", contact: "Contact" },
    add: "Voeg toe",
    panelReady: "Klaar?",
    readyText:
      "Stuur je volledige ontwerp door — alle teksten en de opbouw komen in mijn admin. Ik werk het uit tot een echte site.",
    emptyPreview: "Begin met een sectie toe te voegen.",
    ctaTitle: "Liever ineens samen ontwerpen?",
    ctaText:
      "De builder geeft je volledige controle. Wil je sparren over strategie en design? Bekijk de pakketten.",
    ctaButton: "Bekijk pakketten",
    panelStyle: "Stijl",
    taglineLabel: "Slogan / tagline",
    fontLabel: "Lettertype",
    fonts: { sans: "Modern", serif: "Klassiek", mono: "Technisch", display: "Karakter" },
    radiusLabel: "Hoeken",
    radii: { strak: "Strak", zacht: "Zacht", rond: "Rond" },
    dup: "Dupliceer",
    edit: "Bewerk inhoud",
    addItem: "Item toevoegen",
    colorsLabel: "Eigen kleuren",
    colorBg: "Achtergrond",
    colorFg: "Tekst",
    colorAccent: "Accent",
    imagesLabel: "Afbeeldingen",
    uploadHint: "Sleep of kies foto's — verschijnen in galerij & 'over ons'.",
    buildEmail: "Je e-mail",
    buildSite: "Je huidige website (optioneel)",
    buildSiteNote:
      "Vul je dit in, dan scannen we je huidige site automatisch zodat we je beter van dienst kunnen zijn.",
    buildSend: "Stuur naar Studio VM",
    buildSending: "Versturen…",
    buildSent: "Top! Je volledige ontwerp staat in mijn admin — ik werk het voor je uit.",
    buildErr: "Versturen mislukte. Probeer opnieuw of mail rechtstreeks.",
    fields: {
      eyebrow: "Boventitel",
      heading: "Titel",
      sub: "Ondertekst",
      button: "Knoptekst",
      title: "Titel",
      text: "Tekst",
      itemTitle: "Titel",
      itemDesc: "Omschrijving",
      value: "Cijfer",
      label: "Label",
      quote: "Citaat",
      who: "Wie",
      name: "Naam",
      price: "Prijs",
      per: "Periode",
      q: "Vraag",
      a: "Antwoord",
      emailAddr: "E-mailadres",
      phone: "Telefoon",
      address: "Adres",
      day: "Dag",
      time: "Uren",
    },
    preview: {
      welcome: "Welkom bij",
      tagline: "Een tagline die uitlegt wat je doet.",
      discover: "Ontdek meer",
      featuresTitle: "Wat je krijgt",
      feature: "Feature",
      featureDesc: "Een korte uitleg waarom dit nuttig is.",
      testiTitle: "Wat klanten zeggen",
      testi: [{ q: "Eindelijk een site die snel laadt.", w: "Sophie, restaurant" }, { q: "Mijn klanten vinden 't direct.", w: "Pieter, fotograaf" }],
      pricingTitle: "Tarieven",
      tiers: [{ n: "Basis", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/maand",
      galleryTitle: "Galerij",
      contactTitle: "Contact",
      name: "Je naam",
      email: "E-mail",
      message: "Je bericht",
      send: "Verstuur",
      aboutTitle: "Over ons",
      aboutText:
        "Vertel hier kort je verhaal: wie je bent, waar je voor staat en waarom klanten bij jou moeten zijn.",
      statsTitle: "In cijfers",
      statsItems: [
        { v: "10+", l: "jaar ervaring" },
        { v: "250", l: "tevreden klanten" },
        { v: "24/7", l: "bereikbaar" },
      ],
      faqTitle: "Veelgestelde vragen",
      faqs: [
        { q: "Hoe snel kan ik starten?", a: "Meestal binnen enkele dagen." },
        { q: "Wat kost het?", a: "Een eerlijke vaste prijs, vooraf bepaald." },
      ],
      ctaTitle2: "Klaar om te beginnen?",
      ctaText2: "Eén klik en we plannen een vrijblijvend gesprek.",
      ctaBtn2: "Neem contact op",
      pricelistTitle: "Prijslijst",
      hoursTitle: "Openingsuren",
      mapTitle: "Waar je ons vindt",
      hoursSeed: [
        { day: "Maandag–Vrijdag", time: "9:00 – 17:00" },
        { day: "Zaterdag", time: "Op afspraak" },
        { day: "Zondag", time: "Gesloten" },
      ],
      priceSeed: [
        { name: "Dienst of product", price: "€ 0", desc: "Korte omschrijving." },
        { name: "Tweede item", price: "€ 0", desc: "Korte omschrijving." },
      ],
    },
  },
  fr: {
    eyebrow: "Builder",
    title: "Construisez votre site, dans le détail.",
    intro:
      "Choisissez un thème, ajoutez des sections et saisissez vos propres textes. Tout ce que vous créez ici arrive dans mon admin — je le finalise et le mets en ligne.",
    panelTheme: "Nom + thème",
    bizName: "Nom de l'activité",
    themeLabels: { warm: "Chaud", cool: "Frais", bos: "Forêt", noir: "Noir", zee: "Mer", roze: "Rose", mono: "Mono", paars: "Violet" },
    panelSections: "Sections & contenu",
    sectionLabels: { hero: "Hero", features: "Atouts", steps: "Méthode", team: "Équipe", logos: "Clients", about: "À propos", stats: "Chiffres", testimonials: "Témoignages", pricing: "Tarifs", gallery: "Galerie", faq: "FAQ", pricelist: "Tarifs liste", hours: "Horaires", map: "Carte", richtext: "Texte", banner: "Annonce", newsletter: "Newsletter", cta: "Appel", footer: "Pied de page", contact: "Contact" },
    add: "Ajouter",
    panelReady: "Prêt ?",
    readyText:
      "Envoyez votre design complet — tous les textes et la structure arrivent dans mon admin. Je le finalise en vrai site.",
    emptyPreview: "Commencez par ajouter une section.",
    ctaTitle: "Plutôt concevoir ensemble ?",
    ctaText:
      "Le builder vous donne le contrôle total. Envie d'échanger sur la stratégie et le design ? Voir les forfaits.",
    ctaButton: "Voir les forfaits",
    panelStyle: "Style",
    taglineLabel: "Slogan / accroche",
    fontLabel: "Police",
    fonts: { sans: "Moderne", serif: "Classique", mono: "Technique", display: "Caractère" },
    radiusLabel: "Coins",
    radii: { strak: "Net", zacht: "Doux", rond: "Rond" },
    dup: "Dupliquer",
    edit: "Modifier le contenu",
    addItem: "Ajouter un élément",
    colorsLabel: "Couleurs perso",
    colorBg: "Fond",
    colorFg: "Texte",
    colorAccent: "Accent",
    imagesLabel: "Images",
    uploadHint: "Glissez ou choisissez des photos — visibles dans galerie & à-propos.",
    buildEmail: "Votre e-mail",
    buildSite: "Votre site actuel (facultatif)",
    buildSiteNote:
      "Si vous le renseignez, nous scannons automatiquement votre site actuel pour mieux vous servir.",
    buildSend: "Envoyer à Studio VM",
    buildSending: "Envoi…",
    buildSent: "Super ! Votre design complet est dans mon admin — je le finalise.",
    buildErr: "Échec de l'envoi. Réessayez ou écrivez-moi directement.",
    fields: {
      eyebrow: "Sur-titre",
      heading: "Titre",
      sub: "Sous-texte",
      button: "Texte du bouton",
      title: "Titre",
      text: "Texte",
      itemTitle: "Titre",
      itemDesc: "Description",
      value: "Chiffre",
      label: "Libellé",
      quote: "Citation",
      who: "Qui",
      name: "Nom",
      price: "Prix",
      per: "Période",
      q: "Question",
      a: "Réponse",
      emailAddr: "Adresse e-mail",
      phone: "Téléphone",
      address: "Adresse",
      day: "Jour",
      time: "Heures",
    },
    preview: {
      welcome: "Bienvenue chez",
      tagline: "Une accroche qui explique ce que vous faites.",
      discover: "Découvrir",
      featuresTitle: "Ce que vous obtenez",
      feature: "Atout",
      featureDesc: "Une courte explication de l'utilité.",
      testiTitle: "Ce que disent les clients",
      testi: [{ q: "Enfin un site qui charge vite.", w: "Sophie, restaurant" }, { q: "Mes clients trouvent tout de suite.", w: "Pieter, photographe" }],
      pricingTitle: "Tarifs",
      tiers: [{ n: "Base", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/mois",
      galleryTitle: "Galerie",
      contactTitle: "Contact",
      name: "Votre nom",
      email: "E-mail",
      message: "Votre message",
      send: "Envoyer",
      aboutTitle: "À propos",
      aboutText:
        "Racontez votre histoire en bref : qui vous êtes, vos valeurs et pourquoi vous choisir.",
      statsTitle: "En chiffres",
      statsItems: [
        { v: "10+", l: "ans d'expérience" },
        { v: "250", l: "clients satisfaits" },
        { v: "24/7", l: "joignable" },
      ],
      faqTitle: "Questions fréquentes",
      faqs: [
        { q: "Quand puis-je démarrer ?", a: "En général sous quelques jours." },
        { q: "Quel est le prix ?", a: "Un prix fixe et honnête, défini à l'avance." },
      ],
      ctaTitle2: "Prêt à commencer ?",
      ctaText2: "Un clic et on planifie un échange sans engagement.",
      ctaBtn2: "Contactez-nous",
      pricelistTitle: "Tarifs",
      hoursTitle: "Horaires",
      mapTitle: "Où nous trouver",
      hoursSeed: [
        { day: "Lundi–Vendredi", time: "9:00 – 17:00" },
        { day: "Samedi", time: "Sur rendez-vous" },
        { day: "Dimanche", time: "Fermé" },
      ],
      priceSeed: [
        { name: "Service ou produit", price: "€ 0", desc: "Brève description." },
        { name: "Deuxième élément", price: "€ 0", desc: "Brève description." },
      ],
    },
  },
  en: {
    eyebrow: "Builder",
    title: "Build your own site, down to the detail.",
    intro:
      "Pick a theme, add sections and fill in your own copy. Everything you make here lands in my admin — I give it the finishing touch and put it live.",
    panelTheme: "Name + theme",
    bizName: "Business name",
    themeLabels: { warm: "Warm", cool: "Cool", bos: "Forest", noir: "Noir", zee: "Sea", roze: "Rose", mono: "Mono", paars: "Purple" },
    panelSections: "Sections & content",
    sectionLabels: { hero: "Hero", features: "Features", steps: "Process", team: "Team", logos: "Clients", about: "About", stats: "Stats", testimonials: "Testimonials", pricing: "Pricing", gallery: "Gallery", faq: "FAQ", pricelist: "Price list", hours: "Opening hours", map: "Map", richtext: "Text", banner: "Announcement", newsletter: "Newsletter", cta: "Call-out", footer: "Footer", contact: "Contact" },
    add: "Add",
    panelReady: "Done?",
    readyText:
      "Send your full design — all copy and the structure land in my admin. I build it into a real site.",
    emptyPreview: "Start by adding a section.",
    ctaTitle: "Rather design together?",
    ctaText:
      "The builder gives you full control. Want to spar on strategy and design? See the packages.",
    ctaButton: "See packages",
    panelStyle: "Style",
    taglineLabel: "Slogan / tagline",
    fontLabel: "Typeface",
    fonts: { sans: "Modern", serif: "Classic", mono: "Technical", display: "Character" },
    radiusLabel: "Corners",
    radii: { strak: "Sharp", zacht: "Soft", rond: "Round" },
    dup: "Duplicate",
    edit: "Edit content",
    addItem: "Add item",
    colorsLabel: "Custom colors",
    colorBg: "Background",
    colorFg: "Text",
    colorAccent: "Accent",
    imagesLabel: "Images",
    uploadHint: "Drag or pick photos — shown in gallery & about.",
    buildEmail: "Your email",
    buildSite: "Your current website (optional)",
    buildSiteNote:
      "If you fill this in, we automatically scan your current site so we can serve you better.",
    buildSend: "Send to Studio VM",
    buildSending: "Sending…",
    buildSent: "Great! Your full design is in my admin — I'll build it out.",
    buildErr: "Sending failed. Try again or email me directly.",
    fields: {
      eyebrow: "Eyebrow",
      heading: "Heading",
      sub: "Subtext",
      button: "Button text",
      title: "Title",
      text: "Text",
      itemTitle: "Title",
      itemDesc: "Description",
      value: "Figure",
      label: "Label",
      quote: "Quote",
      who: "Who",
      name: "Name",
      price: "Price",
      per: "Period",
      q: "Question",
      a: "Answer",
      emailAddr: "Email address",
      phone: "Phone",
      address: "Address",
      day: "Day",
      time: "Hours",
    },
    preview: {
      welcome: "Welcome to",
      tagline: "A tagline that explains what you do.",
      discover: "Discover more",
      featuresTitle: "What you get",
      feature: "Feature",
      featureDesc: "A short explanation of why this is useful.",
      testiTitle: "What clients say",
      testi: [{ q: "Finally a site that loads fast.", w: "Sophie, restaurant" }, { q: "My clients find it right away.", w: "Pieter, photographer" }],
      pricingTitle: "Pricing",
      tiers: [{ n: "Basic", p: "€19" }, { n: "Pro", p: "€49" }, { n: "Plus", p: "€99" }],
      perMonth: "/month",
      galleryTitle: "Gallery",
      contactTitle: "Contact",
      name: "Your name",
      email: "Email",
      message: "Your message",
      send: "Send",
      aboutTitle: "About us",
      aboutText:
        "Tell your story in short: who you are, what you stand for and why clients should pick you.",
      statsTitle: "In numbers",
      statsItems: [
        { v: "10+", l: "years experience" },
        { v: "250", l: "happy clients" },
        { v: "24/7", l: "reachable" },
      ],
      faqTitle: "Frequently asked",
      faqs: [
        { q: "How fast can I start?", a: "Usually within a few days." },
        { q: "What does it cost?", a: "A fair fixed price, set upfront." },
      ],
      ctaTitle2: "Ready to start?",
      ctaText2: "One click and we schedule a no-obligation chat.",
      ctaBtn2: "Get in touch",
      pricelistTitle: "Price list",
      hoursTitle: "Opening hours",
      mapTitle: "Where to find us",
      hoursSeed: [
        { day: "Monday–Friday", time: "9:00 – 17:00" },
        { day: "Saturday", time: "By appointment" },
        { day: "Sunday", time: "Closed" },
      ],
      priceSeed: [
        { name: "Service or product", price: "€ 0", desc: "Short description." },
        { name: "Second item", price: "€ 0", desc: "Short description." },
      ],
    },
  },
};

type Preview = (typeof T)[Locale]["preview"];

let _id = 0;
const uid = () => `s${++_id}`;

const STORAGE_KEY = "svm-builder-draft-v1";

function syncId(ps: Page[]) {
  for (const p of ps) {
    const m = /^s(\d+)$/.exec(p.id);
    if (m) _id = Math.max(_id, +m[1]);
    for (const s of p.sections) {
      const sm = /^s(\d+)$/.exec(s.id);
      if (sm) _id = Math.max(_id, +sm[1]);
    }
  }
}

function defaults(kind: SectionKind, p: Preview): SectionData {
  switch (kind) {
    case "hero":
      return { eyebrow: p.welcome, heading: "", sub: p.tagline, button: p.discover };
    case "features":
      return {
        title: p.featuresTitle,
        items: [1, 2, 3].map((i) => ({
          title: `${p.feature} ${i}`,
          desc: p.featureDesc,
        })),
      };
    case "steps":
      return {
        title: "",
        items: [1, 2, 3].map((i) => ({
          title: `${i}.`,
          desc: "",
        })),
      };
    case "team":
      return {
        title: "",
        items: [1, 2, 3].map(() => ({ title: "", desc: "" })),
      };
    case "logos":
      return {
        title: "",
        items: [1, 2, 3, 4].map(() => ({ title: "" })),
      };
    case "about":
      return { title: p.aboutTitle, text: p.aboutText };
    case "stats":
      return {
        title: p.statsTitle,
        items: p.statsItems.map((s) => ({ value: s.v, label: s.l })),
      };
    case "testimonials":
      return {
        title: p.testiTitle,
        items: p.testi.map((t) => ({ quote: t.q, who: t.w })),
      };
    case "pricing":
      return {
        title: p.pricingTitle,
        items: p.tiers.map((t) => ({ name: t.n, price: t.p, per: p.perMonth })),
      };
    case "gallery":
      return { title: p.galleryTitle };
    case "faq":
      return {
        title: p.faqTitle,
        items: p.faqs.map((f) => ({ q: f.q, a: f.a })),
      };
    case "pricelist":
      return {
        title: p.pricelistTitle,
        items: p.priceSeed.map((x) => ({ ...x })),
      };
    case "hours":
      return {
        title: p.hoursTitle,
        items: p.hoursSeed.map((x) => ({ ...x })),
      };
    case "map":
      return { title: p.mapTitle, address: "" };
    case "richtext":
      return { title: "", text: "" };
    case "banner":
      return { text: "" };
    case "newsletter":
      return { title: "", text: "", button: "" };
    case "footer":
      return { text: "" };
    case "cta":
      return { title: p.ctaTitle2, text: p.ctaText2, button: p.ctaBtn2 };
    case "contact":
      return { title: p.contactTitle, emailAddr: "", phone: "", address: "" };
  }
}

const itemTemplate: Partial<Record<SectionKind, Record<string, string>>> = {
  features: { title: "", desc: "" },
  steps: { title: "", desc: "" },
  team: { title: "", desc: "" },
  logos: { title: "" },
  stats: { value: "", label: "" },
  testimonials: { quote: "", who: "" },
  pricing: { name: "", price: "", per: "" },
  faq: { q: "", a: "" },
  pricelist: { name: "", price: "", desc: "" },
  hours: { day: "", time: "" },
};

export type BuilderSnapshot = {
  businessName?: string;
  theme?: Theme;
  font?: FontKey;
  radius?: RadiusKey;
  pages?: Page[];
  activeId?: string;
  locale?: string;
};

export default function BuilderPage({
  designId,
  initialSnapshot,
}: {
  designId?: string;
  initialSnapshot?: BuilderSnapshot;
} = {}) {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [businessName, setBusinessName] = useState(
    locale === "fr" ? "Mon Affaire" : locale === "en" ? "My Business" : "Mijn Zaak",
  );
  const [font, setFont] = useState<FontKey>("sans");
  const [radius, setRadius] = useState<RadiusKey>("zacht");
  const [images, setImages] = useState<string[]>([]);
  const pg = PG[locale];
  const [pages, setPages] = useState<Page[]>(() => [
    {
      id: uid(),
      name: "Home",
      sections: (["hero", "features", "contact"] as SectionKind[]).map((k) => ({
        id: uid(),
        kind: k,
        data: defaults(k, c.preview),
      })),
    },
  ]);
  const [activeId, setActiveId] = useState("");
  const active = pages.find((p) => p.id === activeId) ?? pages[0];
  const setSections = (fn: (s: Section[]) => Section[]) =>
    setPages((ps) =>
      ps.map((p) =>
        p.id === active.id ? { ...p, sections: fn(p.sections) } : p,
      ),
    );
  const sections = active.sections;
  const [openId, setOpenId] = useState<string | null>(null);
  const [buildEmail, setBuildEmail] = useState("");
  const [currentSite, setCurrentSite] = useState("");
  const [sent, setSent] = useState<"idle" | "ok" | "err">("idle");
  const [pending, startSend] = useTransition();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [hydrated, setHydrated] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  // Concept herstellen: serverontwerp (account) heeft voorrang op de
  // lokale draft; anders de localStorage-draft.
  useEffect(() => {
    try {
      const fromServer =
        initialSnapshot && Object.keys(initialSnapshot).length > 0;
      const raw = fromServer ? null : localStorage.getItem(STORAGE_KEY);
      const d = fromServer
        ? initialSnapshot!
        : raw
          ? (JSON.parse(raw) as {
              businessName?: string;
              theme?: Theme;
              font?: FontKey;
              radius?: RadiusKey;
              pages?: Page[];
              activeId?: string;
            })
          : null;
      if (d) {
        if (d.businessName) setBusinessName(d.businessName);
        if (d.theme) setTheme(d.theme);
        if (d.font) setFont(d.font);
        if (d.radius) setRadius(d.radius);
        if (d.pages && d.pages.length) {
          syncId(d.pages);
          setPages(d.pages);
          setActiveId(d.activeId ?? d.pages[0].id);
        }
      }
    } catch {
      /* corrupt draft → negeren */
    }
    setHydrated(true);
  }, []);

  // Autosave (foto's bewust niet — te groot voor localStorage).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ businessName, theme, font, radius, pages, activeId }),
      );
      setSavedTick(true);
      const t = setTimeout(() => setSavedTick(false), 1200);
      return () => clearTimeout(t);
    } catch {
      /* quota → stil negeren */
    }
  }, [hydrated, businessName, theme, font, radius, pages, activeId]);

  // Serverzijde autosave op het account-ontwerp (gedebouncet), zodat de
  // klant op elk toestel kan hervatten en jij elke versie ziet.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || !designId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveDesign(designId, {
        businessName,
        theme,
        font,
        radius,
        pages,
        activeId,
        locale,
      });
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    hydrated,
    designId,
    locale,
    businessName,
    theme,
    font,
    radius,
    pages,
    activeId,
  ]);

  const resetDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    const id = uid();
    const home: Page = {
      id,
      name: "Home",
      sections: (["hero", "features", "contact"] as SectionKind[]).map((k) => ({
        id: uid(),
        kind: k,
        data: defaults(k, c.preview),
      })),
    };
    setPages([home]);
    setActiveId(id);
    setOpenId(null);
    setTheme(themes[0]);
    setFont("sans");
    setRadius("zacht");
    setImages([]);
    setBusinessName(
      locale === "fr"
        ? "Mon Affaire"
        : locale === "en"
          ? "My Business"
          : "Mijn Zaak",
    );
  };
  const dLabel =
    locale === "fr"
      ? { saved: "Brouillon enregistré", reset: "Recommencer" }
      : locale === "en"
        ? { saved: "Draft saved", reset: "Start over" }
        : { saved: "Concept bewaard", reset: "Begin opnieuw" };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .slice(0, 10)
      .forEach((file) => {
        if (!file.type.startsWith("image/") || file.size > 3_000_000) return;
        const reader = new FileReader();
        reader.onload = () =>
          setImages((s) => (s.length >= 10 ? s : [...s, String(reader.result)]));
        reader.readAsDataURL(file);
      });
  };

  const addSection = (k: SectionKind) => {
    const s: Section = { id: uid(), kind: k, data: defaults(k, c.preview) };
    setSections((arr) => [...arr, s]);
    setOpenId(s.id);
  };
  const removeSection = (id: string) =>
    setSections((s) => s.filter((x) => x.id !== id));
  const duplicateSection = (id: string) =>
    setSections((s) => {
      const i = s.findIndex((x) => x.id === id);
      if (i < 0) return s;
      const n = [...s];
      n.splice(i + 1, 0, { ...s[i], id: uid(), data: structuredClone(s[i].data) });
      return n;
    });
  const moveSection = (id: string, dir: -1 | 1) =>
    setSections((s) => {
      const i = s.findIndex((x) => x.id === id);
      const tgt = i + dir;
      if (i < 0 || tgt < 0 || tgt >= s.length) return s;
      const n = [...s];
      [n[i], n[tgt]] = [n[tgt], n[i]];
      return n;
    });
  const patchData = (id: string, patch: SectionData) =>
    setSections((s) =>
      s.map((x) => (x.id === id ? { ...x, data: { ...x.data, ...patch } } : x)),
    );

  const addPage = () => {
    const np: Page = {
      id: uid(),
      name: locale === "fr" ? "Nouvelle" : locale === "en" ? "New" : "Nieuw",
      sections: [{ id: uid(), kind: "hero", data: defaults("hero", c.preview) }],
    };
    setPages((ps) => [...ps, np]);
    setActiveId(np.id);
    setOpenId(null);
  };
  const renamePage = (id: string, name: string) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));
  const deletePage = (id: string) =>
    setPages((ps) => {
      if (ps.length <= 1) return ps;
      const next = ps.filter((p) => p.id !== id);
      if (id === active.id) setActiveId(next[0].id);
      return next;
    });
  const movePage = (id: string, dir: -1 | 1) =>
    setPages((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      const tgt = i + dir;
      if (i < 0 || tgt < 0 || tgt >= ps.length) return ps;
      const n = [...ps];
      [n[i], n[tgt]] = [n[tgt], n[i]];
      return n;
    });

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{c.intro}</p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-6">
            <Panel icon={<Palette className="h-4 w-4" />} title={c.panelTheme}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.bizName}
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {themes.map((tm) => (
                  <button
                    key={tm.slug}
                    type="button"
                    onClick={() => setTheme(tm)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${
                      theme.slug === tm.slug
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-6 rounded-full border"
                      style={{
                        background: `linear-gradient(135deg, ${tm.bg} 0%, ${tm.bg} 50%, ${tm.accent} 50%, ${tm.accent} 100%)`,
                      }}
                    />
                    {c.themeLabels[tm.slug]}
                  </button>
                ))}
              </div>
              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.colorsLabel}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["bg", c.colorBg],
                    ["fg", c.colorFg],
                    ["accent", c.colorAccent],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] text-muted"
                  >
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) =>
                        setTheme((t) => ({
                          ...t,
                          slug: "custom",
                          [key]: e.target.value,
                        }))
                      }
                      className="h-7 w-full cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel icon={<Type className="h-4 w-4" />} title={c.panelStyle}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.fontLabel}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(fontStacks) as FontKey[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFont(f)}
                    style={{ fontFamily: fontStacks[f] }}
                    className={`rounded-lg border p-2 text-sm transition-colors ${
                      font === f
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    {c.fonts[f]}
                  </button>
                ))}
              </div>
              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.radiusLabel}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(radiusPx) as RadiusKey[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadius(r)}
                    className={`border p-2 text-xs transition-colors ${
                      radius === r
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                    style={{ borderRadius: radiusPx[r] }}
                  >
                    {c.radii[r]}
                  </button>
                ))}
              </div>
              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.imagesLabel}
              </p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs text-muted transition-colors hover:bg-card-hover">
                <ImagePlus className="h-4 w-4" strokeWidth={2} />
                {c.uploadHint}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setImages((s) => s.filter((_, j) => j !== i))
                      }
                      title="x"
                      className="group relative aspect-square overflow-hidden rounded-md border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex">
                        <X className="h-4 w-4" strokeWidth={2} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={<Layers className="h-4 w-4" />} title={pg.panel}>
              <p className="mb-3 text-[11px] text-muted">{pg.menuHint}</p>
              <ul className="space-y-2">
                {pages.map((p, i) => (
                  <li
                    key={p.id}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${
                      p.id === active.id
                        ? "border-accent bg-card-hover"
                        : "bg-background"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(p.id);
                        setOpenId(null);
                      }}
                      aria-label="select"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background:
                          p.id === active.id
                            ? "var(--accent)"
                            : "var(--border)",
                      }}
                    />
                    <input
                      value={p.name}
                      onChange={(e) => renamePage(p.id, e.target.value)}
                      onFocus={() => {
                        setActiveId(p.id);
                        setOpenId(null);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <span className="flex items-center gap-0.5 text-muted">
                      <button
                        type="button"
                        onClick={() => movePage(p.id, -1)}
                        disabled={i === 0}
                        aria-label="↑"
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(p.id, 1)}
                        disabled={i === pages.length - 1}
                        aria-label="↓"
                        className="rounded p-1 hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" strokeWidth={2} />
                      </button>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deletePage(p.id)}
                          aria-label={pg.del}
                          title={pg.del}
                          className="rounded p-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addPage}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted hover:bg-card-hover hover:text-foreground"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                {pg.add}
              </button>
            </Panel>

            <Panel
              icon={<Layers className="h-4 w-4" />}
              title={`${c.panelSections} — ${active.name}`}
            >
              <ul className="space-y-2">
                {sections.map((s, i) => (
                  <li key={s.id} className="rounded-lg border bg-background">
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenId((o) => (o === s.id ? null : s.id))
                        }
                        className="flex flex-1 items-center gap-1.5 text-left"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-muted transition-transform ${
                            openId === s.id ? "" : "-rotate-90"
                          }`}
                          strokeWidth={2}
                        />
                        {c.sectionLabels[s.kind]}
                      </button>
                      <div className="flex items-center gap-1 text-muted">
                        <button
                          type="button"
                          onClick={() => moveSection(s.id, -1)}
                          aria-label="↑"
                          className="rounded p-1 hover:text-foreground disabled:opacity-30"
                          disabled={i === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(s.id, 1)}
                          aria-label="↓"
                          className="rounded p-1 hover:text-foreground disabled:opacity-30"
                          disabled={i === sections.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSection(s.id)}
                          aria-label={c.dup}
                          title={c.dup}
                          className="rounded p-1 hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(s.id)}
                          aria-label="x"
                          className="rounded p-1 hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    {openId === s.id && (
                      <div className="border-t p-3">
                        <SectionEditor section={s} c={c} patch={patchData} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {c.add}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sectionKinds.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => addSection(k)}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                      {c.sectionLabels[k]}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel icon={null} title={c.panelReady}>
              <p className="text-xs text-muted">{c.readyText}</p>
              {sent === "ok" ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs font-medium text-accent">
                  <Check className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  {c.buildSent}
                </p>
              ) : (
                <form
                  className="mt-3 space-y-2"
                  action={() =>
                    startSend(async () => {
                      const r = await submitBuild({
                        businessName,
                        email: buildEmail,
                        locale,
                        theme:
                          c.themeLabels[theme.slug] ??
                          `${theme.bg} / ${theme.fg} / ${theme.accent}`,
                        font: c.fonts[font],
                        radius: c.radii[radius],
                        colors: {
                          bg: theme.bg,
                          fg: theme.fg,
                          accent: theme.accent,
                        },
                        sections: pages.flatMap((p) =>
                          p.sections.map((s) => c.sectionLabels[s.kind]),
                        ),
                        pages: pages.map((p) => ({
                          name: p.name,
                          blocks: p.sections.map((s) => ({
                            kind: s.kind,
                            data: s.data,
                          })),
                        })),
                        imageCount: images.length,
                        currentSite,
                      });
                      if (r.ok) setSent("ok");
                      else if (r.mailto) window.location.href = r.mailto;
                      else setSent("err");
                    })
                  }
                >
                  <input
                    type="email"
                    required
                    value={buildEmail}
                    onChange={(e) => setBuildEmail(e.target.value)}
                    placeholder={c.buildEmail}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    value={currentSite}
                    onChange={(e) => setCurrentSite(e.target.value)}
                    placeholder={c.buildSite}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <p className="text-[11px] text-muted">{c.buildSiteNote}</p>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    ) : (
                      <Send className="h-4 w-4" strokeWidth={2} />
                    )}
                    {pending ? c.buildSending : c.buildSend}
                  </button>
                  {sent === "err" && (
                    <p className="text-xs text-red-500">{c.buildErr}</p>
                  )}
                </form>
              )}
            </Panel>
          </aside>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 font-mono text-xs text-muted">
                {businessName.toLowerCase().replace(/\s+/g, "-")}.be
              </span>
              <span className="ml-auto flex items-center gap-2">
                {savedTick && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-accent">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    {dLabel.saved}
                  </span>
                )}
                <span className="flex overflow-hidden rounded-full border">
                  <button
                    type="button"
                    onClick={() => setDevice("desktop")}
                    aria-label="Desktop"
                    className={`px-2.5 py-1 ${
                      device === "desktop"
                        ? "bg-card-hover text-foreground"
                        : "text-muted"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    aria-label="Mobiel"
                    className={`px-2.5 py-1 ${
                      device === "mobile"
                        ? "bg-card-hover text-foreground"
                        : "text-muted"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={2} />
                  {dLabel.reset}
                </button>
              </span>
            </div>
            <div
              className={
                device === "mobile"
                  ? "flex justify-center bg-card-hover p-4"
                  : ""
              }
            >
              <div
                style={{
                  background: theme.bg,
                  color: theme.fg,
                  fontFamily: fontStacks[font],
                }}
                className={`bldr-frame min-h-[600px] ${
                  device === "mobile"
                    ? "w-full max-w-[390px] overflow-hidden rounded-2xl border shadow-sm"
                    : ""
                }`}
              >
              <style>{`.bldr-frame [class*="rounded"]{border-radius:${radiusPx[radius]} !important}`}</style>
              <nav
                className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-8 py-4"
                style={{ borderColor: `${theme.fg}1a` }}
              >
                <span className="text-sm font-semibold tracking-tight">
                  {businessName}
                </span>
                <span className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveId(p.id);
                        setOpenId(null);
                      }}
                      className="transition-opacity hover:opacity-100"
                      style={{
                        opacity: p.id === active.id ? 1 : 0.55,
                        color: p.id === active.id ? theme.accent : theme.fg,
                        fontWeight: p.id === active.id ? 600 : 400,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </span>
              </nav>
              {sections.length === 0 ? (
                <div className="flex h-[600px] flex-col items-center justify-center gap-3 p-8 text-center text-muted">
                  <Layers className="h-12 w-12" strokeWidth={1} />
                  <p>{c.emptyPreview}</p>
                </div>
              ) : (
                sections.map((s) => (
                  <PreviewSection
                    key={s.id}
                    kind={s.kind}
                    data={s.data}
                    theme={theme}
                    businessName={businessName}
                    images={images}
                    p={c.preview}
                    edit={(patch) => patchData(s.id, patch)}
                  />
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-3 text-muted">{c.ctaText}</p>
          <Link
            href={localePath(locale, "/pricing")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

type Loc = (typeof T)[Locale];

const fieldCls =
  "w-full rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-accent";

function Txt({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      {area ? (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
        />
      )}
    </label>
  );
}

function SectionEditor({
  section,
  c,
  patch,
}: {
  section: Section;
  c: Loc;
  patch: (id: string, p: SectionData) => void;
}) {
  const f = c.fields;
  const d = section.data;
  const set = (k: string, v: unknown) => patch(section.id, { [k]: v });
  const str = (k: string) => (d[k] == null ? "" : String(d[k]));
  const items = Array.isArray(d.items)
    ? (d.items as Record<string, string>[])
    : [];
  const setItems = (next: Record<string, string>[]) =>
    patch(section.id, { items: next });
  const tmpl = itemTemplate[section.kind];

  const simple: Record<string, string[]> = {
    hero: ["eyebrow", "heading", "sub", "button"],
    about: ["title", "text"],
    cta: ["title", "text", "button"],
    richtext: ["title", "text"],
    banner: ["text"],
    newsletter: ["title", "text", "button"],
    footer: ["text"],
    gallery: ["title"],
    map: ["title", "address"],
  };
  const areaKeys = new Set(["text", "sub", "address"]);

  if (simple[section.kind]) {
    return (
      <div className="space-y-3">
        {simple[section.kind].map((k) => (
          <Txt
            key={k}
            label={f[k] ?? k}
            value={str(k)}
            area={areaKeys.has(k)}
            onChange={(v) => set(k, v)}
          />
        ))}
      </div>
    );
  }

  if (section.kind === "contact") {
    return (
      <div className="space-y-3">
        <Txt label={f.title} value={str("title")} onChange={(v) => set("title", v)} />
        <Txt
          label={f.emailAddr}
          value={str("emailAddr")}
          onChange={(v) => set("emailAddr", v)}
        />
        <Txt label={f.phone} value={str("phone")} onChange={(v) => set("phone", v)} />
        <Txt
          label={f.address}
          value={str("address")}
          onChange={(v) => set("address", v)}
          area
        />
      </div>
    );
  }

  // list-based: features, stats, testimonials, pricing, faq
  const itemFieldLabel: Record<string, Record<string, string>> = {
    features: { title: f.itemTitle, desc: f.itemDesc },
    steps: { title: f.itemTitle, desc: f.itemDesc },
    team: { title: f.itemTitle, desc: f.itemDesc },
    logos: { title: f.itemTitle },
    stats: { value: f.value, label: f.label },
    testimonials: { quote: f.quote, who: f.who },
    pricing: { name: f.name, price: f.price, per: f.per },
    faq: { q: f.q, a: f.a },
    pricelist: { name: f.name, price: f.price, desc: f.itemDesc },
    hours: { day: f.day, time: f.time },
  };
  const labels = itemFieldLabel[section.kind] ?? {};

  return (
    <div className="space-y-3">
      <Txt label={f.title} value={str("title")} onChange={(v) => set("title", v)} />
      {items.map((it, idx) => (
        <div key={idx} className="rounded-lg border p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, j) => j !== idx))}
              className="rounded p-0.5 text-muted hover:text-red-500"
              aria-label="x"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <div className="space-y-2">
            {Object.keys(labels).map((key) => (
              <Txt
                key={key}
                label={labels[key]}
                value={it[key] ?? ""}
                area={key === "a" || key === "desc"}
                onChange={(v) =>
                  setItems(
                    items.map((x, j) => (j === idx ? { ...x, [key]: v } : x)),
                  )
                }
              />
            ))}
          </div>
        </div>
      ))}
      {items.length < 8 && tmpl && (
        <button
          type="button"
          onClick={() => setItems([...items, { ...tmpl }])}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted hover:bg-card-hover hover:text-foreground"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          {c.addItem}
        </button>
      )}
    </div>
  );
}

function E({
  value,
  onChange,
  className,
  style,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  return (
    <span
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const t = (e.currentTarget.textContent ?? "")
          .replace(/ /g, " ")
          .trim();
        if (t !== value) onChange(t);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={`-mx-0.5 cursor-text rounded-sm px-0.5 outline-none transition-colors hover:bg-current/[0.06] focus:bg-current/[0.08] focus:ring-1 focus:ring-current/30 ${
        className ?? ""
      }`}
      style={style}
    >
      {value}
    </span>
  );
}

function PreviewSection({
  kind,
  data,
  theme,
  businessName,
  images,
  p,
  edit,
}: {
  kind: SectionKind;
  data: SectionData;
  theme: Theme;
  businessName: string;
  images: string[];
  p: Preview;
  edit: (patch: SectionData) => void;
}) {
  const accentText = { color: theme.accent };
  const border = { borderColor: `${theme.fg}1a` };
  const g = (k: string, fb = "") => {
    const v = data[k];
    return v == null || v === "" ? fb : String(v);
  };
  const list = Array.isArray(data.items)
    ? (data.items as Record<string, string>[])
    : [];
  const rowsOr = (seed: Record<string, string>[]) =>
    list.length ? list : seed.map((x) => ({ ...x }));
  const setItem = (
    rows: Record<string, string>[],
    i: number,
    field: string,
    v: string,
  ) => edit({ items: rows.map((r, j) => (j === i ? { ...r, [field]: v } : r)) });

  switch (kind) {
    case "hero":
      return (
        <div className="px-8 py-14 text-center">
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={accentText}
          >
            <E
              value={g("eyebrow", p.welcome)}
              onChange={(v) => edit({ eyebrow: v })}
            />
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            <E
              value={g("heading", businessName)}
              onChange={(v) => edit({ heading: v })}
            />
          </h2>
          <p className="mt-3 text-sm opacity-70">
            <E value={g("sub", p.tagline)} onChange={(v) => edit({ sub: v })} />
          </p>
          <button
            className="mt-6 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            <E
              value={g("button", p.discover)}
              onChange={(v) => edit({ button: v })}
            />
          </button>
        </div>
      );
    case "features":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.featuresTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr([
              { title: `${p.feature} 1`, desc: p.featureDesc },
              { title: `${p.feature} 2`, desc: p.featureDesc },
              { title: `${p.feature} 3`, desc: p.featureDesc },
            ]);
            return (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {rows.map((it, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4 text-xs"
                    style={border}
                  >
                    <div
                      className="mb-2 h-6 w-6 rounded-full"
                      style={{ background: theme.accent, opacity: 0.2 }}
                    />
                    <p className="font-semibold">
                      <E
                        value={it.title || `${p.feature} ${i + 1}`}
                        onChange={(v) => setItem(rows, i, "title", v)}
                      />
                    </p>
                    <p className="mt-1 opacity-70">
                      <E
                        value={it.desc || p.featureDesc}
                        onChange={(v) => setItem(rows, i, "desc", v)}
                        multiline
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "steps":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E value={g("title")} onChange={(v) => edit({ title: v })} />
          </h3>
          {(() => {
            const rows = rowsOr([
              { title: "1.", desc: "" },
              { title: "2.", desc: "" },
              { title: "3.", desc: "" },
            ]);
            return (
              <div className="mx-auto mt-6 max-w-lg space-y-3">
                {rows.map((it, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: theme.accent, color: theme.bg }}
                    >
                      {i + 1}
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold">
                        <E
                          value={it.title}
                          onChange={(v) => setItem(rows, i, "title", v)}
                        />
                      </p>
                      <p className="mt-0.5 opacity-70">
                        <E
                          value={it.desc}
                          onChange={(v) => setItem(rows, i, "desc", v)}
                          multiline
                        />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "team":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E value={g("title")} onChange={(v) => edit({ title: v })} />
          </h3>
          {(() => {
            const rows = rowsOr([
              { title: "", desc: "" },
              { title: "", desc: "" },
              { title: "", desc: "" },
            ]);
            return (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {rows.map((it, i) => (
                  <div key={i}>
                    <div
                      className="mx-auto mb-2 h-14 w-14 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${theme.accent}55, ${theme.fg}11)`,
                      }}
                    />
                    <p className="text-sm font-semibold">
                      <E
                        value={it.title}
                        onChange={(v) => setItem(rows, i, "title", v)}
                      />
                    </p>
                    <p className="text-xs opacity-70">
                      <E
                        value={it.desc}
                        onChange={(v) => setItem(rows, i, "desc", v)}
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "logos":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E value={g("title")} onChange={(v) => edit({ title: v })} />
          </h3>
          {(() => {
            const rows = rowsOr([
              { title: "" },
              { title: "" },
              { title: "" },
              { title: "" },
            ]);
            return (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {rows.map((it, i) => (
                  <span
                    key={i}
                    className="rounded-lg border px-4 py-2 text-xs font-medium opacity-80"
                    style={border}
                  >
                    <E
                      value={it.title}
                      onChange={(v) => setItem(rows, i, "title", v)}
                    />
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "testimonials":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.testiTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(
              p.testi.map((t) => ({ quote: t.q, who: t.w })),
            );
            return (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {rows.map((t, i) => (
                  <blockquote
                    key={i}
                    className="rounded-lg border p-4 text-xs"
                    style={border}
                  >
                    <p>
                      &ldquo;
                      <E
                        value={t.quote}
                        onChange={(v) => setItem(rows, i, "quote", v)}
                        multiline
                      />
                      &rdquo;
                    </p>
                    <footer className="mt-2 font-mono text-[10px] opacity-70">
                      —{" "}
                      <E
                        value={t.who}
                        onChange={(v) => setItem(rows, i, "who", v)}
                      />
                    </footer>
                  </blockquote>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "pricing":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.pricingTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(
              p.tiers.map((t) => ({ name: t.n, price: t.p, per: p.perMonth })),
            );
            return (
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                {rows.map((tier, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4 text-center"
                    style={border}
                  >
                    <p className="font-semibold">
                      <E
                        value={tier.name}
                        onChange={(v) => setItem(rows, i, "name", v)}
                      />
                    </p>
                    <p className="mt-1 text-lg" style={accentText}>
                      <E
                        value={tier.price}
                        onChange={(v) => setItem(rows, i, "price", v)}
                      />
                    </p>
                    <p className="mt-1 opacity-60">
                      <E
                        value={tier.per || p.perMonth}
                        onChange={(v) => setItem(rows, i, "per", v)}
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "gallery":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.galleryTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {images.length > 0
              ? images.slice(0, 8).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))
              : [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-md"
                    style={{
                      background: `linear-gradient(${i * 45}deg, ${theme.accent}33, ${theme.fg}11)`,
                    }}
                  />
                ))}
          </div>
        </div>
      );
    case "about":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-[1fr_1.4fr]">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0]}
                alt=""
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
            ) : (
              <div
                className="aspect-[4/3] rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}33, ${theme.fg}11)`,
                }}
              />
            )}
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                <E
                  value={g("title", p.aboutTitle)}
                  onChange={(v) => edit({ title: v })}
                />
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm opacity-70">
                <E
                  value={g("text", p.aboutText)}
                  onChange={(v) => edit({ text: v })}
                  multiline
                />
              </p>
            </div>
          </div>
        </div>
      );
    case "stats":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.statsTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(
              p.statsItems.map((s) => ({ value: s.v, label: s.l })),
            );
            return (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {rows.map((s, i) => (
                  <div key={i}>
                    <p className="text-3xl font-bold" style={accentText}>
                      <E
                        value={s.value}
                        onChange={(v) => setItem(rows, i, "value", v)}
                      />
                    </p>
                    <p className="mt-1 text-xs opacity-70">
                      <E
                        value={s.label}
                        onChange={(v) => setItem(rows, i, "label", v)}
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "faq":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.faqTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(p.faqs.map((x) => ({ q: x.q, a: x.a })));
            return (
              <div className="mx-auto mt-6 max-w-lg space-y-3">
                {rows.map((fitem, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4 text-xs"
                    style={border}
                  >
                    <p className="font-semibold">
                      <E
                        value={fitem.q}
                        onChange={(v) => setItem(rows, i, "q", v)}
                      />
                    </p>
                    <p className="mt-1 opacity-70">
                      <E
                        value={fitem.a}
                        onChange={(v) => setItem(rows, i, "a", v)}
                        multiline
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "pricelist":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.pricelistTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(p.priceSeed);
            return (
              <div className="mx-auto mt-6 max-w-lg divide-y" style={border}>
                {rows.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        <E
                          value={it.name}
                          onChange={(v) => setItem(rows, i, "name", v)}
                        />
                      </p>
                      <p className="text-xs opacity-60">
                        <E
                          value={it.desc || ""}
                          onChange={(v) => setItem(rows, i, "desc", v)}
                          multiline
                        />
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-sm font-semibold"
                      style={accentText}
                    >
                      <E
                        value={it.price}
                        onChange={(v) => setItem(rows, i, "price", v)}
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "hours":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="flex items-center justify-center gap-2 text-center text-xl font-semibold tracking-tight">
            <Clock className="h-5 w-5" strokeWidth={1.75} style={accentText} />
            <E
              value={g("title", p.hoursTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {(() => {
            const rows = rowsOr(p.hoursSeed);
            return (
              <div className="mx-auto mt-6 max-w-sm divide-y" style={border}>
                {rows.map((it, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 text-sm"
                  >
                    <E
                      value={it.day}
                      onChange={(v) => setItem(rows, i, "day", v)}
                    />
                    <E
                      value={it.time}
                      onChange={(v) => setItem(rows, i, "time", v)}
                      className="opacity-70"
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "map": {
      const addr = g("address");
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.mapTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          <div
            className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-3 rounded-lg border py-12"
            style={{
              ...border,
              background: `linear-gradient(135deg, ${theme.accent}1f, ${theme.fg}0d)`,
            }}
          >
            <MapPin
              className="h-8 w-8"
              strokeWidth={1.5}
              style={accentText}
            />
            <p className="px-6 text-center text-sm font-medium">
              <E
                value={addr || "Straat 1, 0000 Gemeente"}
                onChange={(v) => edit({ address: v })}
              />
            </p>
          </div>
        </div>
      );
    }
    case "richtext":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <div className="mx-auto max-w-2xl">
            <h3 className="text-xl font-semibold tracking-tight">
              <E value={g("title")} onChange={(v) => edit({ title: v })} />
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm opacity-70">
              <E
                value={g("text")}
                onChange={(v) => edit({ text: v })}
                multiline
              />
            </p>
          </div>
        </div>
      );
    case "banner":
      return (
        <div
          className="border-t px-6 py-3 text-center text-xs font-medium"
          style={{ ...border, background: theme.accent, color: theme.bg }}
        >
          <E value={g("text")} onChange={(v) => edit({ text: v })} />
        </div>
      );
    case "newsletter":
      return (
        <div
          className="border-t px-8 py-12 text-center"
          style={{ ...border, background: `${theme.accent}0d` }}
        >
          <h3 className="text-xl font-semibold tracking-tight">
            <E value={g("title")} onChange={(v) => edit({ title: v })} />
          </h3>
          <p className="mt-2 text-sm opacity-70">
            <E
              value={g("text")}
              onChange={(v) => edit({ text: v })}
              multiline
            />
          </p>
          <div className="mx-auto mt-5 flex max-w-sm gap-2">
            <span
              className="flex-1 rounded-full border px-4 py-2 text-left text-xs opacity-60"
              style={border}
            >
              jouw@email.be
            </span>
            <button
              className="rounded-full px-4 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.bg }}
            >
              <E
                value={g("button")}
                onChange={(v) => edit({ button: v })}
              />
            </button>
          </div>
        </div>
      );
    case "footer":
      return (
        <div
          className="border-t px-8 py-8 text-center text-xs opacity-60"
          style={border}
        >
          <E
            value={g("text")}
            onChange={(v) => edit({ text: v })}
            multiline
          />
        </div>
      );
    case "cta":
      return (
        <div
          className="border-t px-8 py-14 text-center"
          style={{ ...border, background: `${theme.accent}14` }}
        >
          <h3 className="text-2xl font-semibold tracking-tight">
            <E
              value={g("title", p.ctaTitle2)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          <p className="mt-2 text-sm opacity-70">
            <E
              value={g("text", p.ctaText2)}
              onChange={(v) => edit({ text: v })}
              multiline
            />
          </p>
          <button
            className="mt-5 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            <E
              value={g("button", p.ctaBtn2)}
              onChange={(v) => edit({ button: v })}
            />
          </button>
        </div>
      );
    case "contact":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.contactTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          <p className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 text-center text-xs opacity-70">
            <E
              value={g("emailAddr", "jouw@email.be")}
              onChange={(v) => edit({ emailAddr: v })}
            />
            <span aria-hidden>·</span>
            <E
              value={g("phone", "+32 ...")}
              onChange={(v) => edit({ phone: v })}
            />
            <span aria-hidden>·</span>
            <E
              value={g("address", "Straat 1, 0000 Gemeente")}
              onChange={(v) => edit({ address: v })}
            />
          </p>
          <div className="mx-auto mt-6 max-w-sm space-y-2 text-xs">
            <input
              placeholder={p.name}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <input
              placeholder={p.email}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <textarea
              placeholder={p.message}
              rows={3}
              className="w-full rounded border bg-transparent px-3 py-2"
              style={border}
              readOnly
            />
            <button
              className="w-full rounded-full px-4 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.bg }}
            >
              {p.send}
            </button>
          </div>
        </div>
      );
  }
}
