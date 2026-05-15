import type { Locale } from "@/lib/i18n/config";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  readMin: number;
  tag: string;
};

type PostContent = Omit<Post, "slug" | "date" | "readMin">;

type PostBase = {
  slug: string;
  date: string;
  readMin: number;
  content: Record<Locale, PostContent>;
};

const base: PostBase[] = [
  {
    slug: "waarom-weg-van-wordpress",
    date: "2026-04-20",
    readMin: 5,
    content: {
      nl: {
        title: "Waarom we steeds vaker weg trekken van WordPress",
        excerpt:
          "Een eerlijk verhaal over snelheid, plugin-vermoeidheid en de echte kost van 'gratis'.",
        tag: "Migratie",
        body: `WordPress was lang de standaard, en voor veel sites is het dat nog steeds. Maar voor klanten die hun site écht willen gebruiken — om dagelijks content aan te passen, om snel te laden op telefoon, om geen €40/maand aan plugin-licenties te betalen — wordt WordPress vaak een rem.

Drie patronen die we keer op keer zien:

**1. Snelheid.** Een doorsnee WordPress-site laadt in 4–7 seconden op mobiel. Een Next.js site doet 't in 0,8. Voor Google's ranking en voor je bezoekers is dat een wereld van verschil.

**2. Plugin-vermoeidheid.** Eén plugin breekt na een update, en plots werkt je formulier niet meer. Of je hebt 12 plugins die elk hun eigen security-risico zijn.

**3. De admin is voor de developer.** Een typische WordPress admin is een doolhof voor wie er niet dagelijks in zit. Een eigen admin op maat — alleen wat je nodig hebt — werkt veel beter.

Niet elke site moet weg van WordPress. Maar voor wie 't echt gebruikt: er is leven na WordPress.`,
      },
      fr: {
        title: "Pourquoi nous quittons de plus en plus WordPress",
        excerpt:
          "Un récit honnête sur la vitesse, la fatigue des plugins et le vrai coût du « gratuit ».",
        tag: "Migration",
        body: `WordPress a longtemps été le standard, et pour beaucoup de sites il l'est encore. Mais pour les clients qui veulent vraiment utiliser leur site — adapter le contenu chaque jour, charger vite sur mobile, ne pas payer €40/mois de licences de plugins — WordPress devient souvent un frein.

Trois schémas que nous voyons sans cesse :

**1. Vitesse.** Un site WordPress moyen charge en 4–7 secondes sur mobile. Un site Next.js le fait en 0,8. Pour le classement Google et pour vos visiteurs, c'est un monde de différence.

**2. Fatigue des plugins.** Un plugin casse après une mise à jour, et soudain votre formulaire ne marche plus. Ou vous avez 12 plugins, chacun avec son propre risque de sécurité.

**3. L'admin est pour le développeur.** Un admin WordPress typique est un labyrinthe pour qui n'y est pas tous les jours. Un admin sur mesure — uniquement ce dont vous avez besoin — fonctionne bien mieux.

Tous les sites ne doivent pas quitter WordPress. Mais pour ceux qui l'utilisent vraiment : il y a une vie après WordPress.`,
      },
      en: {
        title: "Why we increasingly move away from WordPress",
        excerpt:
          "An honest story about speed, plugin fatigue and the real cost of 'free'.",
        tag: "Migration",
        body: `WordPress was the standard for a long time, and for many sites it still is. But for clients who really want to use their site — to update content daily, to load fast on mobile, to not pay €40/month in plugin licenses — WordPress often becomes a brake.

Three patterns we see again and again:

**1. Speed.** An average WordPress site loads in 4–7 seconds on mobile. A Next.js site does it in 0.8. For Google's ranking and for your visitors, that's a world of difference.

**2. Plugin fatigue.** One plugin breaks after an update, and suddenly your form stops working. Or you have 12 plugins, each its own security risk.

**3. The admin is for the developer.** A typical WordPress admin is a maze for anyone not in it daily. A custom admin — only what you need — works far better.

Not every site needs to leave WordPress. But for those who really use it: there is life after WordPress.`,
      },
    },
  },
  {
    slug: "webshop-zonder-shopify-marge",
    date: "2026-03-12",
    readMin: 6,
    content: {
      nl: {
        title: "Webshops bouwen zonder Shopify-marge",
        excerpt:
          "Wat een eigen webshop kost vs. een Shopify-abonnement, en wanneer welk model loont.",
        tag: "Webshop",
        body: `Shopify is gemakkelijk en snel — daar geen woord van Frans over. Maar wanneer je over een bepaalde omzet gaat, betaal je veel.

Reken even mee:

- Shopify Basic: €36/m + 2% transactie-fee
- Bij €10 000/maand omzet: €36 + €200 = €236/m. Per jaar: €2 832.

Een eigen webshop op Next.js + Mollie + Vercel:

- Vercel: €20/m
- Supabase: €25/m
- Mollie: 1,4% + €0,25 per transactie (geen Shopify-marge erbovenop)

Verschil: ~€2 300/jaar. De build betaalt zichzelf typisch terug op 3–4 jaar.

**Wanneer Shopify dan nog wel?** Als je morgen wil starten en geen tijd of budget hebt voor een build. Voor wie z'n eigen merk en marge wil: een eigen build is — op middellange termijn — bijna altijd voordeliger.`,
      },
      fr: {
        title: "Construire des boutiques sans la marge Shopify",
        excerpt:
          "Le coût d'une boutique propre vs. un abonnement Shopify, et quand chaque modèle est rentable.",
        tag: "Boutique",
        body: `Shopify est facile et rapide — rien à redire là-dessus. Mais au-delà d'un certain chiffre d'affaires, vous payez cher.

Calculons ensemble :

- Shopify Basic : €36/m + 2 % de frais de transaction
- À €10 000/mois de CA : €36 + €200 = €236/m. Par an : €2 832.

Une boutique propre sur Next.js + Mollie + Vercel :

- Vercel : €20/m
- Supabase : €25/m
- Mollie : 1,4 % + €0,25 par transaction (sans marge Shopify en plus)

Différence : ~€2 300/an. Le développement se rembourse typiquement en 3–4 ans.

**Quand Shopify alors ?** Si vous voulez démarrer demain sans temps ni budget pour un développement. Pour qui veut sa propre marque et sa marge : un développement propre est — à moyen terme — presque toujours plus avantageux.`,
      },
      en: {
        title: "Building webshops without the Shopify margin",
        excerpt:
          "What an own webshop costs vs. a Shopify subscription, and when each model pays off.",
        tag: "Webshop",
        body: `Shopify is easy and fast — no argument there. But once you go past a certain revenue, you pay a lot.

Let's do the math:

- Shopify Basic: €36/m + 2% transaction fee
- At €10,000/month revenue: €36 + €200 = €236/m. Per year: €2,832.

An own webshop on Next.js + Mollie + Vercel:

- Vercel: €20/m
- Supabase: €25/m
- Mollie: 1.4% + €0.25 per transaction (no Shopify margin on top)

Difference: ~€2,300/year. The build typically pays for itself in 3–4 years.

**When Shopify then?** If you want to start tomorrow with no time or budget for a build. For those who want their own brand and margin: an own build is — in the medium term — almost always more cost-effective.`,
      },
    },
  },
  {
    slug: "zelf-je-restaurantsite-beheren",
    date: "2026-02-08",
    readMin: 4,
    content: {
      nl: {
        title: "Drie redenen om je restaurantsite zelf te beheren",
        excerpt:
          "Een menu wijzigen mag geen factuur kosten. Hier hoe we 't aanpakken voor Cottage en Bar'Botte.",
        tag: "Hospitality",
        body: `Restaurants zijn dynamisch. Het menu wijzigt per seizoen, soms per week. Als elke wijziging een mailtje + factuur is bij je webdeveloper, gaat 't te traag — of erger, het gebeurt niet.

**1. De keuken weet wat 't menu is, niet de developer.** Onze admins voor Cottage en Bar'Botte zijn gemaakt om door de chef of zaalverantwoordelijke gebruikt te worden. Geen technische kennis nodig.

**2. Vacatures publiceren op het moment dat 't moet.** Een sous-chef vinden begint in 2026 online. Een vacature direct kunnen publiceren maakt 't verschil.

**3. Reservaties direct in je inbox.** Geen externe tool, geen boekingsplatform-marge. Reservatie → mail → bevestiging → klaar.

De tijd die je daarmee wint, gaat naar wat je echt graag doet: koken en je gasten ontvangen.`,
      },
      fr: {
        title: "Trois raisons de gérer vous-même le site de votre restaurant",
        excerpt:
          "Modifier un menu ne devrait pas coûter une facture. Voici comment on fait pour Cottage et Bar'Botte.",
        tag: "Hospitality",
        body: `Les restaurants sont dynamiques. La carte change selon la saison, parfois chaque semaine. Si chaque modification est un e-mail + une facture chez votre développeur, c'est trop lent — ou pire, ça ne se fait pas.

**1. La cuisine sait ce qu'est la carte, pas le développeur.** Nos admins pour Cottage et Bar'Botte sont conçus pour être utilisés par le chef ou le responsable de salle. Aucune connaissance technique nécessaire.

**2. Publier des offres d'emploi au bon moment.** Trouver un sous-chef commence en ligne en 2026. Pouvoir publier une offre directement fait la différence.

**3. Réservations directement dans votre boîte mail.** Pas d'outil externe, pas de marge de plateforme. Réservation → e-mail → confirmation → terminé.

Le temps gagné va vers ce que vous aimez vraiment : cuisiner et accueillir vos clients.`,
      },
      en: {
        title: "Three reasons to manage your restaurant site yourself",
        excerpt:
          "Changing a menu shouldn't cost an invoice. Here's how we do it for Cottage and Bar'Botte.",
        tag: "Hospitality",
        body: `Restaurants are dynamic. The menu changes by season, sometimes by week. If every change is an email + invoice at your web developer, it's too slow — or worse, it doesn't happen.

**1. The kitchen knows the menu, not the developer.** Our admins for Cottage and Bar'Botte are built to be used by the chef or floor manager. No technical knowledge needed.

**2. Publish job openings at the right moment.** Finding a sous-chef starts online in 2026. Being able to publish a vacancy directly makes the difference.

**3. Reservations straight to your inbox.** No external tool, no booking-platform margin. Reservation → email → confirmation → done.

The time you save goes to what you really enjoy: cooking and welcoming your guests.`,
      },
    },
  },
];

export function getPosts(locale: Locale): Post[] {
  return base.map(({ content, ...rest }) => ({ ...rest, ...content[locale] }));
}

export function getPostBySlug(slug: string, locale: Locale): Post | undefined {
  const p = base.find((x) => x.slug === slug);
  if (!p) return undefined;
  const { content, ...rest } = p;
  return { ...rest, ...content[locale] };
}

export const postSlugs = base.map((p) => p.slug);
