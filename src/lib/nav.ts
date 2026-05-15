export type NavItem = { href: string; label: string; group?: string };

export const primaryNav: NavItem[] = [
  { href: "/#werk", label: "Werk" },
  { href: "/mogelijkheden", label: "Mogelijkheden" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

export const allNav: NavItem[] = [
  { href: "/", label: "Home", group: "Studio" },
  { href: "/#werk", label: "Werk", group: "Studio" },
  { href: "/mogelijkheden", label: "Mogelijkheden", group: "Studio" },
  { href: "/pricing", label: "Pricing", group: "Studio" },
  { href: "/journal", label: "Journal", group: "Studio" },
  { href: "/diensten", label: "Diensten", group: "Diensten" },
  { href: "/aanpak", label: "Aanpak", group: "Diensten" },
  { href: "/vergelijking", label: "Vergelijking", group: "Diensten" },
  { href: "/shop", label: "Templates shop", group: "Diensten" },
  { href: "/builder", label: "Site builder demo", group: "Diensten" },
  { href: "/faq", label: "FAQ", group: "Diensten" },
  { href: "/woordenboek", label: "Woordenboek", group: "Diensten" },
  { href: "/portail", label: "Klantportaal", group: "Voor klanten" },
  { href: "/support", label: "Support tickets", group: "Voor klanten" },
  { href: "/status", label: "Status", group: "Voor klanten" },
  { href: "/#contact", label: "Contact", group: "Voor klanten" },
  { href: "/over", label: "Over Vincent", group: "Over Vincent" },
  { href: "/now", label: "Wat ik nu doe", group: "Over Vincent" },
  { href: "/uses", label: "Tools die ik gebruik", group: "Over Vincent" },
  { href: "/offerte", label: "Offerte-calculator", group: "Diensten" },
  { href: "/privacy", label: "Privacy", group: "Legal" },
  { href: "/cookies", label: "Cookies", group: "Legal" },
  { href: "/voorwaarden", label: "Algemene voorwaarden", group: "Legal" },
];
