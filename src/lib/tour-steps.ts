import type { Locale } from "@/lib/i18n/config";

// Eén bron van waarheid voor de 10 rondleidingsstappen — gebruikt door
// zowel de marketing-tour (/zelf-bouwen) als de in-builder onboarding.
export type TourStep = { n: string; t: string; d: string };

export const TOUR_STEPS: Record<Locale, TourStep[]> = {
  nl: [
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
  fr: [
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
  en: [
    { n: "1", t: "Sidebar editor", d: "Click a block and all its settings jump to the top of the sidebar: text, background, pattern, card, links." },
    { n: "2", t: "Live canvas", d: "On the right is your real site. Click a text and just type — no separate fields, no jargon." },
    { n: "3", t: "Hero with slides", d: "Drag photos into the hero, add slides, choose transition, height and a card with blur behind your text." },
    { n: "4", t: "Drag & resize", d: "Photos and text blocks drag anywhere you like and resize with the corner handle." },
    { n: "5", t: "Content assistant", d: "Survey or import of your old site: one click fills everything in, you only fine-tune." },
    { n: "6", t: "Pages & links", d: "Add pages, reorder blocks, and link buttons to a page, a section or a new page." },
    { n: "7", t: "Mobile-independent", d: "Switch to 'mobile' and tweak text, layout or photos for phone only — desktop stays untouched." },
    { n: "8", t: "Header & style sets", d: "One click on a style set fixes colours, font and buttons. Header with sticky, logo, menu icons and CTA." },
    { n: "9", t: "Auto-saves", d: "Everything is saved to your account — stop on your laptop, continue on your phone." },
    { n: "10", t: "Send or go live", d: "Happy? Send it to Studio VM, or put your site live yourself on your subdomain from €39/month." },
  ],
};
