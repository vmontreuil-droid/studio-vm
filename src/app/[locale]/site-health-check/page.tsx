import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Gauge,
  Smartphone,
  Shield,
  Search,
  Layers,
  AlertTriangle,
  FileText,
  Video,
  HelpCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { isValidLocale, type Locale, localePath } from "@/lib/i18n/config";
import { startHealthCheck } from "@/app/actions/health-check";

export const dynamic = "force-dynamic";

type Block = {
  eyebrow: string;
  title: string;
  sub: string;
  bullets: string[];
  freeFirst: { title: string; sub: string; cta: string };
  compare: {
    title: string;
    sub: string;
    cols: { free: string; paid: string };
    rows: { feat: string; free: string | boolean; paid: string | boolean }[];
  };
  marketGap: {
    eyebrow: string;
    title: string;
    sub: string;
    rows: {
      alt: string;
      kind: string;
      price: string;
      missing: string;
      highlight?: boolean;
    }[];
    conclusion: string;
  };
  whatYouGet: {
    title: string;
    items: { icon: typeof Gauge; title: string; desc: string }[];
  };
  examples: {
    title: string;
    sub: string;
    items: { score: string; tag: string; text: string }[];
  };
  report: {
    title: string;
    sub: string;
    sections: string[];
  };
  previewReport: {
    eyebrow: string;
    title: string;
    sub: string;
    badge: string;
    mockUrl: string;
    portalEyebrow: string;
    portalTitle: string;
    scoreLabel: string;
    gradeLabel: string;
    catTitle: string;
    cats: { name: string; score: number }[];
    planTitle: string;
    prioCritical: string;
    prioImportant: string;
    prioQuick: string;
    whyLabel: string;
    fixLabel: string;
    impactLabel: string;
    items: {
      prio: "critical" | "important" | "quick";
      title: string;
      why: string;
      fix: string;
      impact: string;
    }[];
  };
  faq: { title: string; items: { q: string; a: string }[] };
  formTitle: string;
  name: string;
  email: string;
  website: string;
  cta: string;
  price: string;
  fine: string;
};

const T: Record<Locale, Block> = {
  nl: {
    eyebrow: "Site Health Check — €99",
    title:
      "Krijg een eerlijk, concreet rapport van je website binnen 24 uur.",
    sub: "Ik scan je site, schrijf een rapport van 3-5 bladzijden over wat sterk is en wat kapot is, en bel je 30 min om alles door te lopen. Geen verkooppraat — wel duidelijkheid.",
    bullets: [
      "Volledige scan: snelheid, mobiel, SEO, veiligheid, platform",
      "Top-3 prioriteiten met concrete fix-stappen",
      "Persoonlijk rapport via je eigen klantenportaal",
      "30 min videocall met mij om alles uit te leggen",
      "Geen abonnement, geen vervolgverkoop",
    ],
    freeFirst: {
      title: "Wil je eerst even gratis kijken?",
      sub: "Doe een snelle scan zonder iets te betalen — je krijgt meteen je score en de grote pijnpunten. Als je daarna een diepere analyse wil, kan je hier €99 betalen.",
      cta: "Start gratis preview-scan",
    },
    compare: {
      title: "Gratis scan versus Health Check €99",
      sub: "Hetzelfde scan-engine, maar de €99 ontgrendelt het volledige rapport en het persoonlijke actieplan. Geen 30-min call nodig — je kan direct aan de slag.",
      cols: { free: "Gratis scan", paid: "Health Check €99" },
      rows: [
        { feat: "Site-scan (snelheid/SEO/mobiel/veiligheid/platform)", free: true, paid: true },
        { feat: "Score + grade", free: true, paid: true },
        { feat: "Lijst van bevindingen", free: "kort overzicht", paid: "volledig, gecategoriseerd" },
        { feat: "Geschreven actieplan per bevinding", free: false, paid: true },
        { feat: "Prioritering (kritiek / belangrijk / quick win)", free: false, paid: true },
        { feat: "Concrete fix-stappen ('doe X dan Y dan Z')", free: false, paid: true },
        { feat: "Impactschatting per probleem", free: false, paid: true },
        { feat: "PDF-export / afdrukbaar rapport", free: false, paid: true },
        { feat: "Premium portaal-layout", free: false, paid: true },
        { feat: "Stack-diepte (plugins, versies, end-of-life)", free: false, paid: true },
        { feat: "DNS + security headers volledig uitgewerkt", free: false, paid: true },
        { feat: "Opvolg-mails (op 3 + 7 dagen)", free: false, paid: true },
        { feat: "Inbegrepen 30-min videocall met Vincent", free: false, paid: true },
        { feat: "Geld-terug-garantie", free: "n.v.t.", paid: true },
      ],
    },
    marketGap: {
      eyebrow: "De leemte in de markt",
      title: "Waarom bestaat dit nog niet bij anderen?",
      sub: "Als je rondkijkt naar wat er voor je website-audit bestaat, vind je twee uitersten — en niets in het midden. Daar zit jouw kans:",
      rows: [
        {
          alt: "Gratis tools (PageSpeed, GTmetrix, Lighthouse, Hubspot Grader)",
          kind: "Ruwe tech-data",
          price: "Gratis",
          missing: "Geen interpretatie · geen prioritering · geen actieplan",
        },
        {
          alt: "SaaS-abonnementen (Ahrefs, Semrush, Yoast Premium)",
          kind: "Marketing-tools",
          price: "€60–300/maand",
          missing: "Maandelijks geld, gericht op marketeers, geen persoonlijk rapport",
        },
        {
          alt: "Klassieke Belgische webagency-audits",
          kind: "Pro service",
          price: "€500–€5.000",
          missing: "Te duur voor KMO's, vaak verkapte verkooppraat achteraf",
        },
        {
          alt: "Freelancer-audits (Fiverr/Upwork)",
          kind: "Low-end",
          price: "€50–€150",
          missing: "Template-copy-paste, onpersoonlijk, geen NL/FR",
        },
        {
          alt: "Studio VM — Health Check",
          kind: "Tech + actieplan + persoon",
          price: "€99 vast",
          missing: "Geen tekortkomingen — dít is het gat dat we vullen.",
          highlight: true,
        },
      ],
      conclusion:
        "Een eerlijke, lokaal-Belgische, middenprijs-audit met persoonlijke verantwoordelijkheid bestond gewoon niet. Daarom dit.",
    },
    whatYouGet: {
      title: "Wat krijg je concreet voor €99?",
      items: [
        {
          icon: Gauge,
          title: "Performance-scan (60+ signalen)",
          desc: "Server-reactietijd (TTFB), paginalast, render-blocking JS/CSS, beeldoptimalisatie, compressie, externe domeinen, cache-headers. Plus een CWV-risico-indicator.",
        },
        {
          icon: Smartphone,
          title: "Mobiel-check + manuele test",
          desc: "Auto-checks: viewport, zoomverbod, taal-attribuut, ARIA-landmarks, responsive images. + ik open je site zelf in Chrome DevTools mobile-emulator om visuele issues te spotten die geen scanner ziet.",
        },
        {
          icon: Search,
          title: "SEO-basis-check",
          desc: "Title-tags, meta-descriptions, H1's, sitemap, robots.txt, OpenGraph, structured data. Concrete gaten.",
        },
        {
          icon: Shield,
          title: "Veiligheid",
          desc: "SSL-certificaat (incl. vervaldatum), security headers, DNS-records (SPF/DMARC), CAA-checks.",
        },
        {
          icon: Layers,
          title: "Platform & stack",
          desc: "Wat draait je site echt op? WordPress-versie, plugins, hosting, CDN, themadetails — vaak verrassend.",
        },
        {
          icon: FileText,
          title: "Geschreven actieplan",
          desc: "Niet enkel \"er is iets fout\" maar: \"dit moet je doen, in deze volgorde, hier is waarom\". 3-5 pagina's persoonlijk.",
        },
        {
          icon: Video,
          title: "30 min videocall",
          desc: "Ik loop het rapport live met je door, beantwoord je vragen, en zeg eerlijk wat dringend is en wat kan wachten.",
        },
        {
          icon: AlertTriangle,
          title: "Geen vervolgverkoop",
          desc: "Geen abonnement-trucs, geen 'maar voor 5K maak ik je nieuwe site'. Wil je verder samenwerken? Jij beslist, jij contacteert.",
        },
      ],
    },
    examples: {
      title: "Voorbeelden van wat ik typisch vind",
      sub: "Echte issues uit echte scans (anoniem gemaakt). Jouw rapport bevat exact dit type observaties — toegespitst op jouw site.",
      items: [
        {
          score: "42",
          tag: "Restaurant 9000 Gent",
          text: "SSL-certificaat verloopt over 12 dagen. Site laadt 5,8s op 4G door 11 ongetimde foto's (15 MB totaal). Geen mobiele menu-knop → 38% van bezoekers raakt niet bij de menukaart.",
        },
        {
          score: "58",
          tag: "Boetiek 2000 Antwerpen",
          text: "WordPress 5.9 (eind-2022) met 14 plugins, waarvan 3 niet meer onderhouden. Geen sitemap.xml → Google indexeert maar 12 van de 47 pagina's.",
        },
        {
          score: "65",
          tag: "Tandarts 4000 Liège",
          text: "Mobiele weergave breekt op iPhone Safari (menu-balk overlapt content). Geen Open Graph → links delen op Facebook/LinkedIn toont géén voorvertoning.",
        },
        {
          score: "71",
          tag: "Architect 1050 Brussel",
          text: "Site oogt mooi, maar Largest Contentful Paint = 4,3s (zou <2,5s moeten). Pagespeed-impact: 14% bezoekers haken af voor de pagina geladen is.",
        },
      ],
    },
    report: {
      title: "Hoe ziet het rapport eruit?",
      sub: "Direct in je persoonlijk klantenportaal — geen PDF die zoekraakt, geen wachten op mail. De link blijft eeuwig geldig zodat je later kan terugkijken.",
      sections: [
        "Hoofdscore + grade (A–F) en uitleg per categorie",
        "Per categorie: score, top bevindingen, met-uitleg-waarom",
        "Stack-detectie (WordPress/Wix/Shopify/custom + alle plugins)",
        "Veiligheid: SSL-expiry, security headers, DNS (SPF/DMARC/CAA)",
        "Mobiel: viewport-/zoom-/landmark-checks + manuele DevTools-test",
        "Actieplan: wat eerst, wat later, wat optioneel",
      ],
    },
    previewReport: {
      eyebrow: "Voorbeeld-rapport",
      title: "Zo ziet jouw portaal eruit na betaling",
      sub: "Een echt voorbeeld van het rapport dat jij krijgt — opgebouwd uit dezelfde scan-engine. Geen mock-up, dit is de échte layout.",
      badge: "Voorbeeld",
      mockUrl: "studio-vm.be/portail/health-check/uniek-token",
      portalEyebrow: "Site Health Check",
      portalTitle: "Health-rapport voor monsite.be",
      scoreLabel: "Hoofdscore",
      gradeLabel: "Grade",
      catTitle: "Per categorie",
      cats: [
        { name: "Snelheid", score: 71 },
        { name: "SEO", score: 58 },
        { name: "Mobiel", score: 45 },
        { name: "Veiligheid", score: 80 },
        { name: "Platform", score: 65 },
      ],
      planTitle: "Persoonlijk actieplan",
      prioCritical: "Kritiek",
      prioImportant: "Belangrijk",
      prioQuick: "Quick win",
      whyLabel: "Waarom",
      fixLabel: "Wat te doen",
      impactLabel: "Impact",
      items: [
        {
          prio: "critical",
          title: "Mobiel-viewport ontbreekt — site rendert te klein op smartphone",
          why: "Zonder <meta name=\"viewport\"> dwingt iOS Safari de site in desktop-modus → gebruikers moeten constant inzoomen.",
          fix: "Voeg <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> toe in de <head>. 1 regel code.",
          impact: "Mobiel verkeer is ~58% van bezoeken (BE gemiddelde). Direct effect op bounce-rate.",
        },
        {
          prio: "important",
          title: "Largest Contentful Paint = 4,1s (Google-doel: < 2,5s)",
          why: "De hero-foto (2,4 MB, niet gecomprimeerd) is het traagste element. Google straft dit af in mobiele rankings sinds 2021.",
          fix: "Hero-foto omzetten naar WebP + responsive srcset. Gemeten gain in onze testen: −2,1s.",
          impact: "Pagespeed-score: 38 → ~72. SEO-ranking en conversie schalen mee.",
        },
        {
          prio: "quick",
          title: "OpenGraph-tags ontbreken — links delen toont geen voorvertoning",
          why: "Wanneer iemand je site deelt op Facebook of WhatsApp, ziet die alleen een lege link in plaats van titel + foto.",
          fix: "Voeg og:title, og:description en og:image toe aan de <head>. 5 minuten werk.",
          impact: "Hogere click-through op gedeelde links — vooral relevant voor restaurants, winkels, evenementen.",
        },
      ],
    },
    faq: {
      title: "Veelgestelde vragen",
      items: [
        {
          q: "Krijg ik geld terug als ik niet tevreden ben?",
          a: "Ja. Als je vindt dat het rapport geen €99 waard is, mail je me en je krijgt onmiddellijk volledig terugbetaald. Geen vragen.",
        },
        {
          q: "Hoe lang duurt het?",
          a: "De automatische scan is klaar binnen 30 sec. Het geschreven rapport en de videocall plan ik binnen 24 uur in (werkdagen).",
        },
        {
          q: "Wat als jullie de problemen vinden — moet ik dan bij jullie kopen?",
          a: "Nee. Je rapport is van jou, met alle technische details. Je kan ermee naar je huidige webdesigner, een freelancer, of zelf doen. Echt geen druk.",
        },
        {
          q: "Werkt het ook voor mijn webshop?",
          a: "Ja — webshops (Shopify, WooCommerce, Lightspeed, Prestashop, custom) krijgen extra aandacht voor checkout-flow en page-speed-impact op conversie.",
        },
        {
          q: "Is dit hetzelfde als de gratis scan op studio-vm.be/scan?",
          a: "De gratis scan geeft je score + grote pijnpunten. De €99 Health Check gaat veel dieper: geschreven analyse per bevinding, prioritering, fix-stappen, én een echt gesprek met mij. Een vakman die mee-kijkt vs een tool die meet.",
        },
      ],
    },
    formTitle: "Start je Health Check",
    name: "Naam",
    email: "E-mailadres",
    website: "Jouw website",
    cta: "Betaal €99 en start",
    price: "Eenmalig, all-in",
    fine: "Veilige betaling via Mollie. Bancontact, kaart, overschrijving.",
  },
  fr: {
    eyebrow: "Site Health Check — 99€",
    title:
      "Recevez un rapport honnête et concret de votre site sous 24h.",
    sub: "Je scanne votre site, j'écris un rapport de 3-5 pages sur ce qui est solide et ce qui est cassé, et je vous appelle 30 min pour tout passer en revue. Pas de discours commercial — juste de la clarté.",
    bullets: [
      "Scan complet : vitesse, mobile, SEO, sécurité, plateforme",
      "Top-3 priorités avec étapes concrètes",
      "Rapport personnel via votre portail client",
      "Appel vidéo de 30 min avec moi pour tout expliquer",
      "Pas d'abonnement, pas de vente suivie",
    ],
    freeFirst: {
      title: "Vous voulez d'abord regarder gratuitement ?",
      sub: "Faites un scan rapide sans rien payer — vous obtenez immédiatement votre score et les grands points faibles. Si vous voulez ensuite une analyse plus profonde, vous pouvez payer 99€ ici.",
      cta: "Lancer le scan gratuit",
    },
    compare: {
      title: "Scan gratuit versus Health Check 99€",
      sub: "Même moteur de scan, mais le 99€ débloque le rapport complet et le plan d'action personnel. Pas besoin d'appel — vous pouvez commencer directement.",
      cols: { free: "Scan gratuit", paid: "Health Check 99€" },
      rows: [
        { feat: "Scan site (vitesse/SEO/mobile/sécurité/plateforme)", free: true, paid: true },
        { feat: "Score + note", free: true, paid: true },
        { feat: "Liste de constats", free: "aperçu court", paid: "complet, par catégorie" },
        { feat: "Plan d'action écrit par constat", free: false, paid: true },
        { feat: "Priorisation (critique / important / quick win)", free: false, paid: true },
        { feat: "Étapes concrètes ('faire X puis Y puis Z')", free: false, paid: true },
        { feat: "Estimation d'impact par problème", free: false, paid: true },
        { feat: "Export PDF / rapport imprimable", free: false, paid: true },
        { feat: "Layout portail Premium", free: false, paid: true },
        { feat: "Stack en détail (plugins, versions, end-of-life)", free: false, paid: true },
        { feat: "DNS + security headers complets", free: false, paid: true },
        { feat: "Mails de suivi (J+3 et J+7)", free: false, paid: true },
        { feat: "Appel vidéo 30 min inclus", free: false, paid: true },
        { feat: "Garantie satisfait ou remboursé", free: "n/a", paid: true },
      ],
    },
    marketGap: {
      eyebrow: "Le vide du marché",
      title: "Pourquoi cela n'existe pas encore ?",
      sub: "Quand vous cherchez un audit de site, vous trouvez deux extrêmes — rien au milieu. C'est là votre opportunité :",
      rows: [
        {
          alt: "Outils gratuits (PageSpeed, GTmetrix, Lighthouse)",
          kind: "Données techniques brutes",
          price: "Gratuit",
          missing: "Pas d'interprétation · pas de priorisation · pas de plan",
        },
        {
          alt: "Abonnements SaaS (Ahrefs, Semrush, Yoast)",
          kind: "Outils marketing",
          price: "60–300€/mois",
          missing: "Frais mensuels, pour marketeurs, aucun rapport personnel",
        },
        {
          alt: "Audits d'agences belges classiques",
          kind: "Service pro",
          price: "500–5.000€",
          missing: "Trop cher pour PME, souvent prélude à de la vente",
        },
        {
          alt: "Freelancers (Fiverr/Upwork)",
          kind: "Bas de gamme",
          price: "50–150€",
          missing: "Modèles copiés-collés, impersonnel, pas en NL/FR",
        },
        {
          alt: "Studio VM — Health Check",
          kind: "Tech + plan d'action + personne",
          price: "99€ fixe",
          missing: "Aucune lacune — c'est le vide que nous comblons.",
          highlight: true,
        },
      ],
      conclusion:
        "Un audit honnête, local-belge, à prix moyen, avec une responsabilité personnelle, n'existait tout simplement pas. Voilà pourquoi.",
    },
    whatYouGet: {
      title: "Que recevez-vous concrètement pour 99€ ?",
      items: [
        {
          icon: Gauge,
          title: "Scan performance (60+ signaux)",
          desc: "TTFB serveur, poids des pages, JS/CSS bloquants au rendu, optimisation des images, compression, domaines externes, headers cache. Plus un indicateur de risque CWV.",
        },
        {
          icon: Smartphone,
          title: "Check mobile + test manuel",
          desc: "Auto-checks : viewport, blocage du zoom, attribut lang, landmarks ARIA, images responsives. + j'ouvre votre site moi-même dans l'émulateur mobile Chrome DevTools pour repérer les problèmes visuels qu'aucun scanner ne voit.",
        },
        {
          icon: Search,
          title: "Check SEO de base",
          desc: "Balises title, meta-descriptions, H1, sitemap, robots.txt, OpenGraph, données structurées.",
        },
        {
          icon: Shield,
          title: "Sécurité",
          desc: "Certificat SSL (date d'expiration), headers, DNS (SPF/DMARC), checks CAA.",
        },
        {
          icon: Layers,
          title: "Plateforme & stack",
          desc: "Sur quoi tourne votre site ? Version WordPress, plugins, hébergement, CDN — souvent surprenant.",
        },
        {
          icon: FileText,
          title: "Plan d'action écrit",
          desc: "Pas seulement \"il y a un problème\" mais : \"voilà ce qu'il faut faire, dans cet ordre, pourquoi\". 3-5 pages personnelles.",
        },
        {
          icon: Video,
          title: "Appel vidéo 30 min",
          desc: "Je passe le rapport en revue en direct, réponds à vos questions, dis honnêtement ce qui est urgent.",
        },
        {
          icon: AlertTriangle,
          title: "Aucune vente suivie",
          desc: "Pas d'abonnement caché, pas de \"pour 5K je vous refais le site\". Vous décidez si vous voulez aller plus loin.",
        },
      ],
    },
    examples: {
      title: "Exemples de ce que je trouve typiquement",
      sub: "Vrais problèmes de vrais scans (anonymisés). Votre rapport contient exactement ce type d'observations — adapté à votre site.",
      items: [
        {
          score: "42",
          tag: "Restaurant 5000 Namur",
          text: "Certificat SSL expire dans 12 jours. Site charge en 5,8s en 4G à cause de 11 images non optimisées (15 MB total). Pas de bouton menu mobile.",
        },
        {
          score: "58",
          tag: "Boutique 1000 Bruxelles",
          text: "WordPress 5.9 (fin 2022) avec 14 plugins, dont 3 non maintenus. Pas de sitemap.xml → Google n'indexe que 12 des 47 pages.",
        },
        {
          score: "65",
          tag: "Dentiste 4000 Liège",
          text: "Affichage mobile cassé sur iPhone Safari (barre menu chevauche le contenu). Pas d'Open Graph → partages Facebook/LinkedIn sans aperçu.",
        },
        {
          score: "71",
          tag: "Architecte 1050 Bruxelles",
          text: "Site visuellement joli, mais Largest Contentful Paint = 4,3s (devrait être <2,5s). 14% des visiteurs partent avant chargement.",
        },
      ],
    },
    report: {
      title: "À quoi ressemble le rapport ?",
      sub: "Directement dans votre portail client personnel — pas de PDF qui se perd, pas d'attente d'e-mail. Le lien reste valable éternellement.",
      sections: [
        "Score principal + note (A–F) et explication par catégorie",
        "Par catégorie : score, top trouvailles, explication du pourquoi",
        "Détection du stack (WordPress/Wix/Shopify/custom + tous plugins)",
        "Sécurité : expiration SSL, headers, DNS (SPF/DMARC/CAA)",
        "Mobile : checks viewport/zoom/landmarks + test manuel DevTools",
        "Plan d'action : prioritaire, plus tard, optionnel",
      ],
    },
    previewReport: {
      eyebrow: "Exemple de rapport",
      title: "À quoi ressemble votre portail après paiement",
      sub: "Un véritable exemple du rapport que vous recevez — construit avec le même moteur de scan. Pas une maquette, c'est la vraie mise en page.",
      badge: "Exemple",
      mockUrl: "studio-vm.be/portail/health-check/jeton-unique",
      portalEyebrow: "Site Health Check",
      portalTitle: "Rapport de santé pour monsite.be",
      scoreLabel: "Score principal",
      gradeLabel: "Note",
      catTitle: "Par catégorie",
      cats: [
        { name: "Vitesse", score: 71 },
        { name: "SEO", score: 58 },
        { name: "Mobile", score: 45 },
        { name: "Sécurité", score: 80 },
        { name: "Plateforme", score: 65 },
      ],
      planTitle: "Plan d'action personnel",
      prioCritical: "Critique",
      prioImportant: "Important",
      prioQuick: "Quick win",
      whyLabel: "Pourquoi",
      fixLabel: "Que faire",
      impactLabel: "Impact",
      items: [
        {
          prio: "critical",
          title: "Meta-viewport manquant — le site s'affiche trop petit sur smartphone",
          why: "Sans <meta name=\"viewport\">, iOS Safari force le site en mode bureau → les utilisateurs doivent zoomer en permanence.",
          fix: "Ajoutez <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> dans le <head>. Une ligne de code.",
          impact: "Le trafic mobile représente ~58 % des visites (moyenne BE). Effet direct sur le taux de rebond.",
        },
        {
          prio: "important",
          title: "Largest Contentful Paint = 4,1s (objectif Google : < 2,5s)",
          why: "L'image hero (2,4 MB, non compressée) est l'élément le plus lent. Google pénalise depuis 2021 dans le ranking mobile.",
          fix: "Convertir l'image hero en WebP + srcset responsive. Gain mesuré sur nos tests : −2,1s.",
          impact: "Score Pagespeed : 38 → ~72. SEO et conversion suivent.",
        },
        {
          prio: "quick",
          title: "Tags OpenGraph manquants — partage de liens sans aperçu",
          why: "Quand quelqu'un partage votre site sur Facebook ou WhatsApp, il ne voit qu'un lien vide au lieu du titre + image.",
          fix: "Ajoutez og:title, og:description et og:image dans le <head>. 5 minutes de travail.",
          impact: "Plus de clics sur les liens partagés — surtout pour restaurants, boutiques, événements.",
        },
      ],
    },
    faq: {
      title: "Questions fréquentes",
      items: [
        {
          q: "Suis-je remboursé si je ne suis pas satisfait ?",
          a: "Oui. Si vous trouvez que le rapport ne vaut pas 99€, un mail suffit et vous êtes immédiatement remboursé intégralement. Sans question.",
        },
        {
          q: "Combien de temps ça prend ?",
          a: "Le scan automatique est prêt en 30 sec. Le rapport écrit et l'appel vidéo sont planifiés sous 24h (jours ouvrables).",
        },
        {
          q: "Si vous trouvez les problèmes, dois-je acheter chez vous ?",
          a: "Non. Le rapport est à vous, avec tous les détails techniques. Vous pouvez aller voir votre webmaster actuel, un freelance, ou le faire vous-même.",
        },
        {
          q: "Ça marche aussi pour ma boutique en ligne ?",
          a: "Oui — les e-shops (Shopify, WooCommerce, Lightspeed, Prestashop, custom) reçoivent une attention particulière sur le checkout et l'impact vitesse-conversion.",
        },
        {
          q: "C'est la même chose que le scan gratuit ?",
          a: "Le scan gratuit donne votre score + grands points faibles. Le Health Check 99€ va beaucoup plus loin : analyse écrite par trouvaille, priorisation, étapes concrètes, et un vrai entretien avec moi.",
        },
      ],
    },
    formTitle: "Lancez votre Health Check",
    name: "Nom",
    email: "Adresse e-mail",
    website: "Votre site",
    cta: "Payer 99€ et démarrer",
    price: "Unique, tout compris",
    fine: "Paiement sécurisé via Mollie. Bancontact, carte, virement.",
  },
  en: {
    eyebrow: "Site Health Check — €99",
    title:
      "Get an honest, concrete report on your website within 24 hours.",
    sub: "I scan your site and write a 3-5 page report on what's solid and what's broken — with priority order and concrete fix steps. No sales pitch, just clarity.",
    bullets: [
      "Complete scan: speed, mobile, SEO, security, platform",
      "Top-3 priorities with concrete fix steps",
      "Personal report via your client portal",
      "Written email Q&A — I answer your follow-up questions",
      "No subscription, no follow-up sales pressure",
    ],
    freeFirst: {
      title: "Want to look for free first?",
      sub: "Run a quick scan without paying anything — you'll get your score and the major pain points immediately. If you then want deeper analysis, you can pay €99 here.",
      cta: "Run free preview scan",
    },
    compare: {
      title: "Free scan versus Health Check €99",
      sub: "Same scan engine, but the €99 unlocks the full report and personal action plan. No call required — you can start immediately.",
      cols: { free: "Free scan", paid: "Health Check €99" },
      rows: [
        { feat: "Site scan (speed/SEO/mobile/security/platform)", free: true, paid: true },
        { feat: "Score + grade", free: true, paid: true },
        { feat: "Findings list", free: "short overview", paid: "full, categorized" },
        { feat: "Written action plan per finding", free: false, paid: true },
        { feat: "Prioritization (critical / important / quick win)", free: false, paid: true },
        { feat: "Concrete fix steps ('do X then Y then Z')", free: false, paid: true },
        { feat: "Impact estimate per issue", free: false, paid: true },
        { feat: "PDF export / printable report", free: false, paid: true },
        { feat: "Premium portal layout", free: false, paid: true },
        { feat: "Stack depth (plugins, versions, end-of-life)", free: false, paid: true },
        { feat: "Full DNS + security headers", free: false, paid: true },
        { feat: "Follow-up emails (day 3 + day 7)", free: false, paid: true },
        { feat: "Email Q&A — written follow-up answers", free: false, paid: true },
        { feat: "Money-back guarantee", free: "n/a", paid: true },
      ],
    },
    marketGap: {
      eyebrow: "The market gap",
      title: "Why doesn't this exist elsewhere?",
      sub: "When you look for a website audit, you find two extremes — nothing in between. That's the opportunity:",
      rows: [
        {
          alt: "Free tools (PageSpeed, GTmetrix, Lighthouse)",
          kind: "Raw tech data",
          price: "Free",
          missing: "No interpretation · no prioritization · no plan",
        },
        {
          alt: "SaaS subscriptions (Ahrefs, Semrush, Yoast)",
          kind: "Marketing tools",
          price: "€60–300/mo",
          missing: "Monthly bill, for marketers, no personal report",
        },
        {
          alt: "Classic agency audits",
          kind: "Pro service",
          price: "€500–€5,000",
          missing: "Too pricey for SMEs, often disguised sales pitch",
        },
        {
          alt: "Freelancers (Fiverr/Upwork)",
          kind: "Low-end",
          price: "€50–150",
          missing: "Copy-paste templates, impersonal, EN-only",
        },
        {
          alt: "Studio VM — Health Check",
          kind: "Tech + action plan + person",
          price: "€99 flat",
          missing: "No gap — this is the slot we fill.",
          highlight: true,
        },
      ],
      conclusion:
        "An honest, locally-Belgian, mid-priced audit with personal responsibility simply didn't exist. That's why this exists.",
    },
    whatYouGet: {
      title: "What you concretely get for €99",
      items: [
        {
          icon: Gauge,
          title: "Performance scan (60+ signals)",
          desc: "Server response time (TTFB), page weight, render-blocking JS/CSS, image optimization, compression, external domains, cache headers. Plus a CWV risk indicator.",
        },
        {
          icon: Smartphone,
          title: "Mobile check + manual test",
          desc: "Auto-checks: viewport meta, zoom-blocking, lang attribute, ARIA landmarks, responsive images. + I open your site myself in Chrome DevTools mobile emulator to spot visual issues no scanner catches.",
        },
        {
          icon: Search,
          title: "SEO basics check",
          desc: "Title tags, meta descriptions, H1s, sitemap, robots.txt, OpenGraph, structured data.",
        },
        {
          icon: Shield,
          title: "Security",
          desc: "SSL certificate (with expiry), security headers, DNS records (SPF/DMARC), CAA checks.",
        },
        {
          icon: Layers,
          title: "Platform & stack",
          desc: "What's your site really running on? WordPress version, plugins, hosting, CDN — often surprising.",
        },
        {
          icon: FileText,
          title: "Written action plan",
          desc: "Not just \"something's wrong\" but: \"do this, in this order, here's why\". 3-5 personal pages.",
        },
        {
          icon: Video,
          title: "Email Q&A follow-up",
          desc: "After delivery you can email me with follow-up questions on the report — I answer in writing. Honest, no time-cap.",
        },
        {
          icon: AlertTriangle,
          title: "No follow-up sales",
          desc: "No subscription tricks, no \"for 5K I'll build you a new site\". You decide if we work together further.",
        },
      ],
    },
    examples: {
      title: "Examples of what I typically find",
      sub: "Real issues from real scans (anonymized). Your report contains exactly this type of observation — tailored to your site.",
      items: [
        {
          score: "42",
          tag: "Restaurant Brussels",
          text: "SSL certificate expires in 12 days. Site loads in 5.8s on 4G due to 11 unoptimized photos (15 MB total). No mobile menu button → 38% of visitors can't reach the menu.",
        },
        {
          score: "58",
          tag: "Boutique Antwerp",
          text: "WordPress 5.9 (late 2022) with 14 plugins, 3 unmaintained. No sitemap.xml → Google indexes only 12 of 47 pages.",
        },
        {
          score: "65",
          tag: "Dentist Liège",
          text: "Mobile breaks on iPhone Safari (menu bar overlaps content). No Open Graph → Facebook/LinkedIn shares show no preview.",
        },
        {
          score: "71",
          tag: "Architect Brussels",
          text: "Site looks great, but Largest Contentful Paint = 4.3s (should be <2.5s). 14% of visitors bounce before page load completes.",
        },
      ],
    },
    previewReport: {
      eyebrow: "Sample report",
      title: "Here's what your portal looks like after payment",
      sub: "A real example of the report you receive — built with the same scan engine. Not a mock-up, this is the actual layout.",
      badge: "Sample",
      mockUrl: "studio-vm.be/portail/health-check/unique-token",
      portalEyebrow: "Site Health Check",
      portalTitle: "Health report for monsite.be",
      scoreLabel: "Main score",
      gradeLabel: "Grade",
      catTitle: "By category",
      cats: [
        { name: "Speed", score: 71 },
        { name: "SEO", score: 58 },
        { name: "Mobile", score: 45 },
        { name: "Security", score: 80 },
        { name: "Platform", score: 65 },
      ],
      planTitle: "Personal action plan",
      prioCritical: "Critical",
      prioImportant: "Important",
      prioQuick: "Quick win",
      whyLabel: "Why",
      fixLabel: "What to do",
      impactLabel: "Impact",
      items: [
        {
          prio: "critical",
          title: "Mobile viewport meta missing — site renders too small on phones",
          why: "Without <meta name=\"viewport\">, iOS Safari forces desktop mode → users have to pinch-zoom constantly.",
          fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> in the <head>. One line of code.",
          impact: "Mobile traffic is ~58% of all visits (BE avg). Direct effect on bounce rate.",
        },
        {
          prio: "important",
          title: "Largest Contentful Paint = 4.1s (Google target: < 2.5s)",
          why: "The hero photo (2.4 MB, uncompressed) is the slowest element. Google has penalized this in mobile rankings since 2021.",
          fix: "Convert hero to WebP + responsive srcset. Measured gain in our tests: −2.1s.",
          impact: "Pagespeed score: 38 → ~72. SEO ranking and conversion follow.",
        },
        {
          prio: "quick",
          title: "OpenGraph tags missing — shared links show no preview",
          why: "When someone shares your site on Facebook or WhatsApp, they only see a bare link instead of title + image.",
          fix: "Add og:title, og:description, and og:image to the <head>. 5 minutes of work.",
          impact: "Higher click-through on shared links — especially for restaurants, shops, events.",
        },
      ],
    },
    report: {
      title: "What does the report look like?",
      sub: "Directly in your personal client portal — no PDF that gets lost, no waiting for email. The link stays valid forever so you can revisit later.",
      sections: [
        "Main score + grade (A–F) with explanation per category",
        "Per category: score, top findings, why-it-matters",
        "Stack detection (WordPress/Wix/Shopify/custom + all plugins)",
        "Security: SSL expiry, headers, DNS records (SPF/DMARC/CAA)",
        "Mobile: viewport/zoom/landmark checks + manual DevTools test",
        "Action plan: what first, what later, what optional",
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "Refund if I'm not satisfied?",
          a: "Yes. If you don't think the report is worth €99, email me and you're fully refunded immediately. No questions.",
        },
        {
          q: "How long does it take?",
          a: "The automated scan is ready in 30 sec. The written report is delivered within 24h (working days).",
        },
        {
          q: "If you find the problems, do I have to buy from you?",
          a: "No. The report is yours with all technical details. You can take it to your current webmaster, a freelancer, or DIY.",
        },
        {
          q: "Does it work for my webshop too?",
          a: "Yes — webshops (Shopify, WooCommerce, custom) get extra attention on checkout flow and page-speed-conversion impact.",
        },
        {
          q: "Is this the same as the free scan?",
          a: "The free scan gives your score + major pain points. The €99 Health Check goes much deeper: written analysis per finding, prioritization, fix steps, and email Q&A with me afterwards.",
        },
      ],
    },
    formTitle: "Start your Health Check",
    name: "Name",
    email: "Email address",
    website: "Your website",
    cta: "Pay €99 and start",
    price: "One-off, all-in",
    fine: "Secure payment via Mollie. Bancontact, card, transfer.",
  },
};

const scoreColor = (s: string) => {
  const n = Number(s);
  if (n < 45) return "border-red-500 text-red-600 dark:text-red-400";
  if (n < 65) return "border-amber-500 text-amber-600 dark:text-amber-400";
  return "border-green-500 text-green-600 dark:text-green-400";
};

const grade = (n: number) =>
  n >= 90 ? "A" : n >= 75 ? "B" : n >= 60 ? "C" : n >= 45 ? "D" : "E";

const prioStyle = (p: "critical" | "important" | "quick") =>
  p === "critical"
    ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
    : p === "important"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
      : "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200";

export default async function SiteHealthCheck({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{t.sub}</p>
          <ul className="mt-10 space-y-3">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm sm:text-base">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                  strokeWidth={2}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Gratis voorproef-scan */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="rounded-2xl bg-background p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t.freeFirst.title}
            </h2>
            <p className="mt-2 text-muted">{t.freeFirst.sub}</p>
            <Link
              href={localePath(locale, "/scan")}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
            >
              <Gauge className="h-4 w-4" strokeWidth={2.5} />
              {t.freeFirst.cta}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* Vergelijkingstabel */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.compare.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{t.compare.sub}</p>
          <div className="mt-8 overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                    <th className="px-5 py-4 font-medium" />
                    <th className="px-5 py-4 font-medium">
                      {t.compare.cols.free}
                    </th>
                    <th className="bg-accent/5 px-5 py-4 font-medium text-accent">
                      💎 {t.compare.cols.paid}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {t.compare.rows.map((row) => (
                    <tr key={row.feat}>
                      <td className="px-5 py-3 font-medium">{row.feat}</td>
                      <td className="px-5 py-3">
                        {typeof row.free === "boolean" ? (
                          row.free ? (
                            <CheckCircle2
                              className="h-5 w-5 text-green-600 dark:text-green-400"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <span className="text-muted">—</span>
                          )
                        ) : (
                          <span className="text-muted">{row.free}</span>
                        )}
                      </td>
                      <td className="bg-accent/5 px-5 py-3">
                        {typeof row.paid === "boolean" ? (
                          row.paid ? (
                            <CheckCircle2
                              className="h-5 w-5 text-accent"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <span className="text-muted">—</span>
                          )
                        ) : (
                          <span className="font-medium">{row.paid}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Marktleemte */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.marketGap.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.marketGap.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{t.marketGap.sub}</p>
          <div className="mt-8 overflow-hidden rounded-2xl bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-card text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                    <th className="px-5 py-4 font-medium">Bestaat</th>
                    <th className="px-5 py-4 font-medium">Soort</th>
                    <th className="px-5 py-4 font-medium">Prijs</th>
                    <th className="px-5 py-4 font-medium">Wat missen ze</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {t.marketGap.rows.map((r) => (
                    <tr
                      key={r.alt}
                      className={
                        r.highlight
                          ? "bg-accent/10 font-medium"
                          : "text-muted"
                      }
                    >
                      <td className="px-5 py-3">
                        {r.highlight && "✨ "}
                        <span className={r.highlight ? "text-foreground" : ""}>
                          {r.alt}
                        </span>
                      </td>
                      <td className="px-5 py-3">{r.kind}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono">{r.price}</td>
                      <td className="px-5 py-3">
                        <span className={r.highlight ? "text-accent" : ""}>
                          {r.missing}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-6 text-center text-base italic text-muted">
            "{t.marketGap.conclusion}"
          </p>
        </div>
      </section>

      {/* Voorbeeld-rapport — visuele preview van het portaal */}
      <section className="border-b bg-gradient-to-b from-card to-background">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.previewReport.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.previewReport.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{t.previewReport.sub}</p>

          {/* Browser-frame mockup van het portaal */}
          <div className="mt-10 overflow-hidden rounded-2xl border bg-background shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b bg-card px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-red-400/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />
              <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1 text-[11px] text-muted">
                <Lock className="h-3 w-3" strokeWidth={2.5} />
                <span className="truncate font-mono">{t.previewReport.mockUrl}</span>
              </div>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-accent">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {t.previewReport.badge}
              </span>
            </div>

            {/* Portal hero */}
            <div className="border-b bg-gradient-to-br from-accent/10 via-background to-background p-6 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {t.previewReport.portalEyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t.previewReport.portalTitle}
              </h3>
              <div className="mt-6 flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-amber-500">
                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      62
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      {t.previewReport.scoreLabel}
                    </p>
                    <p className="mt-0.5 text-2xl font-semibold">62 / 100</p>
                    <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                      {t.previewReport.gradeLabel} {grade(62)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-categorie grid */}
            <div className="border-b p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {t.previewReport.catTitle}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {t.previewReport.cats.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-xl border bg-card p-3 text-center"
                  >
                    <p
                      className={`text-2xl font-bold ${
                        c.score < 45
                          ? "text-red-600 dark:text-red-400"
                          : c.score < 65
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {c.score}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{c.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actieplan */}
            <div className="p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {t.previewReport.planTitle}
              </p>
              <div className="mt-4 space-y-4">
                {t.previewReport.items.map((it, i) => (
                  <div
                    key={it.title}
                    className="rounded-xl border bg-card p-5"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${prioStyle(it.prio)}`}
                      >
                        {it.prio === "critical"
                          ? t.previewReport.prioCritical
                          : it.prio === "important"
                            ? t.previewReport.prioImportant
                            : t.previewReport.prioQuick}
                      </span>
                      <h4 className="min-w-0 flex-1 text-sm font-semibold sm:text-base">
                        {it.title}
                      </h4>
                    </div>
                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {t.previewReport.whyLabel}
                        </p>
                        <p className="mt-1 text-muted">{it.why}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                          {t.previewReport.fixLabel}
                        </p>
                        <p className="mt-1">{it.fix}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {t.previewReport.impactLabel}
                        </p>
                        <p className="mt-1 text-muted">{it.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wat krijg je */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.whatYouGet.title}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.whatYouGet.items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.title} className="rounded-2xl bg-card p-5 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 font-semibold tracking-tight">{it.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{it.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Voorbeelden */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.examples.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{t.examples.sub}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {t.examples.items.map((e) => (
              <div key={e.tag} className="flex gap-4 rounded-2xl bg-background p-5 shadow-sm">
                <div
                  className={`grid h-16 w-16 shrink-0 flex-col place-items-center rounded-full border-4 ${scoreColor(e.score)}`}
                >
                  <span className="text-xl font-bold">{e.score}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {e.tag}
                  </p>
                  <p className="mt-1 text-sm">{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rapport-structuur */}
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.report.title}
          </h2>
          <p className="mt-2 text-muted">{t.report.sub}</p>
          <ul className="mt-6 space-y-2.5">
            {t.report.sections.map((s) => (
              <li key={s} className="flex items-start gap-3 text-sm sm:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={2} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Form */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <div className="rounded-3xl bg-background p-8 shadow-sm sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">{t.formTitle}</h2>
            <form action={startHealthCheck} className="mt-6 space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.name}</span>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.email}</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted">{t.website}</span>
                <input
                  name="website"
                  required
                  placeholder="bv. monsite.be"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <div>
                  <p className="text-3xl font-bold tracking-tight">€99</p>
                  <p className="text-xs text-muted">{t.price}</p>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {t.cta}
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-xs text-muted">{t.fine}</p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.faq.title}
          </h2>
          <div className="mt-8 space-y-3">
            {t.faq.items.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl bg-card p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-sm font-medium sm:text-base">
                  <span className="flex items-start gap-2">
                    <HelpCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2}
                    />
                    {f.q}
                  </span>
                  <span className="text-muted group-open:rotate-180 transition-transform">
                    ⌄
                  </span>
                </summary>
                <p className="mt-3 pl-6 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
