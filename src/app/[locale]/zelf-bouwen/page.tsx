import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, PenTool, Check } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import {
  PUBLISH_SETUP_CENTS,
  PUBLISH_BASE_MONTHLY_CENTS,
} from "@/lib/pricing";
import { BuilderTour } from "@/components/builder-tour";

type Copy = {
  metaTitle: string;
  metaDesc: string;
  eyebrow: string;
  title: string;
  lead: string;
  cta: string;
  stepsTitle: string;
  steps: { n: string; t: string; d: string }[];
  tourTitle: string;
  tourLead: string;
  tour: { n: string; t: string; d: string }[];
  featTitle: string;
  feats: { t: string; d: string }[];
  forTitle: string;
  forText: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  endTitle: string;
  endText: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Zelf je website bouwen — Studio VM",
    metaDesc:
      "Bouw je volledige website zelf met de live builder van Studio VM: slepen, foto's, slides, kleuren, lettertypes. Stuur het door en ik werk het af.",
    eyebrow: "Zelf bouwen",
    title: "Bouw je website zelf — ik geef hem de finishing touch.",
    lead: "Geen ervaring nodig. Kies een sector, beantwoord drie vragen en je hebt een volledige startsite. Pas teksten aan, sleep foto's, kies kleuren en lettertypes — en stuur het naar Studio VM zodra je tevreden bent. Geen verplichting, je kan op elk toestel verder.",
    cta: "Open de builder",
    stepsTitle: "Hoe het werkt",
    steps: [
      { n: "01", t: "Kies je startpunt", d: "Beantwoord de mini-survey (sector, toon, pagina's) of lees je huidige site automatisch in. Je site staat meteen grof klaar." },
      { n: "02", t: "Maak het van jou", d: "Bewerk alle teksten ter plekke, sleep foto's in de hero en in elk blok, pas kleuren, achtergronden en lettertypes aan." },
      { n: "03", t: "Controleer", d: "De Klaar-assistent overloopt lege velden, links en tips in gewone taal — voor een eerste-keer-bouwer." },
      { n: "04", t: "Stuur door", d: "Eén klik naar Studio VM. Ik werk het professioneel af, zet het live en jij volgt alles in je portaal." },
    ],
    tourTitle: "Rondleiding: zo ziet de builder eruit",
    tourLead: "De cijfers hieronder wijzen aan waar je wat doet. Alles gebeurt visueel — wat je ziet, is wat je krijgt.",
    tour: [
      { n: "1", t: "Zijbalk-editor", d: "Klik een blok aan en alle instellingen ervan springen bovenaan de zijbalk: tekst, achtergrond, patroon, kaart, links." },
      { n: "2", t: "Live canvas", d: "Rechts zie je je echte site. Klik op een tekst en typ gewoon — geen aparte velden, geen technische taal." },
      { n: "3", t: "Hero met slides", d: "Sleep foto's in de hero, voeg slides toe, kies overgang, hoogte en een kaart met blur achter je tekst." },
      { n: "4", t: "Slepen & schalen", d: "Foto's en tekstblokken sleep je vrij waar je wil en maak je groter of kleiner met de hoekgreep." },
      { n: "5", t: "Inhoud-assistent", d: "Survey of import van je oude site: in één klik staat alles grof ingevuld, jij hoeft enkel bij te schaven." },
      { n: "6", t: "Pagina's & links", d: "Voeg pagina's toe, herschik blokken, en koppel knoppen aan een pagina, sectie of een nieuwe pagina." },
      { n: "7", t: "Mobiel-onafhankelijk", d: "Schakel naar 'mobiel' en pas tekst, lay-out of foto's enkel voor gsm aan — desktop blijft ongemoeid." },
      { n: "8", t: "Header & stijlsets", d: "Eén klik op een stijlset zet kleuren, lettertype en knoppen goed. Header met sticky, logo, menu-iconen en CTA." },
      { n: "9", t: "Bewaart vanzelf", d: "Alles wordt automatisch op je account bewaard — stop op je laptop, ga verder op je gsm." },
      { n: "10", t: "Versturen of zelf live", d: "Tevreden? Verstuur het naar Studio VM, óf zet je site zelf online op je subdomein vanaf €39/maand." },
    ],
    featTitle: "Alle toeters en bellen",
    feats: [
      { t: "Hero-slides", d: "Meerdere foto's met eigen tekst per slide, vrij versleepbaar, hoogte, kaart met blur, 6 overgangstypes, regelbare duur en rotatie-volgorde." },
      { t: "Foto-bijschrift", d: "Naam + uitleg per foto, vrij te plaatsen in elke hoek of waar je wil, met eigen kaartstijl." },
      { t: "Vrije foto/tekst-laag", d: "Plaats op élk blok foto's of tekst, sleep ze overal naartoe en maak ze groter of kleiner." },
      { t: "Foto per kaart", d: "Elke dienst- of teamkaart krijgt een echte foto, met instelbare grootte en blur." },
      { t: "Achtergronden", d: "30 tinten plus subtiele patronen (stippen, strepen, raster…) met eigen kleur en dekking per blok." },
      { t: "Kaart-stijlen", d: "Glas, vol, lijn, zacht of plat — met regelbare breedte, dekking, kleur en blur." },
      { t: "Typografie", d: "~30 lettertypes (in hun eigen stijl getoond), tekst-uitlijning links/midden/rechts en schaal." },
      { t: "Kleuren & thema's", d: "Acht thema's plus volledig eigen kleuren voor achtergrond, tekst en accent." },
      { t: "Links", d: "Koppel knoppen aan een pagina, een sectie, een webadres — of maak meteen een nieuwe pagina." },
      { t: "Pagina's", d: "Onbeperkt pagina's, blokken herschikken via slepen, dupliceren en verwijderen." },
      { t: "20+ blokken", d: "Hero, diensten, stappen, team, prijzen, FAQ, galerij, kaart, nieuwsbrief, footer in kolommen, en meer." },
      { t: "Inhoud-assistent", d: "Survey met ~130 sectoren of import van je bestaande site — een volledige startsite in seconden." },
      { t: "Klaar-assistent", d: "Controleert lege velden, links en geeft tips in gewone taal vóór je verstuurt." },
      { t: "Animaties", d: "Blokken zweven sierlijk in beeld bij het scrollen; hover-effect op kaarten." },
      { t: "Formulierblok", d: "Stel zelf een contact-/aanvraagformulier samen: kies de velden en types." },
      { t: "SEO per pagina", d: "Eigen Google-titel en omschrijving per pagina, met lengtetellers." },
      { t: "Gekoppelde blokken", d: "Maak een blok één keer en koppel het — wijzig je het, dan verandert het overal." },
      { t: "Deelbare preview", d: "Deel een link naar je ontwerp zodat anderen meekijken vóór je verstuurt." },
      { t: "Toegankelijk", d: "Alt-tekst per foto en een contrast-waarschuwing voor leesbare kleuren." },
      { t: "Responsief", d: "Per blok instelbaar: verbergen op gsm, lay-out (kolommen of lijst)." },
      { t: "Versies", d: "Ongedaan maken / opnieuw (Ctrl+Z) — nooit angst om iets te proberen." },
      { t: "Overal verder", d: "Automatisch bewaard op je account; hervat op gsm, tablet of laptop." },
    ],
    forTitle: "Voor wie?",
    forText:
      "Voor wie het zelf in handen wil nemen zonder technische kennis. Jij bepaalt de inhoud en de sfeer; ik zorg voor de professionele afwerking, snelheid, SEO en het live zetten. Het beste van twee werelden.",
    faqTitle: "Veelgestelde vragen",
    faq: [
      { q: "Moet ik iets installeren?", a: "Nee. Alles gebeurt in je browser, ook op gsm of tablet — niets te downloaden." },
      { q: "Heb ik technische kennis nodig?", a: "Geen enkele. Je klikt op tekst en typt; je sleept foto's. Geen code, geen jargon." },
      { q: "Kan ik later nog wijzigen?", a: "Ja. Je werkt in concepten, bewaart automatisch en stuurt door wanneer je tevreden bent." },
      { q: "Wat als ik vastloop?", a: "De Klaar-assistent geeft tips in gewone taal, en je kan het altijd half-af doorsturen — ik vul aan." },
      { q: "Kost dit extra?", a: "Nee, zelf bouwen is gratis. Je betaalt pas wanneer je een pakket vastlegt via de configurator." },
      { q: "Kan ik mijn huidige site overnemen?", a: "Ja. Geef je webadres in en we lezen naam, teksten, foto's en contact ruw in als startpunt." },
      { q: "Werkt het op mijn gsm?", a: "Ja, de builder werkt op gsm, tablet en computer. Je kan op het ene toestel beginnen en op het andere verder." },
      { q: "Worden mijn wijzigingen bewaard?", a: "Automatisch, op je account. Je verliest niets als je het venster sluit." },
      { q: "Kan ik meerdere ontwerpen maken?", a: "Ja. Maak verschillende concepten, vergelijk ze en stuur het beste door." },
      { q: "Hoe krijg ik mijn site online?", a: "Je stuurt je ontwerp naar Studio VM. Ik werk het professioneel af, doe de SEO en zet het live op jouw domein." },
      { q: "Kan ik foto's gebruiken?", a: "Zeker. Sleep ze in de hero, in blokken of als losse laag. Geen foto's? Dan regelen we een shoot." },
      { q: "Wat als ik niet tevreden ben met het resultaat?", a: "We werken in rondes. Je ziet alles op een staging-URL en geeft feedback tot het klopt." },
      { q: "Moet ik alles zelf invullen?", a: "Nee. De inhoud-assistent vult een volledige voorbeeldsite in; jij past enkel aan wat je wil." },
      { q: "Krijg ik mijn site in eigen beheer?", a: "Ja, de code is van jou (eigen GitHub-repo). Geen lock-in." },
    ],
    endTitle: "Klaar om te beginnen?",
    endText: "Open de builder en zie binnen een minuut je eerste site staan.",
  },
  fr: {
    metaTitle: "Construisez votre site vous-même — Studio VM",
    metaDesc:
      "Construisez votre site avec le builder en direct de Studio VM : glisser-déposer, photos, slides, couleurs, polices. Envoyez-le, je le finalise.",
    eyebrow: "Construire",
    title: "Construisez votre site — je lui donne la touche finale.",
    lead: "Aucune expérience requise. Choisissez un secteur, répondez à trois questions et vous avez un site complet. Adaptez les textes, glissez des photos, choisissez couleurs et polices — puis envoyez-le à Studio VM. Sans engagement, reprenez sur n'importe quel appareil.",
    cta: "Ouvrir le builder",
    stepsTitle: "Comment ça marche",
    steps: [
      { n: "01", t: "Votre point de départ", d: "Répondez au mini-questionnaire (secteur, ton, pages) ou importez votre site actuel. La base est prête immédiatement." },
      { n: "02", t: "Rendez-le vôtre", d: "Modifiez les textes sur place, glissez des photos dans le hero et chaque bloc, ajustez couleurs, fonds et polices." },
      { n: "03", t: "Contrôlez", d: "L'assistant final passe en revue les champs vides, les liens et donne des conseils simples." },
      { n: "04", t: "Envoyez", d: "Un clic vers Studio VM. Je le finalise, le mets en ligne, vous suivez tout dans votre portail." },
    ],
    tourTitle: "Visite : à quoi ressemble le builder",
    tourLead: "Les numéros ci-dessous indiquent où vous faites quoi. Tout est visuel — ce que vous voyez est ce que vous obtenez.",
    tour: [
      { n: "1", t: "Éditeur latéral", d: "Cliquez un bloc et tous ses réglages apparaissent en haut de la barre : texte, fond, motif, carte, liens." },
      { n: "2", t: "Canevas en direct", d: "À droite, votre vrai site. Cliquez sur un texte et tapez — pas de champs séparés, pas de jargon." },
      { n: "3", t: "Hero avec slides", d: "Glissez des photos dans le hero, ajoutez des slides, choisissez transition, hauteur et une carte avec flou." },
      { n: "4", t: "Glisser & redimensionner", d: "Photos et blocs de texte se glissent où vous voulez et s'agrandissent via la poignée d'angle." },
      { n: "5", t: "Assistant de contenu", d: "Questionnaire ou import de votre ancien site : tout est pré-rempli, vous n'avez qu'à peaufiner." },
      { n: "6", t: "Pages & liens", d: "Ajoutez des pages, réorganisez les blocs, et liez les boutons à une page, une section ou une nouvelle page." },
      { n: "7", t: "Indépendant mobile", d: "Passez en 'mobile' et adaptez texte, mise en page ou photos pour le GSM uniquement — le desktop reste intact." },
      { n: "8", t: "En-tête & styles", d: "Un clic sur un style règle couleurs, police et boutons. En-tête sticky, logo, icônes de menu et CTA." },
      { n: "9", t: "Sauvegarde auto", d: "Tout est enregistré sur votre compte — arrêtez sur le portable, continuez sur le mobile." },
      { n: "10", t: "Envoi ou en ligne", d: "Satisfait ? Envoyez à Studio VM, ou mettez votre site en ligne vous-même sur votre sous-domaine dès 39 €/mois." },
    ],
    featTitle: "Toutes les options",
    feats: [
      { t: "Slides hero", d: "Plusieurs photos avec texte par slide, déplaçables, hauteur, carte avec flou, 6 transitions, durée et ordre de rotation réglables." },
      { t: "Légende photo", d: "Nom + description par photo, placée librement dans n'importe quel coin, avec son style de carte." },
      { t: "Couche photo/texte libre", d: "Ajoutez sur chaque bloc des photos ou du texte, déplacez-les partout, agrandissez/réduisez." },
      { t: "Photo par carte", d: "Chaque carte service ou équipe reçoit une vraie photo, taille et flou réglables." },
      { t: "Arrière-plans", d: "30 nuances plus des motifs subtils (points, rayures, grille…) avec couleur et opacité par bloc." },
      { t: "Styles de carte", d: "Verre, plein, contour, doux ou plat — largeur, opacité, couleur et flou réglables." },
      { t: "Typographie", d: "~30 polices (montrées dans leur style), alignement gauche/centre/droite et échelle." },
      { t: "Couleurs & thèmes", d: "Huit thèmes plus des couleurs personnalisées pour fond, texte et accent." },
      { t: "Liens", d: "Liez les boutons à une page, une section, une adresse web — ou créez une nouvelle page." },
      { t: "Pages", d: "Pages illimitées, blocs réorganisables par glisser, duplication et suppression." },
      { t: "20+ blocs", d: "Hero, services, étapes, équipe, tarifs, FAQ, galerie, carte, newsletter, pied de page en colonnes, etc." },
      { t: "Assistant de contenu", d: "Questionnaire avec ~130 secteurs ou import de votre site — un site complet en quelques secondes." },
      { t: "Assistant final", d: "Vérifie les champs vides, les liens et donne des conseils simples avant l'envoi." },
      { t: "Animations", d: "Les blocs apparaissent en douceur au défilement ; effet survol sur les cartes." },
      { t: "Bloc formulaire", d: "Composez vous-même un formulaire : choisissez les champs et types." },
      { t: "SEO par page", d: "Titre et description Google propres par page, avec compteurs." },
      { t: "Blocs liés", d: "Créez un bloc une fois et liez-le — modifiez-le et il change partout." },
      { t: "Aperçu partageable", d: "Partagez un lien vers votre maquette avant de l'envoyer." },
      { t: "Accessible", d: "Texte alternatif par photo et alerte de contraste pour la lisibilité." },
      { t: "Responsive", d: "Par bloc : masquer sur mobile, mise en page (colonnes ou liste)." },
      { t: "Versions", d: "Annuler / rétablir (Ctrl+Z) — osez tout essayer." },
      { t: "Partout", d: "Enregistré sur votre compte ; reprenez sur mobile, tablette ou ordinateur." },
    ],
    forTitle: "Pour qui ?",
    forText:
      "Pour ceux qui veulent garder la main sans compétences techniques. Vous décidez le contenu et l'ambiance ; je m'occupe de la finition pro, la vitesse, le SEO et la mise en ligne.",
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Dois-je installer quelque chose ?", a: "Non. Tout se passe dans le navigateur, aussi sur mobile — rien à télécharger." },
      { q: "Faut-il des compétences techniques ?", a: "Aucune. Vous cliquez sur le texte et tapez ; vous glissez des photos. Pas de code." },
      { q: "Puis-je modifier plus tard ?", a: "Oui. Vous travaillez en brouillons, enregistrés automatiquement." },
      { q: "Et si je bloque ?", a: "L'assistant donne des conseils simples, et vous pouvez envoyer même inachevé — je complète." },
      { q: "Est-ce payant ?", a: "Non, construire est gratuit. Vous payez seulement en validant un forfait via le configurateur." },
      { q: "Puis-je reprendre mon site actuel ?", a: "Oui. Indiquez votre adresse web et on importe nom, textes, photos et contact comme base." },
      { q: "Ça marche sur mobile ?", a: "Oui, sur mobile, tablette et ordinateur. Commencez sur l'un, continuez sur l'autre." },
      { q: "Mes modifications sont-elles sauvées ?", a: "Automatiquement, sur votre compte. Rien n'est perdu." },
      { q: "Puis-je faire plusieurs maquettes ?", a: "Oui. Créez plusieurs concepts, comparez et envoyez le meilleur." },
      { q: "Comment mon site arrive-t-il en ligne ?", a: "Vous m'envoyez la maquette. Je finalise, fais le SEO et mets en ligne sur votre domaine." },
      { q: "Puis-je utiliser des photos ?", a: "Bien sûr. Dans le hero, les blocs ou en couche libre. Pas de photos ? On organise un shooting." },
      { q: "Et si le résultat ne me plaît pas ?", a: "On travaille en plusieurs rondes, vous validez tout sur une URL de test." },
      { q: "Dois-je tout remplir moi-même ?", a: "Non. L'assistant remplit un site exemple complet ; vous n'adaptez que ce que vous voulez." },
      { q: "Le site est-il à moi ?", a: "Oui, le code vous appartient (votre dépôt GitHub). Aucun verrouillage." },
    ],
    endTitle: "Prêt à commencer ?",
    endText: "Ouvrez le builder et voyez votre première version en une minute.",
  },
  en: {
    metaTitle: "Build your own website — Studio VM",
    metaDesc:
      "Build your full website with Studio VM's live builder: drag & drop, photos, slides, colours, fonts. Send it over and I finish it.",
    eyebrow: "Build it",
    title: "Build your site yourself — I give it the finishing touch.",
    lead: "No experience needed. Pick a sector, answer three questions and you have a full starter site. Edit text, drag photos, choose colours and fonts — then send it to Studio VM when you're happy. No commitment, continue on any device.",
    cta: "Open the builder",
    stepsTitle: "How it works",
    steps: [
      { n: "01", t: "Your starting point", d: "Answer the mini-survey (sector, tone, pages) or import your current site. The draft is ready instantly." },
      { n: "02", t: "Make it yours", d: "Edit text in place, drag photos into the hero and any block, adjust colours, backgrounds and fonts." },
      { n: "03", t: "Check", d: "The almost-done assistant reviews empty fields, links and gives plain-language tips." },
      { n: "04", t: "Send it", d: "One click to Studio VM. I finish it professionally, take it live, you track it in your portal." },
    ],
    tourTitle: "Tour: what the builder looks like",
    tourLead: "The numbers below point out where you do what. Everything is visual — what you see is what you get.",
    tour: [
      { n: "1", t: "Sidebar editor", d: "Click a block and all its settings jump to the top of the sidebar: text, background, pattern, card, links." },
      { n: "2", t: "Live canvas", d: "On the right is your real site. Click a text and just type — no separate fields, no jargon." },
      { n: "3", t: "Hero with slides", d: "Drag photos into the hero, add slides, pick transition, height and a card with blur behind your text." },
      { n: "4", t: "Drag & resize", d: "Photos and text blocks drag anywhere you like and resize with the corner handle." },
      { n: "5", t: "Content assistant", d: "Survey or import of your old site: one click fills everything in, you only fine-tune." },
      { n: "6", t: "Pages & links", d: "Add pages, reorder blocks, and link buttons to a page, a section or a new page." },
      { n: "7", t: "Mobile-independent", d: "Switch to 'mobile' and tweak text, layout or photos for phone only — desktop stays untouched." },
      { n: "8", t: "Header & style sets", d: "One click on a style set fixes colours, font and buttons. Header with sticky, logo, menu icons and CTA." },
      { n: "9", t: "Auto-saves", d: "Everything is saved to your account — stop on your laptop, continue on your phone." },
      { n: "10", t: "Send or go live", d: "Happy? Send it to Studio VM, or put your site live yourself on your subdomain from €39/month." },
    ],
    featTitle: "All the bells & whistles",
    feats: [
      { t: "Hero slides", d: "Multiple photos with per-slide text, freely draggable, height, card with blur, 6 transitions, adjustable timing and rotation order." },
      { t: "Photo caption", d: "Name + description per photo, freely placed in any corner, with its own card style." },
      { t: "Free photo/text layer", d: "Add photos or text to any block, drag them anywhere, resize them." },
      { t: "Photo per card", d: "Every service or team card gets a real photo, with adjustable size and blur." },
      { t: "Backgrounds", d: "30 shades plus subtle patterns (dots, stripes, grid…) with own colour and opacity per block." },
      { t: "Card styles", d: "Glass, solid, outline, soft or flat — adjustable width, opacity, colour and blur." },
      { t: "Typography", d: "~30 fonts (shown in their own style), text alignment left/centre/right and scale." },
      { t: "Colours & themes", d: "Eight themes plus fully custom colours for background, text and accent." },
      { t: "Links", d: "Link buttons to a page, a section, a web address — or create a new page on the spot." },
      { t: "Pages", d: "Unlimited pages, blocks reorderable by drag, duplicate and delete." },
      { t: "20+ blocks", d: "Hero, services, steps, team, pricing, FAQ, gallery, map, newsletter, columned footer, and more." },
      { t: "Content assistant", d: "Survey with ~130 sectors or import of your existing site — a full starter site in seconds." },
      { t: "Almost-done assistant", d: "Checks empty fields, links and gives plain-language tips before you send." },
      { t: "Animations", d: "Blocks glide in on scroll; hover effect on cards." },
      { t: "Form block", d: "Build your own contact/request form: choose the fields and types." },
      { t: "Per-page SEO", d: "Own Google title and description per page, with length counters." },
      { t: "Linked blocks", d: "Build a block once and link it — change it and it changes everywhere." },
      { t: "Shareable preview", d: "Share a link to your design so others can look before you send." },
      { t: "Accessible", d: "Alt text per photo and a contrast warning for readable colours." },
      { t: "Responsive", d: "Per block: hide on mobile, layout (columns or list)." },
      { t: "Versions", d: "Undo / redo (Ctrl+Z) — never afraid to try something." },
      { t: "Anywhere", d: "Saved to your account; resume on phone, tablet or laptop." },
    ],
    forTitle: "Who is it for?",
    forText:
      "For anyone who wants to take the lead without technical skills. You decide content and feel; I handle the professional finish, speed, SEO and going live.",
    faqTitle: "Frequently asked",
    faq: [
      { q: "Do I need to install anything?", a: "No. It all runs in your browser, also on phone or tablet — nothing to download." },
      { q: "Do I need technical skills?", a: "None. You click text and type; you drag photos. No code, no jargon." },
      { q: "Can I change it later?", a: "Yes. You work in drafts, auto-saved, and send when happy." },
      { q: "What if I get stuck?", a: "The assistant gives plain-language tips, and you can send it half-finished — I complete it." },
      { q: "Does it cost extra?", a: "No, building is free. You only pay when you lock a package via the configurator." },
      { q: "Can I reuse my current site?", a: "Yes. Enter your web address and we roughly import name, text, photos and contact as a starting point." },
      { q: "Does it work on mobile?", a: "Yes, on phone, tablet and computer. Start on one device, continue on another." },
      { q: "Are my changes saved?", a: "Automatically, to your account. Nothing is lost if you close the window." },
      { q: "Can I make several drafts?", a: "Yes. Create different concepts, compare them and send the best one." },
      { q: "How does my site get online?", a: "You send the draft to Studio VM. I finish it, do the SEO and take it live on your domain." },
      { q: "Can I use photos?", a: "Sure. In the hero, in blocks or as a free layer. No photos? We arrange a shoot." },
      { q: "What if I don't like the result?", a: "We work in rounds; you review everything on a staging URL until it's right." },
      { q: "Do I have to fill everything in myself?", a: "No. The content assistant fills a full example site; you only adjust what you want." },
      { q: "Do I own the site?", a: "Yes, the code is yours (your own GitHub repo). No lock-in." },
    ],
    endTitle: "Ready to start?",
    endText: "Open the builder and see your first version within a minute.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const c = copy[locale];
  return { title: c.metaTitle, description: c.metaDesc };
}

export default async function ZelfBouwenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const builder = localePath(locale, "/builder");
  const setup = Math.round(PUBLISH_SETUP_CENTS / 100);
  const month = Math.round(PUBLISH_BASE_MONTHLY_CENTS / 100);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              {c.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {c.lead}
            </p>
            <Link
              href={builder}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <PenTool className="h-4 w-4" strokeWidth={2} />
              {c.cta}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="rounded-3xl border border-accent bg-accent/5 p-7 text-center shadow-[0_0_0_1px_var(--accent)] sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              {locale === "fr"
                ? "Site web en abonnement"
                : locale === "en"
                  ? "Website subscription"
                  : "Website-abonnement"}
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-tight">
              €{setup}
            </p>
            <p className="text-xs text-muted">
              {locale === "fr"
                ? "démarrage unique"
                : locale === "en"
                  ? "one-off setup"
                  : "eenmalige opstart"}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-accent">
              €{month}
              <span className="text-base font-normal text-muted">
                {" "}
                {locale === "fr"
                  ? "/ mois"
                  : locale === "en"
                    ? "/ month"
                    : "/ maand"}
              </span>
            </p>
            <p className="mt-2 text-xs text-muted">
              {locale === "fr"
                ? "Hébergement, entretien & mises à jour inclus. Résiliable chaque mois."
                : locale === "en"
                  ? "Hosting, maintenance & updates included. Cancel any month."
                  : "Hosting, onderhoud & updates inbegrepen. Maandelijks opzegbaar."}
            </p>
            <Link
              href={builder}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              <PenTool className="h-3.5 w-3.5" strokeWidth={2} />
              {locale === "fr"
                ? "Essayer gratuitement"
                : locale === "en"
                  ? "Try it free"
                  : "Gratis uitproberen"}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.stepsTitle}
          </h2>
          <div className="space-y-6">
            {c.steps.map((s) => (
              <article
                key={s.n}
                className="flex gap-5 rounded-2xl border bg-card p-6 sm:p-8"
              >
                <span className="font-mono text-2xl font-semibold text-accent">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-muted">{s.d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BuilderTour title={c.tourTitle} lead={c.tourLead} steps={c.tour} />

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.featTitle}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {c.feats.map((f) => (
              <div key={f.t} className="rounded-2xl border bg-card p-6">
                <p className="flex items-center gap-2 font-semibold tracking-tight">
                  <Check
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2.5}
                  />
                  {f.t}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.forTitle}
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">
            {c.forText}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <h2 className="mb-12 font-mono text-xs uppercase tracking-widest text-accent">
            {c.faqTitle}
          </h2>
          <div className="space-y-4">
            {c.faq.map((q) => (
              <div key={q.q} className="rounded-2xl border bg-card p-6">
                <p className="font-semibold tracking-tight">{q.q}</p>
                <p className="mt-2 text-muted">{q.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(() => {
        const setup = Math.round(PUBLISH_SETUP_CENTS / 100);
        const month = Math.round(PUBLISH_BASE_MONTHLY_CENTS / 100);
        const z =
          locale === "fr"
            ? {
                eb: "Prix & ce que vous obtenez",
                h: "Un seul forfait clair",
                p: "Pas de devis avec astérisques. Vous construisez, nous mettons en ligne et entretenons.",
                inc: [
                  "Éditeur visuel complet — chaque bloc & élément réglable",
                  "Indépendant mobile (desktop & GSM séparés)",
                  "En ligne en 1 clic sur votre sous-domaine + SSL",
                  "En-tête personnalisable (sticky, logo, menu, CTA)",
                  "Formulaires → mails soignés + boîte dans le portail",
                  "Hébergement, sauvegardes, mises à jour de sécurité",
                  "Reprenez sur n'importe quel appareil, sauvegarde auto",
                  "Résiliable chaque mois — sans engagement",
                ],
                extra:
                  "Besoin de plus ? Modules en option : langues, SEO, domaine propre, mini-boutique — votre prix mensuel grandit avec vous.",
                setupL: "démarrage unique",
                perM: "/ mois",
              }
            : locale === "en"
              ? {
                  eb: "Pricing & what you get",
                  h: "One clear package",
                  p: "No quotes with asterisks. You build, we publish and maintain.",
                  inc: [
                    "Full visual editor — every block & item adjustable",
                    "Mobile-independent (desktop & phone separately)",
                    "Live in one click on your subdomain + SSL",
                    "Customisable header (sticky, logo, menu, CTA)",
                    "Forms → polished mails + inbox in your portal",
                    "Hosting, backups, security updates",
                    "Resume on any device, auto-save",
                    "Cancel any month — no lock-in",
                  ],
                  extra:
                    "Need more? Optional modules: languages, SEO, custom domain, mini-webshop — your monthly price grows with you.",
                  setupL: "one-off setup",
                  perM: "/ month",
                }
              : {
                  eb: "Prijs & wat je krijgt",
                  h: "Eén helder pakket",
                  p: "Geen offertes met sterretjes. Jij bouwt, wij zetten online en onderhouden.",
                  inc: [
                    "Volledige visuele editor — elk blok & item regelbaar",
                    "Mobiel-onafhankelijk (desktop & gsm apart)",
                    "In 1 klik live op je subdomein + SSL",
                    "Aanpasbare header (sticky, logo, menu, CTA)",
                    "Formulieren → verzorgde mails + inbox in je portaal",
                    "Hosting, back-ups, security-updates",
                    "Hervat op elk toestel, auto-opslaan",
                    "Maandelijks opzegbaar — geen verplichtingen",
                  ],
                  extra:
                    "Meer nodig? Optionele modules: talen, SEO, eigen domein, mini-webshop — je maandprijs groeit met je mee.",
                  setupL: "eenmalige opstart",
                  perM: "/ maand",
                };
        return (
          <section className="border-b">
            <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
                {z.eb}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {z.h}
              </h2>
              <p className="mt-3 max-w-2xl text-muted">{z.p}</p>
              <div className="mt-8 grid gap-8 rounded-3xl border border-accent bg-accent/5 p-8 shadow-[0_0_0_1px_var(--accent)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {z.inc.map((i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        strokeWidth={2.5}
                      />
                      {i}
                    </li>
                  ))}
                </ul>
                <div className="shrink-0 rounded-2xl border bg-background p-7 text-center lg:w-64">
                  <p className="text-3xl font-semibold tracking-tight">
                    €{setup}
                  </p>
                  <p className="text-xs text-muted">{z.setupL}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-accent">
                    €{month}
                    <span className="text-sm font-normal text-muted">
                      {" "}
                      {z.perM}
                    </span>
                  </p>
                  <Link
                    href={builder}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
                  >
                    <PenTool className="h-3.5 w-3.5" strokeWidth={2} />
                    {c.cta}
                  </Link>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted">{z.extra}</p>
            </div>
          </section>
        );
      })()}

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {c.endTitle}
          </h2>
          <p className="mt-4 text-muted">{c.endText}</p>
          <Link
            href={builder}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <PenTool className="h-4 w-4" strokeWidth={2} />
            {c.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}
