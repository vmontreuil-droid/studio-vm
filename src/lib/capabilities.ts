import {
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Languages,
  Smartphone,
  Image as ImageIcon,
  Mail,
  CalendarCheck,
  Search,
  Lock,
  ArrowRightLeft,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type Capability = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const capabilities: Capability[] = [
  {
    icon: Globe,
    title: "Snelle, moderne websites",
    description:
      "Next.js 16 + Tailwind. Score 95+ op Google PageSpeed, native dark mode, geen WordPress-traagheid.",
  },
  {
    icon: ShoppingBag,
    title: "Webshops met betalingen",
    description:
      "Mollie of Stripe, productenbeheer, voorraad, kortingscodes, gift cards, klantportaal. Voor 100 of 10 000 producten.",
  },
  {
    icon: LayoutDashboard,
    title: "Admin op maat",
    description:
      "Een eigen dashboard om klanten, bestellingen, foto's en content te beheren. Geen plugins die over een jaar breken.",
  },
  {
    icon: Languages,
    title: "Tweetalig (NL / FR / EN)",
    description:
      "Volledig vertaalde sites met taalkeuze, SEO per taal, en een admin om vertalingen te beheren.",
  },
  {
    icon: Smartphone,
    title: "Progressive Web App",
    description:
      "Installeerbaar als app op telefoon, werkt offline, push notifications. Handig voor admins die onderweg werken.",
  },
  {
    icon: ImageIcon,
    title: "Beeld-pipeline",
    description:
      "Bulk-upload, automatische optimalisatie, watermark, EXIF-stripping, lazy loading. Foto-zware sites lopen niet meer vast.",
  },
  {
    icon: Mail,
    title: "Newsletters & e-mail",
    description:
      "Mailing-tool ingebouwd in de admin: campagnes opstellen, planning, opens en clicks tracken, abonnees beheren.",
  },
  {
    icon: CalendarCheck,
    title: "Reservaties & boekingen",
    description:
      "Reservatieformulieren met kalender-koppeling, bevestigings-e-mails, no-show beheer voor restaurants en ateliers.",
  },
  {
    icon: Search,
    title: "SEO en analytics",
    description:
      "Sitemap, metadata, structured data, Open Graph cards. Privacy-vriendelijke analytics zonder cookie-banner-drama.",
  },
  {
    icon: Lock,
    title: "GDPR-conform",
    description:
      "Cookie-policy, consent management, data-export en -verwijdering ingebouwd. Geen juridische kopzorgen.",
  },
  {
    icon: ArrowRightLeft,
    title: "Migratie vanaf WordPress / Squarespace",
    description:
      "Bestaande site overzetten zonder SEO-verlies: redirects, sitemap, structured data en alle content geïmporteerd. Geen blanco pagina op dag 1.",
  },
  {
    icon: Rocket,
    title: "Hosting, deploy & onderhoud",
    description:
      "Vercel + Supabase setup, automatische backups, error tracking, security updates. Eén aanspreekpunt voor de hele stack.",
  },
];
