// Social-post template-bibliotheek voor de AI Content Engine.
//
// Elke template is een "bouwsteen" met:
//   - id, platform, post_kind, target_url
//   - optional days[]: wanneer geschikt (ma=1, di=2, ...; geen lijst = alle dagen)
//   - build(ctx): geeft { title, body, hashtags }
//
// De generator (social-generator.ts) kiest elke dag 3 templates die NIET
// recent zijn gebruikt, varieert per platform en injecteert ctx-variabelen.

export type TemplateCtx = {
  dayName: string; // "maandag", "dinsdag", ...
  dayShort: string; // "ma", "di", ...
  date: string; // "22 mei"
  client: { name: string; site: string; sector: string };
  altClient: { name: string; site: string; sector: string };
};

export type Template = {
  id: string;
  platform: "facebook" | "linkedin";
  post_kind: "persoonlijk" | "page" | "group" | "article" | "story";
  target_url: string;
  days?: number[]; // 1-5 = ma-vr
  category:
    | "showcase"
    | "tip"
    | "case"
    | "question"
    | "story"
    | "case-study"
    | "service"
    | "positie"
    | "story-case";
  build: (ctx: TemplateCtx) => {
    title: string;
    body: string;
    hashtags: string;
    site?: string; // optioneel: feature-site (domain) voor screenshot-layout
  };
};

// ============================================================================
// STORY-CASES — 1 per werkdag, korter en punchier dan feed-cases.
// Gebruikt voor /api/social-image/[id]?format=story (1080×1920).
// Maandag-vrijdag: rotatie door 5 cases (Cottage en Bar'Botte alterneren).
// ============================================================================
export const STORY_CASE_TEMPLATES: Template[] = [
  {
    id: "story-celine-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [1], // maandag
    category: "story-case",
    build: () => ({
      title: "Story · Céline — celineinterieur.com",
      body: `🛋️ Vandaag's case: celineinterieur.com

Voor mijn zus Céline bouwde ik haar webshop + offerte-flow.

Eigen admin. <1s laadtijd. Vaste prijs.

Zelf nodig? → studio-vm.be`,
      hashtags: "",
      site: "celineinterieur.com",
    }),
  },
  {
    id: "story-jp-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [2], // dinsdag
    category: "story-case",
    build: () => ({
      title: "Story · Jean-Paul — montreuil.be",
      body: `📸 Vandaag's case: montreuil.be

Wildlife-galerie + boekverkoop voor m'n vader.

Foto's geoptimaliseerd, laadt in 0.7s op mobiel.

Bouw ook voor jou? → studio-vm.be`,
      hashtags: "",
      site: "montreuil.be",
    }),
  },
  {
    id: "story-marilines-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [3], // woensdag
    category: "story-case",
    build: () => ({
      title: "Story · Mari-Lines — mari-lines.be",
      body: `🚧 Vandaag's case: mari-lines.be

B2B-site voor wegmarkeringen — werkenoverzicht + offertes voor bouwheren.

Vaste prijs, in 3 weken.

KMO met website-vraag? → studio-vm.be`,
      hashtags: "",
      site: "mari-lines.be",
    }),
  },
  {
    id: "story-allard-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [4], // donderdag
    category: "story-case",
    build: () => ({
      title: "Story · Allard — wildlife portfolio + prints",
      body: `🦌 Vandaag's case: wildlife portfolio + e-commerce

Portfolio + print-webshop voor wildlife-fotograaf Allard.

Mollie-checkout, eigen admin.

Creatief? Webshop nodig? → studio-vm.be`,
      hashtags: "",
      site: "allardphilippe.vercel.app",
    }),
  },
  {
    id: "story-barbotte-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [5], // vrijdag week A
    category: "story-case",
    build: () => ({
      title: "Story · Bar'Botte — horeca + reservaties",
      body: `🍷 Vandaag's case: horeca-site Bar'Botte

Menu's + dagsuggesties + reservaties direct op de site.

Eigen admin — geen Photoshop-pdf-werk meer.

Horeca-zaak? → studio-vm.be`,
      hashtags: "",
      site: "barbotte.vercel.app",
    }),
  },
  {
    id: "story-cottage-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/",
    days: [5], // vrijdag week B (alterneert met Bar'Botte via rotatie-keuze)
    category: "story-case",
    build: () => ({
      title: "Story · Cottage Waregem — restaurant + events",
      body: `🍽️ Vandaag's case: Cottage Waregem

Restaurant + eventruimte in 1 site, met aparte flows.

Vaste prijs, opgeleverd in 4 weken.

Brasserie of zaak? → studio-vm.be`,
      hashtags: "",
      site: "cottage-waregem.vercel.app",
    }),
  },
];

// Klanten-portfolio — wordt in roterende slots gebruikt voor variatie.
// Allemaal publieke sites; geen privacy-issue om te vermelden.
//
// kind:
//   build     — site die ik bouwde voor de klant
//   own       — eigen bureau-site
//   migration — site die nog niet gemigreerd is (toekomstige case)
// site = echte production-domain. Alle klantsites hebben hun eigen domein.
export const PORTFOLIO = [
  {
    name: "Céline (zus)",
    site: "celineinterieur.com",
    sector: "interieur",
    kind: "build",
    angle: "webshop + offerte-aanvragen + admin",
  },
  {
    name: "Jean-Paul Montreuil (vader)",
    site: "montreuil.be",
    sector: "fotografie",
    kind: "build",
    angle: "galerie + boekverkoop + tentoonstellingen",
  },
  {
    name: "Allard Philippe",
    site: "allardphilippe.vercel.app",
    sector: "wildlife-fotografie",
    kind: "build",
    angle: "portfolio + e-commerce voor prints",
  },
  {
    name: "Mari-Lines (Rik)",
    site: "mari-lines.be",
    sector: "wegmarkeringen",
    kind: "build",
    angle: "B2B-presentatie + werkenoverzicht + offerte-flow",
  },
  {
    name: "Bar'Botte",
    site: "barbotte.vercel.app",
    sector: "horeca",
    kind: "build",
    angle: "menu's + dagsuggesties + reservaties",
  },
  {
    name: "Cottage Waregem",
    site: "cottage-waregem.vercel.app",
    sector: "horeca",
    kind: "build",
    angle: "restaurant + eventruimte + menu's",
  },
  {
    name: "favesan",
    site: "favesan.be",
    sector: "klant in transitie",
    kind: "migration",
    angle: "huidige WordPress-site — migratie-kandidaat naar moderne stack",
  },
  {
    name: "Studio-vm (eigen bureau)",
    site: "studio-vm.be",
    sector: "eigen bureau",
    kind: "own",
    angle: "het bewijs van wat ik predik — 100/100 PageSpeed, eigen admin",
  },
] as const;

// ============================================================================
// TEMPLATES — portfolio-eerst, dan service-uitleg en positionering.
// Mix per week (3 posts/dag × 5 dagen = 15 posts):
//   40% showcase (gemaakte site)
//   20% case-study (LinkedIn deep-dive)
//   15% service-uitleg (Health Check, migratie, admin)
//   15% positionering (WP-kritiek, snelheid, prijs)
//   10% persoonlijk (vraag, dank)
// ============================================================================
export const TEMPLATES: Template[] = [
  // ============================================================================
  // SHOWCASE — één per portfolio-build-site (6 stuks)
  // ============================================================================
  {
    id: "showcase-celine-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 3],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: celineinterieur.com",
      body: `Voor mijn zus Céline bouwde ik celineinterieur.com — interieurzaak in Waregem.

Wat zit erin?
• Webshop voor de productlijn
• Offerte-aanvraag-formulier voor maatwerk
• Eigen admin-paneel — Céline past zelf prijzen, foto's, beschikbaarheid aan zonder mij te bellen
• Laadt in 0.8s op mobiel, 98/100 PageSpeed

Vaste prijs, opgeleverd in 3 weken. Geen WordPress, geen plugin-jungle, geen maandelijkse "onderhoudsfactuur" voor niets.

Heb jij of ken jij een zaak die met haar website worstelt? Studio-vm.be → start met een gratis scan.`,
      hashtags: "",
      site: "celineinterieur.com",
    }),
  },
  {
    id: "showcase-jp-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2, 4],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: montreuil.be",
      body: `Voor mijn vader — Jean-Paul Montreuil, wildlife-fotograaf — bouwde ik montreuil.be.

Drie functies:
1. Galerie van zijn werk (volledig responsive, foto's vooraf geoptimaliseerd, laadt razendsnel)
2. Boekverkoop — direct via de site
3. Tentoonstellingen-agenda die hij zelf bijhoudt

Voor een fotograaf is laadtijd cruciaal — niemand wacht 5 seconden op een foto. Zijn site laadt in 0.7s op mobiel.

Vaste prijs, eigen admin. Zelf gebouwd vanuit Anzegem.

Ken je een fotograaf, kunstenaar of creatieveling die nog vastzit op een trage portfolio-site? Stuur ze door.`,
      hashtags: "",
      site: "montreuil.be",
    }),
  },
  {
    id: "showcase-allard-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3, 5],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: allardphilippe.vercel.app",
      body: `Allard Philippe — wildlife-fotograaf — wou een site die zijn werk laat ademen, met de mogelijkheid om prints te verkopen.

Resultaat: allardphilippe.vercel.app.

→ Volledige portfolio met collecties
→ Webshop voor prints in verschillende formaten
→ Bestelflow via Mollie
→ Eigen admin om foto's, collecties en prijzen toe te voegen

Laadtijd 0.9s, PageSpeed 96. Vaste prijs, oplevering in 3 weken.

Studio-vm.be — websites voor creatieven, KMO's en zelfstandigen in Vlaanderen.`,
      hashtags: "",
      site: "allardphilippe.vercel.app",
    }),
  },
  {
    id: "showcase-marilines-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 4],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: mari-lines.be",
      body: `B2B-site die ik dit jaar bouwde: mari-lines.be — wegmarkeringen-bedrijf van een vriend.

Wat doet hij anders dan een typische "showcase-site"?
• Werkenoverzicht met écht uitgevoerde projecten + foto's
• Offerte-aanvraagflow specifiek voor bouwheren en aannemers
• Eigen admin waarop hij zelf nieuwe werven kan toevoegen
• Mobile-first — zijn klanten bekijken offertes vanaf de werf

Vaste prijs, in 3 weken klaar. Geen Webflow, geen WordPress, gewoon goed gebouwd.

Ken je een B2B-bedrijf dat zijn site al jaren niet meer durft te updaten? Stuur ze door.`,
      hashtags: "",
      site: "mari-lines.be",
    }),
  },
  {
    id: "showcase-barbotte-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2, 5],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: barbotte.vercel.app",
      body: `Bar'Botte Waregem — een van de horeca-zaken waar ik dit jaar de site voor bouwde.

Wat doet hij?
• Menu + dagsuggesties die ze zélf bijwerken (geen Photoshop-pdf meer)
• Reservatie rechtstreeks op de site
• Foto's automatisch geoptimaliseerd (geen 5MB-blunder)
• Laadt in <1s op mobiel — belangrijk, want 70%+ horeca-zoekopdrachten gebeuren op telefoon

Vaste prijs, opgeleverd in 3 weken. Eigen admin, geen maandkost-truc.

Ken je een horeca-zaak die nog op een trage Squarespace of WordPress zit? Studio-vm.be → gratis scan.`,
      hashtags: "",
      site: "barbotte.vercel.app",
    }),
  },
  {
    id: "showcase-cottage-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3, 4],
    category: "showcase",
    build: () => ({
      title: "Site die ik maakte: cottage-waregem.vercel.app",
      body: `Cottage Waregem — brasserie met eventruimte. Site door mij gebouwd: cottage-waregem.vercel.app.

Drie modules in één site:
1. Restaurant — menu's, dagsuggesties, reserveren
2. Eventruimte — aanvraag voor recepties, familiefeesten, B2B-events
3. Galerie van de zaak en eerdere events

Zelf gebouwd in moderne code (geen WordPress-plugin-soep), eigen admin voor wijzigingen, laadtijd <1 seconde.

Vaste prijs vanaf de Starter-formule. Geen maandelijkse "service-factuur" voor niets.

Studio-vm.be — websites voor zelfstandigen en KMO's in Vlaanderen.`,
      hashtags: "",
      site: "cottage-waregem.vercel.app",
    }),
  },

  // ============================================================================
  // CASE-STUDY — LinkedIn deep-dives (1 per sector, 5 stuks)
  // ============================================================================
  {
    id: "case-marilines-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2],
    category: "case-study",
    build: () => ({
      title: "Case — B2B-site voor Mari-Lines",
      body: `Case: B2B-website voor een wegmarkeringen-bedrijf in Vlaanderen.

🔹 Klant: Mari-Lines (mari-lines.be)
🔹 Sector: wegmarkeringen — B2B (aannemers, bouwheren, gemeentes)
🔹 Doel: prospects laten zien wat ze realiseerden + offertes structureren

Wat zit erin?
→ Werkenoverzicht met échte uitgevoerde projecten (geen stockfoto's)
→ Offerte-aanvraag specifiek voor bouwheren — vragenset afgestemd op project-type
→ Eigen admin-paneel: nieuwe werven toevoegen in 5 minuten
→ Mobile-first design — hun klanten kijken vanaf de werf, niet vanaf desk

Resultaten:
• PageSpeed 97/100 mobiel
• Laadtijd 0.9s
• Vaste prijs vooraf — geen scope-creep-facturen
• Opgeleverd in 3 weken

B2B-sites krijgen vaak een "info-folder"-behandeling. Dat is een gemiste kans — zelfs in technische sectoren beslist een prospect binnen 5 seconden of jouw site vertrouwen wekt.

Studio-vm.be — webstudio Anzegem, voor KMO's in Vlaanderen.`,
      hashtags:
        "#b2b #website #kmo #vlaanderen #wegmarkering #digitalisering",
      site: "mari-lines.be",
    }),
  },
  {
    id: "case-celine-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3],
    category: "case-study",
    build: () => ({
      title: "Case — webshop + offerte-flow voor interieurzaak",
      body: `Case: e-commerce + offerte-flow voor een interieurzaak.

🔹 Klant: Céline Interieur (celineinterieur.com)
🔹 Sector: interieur (B2C, regionaal)
🔹 Doel: webshop voor producten + structurele offerte-aanvragen voor maatwerk

Twee verkoopsporen in één site:
→ Webshop met productcatalogus, voorraad, Mollie-checkout
→ Offerte-aanvraag-flow voor maatwerk (afmetingen, stijl, budget)
→ Eigen admin-paneel: ze beheert producten, prijzen, foto's en lopende offertes zelf

Technische kenmerken:
• PageSpeed 98/100 op mobiel
• Laadtijd <1 seconde
• Foto's automatisch geoptimaliseerd (1 product = 1 upload, niet 1 product = 6 formaten)
• Geen externe plugin-tickets, geen WordPress-updatestress

Vaste prijs vooraf, opgeleverd in 3 weken. Onderhoud klant zelf — hosting <€10/maand bij de provider naar keuze.

Studio-vm.be — websites voor zelfstandigen en KMO's in Vlaanderen.`,
      hashtags: "#ecommerce #interieur #kmo #website #vlaanderen",
      site: "celineinterieur.com",
    }),
  },
  {
    id: "case-jp-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "case-study",
    build: () => ({
      title: "Case — galerie + boekverkoop voor wildlife-fotograaf",
      body: `Case: portfolio + e-commerce voor wildlife-fotografie.

🔹 Klant: Jean-Paul Montreuil (montreuil.be)
🔹 Sector: wildlife-fotografie (B2C, internationaal)
🔹 Doel: galerie laten ademen + boekverkoop + tentoonstellingen-agenda

Voor een fotograaf draait alles om hoe de foto's getoond worden. Daarom:
→ Galerie met grote responsive beelden + lichte transitions
→ Vooraf geoptimaliseerde foto's (geen 8MB-bestanden)
→ Lazy-loading per scroll-stap
→ Boekverkoop direct via de site (Mollie + verzendmodule)
→ Eigen agenda voor tentoonstellingen die hij zelf bijhoudt

Resultaten:
• PageSpeed 96/100 mobiel ondanks zware foto-content
• Laadtijd 0.7s op de homepage
• Foto's blijven scherp op alle schermen (1×/2×/3× density)

Voor creatieven die hun werk online willen tonen — vraag NIET aan een WordPress-bouwer om dit te doen. Vraag aan iemand die snapt hoe images werken in moderne browsers.

Studio-vm.be — geen WordPress, geen plugin-stress, eigen admin.`,
      hashtags: "#fotografie #portfolio #kunstenaar #website #ecommerce",
      site: "montreuil.be",
    }),
  },
  {
    id: "case-barbotte-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3],
    category: "case-study",
    build: () => ({
      title: "Case — horeca-site met reservatie-module",
      body: `Case: restaurant-website met reservaties en dagsuggesties.

🔹 Klant: Bar'Botte Waregem (barbotte.vercel.app)
🔹 Sector: horeca (B2C, regionaal)
🔹 Doel: bezoekers zonder telefoongesprek tot een reservatie krijgen

Horeca-sites zien er vaak uit als folders uit 2014. Dat is een gemiste kans:
→ 70%+ van horeca-zoekopdrachten gebeurt op mobiel
→ De gemiddelde bezoeker neemt binnen 5 seconden de beslissing om te reserveren of weg te klikken
→ Reservatie-friction = direct verloren omzet

Wat we deden:
• Menu's + dagsuggesties beheren via eigen admin (geen Photoshop-pdf-handwerk meer)
• Reservatie rechtstreeks op de site — geen externe widget die het design verkracht
• Foto's automatisch geoptimaliseerd (niet 5MB per bord)
• Laadtijd <1s op mobiel

Vaste prijs vanaf de Starter-formule. Opgeleverd in 3 weken. Geen externe abonnementen voor het "reservatie-systeem".

Studio-vm.be — websites voor zelfstandigen en KMO's in Vlaanderen.`,
      hashtags: "#horeca #website #vlaanderen #reservatie #kmo",
      site: "barbotte.vercel.app",
    }),
  },
  {
    id: "case-cottage-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1],
    category: "case-study",
    build: () => ({
      title: "Case — restaurant + eventruimte in één site",
      body: `Case: brasserie met eventruimte — twee diensten, één site.

🔹 Klant: Cottage Waregem (cottage-waregem.vercel.app)
🔹 Sector: horeca + events (B2C + B2B)
🔹 Doel: bezoekers naar restaurant OF eventruimte sturen zonder ze te verwarren

Uitdaging: een klant zoekt soms een restaurant, soms een eventruimte. Dezelfde site moet beide doelen scherp bedienen — niet half-half.

Oplossing:
→ Twee duidelijke landing-paths vanaf de homepage
→ Restaurant-flow: menu's + dagsuggesties + reserveren
→ Event-flow: aanvraagformulier met type event, aantal personen, gewenste datum
→ Galerie laat beide werelden zien
→ Eigen admin: ze beheren alles zelf

Resultaten:
• PageSpeed 95/100 mobiel
• Laadtijd onder de seconde
• Vaste prijs vooraf, opgeleverd in 4 weken (één extra week vs standaard wegens dubbele flow)

Studio-vm.be — geen WordPress, geen externe widgets, eigen admin.`,
      hashtags: "#horeca #events #website #waregem #kmo",
      site: "cottage-waregem.vercel.app",
    }),
  },

  // ============================================================================
  // SERVICE-UITLEG — wat je biedt (3 stuks)
  // ============================================================================
  {
    id: "service-healthcheck-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [2, 5],
    category: "service",
    build: () => ({
      title: "Service — Health Check €99",
      body: `Studio-vm Health Check — voor wie eerst wil weten of hun site echt een probleem heeft, vóór ze investeren in iets nieuws.

€99, eenmalig, geen abonnement.

Wat je krijgt:
✓ Volledige scan van je site (snelheid, SEO, security, mobile, accessibility)
✓ Rapport van 5 paginas met concrete bevindingen
✓ Top 3 fixes die het meeste verschil maken — uitgelegd zodat je bouwer ze meteen kan toepassen
✓ Vergelijking met je belangrijkste concurrent

Wie heeft hier baat bij?
→ Zelfstandige die voelt dat de site "iets niet doet" maar niet weet wat
→ KMO die jaarlijks €1.000+ aan onderhoud betaalt en wil weten of dat terecht is
→ Bouwers die een second opinion willen op iemand anders' werk

Studio-vm.be → Health Check.`,
      hashtags: "",
    }),
  },
  {
    id: "service-migration-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "service",
    build: () => ({
      title: "Service — WordPress-migratie",
      body: `Veel KMO-sites in Vlaanderen draaien op WordPress + 23 plugins + €840/jaar "onderhoud" — en de eigenaar durft het dashboard niet meer openen.

Klinkt herkenbaar? Tijd om te migreren.

Wat een migratie bij studio-vm betekent:
→ Volledige content overzetten (teksten, foto's, structuur, SEO-links blijven werken)
→ Nieuwe site in moderne code — geen plugins meer
→ Eigen admin-paneel — alleen wat jij gebruikt, niet 50 menu's die niets doen
→ Hosting verhuist naar moderne provider — €5-10/maand ipv €70+
→ Geen "service-abonnement" — eenmalige vaste prijs voor de migratie zelf

Resultaat: site die 5× sneller laadt, lager maandelijks kost, en die je zelf durft aanpassen.

Zit jij vast in WordPress? Studio-vm.be → contact voor een gratis migratie-quote.`,
      hashtags: "",
    }),
  },
  {
    id: "service-admin-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3],
    category: "service",
    build: () => ({
      title: "Service — eigen admin-paneel uitgelegd",
      body: `Standaard bij élke site die ik bouw: een eigen admin-paneel.

Waarom standard, niet "extra-optie"?

Omdat een site zonder admin = een klant die gegijzeld is door zijn bouwer. Elke spelfout, elke nieuwe prijs, elke gewijzigde openingsuur = ticket, wachttijd, factuur.

Een admin-paneel bij mij is anders dan een WordPress-dashboard:
→ Alleen wat jouw site nodig heeft (niet 50 menu's die niets doen)
→ Eén pagina per type content (menu's, producten, foto's, prijzen)
→ Mobiel bruikbaar — je past dingen aan vanop je telefoon
→ Geen plugin-updates die het kunnen breken

Bij oplevering: halfuurtje training, daarna doe je 't zelf. Vragen blijven gratis — maar de meeste klanten hebben er na 2 weken geen meer.

Studio-vm.be — websites met admin die je écht gebruikt.`,
      hashtags: "#cms #kmo #websitebeheer #digitalisering #vlaanderen",
    }),
  },

  // ============================================================================
  // POSITIONERING — waar je voor staat (3 stuks)
  // ============================================================================
  {
    id: "positie-wp-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [1],
    category: "positie",
    build: () => ({
      title: "Positie — WP-economie kritisch bekeken",
      body: `Eerlijke observatie na 2 jaar overnames van WordPress-sites voor KMO-klanten:

De gemiddelde WordPress-site die ik overneem heeft:
→ 23 plugins, waarvan de klant er 4 actief gebruikt
→ €840/jaar aan "hosting + onderhoud" — terwijl de échte hosting €60/jaar is
→ Laadtijd 4-7 seconden op mobiel
→ Een dashboard waar de klant niet aan durft komen uit angst iets stuk te maken

Dat is geen kritiek op WordPress als technologie. Het is kritiek op het ecosysteem dat eromheen ontstaan is — bureaus die klanten in maandkost-abonnementen lokken voor onderhoud dat ze nooit zien.

Mijn alternatief: statisch gegenereerde sites op moderne infrastructuur.
✓ Laadtijd <1 seconde
✓ Hosting <€10/maand (klant betaalt direct, ik krijg geen commissie)
✓ Geen plugins die om aandacht vragen
✓ Eigen mini-admin alleen voor wat jouw site nodig heeft

Vraag jezelf: wat betaal jij maandelijks, en wat krijg je er concreet voor?`,
      hashtags: "#wordpress #kmo #hosting #digitalisering #vlaanderen",
    }),
  },
  {
    id: "positie-prijs-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3],
    category: "positie",
    build: () => ({
      title: "Positie — vaste prijs vooraf",
      body: `Eén ding dat ik anders doe dan veel collega-bureaus: vaste prijs vooraf.

Geen "vanaf €X" met asterisks. Geen "scope-creep"-facturen achteraf. Geen "ja maar als je dit nog wil..."-discussies.

Hoe werkt het?
1. Eerste gesprek (gratis, 30 min) — wat doet je bedrijf, wat moet je site doen
2. Ik stuur een concrete prijs voor wat we afspraken — vanaf de Starter-formule
3. Je tekent of niet
4. Bij ja: ik bouw, je betaalt op oplevering. Geen voorschotten van 50%.

Wat ik niet doe:
✗ Uurfacturen (je weet niet wat je krijgt)
✗ "Onderhoudscontract" verplicht (€100/maand voor niets)
✗ Extra "SEO-pakket" verkopen (goede sites doen SEO standaard goed)

Studio-vm.be — vaste prijs, vaste oplevering, geen verrassingen.`,
      hashtags: "",
    }),
  },
  {
    id: "positie-snelheid-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [4],
    category: "positie",
    build: () => ({
      title: "Positie — waarom snelheid niet onderhandelbaar is",
      body: `Drie cijfers uit onderzoek van Google + Akamai die élke ondernemer zou moeten kennen:

📊 Bezoekers haken af bij trage sites:
• 3 seconden laadtijd → 32% bouncerate
• 5 seconden → 90% bouncerate

📊 1 seconde extra laadtijd = 7% minder conversie (Akamai)

📊 Sites die in <2s laden krijgen 70% meer pageviews per sessie

Wat doet de gemiddelde KMO-site in België? 4-7 seconden op mobiel. Dat is geen kleine inefficiëntie — dat is geld dat je elke dag verliest.

Voor mijn klanten zit ik gemiddeld op 0.8 seconden. Geen toeval, wel bewust gebouwd:
→ Geen WordPress + 30 plugins
→ Afbeeldingen vooraf geoptimaliseerd
→ Hosting op CDN, niet bij goedkope shared-host
→ Geen tracking-soep van vorige agencies

Test je eigen site: pagespeed.web.dev — typ je URL — mobiele score onder 70 betekent: tijd voor actie.

Studio-vm.be — websites die laden vóór je bezoeker afhaakt.`,
      hashtags: "#websnelheid #seo #kmo #digitalisering #conversie",
    }),
  },

  // ============================================================================
  // PERSOONLIJK — tone-of-voice (3 stuks)
  // ============================================================================
  {
    id: "persoonlijk-vraag-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [5],
    category: "question",
    build: () => ({
      title: "Persoonlijk — vraag aan netwerk vrijdag",
      body: `Vrijdag-vraagje aan m'n netwerk:

Ken jij een zelfstandige of KMO in Vlaanderen die:
→ een nieuwe site nodig heeft?
→ of vastzit met een trage/lelijke/onbeheerbare site?
→ of te veel betaalt voor hosting + "onderhoud" dat niets oplevert?

Tag ze in de comments of stuur een DM. Eén verwijzing van jou kan iemand maandelijks honderden euro's besparen — én een veel betere site geven.

Studio-vm.be — persoonlijk, vaste prijs, eigen admin-paneel, laadtijd onder 1 seconde. Geen verkoop-funnel, gewoon werk.

Bedankt op voorhand. De meeste van mijn opdrachten komen via een doorverwijzing.`,
      hashtags: "",
    }),
  },
  {
    id: "persoonlijk-thanks-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "question",
    build: () => ({
      title: "Persoonlijk — dankjewel-post",
      body: `Soms goed om het hardop te zeggen:

Studio-vm bestaat dankzij familie en vrienden die als eersten "ja" zeiden. Mijn zus Céline. Mijn vader. Een paar oud-collega's. Vrienden die mij doorverwezen.

Elke site die ik tegenwoordig bouw is — direct of indirect — het gevolg van iemand die zei "Vincent doet dat, contacteer 'm eens."

Dus: dank u. Voor iedereen die ooit een doorverwijzing deed, een DM beantwoordde, een testimonial schreef, of gewoon op een post een like gaf.

Als je iemand kent die een website nodig heeft of vastzit met de huidige — laat 't weten. Eén tag, één DM, één doorgestuurde URL. Zo blijft dit groeien.

Studio-vm.be — persoonlijk, in Anzegem, voor heel Vlaanderen.`,
      hashtags: "",
    }),
  },
  {
    id: "persoonlijk-eigen-site-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 3],
    category: "showcase",
    build: () => ({
      title: "Eigen site studio-vm.be",
      body: `Een eerlijk principe dat ik mezelf opleg: mijn eigen site moet doen wat ik aan klanten predik.

Resultaat: studio-vm.be

→ Laadt in 0.6 seconden op mobiel
→ PageSpeed 100/100 (alle categorieën)
→ Eigen admin-paneel waarmee ik alles aanpas zonder code aan te raken
→ Hosting? €8/maand
→ Onderhoud? Geen abonnement, geen factuur, geen ticket

Als ik dit voor mezelf doe, doe ik het ook voor jou.

Wil je weten hoe jouw site scoort tegen deze? pagespeed.web.dev → typ je URL — kijk eerlijk naar de score.`,
      hashtags: "",
      site: "studio-vm.be",
    }),
  },

  // ============================================================================
  // BONUS — favesan migratie-tease (1 stuk)
  // ============================================================================
  {
    id: "service-favesan-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "service",
    build: () => ({
      title: "favesan migratie-tease",
      body: `Klein "behind the scenes":

favesan.be — een van de sites die nog op WordPress + one.com draait, en op de roadmap staat om gemigreerd te worden naar mijn moderne stack.

Wat zegt dat over WordPress-economie?
• Huidige hosting + onderhoud bij one.com: gemiddeld €15-25/maand
• Site laadt traag, achterkant is een dashboard-jungle
• Updates worden uitgesteld uit angst dat plugins breken

Na migratie:
✓ Eigen mini-admin (alleen wat de site nodig heeft)
✓ Hosting elders voor <€10/maand
✓ Laadtijd onder 1 seconde
✓ Eenmalige vaste migratieprijs, daarna geen abonnementsval meer

Zit jij ook in een one.com / WordPress / Wix-fuik? Studio-vm.be → migratiequote.`,
      hashtags: "",
      site: "favesan.be",
    }),
  },

  // ---------- 2. FB persoonlijk — site-speed tip ----------
  {
    id: "fb-tip-pagespeed",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [3], // woensdag
    category: "tip",
    build: ({ dayName }) => ({
      title: `Tip — pagespeed test (${dayName})`,
      body: `Snelle ${dayName}ochtend-tip voor zelfstandigen:

Ga naar pagespeed.web.dev → typ jouw website-URL in → kijk naar je mobiele score.

Onder 70? Je verliest Google-bezoekers — die ranking-factor is reëel sinds Core Web Vitals (2021).

De drie meest voorkomende oorzaken die ik tegenkom bij overnames:
1️⃣ Onverkleinde foto's (3 MB ipv 80 KB)
2️⃣ Tien tracking-scripts die elk een halve seconde kosten
3️⃣ WordPress-thema's met 47 plugins waar je 6 van gebruikt

Een goede site doet 90+ op mobiel. Mijn klanten zitten allemaal boven 95.

Wil je weten of jouw site OK is? Health Check voor €99 — ik scan, schrijf 't rapport, en geef je 3 concrete fixes. Geen abonnement, eenmalig.`,
      hashtags: "",
    }),
  },

  // ---------- 3. FB persoonlijk — admin-paneel-voordeel ----------
  {
    id: "fb-tip-admin",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 5], // maandag of vrijdag
    category: "tip",
    build: ({ client }) => ({
      title: "Tip — admin-paneel hoort standaard",
      body: `"Ik moet bellen om een tekst aan te passen."

Hoor ik te vaak. En het hoort niet zo.

Élke site die ik bouw krijgt een eigen admin-paneel — dezelfde technologie die ik voor mijn eigen studio-vm.be gebruik. Klanten passen teksten, foto's, prijzen, openingsuren zelf aan. Geen ticket, geen wachttijd, geen extra factuur.

Voor ${client.name} (${client.site}) → eigen admin met ${client.sector === "horeca" ? "menu's, dag-suggesties en reservaties" : client.sector === "interieur" ? "producten, prijzen en offerte-aanvragen" : "alles wat ze willen tonen"} die ze in een minuut kunnen wijzigen.

Dat is geen luxe — dat is gewoon zoals 't moet.

Als jouw huidige webbouwer je een uurtje aanrekent voor een spelfout, ben je gegijzeld. Kijk eens of er geen alternatief is.`,
      hashtags: "",
    }),
  },

  // ---------- 4. FB persoonlijk — vraag aan netwerk ----------
  {
    id: "fb-question-network",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [5], // vrijdag
    category: "question",
    build: () => ({
      title: "Vraag aan netwerk — vrijdag",
      body: `Vrijdag-vraagje aan m'n netwerk:

Ken jij een zelfstandige of KMO in Vlaanderen die:
→ een nieuwe site nodig heeft?
→ of vastzit met een trage/lelijke/onbeheerbare site?
→ of gewoon te veel betaalt voor hosting + "onderhoud"?

Tag ze in de comments of stuur een DM. Eén verwijzing van jou kan iemand maandelijks honderden euro's besparen.

Studio-vm.be — persoonlijk, vaste prijs, eigen admin-paneel, laadtijd onder 1 seconde. Geen verkoopspraat, gewoon werk.

Bedankt op voorhand — de meeste van mijn opdrachten komen zo via een doorverwijzing.`,
      hashtags: "",
    }),
  },

  // ---------- 5. FB persoonlijk — case-story Bar'Botte/horeca ----------
  {
    id: "fb-case-horeca",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2, 3], // di/woe
    category: "case-study",
    build: () => ({
      title: "Case — horeca-sites",
      body: `Twee horeca-sites die ik dit jaar live zette:

→ Bar'Botte Waregem (barbotte.vercel.app) — bar/bistro met dagsuggesties en reservatiemodule
→ Cottage Waregem (cottage-waregem.vercel.app) — restaurant met menu's en eventruimte

Beide vorige sites waren op WordPress + traag + niemand in huis kon ze aanpassen.

Nieuwe sites:
✓ Onder 1s laadtijd op mobiel
✓ Eigen admin om menu's & dagsuggesties zelf te wisselen
✓ Reserveren rechtstreeks op de site
✓ Foto's optimaal en automatisch verkleind

Vaste prijs. Klaar in 3 weken.

Horeca-zaak in West-/Oost-Vlaanderen die met haar website worstelt? Stuur een DM, of doe eerst de gratis scan op studio-vm.be om te zien hoe je huidige site scoort.`,
      hashtags: "",
    }),
  },

  // ============================================================================
  // LinkedIn templates — meer professional, langere vorm
  // ============================================================================

  // ---------- 6. LinkedIn — story/observation ----------
  {
    id: "li-story-2years",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2], // dinsdag (peak LI day)
    category: "story",
    build: () => ({
      title: "LinkedIn — 2 jaar observation",
      body: `Wat ik in 2 jaar websites-bouwen voor KMO's in Vlaanderen geleerd heb:

→ Snelheid is geen luxe meer. Google's Core Web Vitals straffen trage sites af in de zoekresultaten. Mijn klanten laden in ~0.8 seconden — versus 4-6 seconden bij de gemiddelde KMO-site. Dat verschil is letterlijk meetbaar in organisch verkeer.

→ Onderhoud hoort niet maandelijks geld te kosten. Een statische site op moderne infrastructuur draait voor minder dan €10/maand. Wie je €100+/maand vraagt zonder dat er iets gebeurt, melkt je.

→ Klanten moeten zelf hun inhoud kunnen wijzigen. Elke site die ik bouw heeft een eigen admin-paneel. Geen ticket meer naar de bouwer voor een spelfout.

→ Vaste prijs is moedig, maar correct. Ik werk niet op uurbasis. Je krijgt een prijs voor wat je krijgt — geen verrassingen achteraf.

Studio-vm.be is mijn webstudio in Anzegem. Geen tussenpersonen, geen WordPress-bouwpakket, geen sales-funnel.

Wie heeft een KMO of zelfstandige in z'n netwerk die met website-frustratie zit?`,
      hashtags:
        "#websiteontwikkeling #kmo #vlaanderen #digitalisering #zelfstandige",
    }),
  },

  // ---------- 7. LinkedIn — tip/educational ----------
  {
    id: "li-tip-corewebvitals",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [3], // woensdag
    category: "tip",
    build: () => ({
      title: "LinkedIn — Core Web Vitals uitgelegd",
      body: `"Wat zijn Core Web Vitals en moet ik me daar als KMO druk over maken?"

Korte versie: ja.

Google meet sinds 2021 drie performance-cijfers op elke site:
• LCP (Largest Contentful Paint) — hoe snel de hoofdinhoud zichtbaar is
• INP (Interaction to Next Paint) — hoe snel je site reageert op een klik
• CLS (Cumulative Layout Shift) — hoeveel je layout "springt" tijdens laden

Site die hier slecht op scoort = lager in zoekresultaten = minder organisch verkeer = minder leads.

Gratis check: pagespeed.web.dev → typ je URL in → mobiele score onder 70 = je hebt werk.

Voor mijn klanten zit ik systematisch boven 95. Dat is geen toeval — dat is bewust gebouwd zonder WordPress-overhead, met afbeeldingen geoptimaliseerd, en zonder 12 trackers van vroegere agencies.

Wil je weten waar jij staat? Studio-vm Health Check voor €99 — concreet rapport + 3 fixes die het verschil maken.`,
      hashtags: "#corewebvitals #seo #kmo #webperformance #digitalisering",
    }),
  },

  // ---------- 8. LinkedIn — case-study showcase ----------
  {
    id: "li-case-showcase",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4], // donderdag
    category: "case-study",
    build: ({ client, altClient }) => ({
      title: `LinkedIn — case ${client.name}`,
      body: `Twee recente projecten die ik zelf opleverde:

🔹 ${client.name} → ${client.site}
   Sector: ${client.sector}
   Stack: zelf gebouwd in moderne code, eigen admin-paneel
   Laadtijd: < 1 seconde
   Onderhoud: < €10/maand

🔹 ${altClient.name} → ${altClient.site}
   Sector: ${altClient.sector}
   Vergelijkbaar setup — vaste prijs, oplevering in weken, niet maanden

Wat verschilt mijn aanpak van een typisch web-bureau?

1. Geen WordPress-bouwpakket. Ik bouw vanaf nul in code die ik volledig begrijp.
2. Klanten krijgen geen "WordPress-dashboard met 50 plugins" — wel een minimalistisch admin-paneel speciaal voor hen.
3. Vaste prijs vooraf. Geen "scope-creep"-facturen.
4. Persoonlijk contact: jij praat met wie de site bouwt. Geen account-manager als tussenstap.

Ik werk vanuit Anzegem en bedien KMO's in Vlaanderen. Wie zit met een website-vraag in z'n netwerk?`,
      hashtags: "#kmo #vlaanderen #website #waregem #ondernemen",
    }),
  },

  // ---------- 9. LinkedIn — industry observation ----------
  {
    id: "li-observation-wp",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [1], // maandag
    category: "tip",
    build: () => ({
      title: "LinkedIn — WP-economie observation",
      body: `Eerlijke observatie uit 2 jaar overnames van WordPress-sites voor KMO-klanten:

De gemiddelde WordPress-site die ik overneem heeft:
→ 23 plugins, waarvan de klant er 4 actief gebruikt
→ €840/jaar aan "hosting + onderhoud" voor wat in realiteit €60/jaar moet kosten
→ Laadtijd 4-7 seconden (mobiel)
→ Een dashboard waar de klant niet aan durft komen uit angst iets stuk te maken

Dat is geen kritiek op WordPress als technologie — het is wel kritiek op het ecosysteem dat eromheen ontstaan is: bureaus die klanten in maandkost-abonnementen lokken voor onderhoud dat ze nooit zien.

Mijn alternatief voor KMO's: statisch gegenereerde sites op moderne infrastructuur. Resultaat:
✓ Laadtijd < 1 seconde
✓ Hosting < €10/maand (klant betaalt direct, ik krijg geen commissie)
✓ Geen plugins die op je dashboard om aandacht vragen
✓ Eigen mini-admin alleen voor wat jouw site nodig heeft

Vraag jezelf eens af wat je vandaag maandelijks betaalt — en wat je daarvoor in de plaats krijgt.`,
      hashtags: "#wordpress #kmo #websitehosting #digitalisering #vlaanderen",
    }),
  },

  // ---------- 10. LinkedIn — process / behind-scenes ----------
  {
    id: "li-process",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3, 5],
    category: "story",
    build: () => ({
      title: "LinkedIn — hoe een project loopt",
      body: `Hoe een typisch project bij studio-vm loopt — voor wie nieuwsgierig is:

Week 0 — Eerste gesprek (30 min, gratis)
We bespreken: wat doet je bedrijf, voor wie, en wat moet je site doen? Geen sales-funnel.

Week 1 — Concept + ontwerp
Ik stuur je 2-3 ontwerprichtingen. Je kiest, we verfijnen.

Week 2 — Bouw
Ik bouw de site. Je krijgt elke dag een preview-link.

Week 3 — Admin-training + content
Ik zet samen met jou alle teksten/foto's/prijzen erin. Daarna krijg jij toegang tot het admin-paneel — een halfuurtje training en je doet 't zelf.

Week 3 of 4 — Live
Domein omschakelen, e-mail-check, Google Analytics aanzetten, klaar.

Wat ik niet doe:
× Geen "scope-creep"-facturen achteraf
× Geen "onderhoudscontract" van €100/maand voor niks
× Geen verkoop van extra "SEO-pakketten" die niets doen

Vaste prijs. Concreet werk. Wie wil starten? DM of via studio-vm.be.`,
      hashtags: "#projectmanagement #kmo #websiteproject #waregem #ondernemen",
    }),
  },

  // ---------- 11. FB persoonlijk — milestone/personal ----------
  {
    id: "fb-personal-thanks",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [5],
    category: "story",
    build: () => ({
      title: "FB — persoonlijke noot",
      body: `Soms is 't goed om dit hardop te zeggen:

Studio-vm bestaat dankzij familie en vrienden die als eersten "ja" zeiden. Mijn zus Céline. Mijn vader. Een paar oud-collega's. Vrienden die mij doorverwezen.

Elke site die ik tegenwoordig bouw is — direct of indirect — het gevolg van iemand die ergens zei "Vincent doet dat, contacteer 'm eens."

Dus: dank u. Voor iedereen die ooit een doorverwijzing deed, een DM beantwoordde, een testimonial schreef, of gewoon op een post een like gaf.

Als je iemand kent die een website nodig heeft of vastzit met de huidige — laat 't weten. Eén tag, één DM, één doorgestuurde URL. Dat is hoe dit blijft groeien.

Studio-vm.be — persoonlijk, in Anzegem, voor heel Vlaanderen.`,
      hashtags: "",
    }),
  },

  // ---------- 12. LinkedIn — concrete numbers / proof ----------
  {
    id: "li-numbers-2026",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "tip",
    build: () => ({
      title: "LinkedIn — concrete cijfers",
      body: `Voor wie nog twijfelt of "snelle site" écht een verschil maakt — drie cijfers uit Google's eigen onderzoek:

📊 Bezoekers haken af bij 3+ seconden laadtijd:
• 3s → 32% bouncerate
• 5s → 90% bouncerate

📊 1 seconde extra laadtijd = 7% minder conversie (Akamai)

📊 Sites die in <2s laden krijgen 70% meer pageviews per sessie

Wat doet de gemiddelde KMO-site in België? 4-7 seconden op mobiel. Dat is geen kleine inefficiëntie — dat is geld dat je elke dag verliest.

Voor mijn klanten zit ik op 0.8 seconden gemiddeld. Geen toeval, wel bewust gebouwd:
→ Geen WordPress + 30 plugins
→ Afbeeldingen vooraf geoptimaliseerd
→ Hosting op CDN (geen shared-hosting bij goedkope BE-provider)

Dat is geen "extra service" — dat hoort gewoon standaard te zijn.

Test je site: pagespeed.web.dev. Bel mij niet — kijk eerst zelf naar de score.`,
      hashtags: "#websnelheid #seo #kmo #digitalisering #conversie",
    }),
  },

  // ---------- 13. FB groep — generic value-first ----------
  {
    id: "fb-group-tips",
    platform: "facebook",
    post_kind: "group",
    target_url: "/nl/health-check",
    days: [2, 4],
    category: "tip",
    build: () => ({
      title: "FB groep — 3 tips voor zelfstandigen",
      body: `Vraag aan de zelfstandigen hier — hoeveel betaal je per maand voor je website?

Drie problemen die ik het vaakst tegenkom bij overnames:

1️⃣ Site laadt 4-8 seconden op mobiel. Google straft dit af, bezoekers haken af. Goede sites doen <1.5s. Test op pagespeed.web.dev.

2️⃣ "Ik moet bellen om een tekst te wijzigen." Geen eigen admin-paneel = je bent gegijzeld door je webbouwer.

3️⃣ €50-150/maand voor "hosting + onderhoud" terwijl de échte hosting €5/maand kost. Verschil = pure marge voor 't bureau.

Geen verkooppraatje hier — doe gewoon die pagespeed-test en kijk wat je betaalt versus krijgt.

Wie zit met vragen? Comments staan open.

— Vincent (studio-vm.be — webstudio Anzegem)`,
      hashtags: "",
    }),
  },

  // ---------- 14. LinkedIn — micro-tip (kort) ----------
  {
    id: "li-microtip",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 3, 5],
    category: "tip",
    build: () => ({
      title: "LinkedIn — korte micro-tip",
      body: `KMO-tip in 30 seconden gelezen:

Als je vandaag een offerte krijgt voor een nieuwe website, vraag deze 3 dingen vóór je tekent:

1. "Krijg ik een eigen admin-paneel waarmee ik zelf teksten/foto's/prijzen kan aanpassen?"
2. "Wat is de maandelijkse kost en wat krijg ik daarvoor in ruil?"
3. "Wie is technisch eigenaar van de site — ik of jullie?"

Drie ja's = je kan vooruit.
Eén "ja maar…" = onderhandel of zoek verder.

Bij studio-vm zijn alle drie antwoorden standaard ja.`,
      hashtags: "#websiteoffer #kmo #ondernemerstips",
    }),
  },

  // ---------- 15. FB persoonlijk — direct CTA ----------
  {
    id: "fb-cta-direct",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [4],
    category: "tip",
    build: () => ({
      title: "FB — direct CTA Health Check",
      body: `Snelle vraag — is jouw site:
□ Sneller dan 2 seconden op mobiel?
□ Aanpasbaar door jezelf (zonder bouwer te bellen)?
□ Kost minder dan €30/maand om te draaien?

Drie vinkjes? Top, ga zo door.

Géén drie vinkjes? Tijd voor een Health Check (€99): ik scan je site, schrijf een rapport van 5 paginas met 3 concrete fixes, en je weet exact waar je staat. Geen abonnement, geen vervolgcontract.

studio-vm.be → Health Check.

Voor wie eerst gratis wil testen: pagespeed.web.dev geeft je in 30 seconden je score.`,
      hashtags: "",
    }),
  },
];

// Hulp — kies n niet-recent-gebruikte templates voor een dag.
export function pickTemplatesForDay(
  dayOfWeek: number, // 1=ma, 5=vr
  recentIds: string[],
  n: number,
): Template[] {
  const recent = new Set(recentIds);
  // 1. Filter templates die deze dag mogen + niet recent zijn
  let candidates = TEMPLATES.filter(
    (t) => (!t.days || t.days.includes(dayOfWeek)) && !recent.has(t.id),
  );
  // 2. Als er te weinig zijn, neem ook templates buiten dag-restrictie
  if (candidates.length < n) {
    candidates = TEMPLATES.filter((t) => !recent.has(t.id));
  }
  // 3. Mix per platform: probeer 50/50 verdeling tussen FB en LinkedIn
  const fb = candidates.filter((t) => t.platform === "facebook");
  const li = candidates.filter((t) => t.platform === "linkedin");
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const fbShuf = shuffle(fb);
  const liShuf = shuffle(li);
  const out: Template[] = [];
  let fi = 0;
  let li2 = 0;
  for (let i = 0; i < n; i++) {
    // Alterneren — bij voorkeur FB-FB-LI of FB-LI-FB
    const pickFb = i === 0 || i === 2;
    if (pickFb && fi < fbShuf.length) out.push(fbShuf[fi++]);
    else if (li2 < liShuf.length) out.push(liShuf[li2++]);
    else if (fi < fbShuf.length) out.push(fbShuf[fi++]);
  }
  return out;
}

// Hulp — kies 2 verschillende klanten uit PORTFOLIO voor variatie binnen 1 dag.
export function pickClients(): {
  client: TemplateCtx["client"];
  altClient: TemplateCtx["altClient"];
} {
  const shuffled = [...PORTFOLIO].sort(() => Math.random() - 0.5);
  return {
    client: shuffled[0]!,
    altClient: shuffled[1]!,
  };
}

// Hulp — kies de story-case voor vandaag (één per werkdag).
// Vrijdag alterneert: even weken → Bar'Botte, oneven → Cottage.
export function pickStoryCaseForDay(
  dayOfWeek: number, // 1=ma, 5=vr
  weekNumber: number = 0,
): Template | null {
  const candidates = STORY_CASE_TEMPLATES.filter((t) =>
    t.days?.includes(dayOfWeek),
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;
  // Vrijdag: alterneren tussen Bar'Botte (even) en Cottage (oneven)
  return weekNumber % 2 === 0 ? candidates[0]! : candidates[1]!;
}
