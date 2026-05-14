export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  stack: string[];
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "cottage-waregem",
    name: "Cottage Waregem",
    tagline: "Restaurant — Waregem",
    description:
      "Migratie van Squarespace naar Next.js. Reservaties, menukaart per seizoen, vacaturepagina, Open Graph cards. Sneller en goedkoper te onderhouden.",
    url: "https://cottage-waregem.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase"],
    accent: "#7c3a2e",
  },
  {
    slug: "barbotte",
    name: "Bar'Botte",
    tagline: "Bistro — Brussel",
    description:
      "Tweetalige (NL/FR) restaurantsite met menu en reservaties. Kleinste zus-zaak van Cottage, eigen identiteit.",
    url: "https://barbotte.be",
    stack: ["Next.js 16", "Tailwind v4", "Supabase", "i18n"],
    accent: "#1f4e3d",
  },
  {
    slug: "celine-interieur",
    name: "Céline Intérieur",
    tagline: "Interieurstyling — West-Vlaanderen",
    description:
      "Portfolio + admin als drie aparte PWA's: shop, werven en verhuur. Foto's, klanten, offertes, alles in één plek.",
    url: "https://celine-interieur.vercel.app",
    stack: ["Next.js 16", "Supabase", "PWA", "Tailwind v4"],
    accent: "#a8763e",
  },
  {
    slug: "allardphilippe",
    name: "Allard Philippe",
    tagline: "Wildlife fotografie — webshop",
    description:
      "Volledige webshop voor fine-art prints. Mollie betalingen, gift cards, kortingscodes, newsletter, klantenportaal. NL/FR.",
    url: "https://allardphilippe.be",
    stack: ["Next.js 16", "Supabase", "Mollie", "Resend", "i18n"],
    accent: "#3a4a5c",
  },
  {
    slug: "jp-montreuil",
    name: "JP Montreuil",
    tagline: "Atelier kunstenaar",
    description:
      "WordPress-site herbouwd in Next.js + Supabase admin. Tentoonstellingen, galerij per album, ibook, alles beheerbaar.",
    url: "https://jp.montreuil.be",
    stack: ["Next.js 16", "Supabase", "i18n"],
    accent: "#5b3a52",
  },
  {
    slug: "mari-lines",
    name: "Mari Lines",
    tagline: "Wegmarkeringen — bedrijfssite",
    description:
      "Diensten, projectreferenties, offerte-aanvraag. Schoon, technisch, vertrouwen-wekkend voor B2B-klanten.",
    url: "https://mari-lines.be",
    stack: ["Next.js 16", "Tailwind v4"],
    accent: "#2d3142",
  },
];
