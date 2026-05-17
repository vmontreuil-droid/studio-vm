// Inhoud-assistentie & template-engine voor de builder.
//
// In plaats van honderd losse template-bestanden combineren we
// sector × toon × gekozen pagina's. Dat levert in de praktijk
// honderden samenhangende startsites op, telkens met voorbeeld-
// teksten die de klant enkel nog moet bijschaven. Niet-destructief
// bij "lege velden vullen"; "volledige site" vervangt de pagina's.

export type SectorKey =
  | "restaurant"
  | "salon"
  | "retail"
  | "services"
  | "creative"
  | "photography"
  | "construction"
  | "health"
  | "consulting"
  | "fitness"
  | "realestate"
  | "automotive";

type Loc = "nl" | "fr" | "en";
export type Tone = "warm" | "zakelijk" | "speels";

export type PageKey =
  | "home"
  | "about"
  | "offer"
  | "gallery"
  | "pricing"
  | "contact";

export const SECTOR_LABELS: Record<Loc, Record<SectorKey, string>> = {
  nl: {
    restaurant: "Restaurant / horeca",
    salon: "Kapper / schoonheid",
    retail: "Winkel / retail",
    services: "Dienstverlener / KMO",
    creative: "Creatief / studio",
    photography: "Fotograaf / video",
    construction: "Bouw / renovatie",
    health: "Zorg / praktijk",
    consulting: "Consultant / advies",
    fitness: "Sport / coaching",
    realestate: "Vastgoed / immo",
    automotive: "Auto / garage",
  },
  fr: {
    restaurant: "Restaurant / horeca",
    salon: "Coiffeur / beauté",
    retail: "Boutique / retail",
    services: "Prestataire / PME",
    creative: "Créatif / studio",
    photography: "Photographe / vidéo",
    construction: "Construction / rénovation",
    health: "Santé / cabinet",
    consulting: "Consultant / conseil",
    fitness: "Sport / coaching",
    realestate: "Immobilier",
    automotive: "Auto / garage",
  },
  en: {
    restaurant: "Restaurant / hospitality",
    salon: "Hair / beauty",
    retail: "Shop / retail",
    services: "Service provider / SME",
    creative: "Creative / studio",
    photography: "Photographer / video",
    construction: "Construction / renovation",
    health: "Health / practice",
    consulting: "Consultant / advisory",
    fitness: "Sport / coaching",
    realestate: "Real estate",
    automotive: "Car / garage",
  },
};

export const TONE_LABELS: Record<Loc, Record<Tone, string>> = {
  nl: { warm: "Warm", zakelijk: "Zakelijk", speels: "Speels" },
  fr: { warm: "Chaleureux", zakelijk: "Professionnel", speels: "Décontracté" },
  en: { warm: "Warm", zakelijk: "Professional", speels: "Playful" },
};

export const PAGE_LABELS: Record<Loc, Record<PageKey, string>> = {
  nl: {
    home: "Home",
    about: "Over ons",
    offer: "Aanbod / diensten",
    gallery: "Galerij / portfolio",
    pricing: "Tarieven",
    contact: "Contact",
  },
  fr: {
    home: "Accueil",
    about: "À propos",
    offer: "Offre / services",
    gallery: "Galerie / portfolio",
    pricing: "Tarifs",
    contact: "Contact",
  },
  en: {
    home: "Home",
    about: "About",
    offer: "Offer / services",
    gallery: "Gallery / portfolio",
    pricing: "Pricing",
    contact: "Contact",
  },
};

type Pack = {
  eyebrow: string;
  sub: string;
  button: string;
  features: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  aboutTitle: string;
  aboutText: string;
  offerTitle: string;
  offer: { title: string; desc: string }[];
  galleryTitle: string;
  priceTitle: string;
  prices: { name: string; price: string; desc: string }[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaBtn: string;
  contactTitle: string;
};

// Compacte bron per sector; FR/EN zijn echte vertalingen maar bondig
// gehouden. De klant past alles toch nog aan.
const P: Record<SectorKey, Record<Loc, Pack>> = {
  restaurant: {
    nl: {
      eyebrow: "Welkom", sub: "Verse gerechten, een warme sfeer en vlot reserveren — alles op één plek.", button: "Reserveer een tafel",
      features: [{ title: "Verse keuken", desc: "Dagelijks vers met streekproducten." }, { title: "Gezellige sfeer", desc: "Je voelt je meteen thuis." }, { title: "Vlot reserveren", desc: "In een paar klikken een tafel." }],
      steps: [{ title: "Kies je moment", desc: "Bekijk de beschikbaarheid." }, { title: "Reserveer", desc: "Laat je gegevens na." }, { title: "Geniet", desc: "Wij doen de rest." }],
      aboutTitle: "Over ons", aboutText: "Een familiezaak met passie voor eerlijke gerechten en gastvrijheid. Vertel hier kort jullie verhaal.",
      offerTitle: "Onze kaart", offer: [{ title: "Lunch", desc: "Dagverse suggesties." }, { title: "À la carte", desc: "Klassiekers met een twist." }, { title: "Menu", desc: "Een verrassend meergangenmenu." }],
      galleryTitle: "Sfeerbeelden",
      priceTitle: "Formules", prices: [{ name: "Lunchformule", price: "€ 0", desc: "2 of 3 gangen." }, { name: "Avondmenu", price: "€ 0", desc: "Vast menu, wisselend." }, { name: "Groepen", price: "Op aanvraag", desc: "Op maat van je gezelschap." }],
      faq: [{ q: "Kan ik online reserveren?", a: "Ja, dag en nacht via deze site." }, { q: "Houden jullie rekening met allergieën?", a: "Zeker — meld het bij je reservatie." }],
      ctaTitle: "Zin gekregen?", ctaText: "Boek je tafel en kom proeven.", ctaBtn: "Reserveer nu", contactTitle: "Contact & reservatie",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Des plats frais, une ambiance chaleureuse et une réservation facile.", button: "Réserver une table",
      features: [{ title: "Cuisine fraîche", desc: "Chaque jour, produits locaux." }, { title: "Ambiance conviviale", desc: "On s'y sent bien." }, { title: "Réservation facile", desc: "En quelques clics." }],
      steps: [{ title: "Choisissez le moment", desc: "Voyez les disponibilités." }, { title: "Réservez", desc: "Laissez vos coordonnées." }, { title: "Profitez", desc: "On s'occupe du reste." }],
      aboutTitle: "À propos", aboutText: "Une affaire familiale passionnée par la cuisine honnête et l'accueil. Racontez votre histoire ici.",
      offerTitle: "Notre carte", offer: [{ title: "Lunch", desc: "Suggestions du jour." }, { title: "À la carte", desc: "Classiques revisités." }, { title: "Menu", desc: "Un menu plusieurs services." }],
      galleryTitle: "Ambiance",
      priceTitle: "Formules", prices: [{ name: "Formule lunch", price: "€ 0", desc: "2 ou 3 services." }, { name: "Menu du soir", price: "€ 0", desc: "Menu fixe, variable." }, { name: "Groupes", price: "Sur demande", desc: "Sur mesure." }],
      faq: [{ q: "Réserver en ligne ?", a: "Oui, jour et nuit via ce site." }, { q: "Allergies ?", a: "Bien sûr — précisez-le à la réservation." }],
      ctaTitle: "Envie de venir ?", ctaText: "Réservez et venez goûter.", ctaBtn: "Réserver", contactTitle: "Contact & réservation",
    },
    en: {
      eyebrow: "Welcome", sub: "Fresh dishes, a warm atmosphere and easy booking — all in one place.", button: "Book a table",
      features: [{ title: "Fresh kitchen", desc: "Daily fresh, local produce." }, { title: "Cosy atmosphere", desc: "You feel at home." }, { title: "Easy booking", desc: "A table in a few clicks." }],
      steps: [{ title: "Pick your moment", desc: "Check availability." }, { title: "Book", desc: "Leave your details." }, { title: "Enjoy", desc: "We do the rest." }],
      aboutTitle: "About us", aboutText: "A family business with a passion for honest food and hospitality. Tell your story here.",
      offerTitle: "Our menu", offer: [{ title: "Lunch", desc: "Daily suggestions." }, { title: "À la carte", desc: "Classics with a twist." }, { title: "Set menu", desc: "A multi-course surprise." }],
      galleryTitle: "Atmosphere",
      priceTitle: "Formulas", prices: [{ name: "Lunch deal", price: "€ 0", desc: "2 or 3 courses." }, { name: "Evening menu", price: "€ 0", desc: "Set, changing menu." }, { name: "Groups", price: "On request", desc: "Tailored to your party." }],
      faq: [{ q: "Can I book online?", a: "Yes, day and night via this site." }, { q: "Do you handle allergies?", a: "Of course — tell us when booking." }],
      ctaTitle: "Tempted?", ctaText: "Book your table and come taste.", ctaBtn: "Book now", contactTitle: "Contact & booking",
    },
  },
  salon: {
    nl: {
      eyebrow: "Welkom", sub: "Vakwerk, persoonlijk advies en online een afspraak in een handomdraai.", button: "Boek een afspraak",
      features: [{ title: "Persoonlijk advies", desc: "Een look die bij jou past." }, { title: "Ervaren handen", desc: "Jaren vakmanschap." }, { title: "Online boeken", desc: "Kies zelf je moment." }],
      steps: [{ title: "Kies een behandeling", desc: "Bekijk het aanbod." }, { title: "Plan je afspraak", desc: "Dag en uur." }, { title: "Tot snel", desc: "Wij maken je mooi." }],
      aboutTitle: "Over de zaak", aboutText: "Een salon waar kwaliteit en een warm onthaal centraal staan. Vertel hier kort wie je bent.",
      offerTitle: "Behandelingen", offer: [{ title: "Knippen & stylen", desc: "Voor elk haartype." }, { title: "Kleuren", desc: "Subtiel of opvallend." }, { title: "Verzorging", desc: "Gezonde glans." }],
      galleryTitle: "Realisaties",
      priceTitle: "Tarieven", prices: [{ name: "Knippen", price: "€ 0", desc: "Incl. wassen & föhnen." }, { name: "Kleuring", price: "€ 0", desc: "Op aanvraag." }, { name: "Bruidskapsel", price: "Op maat", desc: "Inclusief proefkapsel." }],
      faq: [{ q: "Moet ik vooraf boeken?", a: "Aanbevolen — zo ben je zeker." }, { q: "Betaalmiddelen?", a: "Cash en kaart ter plekke." }],
      ctaTitle: "Klaar voor een nieuwe look?", ctaText: "Boek vandaag je afspraak.", ctaBtn: "Boek nu", contactTitle: "Contact & afspraak",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Savoir-faire, conseils personnalisés et rendez-vous en ligne.", button: "Prendre rendez-vous",
      features: [{ title: "Conseil personnalisé", desc: "Un look qui vous ressemble." }, { title: "Mains expertes", desc: "Des années de métier." }, { title: "Réservation en ligne", desc: "Choisissez votre moment." }],
      steps: [{ title: "Choisissez un soin", desc: "Voyez l'offre." }, { title: "Planifiez", desc: "Jour et heure." }, { title: "À bientôt", desc: "On s'occupe de vous." }],
      aboutTitle: "À propos", aboutText: "Un salon où qualité et accueil priment. Présentez-vous brièvement ici.",
      offerTitle: "Prestations", offer: [{ title: "Coupe & coiffage", desc: "Tout type de cheveux." }, { title: "Couleur", desc: "Subtil ou marqué." }, { title: "Soins", desc: "Brillance saine." }],
      galleryTitle: "Réalisations",
      priceTitle: "Tarifs", prices: [{ name: "Coupe", price: "€ 0", desc: "Lavage & brushing inclus." }, { name: "Couleur", price: "€ 0", desc: "Sur demande." }, { name: "Mariage", price: "Sur mesure", desc: "Essai inclus." }],
      faq: [{ q: "Faut-il réserver ?", a: "Conseillé pour être sûr." }, { q: "Paiement ?", a: "Cash et carte sur place." }],
      ctaTitle: "Prêt pour un nouveau look ?", ctaText: "Réservez aujourd'hui.", ctaBtn: "Réserver", contactTitle: "Contact & rendez-vous",
    },
    en: {
      eyebrow: "Welcome", sub: "Craft, personal advice and online booking in no time.", button: "Book an appointment",
      features: [{ title: "Personal advice", desc: "A look that suits you." }, { title: "Expert hands", desc: "Years of craft." }, { title: "Online booking", desc: "Pick your moment." }],
      steps: [{ title: "Choose a treatment", desc: "See the offer." }, { title: "Plan it", desc: "Day and time." }, { title: "See you soon", desc: "We take care of you." }],
      aboutTitle: "About", aboutText: "A salon where quality and a warm welcome come first. Introduce yourself here.",
      offerTitle: "Treatments", offer: [{ title: "Cut & style", desc: "For every hair type." }, { title: "Colour", desc: "Subtle or bold." }, { title: "Care", desc: "Healthy shine." }],
      galleryTitle: "Our work",
      priceTitle: "Pricing", prices: [{ name: "Cut", price: "€ 0", desc: "Wash & blow-dry incl." }, { name: "Colour", price: "€ 0", desc: "On request." }, { name: "Bridal", price: "Tailored", desc: "Trial included." }],
      faq: [{ q: "Should I book ahead?", a: "Recommended to be sure." }, { q: "Payment?", a: "Cash and card on site." }],
      ctaTitle: "Ready for a new look?", ctaText: "Book your appointment today.", ctaBtn: "Book now", contactTitle: "Contact & booking",
    },
  },
  retail: {
    nl: {
      eyebrow: "Welkom", sub: "Een zorgvuldig samengesteld aanbod, eerlijk advies en snelle service.", button: "Bekijk het aanbod",
      features: [{ title: "Doordachte selectie", desc: "Enkel wat we zelf goed vinden." }, { title: "Echt advies", desc: "We helpen je kiezen." }, { title: "Snelle service", desc: "Online en in de winkel." }],
      steps: [{ title: "Ontdek", desc: "Blader door het aanbod." }, { title: "Kies", desc: "Twijfel? We helpen." }, { title: "Klaar", desc: "Opgehaald of geleverd." }],
      aboutTitle: "Onze winkel", aboutText: "Een lokale zaak met een hart voor kwaliteit en klantencontact. Vertel hier je verhaal.",
      offerTitle: "Aanbod", offer: [{ title: "Topmerken", desc: "Zorgvuldig gekozen." }, { title: "Nieuwkomers", desc: "Vers binnen." }, { title: "Acties", desc: "Tijdelijke deals." }],
      galleryTitle: "In de kijker",
      priceTitle: "Prijzen", prices: [{ name: "Product", price: "€ 0", desc: "Korte omschrijving." }, { name: "Tweede item", price: "€ 0", desc: "Korte omschrijving." }, { name: "Cadeaubon", price: "Vrij te kiezen", desc: "Altijd goed." }],
      faq: [{ q: "Kan ik online bestellen?", a: "Ja, ophalen of laten leveren." }, { q: "Elke dag open?", a: "Zie de openingsuren." }],
      ctaTitle: "Iets gevonden?", ctaText: "Kom langs of bestel online.", ctaBtn: "Neem contact op", contactTitle: "Contact & openingsuren",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Une sélection soignée, des conseils honnêtes et un service rapide.", button: "Voir l'offre",
      features: [{ title: "Sélection soignée", desc: "Ce qu'on aime vraiment." }, { title: "Vrais conseils", desc: "On vous aide à choisir." }, { title: "Service rapide", desc: "En ligne et en boutique." }],
      steps: [{ title: "Découvrez", desc: "Parcourez l'offre." }, { title: "Choisissez", desc: "Un doute ? On aide." }, { title: "C'est prêt", desc: "Retrait ou livraison." }],
      aboutTitle: "Notre boutique", aboutText: "Un commerce local attaché à la qualité et au contact. Racontez votre histoire ici.",
      offerTitle: "Offre", offer: [{ title: "Grandes marques", desc: "Choisies avec soin." }, { title: "Nouveautés", desc: "Fraîchement arrivées." }, { title: "Promos", desc: "Offres limitées." }],
      galleryTitle: "À l'honneur",
      priceTitle: "Prix", prices: [{ name: "Produit", price: "€ 0", desc: "Brève description." }, { name: "Deuxième", price: "€ 0", desc: "Brève description." }, { name: "Chèque-cadeau", price: "Au choix", desc: "Toujours apprécié." }],
      faq: [{ q: "Commander en ligne ?", a: "Oui, retrait ou livraison." }, { q: "Ouvert tous les jours ?", a: "Voir les horaires." }],
      ctaTitle: "Quelque chose vous plaît ?", ctaText: "Passez ou commandez en ligne.", ctaBtn: "Nous contacter", contactTitle: "Contact & horaires",
    },
    en: {
      eyebrow: "Welcome", sub: "A carefully curated range, honest advice and fast service.", button: "See the range",
      features: [{ title: "Curated selection", desc: "Only what we rate." }, { title: "Real advice", desc: "We help you choose." }, { title: "Fast service", desc: "Online and in store." }],
      steps: [{ title: "Discover", desc: "Browse the range." }, { title: "Choose", desc: "Unsure? We help." }, { title: "Done", desc: "Pickup or delivery." }],
      aboutTitle: "Our shop", aboutText: "A local business that cares about quality and contact. Tell your story here.",
      offerTitle: "Range", offer: [{ title: "Top brands", desc: "Carefully chosen." }, { title: "New arrivals", desc: "Freshly in." }, { title: "Deals", desc: "Limited offers." }],
      galleryTitle: "Featured",
      priceTitle: "Prices", prices: [{ name: "Product", price: "€ 0", desc: "Short description." }, { name: "Second item", price: "€ 0", desc: "Short description." }, { name: "Gift card", price: "Any amount", desc: "Always a good idea." }],
      faq: [{ q: "Can I order online?", a: "Yes, pickup or delivery." }, { q: "Open every day?", a: "See the opening hours." }],
      ctaTitle: "Found something?", ctaText: "Drop by or order online.", ctaBtn: "Get in touch", contactTitle: "Contact & hours",
    },
  },
  services: {
    nl: {
      eyebrow: "Welkom", sub: "Heldere afspraken, vakwerk en een aanspreekpunt dat je echt verder helpt.", button: "Vraag een offerte",
      features: [{ title: "Duidelijke afspraken", desc: "Geen verrassingen." }, { title: "Vakwerk", desc: "Met zorg uitgevoerd." }, { title: "Persoonlijk contact", desc: "Eén vast aanspreekpunt." }],
      steps: [{ title: "Vertel je vraag", desc: "Kort wat je nodig hebt." }, { title: "Voorstel", desc: "Helder plan en prijs." }, { title: "Uitvoering", desc: "Wij regelen het." }],
      aboutTitle: "Over ons", aboutText: "Een betrouwbare partner met oog voor detail. Vertel hier kort wat je doet en voor wie.",
      offerTitle: "Diensten", offer: [{ title: "Dienst 1", desc: "Korte omschrijving." }, { title: "Dienst 2", desc: "Korte omschrijving." }, { title: "Dienst 3", desc: "Korte omschrijving." }],
      galleryTitle: "Realisaties",
      priceTitle: "Tarieven", prices: [{ name: "Basis", price: "€ 0", desc: "Voor kleine opdrachten." }, { name: "Standaard", price: "€ 0", desc: "Meest gekozen." }, { name: "Op maat", price: "Op aanvraag", desc: "Volledig afgestemd." }],
      faq: [{ q: "Werken jullie met een vaste prijs?", a: "Ja, je weet vooraf waar je aan toe bent." }, { q: "Hoe snel starten?", a: "Neem contact op, we bekijken het samen." }],
      ctaTitle: "Klaar om te starten?", ctaText: "Vraag vrijblijvend je offerte.", ctaBtn: "Vraag je offerte", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Des accords clairs, du savoir-faire et un interlocuteur qui vous fait avancer.", button: "Demander un devis",
      features: [{ title: "Accords clairs", desc: "Sans surprises." }, { title: "Savoir-faire", desc: "Travail soigné." }, { title: "Contact personnel", desc: "Un interlocuteur fixe." }],
      steps: [{ title: "Votre demande", desc: "Dites ce qu'il vous faut." }, { title: "Proposition", desc: "Plan et prix clairs." }, { title: "Réalisation", desc: "On s'en occupe." }],
      aboutTitle: "À propos", aboutText: "Un partenaire fiable, attentif au détail. Décrivez brièvement votre activité.",
      offerTitle: "Services", offer: [{ title: "Service 1", desc: "Brève description." }, { title: "Service 2", desc: "Brève description." }, { title: "Service 3", desc: "Brève description." }],
      galleryTitle: "Réalisations",
      priceTitle: "Tarifs", prices: [{ name: "Base", price: "€ 0", desc: "Petits projets." }, { name: "Standard", price: "€ 0", desc: "Le plus choisi." }, { name: "Sur mesure", price: "Sur demande", desc: "Entièrement adapté." }],
      faq: [{ q: "Travaillez-vous à prix fixe ?", a: "Oui, vous savez à quoi vous attendre." }, { q: "Délai de démarrage ?", a: "Contactez-nous, on regarde ensemble." }],
      ctaTitle: "Prêt à démarrer ?", ctaText: "Demandez votre devis sans engagement.", ctaBtn: "Demander un devis", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Clear agreements, craft and a contact who genuinely helps you forward.", button: "Request a quote",
      features: [{ title: "Clear agreements", desc: "No surprises." }, { title: "Craft", desc: "Careful work." }, { title: "Personal contact", desc: "One fixed point." }],
      steps: [{ title: "Your question", desc: "Tell us what you need." }, { title: "Proposal", desc: "Clear plan and price." }, { title: "Delivery", desc: "We handle it." }],
      aboutTitle: "About us", aboutText: "A reliable partner with an eye for detail. Briefly describe what you do and for whom.",
      offerTitle: "Services", offer: [{ title: "Service 1", desc: "Short description." }, { title: "Service 2", desc: "Short description." }, { title: "Service 3", desc: "Short description." }],
      galleryTitle: "Our work",
      priceTitle: "Pricing", prices: [{ name: "Basic", price: "€ 0", desc: "For small jobs." }, { name: "Standard", price: "€ 0", desc: "Most chosen." }, { name: "Custom", price: "On request", desc: "Fully tailored." }],
      faq: [{ q: "Do you work at a fixed price?", a: "Yes, you know upfront where you stand." }, { q: "How fast can you start?", a: "Get in touch, we'll look together." }],
      ctaTitle: "Ready to start?", ctaText: "Request your quote, no strings.", ctaBtn: "Request your quote", contactTitle: "Contact",
    },
  },
  creative: {
    nl: {
      eyebrow: "Welkom", sub: "Werk dat blijft hangen — voor mensen, merken en momenten.", button: "Bekijk mijn werk",
      features: [{ title: "Eigen stijl", desc: "Herkenbaar en authentiek." }, { title: "Oog voor detail", desc: "Elk beeld klopt." }, { title: "Vlotte aanpak", desc: "Ontspannen van A tot Z." }],
      steps: [{ title: "Kennismaking", desc: "We bespreken je idee." }, { title: "Aan de slag", desc: "Met richting en ruimte." }, { title: "Oplevering", desc: "Klaar voor gebruik." }],
      aboutTitle: "Over mij", aboutText: "Ik maak werk met een eigen blik. Vertel hier kort wie je bent en wat je drijft.",
      offerTitle: "Wat ik doe", offer: [{ title: "Concept", desc: "Idee en richting." }, { title: "Creatie", desc: "Uitvoering met zorg." }, { title: "Oplevering", desc: "Klaar voor alle kanalen." }],
      galleryTitle: "Portfolio",
      priceTitle: "Pakketten", prices: [{ name: "Klein", price: "€ 0", desc: "Eén opdracht." }, { name: "Medium", price: "€ 0", desc: "Meest gekozen." }, { name: "Op maat", price: "Op aanvraag", desc: "Volledig afgestemd." }],
      faq: [{ q: "Wat kost een opdracht?", a: "Afhankelijk van de scope — vraag een voorstel." }, { q: "Hoe lang duurt het?", a: "Doorgaans één à twee weken." }],
      ctaTitle: "Iets in gedachten?", ctaText: "Laten we het bespreken.", ctaBtn: "Neem contact op", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Un travail qui marque — pour des personnes, des marques, des moments.", button: "Voir mon travail",
      features: [{ title: "Style propre", desc: "Reconnaissable, authentique." }, { title: "Sens du détail", desc: "Chaque image juste." }, { title: "Approche fluide", desc: "Détendu de A à Z." }],
      steps: [{ title: "Rencontre", desc: "On parle de votre idée." }, { title: "Création", desc: "Avec direction." }, { title: "Livraison", desc: "Prêt à l'emploi." }],
      aboutTitle: "À propos", aboutText: "Je crée avec un regard propre. Présentez-vous brièvement ici.",
      offerTitle: "Ce que je fais", offer: [{ title: "Concept", desc: "Idée et direction." }, { title: "Création", desc: "Exécution soignée." }, { title: "Livraison", desc: "Prêt pour tous les canaux." }],
      galleryTitle: "Portfolio",
      priceTitle: "Forfaits", prices: [{ name: "Petit", price: "€ 0", desc: "Une mission." }, { name: "Moyen", price: "€ 0", desc: "Le plus choisi." }, { name: "Sur mesure", price: "Sur demande", desc: "Entièrement adapté." }],
      faq: [{ q: "Quel est le prix ?", a: "Selon la mission — demandez une proposition." }, { q: "Quel délai ?", a: "En général une à deux semaines." }],
      ctaTitle: "Une idée en tête ?", ctaText: "Parlons-en.", ctaBtn: "Nous contacter", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Work that sticks — for people, brands and moments.", button: "See my work",
      features: [{ title: "Own style", desc: "Recognisable, authentic." }, { title: "Eye for detail", desc: "Every image right." }, { title: "Smooth approach", desc: "Relaxed start to finish." }],
      steps: [{ title: "Intro chat", desc: "We discuss your idea." }, { title: "Creation", desc: "With direction." }, { title: "Delivery", desc: "Ready to use." }],
      aboutTitle: "About me", aboutText: "I create with my own eye. Introduce yourself briefly here.",
      offerTitle: "What I do", offer: [{ title: "Concept", desc: "Idea and direction." }, { title: "Creation", desc: "Careful execution." }, { title: "Delivery", desc: "Ready for all channels." }],
      galleryTitle: "Portfolio",
      priceTitle: "Packages", prices: [{ name: "Small", price: "€ 0", desc: "One project." }, { name: "Medium", price: "€ 0", desc: "Most chosen." }, { name: "Custom", price: "On request", desc: "Fully tailored." }],
      faq: [{ q: "What does it cost?", a: "Depends on scope — ask for a proposal." }, { q: "How long?", a: "Usually one to two weeks." }],
      ctaTitle: "Something in mind?", ctaText: "Let's talk.", ctaBtn: "Get in touch", contactTitle: "Contact",
    },
  },
  photography: {
    nl: {
      eyebrow: "Welkom", sub: "Beelden die een verhaal vertellen — mensen, merken en momenten.", button: "Bekijk portfolio",
      features: [{ title: "Authentiek", desc: "Echte momenten, eigen blik." }, { title: "Scherp oog", desc: "Compositie en licht." }, { title: "Snel geleverd", desc: "Bewerkt en klaar." }],
      steps: [{ title: "Kennismaking", desc: "We bespreken je wensen." }, { title: "De shoot", desc: "Ontspannen, met richting." }, { title: "Selectie", desc: "Jij kiest, ik bewerk." }],
      aboutTitle: "Over mij", aboutText: "Ik leg vast wat telt. Vertel hier kort je verhaal en stijl.",
      offerTitle: "Diensten", offer: [{ title: "Portret", desc: "Persoonlijk en sterk." }, { title: "Event", desc: "Het hele verhaal." }, { title: "Bedrijf", desc: "Merk- en productbeeld." }],
      galleryTitle: "Portfolio",
      priceTitle: "Pakketten", prices: [{ name: "Mini-shoot", price: "€ 0", desc: "30 min, 10 beelden." }, { name: "Standaard", price: "€ 0", desc: "1u, 30 beelden." }, { name: "Event", price: "Op aanvraag", desc: "Volledige dekking." }],
      faq: [{ q: "Wanneer krijg ik de foto's?", a: "Doorgaans binnen één à twee weken." }, { q: "Reiskosten?", a: "In overleg, afhankelijk van locatie." }],
      ctaTitle: "Klaar voor mooie beelden?", ctaText: "Boek je shoot.", ctaBtn: "Boek een shoot", contactTitle: "Contact & boeking",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Des images qui racontent — personnes, marques et moments.", button: "Voir le portfolio",
      features: [{ title: "Authentique", desc: "Vrais moments, regard propre." }, { title: "Œil aiguisé", desc: "Composition et lumière." }, { title: "Livraison rapide", desc: "Retouché et prêt." }],
      steps: [{ title: "Rencontre", desc: "On parle de vos envies." }, { title: "La séance", desc: "Détendue, guidée." }, { title: "Sélection", desc: "Vous choisissez, je retouche." }],
      aboutTitle: "À propos", aboutText: "Je capte l'essentiel. Racontez votre histoire et votre style ici.",
      offerTitle: "Services", offer: [{ title: "Portrait", desc: "Personnel et fort." }, { title: "Événement", desc: "Toute l'histoire." }, { title: "Entreprise", desc: "Image de marque." }],
      galleryTitle: "Portfolio",
      priceTitle: "Forfaits", prices: [{ name: "Mini-séance", price: "€ 0", desc: "30 min, 10 images." }, { name: "Standard", price: "€ 0", desc: "1h, 30 images." }, { name: "Événement", price: "Sur demande", desc: "Couverture complète." }],
      faq: [{ q: "Quand les photos ?", a: "En général une à deux semaines." }, { q: "Frais de déplacement ?", a: "À convenir selon le lieu." }],
      ctaTitle: "Prêt pour de belles images ?", ctaText: "Réservez votre séance.", ctaBtn: "Réserver", contactTitle: "Contact & réservation",
    },
    en: {
      eyebrow: "Welcome", sub: "Images that tell a story — people, brands and moments.", button: "View portfolio",
      features: [{ title: "Authentic", desc: "Real moments, own eye." }, { title: "Sharp eye", desc: "Composition and light." }, { title: "Fast delivery", desc: "Edited and ready." }],
      steps: [{ title: "Intro chat", desc: "We discuss your wishes." }, { title: "The shoot", desc: "Relaxed, guided." }, { title: "Selection", desc: "You pick, I edit." }],
      aboutTitle: "About me", aboutText: "I capture what matters. Tell your story and style here.",
      offerTitle: "Services", offer: [{ title: "Portrait", desc: "Personal and strong." }, { title: "Event", desc: "The whole story." }, { title: "Business", desc: "Brand & product imagery." }],
      galleryTitle: "Portfolio",
      priceTitle: "Packages", prices: [{ name: "Mini shoot", price: "€ 0", desc: "30 min, 10 images." }, { name: "Standard", price: "€ 0", desc: "1h, 30 images." }, { name: "Event", price: "On request", desc: "Full coverage." }],
      faq: [{ q: "When do I get the photos?", a: "Usually within one to two weeks." }, { q: "Travel cost?", a: "By arrangement, depends on location." }],
      ctaTitle: "Ready for great images?", ctaText: "Book your shoot.", ctaBtn: "Book a shoot", contactTitle: "Contact & booking",
    },
  },
  construction: {
    nl: {
      eyebrow: "Welkom", sub: "Vakwerk van fundering tot afwerking — degelijk, op tijd en netjes.", button: "Vraag een offerte",
      features: [{ title: "Vakmanschap", desc: "Degelijk en duurzaam." }, { title: "Stipt", desc: "Afspraak is afspraak." }, { title: "Net werk", desc: "Werf blijft proper." }],
      steps: [{ title: "Plaatsbezoek", desc: "We bekijken het samen." }, { title: "Offerte", desc: "Helder en volledig." }, { title: "Uitvoering", desc: "Vlot en opgevolgd." }],
      aboutTitle: "Over ons", aboutText: "Een ploeg met jaren ervaring en oog voor detail. Vertel hier kort jullie verhaal.",
      offerTitle: "Werken", offer: [{ title: "Nieuwbouw", desc: "Van ruwbouw tot sleutel-op-de-deur." }, { title: "Renovatie", desc: "Totaal of gericht." }, { title: "Afwerking", desc: "Pleister, vloer, schilder." }],
      galleryTitle: "Realisaties",
      priceTitle: "Aanpak", prices: [{ name: "Plaatsbezoek", price: "Gratis", desc: "Vrijblijvend advies." }, { name: "Offerte", price: "Op maat", desc: "Volledig uitgewerkt." }, { name: "Werf", price: "Op aanvraag", desc: "Met planning." }],
      faq: [{ q: "Vaste prijs?", a: "Ja, na plaatsbezoek krijg je een heldere offerte." }, { q: "Termijn?", a: "We plannen samen een realistische timing." }],
      ctaTitle: "Plannen om te (ver)bouwen?", ctaText: "Vraag vrijblijvend je offerte.", ctaBtn: "Vraag je offerte", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Du savoir-faire des fondations à la finition — solide, à temps et soigné.", button: "Demander un devis",
      features: [{ title: "Savoir-faire", desc: "Solide et durable." }, { title: "Ponctuel", desc: "Les délais sont tenus." }, { title: "Travail propre", desc: "Chantier soigné." }],
      steps: [{ title: "Visite", desc: "On regarde ensemble." }, { title: "Devis", desc: "Clair et complet." }, { title: "Réalisation", desc: "Suivie de près." }],
      aboutTitle: "À propos", aboutText: "Une équipe expérimentée, attentive au détail. Racontez votre histoire ici.",
      offerTitle: "Travaux", offer: [{ title: "Construction", desc: "Du gros œuvre au clé-en-main." }, { title: "Rénovation", desc: "Totale ou ciblée." }, { title: "Finition", desc: "Enduit, sol, peinture." }],
      galleryTitle: "Réalisations",
      priceTitle: "Approche", prices: [{ name: "Visite", price: "Gratuit", desc: "Conseil sans engagement." }, { name: "Devis", price: "Sur mesure", desc: "Entièrement détaillé." }, { name: "Chantier", price: "Sur demande", desc: "Avec planning." }],
      faq: [{ q: "Prix fixe ?", a: "Oui, après visite un devis clair." }, { q: "Délai ?", a: "On planifie un timing réaliste." }],
      ctaTitle: "Un projet de (re)construction ?", ctaText: "Demandez votre devis.", ctaBtn: "Demander un devis", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Craft from foundation to finish — solid, on time and tidy.", button: "Request a quote",
      features: [{ title: "Craftsmanship", desc: "Solid and durable." }, { title: "On time", desc: "We keep deadlines." }, { title: "Tidy work", desc: "Site stays clean." }],
      steps: [{ title: "Site visit", desc: "We look together." }, { title: "Quote", desc: "Clear and complete." }, { title: "Execution", desc: "Smooth and tracked." }],
      aboutTitle: "About us", aboutText: "A team with years of experience and an eye for detail. Tell your story here.",
      offerTitle: "Works", offer: [{ title: "New build", desc: "Shell to turnkey." }, { title: "Renovation", desc: "Full or targeted." }, { title: "Finishing", desc: "Plaster, floor, paint." }],
      galleryTitle: "Projects",
      priceTitle: "Approach", prices: [{ name: "Site visit", price: "Free", desc: "No-obligation advice." }, { name: "Quote", price: "Tailored", desc: "Fully detailed." }, { name: "Project", price: "On request", desc: "With planning." }],
      faq: [{ q: "Fixed price?", a: "Yes, a clear quote after the site visit." }, { q: "Timeline?", a: "We plan a realistic timing together." }],
      ctaTitle: "Planning to build?", ctaText: "Request your quote, no strings.", ctaBtn: "Request your quote", contactTitle: "Contact",
    },
  },
  health: {
    nl: {
      eyebrow: "Welkom", sub: "Persoonlijke zorg in een rustige praktijk — afspraak snel online.", button: "Maak een afspraak",
      features: [{ title: "Persoonlijke aanpak", desc: "Tijd en aandacht." }, { title: "Ervaren", desc: "Onderbouwde zorg." }, { title: "Vlot boeken", desc: "Online afspraak." }],
      steps: [{ title: "Maak afspraak", desc: "Online of telefonisch." }, { title: "Intake", desc: "We luisteren goed." }, { title: "Opvolging", desc: "Samen verder." }],
      aboutTitle: "Over de praktijk", aboutText: "Een praktijk waar je je op je gemak voelt. Vertel hier kort je aanpak en achtergrond.",
      offerTitle: "Aanbod", offer: [{ title: "Consultatie", desc: "Eerste gesprek." }, { title: "Behandeling", desc: "Op maat." }, { title: "Opvolging", desc: "Begeleiding op termijn." }],
      galleryTitle: "De praktijk",
      priceTitle: "Tarieven", prices: [{ name: "Eerste consult", price: "€ 0", desc: "Inclusief intake." }, { name: "Vervolgconsult", price: "€ 0", desc: "Opvolging." }, { name: "Pakket", price: "Op maat", desc: "Meerdere sessies." }],
      faq: [{ q: "Terugbetaling?", a: "Afhankelijk van je mutualiteit — vraag gerust." }, { q: "Annuleren?", a: "Graag tijdig laten weten." }],
      ctaTitle: "Klaar voor een afspraak?", ctaText: "Boek snel online.", ctaBtn: "Maak een afspraak", contactTitle: "Contact & afspraak",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Des soins personnalisés dans un cabinet calme — rendez-vous en ligne.", button: "Prendre rendez-vous",
      features: [{ title: "Approche personnelle", desc: "Du temps et de l'écoute." }, { title: "Expérimenté", desc: "Soins fondés." }, { title: "Réservation facile", desc: "Rendez-vous en ligne." }],
      steps: [{ title: "Rendez-vous", desc: "En ligne ou par téléphone." }, { title: "Bilan", desc: "On écoute bien." }, { title: "Suivi", desc: "Ensemble." }],
      aboutTitle: "À propos du cabinet", aboutText: "Un cabinet où l'on se sent à l'aise. Décrivez votre approche ici.",
      offerTitle: "Offre", offer: [{ title: "Consultation", desc: "Premier entretien." }, { title: "Traitement", desc: "Sur mesure." }, { title: "Suivi", desc: "Accompagnement." }],
      galleryTitle: "Le cabinet",
      priceTitle: "Tarifs", prices: [{ name: "Première consult.", price: "€ 0", desc: "Bilan inclus." }, { name: "Suivi", price: "€ 0", desc: "Consultation de suivi." }, { name: "Forfait", price: "Sur mesure", desc: "Plusieurs séances." }],
      faq: [{ q: "Remboursement ?", a: "Selon votre mutuelle — demandez." }, { q: "Annulation ?", a: "Prévenez à temps svp." }],
      ctaTitle: "Prêt pour un rendez-vous ?", ctaText: "Réservez en ligne.", ctaBtn: "Prendre rendez-vous", contactTitle: "Contact & rendez-vous",
    },
    en: {
      eyebrow: "Welcome", sub: "Personal care in a calm practice — book online quickly.", button: "Make an appointment",
      features: [{ title: "Personal approach", desc: "Time and attention." }, { title: "Experienced", desc: "Evidence-based care." }, { title: "Easy booking", desc: "Book online." }],
      steps: [{ title: "Book", desc: "Online or by phone." }, { title: "Intake", desc: "We listen well." }, { title: "Follow-up", desc: "Together onward." }],
      aboutTitle: "About the practice", aboutText: "A practice where you feel at ease. Describe your approach and background here.",
      offerTitle: "Services", offer: [{ title: "Consultation", desc: "First talk." }, { title: "Treatment", desc: "Tailored." }, { title: "Follow-up", desc: "Long-term guidance." }],
      galleryTitle: "The practice",
      priceTitle: "Pricing", prices: [{ name: "First consult", price: "€ 0", desc: "Intake included." }, { name: "Follow-up", price: "€ 0", desc: "Follow-up consult." }, { name: "Package", price: "Tailored", desc: "Several sessions." }],
      faq: [{ q: "Reimbursement?", a: "Depends on your insurer — feel free to ask." }, { q: "Cancelling?", a: "Please let us know in time." }],
      ctaTitle: "Ready for an appointment?", ctaText: "Book online quickly.", ctaBtn: "Make an appointment", contactTitle: "Contact & booking",
    },
  },
  consulting: {
    nl: {
      eyebrow: "Welkom", sub: "Helder advies dat beweegt — van analyse tot resultaat.", button: "Plan een gesprek",
      features: [{ title: "Scherpe analyse", desc: "We zien wat telt." }, { title: "Concreet", desc: "Advies dat werkt." }, { title: "Betrokken", desc: "Tot het resultaat." }],
      steps: [{ title: "Gesprek", desc: "We luisteren." }, { title: "Analyse", desc: "Heldere diagnose." }, { title: "Aanpak", desc: "Plan en uitvoering." }],
      aboutTitle: "Over ons", aboutText: "Ervaren adviseurs met een no-nonsense aanpak. Vertel hier kort jullie expertise.",
      offerTitle: "Expertise", offer: [{ title: "Strategie", desc: "Richting en focus." }, { title: "Optimalisatie", desc: "Beter en sneller." }, { title: "Begeleiding", desc: "Hands-on support." }],
      galleryTitle: "Cases",
      priceTitle: "Formules", prices: [{ name: "Intake", price: "Gratis", desc: "Kennismaking." }, { name: "Traject", price: "Op maat", desc: "Volledig afgestemd." }, { name: "Op afroep", price: "€ 0/u", desc: "Flexibele support." }],
      faq: [{ q: "Voor wie?", a: "Van starter tot KMO — afgestemd op jouw situatie." }, { q: "Hoe lang?", a: "Van een quick scan tot een langer traject." }],
      ctaTitle: "Klaar voor de volgende stap?", ctaText: "Plan een vrijblijvend gesprek.", ctaBtn: "Plan een gesprek", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Un conseil clair qui fait avancer — de l'analyse au résultat.", button: "Planifier un entretien",
      features: [{ title: "Analyse fine", desc: "On voit l'essentiel." }, { title: "Concret", desc: "Un conseil qui marche." }, { title: "Impliqué", desc: "Jusqu'au résultat." }],
      steps: [{ title: "Entretien", desc: "On écoute." }, { title: "Analyse", desc: "Diagnostic clair." }, { title: "Approche", desc: "Plan et exécution." }],
      aboutTitle: "À propos", aboutText: "Des conseillers expérimentés, sans détour. Décrivez votre expertise ici.",
      offerTitle: "Expertise", offer: [{ title: "Stratégie", desc: "Direction et focus." }, { title: "Optimisation", desc: "Mieux et plus vite." }, { title: "Accompagnement", desc: "Support concret." }],
      galleryTitle: "Cas",
      priceTitle: "Formules", prices: [{ name: "Bilan", price: "Gratuit", desc: "Prise de contact." }, { name: "Parcours", price: "Sur mesure", desc: "Entièrement adapté." }, { name: "À la demande", price: "€ 0/h", desc: "Support flexible." }],
      faq: [{ q: "Pour qui ?", a: "Du starter à la PME — adapté à votre cas." }, { q: "Durée ?", a: "D'un quick scan à un parcours plus long." }],
      ctaTitle: "Prêt pour l'étape suivante ?", ctaText: "Planifiez un entretien.", ctaBtn: "Planifier", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Clear advice that moves things — from analysis to result.", button: "Schedule a call",
      features: [{ title: "Sharp analysis", desc: "We see what matters." }, { title: "Concrete", desc: "Advice that works." }, { title: "Involved", desc: "Until the result." }],
      steps: [{ title: "Talk", desc: "We listen." }, { title: "Analysis", desc: "Clear diagnosis." }, { title: "Approach", desc: "Plan and delivery." }],
      aboutTitle: "About us", aboutText: "Experienced advisors with a no-nonsense approach. Describe your expertise here.",
      offerTitle: "Expertise", offer: [{ title: "Strategy", desc: "Direction and focus." }, { title: "Optimisation", desc: "Better and faster." }, { title: "Guidance", desc: "Hands-on support." }],
      galleryTitle: "Cases",
      priceTitle: "Formats", prices: [{ name: "Intake", price: "Free", desc: "Introduction." }, { name: "Track", price: "Tailored", desc: "Fully aligned." }, { name: "On call", price: "€ 0/h", desc: "Flexible support." }],
      faq: [{ q: "For whom?", a: "From starter to SME — tailored to you." }, { q: "How long?", a: "From a quick scan to a longer track." }],
      ctaTitle: "Ready for the next step?", ctaText: "Schedule a no-obligation call.", ctaBtn: "Schedule a call", contactTitle: "Contact",
    },
  },
  fitness: {
    nl: {
      eyebrow: "Welkom", sub: "Sterker, fitter, met plezier — begeleiding op jouw tempo.", button: "Start vandaag",
      features: [{ title: "Op maat", desc: "Jouw doel, jouw plan." }, { title: "Begeleiding", desc: "Altijd iemand naast je." }, { title: "Resultaat", desc: "Meetbaar vooruit." }],
      steps: [{ title: "Intake", desc: "Doelen en niveau." }, { title: "Plan", desc: "Training en voeding." }, { title: "Coaching", desc: "We houden je scherp." }],
      aboutTitle: "Over de coach", aboutText: "Gepassioneerd om mensen sterker te maken. Vertel hier kort je aanpak.",
      offerTitle: "Aanbod", offer: [{ title: "Personal training", desc: "1-op-1 focus." }, { title: "Groepslessen", desc: "Samen sterker." }, { title: "Online coaching", desc: "Waar je ook bent." }],
      galleryTitle: "In actie",
      priceTitle: "Formules", prices: [{ name: "Proefsessie", price: "€ 0", desc: "Maak kennis." }, { name: "Maandpakket", price: "€ 0", desc: "Meest gekozen." }, { name: "Op maat", price: "Op aanvraag", desc: "Volledig afgestemd." }],
      faq: [{ q: "Voor beginners?", a: "Zeker — we starten op jouw niveau." }, { q: "Waar?", a: "Studio, bij jou of online." }],
      ctaTitle: "Klaar om te starten?", ctaText: "Boek je proefsessie.", ctaBtn: "Start vandaag", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Plus fort, plus en forme, avec plaisir — à votre rythme.", button: "Commencer",
      features: [{ title: "Sur mesure", desc: "Votre objectif, votre plan." }, { title: "Accompagnement", desc: "Toujours à vos côtés." }, { title: "Résultat", desc: "Des progrès mesurables." }],
      steps: [{ title: "Bilan", desc: "Objectifs et niveau." }, { title: "Plan", desc: "Entraînement et nutrition." }, { title: "Coaching", desc: "On vous garde motivé." }],
      aboutTitle: "À propos du coach", aboutText: "Passionné par rendre les gens plus forts. Décrivez votre approche ici.",
      offerTitle: "Offre", offer: [{ title: "Personal training", desc: "Focus 1-à-1." }, { title: "Cours collectifs", desc: "Plus forts ensemble." }, { title: "Coaching en ligne", desc: "Où que vous soyez." }],
      galleryTitle: "En action",
      priceTitle: "Formules", prices: [{ name: "Séance d'essai", price: "€ 0", desc: "Faites connaissance." }, { name: "Forfait mensuel", price: "€ 0", desc: "Le plus choisi." }, { name: "Sur mesure", price: "Sur demande", desc: "Entièrement adapté." }],
      faq: [{ q: "Pour débutants ?", a: "Oui — on démarre à votre niveau." }, { q: "Où ?", a: "Studio, chez vous ou en ligne." }],
      ctaTitle: "Prêt à commencer ?", ctaText: "Réservez votre séance d'essai.", ctaBtn: "Commencer", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Stronger, fitter, with joy — coaching at your pace.", button: "Start today",
      features: [{ title: "Tailored", desc: "Your goal, your plan." }, { title: "Coaching", desc: "Always someone with you." }, { title: "Results", desc: "Measurable progress." }],
      steps: [{ title: "Intake", desc: "Goals and level." }, { title: "Plan", desc: "Training and nutrition." }, { title: "Coaching", desc: "We keep you sharp." }],
      aboutTitle: "About the coach", aboutText: "Passionate about making people stronger. Describe your approach here.",
      offerTitle: "Offer", offer: [{ title: "Personal training", desc: "1-on-1 focus." }, { title: "Group classes", desc: "Stronger together." }, { title: "Online coaching", desc: "Wherever you are." }],
      galleryTitle: "In action",
      priceTitle: "Plans", prices: [{ name: "Trial session", price: "€ 0", desc: "Get to know us." }, { name: "Monthly plan", price: "€ 0", desc: "Most chosen." }, { name: "Custom", price: "On request", desc: "Fully tailored." }],
      faq: [{ q: "For beginners?", a: "Sure — we start at your level." }, { q: "Where?", a: "Studio, at yours or online." }],
      ctaTitle: "Ready to start?", ctaText: "Book your trial session.", ctaBtn: "Start today", contactTitle: "Contact",
    },
  },
  realestate: {
    nl: {
      eyebrow: "Welkom", sub: "Vlot verkopen of verhuren, met persoonlijke begeleiding en eerlijk advies.", button: "Gratis schatting",
      features: [{ title: "Lokale kennis", desc: "We kennen de markt." }, { title: "Sterke presentatie", desc: "Beeld dat verkoopt." }, { title: "Persoonlijk", desc: "Eén vast contact." }],
      steps: [{ title: "Schatting", desc: "Correcte waardebepaling." }, { title: "Presentatie", desc: "Foto's en publicatie." }, { title: "Deal", desc: "Onderhandeling tot akte." }],
      aboutTitle: "Over ons", aboutText: "Een kantoor met lokale verankering en oog voor mensen. Vertel hier jullie verhaal.",
      offerTitle: "Diensten", offer: [{ title: "Verkoop", desc: "Van schatting tot akte." }, { title: "Verhuur", desc: "Screening en beheer." }, { title: "Advies", desc: "Investering en renovatie." }],
      galleryTitle: "In portefeuille",
      priceTitle: "Tarieven", prices: [{ name: "Schatting", price: "Gratis", desc: "Vrijblijvend." }, { name: "Verkoopdossier", price: "Op maat", desc: "Alles inbegrepen." }, { name: "Beheer", price: "Op aanvraag", desc: "Volledige opvolging." }],
      faq: [{ q: "Wat kost verkopen via jullie?", a: "Een transparant percentage — alles vooraf besproken." }, { q: "Hoe snel verkocht?", a: "Afhankelijk van de markt; we sturen actief." }],
      ctaTitle: "Verkoop- of verhuurplannen?", ctaText: "Vraag je gratis schatting.", ctaBtn: "Gratis schatting", contactTitle: "Contact",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Vendre ou louer sans souci, avec un accompagnement personnel et honnête.", button: "Estimation gratuite",
      features: [{ title: "Connaissance locale", desc: "On connaît le marché." }, { title: "Belle présentation", desc: "Une image qui vend." }, { title: "Personnel", desc: "Un contact fixe." }],
      steps: [{ title: "Estimation", desc: "Valeur correcte." }, { title: "Présentation", desc: "Photos et publication." }, { title: "Affaire", desc: "Négociation jusqu'à l'acte." }],
      aboutTitle: "À propos", aboutText: "Une agence ancrée localement, attentive aux gens. Racontez votre histoire ici.",
      offerTitle: "Services", offer: [{ title: "Vente", desc: "De l'estimation à l'acte." }, { title: "Location", desc: "Sélection et gestion." }, { title: "Conseil", desc: "Investissement, rénovation." }],
      galleryTitle: "En portefeuille",
      priceTitle: "Tarifs", prices: [{ name: "Estimation", price: "Gratuit", desc: "Sans engagement." }, { name: "Dossier de vente", price: "Sur mesure", desc: "Tout compris." }, { name: "Gestion", price: "Sur demande", desc: "Suivi complet." }],
      faq: [{ q: "Coût d'une vente ?", a: "Un pourcentage transparent — discuté d'avance." }, { q: "Délai de vente ?", a: "Selon le marché ; on pilote activement." }],
      ctaTitle: "Des projets de vente ou location ?", ctaText: "Demandez votre estimation gratuite.", ctaBtn: "Estimation gratuite", contactTitle: "Contact",
    },
    en: {
      eyebrow: "Welcome", sub: "Sell or rent smoothly, with personal guidance and honest advice.", button: "Free valuation",
      features: [{ title: "Local knowledge", desc: "We know the market." }, { title: "Strong presentation", desc: "Imagery that sells." }, { title: "Personal", desc: "One fixed contact." }],
      steps: [{ title: "Valuation", desc: "Correct pricing." }, { title: "Presentation", desc: "Photos and listing." }, { title: "Deal", desc: "Negotiation to deed." }],
      aboutTitle: "About us", aboutText: "An agency rooted locally with an eye for people. Tell your story here.",
      offerTitle: "Services", offer: [{ title: "Sales", desc: "From valuation to deed." }, { title: "Rentals", desc: "Screening and management." }, { title: "Advice", desc: "Investment, renovation." }],
      galleryTitle: "Portfolio",
      priceTitle: "Pricing", prices: [{ name: "Valuation", price: "Free", desc: "No obligation." }, { name: "Sales file", price: "Tailored", desc: "All inclusive." }, { name: "Management", price: "On request", desc: "Full follow-up." }],
      faq: [{ q: "What does selling cost?", a: "A transparent percentage — agreed upfront." }, { q: "How fast sold?", a: "Depends on the market; we steer actively." }],
      ctaTitle: "Planning to sell or rent?", ctaText: "Request your free valuation.", ctaBtn: "Free valuation", contactTitle: "Contact",
    },
  },
  automotive: {
    nl: {
      eyebrow: "Welkom", sub: "Eerlijke garage: vakwerk, duidelijke prijzen en snelle service.", button: "Maak een afspraak",
      features: [{ title: "Vakkennis", desc: "Alle merken, alle modellen." }, { title: "Eerlijke prijs", desc: "Geen verrassingen." }, { title: "Snel klaar", desc: "Vlotte service." }],
      steps: [{ title: "Afspraak", desc: "Online of telefonisch." }, { title: "Diagnose", desc: "We zeggen wat nodig is." }, { title: "Klaar", desc: "Rij weer veilig verder." }],
      aboutTitle: "Over de garage", aboutText: "Een garage waar je terecht kan voor eerlijk advies. Vertel hier kort jullie verhaal.",
      offerTitle: "Diensten", offer: [{ title: "Onderhoud", desc: "Volgens fabrikant." }, { title: "Herstelling", desc: "Mechaniek & elektronica." }, { title: "Banden & keuring", desc: "Alles in orde." }],
      galleryTitle: "In de werkplaats",
      priceTitle: "Tarieven", prices: [{ name: "Kleine beurt", price: "€ 0", desc: "Olie & filters." }, { name: "Grote beurt", price: "€ 0", desc: "Volledig nazicht." }, { name: "Diagnose", price: "€ 0", desc: "Heldere uitleg." }],
      faq: [{ q: "Alle merken?", a: "Ja, we werken aan alle merken." }, { q: "Vervangwagen?", a: "Op aanvraag beschikbaar." }],
      ctaTitle: "Auto toe aan service?", ctaText: "Maak vlot een afspraak.", ctaBtn: "Maak een afspraak", contactTitle: "Contact & afspraak",
    },
    fr: {
      eyebrow: "Bienvenue", sub: "Un garage honnête : savoir-faire, prix clairs et service rapide.", button: "Prendre rendez-vous",
      features: [{ title: "Expertise", desc: "Toutes marques, tous modèles." }, { title: "Prix honnête", desc: "Sans surprises." }, { title: "Rapide", desc: "Service fluide." }],
      steps: [{ title: "Rendez-vous", desc: "En ligne ou téléphone." }, { title: "Diagnostic", desc: "On dit ce qu'il faut." }, { title: "Prêt", desc: "Reprenez la route." }],
      aboutTitle: "À propos du garage", aboutText: "Un garage pour des conseils honnêtes. Racontez votre histoire ici.",
      offerTitle: "Services", offer: [{ title: "Entretien", desc: "Selon le constructeur." }, { title: "Réparation", desc: "Mécanique & électronique." }, { title: "Pneus & contrôle", desc: "Tout en ordre." }],
      galleryTitle: "À l'atelier",
      priceTitle: "Tarifs", prices: [{ name: "Petit entretien", price: "€ 0", desc: "Huile & filtres." }, { name: "Grand entretien", price: "€ 0", desc: "Révision complète." }, { name: "Diagnostic", price: "€ 0", desc: "Explication claire." }],
      faq: [{ q: "Toutes marques ?", a: "Oui, toutes marques." }, { q: "Véhicule de remplacement ?", a: "Sur demande." }],
      ctaTitle: "Voiture à entretenir ?", ctaText: "Prenez vite rendez-vous.", ctaBtn: "Prendre rendez-vous", contactTitle: "Contact & rendez-vous",
    },
    en: {
      eyebrow: "Welcome", sub: "An honest garage: craft, clear pricing and fast service.", button: "Make an appointment",
      features: [{ title: "Expertise", desc: "All makes, all models." }, { title: "Honest price", desc: "No surprises." }, { title: "Quick", desc: "Smooth service." }],
      steps: [{ title: "Appointment", desc: "Online or phone." }, { title: "Diagnosis", desc: "We say what's needed." }, { title: "Done", desc: "Drive safely again." }],
      aboutTitle: "About the garage", aboutText: "A garage for honest advice. Tell your story here.",
      offerTitle: "Services", offer: [{ title: "Maintenance", desc: "Per manufacturer." }, { title: "Repair", desc: "Mechanics & electronics." }, { title: "Tyres & inspection", desc: "All sorted." }],
      galleryTitle: "In the workshop",
      priceTitle: "Pricing", prices: [{ name: "Small service", price: "€ 0", desc: "Oil & filters." }, { name: "Full service", price: "€ 0", desc: "Complete check." }, { name: "Diagnosis", price: "€ 0", desc: "Clear explanation." }],
      faq: [{ q: "All makes?", a: "Yes, we work on all makes." }, { q: "Courtesy car?", a: "Available on request." }],
      ctaTitle: "Car due for service?", ctaText: "Book an appointment easily.", ctaBtn: "Make an appointment", contactTitle: "Contact & booking",
    },
  },
};

const TONE_PREFIX: Record<Loc, Record<Tone, string>> = {
  nl: { warm: "Welkom — ", zakelijk: "", speels: "Hey! " },
  fr: { warm: "Bienvenue — ", zakelijk: "", speels: "Hé ! " },
  en: { warm: "Welcome — ", zakelijk: "", speels: "Hey! " },
};

function loc(l: string): Loc {
  return l === "fr" || l === "en" ? l : "nl";
}

// Niet-destructieve "vul lege velden" — gebruikt door de builder.
export function buildPreset(
  sector: SectorKey,
  tone: Tone,
  locale: string,
  businessName: string,
): Record<string, Record<string, unknown>> {
  const l = loc(locale);
  const k = P[sector]?.[l] ?? P.services[l];
  const sub = `${TONE_PREFIX[l][tone]}${k.sub}`;
  return {
    hero: { eyebrow: k.eyebrow, heading: businessName, sub, button: k.button },
    features: { items: k.features.map((f) => ({ ...f })) },
    steps: { items: k.steps.map((f) => ({ ...f })) },
    about: { title: k.aboutTitle, text: k.aboutText },
    faq: { items: k.faq.map((f) => ({ ...f })) },
    pricing: { title: k.priceTitle, items: k.prices.map((x) => ({ ...x })) },
    pricelist: { title: k.priceTitle, items: k.prices.map((x) => ({ ...x })) },
    cta: { title: k.ctaTitle, text: k.ctaText, button: k.ctaBtn },
    newsletter: { title: k.ctaTitle, text: k.ctaText, button: k.ctaBtn },
    gallery: { title: k.galleryTitle },
    contact: { title: k.contactTitle },
  };
}

export type ScaffoldSection = { kind: string; data: Record<string, unknown> };
export type ScaffoldPage = { name: string; sections: ScaffoldSection[] };

// Volledige site-scaffold: bouwt per gekozen pagina de juiste blokken,
// gevuld met sector- en toon-passende voorbeeldinhoud.
export function buildSiteScaffold(
  sector: SectorKey,
  tone: Tone,
  locale: string,
  businessName: string,
  pageKeys: PageKey[],
): ScaffoldPage[] {
  const l = loc(locale);
  const k = P[sector]?.[l] ?? P.services[l];
  const pl = PAGE_LABELS[l];
  const heroSub = `${TONE_PREFIX[l][tone]}${k.sub}`;
  const hero = (heading: string, sub: string): ScaffoldSection => ({
    kind: "hero",
    data: { slides: [{ eyebrow: k.eyebrow, heading, sub, button: k.button }] },
  });
  const feat: ScaffoldSection = {
    kind: "features",
    data: {
      title: k.offerTitle,
      items: k.features.map((f) => ({ ...f })),
    },
  };
  const steps: ScaffoldSection = {
    kind: "steps",
    data: { title: "", items: k.steps.map((f) => ({ ...f })) },
  };
  const about: ScaffoldSection = {
    kind: "about",
    data: { title: k.aboutTitle, text: k.aboutText },
  };
  const offer: ScaffoldSection = {
    kind: "features",
    data: { title: k.offerTitle, items: k.offer.map((f) => ({ ...f })) },
  };
  const gallery: ScaffoldSection = {
    kind: "gallery",
    data: { title: k.galleryTitle },
  };
  const pricing: ScaffoldSection = {
    kind: "pricing",
    data: { title: k.priceTitle, items: k.prices.map((x) => ({ ...x })) },
  };
  const faq: ScaffoldSection = {
    kind: "faq",
    data: { title: "FAQ", items: k.faq.map((x) => ({ ...x })) },
  };
  const cta: ScaffoldSection = {
    kind: "cta",
    data: { title: k.ctaTitle, text: k.ctaText, button: k.ctaBtn },
  };
  const contact: ScaffoldSection = {
    kind: "contact",
    data: { title: k.contactTitle, emailAddr: "", phone: "", address: "" },
  };
  const footer: ScaffoldSection = {
    kind: "footer",
    data: {
      about: businessName,
      cols: [
        {
          title: pl.offer,
          links: k.offer.map((o) => ({ label: o.title })),
        },
        {
          title: pl.contact,
          links: [{ label: pl.about }, { label: pl.contact }],
        },
      ],
      note: `© ${new Date().getFullYear()} ${businessName}`,
    },
  };

  const keys = pageKeys.length ? pageKeys : (["home"] as PageKey[]);
  return keys.map((pk) => {
    let sections: ScaffoldSection[];
    switch (pk) {
      case "about":
        sections = [
          hero(pl.about, k.aboutText),
          about,
          steps,
          cta,
          footer,
        ];
        break;
      case "offer":
        sections = [hero(pl.offer, heroSub), offer, steps, faq, cta, footer];
        break;
      case "gallery":
        sections = [hero(pl.gallery, heroSub), gallery, cta, footer];
        break;
      case "pricing":
        sections = [hero(pl.pricing, heroSub), pricing, faq, cta, footer];
        break;
      case "contact":
        sections = [hero(pl.contact, heroSub), contact, footer];
        break;
      default:
        sections = [
          hero(businessName, heroSub),
          feat,
          about,
          steps,
          gallery,
          pricing,
          faq,
          cta,
          footer,
        ];
    }
    return { name: pl[pk], sections };
  });
}
