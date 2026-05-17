// Inhoud-assistentie voor de builder: per sector + toon vult dit
// voorbeeldteksten in zodat een leek meteen iets degelijks heeft.
// Niet-destructief: de builder vult enkel lege velden.

export type SectorKey =
  | "restaurant"
  | "salon"
  | "retail"
  | "services"
  | "creative";

type Loc = "nl" | "fr" | "en";
type Tone = "warm" | "zakelijk" | "speels";

export const SECTOR_LABELS: Record<Loc, Record<SectorKey, string>> = {
  nl: {
    restaurant: "Restaurant / horeca",
    salon: "Kapper / schoonheid",
    retail: "Winkel / retail",
    services: "Dienstverlener / KMO",
    creative: "Fotograaf / creatief",
  },
  fr: {
    restaurant: "Restaurant / horeca",
    salon: "Coiffeur / beauté",
    retail: "Boutique / retail",
    services: "Prestataire / PME",
    creative: "Photographe / créatif",
  },
  en: {
    restaurant: "Restaurant / hospitality",
    salon: "Hair / beauty",
    retail: "Shop / retail",
    services: "Service provider / SME",
    creative: "Photographer / creative",
  },
};

export const TONE_LABELS: Record<Loc, Record<Tone, string>> = {
  nl: { warm: "Warm", zakelijk: "Zakelijk", speels: "Speels" },
  fr: { warm: "Chaleureux", zakelijk: "Professionnel", speels: "Décontracté" },
  en: { warm: "Warm", zakelijk: "Professional", speels: "Playful" },
};

// Kern per sector/locale: een eyebrow, sub-zin, 3 troeven (titel+desc),
// 3 stappen, een over-tekst, een FAQ-paar en een CTA.
type Pack = {
  eyebrow: string;
  sub: string;
  button: string;
  features: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  aboutTitle: string;
  aboutText: string;
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaBtn: string;
};

const PACKS: Record<Loc, Record<SectorKey, Pack>> = {
  nl: {
    restaurant: {
      eyebrow: "Welkom",
      sub: "Verse gerechten, een warme sfeer en een vlotte reservatie — alles op één plek.",
      button: "Reserveer een tafel",
      features: [
        { title: "Verse keuken", desc: "Dagelijks vers, met streekproducten." },
        { title: "Gezellige sfeer", desc: "Een plek waar je je meteen thuis voelt." },
        { title: "Vlot reserveren", desc: "In een paar klikken een tafel vast." },
      ],
      steps: [
        { title: "Kies je moment", desc: "Bekijk de beschikbaarheid online." },
        { title: "Reserveer", desc: "Laat je gegevens na, klaar." },
        { title: "Geniet", desc: "Wij zorgen voor de rest." },
      ],
      aboutTitle: "Over ons",
      aboutText:
        "Een familiezaak met passie voor eerlijke gerechten en gastvrijheid. Vertel hier kort jullie verhaal.",
      faq: [
        { q: "Kan ik online reserveren?", a: "Ja, dat kan dag en nacht via deze site." },
        { q: "Houden jullie rekening met allergieën?", a: "Zeker — laat het ons weten bij je reservatie." },
      ],
      ctaTitle: "Zin gekregen?",
      ctaBtn: "Reserveer nu",
    },
    salon: {
      eyebrow: "Welkom",
      sub: "Vakwerk, persoonlijk advies en online een afspraak in een handomdraai.",
      button: "Boek een afspraak",
      features: [
        { title: "Persoonlijk advies", desc: "Een look die bij jou past." },
        { title: "Ervaren handen", desc: "Jaren vakmanschap." },
        { title: "Online boeken", desc: "Kies zelf je moment." },
      ],
      steps: [
        { title: "Kies een behandeling", desc: "Bekijk wat we aanbieden." },
        { title: "Plan je afspraak", desc: "Selecteer dag en uur." },
        { title: "Tot snel", desc: "We maken je mooi." },
      ],
      aboutTitle: "Over de zaak",
      aboutText:
        "Een salon waar kwaliteit en een warm onthaal centraal staan. Vertel hier kort wie je bent.",
      faq: [
        { q: "Moet ik vooraf boeken?", a: "Aanbevolen — zo ben je zeker van je plek." },
        { q: "Welke betaalmiddelen?", a: "Cash en kaart, ter plekke." },
      ],
      ctaTitle: "Klaar voor een nieuwe look?",
      ctaBtn: "Boek nu",
    },
    retail: {
      eyebrow: "Welkom",
      sub: "Een zorgvuldig samengesteld aanbod, eerlijk advies en snelle service.",
      button: "Bekijk het aanbod",
      features: [
        { title: "Doordachte selectie", desc: "Enkel wat we zelf goed vinden." },
        { title: "Echt advies", desc: "We helpen je de juiste keuze maken." },
        { title: "Snelle service", desc: "Vlot geholpen, online en in de winkel." },
      ],
      steps: [
        { title: "Ontdek", desc: "Blader door het aanbod." },
        { title: "Kies", desc: "Twijfel je? We helpen je graag." },
        { title: "Klaar", desc: "Snel opgehaald of geleverd." },
      ],
      aboutTitle: "Onze winkel",
      aboutText:
        "Een lokale zaak met een hart voor kwaliteit en klantencontact. Vertel hier je verhaal.",
      faq: [
        { q: "Kan ik online bestellen?", a: "Ja, en ophalen of laten leveren." },
        { q: "Zijn jullie elke dag open?", a: "Zie de openingsuren op deze site." },
      ],
      ctaTitle: "Iets gevonden?",
      ctaBtn: "Neem contact op",
    },
    services: {
      eyebrow: "Welkom",
      sub: "Heldere afspraken, vakwerk en een aanspreekpunt dat je echt verder helpt.",
      button: "Vraag een offerte",
      features: [
        { title: "Duidelijke afspraken", desc: "Geen verrassingen achteraf." },
        { title: "Vakwerk", desc: "Degelijk en met zorg uitgevoerd." },
        { title: "Persoonlijk contact", desc: "Eén vast aanspreekpunt." },
      ],
      steps: [
        { title: "Vertel je vraag", desc: "Kort wat je nodig hebt." },
        { title: "Voorstel", desc: "Je krijgt een helder plan en prijs." },
        { title: "Uitvoering", desc: "Wij regelen het, jij volgt mee." },
      ],
      aboutTitle: "Over ons",
      aboutText:
        "Een betrouwbare partner met oog voor detail. Vertel hier kort wat je doet en voor wie.",
      faq: [
        { q: "Werken jullie met een vaste prijs?", a: "Ja, je weet vooraf waar je aan toe bent." },
        { q: "Hoe snel kunnen jullie starten?", a: "Neem contact op, we bekijken het samen." },
      ],
      ctaTitle: "Klaar om te starten?",
      ctaBtn: "Vraag je offerte",
    },
    creative: {
      eyebrow: "Welkom",
      sub: "Beeld dat blijft hangen — voor mensen, merken en momenten.",
      button: "Bekijk mijn werk",
      features: [
        { title: "Eigen stijl", desc: "Herkenbaar en authentiek." },
        { title: "Oog voor detail", desc: "Elk beeld klopt." },
        { title: "Vlotte aanpak", desc: "Ontspannen van begin tot eind." },
      ],
      steps: [
        { title: "Kennismaking", desc: "We bespreken je idee." },
        { title: "De shoot", desc: "Ontspannen en met richting." },
        { title: "Oplevering", desc: "Bewerkte beelden, klaar voor gebruik." },
      ],
      aboutTitle: "Over mij",
      aboutText:
        "Ik leg vast wat telt, met een eigen blik. Vertel hier kort wie je bent en wat je drijft.",
      faq: [
        { q: "Wat kost een shoot?", a: "Afhankelijk van de opdracht — vraag gerust een voorstel." },
        { q: "Wanneer krijg ik de foto's?", a: "Doorgaans binnen één à twee weken." },
      ],
      ctaTitle: "Iets in gedachten?",
      ctaBtn: "Neem contact op",
    },
  },
  fr: {
    restaurant: {
      eyebrow: "Bienvenue",
      sub: "Des plats frais, une ambiance chaleureuse et une réservation en ligne facile.",
      button: "Réserver une table",
      features: [
        { title: "Cuisine fraîche", desc: "Chaque jour, avec des produits locaux." },
        { title: "Ambiance conviviale", desc: "On s'y sent tout de suite bien." },
        { title: "Réservation facile", desc: "Une table en quelques clics." },
      ],
      steps: [
        { title: "Choisissez le moment", desc: "Voyez les disponibilités." },
        { title: "Réservez", desc: "Laissez vos coordonnées." },
        { title: "Profitez", desc: "On s'occupe du reste." },
      ],
      aboutTitle: "À propos",
      aboutText:
        "Une affaire familiale, passionnée par la cuisine honnête et l'accueil. Racontez votre histoire ici.",
      faq: [
        { q: "Puis-je réserver en ligne ?", a: "Oui, jour et nuit via ce site." },
        { q: "Tenez-vous compte des allergies ?", a: "Bien sûr — précisez-le à la réservation." },
      ],
      ctaTitle: "Envie de venir ?",
      ctaBtn: "Réserver",
    },
    salon: {
      eyebrow: "Bienvenue",
      sub: "Savoir-faire, conseils personnalisés et rendez-vous en ligne en un clin d'œil.",
      button: "Prendre rendez-vous",
      features: [
        { title: "Conseil personnalisé", desc: "Un look qui vous ressemble." },
        { title: "Mains expertes", desc: "Des années de métier." },
        { title: "Réservation en ligne", desc: "Choisissez votre moment." },
      ],
      steps: [
        { title: "Choisissez un soin", desc: "Voyez nos prestations." },
        { title: "Planifiez", desc: "Sélectionnez jour et heure." },
        { title: "À bientôt", desc: "On s'occupe de vous." },
      ],
      aboutTitle: "À propos",
      aboutText:
        "Un salon où la qualité et l'accueil priment. Présentez-vous brièvement ici.",
      faq: [
        { q: "Faut-il réserver ?", a: "Conseillé — pour être sûr de votre créneau." },
        { q: "Moyens de paiement ?", a: "Cash et carte, sur place." },
      ],
      ctaTitle: "Prêt pour un nouveau look ?",
      ctaBtn: "Réserver",
    },
    retail: {
      eyebrow: "Bienvenue",
      sub: "Une sélection soignée, des conseils honnêtes et un service rapide.",
      button: "Voir l'offre",
      features: [
        { title: "Sélection soignée", desc: "Uniquement ce qu'on aime." },
        { title: "Vrais conseils", desc: "On vous aide à bien choisir." },
        { title: "Service rapide", desc: "En ligne et en boutique." },
      ],
      steps: [
        { title: "Découvrez", desc: "Parcourez l'offre." },
        { title: "Choisissez", desc: "Un doute ? On vous aide." },
        { title: "C'est prêt", desc: "Retrait ou livraison rapide." },
      ],
      aboutTitle: "Notre boutique",
      aboutText:
        "Un commerce local attaché à la qualité et au contact. Racontez votre histoire ici.",
      faq: [
        { q: "Puis-je commander en ligne ?", a: "Oui, retrait ou livraison." },
        { q: "Ouvert tous les jours ?", a: "Voir les horaires sur ce site." },
      ],
      ctaTitle: "Quelque chose vous plaît ?",
      ctaBtn: "Nous contacter",
    },
    services: {
      eyebrow: "Bienvenue",
      sub: "Des accords clairs, du savoir-faire et un interlocuteur qui vous fait avancer.",
      button: "Demander un devis",
      features: [
        { title: "Accords clairs", desc: "Sans surprises." },
        { title: "Savoir-faire", desc: "Du travail soigné." },
        { title: "Contact personnel", desc: "Un interlocuteur fixe." },
      ],
      steps: [
        { title: "Votre demande", desc: "Dites-nous ce qu'il vous faut." },
        { title: "Proposition", desc: "Un plan et un prix clairs." },
        { title: "Réalisation", desc: "On s'en occupe, vous suivez." },
      ],
      aboutTitle: "À propos",
      aboutText:
        "Un partenaire fiable, attentif au détail. Décrivez brièvement votre activité.",
      faq: [
        { q: "Travaillez-vous à prix fixe ?", a: "Oui, vous savez à quoi vous attendre." },
        { q: "Délai de démarrage ?", a: "Contactez-nous, on regarde ensemble." },
      ],
      ctaTitle: "Prêt à démarrer ?",
      ctaBtn: "Demander un devis",
    },
    creative: {
      eyebrow: "Bienvenue",
      sub: "Des images qui marquent — pour des personnes, des marques, des moments.",
      button: "Voir mon travail",
      features: [
        { title: "Style propre", desc: "Reconnaissable et authentique." },
        { title: "Sens du détail", desc: "Chaque image juste." },
        { title: "Approche fluide", desc: "Détendu du début à la fin." },
      ],
      steps: [
        { title: "Rencontre", desc: "On parle de votre idée." },
        { title: "La séance", desc: "Détendue et guidée." },
        { title: "Livraison", desc: "Images retouchées, prêtes." },
      ],
      aboutTitle: "À propos",
      aboutText:
        "Je capte l'essentiel, avec un regard propre. Présentez-vous brièvement ici.",
      faq: [
        { q: "Quel est le prix ?", a: "Selon la mission — demandez une proposition." },
        { q: "Quand reçois-je les photos ?", a: "En général sous une à deux semaines." },
      ],
      ctaTitle: "Une idée en tête ?",
      ctaBtn: "Nous contacter",
    },
  },
  en: {
    restaurant: {
      eyebrow: "Welcome",
      sub: "Fresh dishes, a warm atmosphere and easy online booking — all in one place.",
      button: "Book a table",
      features: [
        { title: "Fresh kitchen", desc: "Daily fresh, with local produce." },
        { title: "Cosy atmosphere", desc: "You feel at home right away." },
        { title: "Easy booking", desc: "A table in a few clicks." },
      ],
      steps: [
        { title: "Pick your moment", desc: "Check availability online." },
        { title: "Book", desc: "Leave your details, done." },
        { title: "Enjoy", desc: "We take care of the rest." },
      ],
      aboutTitle: "About us",
      aboutText:
        "A family business with a passion for honest food and hospitality. Tell your story here.",
      faq: [
        { q: "Can I book online?", a: "Yes, day and night via this site." },
        { q: "Do you handle allergies?", a: "Of course — let us know when booking." },
      ],
      ctaTitle: "Tempted?",
      ctaBtn: "Book now",
    },
    salon: {
      eyebrow: "Welcome",
      sub: "Craft, personal advice and online booking in no time.",
      button: "Book an appointment",
      features: [
        { title: "Personal advice", desc: "A look that suits you." },
        { title: "Expert hands", desc: "Years of craft." },
        { title: "Online booking", desc: "Pick your own moment." },
      ],
      steps: [
        { title: "Choose a treatment", desc: "See what we offer." },
        { title: "Plan it", desc: "Select day and time." },
        { title: "See you soon", desc: "We'll take care of you." },
      ],
      aboutTitle: "About",
      aboutText:
        "A salon where quality and a warm welcome come first. Introduce yourself here.",
      faq: [
        { q: "Should I book ahead?", a: "Recommended — to be sure of your slot." },
        { q: "Payment methods?", a: "Cash and card, on site." },
      ],
      ctaTitle: "Ready for a new look?",
      ctaBtn: "Book now",
    },
    retail: {
      eyebrow: "Welcome",
      sub: "A carefully curated range, honest advice and fast service.",
      button: "See the range",
      features: [
        { title: "Curated selection", desc: "Only what we rate ourselves." },
        { title: "Real advice", desc: "We help you choose right." },
        { title: "Fast service", desc: "Online and in store." },
      ],
      steps: [
        { title: "Discover", desc: "Browse the range." },
        { title: "Choose", desc: "Unsure? We're happy to help." },
        { title: "Done", desc: "Quick pickup or delivery." },
      ],
      aboutTitle: "Our shop",
      aboutText:
        "A local business that cares about quality and contact. Tell your story here.",
      faq: [
        { q: "Can I order online?", a: "Yes, pickup or delivery." },
        { q: "Open every day?", a: "See the opening hours on this site." },
      ],
      ctaTitle: "Found something?",
      ctaBtn: "Get in touch",
    },
    services: {
      eyebrow: "Welcome",
      sub: "Clear agreements, craft and a contact who genuinely helps you forward.",
      button: "Request a quote",
      features: [
        { title: "Clear agreements", desc: "No surprises afterwards." },
        { title: "Craft", desc: "Solid, careful work." },
        { title: "Personal contact", desc: "One fixed point of contact." },
      ],
      steps: [
        { title: "Your question", desc: "Tell us what you need." },
        { title: "Proposal", desc: "A clear plan and price." },
        { title: "Delivery", desc: "We handle it, you follow along." },
      ],
      aboutTitle: "About us",
      aboutText:
        "A reliable partner with an eye for detail. Briefly describe what you do and for whom.",
      faq: [
        { q: "Do you work at a fixed price?", a: "Yes, you know upfront where you stand." },
        { q: "How fast can you start?", a: "Get in touch, we'll look at it together." },
      ],
      ctaTitle: "Ready to start?",
      ctaBtn: "Request your quote",
    },
    creative: {
      eyebrow: "Welcome",
      sub: "Images that stick — for people, brands and moments.",
      button: "See my work",
      features: [
        { title: "Own style", desc: "Recognisable and authentic." },
        { title: "Eye for detail", desc: "Every image is right." },
        { title: "Smooth approach", desc: "Relaxed from start to finish." },
      ],
      steps: [
        { title: "Intro chat", desc: "We discuss your idea." },
        { title: "The shoot", desc: "Relaxed and guided." },
        { title: "Delivery", desc: "Edited images, ready to use." },
      ],
      aboutTitle: "About me",
      aboutText:
        "I capture what matters, with my own eye. Introduce yourself briefly here.",
      faq: [
        { q: "What does a shoot cost?", a: "Depends on the job — ask for a proposal." },
        { q: "When do I get the photos?", a: "Usually within one to two weeks." },
      ],
      ctaTitle: "Something in mind?",
      ctaBtn: "Get in touch",
    },
  },
};

// Toon kleurt enkel de hero-subzin licht (warm/zakelijk/speels).
const TONE_PREFIX: Record<Loc, Record<Tone, string>> = {
  nl: { warm: "Welkom — ", zakelijk: "", speels: "Hey! " },
  fr: { warm: "Bienvenue — ", zakelijk: "", speels: "Hé ! " },
  en: { warm: "Welcome — ", zakelijk: "", speels: "Hey! " },
};

export function buildPreset(
  sector: SectorKey,
  tone: Tone,
  locale: string,
  businessName: string,
): Record<string, Record<string, unknown>> {
  const loc: Loc =
    locale === "fr" || locale === "en" ? locale : "nl";
  const k = PACKS[loc][sector];
  const sub = `${TONE_PREFIX[loc][tone]}${k.sub}`;
  return {
    hero: {
      eyebrow: k.eyebrow,
      heading: businessName,
      sub,
      button: k.button,
    },
    features: {
      items: k.features.map((f) => ({ ...f })),
    },
    steps: {
      items: k.steps.map((f) => ({ ...f })),
    },
    about: { title: k.aboutTitle, text: k.aboutText },
    faq: { items: k.faq.map((f) => ({ ...f })) },
    cta: { title: k.ctaTitle, text: k.sub, button: k.ctaBtn },
    newsletter: { title: k.ctaTitle, text: k.sub, button: k.ctaBtn },
  };
}
