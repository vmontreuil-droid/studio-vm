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
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export type CapabilityDetail = {
  slug: string;
  icon: LucideIcon;
  title: string;
  short: string;
  heroTitle: string;
  heroIntro: string;
  whatYouGet: string[];
  howItWorks: { title: string; desc: string }[];
  examples: { slug: string; note: string }[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
};

type Content = Omit<CapabilityDetail, "slug" | "icon">;

const icons: Record<string, LucideIcon> = {
  websites: Globe,
  webshops: ShoppingBag,
  admin: LayoutDashboard,
  meertalig: Languages,
  pwa: Smartphone,
  media: ImageIcon,
  newsletters: Mail,
  boekingen: CalendarCheck,
  seo: Search,
  gdpr: Lock,
  migratie: ArrowRightLeft,
  hosting: Rocket,
};

const slugs = [
  "websites",
  "webshops",
  "admin",
  "meertalig",
  "pwa",
  "media",
  "newsletters",
  "boekingen",
  "seo",
  "gdpr",
  "migratie",
  "hosting",
] as const;

type Slug = (typeof slugs)[number];

const data: Record<Slug, Record<Locale, Content>> = {
  websites: {
    nl: {
      title: "Snelle, moderne websites",
      short: "Next.js 16 + Tailwind. Score 95+ op Google PageSpeed, native dark mode, geen WordPress-traagheid.",
      heroTitle: "Een website die laadt vóór je bezoeker wegklikt.",
      heroIntro:
        "De helft van je bezoekers haakt af als je site trager is dan 3 seconden. Mijn sites laden in minder dan één. Geen plugin-spaghetti, geen maandelijkse kostenexplosie — een site die voor jou werkt, niet andersom.",
      whatYouGet: [
        "Custom design op jouw huisstijl, niet één of ander thema",
        "PageSpeed-score 95+ op mobiel én desktop",
        "Native dark mode die meegaat met het toestel",
        "Volledig responsive — telefoon, tablet, desktop",
        "Open Graph cards: mooie previews bij delen op social",
        "Toegankelijk (WCAG): focus-states, skip-links, reduced-motion",
      ],
      howItWorks: [
        { title: "Design op jouw merk", desc: "We vertrekken van jouw logo, kleuren en foto's — geen template waar duizend andere sites op draaien." },
        { title: "Gebouwd in Next.js 16", desc: "Server-rendered, statisch waar het kan. Google ziet een complete pagina, geen lege loader." },
        { title: "Gemeten, niet gegokt", desc: "Voor lancering toon ik je de echte Lighthouse-scores. Geen 'het voelt snel' — cijfers." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Van een trage Squarespace-site naar PageSpeed 98." },
        { slug: "mari-lines", note: "Snelle, vertrouwen-wekkende B2B-site die leads binnenhaalt." },
      ],
      faq: [
        { q: "Werkt mijn site ook goed op een oude telefoon?", a: "Ja. Ik test op trage 3G en oudere toestellen. Snelheid is geen luxe — het is de basis." },
        { q: "Kan ik later zelf teksten aanpassen?", a: "Met de admin-module wel (zie 'Admin op maat'). Een puur statische site wijzig ik anders zelf snel en goedkoop." },
        { q: "Wat kost dit?", a: "Vanaf €2 500 voor een Starter (tot 5 pagina's). Zie de pricing-pagina voor de details." },
        { q: "Hoe lang duurt het?", a: "Een Starter is doorgaans klaar in ~2 weken vanaf de kick-off." },
      ],
      ctaTitle: "Klaar voor een site die niet tegenwerkt?",
      ctaText: "Stuur me kort wat je in gedachten hebt — ik laat je vrijblijvend zien wat mogelijk is.",
    },
    fr: {
      title: "Sites web rapides et modernes",
      short: "Next.js 16 + Tailwind. Score 95+ sur Google PageSpeed, dark mode natif, sans la lenteur de WordPress.",
      heroTitle: "Un site qui charge avant que votre visiteur ne parte.",
      heroIntro:
        "La moitié de vos visiteurs partent si votre site met plus de 3 secondes. Mes sites chargent en moins d'une. Pas de spaghetti de plugins, pas d'explosion de coûts — un site qui travaille pour vous.",
      whatYouGet: [
        "Design propre à votre identité, pas un thème générique",
        "Score PageSpeed 95+ sur mobile et desktop",
        "Dark mode natif suivant l'appareil",
        "Entièrement responsive — téléphone, tablette, desktop",
        "Cartes Open Graph : beaux aperçus au partage social",
        "Accessible (WCAG) : focus, skip-links, reduced-motion",
      ],
      howItWorks: [
        { title: "Design sur votre marque", desc: "On part de votre logo, vos couleurs et vos photos — pas un template partagé par mille autres sites." },
        { title: "Construit en Next.js 16", desc: "Server-rendered, statique où c'est possible. Google voit une page complète, pas un loader vide." },
        { title: "Mesuré, pas deviné", desc: "Avant le lancement je vous montre les vrais scores Lighthouse. Pas du ressenti — des chiffres." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "D'un Squarespace lent à un PageSpeed de 98." },
        { slug: "mari-lines", note: "Site B2B rapide et rassurant qui génère des leads." },
      ],
      faq: [
        { q: "Mon site marche-t-il sur un vieux téléphone ?", a: "Oui. Je teste sur 3G lente et appareils anciens. La vitesse n'est pas un luxe — c'est la base." },
        { q: "Puis-je modifier les textes moi-même ?", a: "Avec le module admin, oui (voir « Admin sur mesure »). Sinon je modifie moi-même, vite et pas cher." },
        { q: "Combien ça coûte ?", a: "Dès €2 500 pour un Starter (jusqu'à 5 pages). Voir la page tarifs pour le détail." },
        { q: "Combien de temps ?", a: "Un Starter est généralement prêt en ~2 semaines depuis le lancement." },
      ],
      ctaTitle: "Prêt pour un site qui ne freine pas ?",
      ctaText: "Envoyez-moi brièvement ce que vous avez en tête — je vous montre sans engagement ce qui est possible.",
    },
    en: {
      title: "Fast, modern websites",
      short: "Next.js 16 + Tailwind. 95+ score on Google PageSpeed, native dark mode, no WordPress sluggishness.",
      heroTitle: "A site that loads before your visitor bounces.",
      heroIntro:
        "Half your visitors leave if your site takes longer than 3 seconds. Mine load in under one. No plugin spaghetti, no monthly cost explosion — a site that works for you.",
      whatYouGet: [
        "Custom design on your brand, not some theme",
        "PageSpeed score 95+ on mobile and desktop",
        "Native dark mode following the device",
        "Fully responsive — phone, tablet, desktop",
        "Open Graph cards: clean previews when shared",
        "Accessible (WCAG): focus states, skip links, reduced-motion",
      ],
      howItWorks: [
        { title: "Design on your brand", desc: "We start from your logo, colours and photos — not a template a thousand other sites run on." },
        { title: "Built in Next.js 16", desc: "Server-rendered, static where possible. Google sees a complete page, not an empty loader." },
        { title: "Measured, not guessed", desc: "Before launch I show you the real Lighthouse scores. Not 'feels fast' — numbers." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "From a slow Squarespace site to PageSpeed 98." },
        { slug: "mari-lines", note: "Fast, trust-building B2B site that brings in leads." },
      ],
      faq: [
        { q: "Does my site work well on an old phone?", a: "Yes. I test on slow 3G and older devices. Speed isn't a luxury — it's the baseline." },
        { q: "Can I edit text myself later?", a: "With the admin module, yes (see 'Custom admin'). Otherwise I update it myself, fast and cheap." },
        { q: "What does this cost?", a: "From €2,500 for a Starter (up to 5 pages). See the pricing page for details." },
        { q: "How long does it take?", a: "A Starter is usually ready in ~2 weeks from kick-off." },
      ],
      ctaTitle: "Ready for a site that doesn't fight back?",
      ctaText: "Send me a short note on what you have in mind — I'll show you what's possible, no strings attached.",
    },
  },
  webshops: {
    nl: {
      title: "Webshops met betalingen",
      short: "Mollie of Stripe, productenbeheer, voorraad, kortingscodes, gift cards, klantportaal. Voor 100 of 10 000 producten.",
      heroTitle: "Je eigen webshop — zonder de marge van een platform.",
      heroIntro:
        "Etsy, Shopify en co pakken een hap uit elke verkoop én houden je klantendata. Een eigen shop betaalt zichzelf typisch terug op 3–4 jaar. En jij houdt alles in handen.",
      whatYouGet: [
        "Mollie of Stripe checkout (Bancontact, kaart, ...)",
        "Producten, varianten, voorraadbeheer",
        "Kortingscodes en cadeaubonnen",
        "Klantportaal: bestellingen, facturen, retours",
        "Bestellingen-admin met PDF-facturen",
        "Schaalt van 100 tot 10 000 producten",
      ],
      howItWorks: [
        { title: "Catalogus opzetten", desc: "Producten, prijzen, varianten en voorraad — beheerd in een admin die voor jou is gemaakt." },
        { title: "Betalingen aansluiten", desc: "Mollie voor lokaal (lagere fees), Stripe voor internationaal. Webhooks zorgen dat bestellingen kloppen." },
        { title: "Klanten houden", desc: "Klantportaal + e-mailflows zodat kopers terugkomen — en jij hun data hebt, niet een platform." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Volledige fine-art shop met Mollie, gift cards, kortingscodes en klantportaal." },
      ],
      faq: [
        { q: "Mollie of Stripe?", a: "Mollie voor Belgisch/EU-publiek (Bancontact, lagere fees). Stripe als je internationaal verkoopt. Vaak allebei." },
        { q: "Wat met btw en facturen?", a: "Automatische PDF-facturen met correcte btw. Exporteerbaar voor je boekhouder." },
        { q: "Kan ik zelf producten toevoegen?", a: "Ja — de admin is gemaakt voor jou. Foto's uploaden, prijs zetten, online. Geen ontwikkelaar nodig." },
        { q: "Wat kost een webshop?", a: "Vanaf €7 500 inclusief tot 100 producten. Zie pricing voor de Webshop-formule." },
      ],
      ctaTitle: "Klaar om je eigen marge te houden?",
      ctaText: "Vertel me wat je verkoopt — ik reken vrijblijvend uit of een eigen shop voor jou loont.",
    },
    fr: {
      title: "Boutiques avec paiements",
      short: "Mollie ou Stripe, gestion produits, stock, codes promo, cartes-cadeaux, espace client. De 100 à 10 000 produits.",
      heroTitle: "Votre propre boutique — sans la marge d'une plateforme.",
      heroIntro:
        "Etsy, Shopify et compagnie prennent une part de chaque vente et gardent vos données clients. Une boutique propre se rembourse typiquement en 3–4 ans. Et vous gardez le contrôle.",
      whatYouGet: [
        "Checkout Mollie ou Stripe (Bancontact, carte, ...)",
        "Produits, variantes, gestion de stock",
        "Codes promo et cartes-cadeaux",
        "Espace client : commandes, factures, retours",
        "Admin commandes avec factures PDF",
        "De 100 à 10 000 produits",
      ],
      howItWorks: [
        { title: "Mettre en place le catalogue", desc: "Produits, prix, variantes et stock — gérés dans un admin fait pour vous." },
        { title: "Brancher les paiements", desc: "Mollie en local (frais plus bas), Stripe à l'international. Les webhooks garantissent des commandes justes." },
        { title: "Garder les clients", desc: "Espace client + flux e-mail pour faire revenir les acheteurs — et vous avez leurs données, pas une plateforme." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Boutique fine-art complète avec Mollie, cartes-cadeaux, codes promo et espace client." },
      ],
      faq: [
        { q: "Mollie ou Stripe ?", a: "Mollie pour le public belge/EU (Bancontact, frais plus bas). Stripe pour l'international. Souvent les deux." },
        { q: "Et la TVA et les factures ?", a: "Factures PDF automatiques avec TVA correcte. Exportables pour votre comptable." },
        { q: "Puis-je ajouter des produits moi-même ?", a: "Oui — l'admin est fait pour vous. Uploader photos, fixer le prix, en ligne. Sans développeur." },
        { q: "Combien coûte une boutique ?", a: "Dès €7 500 avec jusqu'à 100 produits. Voir tarifs pour la formule Boutique." },
      ],
      ctaTitle: "Prêt à garder votre marge ?",
      ctaText: "Dites-moi ce que vous vendez — je calcule sans engagement si une boutique propre est rentable pour vous.",
    },
    en: {
      title: "Webshops with payments",
      short: "Mollie or Stripe, product management, stock, discount codes, gift cards, customer portal. For 100 or 10,000 products.",
      heroTitle: "Your own webshop — without a platform's margin.",
      heroIntro:
        "Etsy, Shopify and co take a cut of every sale and keep your customer data. An own shop typically pays for itself in 3–4 years. And you stay in control.",
      whatYouGet: [
        "Mollie or Stripe checkout (Bancontact, card, ...)",
        "Products, variants, stock management",
        "Discount codes and gift cards",
        "Customer portal: orders, invoices, returns",
        "Orders admin with PDF invoices",
        "Scales from 100 to 10,000 products",
      ],
      howItWorks: [
        { title: "Set up the catalogue", desc: "Products, prices, variants and stock — managed in an admin built for you." },
        { title: "Connect payments", desc: "Mollie for local (lower fees), Stripe for international. Webhooks keep orders correct." },
        { title: "Keep customers", desc: "Customer portal + email flows so buyers return — and you own their data, not a platform." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Full fine-art shop with Mollie, gift cards, discount codes and customer portal." },
      ],
      faq: [
        { q: "Mollie or Stripe?", a: "Mollie for Belgian/EU audience (Bancontact, lower fees). Stripe if you sell internationally. Often both." },
        { q: "What about VAT and invoices?", a: "Automatic PDF invoices with correct VAT. Exportable for your accountant." },
        { q: "Can I add products myself?", a: "Yes — the admin is built for you. Upload photos, set price, online. No developer needed." },
        { q: "What does a webshop cost?", a: "From €7,500 including up to 100 products. See pricing for the Webshop plan." },
      ],
      ctaTitle: "Ready to keep your own margin?",
      ctaText: "Tell me what you sell — I'll work out, free of charge, whether an own shop pays off for you.",
    },
  },
  admin: {
    nl: {
      title: "Admin op maat",
      short: "Een eigen dashboard om klanten, bestellingen, foto's en content te beheren. Geen plugins die over een jaar breken.",
      heroTitle: "Een dashboard dat jij begrijpt — niet de developer.",
      heroIntro:
        "Een typische WordPress-admin is een doolhof. Ik bouw een dashboard met enkel wat jij nodig hebt: jouw menu's, jouw foto's, jouw klanten. Werkt op je telefoon, breekt niet bij een update.",
      whatYouGet: [
        "Login met rollen (jij, je team, read-only)",
        "Beheer van content, producten, klanten",
        "Foto-upload met automatische optimalisatie",
        "Exports naar CSV / Excel voor de boekhouding",
        "Werkt vlot op telefoon en tablet",
        "Audit-log: wie wijzigde wat, wanneer",
      ],
      howItWorks: [
        { title: "We bepalen wat jij beheert", desc: "Menu's? Vacatures? Producten? We bouwen exact die schermen, niet meer." },
        { title: "Eén database, jouw regels", desc: "Supabase met rij-beveiliging: je team ziet enkel wat het mag zien." },
        { title: "Mobiel-eerst", desc: "Onderweg een foto uploaden of een prijs wijzigen — vanaf je telefoon, in seconden." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Drie aparte admin-PWA's: shop, werven en verhuur — elk hun eigen schermen." },
        { slug: "jp-montreuil", note: "Eigen admin voor tentoonstellingen, albums en publicaties." },
      ],
      faq: [
        { q: "Moet ik technisch zijn?", a: "Nee. Als je een formulier kan invullen, kan je de admin gebruiken. Dat is precies het punt." },
        { q: "Kan mijn team mee?", a: "Ja, met rollen. Een medewerker kan bv. producten beheren maar geen facturen zien." },
        { q: "Breekt dit bij een update?", a: "Nee. Geen externe plugins die los van elkaar updaten. Eén codebase, één eigenaar." },
        { q: "Zit dit in een pakket?", a: "Ja, de admin zit in het Pro-pakket en hoger." },
      ],
      ctaTitle: "Wil je je site zelf beheren zonder kopzorgen?",
      ctaText: "Vertel me wat je dagelijks zou willen aanpassen — ik schets hoe jouw admin eruitziet.",
    },
    fr: {
      title: "Admin sur mesure",
      short: "Un tableau de bord propre pour gérer clients, commandes, photos et contenu. Pas de plugins qui cassent dans un an.",
      heroTitle: "Un dashboard que vous comprenez — pas le développeur.",
      heroIntro:
        "Un admin WordPress typique est un labyrinthe. Je construis un tableau de bord avec uniquement ce dont vous avez besoin : vos menus, vos photos, vos clients. Marche sur téléphone, ne casse pas à une mise à jour.",
      whatYouGet: [
        "Connexion avec rôles (vous, équipe, lecture seule)",
        "Gestion du contenu, produits, clients",
        "Upload photos avec optimisation automatique",
        "Exports CSV / Excel pour la comptabilité",
        "Fluide sur téléphone et tablette",
        "Journal d'audit : qui a modifié quoi, quand",
      ],
      howItWorks: [
        { title: "On définit ce que vous gérez", desc: "Menus ? Offres d'emploi ? Produits ? On construit exactement ces écrans, pas plus." },
        { title: "Une base, vos règles", desc: "Supabase avec sécurité au niveau ligne : votre équipe ne voit que ce qu'elle doit." },
        { title: "Mobile d'abord", desc: "Uploader une photo ou changer un prix en déplacement — depuis votre téléphone, en secondes." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Trois PWA admin distinctes : boutique, chantiers et location." },
        { slug: "jp-montreuil", note: "Admin propre pour expositions, albums et publications." },
      ],
      faq: [
        { q: "Dois-je être technique ?", a: "Non. Si vous savez remplir un formulaire, vous savez utiliser l'admin. C'est tout le but." },
        { q: "Mon équipe peut-elle participer ?", a: "Oui, avec des rôles. Un collaborateur peut gérer les produits sans voir les factures." },
        { q: "Ça casse à une mise à jour ?", a: "Non. Pas de plugins externes qui se mettent à jour séparément. Une codebase, un propriétaire." },
        { q: "Est-ce dans un forfait ?", a: "Oui, l'admin est dans le forfait Pro et au-dessus." },
      ],
      ctaTitle: "Gérer votre site sans soucis ?",
      ctaText: "Dites-moi ce que vous voudriez adapter au quotidien — j'esquisse à quoi ressemble votre admin.",
    },
    en: {
      title: "Custom admin",
      short: "Your own dashboard to manage clients, orders, photos and content. No plugins that break in a year.",
      heroTitle: "A dashboard you understand — not the developer.",
      heroIntro:
        "A typical WordPress admin is a maze. I build a dashboard with only what you need: your menus, your photos, your clients. Works on your phone, doesn't break on an update.",
      whatYouGet: [
        "Login with roles (you, your team, read-only)",
        "Manage content, products, clients",
        "Photo upload with automatic optimization",
        "Exports to CSV / Excel for accounting",
        "Works smoothly on phone and tablet",
        "Audit log: who changed what, when",
      ],
      howItWorks: [
        { title: "We decide what you manage", desc: "Menus? Job openings? Products? We build exactly those screens, no more." },
        { title: "One database, your rules", desc: "Supabase with row-level security: your team only sees what it should." },
        { title: "Mobile-first", desc: "Upload a photo or change a price on the go — from your phone, in seconds." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Three separate admin PWAs: shop, projects and rental." },
        { slug: "jp-montreuil", note: "Custom admin for exhibitions, albums and publications." },
      ],
      faq: [
        { q: "Do I need to be technical?", a: "No. If you can fill in a form, you can use the admin. That's exactly the point." },
        { q: "Can my team join?", a: "Yes, with roles. A staff member can manage products without seeing invoices." },
        { q: "Does this break on an update?", a: "No. No external plugins updating independently. One codebase, one owner." },
        { q: "Is this in a package?", a: "Yes, the admin is in the Pro package and up." },
      ],
      ctaTitle: "Want to run your site yourself, worry-free?",
      ctaText: "Tell me what you'd want to update daily — I'll sketch what your admin looks like.",
    },
  },
  meertalig: {
    nl: {
      title: "Tweetalig (NL / FR / EN)",
      short: "Volledig vertaalde sites met taalkeuze, SEO per taal, en een admin om vertalingen te beheren.",
      heroTitle: "Bereik ook de helft die je nu mist.",
      heroIntro:
        "In Brussel en Wallonië verlies je klanten met een NL-only site. Een echt meertalige site — niet Google Translate — opent een markt die er al was. Deze site zelf draait in NL, FR én EN.",
      whatYouGet: [
        "Volledig vertaalde routes (/nl, /fr, /en)",
        "Automatische taaldetectie + handmatige taalkeuze",
        "SEO per taal: hreflang, aparte metadata & sitemap",
        "Vertaalbare content via de admin",
        "Per-taal Open Graph previews",
        "Eén codebase — geen drie losse sites",
      ],
      howItWorks: [
        { title: "Taal-architectuur", desc: "URL per taal, cookie + browser-detectie, correcte hreflang voor Google." },
        { title: "Vertaling", desc: "Jij levert of laat mij de teksten verzorgen. Alles beheerbaar, niets hardcoded." },
        { title: "SEO per markt", desc: "Google indexeert je FR-pagina's apart van je NL — je verschijnt in beide markten." },
      ],
      examples: [
        { slug: "barbotte", note: "Volledig NL/FR voor het tweetalige Brusselse publiek." },
        { slug: "allardphilippe", note: "NL/FR webshop voor zowel Vlaams als Waals publiek." },
      ],
      faq: [
        { q: "Is dit Google Translate?", a: "Nee. Echte, beheerbare vertalingen — geen robotaal die je merk schaadt." },
        { q: "Helpt dit echt voor SEO?", a: "Ja. Met correcte hreflang indexeert Google elke taal apart. Je verschijnt in zoekresultaten in beide talen." },
        { q: "Kan ik later een taal toevoegen?", a: "Ja. De architectuur is erop gebouwd — een vierde taal is uitbreiding, geen herbouw." },
        { q: "Zit dit in een pakket?", a: "Tweetalig zit in het Pro-pakket. Deze site bewijst het: ze draait in 3 talen." },
      ],
      ctaTitle: "Klaar om je hele markt te bereiken?",
      ctaText: "Vertel me waar je klanten zitten — ik laat zien hoe een meertalige aanpak loont.",
    },
    fr: {
      title: "Bilingue (NL / FR / EN)",
      short: "Sites entièrement traduits avec choix de langue, SEO par langue, et un admin pour gérer les traductions.",
      heroTitle: "Atteignez aussi la moitié que vous ratez.",
      heroIntro:
        "À Bruxelles et en Wallonie, un site uniquement en NL fait perdre des clients. Un vrai site multilingue — pas Google Translate — ouvre un marché déjà présent. Ce site tourne en NL, FR et EN.",
      whatYouGet: [
        "Routes entièrement traduites (/nl, /fr, /en)",
        "Détection auto + choix de langue manuel",
        "SEO par langue : hreflang, metadata & sitemap séparés",
        "Contenu traduisible via l'admin",
        "Aperçus Open Graph par langue",
        "Une codebase — pas trois sites séparés",
      ],
      howItWorks: [
        { title: "Architecture de langue", desc: "URL par langue, cookie + détection navigateur, hreflang correct pour Google." },
        { title: "Traduction", desc: "Vous fournissez ou je m'occupe des textes. Tout gérable, rien en dur." },
        { title: "SEO par marché", desc: "Google indexe vos pages FR séparément des NL — vous apparaissez dans les deux marchés." },
      ],
      examples: [
        { slug: "barbotte", note: "Entièrement NL/FR pour le public bruxellois bilingue." },
        { slug: "allardphilippe", note: "Boutique NL/FR pour public flamand et wallon." },
      ],
      faq: [
        { q: "Est-ce du Google Translate ?", a: "Non. De vraies traductions gérables — pas une langue robotique qui nuit à votre marque." },
        { q: "Ça aide vraiment pour le SEO ?", a: "Oui. Avec un hreflang correct, Google indexe chaque langue séparément." },
        { q: "Puis-je ajouter une langue plus tard ?", a: "Oui. L'architecture est faite pour — une 4e langue est une extension, pas une refonte." },
        { q: "Est-ce dans un forfait ?", a: "Le bilingue est dans le forfait Pro. Ce site le prouve : il tourne en 3 langues." },
      ],
      ctaTitle: "Prêt à atteindre tout votre marché ?",
      ctaText: "Dites-moi où sont vos clients — je montre comment une approche multilingue est rentable.",
    },
    en: {
      title: "Multilingual (NL / FR / EN)",
      short: "Fully translated sites with language switching, per-language SEO, and an admin to manage translations.",
      heroTitle: "Reach the half you're missing too.",
      heroIntro:
        "In Brussels and Wallonia an NL-only site loses customers. A truly multilingual site — not Google Translate — opens a market that was already there. This site itself runs in NL, FR and EN.",
      whatYouGet: [
        "Fully translated routes (/nl, /fr, /en)",
        "Automatic detection + manual language switch",
        "Per-language SEO: hreflang, separate metadata & sitemap",
        "Translatable content via the admin",
        "Per-language Open Graph previews",
        "One codebase — not three separate sites",
      ],
      howItWorks: [
        { title: "Language architecture", desc: "URL per language, cookie + browser detection, correct hreflang for Google." },
        { title: "Translation", desc: "You provide or I handle the copy. All manageable, nothing hardcoded." },
        { title: "SEO per market", desc: "Google indexes your FR pages separately from NL — you appear in both markets." },
      ],
      examples: [
        { slug: "barbotte", note: "Fully NL/FR for the bilingual Brussels audience." },
        { slug: "allardphilippe", note: "NL/FR webshop for Flemish and Walloon audiences." },
      ],
      faq: [
        { q: "Is this Google Translate?", a: "No. Real, manageable translations — no robot language that hurts your brand." },
        { q: "Does this really help SEO?", a: "Yes. With correct hreflang, Google indexes each language separately." },
        { q: "Can I add a language later?", a: "Yes. The architecture is built for it — a 4th language is an extension, not a rebuild." },
        { q: "Is this in a package?", a: "Multilingual is in the Pro package. This site proves it: it runs in 3 languages." },
      ],
      ctaTitle: "Ready to reach your whole market?",
      ctaText: "Tell me where your customers are — I'll show how a multilingual approach pays off.",
    },
  },
  pwa: {
    nl: {
      title: "Progressive Web App",
      short: "Installeerbaar als app op telefoon, werkt offline, push notifications. Handig voor admins die onderweg werken.",
      heroTitle: "Een app op de telefoon — zonder App Store.",
      heroIntro:
        "Een PWA installeert vanuit de browser, werkt offline en voelt aan als een echte app. Geen App-Store-review, geen 30% commissie, één codebase voor web én app.",
      whatYouGet: [
        "Installeerbaar op iOS én Android",
        "Werkt offline (cached shell + fallback-pagina)",
        "Push notifications",
        "Eigen icoon op het startscherm",
        "Auto-updates — geen store-release nodig",
        "Eén codebase voor web + app",
      ],
      howItWorks: [
        { title: "Manifest + service worker", desc: "De site wordt installeerbaar en cachet zichzelf. Offline toon je een nette fallback." },
        { title: "Installeren", desc: "Bezoeker krijgt 'Toevoegen aan startscherm'. Klaar — geen download van honderden MB." },
        { title: "Updaten zonder review", desc: "Een deploy = de app is up-to-date. Geen Apple-review die dagen duurt." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Drie installeerbare PWA's — Céline werkt offline vanop de werf." },
      ],
      faq: [
        { q: "Is dit een echte app?", a: "Voor de gebruiker wel: icoon op het startscherm, fullscreen, offline. Technisch is het web — sneller te bouwen en te onderhouden." },
        { q: "Werkt het echt offline?", a: "De shell en een fallback-pagina wel. Live data heeft uiteraard verbinding nodig, maar de app crasht niet." },
        { q: "Push notifications op iOS?", a: "Ja, sinds recente iOS-versies ondersteunt Safari web-push voor geïnstalleerde PWA's." },
        { q: "Zit dit in een pakket?", a: "PWA is een module binnen het Pro-pakket." },
      ],
      ctaTitle: "Wil je een app zonder App-Store-gedoe?",
      ctaText: "Vertel me hoe je team onderweg werkt — ik toon wat een PWA voor jou oplost.",
    },
    fr: {
      title: "Progressive Web App",
      short: "Installable comme app sur téléphone, fonctionne hors ligne, notifications push. Pratique pour les admins en déplacement.",
      heroTitle: "Une app sur le téléphone — sans App Store.",
      heroIntro:
        "Une PWA s'installe depuis le navigateur, fonctionne hors ligne et donne l'impression d'une vraie app. Pas de review App Store, pas de 30% de commission, une codebase pour web et app.",
      whatYouGet: [
        "Installable sur iOS et Android",
        "Fonctionne hors ligne (shell caché + page fallback)",
        "Notifications push",
        "Icône propre sur l'écran d'accueil",
        "Mises à jour auto — pas de release store",
        "Une codebase pour web + app",
      ],
      howItWorks: [
        { title: "Manifest + service worker", desc: "Le site devient installable et se cache. Hors ligne, une page fallback propre s'affiche." },
        { title: "Installer", desc: "Le visiteur reçoit « Ajouter à l'écran d'accueil ». Fini — pas de téléchargement de centaines de Mo." },
        { title: "Mettre à jour sans review", desc: "Un déploiement = l'app est à jour. Pas de review Apple qui dure des jours." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Trois PWA installables — Céline travaille hors ligne sur le chantier." },
      ],
      faq: [
        { q: "Est-ce une vraie app ?", a: "Pour l'utilisateur oui : icône sur l'écran, plein écran, hors ligne. Techniquement c'est du web — plus rapide à construire et maintenir." },
        { q: "Ça marche vraiment hors ligne ?", a: "Le shell et une page fallback oui. Les données live ont besoin de connexion, mais l'app ne crashe pas." },
        { q: "Notifications push sur iOS ?", a: "Oui, depuis les versions récentes d'iOS, Safari supporte le web-push pour les PWA installées." },
        { q: "Est-ce dans un forfait ?", a: "La PWA est un module du forfait Pro." },
      ],
      ctaTitle: "Une app sans tracas d'App Store ?",
      ctaText: "Dites-moi comment votre équipe travaille en déplacement — je montre ce qu'une PWA résout.",
    },
    en: {
      title: "Progressive Web App",
      short: "Installable as an app on phone, works offline, push notifications. Handy for admins working on the go.",
      heroTitle: "An app on the phone — without the App Store.",
      heroIntro:
        "A PWA installs from the browser, works offline and feels like a real app. No App Store review, no 30% commission, one codebase for web and app.",
      whatYouGet: [
        "Installable on iOS and Android",
        "Works offline (cached shell + fallback page)",
        "Push notifications",
        "Own icon on the home screen",
        "Auto-updates — no store release needed",
        "One codebase for web + app",
      ],
      howItWorks: [
        { title: "Manifest + service worker", desc: "The site becomes installable and caches itself. Offline shows a clean fallback." },
        { title: "Install", desc: "Visitor gets 'Add to home screen'. Done — no hundreds-of-MB download." },
        { title: "Update without review", desc: "A deploy = the app is up to date. No Apple review taking days." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Three installable PWAs — Céline works offline on site." },
      ],
      faq: [
        { q: "Is this a real app?", a: "For the user, yes: home-screen icon, fullscreen, offline. Technically it's web — faster to build and maintain." },
        { q: "Does it really work offline?", a: "The shell and a fallback page do. Live data needs a connection, but the app doesn't crash." },
        { q: "Push notifications on iOS?", a: "Yes, since recent iOS versions Safari supports web push for installed PWAs." },
        { q: "Is this in a package?", a: "PWA is a module within the Pro package." },
      ],
      ctaTitle: "Want an app without App Store hassle?",
      ctaText: "Tell me how your team works on the go — I'll show what a PWA solves for you.",
    },
  },
  media: {
    nl: {
      title: "Beeld-pipeline",
      short: "Bulk-upload, automatische optimalisatie, watermark, EXIF-stripping, lazy loading. Foto-zware sites lopen niet meer vast.",
      heroTitle: "Honderden foto's, zonder dat je site kreunt.",
      heroIntro:
        "Fotografen en ateliers hebben veel beeld. Een naïeve aanpak maakt je site loodzwaar. Ik bouw een pipeline die foto's automatisch optimaliseert — scherp op het scherm, licht in gewicht.",
      whatYouGet: [
        "Bulk-upload van tientallen foto's tegelijk",
        "Automatische compressie + moderne formaten",
        "Optioneel watermark",
        "EXIF-stripping (geen GPS-data lekken)",
        "Lazy loading + blur-placeholder",
        "CDN-levering wereldwijd",
      ],
      howItWorks: [
        { title: "Upload", desc: "Sleep een map foto's in de admin. De pipeline doet de rest, server-side." },
        { title: "Optimaliseren", desc: "Resize, comprimeer, strip metadata, genereer placeholders — automatisch." },
        { title: "Serveren", desc: "Via CDN, lazy geladen. Bezoeker ziet scherpe beelden, je site blijft snel." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Wildlife fine-art prints — zware JPG's, toch een snelle site." },
        { slug: "jp-montreuil", note: "Galerij per album met drag-drop sortering." },
      ],
      faq: [
        { q: "Mijn foto's zijn enorm groot — een probleem?", a: "Nee. De pipeline herschaalt en comprimeert server-side. Jij upload het origineel, de bezoeker krijgt het optimale." },
        { q: "Verlies ik kwaliteit?", a: "Visueel nauwelijks. We mikken op de zoete plek tussen scherpte en gewicht." },
        { q: "Kan ik een watermark zetten?", a: "Ja, automatisch op upload — handig voor fotografen die hun werk beschermen." },
        { q: "Zit dit in een pakket?", a: "De beeld-pipeline is een module binnen Pro, vaak gecombineerd met de admin." },
      ],
      ctaTitle: "Veel beeld, en het moet snel blijven?",
      ctaText: "Stuur me een idee van je volume — ik toon hoe de pipeline dat aankan.",
    },
    fr: {
      title: "Pipeline d'images",
      short: "Upload en masse, optimisation automatique, filigrane, suppression EXIF, lazy loading. Les sites riches en photos ne plantent plus.",
      heroTitle: "Des centaines de photos, sans que votre site gémisse.",
      heroIntro:
        "Photographes et ateliers ont beaucoup d'images. Une approche naïve alourdit votre site. Je construis un pipeline qui optimise les photos automatiquement — net à l'écran, léger en poids.",
      whatYouGet: [
        "Upload en masse de dizaines de photos à la fois",
        "Compression auto + formats modernes",
        "Filigrane optionnel",
        "Suppression EXIF (pas de fuite GPS)",
        "Lazy loading + placeholder flou",
        "Livraison CDN mondiale",
      ],
      howItWorks: [
        { title: "Upload", desc: "Glissez un dossier de photos dans l'admin. Le pipeline fait le reste, côté serveur." },
        { title: "Optimiser", desc: "Redimensionner, compresser, retirer les métadonnées, générer des placeholders — automatiquement." },
        { title: "Servir", desc: "Via CDN, chargé en lazy. Le visiteur voit des images nettes, votre site reste rapide." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Tirages fine-art animaliers — JPG lourds, site rapide quand même." },
        { slug: "jp-montreuil", note: "Galerie par album avec tri drag-drop." },
      ],
      faq: [
        { q: "Mes photos sont énormes — un problème ?", a: "Non. Le pipeline redimensionne et compresse côté serveur. Vous uploadez l'original, le visiteur reçoit l'optimal." },
        { q: "Je perds en qualité ?", a: "Visuellement à peine. On vise le point d'équilibre entre netteté et poids." },
        { q: "Puis-je mettre un filigrane ?", a: "Oui, automatiquement à l'upload — pratique pour les photographes." },
        { q: "Est-ce dans un forfait ?", a: "Le pipeline d'images est un module dans Pro, souvent combiné à l'admin." },
      ],
      ctaTitle: "Beaucoup d'images, et ça doit rester rapide ?",
      ctaText: "Envoyez-moi une idée de votre volume — je montre comment le pipeline le gère.",
    },
    en: {
      title: "Image pipeline",
      short: "Bulk upload, automatic optimization, watermark, EXIF stripping, lazy loading. Photo-heavy sites no longer choke.",
      heroTitle: "Hundreds of photos, without your site groaning.",
      heroIntro:
        "Photographers and studios have lots of imagery. A naive approach makes your site heavy. I build a pipeline that optimizes photos automatically — sharp on screen, light in weight.",
      whatYouGet: [
        "Bulk upload of dozens of photos at once",
        "Automatic compression + modern formats",
        "Optional watermark",
        "EXIF stripping (no GPS data leaks)",
        "Lazy loading + blur placeholder",
        "Worldwide CDN delivery",
      ],
      howItWorks: [
        { title: "Upload", desc: "Drag a folder of photos into the admin. The pipeline does the rest, server-side." },
        { title: "Optimize", desc: "Resize, compress, strip metadata, generate placeholders — automatically." },
        { title: "Serve", desc: "Via CDN, lazy loaded. Visitor sees sharp images, your site stays fast." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Wildlife fine-art prints — heavy JPGs, fast site anyway." },
        { slug: "jp-montreuil", note: "Gallery per album with drag-drop sorting." },
      ],
      faq: [
        { q: "My photos are huge — a problem?", a: "No. The pipeline resizes and compresses server-side. You upload the original, the visitor gets the optimal." },
        { q: "Do I lose quality?", a: "Visually barely. We aim for the sweet spot between sharpness and weight." },
        { q: "Can I add a watermark?", a: "Yes, automatically on upload — handy for photographers protecting their work." },
        { q: "Is this in a package?", a: "The image pipeline is a module within Pro, often combined with the admin." },
      ],
      ctaTitle: "Lots of imagery, and it must stay fast?",
      ctaText: "Send me an idea of your volume — I'll show how the pipeline handles it.",
    },
  },
  newsletters: {
    nl: {
      title: "Newsletters & e-mail",
      short: "Mailing-tool ingebouwd in de admin: campagnes opstellen, planning, opens en clicks tracken, abonnees beheren.",
      heroTitle: "Je mailinglijst is van jou — niet van Mailchimp.",
      heroIntro:
        "Externe mailtools worden duur per abonnee en houden je data. Ik bouw de mailing-tool ín je admin: campagnes, planning, tracking, abonnees — alles op één plek, jouw eigendom.",
      whatYouGet: [
        "Campagnes opstellen in je eigen admin",
        "Inplannen of direct versturen",
        "Opens en clicks tracken",
        "Abonnees beheren + dubbele opt-in",
        "Uitschrijflink + GDPR-conforme afhandeling",
        "Verzending via Resend (hoge deliverability)",
      ],
      howItWorks: [
        { title: "Lijst opbouwen", desc: "Signup-formulier op je site, dubbele opt-in, abonnees in je eigen database." },
        { title: "Campagne maken", desc: "Tekst + beeld in de admin, preview, inplannen of nu versturen." },
        { title: "Meten", desc: "Zie wie opende en klikte. Leer wat werkt, zonder externe tool." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Newsletter met open/click-tracking, volledig in de eigen admin." },
      ],
      faq: [
        { q: "Waarom niet gewoon Mailchimp?", a: "Dat kost per abonnee en groeit mee met je succes. Ingebouwd betaal je enkel verzending — en je data blijft van jou." },
        { q: "Komt mijn mail wel aan?", a: "Verzending via Resend met SPF/DKIM correct ingesteld. Goede deliverability, geen spam-map." },
        { q: "Is dit GDPR-conform?", a: "Ja: dubbele opt-in, uitschrijflink, en data-verwijdering ingebouwd." },
        { q: "Zit dit in een pakket?", a: "Newsletter-module zit in Pro en hoger." },
      ],
      ctaTitle: "Klaar om je publiek écht te bezitten?",
      ctaText: "Vertel me hoe vaak je mailt — ik toon hoe de ingebouwde tool je geld bespaart.",
    },
    fr: {
      title: "Newsletters & e-mail",
      short: "Outil d'emailing intégré à l'admin : créer des campagnes, planifier, suivre ouvertures et clics, gérer les abonnés.",
      heroTitle: "Votre liste est à vous — pas à Mailchimp.",
      heroIntro:
        "Les outils mail externes deviennent chers par abonné et gardent vos données. J'intègre l'outil dans votre admin : campagnes, planning, suivi, abonnés — au même endroit, votre propriété.",
      whatYouGet: [
        "Créer des campagnes dans votre propre admin",
        "Planifier ou envoyer directement",
        "Suivre ouvertures et clics",
        "Gérer les abonnés + double opt-in",
        "Lien de désinscription + traitement RGPD",
        "Envoi via Resend (haute délivrabilité)",
      ],
      howItWorks: [
        { title: "Construire la liste", desc: "Formulaire d'inscription sur votre site, double opt-in, abonnés dans votre base." },
        { title: "Créer la campagne", desc: "Texte + image dans l'admin, aperçu, planifier ou envoyer maintenant." },
        { title: "Mesurer", desc: "Voyez qui a ouvert et cliqué. Apprenez ce qui marche, sans outil externe." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Newsletter avec suivi ouvertures/clics, entièrement dans l'admin propre." },
      ],
      faq: [
        { q: "Pourquoi pas simplement Mailchimp ?", a: "Ça coûte par abonné et grandit avec votre succès. Intégré, vous payez seulement l'envoi — vos données restent vôtres." },
        { q: "Mon mail arrive-t-il bien ?", a: "Envoi via Resend avec SPF/DKIM corrects. Bonne délivrabilité, pas le dossier spam." },
        { q: "Est-ce conforme RGPD ?", a: "Oui : double opt-in, lien de désinscription, suppression de données intégrée." },
        { q: "Est-ce dans un forfait ?", a: "Le module newsletter est dans Pro et au-dessus." },
      ],
      ctaTitle: "Prêt à vraiment posséder votre audience ?",
      ctaText: "Dites-moi à quelle fréquence vous envoyez — je montre comment l'outil intégré économise.",
    },
    en: {
      title: "Newsletters & email",
      short: "Mailing tool built into the admin: compose campaigns, schedule, track opens and clicks, manage subscribers.",
      heroTitle: "Your mailing list is yours — not Mailchimp's.",
      heroIntro:
        "External mail tools get expensive per subscriber and keep your data. I build the mailing tool into your admin: campaigns, scheduling, tracking, subscribers — all in one place, your property.",
      whatYouGet: [
        "Compose campaigns in your own admin",
        "Schedule or send directly",
        "Track opens and clicks",
        "Manage subscribers + double opt-in",
        "Unsubscribe link + GDPR-compliant handling",
        "Sending via Resend (high deliverability)",
      ],
      howItWorks: [
        { title: "Build the list", desc: "Signup form on your site, double opt-in, subscribers in your own database." },
        { title: "Create the campaign", desc: "Text + image in the admin, preview, schedule or send now." },
        { title: "Measure", desc: "See who opened and clicked. Learn what works, without an external tool." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Newsletter with open/click tracking, fully in the own admin." },
      ],
      faq: [
        { q: "Why not just Mailchimp?", a: "It charges per subscriber and grows with your success. Built in, you only pay for sending — and your data stays yours." },
        { q: "Does my mail arrive?", a: "Sending via Resend with SPF/DKIM set correctly. Good deliverability, no spam folder." },
        { q: "Is this GDPR-compliant?", a: "Yes: double opt-in, unsubscribe link, and data deletion built in." },
        { q: "Is this in a package?", a: "The newsletter module is in Pro and up." },
      ],
      ctaTitle: "Ready to truly own your audience?",
      ctaText: "Tell me how often you mail — I'll show how the built-in tool saves you money.",
    },
  },
  boekingen: {
    nl: {
      title: "Reservaties & boekingen",
      short: "Reservatieformulieren met kalender-koppeling, bevestigings-e-mails, no-show beheer voor restaurants en ateliers.",
      heroTitle: "Reservaties direct in je inbox — geen platform-marge.",
      heroIntro:
        "Boekingsplatformen pakken commissie en zetten een account-muur tussen jou en je klant. Een eigen reservatieflow: klant boekt, jij krijgt de mail, klant krijgt bevestiging. Klaar.",
      whatYouGet: [
        "Reservatieformulier op je eigen site",
        "Kalender-koppeling + beschikbaarheid",
        "Automatische bevestigings-e-mails",
        "Herinnering om no-shows te beperken",
        "Overzicht in de admin",
        "Geen platform-commissie",
      ],
      howItWorks: [
        { title: "Klant boekt", desc: "Datum, tijd, aantal personen — op je eigen site, geen account nodig." },
        { title: "Iedereen bevestigd", desc: "Jij krijgt de aanvraag, de klant krijgt automatisch een bevestiging." },
        { title: "Minder no-shows", desc: "Automatische herinnering vlak voor de afspraak — minder lege tafels." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Reservaties + seizoensmenu + vacatures, alles in eigen beheer." },
        { slug: "barbotte", note: "Tweetalig reservatieformulier dat rechtstreeks naar de zaak mailt." },
      ],
      faq: [
        { q: "Wat als ik al een boekingssysteem heb?", a: "We kunnen koppelen, of vervangen. Vaak is een eigen flow goedkoper én simpeler voor je klant." },
        { q: "Moet mijn klant een account maken?", a: "Nee. Dat is net het voordeel — geen drempel, geen platform tussen jullie." },
        { q: "Kan ik beschikbaarheid beperken?", a: "Ja: openingsuren, capaciteit, gesloten dagen — allemaal instelbaar." },
        { q: "Zit dit in een pakket?", a: "Reservatie-module zit in Pro, vaak met de admin." },
      ],
      ctaTitle: "Klaar om reservaties zelf in handen te nemen?",
      ctaText: "Vertel me hoe je nu boekt — ik schets een flow zonder platform-marge.",
    },
    fr: {
      title: "Réservations & rendez-vous",
      short: "Formulaires de réservation avec lien calendrier, e-mails de confirmation, gestion des no-shows pour restaurants et ateliers.",
      heroTitle: "Réservations directement dans votre boîte — sans marge de plateforme.",
      heroIntro:
        "Les plateformes de réservation prennent une commission et mettent un mur de compte entre vous et votre client. Un flux propre : le client réserve, vous recevez le mail, le client reçoit la confirmation. Terminé.",
      whatYouGet: [
        "Formulaire de réservation sur votre site",
        "Lien calendrier + disponibilité",
        "E-mails de confirmation automatiques",
        "Rappel pour limiter les no-shows",
        "Aperçu dans l'admin",
        "Pas de commission de plateforme",
      ],
      howItWorks: [
        { title: "Le client réserve", desc: "Date, heure, nombre de personnes — sur votre site, sans compte." },
        { title: "Tout le monde confirmé", desc: "Vous recevez la demande, le client reçoit automatiquement une confirmation." },
        { title: "Moins de no-shows", desc: "Rappel automatique juste avant le rendez-vous — moins de tables vides." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Réservations + carte saisonnière + emplois, tout en gestion propre." },
        { slug: "barbotte", note: "Formulaire de réservation bilingue qui écrit directement à l'établissement." },
      ],
      faq: [
        { q: "Et si j'ai déjà un système de réservation ?", a: "On peut connecter, ou remplacer. Souvent un flux propre est moins cher et plus simple pour le client." },
        { q: "Mon client doit-il créer un compte ?", a: "Non. C'est justement l'avantage — pas de barrière, pas de plateforme entre vous." },
        { q: "Puis-je limiter la disponibilité ?", a: "Oui : heures d'ouverture, capacité, jours fermés — tout réglable." },
        { q: "Est-ce dans un forfait ?", a: "Le module réservation est dans Pro, souvent avec l'admin." },
      ],
      ctaTitle: "Prêt à reprendre les réservations en main ?",
      ctaText: "Dites-moi comment vous réservez aujourd'hui — j'esquisse un flux sans marge de plateforme.",
    },
    en: {
      title: "Reservations & bookings",
      short: "Reservation forms with calendar linking, confirmation emails, no-show management for restaurants and studios.",
      heroTitle: "Reservations straight to your inbox — no platform margin.",
      heroIntro:
        "Booking platforms take commission and put an account wall between you and your client. An own flow: client books, you get the mail, client gets confirmation. Done.",
      whatYouGet: [
        "Reservation form on your own site",
        "Calendar linking + availability",
        "Automatic confirmation emails",
        "Reminder to reduce no-shows",
        "Overview in the admin",
        "No platform commission",
      ],
      howItWorks: [
        { title: "Client books", desc: "Date, time, party size — on your own site, no account needed." },
        { title: "Everyone confirmed", desc: "You get the request, the client automatically gets a confirmation." },
        { title: "Fewer no-shows", desc: "Automatic reminder just before the appointment — fewer empty tables." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Reservations + seasonal menu + jobs, all self-managed." },
        { slug: "barbotte", note: "Bilingual reservation form that emails the venue directly." },
      ],
      faq: [
        { q: "What if I already have a booking system?", a: "We can integrate, or replace. Often an own flow is cheaper and simpler for your client." },
        { q: "Does my client need an account?", a: "No. That's exactly the advantage — no barrier, no platform between you." },
        { q: "Can I limit availability?", a: "Yes: opening hours, capacity, closed days — all configurable." },
        { q: "Is this in a package?", a: "The reservation module is in Pro, often with the admin." },
      ],
      ctaTitle: "Ready to take reservations into your own hands?",
      ctaText: "Tell me how you book now — I'll sketch a flow without platform margin.",
    },
  },
  seo: {
    nl: {
      title: "SEO en analytics",
      short: "Sitemap, metadata, structured data, Open Graph cards. Privacy-vriendelijke analytics zonder cookie-banner-drama.",
      heroTitle: "Gevonden worden, zonder je bezoekers te bespioneren.",
      heroIntro:
        "SEO is geen plugin die je achteraf plakt — het zit in hoe de site gebouwd is. Snelle, server-rendered pagina's met correcte structured data. Plus analytics die geen cookie-banner-drama veroorzaken.",
      whatYouGet: [
        "Sitemap.xml + robots.txt automatisch",
        "Per-pagina metadata + Open Graph cards",
        "Structured data (JSON-LD): Organization, Article, Breadcrumb",
        "Hreflang bij meertalige sites",
        "Permanente redirects bij migratie",
        "Privacy-vriendelijke analytics (geen cookie-banner nodig)",
      ],
      howItWorks: [
        { title: "Technische basis", desc: "Server-rendered, snelle pagina's. Google's bot ziet complete inhoud, niet een lege loader." },
        { title: "Structured data", desc: "JSON-LD zodat Google rich results toont — sterren, breadcrumbs, FAQ in de zoekresultaten." },
        { title: "Meten zonder spioneren", desc: "Geanonimiseerde paginabezoeken. Geen persoonsdata, dus geen cookie-banner-verplichting." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Migratie met permanente redirects — geen ranking verloren." },
      ],
      faq: [
        { q: "Garandeer je #1 in Google?", a: "Niemand kan dat eerlijk beloven. Wat ik wél garandeer: een technisch perfecte basis waar SEO op kàn werken." },
        { q: "Moet ik een cookie-banner?", a: "Voor privacy-vriendelijke analytics niet. We meten zonder persoonsdata of tracking-cookies." },
        { q: "Wat met mijn huidige ranking bij een migratie?", a: "Permanente 301-redirects + behouden sitemap. Je ranking verhuist mee." },
        { q: "Zit dit in een pakket?", a: "SEO-basis zit standaard in élk pakket, ook Starter." },
      ],
      ctaTitle: "Klaar om gevonden te worden?",
      ctaText: "Geef me je domein — ik doe een gratis snelle SEO-check en zeg eerlijk wat er kan.",
    },
    fr: {
      title: "SEO et analytics",
      short: "Sitemap, metadata, données structurées, cartes Open Graph. Analytics respectueux de la vie privée, sans drame de bannière cookie.",
      heroTitle: "Être trouvé, sans espionner vos visiteurs.",
      heroIntro:
        "Le SEO n'est pas un plugin qu'on colle après — c'est dans la façon dont le site est construit. Pages rapides server-rendered avec données structurées correctes. Plus des analytics sans drame de bannière cookie.",
      whatYouGet: [
        "Sitemap.xml + robots.txt automatiques",
        "Metadata par page + cartes Open Graph",
        "Données structurées (JSON-LD) : Organization, Article, Breadcrumb",
        "Hreflang pour les sites multilingues",
        "Redirections permanentes lors de migration",
        "Analytics respectueux (pas de bannière cookie)",
      ],
      howItWorks: [
        { title: "Base technique", desc: "Pages rapides server-rendered. Le bot Google voit le contenu complet, pas un loader vide." },
        { title: "Données structurées", desc: "JSON-LD pour que Google affiche des rich results — étoiles, breadcrumbs, FAQ dans les résultats." },
        { title: "Mesurer sans espionner", desc: "Visites de pages anonymisées. Pas de données personnelles, donc pas d'obligation de bannière cookie." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Migration avec redirections permanentes — aucun classement perdu." },
      ],
      faq: [
        { q: "Garantissez-vous la 1re place sur Google ?", a: "Personne ne peut le promettre honnêtement. Ce que je garantis : une base technique parfaite où le SEO peut fonctionner." },
        { q: "Faut-il une bannière cookie ?", a: "Pour les analytics respectueux, non. On mesure sans données personnelles ni cookies de tracking." },
        { q: "Et mon classement actuel lors d'une migration ?", a: "Redirections 301 permanentes + sitemap conservé. Votre classement déménage avec." },
        { q: "Est-ce dans un forfait ?", a: "La base SEO est de série dans chaque forfait, même Starter." },
      ],
      ctaTitle: "Prêt à être trouvé ?",
      ctaText: "Donnez-moi votre domaine — je fais un check SEO rapide gratuit et dis honnêtement ce qui est possible.",
    },
    en: {
      title: "SEO and analytics",
      short: "Sitemap, metadata, structured data, Open Graph cards. Privacy-friendly analytics without cookie-banner drama.",
      heroTitle: "Get found, without spying on your visitors.",
      heroIntro:
        "SEO isn't a plugin you stick on afterwards — it's in how the site is built. Fast, server-rendered pages with correct structured data. Plus analytics that cause no cookie-banner drama.",
      whatYouGet: [
        "Sitemap.xml + robots.txt automatically",
        "Per-page metadata + Open Graph cards",
        "Structured data (JSON-LD): Organization, Article, Breadcrumb",
        "Hreflang for multilingual sites",
        "Permanent redirects on migration",
        "Privacy-friendly analytics (no cookie banner needed)",
      ],
      howItWorks: [
        { title: "Technical base", desc: "Server-rendered, fast pages. Google's bot sees complete content, not an empty loader." },
        { title: "Structured data", desc: "JSON-LD so Google shows rich results — stars, breadcrumbs, FAQ in the search results." },
        { title: "Measure without spying", desc: "Anonymized page views. No personal data, so no cookie-banner obligation." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Migration with permanent redirects — no ranking lost." },
      ],
      faq: [
        { q: "Do you guarantee #1 on Google?", a: "No one can honestly promise that. What I do guarantee: a technically perfect base where SEO can work." },
        { q: "Do I need a cookie banner?", a: "For privacy-friendly analytics, no. We measure without personal data or tracking cookies." },
        { q: "What about my current ranking on migration?", a: "Permanent 301 redirects + preserved sitemap. Your ranking moves with you." },
        { q: "Is this in a package?", a: "The SEO base is standard in every package, even Starter." },
      ],
      ctaTitle: "Ready to get found?",
      ctaText: "Give me your domain — I'll do a free quick SEO check and tell you honestly what's possible.",
    },
  },
  gdpr: {
    nl: {
      title: "GDPR-conform",
      short: "Cookie-policy, consent management, data-export en -verwijdering ingebouwd. Geen juridische kopzorgen.",
      heroTitle: "Privacy in orde — zonder dat jij jurist hoeft te zijn.",
      heroIntro:
        "GDPR is geen bijzaak die je vergeet tot er een boete dreigt. In elke site die ik bouw zit het ingebouwd: cookie-beleid, consent, data-export en -verwijdering. Hosting in Europa.",
      whatYouGet: [
        "Cookie-banner met echte keuze (geen dark patterns)",
        "Privacy- en cookieverklaring",
        "Consent management",
        "Data-export op verzoek",
        "Recht om vergeten te worden (data-verwijdering)",
        "Hosting in EU (Vercel + Supabase EU-regio)",
      ],
      howItWorks: [
        { title: "Minimaal verzamelen", desc: "We verzamelen enkel wat nodig is. Geen tracking-cookies, geen verkoop van data." },
        { title: "Consent eerlijk", desc: "Een banner die je echt kan weigeren — niet één waar 'akkoord' de enige knop is." },
        { title: "Rechten ingebouwd", desc: "Inzage, export en verwijdering zijn knoppen, geen juridisch project." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Webshop met klantportaal — data-export en -verwijdering ingebouwd." },
      ],
      faq: [
        { q: "Ben ik dan helemaal in orde?", a: "Technisch lever ik een conforme basis. Voor je specifieke situatie blijft een jurist het laatste woord — maar je begint niet van nul." },
        { q: "Heb ik echt een cookie-banner nodig?", a: "Enkel bij niet-functionele cookies. Met privacy-vriendelijke analytics vaak niet — schoner én sneller." },
        { q: "Waar staat mijn data?", a: "In de EU. Vercel EU-regio + Supabase EU-regio. Geen transfer buiten Europa zonder reden." },
        { q: "Zit dit in een pakket?", a: "GDPR-basis zit standaard in élk pakket." },
      ],
      ctaTitle: "Klaar om privacy van je lijst te schrappen?",
      ctaText: "Vertel me welke data je verzamelt — ik zeg eerlijk wat in orde moet zijn.",
    },
    fr: {
      title: "Conforme RGPD",
      short: "Politique cookies, gestion du consentement, export et suppression des données intégrés. Pas de soucis juridiques.",
      heroTitle: "Vie privée en ordre — sans devoir être juriste.",
      heroIntro:
        "Le RGPD n'est pas un détail qu'on oublie jusqu'à la menace d'amende. Dans chaque site que je construis, c'est intégré : politique cookies, consentement, export et suppression. Hébergement en Europe.",
      whatYouGet: [
        "Bannière cookies avec vrai choix (pas de dark patterns)",
        "Déclarations confidentialité et cookies",
        "Gestion du consentement",
        "Export de données sur demande",
        "Droit à l'oubli (suppression de données)",
        "Hébergement en EU (Vercel + région Supabase EU)",
      ],
      howItWorks: [
        { title: "Collecter le minimum", desc: "On ne collecte que le nécessaire. Pas de cookies de tracking, pas de vente de données." },
        { title: "Consentement honnête", desc: "Une bannière vraiment refusable — pas une où « accepter » est le seul bouton." },
        { title: "Droits intégrés", desc: "Accès, export et suppression sont des boutons, pas un projet juridique." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Boutique avec espace client — export et suppression de données intégrés." },
      ],
      faq: [
        { q: "Suis-je alors totalement en règle ?", a: "Techniquement je livre une base conforme. Pour votre situation un juriste a le dernier mot — mais vous ne partez pas de zéro." },
        { q: "Ai-je vraiment besoin d'une bannière cookie ?", a: "Uniquement pour les cookies non fonctionnels. Avec des analytics respectueux, souvent non." },
        { q: "Où sont mes données ?", a: "En EU. Région Vercel EU + Supabase EU. Pas de transfert hors Europe sans raison." },
        { q: "Est-ce dans un forfait ?", a: "La base RGPD est de série dans chaque forfait." },
      ],
      ctaTitle: "Prêt à rayer la vie privée de votre liste ?",
      ctaText: "Dites-moi quelles données vous collectez — je dis honnêtement ce qui doit être en ordre.",
    },
    en: {
      title: "GDPR compliant",
      short: "Cookie policy, consent management, data export and deletion built in. No legal headaches.",
      heroTitle: "Privacy sorted — without you having to be a lawyer.",
      heroIntro:
        "GDPR isn't a side issue you forget until a fine looms. In every site I build it's baked in: cookie policy, consent, data export and deletion. Hosting in Europe.",
      whatYouGet: [
        "Cookie banner with real choice (no dark patterns)",
        "Privacy and cookie statements",
        "Consent management",
        "Data export on request",
        "Right to be forgotten (data deletion)",
        "Hosting in EU (Vercel + Supabase EU region)",
      ],
      howItWorks: [
        { title: "Collect minimally", desc: "We collect only what's needed. No tracking cookies, no selling data." },
        { title: "Honest consent", desc: "A banner you can actually refuse — not one where 'accept' is the only button." },
        { title: "Rights built in", desc: "Access, export and deletion are buttons, not a legal project." },
      ],
      examples: [
        { slug: "allardphilippe", note: "Webshop with customer portal — data export and deletion built in." },
      ],
      faq: [
        { q: "Am I then fully compliant?", a: "Technically I deliver a compliant base. For your specific situation a lawyer has the last word — but you don't start from zero." },
        { q: "Do I really need a cookie banner?", a: "Only for non-functional cookies. With privacy-friendly analytics, often not." },
        { q: "Where is my data?", a: "In the EU. Vercel EU region + Supabase EU. No transfer outside Europe without reason." },
        { q: "Is this in a package?", a: "The GDPR base is standard in every package." },
      ],
      ctaTitle: "Ready to cross privacy off your list?",
      ctaText: "Tell me what data you collect — I'll honestly say what needs to be in order.",
    },
  },
  migratie: {
    nl: {
      title: "Migratie vanaf WordPress / Squarespace",
      short: "Bestaande site overzetten zonder SEO-verlies: redirects, sitemap, structured data en alle content geïmporteerd. Geen blanco pagina op dag 1.",
      heroTitle: "Weg van traag, zonder je ranking te verliezen.",
      heroIntro:
        "Bang om te migreren omdat je je Google-positie kwijt zou raken? Terecht — als je 't fout doet. Met permanente redirects en behouden structuur verhuist je ranking gewoon mee. Sneller, goedkoper, van jou.",
      whatYouGet: [
        "Volledige content-import (pagina's, posts, media)",
        "Permanente 301-redirects per oude URL",
        "Sitemap + structured data overgenomen",
        "Visuele audit vóór live-gang",
        "Soft launch + monitoring",
        "Geen blanco pagina op dag 1",
      ],
      howItWorks: [
        { title: "Inventaris", desc: "We brengen elke bestaande URL in kaart — wat behouden, wat samenvoegen, wat redirecten." },
        { title: "Herbouw + import", desc: "Nieuwe site in Next.js, alle content geïmporteerd, geen copy-paste-marathon." },
        { title: "Veilige overschakeling", desc: "301-redirects live, sitemap ingediend, ranking gemonitord. Geen vrije val." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Squarespace → Next.js. PageSpeed 32 → 98, ranking behouden." },
        { slug: "jp-montreuil", note: "WordPress → Next.js + Supabase admin, volledig NL/FR." },
      ],
      faq: [
        { q: "Verlies ik mijn Google-positie?", a: "Niet als het correct gebeurt. Permanente 301-redirects vertellen Google: deze pagina is verhuisd. Ranking volgt." },
        { q: "Wat met mijn oude links die elders staan?", a: "Die blijven werken via redirects naar de juiste nieuwe pagina." },
        { q: "Hoe lang ben ik offline?", a: "Niet. We schakelen pas over als de nieuwe site klaar en getest is. Soft launch." },
        { q: "Wat kost een migratie?", a: "Scope-afhankelijk (hoeveelheid content + redirects). Valt onder Custom — ik geef vooraf een eerlijke schatting." },
      ],
      ctaTitle: "Klaar om eindelijk van WordPress af te zijn?",
      ctaText: "Geef me je huidige site-URL — ik schat vrijblijvend de migratie in.",
    },
    fr: {
      title: "Migration depuis WordPress / Squarespace",
      short: "Transférer un site existant sans perte de SEO : redirections, sitemap, données structurées et tout le contenu importé. Pas de page blanche au jour 1.",
      heroTitle: "Quitter la lenteur, sans perdre votre classement.",
      heroIntro:
        "Peur de migrer car vous perdriez votre position Google ? Légitime — si vous le faites mal. Avec des redirections permanentes et une structure conservée, votre classement déménage. Plus rapide, moins cher, à vous.",
      whatYouGet: [
        "Import complet du contenu (pages, posts, médias)",
        "Redirections 301 permanentes par ancienne URL",
        "Sitemap + données structurées repris",
        "Audit visuel avant mise en ligne",
        "Soft launch + monitoring",
        "Pas de page blanche au jour 1",
      ],
      howItWorks: [
        { title: "Inventaire", desc: "On cartographie chaque URL existante — quoi garder, fusionner, rediriger." },
        { title: "Reconstruction + import", desc: "Nouveau site en Next.js, tout le contenu importé, pas de marathon copier-coller." },
        { title: "Bascule sûre", desc: "Redirections 301 en ligne, sitemap soumis, classement monitoré. Pas de chute libre." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Squarespace → Next.js. PageSpeed 32 → 98, classement conservé." },
        { slug: "jp-montreuil", note: "WordPress → Next.js + admin Supabase, entièrement NL/FR." },
      ],
      faq: [
        { q: "Vais-je perdre ma position Google ?", a: "Pas si c'est fait correctement. Les redirections 301 disent à Google : cette page a déménagé. Le classement suit." },
        { q: "Et mes anciens liens ailleurs ?", a: "Ils continuent de marcher via redirections vers la bonne nouvelle page." },
        { q: "Combien de temps suis-je hors ligne ?", a: "Pas du tout. On bascule seulement quand le nouveau site est prêt et testé. Soft launch." },
        { q: "Combien coûte une migration ?", a: "Selon le scope (volume + redirections). Sous Custom — j'estime honnêtement à l'avance." },
      ],
      ctaTitle: "Prêt à enfin quitter WordPress ?",
      ctaText: "Donnez-moi l'URL de votre site actuel — j'estime la migration sans engagement.",
    },
    en: {
      title: "Migration from WordPress / Squarespace",
      short: "Move an existing site without SEO loss: redirects, sitemap, structured data and all content imported. No blank page on day 1.",
      heroTitle: "Leave slow behind, without losing your ranking.",
      heroIntro:
        "Afraid to migrate because you'd lose your Google position? Fair — if you do it wrong. With permanent redirects and preserved structure, your ranking simply moves with you. Faster, cheaper, yours.",
      whatYouGet: [
        "Full content import (pages, posts, media)",
        "Permanent 301 redirects per old URL",
        "Sitemap + structured data carried over",
        "Visual audit before go-live",
        "Soft launch + monitoring",
        "No blank page on day 1",
      ],
      howItWorks: [
        { title: "Inventory", desc: "We map every existing URL — what to keep, merge, redirect." },
        { title: "Rebuild + import", desc: "New site in Next.js, all content imported, no copy-paste marathon." },
        { title: "Safe switchover", desc: "301 redirects live, sitemap submitted, ranking monitored. No free fall." },
      ],
      examples: [
        { slug: "cottage-waregem", note: "Squarespace → Next.js. PageSpeed 32 → 98, ranking preserved." },
        { slug: "jp-montreuil", note: "WordPress → Next.js + Supabase admin, fully NL/FR." },
      ],
      faq: [
        { q: "Will I lose my Google position?", a: "Not if done correctly. Permanent 301 redirects tell Google: this page moved. Ranking follows." },
        { q: "What about my old links elsewhere?", a: "They keep working via redirects to the right new page." },
        { q: "How long am I offline?", a: "Not at all. We only switch when the new site is ready and tested. Soft launch." },
        { q: "What does a migration cost?", a: "Scope-dependent (content + redirects). Under Custom — I give an honest estimate up front." },
      ],
      ctaTitle: "Ready to finally leave WordPress?",
      ctaText: "Give me your current site URL — I'll estimate the migration, no strings attached.",
    },
  },
  hosting: {
    nl: {
      title: "Hosting, deploy & onderhoud",
      short: "Vercel + Supabase setup, automatische backups, error tracking, security updates. Eén aanspreekpunt voor de hele stack.",
      heroTitle: "Eén aanspreekpunt — niet vijf facturen.",
      heroIntro:
        "Een site is niet 'af' bij lancering. Hosting, backups, security, monitoring: één partij die alles kent en bij wie je terecht kan. Geen drie leveranciers die naar elkaar wijzen.",
      whatYouGet: [
        "Vercel + Supabase setup en beheer",
        "Automatische dagelijkse backups",
        "Error tracking + monitoring",
        "Security updates",
        "SSL automatisch (en hernieuwd)",
        "Eén aanspreekpunt voor de hele stack",
      ],
      howItWorks: [
        { title: "Setup", desc: "Hosting, database, domein, SSL — ik zet alles op en houd het draaiend." },
        { title: "Bewaken", desc: "Monitoring + error tracking. Vaak los ik iets op vóór jij het merkt." },
        { title: "Onderhouden", desc: "Updates, backups, kleine aanpassingen — afhankelijk van je abonnement." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Drie PWA's op één stack — gemeenschappelijk beheer, één aanspreekpunt." },
      ],
      faq: [
        { q: "Moet ik een abonnement nemen?", a: "Niet verplicht. Zonder abonnement staat je site op de free tier; support reken ik dan per uur (€95/u). Een Care/Plus/Scale abonnement is doorgaans goedkoper én geruststellender." },
        { q: "Wat als de site plat ligt?", a: "Met monitoring krijg ik (en jij bij Plus/Scale) automatisch een melding. Vaak hersteld vóór klanten het zien." },
        { q: "Krijg ik de code als we stoppen?", a: "Ja, altijd. De code zit in jouw GitHub-repo. Geen gijzeling." },
        { q: "Wat kost dit?", a: "Care €49/m, Plus €149/m, Scale €399/m. Zie pricing voor wat erin zit." },
      ],
      ctaTitle: "Klaar om je stack uit handen te geven?",
      ctaText: "Vertel me wat je nu draait — ik stel een onderhouds-formule voor die past.",
    },
    fr: {
      title: "Hébergement, déploiement & maintenance",
      short: "Setup Vercel + Supabase, sauvegardes automatiques, suivi des erreurs, mises à jour de sécurité. Un seul interlocuteur pour toute la stack.",
      heroTitle: "Un seul interlocuteur — pas cinq factures.",
      heroIntro:
        "Un site n'est pas « fini » au lancement. Hébergement, sauvegardes, sécurité, monitoring : une partie qui connaît tout et chez qui vous pouvez aller. Pas trois fournisseurs qui se renvoient la balle.",
      whatYouGet: [
        "Setup et gestion Vercel + Supabase",
        "Sauvegardes quotidiennes automatiques",
        "Suivi des erreurs + monitoring",
        "Mises à jour de sécurité",
        "SSL automatique (et renouvelé)",
        "Un seul interlocuteur pour toute la stack",
      ],
      howItWorks: [
        { title: "Setup", desc: "Hébergement, base, domaine, SSL — je mets tout en place et le garde en marche." },
        { title: "Surveiller", desc: "Monitoring + suivi des erreurs. Souvent je règle un souci avant que vous le remarquiez." },
        { title: "Maintenir", desc: "Mises à jour, sauvegardes, petits ajustements — selon votre abonnement." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Trois PWA sur une stack — gestion commune, un interlocuteur." },
      ],
      faq: [
        { q: "Dois-je prendre un abonnement ?", a: "Pas obligatoire. Sans abonnement, votre site reste sur le free tier ; le support est alors à l'heure (€95/h). Un abonnement Care/Plus/Scale est généralement moins cher et plus rassurant." },
        { q: "Et si le site tombe ?", a: "Avec le monitoring, je reçois (et vous en Plus/Scale) une alerte automatique. Souvent réparé avant que les clients le voient." },
        { q: "Est-ce que je récupère le code si on arrête ?", a: "Oui, toujours. Le code est dans votre dépôt GitHub. Pas de prise d'otage." },
        { q: "Combien ça coûte ?", a: "Care €49/m, Plus €149/m, Scale €399/m. Voir tarifs pour le contenu." },
      ],
      ctaTitle: "Prêt à déléguer votre stack ?",
      ctaText: "Dites-moi ce que vous faites tourner — je propose une formule de maintenance adaptée.",
    },
    en: {
      title: "Hosting, deploy & maintenance",
      short: "Vercel + Supabase setup, automatic backups, error tracking, security updates. One point of contact for the whole stack.",
      heroTitle: "One point of contact — not five invoices.",
      heroIntro:
        "A site isn't 'done' at launch. Hosting, backups, security, monitoring: one party that knows everything and that you can turn to. No three vendors pointing at each other.",
      whatYouGet: [
        "Vercel + Supabase setup and management",
        "Automatic daily backups",
        "Error tracking + monitoring",
        "Security updates",
        "SSL automatic (and renewed)",
        "One point of contact for the whole stack",
      ],
      howItWorks: [
        { title: "Setup", desc: "Hosting, database, domain, SSL — I set it all up and keep it running." },
        { title: "Monitor", desc: "Monitoring + error tracking. Often I fix something before you notice it." },
        { title: "Maintain", desc: "Updates, backups, small tweaks — depending on your subscription." },
      ],
      examples: [
        { slug: "celine-interieur", note: "Three PWAs on one stack — shared management, one contact." },
      ],
      faq: [
        { q: "Do I have to take a subscription?", a: "Not required. Without one, your site sits on the free tier; support is then hourly (€95/h). A Care/Plus/Scale subscription is usually cheaper and more reassuring." },
        { q: "What if the site goes down?", a: "With monitoring, I (and you on Plus/Scale) get an automatic alert. Often fixed before customers see it." },
        { q: "Do I get the code if we stop?", a: "Yes, always. The code is in your GitHub repo. No hostage situation." },
        { q: "What does this cost?", a: "Care €49/m, Plus €149/m, Scale €399/m. See pricing for what's included." },
      ],
      ctaTitle: "Ready to hand off your stack?",
      ctaText: "Tell me what you run now — I'll propose a maintenance plan that fits.",
    },
  },
};

export function getCapabilities(locale: Locale): Capability[] {
  return slugs.map((slug) => {
    const c = data[slug][locale];
    return { slug, icon: icons[slug], title: c.title, description: c.short };
  });
}

export function getCapabilityDetail(
  slug: string,
  locale: Locale,
): CapabilityDetail | undefined {
  if (!(slugs as readonly string[]).includes(slug)) return undefined;
  const c = data[slug as Slug][locale];
  return { slug, icon: icons[slug], ...c };
}

export function getCapabilityDetails(locale: Locale): CapabilityDetail[] {
  return slugs.map((slug) => ({
    slug,
    icon: icons[slug],
    ...data[slug][locale],
  }));
}

export const capabilitySlugs = [...slugs];
