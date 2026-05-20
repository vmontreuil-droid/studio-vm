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
    whatYouGet: {
      title: "Wat krijg je concreet voor €99?",
      items: [
        {
          icon: Gauge,
          title: "Volledige technische scan",
          desc: "Snelheid (Core Web Vitals), reactietijd op 4G, paginalast, beeldoptimalisatie en hoster-prestaties.",
        },
        {
          icon: Smartphone,
          title: "Mobiel-audit",
          desc: "Echte test op iPhone Safari en Android Chrome. Wat klemt, wat overlapt, wat niet werkt op touchscreen.",
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
        "Per categorie: score, top-3 bevindingen, met-uitleg-waarom",
        "Stack-detectie (WordPress/Wix/custom + alle plugins)",
        "Veiligheid: SSL, headers, DNS-records",
        "Mobiel: echte screenshot + interactietest",
        "Actieplan: wat eerst, wat later, wat optioneel",
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
    whatYouGet: {
      title: "Que recevez-vous concrètement pour 99€ ?",
      items: [
        {
          icon: Gauge,
          title: "Scan technique complet",
          desc: "Vitesse (Core Web Vitals), temps de réponse en 4G, poids des pages, optimisation des images.",
        },
        {
          icon: Smartphone,
          title: "Audit mobile",
          desc: "Test réel sur iPhone Safari et Android Chrome. Ce qui coince, se chevauche, ne marche pas au toucher.",
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
        "Par catégorie : score, top-3 trouvailles, explication du pourquoi",
        "Détection du stack (WordPress/Wix/custom + tous plugins)",
        "Sécurité : SSL, headers, DNS",
        "Mobile : capture d'écran réelle + test d'interaction",
        "Plan d'action : prioritaire, plus tard, optionnel",
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
    sub: "I scan your site, write a 3-5 page report on what's solid and what's broken, and call you for 30 min to go through everything. No sales pitch — just clarity.",
    bullets: [
      "Complete scan: speed, mobile, SEO, security, platform",
      "Top-3 priorities with concrete fix steps",
      "Personal report via your client portal",
      "30 min video call with me to explain it all",
      "No subscription, no follow-up sales pressure",
    ],
    freeFirst: {
      title: "Want to look for free first?",
      sub: "Run a quick scan without paying anything — you'll get your score and the major pain points immediately. If you then want deeper analysis, you can pay €99 here.",
      cta: "Run free preview scan",
    },
    whatYouGet: {
      title: "What you concretely get for €99",
      items: [
        {
          icon: Gauge,
          title: "Full technical scan",
          desc: "Speed (Core Web Vitals), 4G response time, page weight, image optimization, host performance.",
        },
        {
          icon: Smartphone,
          title: "Mobile audit",
          desc: "Real test on iPhone Safari and Android Chrome. What sticks, overlaps, or doesn't work on touch.",
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
          title: "30 min video call",
          desc: "I walk through the report with you live, answer questions, honestly say what's urgent.",
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
    report: {
      title: "What does the report look like?",
      sub: "Directly in your personal client portal — no PDF that gets lost, no waiting for email. The link stays valid forever so you can revisit later.",
      sections: [
        "Main score + grade (A–F) with explanation per category",
        "Per category: score, top-3 findings, why-it-matters",
        "Stack detection (WordPress/Wix/custom + all plugins)",
        "Security: SSL, headers, DNS records",
        "Mobile: real screenshot + interaction test",
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
          a: "The automated scan is ready in 30 sec. The written report and the video call are scheduled within 24h (working days).",
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
          a: "The free scan gives your score + major pain points. The €99 Health Check goes much deeper: written analysis per finding, prioritization, fix steps, and a real talk with me.",
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
