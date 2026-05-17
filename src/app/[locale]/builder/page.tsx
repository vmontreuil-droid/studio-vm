"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { submitBuild } from "@/app/actions/build-lead";
import { saveDesign, sendDesign } from "@/app/actions/builder-designs";
import {
  buildPreset,
  buildSiteScaffold,
  SECTOR_LABELS,
  TONE_LABELS,
  PAGE_LABELS,
  type SectorKey,
  type PageKey,
} from "@/lib/builder-presets";
import { importSite } from "@/app/actions/import-site";
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
  GripVertical,
  MapPin,
  Clock,
  Monitor,
  Smartphone,
  RotateCcw,
  Wand2,
  Move,
  Square,
  Star,
  Heart,
  Zap,
  Shield,
  Award,
  Phone,
  Mail,
  Users,
  Briefcase,
  Camera,
  Coffee,
  Scissors,
  Wrench,
  Truck,
  Home,
  Leaf,
  Sun,
  Sparkles,
  Gift,
  Target,
  ThumbsUp,
  Smile,
  Music,
  Globe,
  Lock,
  Rocket,
  Calendar,
  MessageCircle,
  CreditCard,
  Package,
  Settings,
  Tag,
  Compass,
  Flame,
  Crown,
  Gem,
  HandHeart,
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
  | "contact"
  | "form";

type SectionData = Record<string, unknown>;

// Mobiel-onafhankelijk: elke instelling kan een parallelle "<sleutel>M"-
// variant hebben die enkel op mobiel geldt. Is die niet gezet, dan erft
// mobiel gewoon de desktop-waarde. resolveData levert de juiste set voor
// het actieve toestel — zo wordt de hele render (sectie én items) in één
// klap toestel-correct, zonder de ene weergave de andere te laten raken.
function resolveData(d: SectionData, mob: boolean): SectionData {
  if (!mob) return d;
  const out: SectionData = { ...d };
  for (const k of Object.keys(d)) {
    if (k.endsWith("M")) continue;
    const mk = k + "M";
    if (mk in d && d[mk] !== undefined) out[k] = d[mk];
  }
  return out;
}

type Section = { id: string; kind: SectionKind; data: SectionData };
type Page = {
  id: string;
  name: string;
  sections: Section[];
  seoTitle?: string;
  seoDesc?: string;
};

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

// Een ruime waaier kant-en-klare achtergrond-schakeringen zodat een
// leek niet hoeft te prutsen met de kleurkiezer en de site echt kan
// afwerken. Licht → getint → diep/donker.
const BG_SHADES: string[] = [
  "#ffffff", "#fdfdfc", "#fafaf9", "#f5f5f4", "#f4f4f5", "#eeeeee",
  "#f8fafc", "#f1f5f9", "#e8eef5", "#eff6ff", "#e0f2fe", "#ecfeff",
  "#f0fdf4", "#dcfce7", "#f7fee7", "#fffbeb", "#fff7ed", "#ffedd5",
  "#fef2f2", "#ffe4e6", "#fff1f2", "#faf5ff", "#f3e8ff", "#ede9fe",
  "#fdf2f8", "#e7e5e4", "#d6d3d1", "#1f2937", "#18181b", "#0c0a09",
];

// Per-blok achtergrondtint, afgeleid van het gekozen thema zodat het
// altijd samenhangend blijft. Wordt opgeslagen als section.data._bg.
const SECT_TONES: { k: string; mix: [string, number] | null }[] = [
  { k: "", mix: null },
  { k: "soft1", mix: ["fg", 4] },
  { k: "soft2", mix: ["fg", 9] },
  { k: "soft3", mix: ["fg", 16] },
  { k: "acc1", mix: ["accent", 6] },
  { k: "acc2", mix: ["accent", 13] },
  { k: "acc3", mix: ["accent", 22] },
  { k: "white", mix: ["white", 100] },
];
function sectionToneBg(
  tone: unknown,
  th: Theme,
): string | undefined {
  const t = SECT_TONES.find((x) => x.k === String(tone ?? ""));
  if (!t || !t.mix) return undefined;
  const [src, pct] = t.mix;
  if (src === "white") return "#ffffff";
  const mixCol = src === "accent" ? th.accent : th.fg;
  return `color-mix(in srgb, ${mixCol} ${pct}%, ${th.bg})`;
}

// WCAG-contrastverhouding tussen twee hex-kleuren (1–21).
function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const m = hex.replace("#", "");
    const n =
      m.length === 3 ? m.split("").map((x) => x + x).join("") : m.slice(0, 6);
    const ch = [0, 2, 4].map((i) => {
      const v = (parseInt(n.slice(i, i + 2), 16) || 0) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const a = lum(hex1);
  const b = lum(hex2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const PATTERNS = ["none", "dots", "stripes", "grid", "diagonal", "cross"];
function patternCss(
  data: SectionData,
  th: Theme,
): { backgroundImage: string; backgroundSize: string } | null {
  const t = String(data._pat ?? "none");
  if (!t || t === "none" || !PATTERNS.includes(t)) return null;
  const hex = typeof data._patC === "string" && data._patC ? data._patC : th.fg;
  const op =
    typeof data._patO === "number" ? Math.max(0, Math.min(1, data._patO)) : 0.08;
  const m = hex.replace("#", "");
  const n =
    m.length === 3 ? m.split("").map((x) => x + x).join("") : m.padEnd(6, "0");
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  const c = `rgba(${r}, ${g}, ${b}, ${op})`;
  switch (t) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(${c} 1.5px, transparent 1.6px)`,
        backgroundSize: "18px 18px",
      };
    case "stripes":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 12px)`,
        backgroundSize: "auto",
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(-45deg, ${c} 0 1px, transparent 1px 14px)`,
        backgroundSize: "auto",
      };
    case "cross":
      return {
        backgroundImage: `linear-gradient(${c} 1.5px, transparent 1.5px), linear-gradient(90deg, ${c} 1.5px, transparent 1.5px)`,
        backgroundSize: "26px 26px, 26px 26px",
      };
    default:
      return null;
  }
}

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
  "form",
];

// Ruime set lettertypes op breed-beschikbare families (geen externe
// lading nodig). Naam wordt in zijn eigen lettertype getoond.
const fontStacks: Record<string, string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  arial: "Arial, 'Helvetica Neue', sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', 'Segoe UI', sans-serif",
  calibri: "Calibri, 'Segoe UI', sans-serif",
  segoe: "'Segoe UI', system-ui, sans-serif",
  gillsans: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  optima: "Optima, Segoe, Candara, sans-serif",
  futura: "Futura, 'Century Gothic', sans-serif",
  centurygothic: "'Century Gothic', AppleGothic, sans-serif",
  bahnschrift: "Bahnschrift, 'DIN Alternate', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  times: "'Times New Roman', Times, serif",
  garamond: "Garamond, 'EB Garamond', serif",
  baskerville: "Baskerville, 'Baskerville Old Face', serif",
  palatino: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
  cambria: "Cambria, Georgia, serif",
  didot: "Didot, 'Bodoni MT', 'Times New Roman', serif",
  rockwell: "Rockwell, 'Courier Bold', Courier, serif",
  copperplate: "'Copperplate', 'Copperplate Gothic Light', serif",
  lucida: "'Lucida Bright', Georgia, serif",
  mono: "ui-monospace, 'Cascadia Code', Menlo, monospace",
  consolas: "Consolas, 'Lucida Console', monospace",
  courier: "'Courier New', Courier, monospace",
  brush: "'Brush Script MT', 'Segoe Script', cursive",
  segoescript: "'Segoe Script', 'Bradley Hand', cursive",
  comic: "'Comic Sans MS', 'Comic Neue', cursive",
  impact: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
};
const FONT_NAMES: Record<string, string> = {
  sans: "Systeem", inter: "Inter", helvetica: "Helvetica", arial: "Arial",
  verdana: "Verdana", tahoma: "Tahoma", trebuchet: "Trebuchet", calibri: "Calibri",
  segoe: "Segoe UI", gillsans: "Gill Sans", optima: "Optima", futura: "Futura",
  centurygothic: "Century Gothic", bahnschrift: "Bahnschrift", serif: "Georgia",
  times: "Times", garamond: "Garamond", baskerville: "Baskerville",
  palatino: "Palatino", cambria: "Cambria", didot: "Didot", rockwell: "Rockwell",
  copperplate: "Copperplate", lucida: "Lucida", mono: "Mono",
  consolas: "Consolas", courier: "Courier", brush: "Brush Script",
  segoescript: "Segoe Script", comic: "Comic Sans", impact: "Impact",
};
type FontKey = string;

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
    shadesLabel: string;
    sectBgLabel: string;
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
      mapEmbedHint: string;
      hoursSeed: { day: string; time: string }[];
      priceSeed: { name: string; price: string; desc: string }[];
      heroDrop: string;
      heroRemove: string;
      heroDur: string;
      heroTrans: string;
      transFade: string;
      transSlide: string;
      transUp: string;
      transZoom: string;
      transBlur: string;
      transNone: string;
      heroHeight: string;
      heroCard: string;
      heroBlur: string;
      heroMove: string;
      heroCardW: string;
      heroCardColor: string;
      heroCardOpacity: string;
      heroTransDur: string;
      heroCap: string;
      capTitlePh: string;
      capTextPh: string;
      ovAddImg: string;
      ovAddTxt: string;
      ovTxtPh: string;
      linkLabel: string;
      linkNone: string;
      linkPage: string;
      linkSection: string;
      linkUrl: string;
      linkNew: string;
      linkNewPh: string;
      heroCardStyle: string;
      heroRotation: string;
      optSeq: string;
      optRand: string;
      optPong: string;
      footerColLinks: string;
      footerAbout: string;
      footerColTitle: string;
      footerLink: string;
      footerNote: string;
      footerAddCol: string;
      footerAddLink: string;
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
    sectionLabels: { hero: "Hero", features: "Features", steps: "Werkwijze", team: "Team", logos: "Klanten", about: "Over ons", stats: "Cijfers", testimonials: "Testimonials", pricing: "Pricing", gallery: "Galerij", faq: "FAQ", pricelist: "Prijslijst", hours: "Openingsuren", map: "Kaart", richtext: "Tekstblok", banner: "Aankondiging", newsletter: "Nieuwsbrief", cta: "Oproep", footer: "Footer", contact: "Contact", form: "Formulier" },
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
    shadesLabel: "Achtergrond-schakeringen",
    sectBgLabel: "Achtergrond van dit blok",
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
    mapEmbedHint:
      "Typ gewoon je adres in het adresveld — de kaart verschijnt vanzelf.",
      hoursSeed: [
        { day: "Maandag–Vrijdag", time: "9:00 – 17:00" },
        { day: "Zaterdag", time: "Op afspraak" },
        { day: "Zondag", time: "Gesloten" },
      ],
      priceSeed: [
        { name: "Dienst of product", price: "€ 0", desc: "Korte omschrijving." },
        { name: "Tweede item", price: "€ 0", desc: "Korte omschrijving." },
      ],
      heroDrop: "Sleep hier een foto als achtergrond",
      heroRemove: "Achtergrond weg",
      heroDur: "Duur per slide",
      heroTrans: "Overgang",
      transFade: "Vloeiend",
      transSlide: "Schuiven",
      transUp: "Omhoog",
      transZoom: "Inzoomen",
      transBlur: "Wazig",
      transNone: "Direct",
      heroHeight: "Hoogte",
      heroCard: "Kaart achter tekst",
      heroBlur: "Wazig",
      heroMove: "Versleep de tekst",
      heroCardW: "Kaartbreedte",
      heroCardColor: "Kaartkleur",
      heroCardOpacity: "Kaart-dekking",
      heroTransDur: "Overgangsduur",
      heroCap: "Foto-bijschrift",
      capTitlePh: "Naam van de foto",
      capTextPh: "Korte uitleg bij deze foto",
      ovAddImg: "+ Foto",
      ovAddTxt: "+ Tekst",
      ovTxtPh: "Typ hier je tekst",
      linkLabel: "Koppelen aan",
      linkNone: "Geen",
      linkPage: "Pagina",
      linkSection: "Sectie",
      linkUrl: "Webadres",
      linkNew: "Nieuwe pagina",
      linkNewPh: "Naam nieuwe pagina",
      heroCardStyle: "Kaart-stijl",
      heroRotation: "Rotatie-volgorde",
      optSeq: "Op volgorde",
      optRand: "Willekeurig",
      optPong: "Heen en weer",
      footerColLinks: "Links",
      footerAbout: "Korte tekst / bedrijfslijn",
      footerColTitle: "Kolomtitel",
      footerLink: "Link-tekst",
      footerNote: "Onderste regel (bv. © 2026 Mijn Zaak)",
      footerAddCol: "Kolom toevoegen",
      footerAddLink: "Link toevoegen",
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
    sectionLabels: { hero: "Hero", features: "Atouts", steps: "Méthode", team: "Équipe", logos: "Clients", about: "À propos", stats: "Chiffres", testimonials: "Témoignages", pricing: "Tarifs", gallery: "Galerie", faq: "FAQ", pricelist: "Tarifs liste", hours: "Horaires", map: "Carte", richtext: "Texte", banner: "Annonce", newsletter: "Newsletter", cta: "Appel", footer: "Pied de page", contact: "Contact", form: "Formulaire" },
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
    shadesLabel: "Nuances de fond",
    sectBgLabel: "Fond de ce bloc",
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
    mapEmbedHint:
      "Tapez simplement votre adresse — la carte apparaît automatiquement.",
      hoursSeed: [
        { day: "Lundi–Vendredi", time: "9:00 – 17:00" },
        { day: "Samedi", time: "Sur rendez-vous" },
        { day: "Dimanche", time: "Fermé" },
      ],
      priceSeed: [
        { name: "Service ou produit", price: "€ 0", desc: "Brève description." },
        { name: "Deuxième élément", price: "€ 0", desc: "Brève description." },
      ],
      heroDrop: "Glissez une photo ici comme arrière-plan",
      heroRemove: "Retirer l'arrière-plan",
      heroDur: "Durée par diapo",
      heroTrans: "Transition",
      transFade: "Fondu",
      transSlide: "Glissement",
      transUp: "Vers le haut",
      transZoom: "Zoom",
      transBlur: "Flou",
      transNone: "Direct",
      heroHeight: "Hauteur",
      heroCard: "Carte derrière le texte",
      heroBlur: "Flou",
      heroMove: "Déplacez le texte",
      heroCardW: "Largeur carte",
      heroCardColor: "Couleur carte",
      heroCardOpacity: "Opacité carte",
      heroTransDur: "Durée transition",
      heroCap: "Légende photo",
      capTitlePh: "Nom de la photo",
      capTextPh: "Courte description de la photo",
      ovAddImg: "+ Photo",
      ovAddTxt: "+ Texte",
      ovTxtPh: "Tapez votre texte ici",
      linkLabel: "Lier à",
      linkNone: "Aucun",
      linkPage: "Page",
      linkSection: "Section",
      linkUrl: "Adresse web",
      linkNew: "Nouvelle page",
      linkNewPh: "Nom de la nouvelle page",
      heroCardStyle: "Style de carte",
      heroRotation: "Ordre de rotation",
      optSeq: "Dans l'ordre",
      optRand: "Aléatoire",
      optPong: "Va-et-vient",
      footerColLinks: "Liens",
      footerAbout: "Texte court / ligne entreprise",
      footerColTitle: "Titre de colonne",
      footerLink: "Texte du lien",
      footerNote: "Ligne du bas (ex. © 2026 Mon Affaire)",
      footerAddCol: "Ajouter une colonne",
      footerAddLink: "Ajouter un lien",
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
    sectionLabels: { hero: "Hero", features: "Features", steps: "Process", team: "Team", logos: "Clients", about: "About", stats: "Stats", testimonials: "Testimonials", pricing: "Pricing", gallery: "Gallery", faq: "FAQ", pricelist: "Price list", hours: "Opening hours", map: "Map", richtext: "Text", banner: "Announcement", newsletter: "Newsletter", cta: "Call-out", footer: "Footer", contact: "Contact", form: "Form" },
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
    shadesLabel: "Background shades",
    sectBgLabel: "Background of this block",
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
    mapEmbedHint:
      "Just type your address — the map appears automatically.",
      hoursSeed: [
        { day: "Monday–Friday", time: "9:00 – 17:00" },
        { day: "Saturday", time: "By appointment" },
        { day: "Sunday", time: "Closed" },
      ],
      priceSeed: [
        { name: "Service or product", price: "€ 0", desc: "Short description." },
        { name: "Second item", price: "€ 0", desc: "Short description." },
      ],
      heroDrop: "Drop a photo here as background",
      heroRemove: "Remove background",
      heroDur: "Duration per slide",
      heroTrans: "Transition",
      transFade: "Fade",
      transSlide: "Slide",
      transUp: "Slide up",
      transZoom: "Zoom",
      transBlur: "Blur",
      transNone: "Instant",
      heroHeight: "Height",
      heroCard: "Card behind text",
      heroBlur: "Blur",
      heroMove: "Drag the text",
      heroCardW: "Card width",
      heroCardColor: "Card colour",
      heroCardOpacity: "Card opacity",
      heroTransDur: "Transition speed",
      heroCap: "Photo caption",
      capTitlePh: "Photo name",
      capTextPh: "Short caption for this photo",
      ovAddImg: "+ Photo",
      ovAddTxt: "+ Text",
      ovTxtPh: "Type your text here",
      linkLabel: "Link to",
      linkNone: "None",
      linkPage: "Page",
      linkSection: "Section",
      linkUrl: "Web address",
      linkNew: "New page",
      linkNewPh: "New page name",
      heroCardStyle: "Card style",
      heroRotation: "Rotation order",
      optSeq: "In order",
      optRand: "Random",
      optPong: "Back and forth",
      footerColLinks: "Links",
      footerAbout: "Short text / company line",
      footerColTitle: "Column title",
      footerLink: "Link text",
      footerNote: "Bottom line (e.g. © 2026 My Business)",
      footerAddCol: "Add column",
      footerAddLink: "Add link",
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
      return { eyebrow: p.welcome, heading: "", sub: p.tagline, button: p.discover, bgs: [] };
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
      return {
        about: "",
        cols: [
          { title: p.footerColLinks, links: [{ label: "" }, { label: "" }] },
        ],
        note: "",
      };
    case "cta":
      return { title: p.ctaTitle2, text: p.ctaText2, button: p.ctaBtn2 };
    case "contact":
      return { title: p.contactTitle, emailAddr: "", phone: "", address: "" };
    case "form":
      return {
        title: p.contactTitle,
        button: p.send,
        items: [
          { label: p.name, type: "text" },
          { label: p.email, type: "email" },
          { label: p.message, type: "textarea" },
        ],
      };
  }
}

const itemTemplate: Partial<Record<SectionKind, Record<string, string>>> = {
  features: { title: "", desc: "" },
  steps: { title: "", desc: "" },
  team: { title: "", desc: "" },
  logos: { title: "" },
  form: { label: "", type: "text" },
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
  align?: "left" | "center" | "right";
  scale?: number;
  logo?: string;
  navAlign?: "left" | "center" | "right";
  btnShape?: "rond" | "zacht" | "recht";
  btnColor?: string;
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
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [scale, setScale] = useState(1);
  const [logo, setLogo] = useState("");
  const [navAlign, setNavAlign] = useState<"left" | "center" | "right">(
    "left",
  );
  const [btnShape, setBtnShape] = useState<"rond" | "zacht" | "recht">(
    "rond",
  );
  const [btnColor, setBtnColor] = useState("");
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

  // Mediabibliotheek: elke foto die al ergens in het ontwerp staat,
  // herbruikbaar in een ander blok. Afgeleid (geen dubbele opslag).
  const mediaLib = (() => {
    const set = new Set<string>();
    const add = (v: unknown) => {
      if (typeof v === "string" && v.startsWith("data:image")) set.add(v);
    };
    for (const pg of pages)
      for (const sec of pg.sections) {
        const d = sec.data as Record<string, unknown>;
        add(d._img);
        add(d._bgimg);
        if (Array.isArray(d.slides))
          for (const sl of d.slides as Record<string, unknown>[])
            add(sl.bg);
        if (Array.isArray(d.bgs))
          for (const b of d.bgs as unknown[]) add(b);
        if (Array.isArray(d._ov))
          for (const o of d._ov as Record<string, unknown>[]) add(o.src);
        if (Array.isArray(d.items))
          for (const it of d.items as Record<string, unknown>[])
            add(it._img);
      }
    return [...set].slice(0, 60);
  })();

  // Versies: undo/redo over de pagina's (max 40 stappen).
  const histRef = useRef<Page[][]>([]);
  const redoRef = useRef<Page[][]>([]);
  const skipHist = useRef(false);
  const prevPagesRef = useRef<Page[]>(pages);
  const [histTick, setHistTick] = useState(0);
  useEffect(() => {
    if (skipHist.current) {
      skipHist.current = false;
      prevPagesRef.current = pages;
      return;
    }
    if (prevPagesRef.current !== pages) {
      histRef.current.push(prevPagesRef.current);
      if (histRef.current.length > 40) histRef.current.shift();
      redoRef.current = [];
      prevPagesRef.current = pages;
      setHistTick((t) => t + 1);
    }
  }, [pages]);
  const undo = () => {
    const prev = histRef.current.pop();
    if (!prev) return;
    redoRef.current.push(pages);
    skipHist.current = true;
    setPages(prev);
    setHistTick((t) => t + 1);
  };
  const redo = () => {
    const nx = redoRef.current.pop();
    if (!nx) return;
    histRef.current.push(pages);
    skipHist.current = true;
    setPages(nx);
    setHistTick((t) => t + 1);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  // Herbruikbare blokken: kopieer een sectie en plak ze op een
  // andere pagina, of voeg ze meteen op alle pagina's toe.
  const [clip, setClip] = useState<Section | null>(null);
  const copySection = (sec: Section) =>
    setClip({ ...sec, data: structuredClone(sec.data) });
  const pasteSection = () => {
    if (!clip) return;
    setSections((arr) => [
      ...arr,
      { ...clip, id: uid(), data: structuredClone(clip.data) },
    ]);
  };
  const sectionToAllPages = (sec: Section) =>
    setPages((ps) =>
      ps.map((pp) =>
        pp.id === active.id
          ? pp
          : {
              ...pp,
              sections: [
                ...pp.sections,
                { ...sec, id: uid(), data: structuredClone(sec.data) },
              ],
            },
      ),
    );
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragIx, setDragIx] = useState<number | null>(null);
  const [sector, setSector] = useState<SectorKey>("services");
  const [tone, setTone] = useState<"warm" | "zakelijk" | "speels">("warm");
  const [pageSel, setPageSel] = useState<PageKey[]>([
    "home",
    "about",
    "offer",
    "contact",
  ]);
  const [impUrl, setImpUrl] = useState("");
  const [impBusy, setImpBusy] = useState(false);
  const [impErr, setImpErr] = useState("");
  const [review, setReview] = useState<
    { lvl: "ok" | "warn"; msg: string }[] | null
  >(null);
  const asideRef = useRef<HTMLDivElement>(null);
  const [buildEmail, setBuildEmail] = useState("");
  const [currentSite, setCurrentSite] = useState("");
  const [sent, setSent] = useState<"idle" | "ok" | "err">("idle");
  const [copied, setCopied] = useState(false);
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
          ? (JSON.parse(raw) as BuilderSnapshot)
          : null;
      if (d) {
        if (d.businessName) setBusinessName(d.businessName);
        if (d.theme) setTheme(d.theme);
        if (d.font) setFont(d.font);
        if (d.radius) setRadius(d.radius);
        if (d.align) setAlign(d.align);
        if (typeof d.scale === "number") setScale(d.scale);
        if (typeof d.logo === "string") setLogo(d.logo);
        if (d.navAlign) setNavAlign(d.navAlign);
        if (d.btnShape) setBtnShape(d.btnShape);
        if (typeof d.btnColor === "string") setBtnColor(d.btnColor);
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
        JSON.stringify({
          businessName,
          theme,
          font,
          radius,
          align,
          scale,
          logo,
          navAlign,
          btnShape,
          btnColor,
          pages,
          activeId,
        }),
      );
      setSavedTick(true);
      const t = setTimeout(() => setSavedTick(false), 1200);
      return () => clearTimeout(t);
    } catch {
      /* quota → stil negeren */
    }
  }, [hydrated, businessName, theme, font, radius, align, scale, logo, navAlign, btnShape, btnColor, pages, activeId]);

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
        align,
        scale,
        logo,
        navAlign,
        btnShape,
        btnColor,
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
    align,
    scale,
    logo,
    navAlign,
    btnShape,
    btnColor,
    pages,
    activeId,
  ]);

  // Bij het openen van een sectie: scroll de zijbalk naar boven zodat
  // de vastgezette editor meteen in beeld staat.
  useEffect(() => {
    if (openId) asideRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [openId]);

  // Echte scroll-trigger: animaties spelen pas als het blok in beeld
  // komt (niet bij het laden). Herbindt bij wijzigingen.
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".bldr-frame [data-anim]"),
    ).filter((el) => (el.dataset.anim ?? "") !== "");
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("svm-seen");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 },
    );
    els.forEach((el) => {
      el.classList.remove("svm-seen");
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pages, activeId, device, scale]);

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
    setAlign("center");
    setScale(1);
    setLogo("");
    setNavAlign("left");
    setBtnShape("rond");
    setBtnColor("");
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
  const reorderSection = (from: number, to: number) =>
    setSections((s) => {
      if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= s.length ||
        to >= s.length
      )
        return s;
      const n = [...s];
      const [moved] = n.splice(from, 1);
      n.splice(to, 0, moved);
      return n;
    });
  // Gekoppelde blokken: heeft het blok een _gid, dan stroomt elke
  // wijziging door naar álle blokken met datzelfde _gid op elke pagina.
  const patchData = (id: string, patch: SectionData) =>
    setPages((ps) => {
      let gid: unknown;
      for (const pg of ps)
        for (const x of pg.sections)
          if (x.id === id) gid = (x.data as SectionData)._gid;
      const linked = typeof gid === "string" && gid;
      return ps.map((pg) => ({
        ...pg,
        sections: pg.sections.map((x) =>
          x.id === id ||
          (linked && (x.data as SectionData)._gid === gid)
            ? { ...x, data: { ...x.data, ...patch } }
            : x,
        ),
      }));
    });

  // Inhoud-assistentie: vult enkel lege velden — bestaande tekst blijft.
  const fillPreset = () => {
    const preset = buildPreset(sector, tone, locale, businessName || "");
    setSections((arr) =>
      arr.map((sec) => {
        const p = preset[sec.kind];
        if (!p) return sec;
        const data = { ...sec.data } as Record<string, unknown>;
        for (const [key, val] of Object.entries(p)) {
          if (key === "items") {
            const cur = Array.isArray(data.items)
              ? (data.items as Record<string, unknown>[])
              : [];
            const allEmpty =
              cur.length === 0 ||
              cur.every((it) =>
                Object.values(it).every(
                  (v) => !v || String(v).trim() === "",
                ),
              );
            if (allEmpty && Array.isArray(val)) data.items = val;
          } else if (
            typeof val === "string" &&
            (data[key] == null || String(data[key]).trim() === "")
          ) {
            data[key] = val;
          }
        }
        return { ...sec, data: data as SectionData };
      }),
    );
  };

  // Klaar-assistent: vriendelijke controle voor een eerste-keer-bouwer.
  const runReview = () => {
    const L = (nl: string, fr: string, en: string) =>
      locale === "fr" ? fr : locale === "en" ? en : nl;
    const out: { lvl: "ok" | "warn"; msg: string }[] = [];
    const names = pages.map((pp) => pp.name);
    const defTag = c.preview.tagline;
    const defWelcome = c.preview.welcome;
    let hasContact = false;
    for (const pg of pages) {
      for (const s of pg.sections) {
        const d = s.data as Record<string, unknown>;
        const sv = (k: string) =>
          d[k] == null ? "" : String(d[k]).trim();
        if (s.kind === "contact") {
          hasContact = true;
          if (!sv("emailAddr") && !sv("phone") && !sv("address"))
            out.push({
              lvl: "warn",
              msg: L(
                `Contactgegevens ontbreken op "${pg.name}".`,
                `Coordonnées manquantes sur « ${pg.name} ».`,
                `Contact details missing on "${pg.name}".`,
              ),
            });
        }
        if (s.kind === "hero") {
          const sl = Array.isArray(d.slides)
            ? (d.slides as { sub?: string; bg?: string }[])
            : [];
          const subs = sl.map((x) => (x.sub || "").trim());
          if (
            sl.length === 0 ||
            subs.every((x) => !x || x === defTag || x === defWelcome)
          )
            out.push({
              lvl: "warn",
              msg: L(
                `De hero op "${pg.name}" bevat nog de voorbeeldtekst.`,
                `Le hero de « ${pg.name} » contient encore le texte d'exemple.`,
                `The hero on "${pg.name}" still has the example text.`,
              ),
            });
          if (sl.length && sl.every((x) => !x.bg))
            out.push({
              lvl: "warn",
              msg: L(
                `Tip: sleep een foto in de hero van "${pg.name}".`,
                `Astuce : glissez une photo dans le hero de « ${pg.name} ».`,
                `Tip: drop a photo into the hero on "${pg.name}".`,
              ),
            });
        }
        if (
          (s.kind === "about" || s.kind === "richtext") &&
          !sv("text")
        )
          out.push({
            lvl: "warn",
            msg: L(
              `Tekstblok op "${pg.name}" is nog leeg.`,
              `Bloc de texte vide sur « ${pg.name} ».`,
              `Text block on "${pg.name}" is still empty.`,
            ),
          });
        if (Array.isArray(d.items)) {
          const its = d.items as Record<string, unknown>[];
          if (
            its.length &&
            its.every((it) =>
              Object.values(it).every(
                (v) => !v || String(v).trim() === "",
              ),
            )
          )
            out.push({
              lvl: "warn",
              msg: L(
                `Een lijst op "${pg.name}" heeft nog lege items.`,
                `Une liste sur « ${pg.name} » a des éléments vides.`,
                `A list on "${pg.name}" still has empty items.`,
              ),
            });
        }
        const lk = d._lnk as { k?: string; v?: string } | undefined;
        if (lk && lk.k === "page" && lk.v && !names.includes(lk.v))
          out.push({
            lvl: "warn",
            msg: L(
              `Een knop linkt naar onbestaande pagina "${lk.v}".`,
              `Un bouton pointe vers une page inexistante « ${lk.v} ».`,
              `A button links to a missing page "${lk.v}".`,
            ),
          });
        if (
          ["cta", "newsletter"].includes(s.kind) &&
          sv("button") &&
          (!lk || lk.k === "none" || !lk.v)
        )
          out.push({
            lvl: "warn",
            msg: L(
              `De knop op "${pg.name}" heeft nog geen bestemming.`,
              `Le bouton sur « ${pg.name} » n'a pas de destination.`,
              `The button on "${pg.name}" has no destination yet.`,
            ),
          });
      }
    }
    if (!hasContact)
      out.push({
        lvl: "warn",
        msg: L(
          "Overweeg een contactpagina of contactblok toe te voegen.",
          "Pensez à ajouter une page ou un bloc de contact.",
          "Consider adding a contact page or block.",
        ),
      });
    if (out.length === 0)
      out.push({
        lvl: "ok",
        msg: L(
          "Alles ziet er goed uit — klaar om te versturen!",
          "Tout semble bon — prêt à envoyer !",
          "Everything looks good — ready to send!",
        ),
      });
    setReview(out);
  };

  // Volledige site bouwen vanuit de survey (vervangt de pagina's).
  const buildFullSite = () => {
    const warn =
      locale === "fr"
        ? "Ceci remplace toutes les pages actuelles par un site exemple. Continuer ?"
        : locale === "en"
          ? "This replaces all current pages with an example site. Continue?"
          : "Dit vervangt alle huidige pagina's door een voorbeeldsite. Doorgaan?";
    if (
      pages.some((pp) => pp.sections.length > 0) &&
      !window.confirm(warn)
    )
      return;
    const scaff = buildSiteScaffold(
      sector,
      tone,
      locale,
      businessName ||
        (locale === "fr"
          ? "Mon Affaire"
          : locale === "en"
            ? "My Business"
            : "Mijn Zaak"),
      pageSel,
    );
    if (!scaff.length) return;
    const np: Page[] = scaff.map((sp) => ({
      id: uid(),
      name: sp.name,
      sections: sp.sections.map((s) => ({
        id: uid(),
        kind: s.kind as SectionKind,
        data: s.data as SectionData,
      })),
    }));
    setPages(np);
    setActiveId(np[0].id);
    setOpenId(null);
  };

  // Bestaande site ruw inlezen en in het scaffold gieten.
  const importFromUrl = async () => {
    if (!impUrl.trim() || impBusy) return;
    setImpBusy(true);
    setImpErr("");
    let r;
    try {
      r = await importSite(impUrl.trim());
    } catch {
      setImpBusy(false);
      setImpErr(
        locale === "fr"
          ? "Échec de l'import."
          : locale === "en"
            ? "Import failed."
            : "Inlezen mislukt.",
      );
      return;
    }
    setImpBusy(false);
    if (!r.ok) {
      setImpErr(r.error);
      return;
    }
    const warn =
      locale === "fr"
        ? "Ceci remplace les pages actuelles. Continuer ?"
        : locale === "en"
          ? "This replaces the current pages. Continue?"
          : "Dit vervangt de huidige pagina's. Doorgaan?";
    if (pages.some((pp) => pp.sections.length > 0) && !window.confirm(warn))
      return;
    const st = r.site;
    if (st.businessName) setBusinessName(st.businessName);
    if (/^#[0-9a-f]{3,8}$/i.test(st.accent))
      setTheme((t) => ({ ...t, slug: "custom", accent: st.accent }));
    const scaff = buildSiteScaffold(
      sector,
      tone,
      locale,
      st.businessName || businessName || "Mijn Zaak",
      pageSel,
    );
    if (!scaff.length) return;
    const np: Page[] = scaff.map((sp) => ({
      id: uid(),
      name: sp.name,
      sections: sp.sections.map((sec) => {
        const d = { ...sec.data } as Record<string, unknown>;
        if (sec.kind === "hero") {
          const origBtn =
            (Array.isArray(d.slides) &&
              (d.slides[0] as { button?: string })?.button) ||
            "";
          const head = st.heading || st.businessName;
          d.slides = st.images.length
            ? st.images.map((im, i) => ({
                eyebrow: "",
                heading: i === 0 ? head : st.businessName,
                sub: st.tagline,
                button: origBtn,
                bg: im,
              }))
            : [
                {
                  eyebrow: "",
                  heading: head,
                  sub: st.tagline,
                  button: origBtn,
                },
              ];
        }
        if (sec.kind === "about" && st.about) d.text = st.about;
        if (sec.kind === "features" && st.features.length)
          d.items = st.features.map((f) => ({ ...f }));
        if (sec.kind === "contact") {
          if (st.email) d.emailAddr = st.email;
          if (st.phone) d.phone = st.phone;
          if (st.address) d.address = st.address;
        }
        return {
          id: uid(),
          kind: sec.kind as SectionKind,
          data: d as SectionData,
        };
      }),
    }));
    setPages(np);
    setActiveId(np[0].id);
    setOpenId(null);
  };

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
  const addPageNamed = (name: string) => {
    const nm = name.trim();
    if (!nm) return;
    setPages((ps) =>
      ps.some((p) => p.name === nm)
        ? ps
        : [
            ...ps,
            {
              id: uid(),
              name: nm,
              sections: [
                { id: uid(), kind: "hero", data: defaults("hero", c.preview) },
              ],
            },
          ],
    );
  };
  const renamePage = (id: string, name: string) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));
  const setPageSeo = (id: string, patch: Partial<Page>) =>
    setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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
      {!designId && (
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
      )}

      <section className={designId ? "" : "border-b"}>
        <div
          className={
            designId
              ? "grid w-full gap-6 px-4 py-6 lg:grid-cols-[360px_1fr] xl:px-8"
              : "grid w-full gap-6 px-4 py-8 lg:grid-cols-[360px_1fr] xl:px-8"
          }
        >
          <aside
            ref={asideRef}
            className={`space-y-6 lg:sticky lg:self-start lg:overflow-y-auto lg:pr-1 ${
              designId
                ? "lg:top-4 lg:max-h-[calc(100vh-2rem)]"
                : "lg:top-24 lg:max-h-[calc(100vh-7rem)]"
            }`}
          >
            {(() => {
              const openSec = sections.find((x) => x.id === openId);
              if (!openSec) return null;
              // Mobiel-onafhankelijk bewerken: in "mobiel"-modus schrijven de
              // stijlknoppen naar een parallelle _xxxM-sleutel. Is die niet
              // gezet, dan erft mobiel gewoon de desktop-waarde — zo raakt
              // de ene weergave de andere nooit aan.
              const mob = device === "mobile";
              const dv = (base: string): string =>
                mob && openSec.data[base + "M"] !== undefined
                  ? String(openSec.data[base + "M"] ?? "")
                  : String(openSec.data[base] ?? "");
              const dvRaw = (base: string): unknown =>
                mob && openSec.data[base + "M"] !== undefined
                  ? openSec.data[base + "M"]
                  : openSec.data[base];
              const dPatchV = (base: string, val: unknown) =>
                patchData(openSec.id, {
                  [mob ? base + "M" : base]: val,
                });
              const dPatch = (base: string, val: string) =>
                patchData(openSec.id, {
                  [mob ? base + "M" : base]: val,
                });
              const dOver = (base: string) =>
                mob && openSec.data[base + "M"] !== undefined;
              const dReset = (base: string) =>
                patchData(openSec.id, { [base + "M"]: undefined });
              const ResetChip = ({ base }: { base: string }) =>
                dOver(base) ? (
                  <button
                    type="button"
                    onClick={() => dReset(base)}
                    className="ml-2 font-mono text-[9px] lowercase tracking-normal text-accent underline"
                  >
                    {locale === "fr"
                      ? "↺ comme desktop"
                      : locale === "en"
                        ? "↺ same as desktop"
                        : "↺ zelfde als desktop"}
                  </button>
                ) : null;
              return (
                <div className="sticky top-0 z-20 rounded-xl border border-accent bg-card shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Pencil
                        className="h-3.5 w-3.5 text-accent"
                        strokeWidth={2}
                      />
                      {c.sectionLabels[openSec.kind]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      aria-label="x"
                      className="rounded p-1 text-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="max-h-[calc(100vh-15rem)] overflow-y-auto p-3">
                    <div className="mb-3 flex overflow-hidden rounded-lg border">
                      <button
                        type="button"
                        onClick={() => setDevice("desktop")}
                        className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] transition-colors ${
                          !mob
                            ? "bg-accent/10 font-medium text-foreground"
                            : "text-muted hover:bg-card-hover"
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setDevice("mobile")}
                        className={`flex flex-1 items-center justify-center gap-1.5 border-l px-2 py-1.5 text-[11px] transition-colors ${
                          mob
                            ? "bg-accent/10 font-medium text-foreground"
                            : "text-muted hover:bg-card-hover"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                        {locale === "fr"
                          ? "Mobile"
                          : locale === "en"
                            ? "Mobile"
                            : "Mobiel"}
                      </button>
                    </div>
                    {mob && (
                      <p className="mb-3 rounded-lg bg-accent/5 px-2.5 py-2 text-[10px] leading-snug text-muted">
                        {locale === "fr"
                          ? "Vous modifiez la version mobile. Les réglages non touchés reprennent le desktop."
                          : locale === "en"
                            ? "You are editing the mobile version. Untouched settings inherit the desktop."
                            : "Je past de mobiele weergave aan. Niet-gewijzigde instellingen volgen de desktop."}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        patchData(openSec.id, {
                          _gid: openSec.data._gid
                            ? ""
                            : `g${Date.now().toString(36)}`,
                        })
                      }
                      className={`mb-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                        openSec.data._gid
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted hover:bg-card-hover"
                      }`}
                      title={
                        locale === "fr"
                          ? "Un bloc lié se synchronise sur toutes les pages où il apparaît"
                          : locale === "en"
                            ? "A linked block syncs across every page it appears on"
                            : "Een gekoppeld blok synchroniseert op elke pagina waar het staat"
                      }
                    >
                      <Layers className="h-3.5 w-3.5" strokeWidth={2} />
                      {openSec.data._gid
                        ? locale === "fr"
                          ? "✓ Bloc lié (ontkoppelen)"
                          : locale === "en"
                            ? "✓ Linked block (unlink)"
                            : "✓ Gekoppeld blok (ontkoppel)"
                        : locale === "fr"
                          ? "Lier ce bloc sur toutes les pages"
                          : locale === "en"
                            ? "Link this block across pages"
                            : "Koppel dit blok over pagina's"}
                    </button>
                    {openSec.kind !== "hero" && (
                      <div className="mb-3">
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Espacement"
                            : locale === "en"
                              ? "Spacing"
                              : "Witruimte"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_sp" />
                        </p>
                        <div className="mb-3 grid grid-cols-3 gap-1.5">
                          {(
                            [
                              ["compact", locale === "fr" ? "Compact" : locale === "en" ? "Compact" : "Compact"],
                              ["", locale === "fr" ? "Normal" : locale === "en" ? "Normal" : "Normaal"],
                              ["ruim", locale === "fr" ? "Large" : locale === "en" ? "Roomy" : "Ruim"],
                            ] as const
                          ).map(([k, lbl]) => {
                            const selSp = dv("_sp") === k;
                            return (
                              <button
                                key={k || "norm"}
                                type="button"
                                onClick={() => dPatch("_sp", k)}
                                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                                  selSp
                                    ? "border-accent bg-accent/10 text-foreground"
                                    : "border-border text-muted hover:bg-card-hover"
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Animation à l'arrivée"
                            : locale === "en"
                              ? "Entrance animation"
                              : "Animatie bij verschijnen"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_anim" />
                        </p>
                        <div className="mb-2 grid grid-cols-4 gap-1.5">
                          {(
                            [
                              ["", locale === "fr" ? "Aucune" : locale === "en" ? "None" : "Geen"],
                              ["fade", "Fade"],
                              ["up", locale === "fr" ? "Monte" : locale === "en" ? "Up" : "Omhoog"],
                              ["zoom", "Zoom"],
                            ] as const
                          ).map(([k, lbl]) => {
                            const selA = dv("_anim") === k;
                            return (
                              <button
                                key={k || "none"}
                                type="button"
                                onClick={() => dPatch("_anim", k)}
                                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                  selA
                                    ? "border-accent bg-accent/10 text-foreground"
                                    : "border-border text-muted hover:bg-card-hover"
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mb-3 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              patchData(openSec.id, {
                                [mob ? "_hoverM" : "_hover"]: dv("_hover") ===
                                "1"
                                  ? 0
                                  : 1,
                              })
                            }
                            className={`flex-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                              dv("_hover") === "1"
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border text-muted hover:bg-card-hover"
                            }`}
                          >
                            {dv("_hover") === "1" ? "✓ " : ""}
                            {locale === "fr"
                              ? "Effet survol kaarten"
                              : locale === "en"
                                ? "Card hover effect"
                                : "Hover-effect kaarten"}
                            {dOver("_hover") && (
                              <span className="ml-1 text-accent">·m</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchData(openSec.id, {
                                _hideM: openSec.data._hideM ? 0 : 1,
                              })
                            }
                            className={`flex-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                              openSec.data._hideM
                                ? "border-accent bg-accent/10 text-foreground"
                                : "border-border text-muted hover:bg-card-hover"
                            }`}
                          >
                            {openSec.data._hideM ? "✓ " : ""}
                            {locale === "fr"
                              ? "Cacher sur mobile"
                              : locale === "en"
                                ? "Hide on mobile"
                                : "Verberg op gsm"}
                          </button>
                        </div>
                        {(openSec.kind === "features" ||
                          openSec.kind === "about") && (
                          <>
                            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                              {locale === "fr"
                                ? "Mise en page"
                                : locale === "en"
                                  ? "Layout"
                                  : "Lay-out"}
                              {mob && (
                                <span className="ml-1 text-accent">
                                  · mobiel
                                </span>
                              )}
                              <ResetChip base="_var" />
                            </p>
                            <div className="mb-3 grid grid-cols-3 gap-1.5">
                              {(openSec.kind === "features"
                                ? ([
                                    ["", locale === "fr" ? "3 kol." : locale === "en" ? "3 cols" : "3 kol."],
                                    ["duo", "2 kol."],
                                    ["list", locale === "fr" ? "Liste" : locale === "en" ? "List" : "Lijst"],
                                  ] as const)
                                : ([
                                    ["", locale === "fr" ? "Image gauche" : locale === "en" ? "Image left" : "Foto links"],
                                    ["right", locale === "fr" ? "Image droite" : locale === "en" ? "Image right" : "Foto rechts"],
                                  ] as const)
                              ).map(([k, lbl]) => {
                                const selV = dv("_var") === k;
                                return (
                                  <button
                                    key={k || "def"}
                                    type="button"
                                    onClick={() => dPatch("_var", k)}
                                    className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                      selV
                                        ? "border-accent bg-accent/10 text-foreground"
                                        : "border-border text-muted hover:bg-card-hover"
                                    }`}
                                  >
                                    {lbl}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Taille du texte"
                            : locale === "en"
                              ? "Text size"
                              : "Tekstgrootte"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_tsc" />
                        </p>
                        <div className="mb-2 grid grid-cols-4 gap-1.5">
                          {(
                            [
                              ["s", "S"],
                              ["", "M"],
                              ["l", "L"],
                              ["xl", "XL"],
                            ] as const
                          ).map(([k, lbl]) => {
                            const selT = dv("_tsc") === k;
                            return (
                              <button
                                key={k || "m"}
                                type="button"
                                onClick={() => dPatch("_tsc", k)}
                                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                  selT
                                    ? "border-accent bg-accent/10 text-foreground"
                                    : "border-border text-muted hover:bg-card-hover"
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Alignement"
                            : locale === "en"
                              ? "Alignment"
                              : "Uitlijning"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_talign" />
                        </p>
                        <div className="mb-2 grid grid-cols-4 gap-1.5">
                          {(
                            [
                              ["", locale === "fr" ? "Auto" : "Auto"],
                              ["left", locale === "fr" ? "Gauche" : locale === "en" ? "Left" : "Links"],
                              ["center", locale === "fr" ? "Centre" : "Midden"],
                              ["right", locale === "fr" ? "Droite" : locale === "en" ? "Right" : "Rechts"],
                            ] as const
                          ).map(([k, lbl]) => {
                            const selAl = dv("_talign") === k;
                            return (
                              <button
                                key={k || "auto"}
                                type="button"
                                onClick={() => dPatch("_talign", k)}
                                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                  selAl
                                    ? "border-accent bg-accent/10 text-foreground"
                                    : "border-border text-muted hover:bg-card-hover"
                                }`}
                              >
                                {lbl}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-[11px] text-muted">
                            {locale === "fr"
                              ? "Couleur texte"
                              : locale === "en"
                                ? "Text colour"
                                : "Tekstkleur"}
                            {mob && (
                              <span className="ml-1 text-accent">·m</span>
                            )}
                          </span>
                          <input
                            type="color"
                            value={
                              typeof dvRaw("_tcol") === "string" &&
                              dvRaw("_tcol")
                                ? (dvRaw("_tcol") as string)
                                : theme.fg
                            }
                            onChange={(e) =>
                              dPatchV("_tcol", e.target.value)
                            }
                            className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          {dOver("_tcol") ? (
                            <button
                              type="button"
                              onClick={() => dReset("_tcol")}
                              className="font-mono text-[10px] text-accent underline"
                            >
                              {locale === "fr"
                                ? "= desktop"
                                : locale === "en"
                                  ? "= desktop"
                                  : "= desktop"}
                            </button>
                          ) : dv("_tcol") ? (
                            <button
                              type="button"
                              onClick={() => dPatchV("_tcol", "")}
                              className="font-mono text-[10px] text-muted underline"
                            >
                              reset
                            </button>
                          ) : null}
                        </div>
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Photo de fond"
                            : locale === "en"
                              ? "Background photo"
                              : "Achtergrondfoto"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_bgimg" />
                        </p>
                        <div className="mb-3 flex items-center gap-2">
                          {dvRaw("_bgimg") ? (
                            <>
                              <span className="h-9 flex-1 overflow-hidden rounded-lg border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={String(dvRaw("_bgimg"))}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </span>
                              <button
                                type="button"
                                onClick={() => dPatchV("_bgimg", "")}
                                className="rounded-lg border p-2 text-muted hover:text-red-500"
                                aria-label="x"
                              >
                                <X className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </>
                          ) : (
                            <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[11px] text-muted transition-colors hover:bg-card-hover">
                              <ImagePlus
                                className="h-3.5 w-3.5"
                                strokeWidth={2}
                              />
                              {locale === "fr"
                                ? "Importer"
                                : locale === "en"
                                  ? "Upload"
                                  : "Uploaden"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (
                                    !f ||
                                    !f.type.startsWith("image/") ||
                                    f.size > 4_000_000
                                  )
                                    return;
                                  const r = new FileReader();
                                  r.onload = () =>
                                    dPatchV("_bgimg", String(r.result));
                                  r.readAsDataURL(f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                          {mediaLib.length > 0 && (
                            <MediaPicker
                              lib={mediaLib}
                              onPick={(u) => dPatchV("_bgimg", u)}
                            />
                          )}
                        </div>
                        {!!dvRaw("_bgimg") && (
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-[11px] text-muted">
                              {locale === "fr"
                                ? "Assombrir"
                                : locale === "en"
                                  ? "Darken"
                                  : "Verdonkeren"}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={75}
                              step={5}
                              value={
                                typeof dvRaw("_bgdim") === "number"
                                  ? (dvRaw("_bgdim") as number)
                                  : 35
                              }
                              onChange={(e) =>
                                dPatchV("_bgdim", Number(e.target.value))
                              }
                              className="h-1 flex-1 cursor-pointer accent-accent"
                            />
                            <span className="w-8 text-right font-mono text-[11px] tabular-nums">
                              {typeof dvRaw("_bgdim") === "number"
                                ? (dvRaw("_bgdim") as number)
                                : 35}
                              %
                            </span>
                          </div>
                        )}
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {c.sectBgLabel}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_bg" />
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SECT_TONES.map((tn) => {
                            const sel = dv("_bg") === tn.k;
                            return (
                              <button
                                key={tn.k || "def"}
                                type="button"
                                onClick={() => dPatch("_bg", tn.k)}
                                title={tn.k || "standaard"}
                                className="h-6 w-6 rounded-md border transition-transform hover:scale-110"
                                style={{
                                  background:
                                    sectionToneBg(tn.k, theme) ?? theme.bg,
                                  borderColor: sel
                                    ? "var(--accent)"
                                    : "var(--border)",
                                  outline: sel
                                    ? "2px solid var(--accent)"
                                    : "none",
                                }}
                              />
                            );
                          })}
                        </div>
                        <p className="mb-1.5 mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                          {locale === "fr"
                            ? "Motif de fond"
                            : locale === "en"
                              ? "Background pattern"
                              : "Achtergrond-patroon"}
                          {mob && (
                            <span className="ml-1 text-accent">· mobiel</span>
                          )}
                          <ResetChip base="_pat" />
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PATTERNS.map((pt) => {
                            const sel =
                              (dv("_pat") || "none") === pt;
                            const pc =
                              pt === "none"
                                ? null
                                : patternCss(
                                    {
                                      _pat: pt,
                                      _patC: dvRaw("_patC"),
                                      _patO: 0.5,
                                    },
                                    theme,
                                  );
                            return (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => dPatch("_pat", pt)}
                                title={pt}
                                className="h-7 w-7 rounded-md border transition-transform hover:scale-110"
                                style={{
                                  backgroundColor: theme.bg,
                                  ...(pc || {}),
                                  borderColor: sel
                                    ? "var(--accent)"
                                    : "var(--border)",
                                  outline: sel
                                    ? "2px solid var(--accent)"
                                    : "none",
                                }}
                              />
                            );
                          })}
                          <input
                            type="color"
                            value={
                              typeof dvRaw("_patC") === "string" &&
                              dvRaw("_patC")
                                ? (dvRaw("_patC") as string)
                                : theme.fg
                            }
                            onChange={(e) =>
                              dPatchV("_patC", e.target.value)
                            }
                            title="kleur"
                            className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                          />
                          <input
                            type="range"
                            min={0}
                            max={0.3}
                            step={0.01}
                            value={
                              typeof dvRaw("_patO") === "number"
                                ? (dvRaw("_patO") as number)
                                : 0.08
                            }
                            onChange={(e) =>
                              dPatchV("_patO", Number(e.target.value))
                            }
                            className="h-1 w-20 cursor-pointer accent-accent"
                          />
                        </div>
                      </div>
                    )}
                    <SectionEditor
                      section={openSec}
                      c={c}
                      patch={patchData}
                      theme={theme}
                      pageNames={pages.map((pp) => pp.name)}
                      secLabels={active.sections.map(
                        (ss) => c.sectionLabels[ss.kind],
                      )}
                      onNewPage={addPageNamed}
                      locale={locale}
                      mob={mob}
                    />
                  </div>
                </div>
              );
            })()}
            <Panel
              icon={<Wand2 className="h-4 w-4" />}
              title={
                locale === "fr"
                  ? "Styles en 1 clic"
                  : locale === "en"
                    ? "1-click styles"
                    : "Stijlsets (1 klik)"
              }
            >
              <p className="mb-3 text-[11px] text-muted">
                {locale === "fr"
                  ? "Couleurs, police, coins et boutons d'un coup."
                  : locale === "en"
                    ? "Colours, font, corners and buttons in one go."
                    : "Kleuren, lettertype, hoeken en knoppen in één keer."}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(
                  [
                    {
                      n:
                        locale === "fr"
                          ? "Épuré & moderne"
                          : locale === "en"
                            ? "Clean & modern"
                            : "Strak & modern",
                      bg: "#ffffff",
                      fg: "#0f172a",
                      ac: "#2563eb",
                      fo: "inter",
                      ra: "zacht" as RadiusKey,
                      bs: "zacht" as const,
                    },
                    {
                      n:
                        locale === "fr"
                          ? "Chaleureux & classique"
                          : locale === "en"
                            ? "Warm & classic"
                            : "Warm & klassiek",
                      bg: "#fbf7f0",
                      fg: "#3b2f23",
                      ac: "#b45309",
                      fo: "garamond",
                      ra: "rond" as RadiusKey,
                      bs: "rond" as const,
                    },
                    {
                      n:
                        locale === "fr"
                          ? "Sombre & chic"
                          : locale === "en"
                            ? "Dark & sleek"
                            : "Donker & strak",
                      bg: "#0c0a09",
                      fg: "#f5f5f4",
                      ac: "#f59e0b",
                      fo: "helvetica",
                      ra: "strak" as RadiusKey,
                      bs: "recht" as const,
                    },
                    {
                      n:
                        locale === "fr"
                          ? "Frais & ludique"
                          : locale === "en"
                            ? "Fresh & playful"
                            : "Fris & speels",
                      bg: "#f0fdf4",
                      fg: "#14271d",
                      ac: "#16a34a",
                      fo: "trebuchet",
                      ra: "rond" as RadiusKey,
                      bs: "rond" as const,
                    },
                    {
                      n:
                        locale === "fr"
                          ? "Minimal noir/blanc"
                          : locale === "en"
                            ? "Minimal mono"
                            : "Minimaal zwart/wit",
                      bg: "#fafafa",
                      fg: "#171717",
                      ac: "#525252",
                      fo: "helvetica",
                      ra: "strak" as RadiusKey,
                      bs: "recht" as const,
                    },
                    {
                      n:
                        locale === "fr"
                          ? "Élégant édition"
                          : locale === "en"
                            ? "Editorial elegant"
                            : "Elegant magazine",
                      bg: "#fffdf8",
                      fg: "#1c1917",
                      ac: "#9f1239",
                      fo: "didot",
                      ra: "zacht" as RadiusKey,
                      bs: "zacht" as const,
                    },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.n}
                    type="button"
                    onClick={() => {
                      setTheme((t) => ({
                        ...t,
                        slug: "custom",
                        bg: st.bg,
                        fg: st.fg,
                        accent: st.ac,
                      }));
                      setFont(st.fo);
                      setRadius(st.ra);
                      setBtnShape(st.bs);
                    }}
                    className="flex items-center gap-3 rounded-lg border p-2 text-left text-xs transition-colors hover:border-accent"
                  >
                    <span
                      aria-hidden
                      className="h-7 w-7 shrink-0 rounded-full border"
                      style={{
                        background: `linear-gradient(135deg, ${st.bg} 0 50%, ${st.ac} 50% 100%)`,
                      }}
                    />
                    <span style={{ fontFamily: fontStacks[st.fo] }}>
                      {st.n}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel icon={<Palette className="h-4 w-4" />} title={c.panelTheme}>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.bizName}
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />

              <p className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Logo"
                  : locale === "en"
                    ? "Logo"
                    : "Logo"}
              </p>
              <div className="flex items-center gap-2">
                {logo ? (
                  <span className="flex h-10 flex-1 items-center justify-center rounded-lg border bg-background px-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo}
                      alt=""
                      className="max-h-8 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-xs text-muted transition-colors hover:bg-card-hover">
                    <ImagePlus className="h-4 w-4" strokeWidth={2} />
                    {locale === "fr"
                      ? "Logo importer"
                      : locale === "en"
                        ? "Upload logo"
                        : "Logo uploaden"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (
                          !f ||
                          !f.type.startsWith("image/") ||
                          f.size > 2_000_000
                        )
                          return;
                        const r = new FileReader();
                        r.onload = () => setLogo(String(r.result));
                        r.readAsDataURL(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo("")}
                    className="rounded-lg border p-2 text-muted transition-colors hover:text-red-500"
                    aria-label="x"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
              </div>

              <p className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Menu-positie"
                  : locale === "en"
                    ? "Menu position"
                    : "Menu-positie"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setNavAlign(a)}
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      navAlign === a
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    {a === "left"
                      ? locale === "fr"
                        ? "Gauche"
                        : locale === "en"
                          ? "Left"
                          : "Links"
                      : a === "center"
                        ? locale === "fr"
                          ? "Centre"
                          : "Midden"
                        : locale === "fr"
                          ? "Droite"
                          : locale === "en"
                            ? "Right"
                            : "Rechts"}
                  </button>
                ))}
              </div>

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
              {(() => {
                const cr = contrastRatio(theme.bg, theme.fg);
                if (cr >= 4.5) return null;
                return (
                  <p className="mt-2 rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    ⚠{" "}
                    {locale === "fr"
                      ? `Contraste texte/fond faible (${cr.toFixed(
                          1,
                        )}:1). Visez 4,5:1 voor leesbaarheid.`
                      : locale === "en"
                        ? `Low text/background contrast (${cr.toFixed(
                            1,
                          )}:1). Aim for 4.5:1 for readability.`
                        : `Lage tekst/achtergrond-contrast (${cr.toFixed(
                            1,
                          )}:1). Streef naar 4,5:1 voor leesbaarheid.`}
                  </p>
                );
              })()}

              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.shadesLabel}
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {BG_SHADES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() =>
                      setTheme((t) => ({ ...t, slug: "custom", bg: hex }))
                    }
                    title={hex}
                    aria-label={hex}
                    className="h-7 w-full rounded-md border transition-transform hover:scale-110"
                    style={{
                      background: hex,
                      borderColor:
                        theme.bg.toLowerCase() === hex
                          ? "var(--accent)"
                          : "var(--border)",
                      outline:
                        theme.bg.toLowerCase() === hex
                          ? "2px solid var(--accent)"
                          : "none",
                    }}
                  />
                ))}
              </div>
            </Panel>

            <Panel icon={<Type className="h-4 w-4" />} title={c.panelStyle}>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.fontLabel}
              </p>
              <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
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
                    {FONT_NAMES[f] ?? f}
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
                {locale === "fr"
                  ? "Alignement du texte"
                  : locale === "en"
                    ? "Text alignment"
                    : "Tekst-uitlijning"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAlign(a)}
                    className={`rounded-lg border p-2 text-xs transition-colors ${
                      align === a
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                    style={{ textAlign: a }}
                  >
                    {a === "left" ? "≡" : a === "center" ? "≣" : "≡"}{" "}
                    {a === "left"
                      ? locale === "fr"
                        ? "Gauche"
                        : locale === "en"
                          ? "Left"
                          : "Links"
                      : a === "center"
                        ? locale === "fr"
                          ? "Centre"
                          : "Midden"
                        : locale === "fr"
                          ? "Droite"
                          : locale === "en"
                            ? "Right"
                            : "Rechts"}
                  </button>
                ))}
              </div>
              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Échelle"
                  : locale === "en"
                    ? "Scale"
                    : "Grootte / schaal"}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer accent-accent"
                />
                <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Boutons"
                  : locale === "en"
                    ? "Buttons"
                    : "Knoppen"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["rond", locale === "fr" ? "Rond" : locale === "en" ? "Round" : "Rond"],
                    ["zacht", locale === "fr" ? "Doux" : locale === "en" ? "Soft" : "Zacht"],
                    ["recht", locale === "fr" ? "Droit" : locale === "en" ? "Sharp" : "Recht"],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setBtnShape(k)}
                    className={`border p-2 text-xs transition-colors ${
                      btnShape === k
                        ? "border-accent"
                        : "border-border hover:bg-card-hover"
                    }`}
                    style={{
                      borderRadius:
                        k === "recht"
                          ? "2px"
                          : k === "zacht"
                            ? "10px"
                            : "9999px",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[11px] text-muted">
                  {locale === "fr"
                    ? "Couleur"
                    : locale === "en"
                      ? "Colour"
                      : "Kleur"}
                </span>
                <input
                  type="color"
                  value={btnColor || theme.accent}
                  onChange={(e) => setBtnColor(e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                {btnColor && (
                  <button
                    type="button"
                    onClick={() => setBtnColor("")}
                    className="font-mono text-[10px] text-muted underline"
                  >
                    reset
                  </button>
                )}
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

            <Panel
              icon={<Wand2 className="h-4 w-4" />}
              title={
                locale === "fr"
                  ? "Aide au contenu"
                  : locale === "en"
                    ? "Content help"
                    : "Inhoud-assistentie"
              }
            >
              <p className="mb-3 text-[11px] text-muted">
                {locale === "fr"
                  ? "Répondez à 3 questions : nous montons une site exemple complète. Vous n'avez plus qu'à peaufiner."
                  : locale === "en"
                    ? "Answer 3 questions: we build a full example site. You only need to fine-tune."
                    : "Beantwoord 3 vragen: we zetten een volledige voorbeeldsite klaar. Jij hoeft enkel nog bij te schaven."}
              </p>

              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                1.{" "}
                {locale === "fr"
                  ? "Secteur"
                  : locale === "en"
                    ? "Sector"
                    : "Sector"}
              </p>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorKey)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {(Object.keys(SECTOR_LABELS[locale]) as SectorKey[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {SECTOR_LABELS[locale][k]}
                    </option>
                  ),
                )}
              </select>

              <p className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                2. {locale === "fr" ? "Ton" : locale === "en" ? "Tone" : "Toon"}
              </p>
              <select
                value={tone}
                onChange={(e) =>
                  setTone(e.target.value as "warm" | "zakelijk" | "speels")
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                {(
                  Object.keys(TONE_LABELS[locale]) as (
                    | "warm"
                    | "zakelijk"
                    | "speels"
                  )[]
                ).map((k) => (
                  <option key={k} value={k}>
                    {TONE_LABELS[locale][k]}
                  </option>
                ))}
              </select>

              <p className="mt-4 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                3.{" "}
                {locale === "fr"
                  ? "Pages"
                  : locale === "en"
                    ? "Pages"
                    : "Pagina's"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  Object.keys(PAGE_LABELS[locale]) as PageKey[]
                ).map((pk) => {
                  const on = pageSel.includes(pk);
                  return (
                    <button
                      key={pk}
                      type="button"
                      onClick={() =>
                        setPageSel((s) =>
                          s.includes(pk)
                            ? s.filter((x) => x !== pk)
                            : [...s, pk],
                        )
                      }
                      className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                        on
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted hover:bg-card-hover"
                      }`}
                    >
                      {PAGE_LABELS[locale][pk]}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={buildFullSite}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Wand2 className="h-4 w-4" strokeWidth={2} />
                {locale === "fr"
                  ? "Construire le site complet"
                  : locale === "en"
                    ? "Build the full site"
                    : "Bouw de volledige site"}
              </button>
              <button
                type="button"
                onClick={fillPreset}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
              >
                {locale === "fr"
                  ? "Ou : remplir seulement les champs vides"
                  : locale === "en"
                    ? "Or: only fill the empty fields"
                    : "Of: enkel lege velden invullen"}
              </button>

              <div className="mt-4 border-t pt-4">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {locale === "fr"
                    ? "Ou : depuis mon site actuel"
                    : locale === "en"
                      ? "Or: from my current site"
                      : "Of: vanuit mijn huidige site"}
                </p>
                <p className="mb-2 text-[11px] text-muted">
                  {locale === "fr"
                    ? "On reprend nom, baseline, intro, photos et contact comme première ébauche."
                    : locale === "en"
                      ? "We pull name, tagline, intro, photos and contact as a rough first draft."
                      : "We halen naam, baseline, intro, foto's en contact op als ruwe eerste opzet."}
                </p>
                <input
                  type="url"
                  inputMode="url"
                  value={impUrl}
                  onChange={(e) => setImpUrl(e.target.value)}
                  placeholder="https://mijnsite.be"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={importFromUrl}
                  disabled={impBusy || !impUrl.trim()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-accent px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  {impBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  )}
                  {impBusy
                    ? locale === "fr"
                      ? "Lecture…"
                      : locale === "en"
                        ? "Reading…"
                        : "Bezig met inlezen…"
                    : locale === "fr"
                      ? "Importer mon site"
                      : locale === "en"
                        ? "Import my site"
                        : "Lees mijn site in"}
                </button>
                {impErr && (
                  <p className="mt-2 text-[11px] text-red-500">{impErr}</p>
                )}
              </div>
            </Panel>

            <Panel
              icon={<Check className="h-4 w-4" />}
              title={
                locale === "fr"
                  ? "Presque prêt ?"
                  : locale === "en"
                    ? "Almost done?"
                    : "Bijna klaar?"
              }
            >
              <p className="mb-3 text-[11px] text-muted">
                {locale === "fr"
                  ? "On contrôle votre site et on donne des conseils simples avant l'envoi."
                  : locale === "en"
                    ? "We check your site and give simple tips before you send it."
                    : "We controleren je site en geven eenvoudige tips vóór je verstuurt."}
              </p>
              <button
                type="button"
                onClick={runReview}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                {locale === "fr"
                  ? "Contrôler ma site"
                  : locale === "en"
                    ? "Check my site"
                    : "Controleer mijn site"}
              </button>
              {review && (
                <ul className="mt-3 space-y-1.5">
                  {review.map((r, i) => (
                    <li
                      key={i}
                      className={`flex gap-2 rounded-lg border p-2 text-[11px] leading-relaxed ${
                        r.lvl === "ok"
                          ? "border-accent/30 bg-accent/5 text-foreground"
                          : "border-amber-400/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {r.lvl === "ok" ? (
                          <Check
                            className="h-3.5 w-3.5 text-accent"
                            strokeWidth={2.5}
                          />
                        ) : (
                          "⚠"
                        )}
                      </span>
                      <span>{r.msg}</span>
                    </li>
                  ))}
                  {review.some((r) => r.lvl === "warn") && (
                    <li>
                      <button
                        type="button"
                        onClick={fillPreset}
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-[11px] text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                      >
                        {locale === "fr"
                          ? "Remplir les champs vides automatiquement"
                          : locale === "en"
                            ? "Auto-fill the empty fields"
                            : "Vul lege velden automatisch in"}
                      </button>
                    </li>
                  )}
                </ul>
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
              icon={<Type className="h-4 w-4" />}
              title={
                locale === "fr"
                  ? `SEO — ${active.name}`
                  : locale === "en"
                    ? `SEO — ${active.name}`
                    : `SEO — ${active.name}`
              }
            >
              <p className="mb-3 text-[11px] text-muted">
                {locale === "fr"
                  ? "Ce que Google montre voor deze pagina."
                  : locale === "en"
                    ? "What Google shows for this page."
                    : "Wat Google toont voor deze pagina."}
              </p>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Titre SEO"
                  : locale === "en"
                    ? "SEO title"
                    : "SEO-titel"}{" "}
                <span
                  className={
                    (active.seoTitle?.length ?? 0) > 60
                      ? "text-amber-500"
                      : "text-muted"
                  }
                >
                  {active.seoTitle?.length ?? 0}/60
                </span>
              </label>
              <input
                value={active.seoTitle ?? ""}
                onChange={(e) =>
                  setPageSeo(active.id, { seoTitle: e.target.value })
                }
                placeholder={active.name}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <label className="mb-1 mt-3 block font-mono text-[10px] uppercase tracking-widest text-muted">
                {locale === "fr"
                  ? "Méta-description"
                  : locale === "en"
                    ? "Meta description"
                    : "Meta-omschrijving"}{" "}
                <span
                  className={
                    (active.seoDesc?.length ?? 0) > 160
                      ? "text-amber-500"
                      : "text-muted"
                  }
                >
                  {active.seoDesc?.length ?? 0}/160
                </span>
              </label>
              <textarea
                value={active.seoDesc ?? ""}
                onChange={(e) =>
                  setPageSeo(active.id, { seoDesc: e.target.value })
                }
                rows={3}
                placeholder={
                  locale === "fr"
                    ? "Une phrase accrocheuse…"
                    : locale === "en"
                      ? "One catchy sentence…"
                      : "Eén pakkende zin…"
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Panel>

            <Panel
              icon={<Layers className="h-4 w-4" />}
              title={`${c.panelSections} — ${active.name}`}
            >
              <ul className="space-y-2">
                {sections.map((s, i) => (
                  <li
                    key={s.id}
                    onDragOver={(e) => {
                      if (dragIx !== null) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (dragIx !== null) reorderSection(dragIx, i);
                      setDragIx(null);
                    }}
                    className={`rounded-lg border bg-background transition-colors ${
                      dragIx === i
                        ? "opacity-50"
                        : dragIx !== null
                          ? "hover:border-accent"
                          : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-2 py-2 text-sm">
                      <span
                        draggable
                        onDragStart={() => setDragIx(i)}
                        onDragEnd={() => setDragIx(null)}
                        aria-label="Versleep om te herschikken"
                        title="Versleep om te herschikken"
                        className="cursor-grab px-1 text-muted active:cursor-grabbing"
                      >
                        <GripVertical
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                        />
                      </span>
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
                          onClick={() => copySection(s)}
                          aria-label="kopieer"
                          title={
                            locale === "fr"
                              ? "Copier le bloc"
                              : locale === "en"
                                ? "Copy block"
                                : "Blok kopiëren"
                          }
                          className={`rounded p-1 hover:text-foreground ${
                            clip?.id === s.id ? "text-accent" : ""
                          }`}
                        >
                          <Send className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => sectionToAllPages(s)}
                          aria-label="alle pagina's"
                          title={
                            locale === "fr"
                              ? "Vers toutes les pages"
                              : locale === "en"
                                ? "To all pages"
                                : "Naar alle pagina's"
                          }
                          className="rounded p-1 hover:text-foreground"
                        >
                          <Layers className="h-3.5 w-3.5" strokeWidth={2} />
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
              ) : designId ? (
                <form
                  className="mt-3"
                  action={() =>
                    startSend(async () => {
                      try {
                        await saveDesign(
                          designId,
                          {
                            businessName,
                            theme,
                            font,
                            radius,
                            pages,
                            activeId,
                            locale,
                          },
                          businessName,
                        );
                        const fd = new FormData();
                        fd.set("id", designId);
                        fd.set("locale", locale);
                        await sendDesign(fd);
                        setSent("ok");
                      } catch {
                        setSent("err");
                      }
                    })
                  }
                >
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={2}
                      />
                    ) : (
                      <Send className="h-4 w-4" strokeWidth={2} />
                    )}
                    {pending ? c.buildSending : c.buildSend}
                  </button>
                  {sent === "err" && (
                    <p className="mt-2 text-xs text-red-500">{c.buildErr}</p>
                  )}
                  {designId && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          void navigator.clipboard.writeText(
                            `${location.origin}/${locale}/preview/${designId}`,
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch {
                          /* clipboard niet beschikbaar */
                        }
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      )}
                      {copied
                        ? locale === "fr"
                          ? "Lien copié"
                          : locale === "en"
                            ? "Link copied"
                            : "Link gekopieerd"
                        : locale === "fr"
                          ? "Copier le lien d'aperçu"
                          : locale === "en"
                            ? "Copy preview link"
                            : "Kopieer voorbeeld-link"}
                    </button>
                  )}
                </form>
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
                        font: FONT_NAMES[font] ?? font,
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
                        snapshot: {
                          businessName,
                          theme,
                          font,
                          radius,
                          align,
                          scale,
                          logo,
                          navAlign,
                          btnShape,
                          btnColor,
                          pages,
                          activeId,
                          locale,
                        },
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

          <div className="self-start rounded-2xl border bg-card">
            <div
              className={`sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-t-2xl border-b bg-background px-4 py-3 ${
                designId ? "lg:top-4" : "lg:top-24"
              }`}
            >
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
                <span
                  className="flex items-center overflow-hidden rounded-full border"
                  data-h={histTick}
                >
                  <button
                    type="button"
                    onClick={undo}
                    disabled={histRef.current.length === 0}
                    aria-label="Ongedaan maken"
                    title={
                      locale === "fr"
                        ? "Annuler (Ctrl+Z)"
                        : locale === "en"
                          ? "Undo (Ctrl+Z)"
                          : "Ongedaan (Ctrl+Z)"
                    }
                    className="px-2.5 py-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5 -rotate-90" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={redoRef.current.length === 0}
                    aria-label="Opnieuw"
                    title={
                      locale === "fr"
                        ? "Rétablir (Ctrl+Maj+Z)"
                        : locale === "en"
                          ? "Redo (Ctrl+Shift+Z)"
                          : "Opnieuw (Ctrl+Shift+Z)"
                    }
                    className="border-l px-2.5 py-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5 rotate-90" strokeWidth={2} />
                  </button>
                </span>
                {clip && (
                  <button
                    type="button"
                    onClick={pasteSection}
                    title={
                      locale === "fr"
                        ? "Coller le bloc copié"
                        : locale === "en"
                          ? "Paste copied block"
                          : "Gekopieerd blok plakken"
                    }
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-accent transition-colors hover:bg-accent/10"
                  >
                    <Copy className="h-3 w-3" strokeWidth={2} />
                    {locale === "fr"
                      ? "Coller"
                      : locale === "en"
                        ? "Paste"
                        : "Plakken"}
                  </button>
                )}
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
              className={`overflow-hidden rounded-b-2xl ${
                device === "mobile"
                  ? "flex justify-center bg-card-hover p-4"
                  : ""
              }`}
            >
              <div
                data-dev={device}
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
              <style>{`.bldr-frame [class*="rounded"]{border-radius:${radiusPx[radius]} !important}.bldr-frame{zoom:${scale}}.bldr-frame h1,.bldr-frame h2,.bldr-frame h3,.bldr-frame h4,.bldr-frame p,.bldr-frame li{text-align:${align}}.bldr-frame [data-sp="compact"]>div{padding-top:1.25rem;padding-bottom:1.25rem}.bldr-frame [data-sp="ruim"]>div{padding-top:5rem;padding-bottom:5rem}.bldr-frame .bldr-btn{border-radius:${btnShape === "recht" ? "2px" : btnShape === "zacht" ? "12px" : "9999px"} !important;${btnColor ? `background:${btnColor} !important;` : ""}}@keyframes svmIn{from{opacity:0}to{opacity:1}}@keyframes svmInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes svmInZoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}.bldr-frame [data-anim="fade"]{animation:svmIn .7s ease both}.bldr-frame [data-anim="up"]{animation:svmInUp .7s cubic-bezier(.2,.7,.2,1) both}.bldr-frame [data-anim="zoom"]{animation:svmInZoom .6s cubic-bezier(.2,.7,.2,1) both}.bldr-frame [data-hover="1"] [class*="rounded-lg"],.bldr-frame [data-hover="1"] [class*="rounded-2xl"]{transition:transform .25s ease,box-shadow .25s ease}.bldr-frame [data-hover="1"] [class*="rounded-lg"]:hover,.bldr-frame [data-hover="1"] [class*="rounded-2xl"]:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.12)}.bldr-frame[data-dev="mobile"] [data-hidem="1"]{display:none}.bldr-frame [data-anim="fade"],.bldr-frame [data-anim="up"],.bldr-frame [data-anim="zoom"]{animation-play-state:paused}.bldr-frame [data-anim].svm-seen{animation-play-state:running}.bldr-frame [data-talign="left"] :is(h1,h2,h3,h4,p,li){text-align:left}.bldr-frame [data-talign="center"] :is(h1,h2,h3,h4,p,li){text-align:center}.bldr-frame [data-talign="right"] :is(h1,h2,h3,h4,p,li){text-align:right}.bldr-frame [data-tsc="s"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:.86em}.bldr-frame [data-tsc="l"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.15em}.bldr-frame [data-tsc="xl"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.32em}`}</style>
              <nav
                className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-8 py-4"
                style={{ borderColor: `${theme.fg}1a` }}
              >
                <span className="flex shrink-0 items-center text-sm font-semibold tracking-tight">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={businessName}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    businessName
                  )}
                </span>
                <span
                  className={`flex flex-wrap gap-x-4 gap-y-1 text-xs ${
                    navAlign === "center"
                      ? "mx-auto"
                      : navAlign === "left"
                        ? "ml-6"
                        : "ml-auto"
                  }`}
                >
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
                sections.map((s) => {
                  const rd = resolveData(s.data, device === "mobile");
                  return (
                  <div
                    key={s.id}
                    data-sp={String(rd._sp ?? "")}
                    data-anim={String(rd._anim ?? "")}
                    data-hover={rd._hover ? "1" : ""}
                    data-hidem={s.data._hideM ? "1" : ""}
                    data-talign={String(rd._talign ?? "")}
                    data-tsc={String(rd._tsc ?? "")}
                    className={`group/sec relative cursor-pointer transition-shadow ${
                      openId === s.id
                        ? "ring-2 ring-inset ring-accent"
                        : "hover:ring-1 hover:ring-inset hover:ring-accent/40"
                    }`}
                    onClickCapture={() => {
                      if (openId !== s.id) setOpenId(s.id);
                    }}
                    style={{
                      backgroundColor: sectionToneBg(rd._bg, theme),
                      ...(patternCss(rd, theme) || {}),
                      ...(typeof rd._tcol === "string" && rd._tcol
                        ? { color: rd._tcol as string }
                        : {}),
                      ...(typeof rd._bgimg === "string" && rd._bgimg
                        ? {
                            backgroundImage: `url(${rd._bgimg})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {}),
                    }}
                  >
                    {typeof rd._bgimg === "string" && rd._bgimg && (
                      <div
                        className="pointer-events-none absolute inset-0 z-0"
                        style={{
                          background: `rgba(0,0,0,${
                            (typeof rd._bgdim === "number"
                              ? rd._bgdim
                              : 35) / 100
                          })`,
                        }}
                      />
                    )}
                    <div className="relative z-[1]">
                      <PreviewSection
                        kind={s.kind}
                        data={rd}
                        theme={theme}
                        businessName={businessName}
                        images={images}
                        p={c.preview}
                        edit={(patch) => patchData(s.id, patch)}
                        lib={mediaLib}
                      />
                    </div>
                    <SectionOverlays
                      data={rd}
                      theme={theme}
                      p={c.preview}
                      edit={(patch) => patchData(s.id, patch)}
                    />
                  </div>
                  );
                })
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!designId && (
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
      )}
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

function Rng({
  label,
  value,
  def,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: unknown;
  def: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  const v = typeof value === "number" ? value : def;
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-[11px] text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-28 cursor-pointer accent-accent"
      />
      <span className="w-8 text-right font-mono text-[11px] tabular-nums">
        {v}
      </span>
    </div>
  );
}

// Editor voor de herbruikbare sectiekop: ondertekst, streep, icoon in
// het midden van de streep en alle tussenruimtes.
function HeadEditor({
  d,
  set,
  locale,
  accent,
}: {
  d: SectionData;
  set: (k: string, v: unknown) => void;
  locale: Locale;
  accent: string;
}) {
  const sv = (k: string) => (d[k] == null ? "" : String(d[k]));
  const showDiv = d._div === 1 || d._div === true;
  const L =
    locale === "fr"
      ? {
          sub: "Sous-titre",
          div: "Ligne de séparation",
          icon: "Icône au milieu",
          padT: "Espace au-dessus",
          gap: "Sous le titre",
          dgap: "Autour de la ligne",
          below: "Avant le contenu",
        }
      : locale === "en"
        ? {
            sub: "Subtitle",
            div: "Divider line",
            icon: "Icon in the middle",
            padT: "Space above",
            gap: "Below title",
            dgap: "Around the line",
            below: "Before content",
          }
        : {
            sub: "Ondertekst",
            div: "Streep / scheidingslijn",
            icon: "Icoon in het midden",
            padT: "Ruimte boven",
            gap: "Onder titel",
            dgap: "Rond de streep",
            below: "Voor de inhoud",
          };
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <Txt
        label={L.sub}
        value={sv("_sub")}
        area
        onChange={(v) => set("_sub", v)}
      />
      <button
        type="button"
        onClick={() => set("_div", showDiv ? 0 : 1)}
        className={`flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
          showDiv
            ? "border-accent bg-accent/10 text-foreground"
            : "border-border text-muted hover:bg-card-hover"
        }`}
      >
        {showDiv ? "✓ " : ""}
        {L.div}
      </button>
      {showDiv && (
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            {L.icon}
          </p>
          <IconField
            value={sv("_divIcon")}
            onPick={(k) => set("_divIcon", k)}
            accent={accent}
          />
        </div>
      )}
      <Rng
        label={L.padT}
        value={d._hPadT}
        def={0}
        min={0}
        max={80}
        step={2}
        onChange={(n) => set("_hPadT", n)}
      />
      <Rng
        label={L.gap}
        value={d._hGap}
        def={8}
        min={0}
        max={40}
        step={2}
        onChange={(n) => set("_hGap", n)}
      />
      {showDiv && (
        <Rng
          label={L.dgap}
          value={d._hDivGap}
          def={16}
          min={0}
          max={48}
          step={2}
          onChange={(n) => set("_hDivGap", n)}
        />
      )}
      <Rng
        label={L.below}
        value={d._hBelow}
        def={0}
        min={0}
        max={64}
        step={2}
        onChange={(n) => set("_hBelow", n)}
      />
    </div>
  );
}

type LinkVal = { k: "none" | "page" | "section" | "url"; v: string };

// Herbruikbare link-kiezer: koppel een knop/foto/balk aan een
// pagina, een sectie, een webadres of maak meteen een nieuwe pagina.
function LinkField({
  value,
  onChange,
  p,
  pageNames,
  secLabels,
  onNewPage,
}: {
  value: unknown;
  onChange: (l: LinkVal) => void;
  p: Preview;
  pageNames: string[];
  secLabels: string[];
  onNewPage: (name: string) => void;
}) {
  const lv: LinkVal =
    value && typeof value === "object" && "k" in (value as object)
      ? (value as LinkVal)
      : { k: "none", v: "" };
  const sel =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none";
  return (
    <div className="mt-3">
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
        {p.linkLabel}
      </p>
      <select
        value={lv.k}
        onChange={(e) =>
          onChange({ k: e.target.value as LinkVal["k"], v: "" })
        }
        className={sel}
      >
        <option value="none">{p.linkNone}</option>
        <option value="page">{p.linkPage}</option>
        <option value="section">{p.linkSection}</option>
        <option value="url">{p.linkUrl}</option>
        <option value="new">{p.linkNew}</option>
      </select>
      {lv.k === "page" && (
        <select
          value={lv.v}
          onChange={(e) => onChange({ k: "page", v: e.target.value })}
          className={`${sel} mt-2`}
        >
          <option value="">—</option>
          {pageNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
      {lv.k === "section" && (
        <select
          value={lv.v}
          onChange={(e) => onChange({ k: "section", v: e.target.value })}
          className={`${sel} mt-2`}
        >
          <option value="">—</option>
          {secLabels.map((n, i) => (
            <option key={`${n}-${i}`} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
      {lv.k === "url" && (
        <input
          type="url"
          value={lv.v}
          onChange={(e) => onChange({ k: "url", v: e.target.value })}
          placeholder="https://…"
          className={`${sel} mt-2`}
        />
      )}
      {(lv.k as string) === "new" && (
        <input
          type="text"
          defaultValue=""
          placeholder={p.linkNewPh}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          onBlur={(e) => {
            const nm = e.target.value.trim();
            if (nm) {
              onNewPage(nm);
              onChange({ k: "page", v: nm });
            }
          }}
          className={`${sel} mt-2`}
        />
      )}
    </div>
  );
}

// Alle hero-instellingen, in de zijbalk (verschijnt bovenaan zodra je
// het hero-blok aanklikt). De tekst zelf bewerk je op het doek.
function HeroSettings({
  data,
  edit,
  theme,
  p,
  pageNames,
  secLabels,
  onNewPage,
  mob,
  locale,
}: {
  data: SectionData;
  edit: (patch: SectionData) => void;
  theme: Theme;
  p: Preview;
  pageNames: string[];
  secLabels: string[];
  onNewPage: (name: string) => void;
  mob: boolean;
  locale: Locale;
}) {
  const slidesArr = Array.isArray(data.slides)
    ? (data.slides as unknown[])
    : [];
  const nSlides = Math.max(
    1,
    slidesArr.length ||
      (Array.isArray(data.bgs) ? (data.bgs as unknown[]).length : 0) ||
      1,
  );
  const hH =
    typeof data.hH === "string" &&
    ["s", "m", "l", "xl", "full"].includes(data.hH)
      ? String(data.hH)
      : "m";
  // Mobiel-onafhankelijke hoogte: hHM overschrijft enkel op gsm.
  const hOver = mob && data.hHM !== undefined;
  const hHEff =
    hOver &&
    typeof data.hHM === "string" &&
    ["s", "m", "l", "xl", "full"].includes(data.hHM)
      ? String(data.hHM)
      : hH;
  const hCard = data.hCard === 1 || data.hCard === true;
  const hBlur = typeof data.hBlur === "number" ? data.hBlur : 0;
  const hCardW = typeof data.hCardW === "number" ? data.hCardW : 86;
  const hCardColor =
    typeof data.hCardColor === "string" && data.hCardColor
      ? (data.hCardColor as string)
      : "";
  const hCardA = typeof data.hCardA === "number" ? data.hCardA : 34;
  const showCard = hCard || hBlur > 0;
  const hCap = data.hCap === 1 || data.hCap === true;
  const hCapPos =
    data.hCapPos === "br" ||
    data.hCapPos === "tl" ||
    data.hCapPos === "tr"
      ? String(data.hCapPos)
      : "bl";
  const slideSec =
    typeof data.slideSec === "number" && data.slideSec >= 2
      ? data.slideSec
      : 4;
  const trans =
    typeof data.trans === "string" &&
    ["fade", "slide", "slideup", "zoom", "blur", "none"].includes(data.trans)
      ? String(data.trans)
      : "fade";
  const hTransMs =
    typeof data.hTransMs === "number" ? data.hTransMs : 700;

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <p className="mb-1.5 mt-3 font-mono text-[10px] uppercase tracking-widest text-muted first:mt-0">
      {children}
    </p>
  );
  const seg = (active: boolean) =>
    `rounded-md border px-2 py-1 text-xs transition-colors ${
      active
        ? "border-accent bg-accent/10 text-foreground"
        : "border-border text-muted hover:bg-card-hover"
    }`;

  return (
    <div className="space-y-1">
      <p className="mb-2 text-[11px] text-muted">
        {p.heroMove}. {p.heroDrop}.
      </p>

      <Lbl>
        {p.heroHeight}
        {mob && <span className="ml-1 text-accent">· mobiel</span>}
        {hOver && (
          <button
            type="button"
            onClick={() => edit({ hHM: undefined })}
            className="ml-2 font-mono text-[9px] lowercase tracking-normal text-accent underline"
          >
            {locale === "fr"
              ? "↺ comme desktop"
              : locale === "en"
                ? "↺ same as desktop"
                : "↺ zelfde als desktop"}
          </button>
        )}
      </Lbl>
      <div className="flex gap-1.5">
        {(["s", "m", "l", "xl", "full"] as const).map((hk) => (
          <button
            key={hk}
            type="button"
            onClick={() => edit(mob ? { hHM: hk } : { hH: hk })}
            className={seg(hHEff === hk)}
          >
            {hk === "full" ? "100%" : hk.toUpperCase()}
          </button>
        ))}
      </div>

      <Lbl>{p.heroTrans}</Lbl>
      <select
        value={trans}
        onChange={(e) => edit({ trans: e.target.value })}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
      >
        <option value="fade">{p.transFade}</option>
        <option value="slide">{p.transSlide}</option>
        <option value="slideup">{p.transUp}</option>
        <option value="zoom">{p.transZoom}</option>
        <option value="blur">{p.transBlur}</option>
        <option value="none">{p.transNone}</option>
      </select>
      {trans !== "none" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-muted">{p.heroTransDur}</span>
          <input
            type="range"
            min={150}
            max={1500}
            step={50}
            value={hTransMs}
            onChange={(e) => edit({ hTransMs: Number(e.target.value) })}
            className="h-1 flex-1 cursor-pointer accent-accent"
          />
          <span className="w-12 text-right font-mono text-[11px] tabular-nums">
            {(hTransMs / 1000).toFixed(2)}s
          </span>
        </div>
      )}
      {nSlides > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-muted">{p.heroDur}</span>
          <input
            type="range"
            min={2}
            max={10}
            step={0.5}
            value={slideSec}
            onChange={(e) => edit({ slideSec: Number(e.target.value) })}
            className="h-1 flex-1 cursor-pointer accent-accent"
          />
          <span className="w-12 text-right font-mono text-[11px] tabular-nums">
            {slideSec.toFixed(1)}s
          </span>
        </div>
      )}

      <Lbl>{p.heroCard}</Lbl>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => edit({ hCard: hCard ? 0 : 1 })}
          className={seg(hCard)}
        >
          <Square className="mr-1 inline h-3 w-3" strokeWidth={2.5} />
          {hCard ? "✓" : "—"}
        </button>
        <span className="text-[11px] text-muted">{p.heroBlur}</span>
        <input
          type="range"
          min={0}
          max={16}
          step={1}
          value={hBlur}
          onChange={(e) => edit({ hBlur: Number(e.target.value) })}
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="w-9 text-right font-mono text-[11px] tabular-nums">
          {hBlur}px
        </span>
      </div>
      {showCard && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] text-muted">
              {p.heroCardW}
            </span>
            <input
              type="range"
              min={40}
              max={100}
              step={2}
              value={hCardW}
              onChange={(e) => edit({ hCardW: Number(e.target.value) })}
              className="h-1 flex-1 cursor-pointer accent-accent"
            />
            <span className="w-9 text-right font-mono text-[11px] tabular-nums">
              {hCardW}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] text-muted">
              {p.heroCardOpacity}
            </span>
            <input
              type="range"
              min={0}
              max={95}
              step={5}
              value={hCardA}
              onChange={(e) => edit({ hCardA: Number(e.target.value) })}
              className="h-1 flex-1 cursor-pointer accent-accent"
            />
            <span className="w-9 text-right font-mono text-[11px] tabular-nums">
              {hCardA}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] text-muted">
              {p.heroCardColor}
            </span>
            <input
              type="color"
              value={hCardColor || theme.fg}
              onChange={(e) => edit({ hCardColor: e.target.value })}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            {hCardColor && (
              <button
                type="button"
                onClick={() => edit({ hCardColor: "" })}
                className="font-mono text-[10px] text-muted underline"
              >
                reset
              </button>
            )}
          </div>
        </div>
      )}

      <Lbl>{p.heroCap}</Lbl>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => edit({ hCap: hCap ? 0 : 1 })}
          className={seg(hCap)}
        >
          {hCap ? "✓" : "—"}
        </button>
        {hCap &&
          (["tl", "tr", "bl", "br"] as const).map((cn) => (
            <button
              key={cn}
              type="button"
              onClick={() => edit({ hCapPos: cn })}
              className={seg(hCapPos === cn)}
            >
              {cn === "tl"
                ? "◰"
                : cn === "tr"
                  ? "◳"
                  : cn === "bl"
                    ? "◱"
                    : "◲"}
            </button>
          ))}
      </div>

      {showCard && (
        <>
          <Lbl>{p.heroCardStyle}</Lbl>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["glass", "Glas"],
                ["solid", "Vol"],
                ["outline", "Lijn"],
                ["soft", "Zacht"],
                ["flat", "Plat"],
              ] as const
            ).map(([k, lbl]) => {
              const cur =
                (typeof data.hCardStyle === "string" && data.hCardStyle) ||
                "glass";
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => edit({ hCardStyle: k })}
                  className={seg(cur === k)}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </>
      )}

      {nSlides > 1 && (
        <>
          <Lbl>{p.heroRotation}</Lbl>
          <select
            value={
              data.slideOrder === "rand" || data.slideOrder === "pong"
                ? String(data.slideOrder)
                : "seq"
            }
            onChange={(e) => edit({ slideOrder: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="seq">{p.optSeq}</option>
            <option value="rand">{p.optRand}</option>
            <option value="pong">{p.optPong}</option>
          </select>
        </>
      )}

      <LinkField
        value={data._lnk}
        onChange={(l) => edit({ _lnk: l })}
        p={p}
        pageNames={pageNames}
        secLabels={secLabels}
        onNewPage={onNewPage}
      />
    </div>
  );
}

function SectionEditor({
  section,
  c,
  patch,
  theme,
  pageNames,
  secLabels,
  onNewPage,
  locale,
  mob,
}: {
  section: Section;
  c: Loc;
  patch: (id: string, p: SectionData) => void;
  theme: Theme;
  pageNames: string[];
  secLabels: string[];
  onNewPage: (name: string) => void;
  locale: Locale;
  mob: boolean;
}) {
  const f = c.fields;
  const d = section.data;
  if (section.kind === "hero")
    return (
      <HeroSettings
        data={d}
        edit={(pp) => patch(section.id, pp)}
        theme={theme}
        p={c.preview}
        pageNames={pageNames}
        secLabels={secLabels}
        onNewPage={onNewPage}
        mob={mob}
        locale={locale}
      />
    );
  const linkable = ["cta", "newsletter", "banner"].includes(section.kind);
  const LinkBlock = linkable ? (
    <LinkField
      value={d._lnk}
      onChange={(l) => patch(section.id, { _lnk: l })}
      p={c.preview}
      pageNames={pageNames}
      secLabels={secLabels}
      onNewPage={onNewPage}
    />
  ) : null;
  const set = (k: string, v: unknown) => patch(section.id, { [k]: v });
  const str = (k: string) => (d[k] == null ? "" : String(d[k]));
  const items = Array.isArray(d.items)
    ? (d.items as Record<string, string>[])
    : [];
  const setItems = (next: Record<string, string>[]) =>
    patch(section.id, { items: next });
  const tmpl = itemTemplate[section.kind];

  const simple: Record<string, string[]> = {
    about: ["title", "text"],
    cta: ["title", "text", "button"],
    richtext: ["title", "text"],
    banner: ["text"],
    newsletter: ["title", "text", "button"],
    gallery: ["title"],
    map: ["title", "address", "embed"],
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
        {section.kind === "gallery" && (
          <HeadEditor
            d={d}
            set={set}
            locale={locale}
            accent={theme.accent}
          />
        )}
        {LinkBlock}
      </div>
    );
  }

  if (section.kind === "contact") {
    const cf: Record<string, string>[] = items.length
      ? items
      : [
          { label: "Je naam", type: "text", req: "1" },
          { label: "E-mail", type: "email", req: "1" },
          { label: "Je bericht", type: "textarea", req: "1" },
        ];
    const setF = (i: number, patch: Record<string, string>) =>
      setItems(cf.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    const sideCard = d._card === 1 || d._card === true;
    const L =
      locale === "fr"
        ? {
            info: "Coordonnées",
            fields: "Champs du formulaire",
            add: "Champ +",
            req: "Obligatoire",
            box: "Couleur du champ",
            shape: "Forme",
            btn: "Bouton",
            btnC: "Couleur bouton",
            btnT: "Texte bouton",
            card: "Carte à côté du formulaire",
            cardT: "Titre carte",
            cardTx: "Texte carte",
            cardBg: "Fond carte",
            ok: "Bericht — succès",
            okC: "Couleur succès",
            err: "Bericht — erreur",
            errC: "Couleur erreur",
            soft: "Doux",
            round: "Rond",
            sharp: "Droit",
          }
        : locale === "en"
          ? {
              info: "Contact details",
              fields: "Form fields",
              add: "Field +",
              req: "Required",
              box: "Field colour",
              shape: "Shape",
              btn: "Button",
              btnC: "Button colour",
              btnT: "Button text colour",
              card: "Card beside the form",
              cardT: "Card title",
              cardTx: "Card text",
              cardBg: "Card background",
              ok: "Message — success",
              okC: "Success colour",
              err: "Message — error",
              errC: "Error colour",
              soft: "Soft",
              round: "Round",
              sharp: "Square",
            }
          : {
              info: "Contactgegevens",
              fields: "Formuliervelden",
              add: "Veld +",
              req: "Verplicht",
              box: "Kleur veld",
              shape: "Vorm",
              btn: "Knop",
              btnC: "Kleur knop",
              btnT: "Tekstkleur knop",
              card: "Kaart naast het formulier",
              cardT: "Titel kaart",
              cardTx: "Tekst kaart",
              cardBg: "Achtergrond kaart",
              ok: "Melding — verzonden",
              okC: "Kleur 'verzonden'",
              err: "Melding — fout",
              errC: "Kleur 'fout'",
              soft: "Zacht",
              round: "Rond",
              sharp: "Recht",
            };
    const ColorRow = ({
      label,
      k,
      fallback,
    }: {
      label: string;
      k: string;
      fallback: string;
    }) => (
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[11px] text-muted">{label}</span>
        <input
          type="color"
          value={str(k) || fallback}
          onChange={(e) => set(k, e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        {str(k) && (
          <button
            type="button"
            onClick={() => set(k, "")}
            className="font-mono text-[10px] text-muted underline"
          >
            reset
          </button>
        )}
      </div>
    );
    const shapeSeg = (k: string, def: string) => (
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ["zacht", L.soft],
            ["rond", L.round],
            ["recht", L.sharp],
          ] as const
        ).map(([val, lbl]) => {
          const cur = (str(k) || def) === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => set(k, val)}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                cur
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted hover:bg-card-hover"
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    );
    return (
      <div className="space-y-3">
        <Txt
          label={f.title}
          value={str("title")}
          onChange={(v) => set("title", v)}
        />
        <HeadEditor d={d} set={set} locale={locale} accent={theme.accent} />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {L.info}
        </p>
        <Txt
          label={f.emailAddr}
          value={str("emailAddr")}
          onChange={(v) => set("emailAddr", v)}
        />
        <Txt
          label={f.phone}
          value={str("phone")}
          onChange={(v) => set("phone", v)}
        />
        <Txt
          label={f.address}
          value={str("address")}
          onChange={(v) => set("address", v)}
          area
        />

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {L.fields}
        </p>
        {cf.map((fl, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-2.5">
            <div className="flex items-center gap-1.5">
              <input
                value={fl.label || ""}
                onChange={(e) => setF(i, { label: e.target.value })}
                placeholder={`Veld ${i + 1}`}
                className={fieldCls}
              />
              <button
                type="button"
                onClick={() => setItems(cf.filter((_, j) => j !== i))}
                className="rounded p-1 text-muted hover:text-red-500"
                aria-label="x"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={fl.type || "text"}
                onChange={(e) => setF(i, { type: e.target.value })}
                className={fieldCls}
              >
                <option value="text">Tekst</option>
                <option value="email">E-mail</option>
                <option value="tel">Telefoon</option>
                <option value="number">Getal</option>
                <option value="textarea">Tekstvak</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setF(i, { req: fl.req === "1" ? "0" : "1" })
                }
                className={`shrink-0 rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
                  fl.req === "1"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border text-muted hover:bg-card-hover"
                }`}
              >
                {fl.req === "1" ? "✓ " : ""}
                {L.req}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-[11px] text-muted">{L.box}</span>
              <input
                type="color"
                value={fl.bg || "#ffffff"}
                onChange={(e) => setF(i, { bg: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              {fl.bg && (
                <button
                  type="button"
                  onClick={() => setF(i, { bg: "" })}
                  className="font-mono text-[10px] text-muted underline"
                >
                  reset
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setItems([...cf, { label: "", type: "text", req: "0" }])
          }
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-[11px] text-muted transition-colors hover:bg-card-hover"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          {L.add}
        </button>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {L.shape}
        </p>
        {shapeSeg("_fldShape", "zacht")}

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {L.btn}
        </p>
        <Txt
          label={L.btn}
          value={str("button")}
          onChange={(v) => set("button", v)}
        />
        {shapeSeg("_btnShape", "rond")}
        <ColorRow label={L.btnC} k="_btnColor" fallback={theme.accent} />
        <ColorRow label={L.btnT} k="_btnTxt" fallback={theme.bg} />

        <button
          type="button"
          onClick={() => set("_card", sideCard ? 0 : 1)}
          className={`flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
            sideCard
              ? "border-accent bg-accent/10 text-foreground"
              : "border-border text-muted hover:bg-card-hover"
          }`}
        >
          {sideCard ? "✓ " : ""}
          {L.card}
        </button>
        {sideCard && (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <Txt
              label={L.cardT}
              value={str("_cardTitle")}
              onChange={(v) => set("_cardTitle", v)}
            />
            <Txt
              label={L.cardTx}
              value={str("_cardText")}
              onChange={(v) => set("_cardText", v)}
              area
            />
            <ColorRow
              label={L.cardBg}
              k="_cardBg"
              fallback="#f5f5f5"
            />
          </div>
        )}

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          {L.ok}
        </p>
        <Txt
          label={L.ok}
          value={str("_okText")}
          onChange={(v) => set("_okText", v)}
        />
        <ColorRow label={L.okC} k="_okColor" fallback="#16a34a" />
        <Txt
          label={L.err}
          value={str("_errText")}
          onChange={(v) => set("_errText", v)}
        />
        <ColorRow label={L.errC} k="_errColor" fallback="#ef4444" />
      </div>
    );
  }

  if (section.kind === "footer") {
    type FCol = { title?: string; links?: { label?: string }[] };
    const cols: FCol[] = Array.isArray(d.cols) ? (d.cols as FCol[]) : [];
    const setCols = (next: FCol[]) => patch(section.id, { cols: next });
    const fp = c.preview;
    return (
      <div className="space-y-3">
        <Txt
          label={fp.footerAbout}
          value={str("about")}
          area
          onChange={(v) => set("about", v)}
        />
        {cols.map((col, ci) => (
          <div key={ci} className="rounded-lg border p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                #{ci + 1}
              </span>
              <button
                type="button"
                onClick={() => setCols(cols.filter((_, j) => j !== ci))}
                className="rounded p-0.5 text-muted hover:text-red-500"
                aria-label="x"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-2">
              <Txt
                label={fp.footerColTitle}
                value={col.title ?? ""}
                onChange={(v) =>
                  setCols(
                    cols.map((x, j) =>
                      j === ci ? { ...x, title: v } : x,
                    ),
                  )
                }
              />
              {(col.links ?? []).map((lk, li) => (
                <div key={li} className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <Txt
                      label={`${fp.footerLink} ${li + 1}`}
                      value={lk.label ?? ""}
                      onChange={(v) =>
                        setCols(
                          cols.map((x, j) =>
                            j === ci
                              ? {
                                  ...x,
                                  links: (x.links ?? []).map((y, k) =>
                                    k === li ? { ...y, label: v } : y,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCols(
                        cols.map((x, j) =>
                          j === ci
                            ? {
                                ...x,
                                links: (x.links ?? []).filter(
                                  (_, k) => k !== li,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                    className="mt-5 rounded p-0.5 text-muted hover:text-red-500"
                    aria-label="x"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
              {(col.links ?? []).length < 8 && (
                <button
                  type="button"
                  onClick={() =>
                    setCols(
                      cols.map((x, j) =>
                        j === ci
                          ? {
                              ...x,
                              links: [...(x.links ?? []), { label: "" }],
                            }
                          : x,
                      ),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted hover:bg-card-hover hover:text-foreground"
                >
                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                  {fp.footerAddLink}
                </button>
              )}
            </div>
          </div>
        ))}
        {cols.length < 4 && (
          <button
            type="button"
            onClick={() =>
              setCols([
                ...cols,
                { title: fp.footerColLinks, links: [{ label: "" }] },
              ])
            }
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted hover:bg-card-hover hover:text-foreground"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            {fp.footerAddCol}
          </button>
        )}
        <Txt
          label={fp.footerNote}
          value={str("note")}
          onChange={(v) => set("note", v)}
        />
      </div>
    );
  }

  if (section.kind === "form") {
    const types: { v: string; nl: string; fr: string; en: string }[] = [
      { v: "text", nl: "Tekst", fr: "Texte", en: "Text" },
      { v: "email", nl: "E-mail", fr: "E-mail", en: "Email" },
      { v: "tel", nl: "Telefoon", fr: "Téléphone", en: "Phone" },
      { v: "number", nl: "Getal", fr: "Nombre", en: "Number" },
      { v: "date", nl: "Datum", fr: "Date", en: "Date" },
      { v: "textarea", nl: "Tekstvak", fr: "Zone de texte", en: "Textarea" },
    ];
    return (
      <div className="space-y-3">
        <Txt
          label={f.title}
          value={str("title")}
          onChange={(v) => set("title", v)}
        />
        <Txt
          label={c.preview.send}
          value={str("button")}
          onChange={(v) => set("button", v)}
        />
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
            <Txt
              label="Label"
              value={it.label ?? ""}
              onChange={(v) =>
                setItems(
                  items.map((x, j) =>
                    j === idx ? { ...x, label: v } : x,
                  ),
                )
              }
            />
            <select
              value={it.type ?? "text"}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === idx ? { ...x, type: e.target.value } : x,
                  ),
                )
              }
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            >
              {types.map((tp) => (
                <option key={tp.v} value={tp.v}>
                  {tp.nl}
                </option>
              ))}
            </select>
          </div>
        ))}
        {items.length < 12 && (
          <button
            type="button"
            onClick={() =>
              setItems([...items, { label: "", type: "text" }])
            }
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted hover:bg-card-hover hover:text-foreground"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            {c.addItem}
          </button>
        )}
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
      <HeadEditor d={d} set={set} locale={locale} accent={theme.accent} />
      {items.map((it, idx) => (
        <div key={idx} className="rounded-lg border p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              #{idx + 1}
            </span>
            <div className="flex items-center gap-1 text-muted">
              <button
                type="button"
                onClick={() => {
                  if (idx === 0) return;
                  const n = [...items];
                  [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
                  setItems(n);
                }}
                disabled={idx === 0}
                aria-label="↑"
                className="rounded p-0.5 hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (idx === items.length - 1) return;
                  const n = [...items];
                  [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]];
                  setItems(n);
                }}
                disabled={idx === items.length - 1}
                aria-label="↓"
                className="rounded p-0.5 hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== idx))}
                className="rounded p-0.5 hover:text-red-500"
                aria-label="x"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
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
          {(() => {
            const pi = (patch: Record<string, string>) =>
              setItems(
                items.map((x, j) => (j === idx ? { ...x, ...patch } : x)),
              );
            return (
              <div className="mt-2 border-t pt-2">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {locale === "fr"
                    ? "Carte"
                    : locale === "en"
                      ? "Card"
                      : "Kaart"}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pi({ _hi: it._hi ? "" : "1" })}
                    title={
                      locale === "fr"
                        ? "Mettre en avant"
                        : locale === "en"
                          ? "Highlight"
                          : "Uitlichten"
                    }
                    className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                      it._hi
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border text-muted hover:bg-card-hover"
                    }`}
                  >
                    ★{" "}
                    {locale === "fr"
                      ? "Populaire"
                      : locale === "en"
                        ? "Popular"
                        : "Uitgelicht"}
                  </button>
                  <label
                    className="flex items-center gap-1 text-[10px] text-muted"
                    title="achtergrond"
                  >
                    <input
                      type="color"
                      value={it._bg || theme.bg}
                      onChange={(e) => pi({ _bg: e.target.value })}
                      className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    bg
                  </label>
                  <label
                    className="flex items-center gap-1 text-[10px] text-muted"
                    title="tekstkleur"
                  >
                    <input
                      type="color"
                      value={it._tc || theme.fg}
                      onChange={(e) => pi({ _tc: e.target.value })}
                      className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    txt
                  </label>
                  {(it._bg || it._tc) && (
                    <button
                      type="button"
                      onClick={() => pi({ _bg: "", _tc: "" })}
                      className="font-mono text-[10px] text-muted underline"
                    >
                      reset
                    </button>
                  )}
                  <IconField
                    value={it._icon || ""}
                    onPick={(k) => pi({ _icon: k })}
                    accent={theme.accent}
                  />
                </div>
                <LinkField
                  value={it._lnk}
                  onChange={(l) =>
                    pi({ _lnk: l as unknown as string })
                  }
                  p={c.preview}
                  pageNames={pageNames}
                  secLabels={secLabels}
                  onNewPage={onNewPage}
                />
              </div>
            );
          })()}
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

type HeroSlide = {
  bg?: string;
  eyebrow?: string;
  heading?: string;
  sub?: string;
  button?: string;
  capTitle?: string;
  capText?: string;
};

function HeroPreview({
  data,
  edit,
  theme,
  businessName,
  p,
}: {
  data: SectionData;
  edit: (patch: SectionData) => void;
  theme: Theme;
  businessName: string;
  p: Preview;
}) {
  const flat = (k: string) => {
    const v = data[k];
    return v == null ? "" : String(v);
  };
  // Migratie: nieuw model = slides[]. Val terug op oude bgs[]/platte velden.
  const rawSlides =
    Array.isArray(data.slides) && data.slides.length
      ? (data.slides as HeroSlide[])
      : null;
  const legacyBgs: string[] = Array.isArray(data.bgs)
    ? (data.bgs as string[]).filter(Boolean)
    : flat("bg")
      ? [flat("bg")]
      : [];
  const slides: HeroSlide[] = rawSlides
    ? rawSlides
    : legacyBgs.length
      ? legacyBgs.map((b) => ({
          bg: b,
          eyebrow: flat("eyebrow"),
          heading: flat("heading"),
          sub: flat("sub"),
          button: flat("button"),
        }))
      : [
          {
            eyebrow: flat("eyebrow"),
            heading: flat("heading"),
            sub: flat("sub"),
            button: flat("button"),
          },
        ];

  const slideSec =
    typeof data.slideSec === "number" && data.slideSec >= 2 ? data.slideSec : 4;
  const TRANS_TYPES = [
    "fade",
    "slide",
    "slideup",
    "zoom",
    "blur",
    "none",
  ] as const;
  const trans = (
    TRANS_TYPES as readonly string[]
  ).includes(String(data.trans))
    ? String(data.trans)
    : "fade";
  const hTransMs =
    typeof data.hTransMs === "number" ? data.hTransMs : 700;
  const transMs = trans === "none" ? 0 : hTransMs;

  const slideOrder =
    data.slideOrder === "rand" || data.slideOrder === "pong"
      ? String(data.slideOrder)
      : "seq";
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [slidesOpen, setSlidesOpen] = useState(false);
  const dirRef = useRef(1);
  const cIdx = Math.min(idx, slides.length - 1);
  useEffect(() => {
    if (slides.length < 2 || hover) return;
    const n = slides.length;
    const t = setInterval(
      () =>
        setIdx((i) => {
          if (slideOrder === "rand") {
            if (n < 2) return 0;
            let r = i;
            while (r === i) r = Math.floor(Math.random() * n);
            return r;
          }
          if (slideOrder === "pong") {
            let d = dirRef.current;
            if (i + d >= n) d = -1;
            else if (i + d < 0) d = 1;
            dirRef.current = d;
            return i + d;
          }
          return (i + 1) % n;
        }),
      slideSec * 1000,
    );
    return () => clearInterval(t);
  }, [slides.length, slideSec, hover, slideOrder]);

  // Schrijf altijd het slides-model en ruim de oude velden op.
  const commit = (next: HeroSlide[]) =>
    edit({
      slides: next,
      bgs: [],
      bg: "",
      eyebrow: "",
      heading: "",
      sub: "",
      button: "",
    });
  const patchSlide = (i: number, patch: Partial<HeroSlide>) =>
    commit(slides.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const addBlank = () => {
    commit([...slides, {}]);
    setIdx(slides.length);
  };
  const removeSlide = (i: number) => {
    if (slides.length <= 1) {
      commit([{ ...slides[0], bg: "" }]);
      return;
    }
    commit(slides.filter((_, j) => j !== i));
    setIdx((v) => Math.max(0, Math.min(v, slides.length - 2)));
  };
  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const n = [...slides];
    [n[i], n[j]] = [n[j], n[i]];
    commit(n);
    setIdx(j);
  };
  const addImgs = (files?: FileList | null) => {
    if (!files) return;
    const fresh = Array.from(files).filter(
      (f) => f.type.startsWith("image/") && f.size <= 3_000_000,
    );
    if (!fresh.length) return;
    Promise.all(
      fresh.slice(0, 8).map(
        (file) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result));
            r.readAsDataURL(file);
          }),
      ),
    ).then((urls) => {
      const onlyEmpty =
        slides.length === 1 && !slides[0].bg && !slides[0].heading;
      const base = onlyEmpty ? [] : slides;
      const added = urls.map((u, n) =>
        onlyEmpty && n === 0 ? { ...slides[0], bg: u } : { bg: u },
      );
      commit([...base, ...added].slice(0, 8));
    });
  };

  const cur = slides[cIdx] ?? {};
  const curHasBg = !!cur.bg;
  const anyBg = slides.some((s) => s.bg);

  const HEIGHTS: Record<string, string> = {
    s: "200px",
    m: "340px",
    l: "480px",
    xl: "640px",
    full: "85vh",
  };
  const hH =
    typeof data.hH === "string" && HEIGHTS[data.hH] ? String(data.hH) : "m";
  const hHM =
    typeof data.hHM === "string" && HEIGHTS[data.hHM]
      ? String(data.hHM)
      : "";
  const hx = typeof data.hx === "number" ? data.hx : 50;
  const hy = typeof data.hy === "number" ? data.hy : 50;
  const hCard = data.hCard === 1 || data.hCard === true;
  const hBlur = typeof data.hBlur === "number" ? data.hBlur : 0;
  const hCardW =
    typeof data.hCardW === "number" ? data.hCardW : 86;
  const hCardColor =
    typeof data.hCardColor === "string" && data.hCardColor
      ? data.hCardColor
      : "";
  const hCardA =
    typeof data.hCardA === "number"
      ? data.hCardA
      : curHasBg
        ? 34
        : 9;
  const showCard = hCard || hBlur > 0;
  const hCap = data.hCap === 1 || data.hCap === true;
  const hCapPos =
    data.hCapPos === "br" ||
    data.hCapPos === "tl" ||
    data.hCapPos === "tr"
      ? String(data.hCapPos)
      : "bl";
  const capX = typeof data.capX === "number" ? data.capX : null;
  const capY = typeof data.capY === "number" ? data.capY : null;
  const capFree = capX !== null && capY !== null;
  const hexToRgba = (hex: string, a: number) => {
    const m = hex.replace("#", "");
    const n =
      m.length === 3
        ? m.split("").map((x) => x + x).join("")
        : m.padEnd(6, "0").slice(0, 6);
    const r = parseInt(n.slice(0, 2), 16) || 0;
    const g = parseInt(n.slice(2, 4), 16) || 0;
    const b = parseInt(n.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
  };

  const heroRef = useRef<HTMLDivElement>(null);
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = heroRef.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = Math.min(
        92,
        Math.max(8, ((ev.clientX - r.left) / r.width) * 100),
      );
      const ny = Math.min(
        92,
        Math.max(8, ((ev.clientY - r.top) / r.height) * 100),
      );
      edit({ hx: Math.round(nx), hy: Math.round(ny) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startCapDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = heroRef.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = Math.min(
        96,
        Math.max(4, ((ev.clientX - r.left) / r.width) * 100),
      );
      const ny = Math.min(
        96,
        Math.max(4, ((ev.clientY - r.top) / r.height) * 100),
      );
      edit({ capX: Math.round(nx), capY: Math.round(ny) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const cardBase = hCardColor || (curHasBg ? "#000000" : theme.fg);
  const cStyleKind =
    typeof data.hCardStyle === "string" &&
    ["glass", "solid", "outline", "soft", "flat"].includes(data.hCardStyle)
      ? String(data.hCardStyle)
      : "glass";
  const baseBorder = curHasBg
    ? "rgba(255,255,255,0.18)"
    : `${theme.fg}1f`;
  const cardStyle: React.CSSProperties = showCard
    ? cStyleKind === "solid"
      ? {
          background: hexToRgba(cardBase, Math.max(hCardA, 80) / 100),
          padding: "30px 34px",
          borderRadius: 14,
        }
      : cStyleKind === "outline"
        ? {
            background: "transparent",
            padding: "28px 32px",
            borderRadius: 14,
            border: `1.5px solid ${curHasBg ? "rgba(255,255,255,0.5)" : theme.fg}`,
          }
        : cStyleKind === "soft"
          ? {
              background: hexToRgba(cardBase, hCardA / 100),
              backdropFilter: hBlur > 0 ? `blur(${hBlur}px)` : undefined,
              WebkitBackdropFilter:
                hBlur > 0 ? `blur(${hBlur}px)` : undefined,
              padding: "34px 40px",
              borderRadius: 28,
              boxShadow: "0 14px 40px rgba(0,0,0,0.18)",
            }
          : cStyleKind === "flat"
            ? {
                background: hexToRgba(cardBase, hCardA / 100),
                padding: "26px 30px",
              }
            : {
                background: hexToRgba(cardBase, hCardA / 100),
                backdropFilter: hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                WebkitBackdropFilter:
                  hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                padding: "30px 34px",
                borderRadius: 18,
                border: `1px solid ${baseBorder}`,
              }
    : {};

  return (
    <div
      ref={heroRef}
      data-hhm={hHM}
      className="group/hero relative overflow-hidden text-center"
      style={{
        minHeight: HEIGHTS[hH],
        ...(curHasBg ? { color: "#ffffff" } : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addImgs(e.dataTransfer.files);
      }}
    >
      {anyBg &&
        slides.map((s, i) =>
          s.bg ? (
            <div
              key={i}
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${s.bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transitionProperty:
                  trans === "slide" || trans === "slideup"
                    ? "transform"
                    : trans === "zoom"
                      ? "opacity, transform"
                      : trans === "blur"
                        ? "opacity, filter"
                        : "opacity",
                transitionDuration: `${transMs}ms`,
                transitionTimingFunction: "ease",
                opacity:
                  trans === "slide" || trans === "slideup"
                    ? 1
                    : i === cIdx
                      ? 1
                      : 0,
                transform:
                  trans === "slide"
                    ? `translateX(${(i - cIdx) * 100}%)`
                    : trans === "slideup"
                      ? `translateY(${(i - cIdx) * 100}%)`
                      : trans === "zoom"
                        ? `scale(${i === cIdx ? 1 : 1.15})`
                        : undefined,
                filter:
                  trans === "blur" && i !== cIdx
                    ? "blur(14px)"
                    : undefined,
                zIndex: i === cIdx ? 1 : 0,
              }}
            />
          ) : null,
        )}
      {curHasBg && !showCard && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 2 }}
        />
      )}
      <div
        className="absolute"
        style={{
          left: `${hx}%`,
          top: `${hy}%`,
          transform: "translate(-50%, -50%)",
          width: `min(${hCardW}%, 760px)`,
          zIndex: 3,
        }}
      >
        <div className="relative" style={cardStyle}>
          <button
            type="button"
            onPointerDown={startDrag}
            title={p.heroMove}
            className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-move items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/hero:opacity-100"
          >
            <Move className="h-3 w-3" strokeWidth={2.5} />
          </button>
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={curHasBg ? undefined : { color: theme.accent }}
          >
            <E
              key={`eb-${cIdx}`}
              value={cur.eyebrow || p.welcome}
              onChange={(v) => patchSlide(cIdx, { eyebrow: v })}
            />
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            <E
              key={`hd-${cIdx}`}
              value={cur.heading || businessName}
              onChange={(v) => patchSlide(cIdx, { heading: v })}
            />
          </h2>
          <p
            className={
              curHasBg ? "mt-3 text-sm opacity-90" : "mt-3 text-sm opacity-70"
            }
          >
            <E
              key={`sb-${cIdx}`}
              value={cur.sub || p.tagline}
              onChange={(v) => patchSlide(cIdx, { sub: v })}
            />
          </p>
          <button
            className="bldr-btn mt-6 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            <E
              key={`bt-${cIdx}`}
              value={cur.button || p.discover}
              onChange={(v) => patchSlide(cIdx, { button: v })}
            />
          </button>

          {slides.length > 1 && (
            <div className="mt-6 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === cIdx ? 18 : 6,
                    background:
                      i === cIdx
                        ? curHasBg
                          ? "#ffffff"
                          : theme.accent
                        : curHasBg
                          ? "rgba(255,255,255,0.5)"
                          : `${theme.fg}44`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {hCap && (
        <div
          className="group/cap absolute z-[5] max-w-[300px] text-left"
          style={
            capFree
              ? {
                  left: `${capX}%`,
                  top: `${capY}%`,
                  transform: "translate(-50%, -50%)",
                }
              : hCapPos === "br"
                ? { right: 18, bottom: 18 }
                : hCapPos === "tl"
                  ? { left: 18, top: 18 }
                  : hCapPos === "tr"
                    ? { right: 18, top: 18 }
                    : { left: 18, bottom: 18 }
          }
        >
          <div
            className="relative"
            style={{
              background: hexToRgba(
                cardBase,
                (showCard ? hCardA : curHasBg ? 42 : 9) / 100,
              ),
              backdropFilter: hBlur > 0 ? `blur(${hBlur}px)` : undefined,
              WebkitBackdropFilter:
                hBlur > 0 ? `blur(${hBlur}px)` : undefined,
              borderRadius: 14,
              border: curHasBg
                ? "1px solid rgba(255,255,255,0.18)"
                : `1px solid ${theme.fg}1f`,
              padding: "12px 16px",
            }}
          >
            <button
              type="button"
              onPointerDown={startCapDrag}
              title={p.heroMove}
              className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-move items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/cap:opacity-100"
            >
              <Move className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <p className="text-xs font-semibold tracking-tight">
              <E
                key={`ct-${cIdx}`}
                value={cur.capTitle || p.capTitlePh}
                onChange={(v) => patchSlide(cIdx, { capTitle: v })}
              />
            </p>
            <p className="mt-1 text-[11px] leading-relaxed opacity-80">
              <E
                key={`cx-${cIdx}`}
                value={cur.capText || p.capTextPh}
                onChange={(v) => patchSlide(cIdx, { capText: v })}
                multiline
              />
            </p>
          </div>
        </div>
      )}

      {/* slide-beheer: ingeklapt → kleine pill, zodat het de kaart niet
          in de weg zit; klik om de thumbnails te tonen */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5 opacity-0 transition-opacity group-hover/hero:opacity-100">
        <button
          type="button"
          onClick={() => setSlidesOpen((o) => !o)}
          title={`slide ${cIdx + 1}/${slides.length}`}
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm"
        >
          <Layers className="h-3 w-3" strokeWidth={2} />
          {slides.length}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              slidesOpen ? "rotate-180" : ""
            }`}
            strokeWidth={2.5}
          />
        </button>
        {slidesOpen && (
          <div className="pointer-events-auto flex max-w-[60vw] flex-wrap justify-end gap-1 gap-y-5 rounded-xl bg-black/45 p-2 pb-5 backdrop-blur-sm">
        {slides.map((s, i) => (
          <span key={i} className="relative">
            <button
              type="button"
              onClick={() => setIdx(i)}
              title={`slide ${i + 1}`}
              className="relative block h-9 w-12 overflow-hidden rounded border"
              style={{
                borderColor:
                  i === cIdx ? theme.accent : "rgba(255,255,255,0.45)",
                borderWidth: i === cIdx ? 2 : 1,
                background: s.bg ? undefined : "rgba(0,0,0,0.35)",
              }}
            >
              {s.bg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.bg}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-mono text-[9px] text-white/80">
                  {i + 1}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => removeSlide(i)}
              title={p.heroRemove}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
            {slides.length > 1 && (
              <span className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-0.5">
                <button
                  type="button"
                  onClick={() => moveSlide(i, -1)}
                  disabled={i === 0}
                  title="◀"
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px] leading-none text-white disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(i, 1)}
                  disabled={i === slides.length - 1}
                  title="▶"
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px] leading-none text-white disabled:opacity-30"
                >
                  ›
                </button>
              </span>
            )}
          </span>
        ))}
        <button
          type="button"
          onClick={addBlank}
          title="slide +"
          className="flex h-9 w-9 items-center justify-center rounded border border-dashed border-white/50 text-white/80"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
          </div>
        )}
      </div>


      <label
        className="absolute inset-x-0 bottom-0 z-10 flex cursor-pointer items-center justify-center gap-2 border-t border-dashed py-2 text-[11px] opacity-0 transition-opacity group-hover/hero:opacity-100"
        style={
          curHasBg
            ? {
                color: "rgba(255,255,255,0.85)",
                borderColor: "rgba(255,255,255,0.4)",
              }
            : { color: "var(--muted)" }
        }
      >
        <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} />
        {`${p.heroDrop} — slide ${cIdx + 1}/${slides.length}`}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addImgs(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

type Ovl = {
  id: string;
  t: "img" | "txt";
  x: number;
  y: number;
  w: number;
  src?: string;
  text?: string;
  color?: string;
  size?: number;
};

// Vrij plaatsbare foto- en tekstlaag bovenop ELK blok: toevoegen,
// overal naartoe slepen en groter/kleiner maken.
function SectionOverlays({
  data,
  theme,
  p,
  edit,
}: {
  data: SectionData;
  theme: Theme;
  p: Preview;
  edit: (patch: SectionData) => void;
}) {
  const ovls: Ovl[] = Array.isArray(data._ov) ? (data._ov as Ovl[]) : [];
  const layerRef = useRef<HTMLDivElement>(null);
  const setOvls = (next: Ovl[]) => edit({ _ov: next });
  const patchOv = (id: string, patch: Partial<Ovl>) =>
    setOvls(ovls.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const addImg = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/") || file.size > 4_000_000)
      return;
    const r = new FileReader();
    r.onload = () =>
      setOvls([
        ...ovls,
        {
          id: `o${Date.now().toString(36)}`,
          t: "img",
          x: 50,
          y: 50,
          w: 34,
          src: String(r.result),
        },
      ]);
    r.readAsDataURL(file);
  };
  const addTxt = () =>
    setOvls([
      ...ovls,
      {
        id: `o${Date.now().toString(36)}`,
        t: "txt",
        x: 50,
        y: 40,
        w: 44,
        text: "",
        color: theme.fg,
        size: 18,
      },
    ]);

  const drag = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = layerRef.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      patchOv(id, {
        x: Math.min(
          98,
          Math.max(2, ((ev.clientX - r.left) / r.width) * 100),
        ),
        y: Math.min(
          98,
          Math.max(2, ((ev.clientY - r.top) / r.height) * 100),
        ),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const resize = (id: string, ov: Ovl) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = layerRef.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const curX = ((ev.clientX - r.left) / r.width) * 100;
      const w = Math.min(96, Math.max(6, (curX - ov.x) * 2));
      if (ov.t === "txt") {
        const sz = Math.min(
          64,
          Math.max(
            10,
            (((ev.clientY - r.top) / r.height) * 100 - ov.y) * 2 + 16,
          ),
        );
        patchOv(id, { w, size: Math.round(sz) });
      } else {
        patchOv(id, { w });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <div className="pointer-events-auto absolute left-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover/sec:opacity-100">
        <label
          className="cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: theme.accent, color: theme.bg }}
        >
          {p.ovAddImg}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              addImg(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={addTxt}
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: theme.accent, color: theme.bg }}
        >
          {p.ovAddTxt}
        </button>
      </div>

      {ovls.map((ov) => (
        <div
          key={ov.id}
          className="group/ov pointer-events-auto absolute"
          style={{
            left: `${ov.x}%`,
            top: `${ov.y}%`,
            width: `${ov.w}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <button
            type="button"
            onPointerDown={drag(ov.id)}
            title={p.heroMove}
            className="absolute -top-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 cursor-move items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/ov:opacity-100"
          >
            <Move className="h-3 w-3" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setOvls(ovls.filter((o) => o.id !== ov.id))}
            title={p.heroRemove}
            className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover/ov:opacity-100"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
          {ov.t === "img" ? (
            <span
              onPointerDown={drag(ov.id)}
              className="block cursor-move overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ov.src}
                alt=""
                draggable={false}
                className="block w-full select-none"
              />
            </span>
          ) : (
            <div
              className="rounded-lg px-3 py-2"
              style={{
                color: ov.color || theme.fg,
                fontSize: ov.size || 18,
                lineHeight: 1.35,
              }}
            >
              <E
                value={ov.text || p.ovTxtPh}
                onChange={(v) => patchOv(ov.id, { text: v })}
                multiline
              />
            </div>
          )}
          {ov.t === "txt" && (
            <input
              type="color"
              value={ov.color || theme.fg}
              onChange={(e) => patchOv(ov.id, { color: e.target.value })}
              title="kleur"
              className="absolute -left-2 -top-2 h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 opacity-0 transition-opacity group-hover/ov:opacity-100"
            />
          )}
          <button
            type="button"
            onPointerDown={resize(ov.id, ov)}
            title="↘"
            className="absolute -bottom-2 -right-2 z-10 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/ov:opacity-100"
          >
            <Move className="h-3 w-3 rotate-45" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Foto-slot per item-kaart: klik of sleep een foto, grootte + blur
// instelbaar, verwijderen. Opgeslagen op het item (_img/_ih/_ib).
// Kleine "kies uit bibliotheek"-popover: hergebruik een foto die al
// ergens anders in het ontwerp staat.
function MediaPicker({
  lib,
  onPick,
}: {
  lib: string[];
  onPick: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (lib.length === 0) return null;
  return (
    <span className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="Uit bibliotheek"
        className="rounded-full bg-black/60 px-1.5 text-[10px] leading-5 text-white"
      >
        ▦
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 grid w-52 grid-cols-4 gap-1 rounded-lg border bg-card p-2 shadow-lg">
          {lib.map((u, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPick(u);
                setOpen(false);
              }}
              className="aspect-square overflow-hidden rounded border hover:border-accent"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function ItemImg({
  it,
  onPatch,
  accent,
  fg,
  variant,
  lib,
}: {
  it: Record<string, string>;
  onPatch: (patch: Record<string, string>) => void;
  accent: string;
  fg: string;
  variant: "avatar" | "banner";
  lib?: string[];
}) {
  const img = it._img || "";
  const round = variant === "avatar";
  const def = round ? 56 : 120;
  const h = Number(it._ih) || def;
  const blur = Number(it._ib) || 0;
  const sizes = round ? [48, 64, 88, 120] : [90, 120, 170, 240];
  const read = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/") || file.size > 4_000_000)
      return;
    const r = new FileReader();
    r.onload = () => onPatch({ _img: String(r.result) });
    r.readAsDataURL(file);
  };
  return (
    <div
      className={`group/ii relative ${round ? "mx-auto" : ""} mb-2`}
      style={{ width: round ? h : "100%", maxWidth: round ? h : undefined }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        read(e.dataTransfer.files?.[0]);
      }}
    >
      <label
        className="block cursor-pointer overflow-hidden"
        style={{
          height: h,
          borderRadius: round ? 9999 : 12,
          background: img
            ? undefined
            : `linear-gradient(135deg, ${accent}55, ${fg}11)`,
        }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={it._alt || ""}
            className="h-full w-full object-cover"
            style={{
              filter: blur ? `blur(${blur}px)` : undefined,
              borderRadius: round ? 9999 : 12,
            }}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-muted opacity-0 transition-opacity group-hover/ii:opacity-100">
            + foto
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            read(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {lib && lib.length > 0 && (
        <span className="absolute left-1 top-1 opacity-0 transition-opacity group-hover/ii:opacity-100">
          <MediaPicker
            lib={lib}
            onPick={(u) => onPatch({ _img: u })}
          />
        </span>
      )}
      {img && (
        <span className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover/ii:opacity-100">
          <button
            type="button"
            onClick={() =>
              onPatch({
                _ih: String(
                  sizes[(sizes.indexOf(h) + 1) % sizes.length] || def,
                ),
              })
            }
            title="grootte"
            className="rounded-full bg-black/60 px-1.5 text-[10px] leading-5 text-white"
          >
            ⤢
          </button>
          <button
            type="button"
            onClick={() =>
              onPatch({ _ib: String(blur + 3 > 9 ? 0 : blur + 3) })
            }
            title="blur"
            className="rounded-full bg-black/60 px-1.5 text-[10px] leading-5 text-white"
          >
            ◐
          </button>
          <button
            type="button"
            onClick={() => onPatch({ _img: "", _ih: "", _ib: "", _alt: "" })}
            title="x"
            className="rounded-full bg-black/70 px-1.5 text-[10px] leading-5 text-white"
          >
            ✕
          </button>
        </span>
      )}
      {img && (
        <input
          value={it._alt || ""}
          onChange={(e) => onPatch({ _alt: e.target.value })}
          placeholder="alt-tekst (toegankelijkheid)"
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-1 bottom-1 rounded bg-black/55 px-2 py-1 text-[10px] text-white opacity-0 outline-none transition-opacity placeholder:text-white/60 group-hover/ii:opacity-100"
        />
      )}
    </div>
  );
}

const ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  star: Star, heart: Heart, check: Check, zap: Zap, shield: Shield,
  award: Award, clock: Clock, pin: MapPin, phone: Phone, mail: Mail,
  users: Users, briefcase: Briefcase, camera: Camera, coffee: Coffee,
  scissors: Scissors, wrench: Wrench, truck: Truck, home: Home,
  leaf: Leaf, sun: Sun, sparkles: Sparkles, gift: Gift, target: Target,
  thumb: ThumbsUp, smile: Smile, music: Music, globe: Globe, lock: Lock,
  rocket: Rocket, calendar: Calendar, chat: MessageCircle, card: CreditCard,
  package: Package, settings: Settings, tag: Tag, compass: Compass,
  flame: Flame, crown: Crown, gem: Gem, handheart: HandHeart,
};

// Iconenkiezer per item — een verzorgd icoon maakt een kaart echt af.
function IconField({
  value,
  onPick,
  accent,
}: {
  value: string;
  onPick: (k: string) => void;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const Cur = value && ICONS[value] ? ICONS[value] : null;
  return (
    <div className="relative mb-2 inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Icoon"
        className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-card-hover"
        style={{
          borderColor: Cur ? accent : "var(--border)",
          color: accent,
        }}
      >
        {Cur ? (
          <Cur className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Plus className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-30 w-56 rounded-xl border bg-card p-2 shadow-lg">
          <div className="grid grid-cols-7 gap-1">
            <button
              type="button"
              onClick={() => {
                onPick("");
                setOpen(false);
              }}
              title="geen"
              className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-card-hover"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            {Object.entries(ICONS).map(([k, C]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onPick(k);
                  setOpen(false);
                }}
                title={k}
                className={`flex h-7 w-7 items-center justify-center rounded hover:bg-card-hover ${
                  value === k ? "bg-accent/15 text-accent" : "text-foreground"
                }`}
              >
                <C className="h-4 w-4" strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
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

function hnum(v: unknown, d: number): number {
  return typeof v === "number" ? v : d;
}

// Herbruikbare sectiekop: titel + optionele ondertekst + optionele
// streep met (optioneel) icoon in het midden. Alle tussenruimtes zijn
// regelbaar via _h*-sleutels op de sectie-data.
function SectionHead({
  data,
  edit,
  theme,
  titleValue,
  onTitle,
}: {
  data: SectionData;
  edit: (p: SectionData) => void;
  theme: Theme;
  titleValue: string;
  onTitle: (v: string) => void;
}) {
  const sub = data._sub == null ? "" : String(data._sub);
  const showDiv = data._div === 1 || data._div === true;
  const dIcon =
    typeof data._divIcon === "string" ? (data._divIcon as string) : "";
  const DI = dIcon && ICONS[dIcon] ? ICONS[dIcon] : null;
  const padT = hnum(data._hPadT, 0);
  const gap = hnum(data._hGap, 8);
  const divGap = hnum(data._hDivGap, 16);
  const below = hnum(data._hBelow, 0);
  const line = `${theme.fg}33`;
  return (
    <div
      className="text-center"
      style={{ paddingTop: padT, marginBottom: below }}
    >
      <h3 className="text-xl font-semibold tracking-tight">
        <E value={titleValue} onChange={onTitle} />
      </h3>
      {sub && (
        <p
          className="mx-auto max-w-2xl text-sm opacity-70"
          style={{ marginTop: gap }}
        >
          <E value={sub} onChange={(v) => edit({ _sub: v })} multiline />
        </p>
      )}
      {showDiv && (
        <div
          className="flex items-center justify-center gap-3"
          style={{ marginTop: divGap, marginBottom: divGap }}
        >
          <span
            className="h-px w-full max-w-[120px]"
            style={{ background: line }}
          />
          {DI ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${theme.accent}1a`, color: theme.accent }}
            >
              <DI className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          ) : (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: theme.accent }}
            />
          )}
          <span
            className="h-px w-full max-w-[120px]"
            style={{ background: line }}
          />
        </div>
      )}
    </div>
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
  lib,
}: {
  kind: SectionKind;
  data: SectionData;
  theme: Theme;
  businessName: string;
  images: string[];
  p: Preview;
  edit: (patch: SectionData) => void;
  lib: string[];
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
  const patchRow = (
    rows: Record<string, string>[],
    i: number,
    patch: Record<string, string>,
  ) =>
    edit({
      items: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    });

  switch (kind) {
    case "hero":
      return (
        <HeroPreview
          data={data}
          edit={edit}
          theme={theme}
          businessName={businessName}
          p={p}
        />
      );
    case "features":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.featuresTitle)}
            onTitle={(v) => edit({ title: v })}
          />
          {(() => {
            const rows = rowsOr([
              { title: `${p.feature} 1`, desc: p.featureDesc },
              { title: `${p.feature} 2`, desc: p.featureDesc },
              { title: `${p.feature} 3`, desc: p.featureDesc },
            ]);
            return (
              <div
                className={
                  g("_var") === "list"
                    ? "mt-6 grid grid-cols-1 gap-3"
                    : g("_var") === "duo"
                      ? "mt-6 grid grid-cols-2 gap-4"
                      : "mt-6 grid grid-cols-3 gap-4"
                }
              >
                {rows.map((it, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border p-4 text-xs"
                    style={{
                      ...border,
                      ...(it._bg ? { background: it._bg } : {}),
                      ...(it._tc ? { color: it._tc } : {}),
                      ...(it._hi
                        ? {
                            borderColor: theme.accent,
                            boxShadow: `0 0 0 2px ${theme.accent}`,
                          }
                        : {}),
                    }}
                  >
                    {it._hi && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: theme.accent, color: theme.bg }}
                      >
                        ★
                      </span>
                    )}
                    <IconField
                      value={it._icon || ""}
                      onPick={(k) => setItem(rows, i, "_icon", k)}
                      accent={theme.accent}
                    />
                    <ItemImg
                      it={it}
                      onPatch={(pt) => patchRow(rows, i, pt)}
                      accent={theme.accent}
                      fg={theme.fg}
                      variant="banner"
                    lib={lib}
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title")}
            onTitle={(v) => edit({ title: v })}
          />
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title")}
            onTitle={(v) => edit({ title: v })}
          />
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
                    <ItemImg
                      it={it}
                      onPatch={(pt) => patchRow(rows, i, pt)}
                      accent={theme.accent}
                      fg={theme.fg}
                      variant="avatar"
                    lib={lib}
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title")}
            onTitle={(v) => edit({ title: v })}
          />
          {(() => {
            const rows = rowsOr([
              { title: "" },
              { title: "" },
              { title: "" },
              { title: "" },
            ]);
            return (
              <div className="mt-6 flex flex-wrap items-end justify-center gap-4">
                {rows.map((it, i) => (
                  <div key={i} className="w-24 text-center">
                    <ItemImg
                      it={it}
                      onPatch={(pt) => patchRow(rows, i, pt)}
                      accent={theme.accent}
                      fg={theme.fg}
                      variant="avatar"
                    lib={lib}
                    />
                    <span className="block text-[11px] font-medium opacity-70">
                      <E
                        value={it.title}
                        onChange={(v) => setItem(rows, i, "title", v)}
                      />
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "testimonials":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.testiTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
                    <footer className="mt-3 flex items-center gap-2">
                      <div className="w-9 shrink-0">
                        <ItemImg
                          it={t}
                          onPatch={(pt) => patchRow(rows, i, pt)}
                          accent={theme.accent}
                          fg={theme.fg}
                          variant="avatar"
                        lib={lib}
                        />
                      </div>
                      <span className="font-mono text-[10px] opacity-70">
                        —{" "}
                        <E
                          value={t.who}
                          onChange={(v) => setItem(rows, i, "who", v)}
                        />
                      </span>
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.pricingTitle)}
            onTitle={(v) => edit({ title: v })}
          />
          {(() => {
            const rows = rowsOr(
              p.tiers.map((t) => ({ name: t.n, price: t.p, per: p.perMonth })),
            );
            return (
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                {rows.map((tier, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border p-4 text-center"
                    style={{
                      ...border,
                      ...(tier._bg ? { background: tier._bg } : {}),
                      ...(tier._tc ? { color: tier._tc } : {}),
                      ...(tier._hi
                        ? {
                            borderColor: theme.accent,
                            boxShadow: `0 0 0 2px ${theme.accent}`,
                            transform: "scale(1.03)",
                          }
                        : {}),
                    }}
                  >
                    {tier._hi && (
                      <span
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: theme.accent, color: theme.bg }}
                      >
                        {p.perMonth ? "Populair" : "Populair"}
                      </span>
                    )}
                    <p className="font-semibold">
                      <E
                        value={tier.name}
                        onChange={(v) => setItem(rows, i, "name", v)}
                      />
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-60">
                      <E
                        value={tier.sub || ""}
                        onChange={(v) => setItem(rows, i, "sub", v)}
                      />
                    </p>
                    <p className="mt-2 text-lg" style={accentText}>
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
                    <ul className="mt-3 space-y-1 text-left">
                      {(tier.feats || "")
                        .split("\n")
                        .filter(Boolean)
                        .map((ln, li) => (
                          <li
                            key={li}
                            className="flex items-start gap-1.5"
                          >
                            <Check
                              className="mt-0.5 h-3 w-3 shrink-0"
                              strokeWidth={3}
                              style={accentText}
                            />
                            <span>{ln}</span>
                          </li>
                        ))}
                    </ul>
                    <div className="mt-2 border-t pt-2" style={border}>
                      <E
                        value={tier.feats || ""}
                        onChange={(v) => setItem(rows, i, "feats", v)}
                        multiline
                        className="text-[10px] opacity-50"
                      />
                    </div>
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.galleryTitle)}
            onTitle={(v) => edit({ title: v })}
          />
          {(() => {
            const rows = rowsOr(
              [1, 2, 3, 4, 5, 6, 7, 8].map(() => ({ title: "" })),
            );
            return (
              <div className="mt-6 grid grid-cols-4 gap-3">
                {rows.map((it, i) => (
                  <div key={i}>
                    <ItemImg
                      it={it}
                      onPatch={(pt) => patchRow(rows, i, pt)}
                      accent={theme.accent}
                      fg={theme.fg}
                      variant="banner"
                    lib={lib}
                    />
                    <p className="mt-1 text-center text-[11px] opacity-70">
                      <E
                        value={it.title || ""}
                        onChange={(v) => setItem(rows, i, "title", v)}
                      />
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      );
    case "about":
      return (
        <div className="border-t px-8 py-12" style={border}>
          <div
            className={`mx-auto flex max-w-2xl flex-col gap-6 sm:[&>*]:flex-1 ${
              g("_var") === "right"
                ? "sm:flex-row-reverse"
                : "sm:flex-row"
            }`}
          >
            <ItemImg
              it={data as unknown as Record<string, string>}
              onPatch={(pt) => edit(pt)}
              accent={theme.accent}
              fg={theme.fg}
              variant="banner"
            lib={lib}
            />
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.statsTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.faqTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.pricelistTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.hoursTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
      const embed = g("embed");
      // Embed-link enkel als het een echt insluitbare Maps-URL is;
      // anders bouwen we 'm automatisch uit het adres (geen API-key,
      // wél toegelaten om in te sluiten).
      const okEmbed =
        /^https:\/\//.test(embed) &&
        /(\/maps\/embed|output=embed)/.test(embed);
      const mapSrc = okEmbed
        ? embed
        : addr
          ? `https://www.google.com/maps?q=${encodeURIComponent(
              addr,
            )}&output=embed`
          : "";
      return (
        <div className="border-t px-8 py-12" style={border}>
          <h3 className="text-center text-xl font-semibold tracking-tight">
            <E
              value={g("title", p.mapTitle)}
              onChange={(v) => edit({ title: v })}
            />
          </h3>
          {mapSrc ? (
            <div className="mx-auto mt-6 max-w-2xl">
              <div
                className="overflow-hidden rounded-lg border"
                style={border}
              >
                <iframe
                  src={mapSrc}
                  title="map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full"
                  style={{ border: 0 }}
                />
              </div>
              <p className="mt-2 text-center text-xs opacity-70">
                <MapPin
                  className="mr-1 inline h-3.5 w-3.5"
                  strokeWidth={2}
                  style={accentText}
                />
                <E
                  value={addr || "Straat 1, 0000 Gemeente"}
                  onChange={(v) => edit({ address: v })}
                />
              </p>
            </div>
          ) : (
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
              <p className="px-6 text-center text-[11px] opacity-50">
                {p.mapEmbedHint}
              </p>
            </div>
          )}
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
              className="bldr-btn rounded-full px-4 py-2 text-xs font-medium"
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
    case "footer": {
      type FCol = { title?: string; links?: { label?: string }[] };
      const fcols: FCol[] = Array.isArray(data.cols)
        ? (data.cols as FCol[])
        : [];
      const setCol = (ci: number, patch: Partial<FCol>) =>
        edit({
          cols: fcols.map((x, j) => (j === ci ? { ...x, ...patch } : x)),
        });
      return (
        <div className="border-t px-8 py-10" style={border}>
          <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-[1.4fr_repeat(auto-fit,minmax(0,1fr))]">
            <div className="text-sm">
              <p className="font-semibold tracking-tight">{businessName}</p>
              <p className="mt-2 text-xs leading-relaxed opacity-70">
                <E
                  value={g("about")}
                  onChange={(v) => edit({ about: v })}
                  multiline
                />
              </p>
            </div>
            {fcols.map((col, ci) => (
              <div key={ci} className="text-xs">
                <p
                  className="mb-2 font-mono uppercase tracking-widest"
                  style={{ color: theme.accent }}
                >
                  <E
                    value={col.title ?? ""}
                    onChange={(v) => setCol(ci, { title: v })}
                  />
                </p>
                <ul className="space-y-1.5 opacity-70">
                  {(col.links ?? []).map((lk, li) => (
                    <li key={li}>
                      <E
                        value={lk.label ?? ""}
                        onChange={(v) =>
                          setCol(ci, {
                            links: (col.links ?? []).map((y, k) =>
                              k === li ? { ...y, label: v } : y,
                            ),
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mx-auto mt-8 max-w-3xl border-t pt-5 text-center text-[11px] opacity-60"
            style={border}
          >
            <E
              value={g("note")}
              onChange={(v) => edit({ note: v })}
            />
          </div>
        </div>
      );
    }
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
            className="bldr-btn mt-5 rounded-full px-5 py-2 text-xs font-medium"
            style={{ background: theme.accent, color: theme.bg }}
          >
            <E
              value={g("button", p.ctaBtn2)}
              onChange={(v) => edit({ button: v })}
            />
          </button>
        </div>
      );
    case "contact": {
      const cFields = Array.isArray(data.items)
        ? (data.items as Record<string, string>[])
        : [];
      const rows =
        cFields.length > 0
          ? cFields
          : [
              { label: p.name, type: "text", req: "1" },
              { label: p.email, type: "email", req: "1" },
              { label: p.message, type: "textarea", req: "1" },
            ];
      const btnShape =
        g("_btnShape") === "recht"
          ? "2px"
          : g("_btnShape") === "zacht"
            ? "12px"
            : "9999px";
      const btnBg = g("_btnColor") || theme.accent;
      const fieldRadius =
        g("_fldShape") === "recht"
          ? "2px"
          : g("_fldShape") === "rond"
            ? "9999px"
            : "8px";
      const sideCard = data._card === 1 || data._card === true;
      const okCol = g("_okColor") || "#16a34a";
      const errCol = g("_errColor") || "#ef4444";
      const FormCol = (
        <div
          className={`space-y-2 text-xs ${sideCard ? "" : "mx-auto max-w-sm"}`}
        >
          {rows.map((fl, i) => {
            const lbl = fl.label || `Veld ${i + 1}`;
            const req = fl.req === "1" || fl.req === "true";
            const fStyle = {
              ...border,
              ...(fl.bg ? { background: fl.bg } : {}),
              borderRadius: fieldRadius,
            };
            return (
              <div key={i}>
                <label className="mb-1 block opacity-70">
                  {lbl}
                  {req && <span style={{ color: theme.accent }}> *</span>}
                </label>
                {fl.type === "textarea" ? (
                  <textarea
                    rows={3}
                    readOnly
                    placeholder={lbl}
                    className="w-full border bg-transparent px-3 py-2"
                    style={fStyle}
                  />
                ) : (
                  <input
                    type={fl.type || "text"}
                    readOnly
                    placeholder={lbl}
                    className="w-full border bg-transparent px-3 py-2"
                    style={fStyle}
                  />
                )}
              </div>
            );
          })}
          <button
            className="bldr-btn w-full px-4 py-2 text-xs font-medium"
            style={{
              background: btnBg,
              color: g("_btnTxt") || theme.bg,
              borderRadius: btnShape,
            }}
          >
            <E
              value={g("button", p.send)}
              onChange={(v) => edit({ button: v })}
            />
          </button>
          <div className="space-y-1 pt-1">
            <p
              className="rounded px-3 py-1.5 text-[11px]"
              style={{ background: `${okCol}1f`, color: okCol }}
            >
              <E
                value={g(
                  "_okText",
                  "Bedankt! We nemen snel contact met je op.",
                )}
                onChange={(v) => edit({ _okText: v })}
              />
            </p>
            <p
              className="rounded px-3 py-1.5 text-[11px]"
              style={{ background: `${errCol}1f`, color: errCol }}
            >
              <E
                value={g(
                  "_errText",
                  "Oeps — er liep iets fout. Probeer opnieuw.",
                )}
                onChange={(v) => edit({ _errText: v })}
              />
            </p>
          </div>
        </div>
      );
      return (
        <div className="border-t px-8 py-12" style={border}>
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.contactTitle)}
            onTitle={(v) => edit({ title: v })}
          />
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
          <div
            className={
              sideCard
                ? "mx-auto mt-6 grid max-w-2xl gap-5 md:grid-cols-2"
                : "mt-6"
            }
          >
            {FormCol}
            {sideCard && (
              <div
                className="rounded-xl border p-4 text-xs"
                style={{
                  ...border,
                  background: g("_cardBg") || `${theme.fg}08`,
                }}
              >
                <p className="mb-2 text-sm font-semibold">
                  <E
                    value={g("_cardTitle", "Contactgegevens")}
                    onChange={(v) => edit({ _cardTitle: v })}
                  />
                </p>
                <p className="whitespace-pre-line opacity-80">
                  <E
                    value={g(
                      "_cardText",
                      "Bel of mail ons gerust — we helpen je snel verder.",
                    )}
                    onChange={(v) => edit({ _cardText: v })}
                    multiline
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    case "form": {
      const fields = Array.isArray(data.items)
        ? (data.items as Record<string, string>[])
        : [];
      return (
        <div className="border-t px-8 py-12" style={border}>
          <SectionHead
            data={data}
            edit={edit}
            theme={theme}
            titleValue={g("title", p.contactTitle)}
            onTitle={(v) => edit({ title: v })}
          />
          <div className="mx-auto mt-6 max-w-md space-y-3 text-xs">
            {fields.map((fl, i) => (
              <div key={i}>
                <label className="mb-1 block opacity-70">
                  {fl.label || `Veld ${i + 1}`}
                </label>
                {fl.type === "textarea" ? (
                  <textarea
                    rows={3}
                    readOnly
                    className="w-full rounded border bg-transparent px-3 py-2"
                    style={border}
                  />
                ) : (
                  <input
                    type={fl.type || "text"}
                    readOnly
                    className="w-full rounded border bg-transparent px-3 py-2"
                    style={border}
                  />
                )}
              </div>
            ))}
            <button
              className="bldr-btn w-full rounded-full px-4 py-2 text-xs font-medium"
              style={{ background: theme.accent, color: theme.bg }}
            >
              <E
                value={g("button", p.send)}
                onChange={(v) => edit({ button: v })}
              />
            </button>
          </div>
        </div>
      );
    }
  }
}
