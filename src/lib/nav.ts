import type { Locale } from "@/lib/i18n/config";

export type NavItem = { href: string; label: string; group?: string };

// Menu voor de gsm (en referentie voor zoekfunctie). Labels per taal.
const NAV: Record<Locale, NavItem[]> = {
  nl: [
    { href: "/", label: "Home", group: "Studio VM" },
    { href: "/3d-modellen", label: "3D-modellen", group: "Studio VM" },
    { href: "/#werkwijze", label: "Werkwijze", group: "Studio VM" },
    { href: "/realisaties", label: "Realisaties", group: "Studio VM" },
    { href: "/tarieven", label: "Tarieven", group: "Studio VM" },
    { href: "/offerte", label: "Offerte aanvragen", group: "Studio VM" },
    { href: "/kennis", label: "Kennisbank", group: "Kennis" },
    { href: "/kennis/coordinatenstelsels", label: "Coördinatenstelsels", group: "Kennis" },
    { href: "/kennis/veelgestelde-vragen", label: "Veelgestelde vragen", group: "Kennis" },
    { href: "/over", label: "Over Studio VM", group: "Over" },
    { href: "/#contact", label: "Contact", group: "Over" },
    { href: "/portail", label: "Klantenportaal", group: "Over" },
  ],
  fr: [
    { href: "/", label: "Accueil", group: "Studio VM" },
    { href: "/3d-modellen", label: "Modèles 3D", group: "Studio VM" },
    { href: "/#werkwijze", label: "Méthode", group: "Studio VM" },
    { href: "/realisaties", label: "Réalisations", group: "Studio VM" },
    { href: "/tarieven", label: "Tarifs", group: "Studio VM" },
    { href: "/offerte", label: "Demander un devis", group: "Studio VM" },
    { href: "/kennis", label: "Base de connaissances", group: "Savoir" },
    { href: "/kennis/coordinatenstelsels", label: "Systèmes de coordonnées", group: "Savoir" },
    { href: "/kennis/veelgestelde-vragen", label: "Questions fréquentes", group: "Savoir" },
    { href: "/over", label: "À propos de Studio VM", group: "À propos" },
    { href: "/#contact", label: "Contact", group: "À propos" },
    { href: "/portail", label: "Espace client", group: "À propos" },
  ],
  en: [
    { href: "/", label: "Home", group: "Studio VM" },
    { href: "/3d-modellen", label: "3D models", group: "Studio VM" },
    { href: "/#werkwijze", label: "How it works", group: "Studio VM" },
    { href: "/realisaties", label: "Projects", group: "Studio VM" },
    { href: "/tarieven", label: "Rates", group: "Studio VM" },
    { href: "/offerte", label: "Request a quote", group: "Studio VM" },
    { href: "/kennis", label: "Knowledge base", group: "Knowledge" },
    { href: "/kennis/coordinatenstelsels", label: "Coordinate systems", group: "Knowledge" },
    { href: "/kennis/veelgestelde-vragen", label: "FAQ", group: "Knowledge" },
    { href: "/over", label: "About Studio VM", group: "About" },
    { href: "/#contact", label: "Contact", group: "About" },
    { href: "/portail", label: "Client portal", group: "About" },
  ],
  de: [
    { href: "/", label: "Start", group: "Studio VM" },
    { href: "/3d-modellen", label: "3D-Modelle", group: "Studio VM" },
    { href: "/#werkwijze", label: "Arbeitsweise", group: "Studio VM" },
    { href: "/realisaties", label: "Referenzen", group: "Studio VM" },
    { href: "/tarieven", label: "Preise", group: "Studio VM" },
    { href: "/offerte", label: "Angebot anfordern", group: "Studio VM" },
    { href: "/kennis", label: "Wissensdatenbank", group: "Wissen" },
    { href: "/kennis/coordinatenstelsels", label: "Koordinatensysteme", group: "Wissen" },
    { href: "/kennis/veelgestelde-vragen", label: "Häufige Fragen", group: "Wissen" },
    { href: "/over", label: "Über Studio VM", group: "Über uns" },
    { href: "/#contact", label: "Kontakt", group: "Über uns" },
    { href: "/portail", label: "Kundenportal", group: "Über uns" },
  ],
  es: [
    { href: "/", label: "Inicio", group: "Studio VM" },
    { href: "/3d-modellen", label: "Modelos 3D", group: "Studio VM" },
    { href: "/#werkwijze", label: "Cómo trabajamos", group: "Studio VM" },
    { href: "/realisaties", label: "Proyectos", group: "Studio VM" },
    { href: "/tarieven", label: "Tarifas", group: "Studio VM" },
    { href: "/offerte", label: "Solicitar presupuesto", group: "Studio VM" },
    { href: "/kennis", label: "Base de conocimientos", group: "Conocimientos" },
    { href: "/kennis/coordinatenstelsels", label: "Sistemas de coordenadas", group: "Conocimientos" },
    { href: "/kennis/veelgestelde-vragen", label: "Preguntas frecuentes", group: "Conocimientos" },
    { href: "/over", label: "Sobre Studio VM", group: "Acerca de" },
    { href: "/#contact", label: "Contacto", group: "Acerca de" },
    { href: "/portail", label: "Portal de clientes", group: "Acerca de" },
  ],
};

export function navVoor(locale: Locale): NavItem[] {
  return NAV[locale];
}

// Oude namen, nog gebruikt door enkele componenten (zoekfunctie, portaal).
export const allNav: NavItem[] = NAV.nl;
export const primaryNav: NavItem[] = NAV.nl.filter((n) => n.group === "Studio VM");
