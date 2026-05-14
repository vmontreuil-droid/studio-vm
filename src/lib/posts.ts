export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  readMin: number;
  tag: string;
};

export const posts: Post[] = [
  {
    slug: "waarom-weg-van-wordpress",
    title: "Waarom we steeds vaker weg trekken van WordPress",
    excerpt:
      "Een eerlijk verhaal over snelheid, plugin-vermoeidheid en de echte kost van 'gratis'.",
    date: "2026-04-20",
    readMin: 5,
    tag: "Migratie",
    body: `WordPress was lang de standaard, en voor veel sites is het dat nog steeds. Maar voor klanten die hun site écht willen gebruiken — om dagelijks content aan te passen, om snel te laden op telefoon, om geen €40/maand aan plugin-licenties te betalen — wordt WordPress vaak een rem.

Drie patronen die we keer op keer zien:

**1. Snelheid.** Een doorsnee WordPress-site laadt in 4–7 seconden op mobiel. Een Next.js site doet 't in 0,8. Voor Google's ranking en voor je bezoekers is dat een wereld van verschil.

**2. Plugin-vermoeidheid.** Eén plugin breekt na een update, en plots werkt je formulier niet meer. Of je hebt 12 plugins die elk hun eigen security-risico zijn. We zien klanten die enkel om de site veilig te houden meer betalen dan de hosting zelf kost.

**3. De admin is voor de developer.** Een typische WordPress admin is een doolhof voor wie er niet dagelijks in zit. Een eigen admin op maat — alleen wat je nodig hebt — werkt veel beter.

Niet elke site moet weg van WordPress. Maar voor wie 't echt gebruikt: er is leven na WordPress.`,
  },
  {
    slug: "webshop-zonder-shopify-marge",
    title: "Webshops bouwen zonder Shopify-marge",
    excerpt:
      "Wat een eigen webshop kost vs. een Shopify-abonnement, en wanneer welk model loont.",
    date: "2026-03-12",
    readMin: 6,
    tag: "Webshop",
    body: `Shopify is gemakkelijk en snel — daar geen woord van Frans over. Maar wanneer je over een bepaalde omzet gaat, betaal je veel.

Reken even mee:

- Shopify Basic: €36/m + 2% transactie-fee
- Bij €10 000/maand omzet: €36 + €200 = €236/m. Per jaar: €2 832.
- Plus: Stripe-fee daarboven: nog eens 1,4% + €0,25 per transactie.

Een eigen webshop op Next.js + Mollie + Vercel:

- Vercel: €20/m
- Supabase: €25/m
- Mollie: 1,4% + €0,25 per transactie (geen Shopify-marge erbovenop)
- Totaal hosting: €540/jaar

Verschil: ~€2 300/jaar. De build betaalt zichzelf typisch terug op 3–4 jaar.

**Wanneer Shopify dan nog wel?**

- Als je morgen wil starten en geen tijd of budget hebt voor een build
- Als je heel veel apps uit hun ecosystem wil
- Als je uitsluitend door dropshipping verkoopt

Voor wie z'n eigen merk en marge wil: een eigen build is — op middellange termijn — bijna altijd voordeliger.`,
  },
  {
    slug: "zelf-je-restaurantsite-beheren",
    title: "Drie redenen om je restaurantsite zelf te beheren",
    excerpt:
      "Een menu wijzigen mag geen factuur kosten. Hier hoe we 't aanpakken voor Cottage en Bar'Botte.",
    date: "2026-02-08",
    readMin: 4,
    tag: "Hospitality",
    body: `Restaurants zijn dynamisch. Het menu wijzigt per seizoen, soms per week. Openingsuren wijzigen voor verlof. Een vacature komt erbij wanneer iemand vertrekt. Als elke wijziging een mailtje + factuur is bij je webdeveloper, gaat 't te traag — of erger, het gebeurt niet.

**1. De keuken weet wat 't menu is, niet de developer.**

Onze admins voor Cottage en Bar'Botte zijn gemaakt om door de chef of zaalverantwoordelijke gebruikt te worden. Geen technische kennis nodig. Werkt op telefoon. Veranderingen staan binnen seconden online.

**2. Vacatures publiceren op het moment dat 't moet.**

Een sous-chef zoekt vinden in 2026 begint online. Een vacature direct kunnen publiceren — met foto, met automatische e-mail-flow naar kandidaten — maakt 't verschil tussen "we zoeken al maanden" en "we hebben binnen 2 weken iemand".

**3. Reservaties direct in je inbox.**

Geen externe tool, geen boekingsplatform-marge, geen account die je klant eerst moet aanmaken. Reservatie → mail → bevestiging → klaar.

De tijd die je daarmee wint, gaat naar wat je echt graag doet: koken en je gasten ontvangen.`,
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
