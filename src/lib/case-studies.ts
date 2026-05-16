import type { Locale } from "@/lib/i18n/config";

export type Metric = { label: string; before: string; after: string };
export type Decision = { title: string; rationale: string };
export type Phase = { phase: string; detail: string };

export type CaseStudy = {
  context: string;
  metricsTitle: string;
  metrics: Metric[];
  decisionsTitle: string;
  decisions: Decision[];
  timelineTitle: string;
  timeline: Phase[];
  reflectionTitle: string;
  reflection: string;
};

const data: Record<string, Record<Locale, CaseStudy>> = {
  "cottage-waregem": {
    nl: {
      context:
        "Cottage is een gevestigd restaurant in Waregem met een trouw publiek, maar de Squarespace-site werkte tegen de zaak. Elke menuwijziging vereiste gepruts in een trage editor, mobiele bezoekers (de meerderheid) wachtten 5+ seconden, en de kost liep jaarlijks op zonder dat de zaak er iets voor terugkreeg.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "PageSpeed (mobiel)", before: "zwak", after: "top" },
        { label: "Menu aanpassen", before: "een gedoe", after: "enkele min" },
        { label: "Laadtijd boven de vouw", before: "traag", after: "vrijwel direct" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Geen page-builder, wel een menu-model", rationale: "In plaats van vrije tekstblokken bouwde ik een gestructureerd menu (gerecht, prijs, allergenen, seizoen). Daardoor is een seizoenswissel een paar klikken in plaats van layout-gepruts." },
        { title: "Permanente redirects vóór live", rationale: "Elke oude Squarespace-URL kreeg een 301 naar de juiste nieuwe pagina. De ranking verhuisde mee — geen dip in Google na de overschakeling." },
        { title: "Vacatures als eigen module", rationale: "Horeca zoekt continu personeel. Een vacaturepagina met NL/FR mailflow bleek bijzaak maar werd een van de meest gebruikte delen." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Week 1 — Scope", detail: "Inventaris van alle bestaande pagina's en URL's, afspraken over wat de zaak zelf wil beheren." },
        { phase: "Week 2 — Design", detail: "Eerste klikbare versie op staging, feedback van de zaakvoerder verwerkt." },
        { phase: "Week 3 — Build + admin", detail: "Menu-, vacature- en openingsuren-module + content-import van Squarespace." },
        { phase: "Week 4 — Soft launch", detail: "Redirects live, sitemap ingediend, ranking gemonitord. Geen downtime." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "De menu-structuur was in het begin iets te streng — sommige gerechten passen niet netjes in vakjes. Ik heb een vrij 'notitie'-veld toegevoegd zodat de chef toch flexibel blijft. Les: structureer, maar laat altijd één ontsnappingsklep voor de realiteit van een keuken.",
    },
    fr: {
      context:
        "Cottage est un restaurant établi à Waregem avec un public fidèle, mais le site Squarespace travaillait contre l'établissement. Chaque changement de carte demandait de bricoler dans un éditeur lent, les visiteurs mobiles (la majorité) attendaient 5+ secondes, et le coût montait chaque année sans contrepartie.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "PageSpeed (mobile)", before: "faible", after: "excellent" },
        { label: "Adapter la carte", before: "une corvée", after: "quelques min" },
        { label: "Chargement above-the-fold", before: "lent", after: "quasi instantané" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Pas de page-builder, mais un modèle de carte", rationale: "Au lieu de blocs de texte libres, j'ai construit une carte structurée (plat, prix, allergènes, saison). Un changement de saison devient quelques clics au lieu de bricolage de mise en page." },
        { title: "Redirections permanentes avant le lancement", rationale: "Chaque ancienne URL Squarespace a reçu une 301 vers la bonne nouvelle page. Le classement a déménagé — pas de chute Google après la bascule." },
        { title: "Les emplois comme module propre", rationale: "L'horeca cherche du personnel en continu. Une page emplois avec flux mail NL/FR semblait secondaire mais est devenue une des parties les plus utilisées." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Semaine 1 — Périmètre", detail: "Inventaire de toutes les pages et URL existantes, accords sur ce que l'établissement veut gérer." },
        { phase: "Semaine 2 — Design", detail: "Première version cliquable sur staging, retours du gérant intégrés." },
        { phase: "Semaine 3 — Build + admin", detail: "Modules carte, emplois, heures d'ouverture + import du contenu Squarespace." },
        { phase: "Semaine 4 — Soft launch", detail: "Redirections en ligne, sitemap soumis, classement monitoré. Aucune interruption." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "La structure de carte était au début un peu trop stricte — certains plats n'entrent pas dans des cases nettes. J'ai ajouté un champ 'note' libre pour garder la flexibilité du chef. Leçon : structurez, mais laissez toujours une soupape pour la réalité d'une cuisine.",
    },
    en: {
      context:
        "Cottage is an established restaurant in Waregem with a loyal audience, but the Squarespace site worked against the business. Every menu change meant fiddling in a slow editor, mobile visitors (the majority) waited 5+ seconds, and the cost rose yearly with nothing in return.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "PageSpeed (mobile)", before: "weak", after: "top" },
        { label: "Update the menu", before: "a chore", after: "a few min" },
        { label: "Above-the-fold load", before: "slow", after: "near-instant" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "No page builder, but a menu model", rationale: "Instead of free text blocks I built a structured menu (dish, price, allergens, season). A seasonal switch becomes a few clicks instead of layout fiddling." },
        { title: "Permanent redirects before launch", rationale: "Every old Squarespace URL got a 301 to the right new page. The ranking moved with it — no Google dip after the switch." },
        { title: "Jobs as its own module", rationale: "Hospitality constantly hires. A jobs page with NL/FR mail flow seemed secondary but became one of the most-used parts." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Week 1 — Scope", detail: "Inventory of all existing pages and URLs, agreements on what the business wants to manage itself." },
        { phase: "Week 2 — Design", detail: "First clickable version on staging, owner feedback incorporated." },
        { phase: "Week 3 — Build + admin", detail: "Menu, jobs and opening-hours modules + content import from Squarespace." },
        { phase: "Week 4 — Soft launch", detail: "Redirects live, sitemap submitted, ranking monitored. No downtime." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "The menu structure was a touch too strict at first — some dishes don't fit neatly in boxes. I added a free 'note' field so the chef stays flexible. Lesson: structure, but always leave one escape valve for the reality of a kitchen.",
    },
  },
  barbotte: {
    nl: {
      context:
        "Bar'Botte is de kleinere zus-zaak van Cottage, in Waregem. Door de ligging dicht bij de taalgrens komt er ook Franstalig publiek over de vloer — een NL-only site liet letterlijk een deel van de potentiële gasten links liggen. Tegelijk mocht het geen dubbel beheer worden: dezelfde keuken, andere identiteit.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Talen", before: "1 (NL)", after: "2 (NL/FR)" },
        { label: "Beheer-systemen", before: "los van Cottage", after: "gedeeld" },
        { label: "Kaart & events aanpassen", before: "via webdev", after: "zelf, in min" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Gedeeld backend, aparte huid", rationale: "Cottage en Bar'Botte delen één admin maar tonen elk hun eigen identiteit. Eén keer beheren, twee zaken bediend." },
        { title: "FR niet als bijzaak", rationale: "De Franse versie is geen knop-in-de-hoek maar een volwaardige route met eigen SEO. Aan de taalgrens wordt in beide talen gezocht." },
        { title: "Zelf kaart & events beheren", rationale: "Geen reservaties — wél een eigen admin waar de zaak de kaart en events zelf in enkele minuten aanpast. Geen webdev-factuur per wijziging." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Week 1 — Identiteit", detail: "Bepalen wat Bar'Botte onderscheidt van Cottage binnen één systeem." },
        { phase: "Week 2 — i18n-architectuur", detail: "NL/FR routes, taaldetectie, hreflang correct opgezet." },
        { phase: "Week 3 — Build", detail: "Gedeelde admin uitgebreid met kaart- & events-beheer, vertaalbare content." },
        { phase: "Week 4 — Launch", detail: "Live in beide talen, kaart & events end-to-end getest." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "Ik onderschatte eerst hoeveel content écht tweetalig moest zijn versus louter vertaald. Sommige uitdrukkingen lopen niet 1-op-1 tussen NL en FR. Volgende keer plan ik vanaf dag één een korte copy-ronde per taal in, niet als nabewerking.",
    },
    fr: {
      context:
        "Bar'Botte est la petite sœur de Cottage, à Waregem. Sa situation tout près de la frontière linguistique attire aussi un public francophone — un site uniquement NL laissait littéralement une partie des clients potentiels de côté. En même temps, pas question de double gestion : même cuisine, identité différente.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Langues", before: "1 (NL)", after: "2 (NL/FR)" },
        { label: "Systèmes de gestion", before: "séparé de Cottage", after: "partagé" },
        { label: "Carte & events", before: "via webdev", after: "soi-même, en min" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Backend partagé, peau séparée", rationale: "Cottage et Bar'Botte partagent un admin mais montrent chacun leur identité. Gérer une fois, servir deux établissements." },
        { title: "Le FR pas en accessoire", rationale: "La version française n'est pas un bouton dans un coin mais une route à part entière avec son SEO. Près de la frontière linguistique, on cherche dans les deux langues." },
        { title: "Gérer soi-même carte & events", rationale: "Pas de réservations — mais un admin propre où l'établissement adapte lui-même la carte et les events en quelques minutes. Pas de facture webdev par changement." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Semaine 1 — Identité", detail: "Définir ce qui distingue Bar'Botte de Cottage dans un seul système." },
        { phase: "Semaine 2 — Architecture i18n", detail: "Routes NL/FR, détection de langue, hreflang correct." },
        { phase: "Semaine 3 — Build", detail: "Admin partagé étendu avec gestion carte & events, contenu traduisible." },
        { phase: "Semaine 4 — Lancement", detail: "En ligne dans les deux langues, carte & events testés de bout en bout." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "J'ai d'abord sous-estimé la part de contenu qui devait être vraiment bilingue versus simplement traduit. Certaines tournures ne passent pas en 1-pour-1 entre le NL et le FR. La prochaine fois je planifie dès le jour un une courte passe de copy par langue, pas en post-traitement.",
    },
    en: {
      context:
        "Bar'Botte is Cottage's smaller sister venue, in Waregem. Its location close to the language border also brings in French-speaking guests — an NL-only site literally left part of the potential guests aside. At the same time it couldn't become double management: same kitchen, different identity.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "Languages", before: "1 (NL)", after: "2 (NL/FR)" },
        { label: "Management systems", before: "separate from Cottage", after: "shared" },
        { label: "Edit menu & events", before: "via webdev", after: "self, in min" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "Shared backend, separate skin", rationale: "Cottage and Bar'Botte share one admin but each show their own identity. Manage once, serve two venues." },
        { title: "FR not as an afterthought", rationale: "The French version isn't a button in a corner but a full route with its own SEO. Near the language border people search in both languages." },
        { title: "Self-manage menu & events", rationale: "No reservations — but an own admin where the venue updates the menu and events itself in minutes. No webdev invoice per change." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Week 1 — Identity", detail: "Define what sets Bar'Botte apart from Cottage within one system." },
        { phase: "Week 2 — i18n architecture", detail: "NL/FR routes, language detection, hreflang set up correctly." },
        { phase: "Week 3 — Build", detail: "Shared admin extended with menu & events management, translatable content." },
        { phase: "Week 4 — Launch", detail: "Live in both languages, menu & events tested end-to-end." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "I first underestimated how much content truly had to be bilingual versus merely translated. Some phrasings don't carry over 1-to-1 between NL and FR. Next time I'll plan a short copy pass per language from day one, not as post-processing.",
    },
  },
  "celine-interieur": {
    nl: {
      context:
        "Céline runt drie verschillende stromen: een interieurshop, werven (projecten bij klanten thuis) en verhuur van decoratie. Eén admin werd een onleesbare brij; drie losse tools werden te duur en te versnipperd. Ze werkt bovendien vaak ter plaatse, met wisselende of geen verbinding.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Beheer-tools", before: "3 losse", after: "1 stack, 3 PWA's" },
        { label: "Foto's uploaden", before: "thuis, achteraf", after: "op de werf, direct" },
        { label: "Offline werken", before: "niet mogelijk", after: "volledig" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Eén database, drie PWA's", rationale: "In plaats van één overladen admin: drie installeerbare apps (Shop, Werven, Verhuur) op dezelfde data. Elk scherm toont enkel wat relevant is voor die stroom." },
        { title: "Offline-eerst voor Werven", rationale: "Op een werf is er vaak slechte verbinding. Foto's en notities worden lokaal opgeslagen en gesynct zodra er weer netwerk is." },
        { title: "Publiek vs. intern strikt gescheiden", rationale: "Klanten zien een verzorgd portfolio; Céline ziet de werkende kant. Geen risico dat intern werk per ongeluk publiek wordt." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Fase 1 — Stromen mappen", detail: "Wat hoort bij shop, werven en verhuur — en wat overlapt." },
        { phase: "Fase 2 — Datamodel", detail: "Eén Supabase-schema dat alle drie de stromen voedt." },
        { phase: "Fase 3 — Drie PWA's", detail: "Aparte installeerbare apps, elk met eigen icoon en focus." },
        { phase: "Fase 4 — Offline + sync", detail: "Lokale opslag + synchronisatie getest op trage en geen verbinding." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "Drie PWA's vanaf één codebase is krachtig maar vraagt discipline in hoe je gedeelde code organiseert. Ik heb halverwege de structuur herzien zodat een vierde stroom later triviaal toe te voegen is. Vroeger nadenken over uitbreidbaarheid had me die herwerking bespaard.",
    },
    fr: {
      context:
        "Céline gère trois flux différents : une boutique déco, des chantiers (projets chez les clients) et la location de décoration. Un seul admin devenait une bouillie illisible ; trois outils séparés trop chers et trop fragmentés. Elle travaille en plus souvent sur place, avec une connexion variable ou nulle.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Outils de gestion", before: "3 séparés", after: "1 stack, 3 PWA" },
        { label: "Upload photos", before: "chez soi, après", after: "sur le chantier, direct" },
        { label: "Travail hors ligne", before: "impossible", after: "complet" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Une base, trois PWA", rationale: "Au lieu d'un admin surchargé : trois apps installables (Boutique, Chantiers, Location) sur les mêmes données. Chaque écran ne montre que le pertinent." },
        { title: "Hors-ligne d'abord pour Chantiers", rationale: "Sur un chantier la connexion est souvent mauvaise. Photos et notes stockées localement, synchronisées dès le retour du réseau." },
        { title: "Public vs interne strictement séparés", rationale: "Les clients voient un portfolio soigné ; Céline voit le côté opérationnel. Aucun risque qu'un travail interne devienne public par erreur." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Phase 1 — Cartographier les flux", detail: "Ce qui appartient à boutique, chantiers et location — et ce qui se recoupe." },
        { phase: "Phase 2 — Modèle de données", detail: "Un schéma Supabase qui alimente les trois flux." },
        { phase: "Phase 3 — Trois PWA", detail: "Apps installables distinctes, chacune avec son icône et son focus." },
        { phase: "Phase 4 — Hors-ligne + sync", detail: "Stockage local + synchronisation testés sur connexion lente et nulle." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "Trois PWA depuis une codebase est puissant mais demande de la discipline dans l'organisation du code partagé. J'ai revu la structure à mi-parcours pour qu'un quatrième flux soit trivial à ajouter. Y penser plus tôt m'aurait épargné cette refonte.",
    },
    en: {
      context:
        "Céline runs three different streams: an interior shop, projects (work at clients' homes) and decoration rental. One admin became an unreadable mush; three separate tools too expensive and fragmented. She also often works on site, with variable or no connection.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "Management tools", before: "3 separate", after: "1 stack, 3 PWAs" },
        { label: "Photo upload", before: "at home, after", after: "on site, immediate" },
        { label: "Offline work", before: "impossible", after: "full" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "One database, three PWAs", rationale: "Instead of one overloaded admin: three installable apps (Shop, Projects, Rental) on the same data. Each screen shows only what's relevant to that stream." },
        { title: "Offline-first for Projects", rationale: "On a site the connection is often poor. Photos and notes stored locally, synced once the network returns." },
        { title: "Public vs internal strictly separated", rationale: "Clients see a polished portfolio; Céline sees the working side. No risk internal work accidentally goes public." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Phase 1 — Map the streams", detail: "What belongs to shop, projects and rental — and what overlaps." },
        { phase: "Phase 2 — Data model", detail: "One Supabase schema that feeds all three streams." },
        { phase: "Phase 3 — Three PWAs", detail: "Separate installable apps, each with its own icon and focus." },
        { phase: "Phase 4 — Offline + sync", detail: "Local storage + sync tested on slow and no connection." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "Three PWAs from one codebase is powerful but demands discipline in how you organize shared code. I revised the structure halfway so a fourth stream is trivial to add later. Thinking about extensibility earlier would have saved that rework.",
    },
  },
  allardphilippe: {
    nl: {
      context:
        "Allard is een wildlife-fotograaf die fine-art prints verkoopt. Jarenlang liep dat via Instagram en Etsy: zichtbaar, maar elke verkoop kostte marge en hij kreeg geen klantgegevens terug. Hij wilde een echte shop die van hém was, voor zowel Vlaams als Waals publiek.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Verkoopkanaal", before: "Etsy/Instagram", after: "eigen shop" },
        { label: "Marge per verkoop", before: "− platformfee", after: "enkel Mollie-fee" },
        { label: "Klantendata", before: "geen", after: "volledig eigen" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Mollie boven Stripe", rationale: "Het publiek is grotendeels Belgisch. Mollie geeft Bancontact en lagere fees voor lokale betalingen — direct relevant voor de marge." },
        { title: "Klantportaal vanaf dag één", rationale: "Niet enkel verkopen maar klanten houden: bestelhistoriek, herbestellen, downloads. Een platform geeft je dat nooit terug." },
        { title: "Gift cards + kortingscodes", rationale: "Fine-art wordt vaak cadeau gedaan. Gift cards openden een verkoopkanaal dat op Etsy niet bestond." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Maand 1 — Shop-fundament", detail: "Catalogus, varianten (formaat/lijst), Mollie-checkout, btw-correcte facturen." },
        { phase: "Maand 1 — Klantportaal", detail: "Login, bestelhistoriek, downloads, retour-afhandeling." },
        { phase: "Maand 2 — Groei-tools", detail: "Gift cards, kortingscodes, ingebouwde newsletter met tracking." },
        { phase: "Maand 2 — NL/FR + launch", detail: "Volledige tweetalige uitrol, soft launch met monitoring." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "We zijn breed gestart met veel productvarianten. Achteraf bleek een kleiner, scherper aanbod beter te verkopen. Volgende keer lanceer ik liever met minder SKU's en breid uit op basis van wat écht verkoopt — minder bouwwerk, sneller leren.",
    },
    fr: {
      context:
        "Allard est un photographe animalier qui vend des tirages fine-art. Pendant des années cela passait par Instagram et Etsy : visible, mais chaque vente coûtait de la marge et ne renvoyait aucune donnée client. Il voulait une vraie boutique à lui, pour le public flamand comme wallon.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Canal de vente", before: "Etsy/Instagram", after: "boutique propre" },
        { label: "Marge par vente", before: "− frais plateforme", after: "seulement frais Mollie" },
        { label: "Données clients", before: "aucune", after: "entièrement propres" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Mollie plutôt que Stripe", rationale: "Le public est largement belge. Mollie offre Bancontact et des frais plus bas en local — directement pertinent pour la marge." },
        { title: "Espace client dès le jour un", rationale: "Pas que vendre mais garder les clients : historique, recommande, téléchargements. Une plateforme ne vous rend jamais ça." },
        { title: "Cartes-cadeaux + codes promo", rationale: "Le fine-art s'offre souvent. Les cartes-cadeaux ont ouvert un canal qui n'existait pas sur Etsy." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Mois 1 — Fondation boutique", detail: "Catalogue, variantes (format/cadre), checkout Mollie, factures TVA correctes." },
        { phase: "Mois 1 — Espace client", detail: "Connexion, historique, téléchargements, gestion des retours." },
        { phase: "Mois 2 — Outils de croissance", detail: "Cartes-cadeaux, codes promo, newsletter intégrée avec suivi." },
        { phase: "Mois 2 — NL/FR + lancement", detail: "Déploiement bilingue complet, soft launch avec monitoring." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "On a démarré large avec beaucoup de variantes produit. Après coup, une offre plus petite et plus nette vendait mieux. La prochaine fois je lance avec moins de SKU et j'étends selon ce qui vend vraiment — moins de build, apprentissage plus rapide.",
    },
    en: {
      context:
        "Allard is a wildlife photographer selling fine-art prints. For years that ran via Instagram and Etsy: visible, but every sale cost margin and returned no customer data. He wanted a real shop that was his, for both Flemish and Walloon audiences.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "Sales channel", before: "Etsy/Instagram", after: "own shop" },
        { label: "Margin per sale", before: "− platform fee", after: "only Mollie fee" },
        { label: "Customer data", before: "none", after: "fully owned" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "Mollie over Stripe", rationale: "The audience is largely Belgian. Mollie offers Bancontact and lower fees for local payments — directly relevant to margin." },
        { title: "Customer portal from day one", rationale: "Not just selling but keeping customers: order history, reorder, downloads. A platform never gives that back." },
        { title: "Gift cards + discount codes", rationale: "Fine-art is often gifted. Gift cards opened a sales channel that didn't exist on Etsy." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Month 1 — Shop foundation", detail: "Catalogue, variants (size/frame), Mollie checkout, VAT-correct invoices." },
        { phase: "Month 1 — Customer portal", detail: "Login, order history, downloads, returns handling." },
        { phase: "Month 2 — Growth tools", detail: "Gift cards, discount codes, built-in newsletter with tracking." },
        { phase: "Month 2 — NL/FR + launch", detail: "Full bilingual rollout, soft launch with monitoring." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "We started broad with many product variants. In hindsight a smaller, sharper offering sold better. Next time I'd rather launch with fewer SKUs and expand based on what actually sells — less build, faster learning.",
    },
  },
  "jp-montreuil": {
    nl: {
      context:
        "Een kunstenaar met een WordPress-site die over de jaren was dichtgeslibd met plugins. Traag, kwetsbaar, en — het grootste pijnpunt — hij kon zelf geen tentoonstelling of nieuw album toevoegen zonder een ontwikkelaar te bellen. Voor een kunstenaar is dat een rem op zijn eigen werk tonen.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Plugins", before: "veel + kwetsbaar", after: "0" },
        { label: "Tentoonstelling toevoegen", before: "developer bellen", after: "zelf, minuten" },
        { label: "Talen", before: "1", after: "NL/FR" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Album als eerste-klas concept", rationale: "Niet 'pagina's met foto's' maar een echt album-model met drag-drop volgorde. De kunstenaar denkt in reeksen, de admin volgt dat denken." },
        { title: "ibook-module", rationale: "Publicaties zijn voor een kunstenaar even belangrijk als werk. Een aparte module zodat boeken en catalogi niet ondergesneeuwd raken." },
        { title: "Volledige WordPress-import", rationale: "Geen copy-paste-marathon. Alle bestaande tentoonstellingen en beelden geautomatiseerd geïmporteerd, met behoud van datums en volgorde." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Week 1 — Audit", detail: "Wat staat er in WordPress, wat moet mee, wat mag weg." },
        { phase: "Week 2 — Datamodel", detail: "Tentoonstellingen, albums, ibook — hoe de kunstenaar erover denkt." },
        { phase: "Week 3 — Build + import", detail: "Admin gebouwd, alle content geautomatiseerd overgezet." },
        { phase: "Week 4 — NL/FR + redirects", detail: "Tweetalig live, oude WordPress-URL's permanent doorverwezen." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "De import was technisch het lastigste deel — WordPress-data is rommelig. Ik had vooraf meer tijd moeten inplannen voor het opschonen van oude, half-afgewerkte posts. Les: bij een migratie is de data-archeologie altijd groter dan ze lijkt.",
    },
    fr: {
      context:
        "Un artiste avec un site WordPress encrassé au fil des ans par les plugins. Lent, vulnérable, et — le plus gros point de douleur — il ne pouvait pas ajouter lui-même une exposition ou un nouvel album sans appeler un développeur. Pour un artiste, c'est un frein à montrer son propre travail.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Plugins", before: "beaucoup + vulnérable", after: "0" },
        { label: "Ajouter une exposition", before: "appeler le dev", after: "soi-même, minutes" },
        { label: "Langues", before: "1", after: "NL/FR" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "L'album comme concept de première classe", rationale: "Pas des 'pages avec photos' mais un vrai modèle d'album avec ordre drag-drop. L'artiste pense en séries, l'admin suit cette pensée." },
        { title: "Module ibook", rationale: "Les publications comptent autant que le travail pour un artiste. Un module séparé pour que livres et catalogues ne soient pas noyés." },
        { title: "Import WordPress complet", rationale: "Pas de marathon copier-coller. Toutes les expositions et images existantes importées automatiquement, dates et ordre conservés." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Semaine 1 — Audit", detail: "Ce qu'il y a dans WordPress, ce qui doit suivre, ce qui peut partir." },
        { phase: "Semaine 2 — Modèle de données", detail: "Expositions, albums, ibook — comment l'artiste y pense." },
        { phase: "Semaine 3 — Build + import", detail: "Admin construit, tout le contenu transféré automatiquement." },
        { phase: "Semaine 4 — NL/FR + redirections", detail: "Bilingue en ligne, anciennes URL WordPress redirigées en permanence." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "L'import était la partie techniquement la plus dure — les données WordPress sont désordonnées. J'aurais dû prévoir plus de temps pour nettoyer les anciens posts à moitié finis. Leçon : dans une migration, l'archéologie des données est toujours plus grande qu'il n'y paraît.",
    },
    en: {
      context:
        "An artist with a WordPress site clogged over the years with plugins. Slow, vulnerable, and — the biggest pain — he couldn't add an exhibition or new album himself without calling a developer. For an artist that's a brake on showing his own work.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "Plugins", before: "many + vulnerable", after: "0" },
        { label: "Add an exhibition", before: "call the dev", after: "yourself, minutes" },
        { label: "Languages", before: "1", after: "NL/FR" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "Album as a first-class concept", rationale: "Not 'pages with photos' but a real album model with drag-drop order. The artist thinks in series, the admin follows that thinking." },
        { title: "ibook module", rationale: "Publications matter as much as work for an artist. A separate module so books and catalogues don't get buried." },
        { title: "Full WordPress import", rationale: "No copy-paste marathon. All existing exhibitions and images imported automatically, preserving dates and order." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Week 1 — Audit", detail: "What's in WordPress, what must come along, what can go." },
        { phase: "Week 2 — Data model", detail: "Exhibitions, albums, ibook — how the artist thinks about it." },
        { phase: "Week 3 — Build + import", detail: "Admin built, all content migrated automatically." },
        { phase: "Week 4 — NL/FR + redirects", detail: "Bilingual live, old WordPress URLs permanently redirected." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "The import was the technically hardest part — WordPress data is messy. I should have planned more time to clean up old, half-finished posts. Lesson: in a migration, the data archaeology is always bigger than it looks.",
    },
  },
  "mari-lines": {
    nl: {
      context:
        "Mari Lines doet wegmarkeringen — een B2B-niche zonder enige online aanwezigheid. Het probleem is niet 'mooie site' maar geloofwaardigheid: 80% van de B2B-beslissers zoekt vandaag eerst online naar 'wie doet dit professioneel'. Geen site betekende: niet in de running.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Online aanwezigheid", before: "geen", after: "vindbaar + geloofwaardig" },
        { label: "Offerte-aanvraag", before: "telefoon/toeval", after: "formulier 24/7" },
        { label: "Eerste indruk", before: "n.v.t.", after: "professioneel, snel" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Vertrouwen boven flash", rationale: "Geen animatie-spektakel. B2B-beslissers willen snel zien: doen ze dit echt, en kan ik ze bereiken. Schoon, snel, concreet." },
        { title: "Projectreferenties als bewijs", rationale: "In B2B verkoopt bewijs, niet beloftes. Concrete uitgevoerde projecten dragen meer dan een mooie slogan." },
        { title: "Eén duidelijke call-to-action", rationale: "Geen tien knoppen. Eén pad: offerte aanvragen. De rest van de site ondersteunt enkel die ene actie." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Week 1 — Positionering", detail: "Wat maakt Mari Lines geloofwaardig voor een B2B-inkoper." },
        { phase: "Week 2 — Design + content", detail: "Schone, mobiel-eerst structuur rond diensten en referenties." },
        { phase: "Week 2 — Offerte-flow", detail: "Formulier dat rechtstreeks naar de zaak mailt, geen ruis." },
        { phase: "Week 3 — Launch", detail: "Live, snel, vindbaar. Klein van scope, scherp van doel." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "Dit project bewees opnieuw: voor B2B is minder vaak meer. De verleiding om 'meer' toe te voegen was er, maar elke extra sectie verzwakte het ene pad naar de offerte. Volgende keer houd ik die discipline vanaf de eerste schets vast in plaats van later te snoeien.",
    },
    fr: {
      context:
        "Mari Lines fait du marquage routier — une niche B2B sans aucune présence en ligne. Le problème n'est pas 'un beau site' mais la crédibilité : 80 % des décideurs B2B cherchent aujourd'hui d'abord en ligne 'qui fait ça professionnellement'. Pas de site signifiait : hors course.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Présence en ligne", before: "aucune", after: "trouvable + crédible" },
        { label: "Demande de devis", before: "téléphone/hasard", after: "formulaire 24/7" },
        { label: "Première impression", before: "n.a.", after: "professionnel, rapide" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Confiance plutôt que flash", rationale: "Pas de spectacle d'animations. Les décideurs B2B veulent vite voir : le font-ils vraiment, puis-je les joindre. Propre, rapide, concret." },
        { title: "Références projets comme preuve", rationale: "En B2B, la preuve vend, pas les promesses. Des projets concrets réalisés portent plus qu'un beau slogan." },
        { title: "Un seul appel à l'action clair", rationale: "Pas dix boutons. Un chemin : demander un devis. Le reste du site soutient cette seule action." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Semaine 1 — Positionnement", detail: "Ce qui rend Mari Lines crédible pour un acheteur B2B." },
        { phase: "Semaine 2 — Design + contenu", detail: "Structure propre, mobile-first autour des services et références." },
        { phase: "Semaine 2 — Flux de devis", detail: "Formulaire qui écrit directement à l'établissement, sans bruit." },
        { phase: "Semaine 3 — Lancement", detail: "En ligne, rapide, trouvable. Petit en scope, net en objectif." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "Ce projet a reprouvé : en B2B, moins est souvent plus. La tentation d'ajouter 'plus' était là, mais chaque section supplémentaire affaiblissait l'unique chemin vers le devis. La prochaine fois je tiens cette discipline dès la première esquisse plutôt que d'élaguer après.",
    },
    en: {
      context:
        "Mari Lines does road marking — a B2B niche with zero online presence. The problem isn't 'a pretty site' but credibility: 80% of B2B decision-makers today first search online for 'who does this professionally'. No site meant: not in the running.",
      metricsTitle: "In numbers",
      metrics: [
        { label: "Online presence", before: "none", after: "findable + credible" },
        { label: "Quote request", before: "phone/chance", after: "form 24/7" },
        { label: "First impression", before: "n/a", after: "professional, fast" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "Trust over flash", rationale: "No animation spectacle. B2B decision-makers want to quickly see: do they really do this, can I reach them. Clean, fast, concrete." },
        { title: "Project references as proof", rationale: "In B2B, proof sells, not promises. Concrete delivered projects carry more than a nice slogan." },
        { title: "One clear call-to-action", rationale: "Not ten buttons. One path: request a quote. The rest of the site only supports that one action." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Week 1 — Positioning", detail: "What makes Mari Lines credible to a B2B buyer." },
        { phase: "Week 2 — Design + content", detail: "Clean, mobile-first structure around services and references." },
        { phase: "Week 2 — Quote flow", detail: "Form that emails the business directly, no noise." },
        { phase: "Week 3 — Launch", detail: "Live, fast, findable. Small in scope, sharp in goal." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "This project re-proved: for B2B, less is often more. The temptation to add 'more' was there, but every extra section weakened the single path to the quote. Next time I hold that discipline from the first sketch rather than pruning later.",
    },
  },
  favesan: {
    nl: {
      context:
        "Favesan (sanitair, verwarming, airco, ventilatie) had een WordPress-site op one.com die traag en duur was — en die zelfs offline ging door een onbetaalde hostingfactuur. Een installateur kan z'n vindbaarheid niet laten afhangen van zo'n setup.",
      metricsTitle: "In cijfers",
      metrics: [
        { label: "Talen", before: "1 (NL)", after: "3 (NL/FR/EN)" },
        { label: "Diensten aanpassen", before: "via webdev", after: "zelf, in min" },
        { label: "Beschikbaarheid", before: "offline bij onbetaalde factuur", after: "betrouwbaar" },
      ],
      decisionsTitle: "Belangrijkste keuzes",
      decisions: [
        { title: "Weg van WordPress + one.com", rationale: "Niet patchen maar volledig herbouwen in Next.js + Supabase. Code en data van de zaak, hosting zonder verrassingsfacturen." },
        { title: "Eigen admin voor diensten & blog", rationale: "Sanitair, verwarming, airco en ventilatie plus artikels zelf beheren — geen factuur per tekstwijziging." },
        { title: "Drietalig met echt SEO", rationale: "NL/FR/EN als volwaardige routes met eigen metadata, niet als vertaalknop achteraf." },
      ],
      timelineTitle: "Tijdlijn",
      timeline: [
        { phase: "Dag 1 — Inventaris", detail: "Pagina's, diensten en foto's van de oude site vastgelegd; domeintransfer opgestart." },
        { phase: "Week 1 — Bouw", detail: "Site + eigen admin (diensten, blog), drietalige content, contactformulier met fotoupload." },
        { phase: "Week 1–2 — Live", detail: "Content en foto's overgezet, redirects, live op favesan.be." },
      ],
      reflectionTitle: "Wat ik zou herdoen",
      reflection:
        "De bouw zelf zat snel goed; de échte vertraging zat in het losweken van het domein bij one.com. Les: start de domeintransfer op dag één, parallel met de bouw — niet als laatste stap.",
    },
    fr: {
      context:
        "Favesan (sanitaire, chauffage, climatisation, ventilation) avait un site WordPress sur one.com lent et coûteux — et même hors ligne suite à une facture d'hébergement impayée. Un installateur ne peut pas faire dépendre sa visibilité d'un tel montage.",
      metricsTitle: "En chiffres",
      metrics: [
        { label: "Langues", before: "1 (NL)", after: "3 (NL/FR/EN)" },
        { label: "Modifier les services", before: "via webdev", after: "soi-même, en min" },
        { label: "Disponibilité", before: "hors ligne si facture impayée", after: "fiable" },
      ],
      decisionsTitle: "Choix clés",
      decisions: [
        { title: "Quitter WordPress + one.com", rationale: "Pas de rustine mais une refonte complète en Next.js + Supabase. Code et données à l'entreprise, hébergement sans factures surprises." },
        { title: "Admin propre pour services & blog", rationale: "Sanitaire, chauffage, clim et ventilation plus les articles, gérés soi-même — pas de facture par modification." },
        { title: "Trilingue avec vrai SEO", rationale: "NL/FR/EN comme routes à part entière avec leurs metadata, pas un bouton de traduction après coup." },
      ],
      timelineTitle: "Calendrier",
      timeline: [
        { phase: "Jour 1 — Inventaire", detail: "Pages, services et photos de l'ancien site recensés ; transfert du domaine lancé." },
        { phase: "Semaine 1 — Build", detail: "Site + admin propre (services, blog), contenu trilingue, formulaire avec upload photo." },
        { phase: "Semaine 1–2 — En ligne", detail: "Contenu et photos transférés, redirections, en ligne sur favesan.be." },
      ],
      reflectionTitle: "Ce que je referais",
      reflection:
        "Le build a été rapide ; le vrai retard venait de la libération du domaine chez one.com. Leçon : lancer le transfert du domaine dès le jour un, en parallèle du build — pas en dernière étape.",
    },
    en: {
      context:
        "Favesan (plumbing, heating, AC, ventilation) had a WordPress site on one.com that was slow and expensive — and even went offline over an unpaid hosting invoice. An installer can't have their visibility hang on a setup like that.",
      metricsTitle: "By the numbers",
      metrics: [
        { label: "Languages", before: "1 (NL)", after: "3 (NL/FR/EN)" },
        { label: "Edit services", before: "via webdev", after: "self, in min" },
        { label: "Availability", before: "offline on unpaid invoice", after: "reliable" },
      ],
      decisionsTitle: "Key decisions",
      decisions: [
        { title: "Off WordPress + one.com", rationale: "Not a patch but a full rebuild in Next.js + Supabase. Code and data with the business, hosting without surprise invoices." },
        { title: "Own admin for services & blog", rationale: "Plumbing, heating, AC and ventilation plus articles, managed in-house — no invoice per text change." },
        { title: "Trilingual with real SEO", rationale: "NL/FR/EN as full routes with their own metadata, not an afterthought translate button." },
      ],
      timelineTitle: "Timeline",
      timeline: [
        { phase: "Day 1 — Inventory", detail: "Pages, services and photos of the old site captured; domain transfer started." },
        { phase: "Week 1 — Build", detail: "Site + own admin (services, blog), trilingual content, contact form with photo upload." },
        { phase: "Week 1–2 — Live", detail: "Content and photos migrated, redirects, live on favesan.be." },
      ],
      reflectionTitle: "What I'd redo",
      reflection:
        "The build came together fast; the real delay was prying the domain loose at one.com. Lesson: start the domain transfer on day one, parallel to the build — not as the final step.",
    },
  },
};

export function getCaseStudy(
  slug: string,
  locale: Locale,
): CaseStudy | undefined {
  return data[slug]?.[locale];
}
