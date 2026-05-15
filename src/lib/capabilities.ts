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
import type { Locale } from "@/lib/i18n/config";

export type Capability = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const icons: LucideIcon[] = [
  Globe,
  ShoppingBag,
  LayoutDashboard,
  Languages,
  Smartphone,
  ImageIcon,
  Mail,
  CalendarCheck,
  Search,
  Lock,
  ArrowRightLeft,
  Rocket,
];

const text: Record<Locale, { title: string; description: string }[]> = {
  nl: [
    { title: "Snelle, moderne websites", description: "Next.js 16 + Tailwind. Score 95+ op Google PageSpeed, native dark mode, geen WordPress-traagheid." },
    { title: "Webshops met betalingen", description: "Mollie of Stripe, productenbeheer, voorraad, kortingscodes, gift cards, klantportaal. Voor 100 of 10 000 producten." },
    { title: "Admin op maat", description: "Een eigen dashboard om klanten, bestellingen, foto's en content te beheren. Geen plugins die over een jaar breken." },
    { title: "Tweetalig (NL / FR / EN)", description: "Volledig vertaalde sites met taalkeuze, SEO per taal, en een admin om vertalingen te beheren." },
    { title: "Progressive Web App", description: "Installeerbaar als app op telefoon, werkt offline, push notifications. Handig voor admins die onderweg werken." },
    { title: "Beeld-pipeline", description: "Bulk-upload, automatische optimalisatie, watermark, EXIF-stripping, lazy loading. Foto-zware sites lopen niet meer vast." },
    { title: "Newsletters & e-mail", description: "Mailing-tool ingebouwd in de admin: campagnes opstellen, planning, opens en clicks tracken, abonnees beheren." },
    { title: "Reservaties & boekingen", description: "Reservatieformulieren met kalender-koppeling, bevestigings-e-mails, no-show beheer voor restaurants en ateliers." },
    { title: "SEO en analytics", description: "Sitemap, metadata, structured data, Open Graph cards. Privacy-vriendelijke analytics zonder cookie-banner-drama." },
    { title: "GDPR-conform", description: "Cookie-policy, consent management, data-export en -verwijdering ingebouwd. Geen juridische kopzorgen." },
    { title: "Migratie vanaf WordPress / Squarespace", description: "Bestaande site overzetten zonder SEO-verlies: redirects, sitemap, structured data en alle content geïmporteerd. Geen blanco pagina op dag 1." },
    { title: "Hosting, deploy & onderhoud", description: "Vercel + Supabase setup, automatische backups, error tracking, security updates. Eén aanspreekpunt voor de hele stack." },
  ],
  fr: [
    { title: "Sites web rapides et modernes", description: "Next.js 16 + Tailwind. Score 95+ sur Google PageSpeed, dark mode natif, sans la lenteur de WordPress." },
    { title: "Boutiques avec paiements", description: "Mollie ou Stripe, gestion produits, stock, codes promo, cartes-cadeaux, espace client. De 100 à 10 000 produits." },
    { title: "Admin sur mesure", description: "Un tableau de bord propre pour gérer clients, commandes, photos et contenu. Pas de plugins qui cassent dans un an." },
    { title: "Bilingue (NL / FR / EN)", description: "Sites entièrement traduits avec choix de langue, SEO par langue, et un admin pour gérer les traductions." },
    { title: "Progressive Web App", description: "Installable comme app sur téléphone, fonctionne hors ligne, notifications push. Pratique pour les admins en déplacement." },
    { title: "Pipeline d'images", description: "Upload en masse, optimisation automatique, filigrane, suppression EXIF, lazy loading. Les sites riches en photos ne plantent plus." },
    { title: "Newsletters & e-mail", description: "Outil d'emailing intégré à l'admin : créer des campagnes, planifier, suivre ouvertures et clics, gérer les abonnés." },
    { title: "Réservations & rendez-vous", description: "Formulaires de réservation avec lien calendrier, e-mails de confirmation, gestion des no-shows pour restaurants et ateliers." },
    { title: "SEO et analytics", description: "Sitemap, metadata, données structurées, cartes Open Graph. Analytics respectueux de la vie privée, sans drame de bannière cookie." },
    { title: "Conforme RGPD", description: "Politique cookies, gestion du consentement, export et suppression des données intégrés. Pas de soucis juridiques." },
    { title: "Migration depuis WordPress / Squarespace", description: "Transférer un site existant sans perte de SEO : redirections, sitemap, données structurées et tout le contenu importé. Pas de page blanche au jour 1." },
    { title: "Hébergement, déploiement & maintenance", description: "Setup Vercel + Supabase, sauvegardes automatiques, suivi des erreurs, mises à jour de sécurité. Un seul interlocuteur pour toute la stack." },
  ],
  en: [
    { title: "Fast, modern websites", description: "Next.js 16 + Tailwind. 95+ score on Google PageSpeed, native dark mode, no WordPress sluggishness." },
    { title: "Webshops with payments", description: "Mollie or Stripe, product management, stock, discount codes, gift cards, customer portal. For 100 or 10,000 products." },
    { title: "Custom admin", description: "Your own dashboard to manage clients, orders, photos and content. No plugins that break in a year." },
    { title: "Multilingual (NL / FR / EN)", description: "Fully translated sites with language switching, per-language SEO, and an admin to manage translations." },
    { title: "Progressive Web App", description: "Installable as an app on phone, works offline, push notifications. Handy for admins working on the go." },
    { title: "Image pipeline", description: "Bulk upload, automatic optimization, watermark, EXIF stripping, lazy loading. Photo-heavy sites no longer choke." },
    { title: "Newsletters & email", description: "Mailing tool built into the admin: compose campaigns, schedule, track opens and clicks, manage subscribers." },
    { title: "Reservations & bookings", description: "Reservation forms with calendar linking, confirmation emails, no-show management for restaurants and studios." },
    { title: "SEO and analytics", description: "Sitemap, metadata, structured data, Open Graph cards. Privacy-friendly analytics without cookie-banner drama." },
    { title: "GDPR compliant", description: "Cookie policy, consent management, data export and deletion built in. No legal headaches." },
    { title: "Migration from WordPress / Squarespace", description: "Move an existing site without SEO loss: redirects, sitemap, structured data and all content imported. No blank page on day 1." },
    { title: "Hosting, deploy & maintenance", description: "Vercel + Supabase setup, automatic backups, error tracking, security updates. One point of contact for the whole stack." },
  ],
};

export function getCapabilities(locale: Locale): Capability[] {
  return text[locale].map((t, i) => ({ icon: icons[i], ...t }));
}
