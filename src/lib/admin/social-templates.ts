// Social-berichten: de sjablonen van de contentmachine.
//
// Studio VM maakt 3D-ontwerpmodellen voor machinesturing. Elk bericht:
//   - spreekt als "we" (Studio VM) en zegt "u" (NL) / "vous" (FR) tegen de lezer;
//   - bevat GEEN link: Facebook telt links in berichten én reacties (±2 per
//     maand per pagina). Links lopen via profiel, bio en actieknop (UTM), en
//     hoogstens 2 linkberichten per maand (link_post, zie social-generator);
//   - heeft hoogstens 5 hashtags: #machinesturing #grondverzet (NL) of
//     #guidage #terrassement (FR) + één systeem- of onderwerptag;
//   - noemt nooit een persoonsnaam, nooit een plaatsnaam van een werf en nooit
//     een beschermde beroepstitel (enkel "3D-topograaf" / "topographe 3D").
// Beelden zijn taalloos; NL en FR zijn aparte berichten (nooit tweetalig).
//
// Soorten (post_type): tip, vraag, carrousel (kennis), realisatie, aanbod,
// video. De generator (social-generator.ts) plant er elke week vier in.

import { CATEGORIEEN, REALISATIES, UITGELICHT, type Categorie, type Systeem } from "@/lib/realisaties";
import { UURTARIEF_CENT, euro, type Categorie as TariefCategorie } from "@/lib/tarieven";
import { UTM_BRONNEN } from "@/lib/utm";

// ============================================================================
// Vaste waarden (gedeeld door generator, mail, acties en admin)
// ============================================================================

export type Taal = "nl" | "fr" | "en" | "de";
export const TALEN: Taal[] = ["nl", "fr", "en", "de"];
export const TAAL_LABEL: Record<Taal, string> = { nl: "Nederlands", fr: "Frans", en: "Engels", de: "Duits" };

export type PostType = "tip" | "vraag" | "carrousel" | "realisatie" | "aanbod" | "video";
export const POST_TYPES: PostType[] = ["tip", "vraag", "carrousel", "realisatie", "aanbod", "video"];
export const POST_TYPE_LABEL: Record<PostType, string> = {
  tip: "Tip",
  vraag: "Vraag",
  carrousel: "Carrousel",
  realisatie: "Realisatie",
  aanbod: "Aanbod",
  video: "Video",
};
/** Soorten die op een akkoord wachten: een realisatie kan klantgegevens tonen. */
export const GOEDKEURING_VERPLICHT: readonly PostType[] = ["realisatie"];

export type Kanaal =
  | "facebook"
  | "instagram"
  | "google"
  | "youtube"
  | "tiktok"
  | "pinterest"
  | "x"
  | "threads"
  | "bluesky";
export const KANALEN: Kanaal[] = ["facebook", "instagram", "google", "youtube", "tiktok", "pinterest", "x", "threads", "bluesky"];
export function isKanaal(v: unknown): v is Kanaal {
  return typeof v === "string" && (KANALEN as string[]).includes(v);
}

/** Labels, ook voor oude rijen (algemeen, linkedin) die leesbaar moeten blijven. */
export const KANAAL_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google Bedrijfsprofiel",
  youtube: "YouTube Shorts",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  x: "X",
  threads: "Threads",
  bluesky: "Bluesky",
  algemeen: "Algemeen",
  linkedin: "LinkedIn (oud)",
};

/** Welke kanalen een bericht standaard krijgt, per soort plaats. */
export const STANDAARD_KANALEN: Record<"feed" | "google" | "story" | "reel", Kanaal[]> = {
  feed: ["facebook", "instagram", "threads", "bluesky", "x", "pinterest"],
  google: ["google"],
  story: ["instagram", "facebook"],
  reel: ["instagram", "facebook", "youtube", "tiktok"],
};

export type PlaatsSoort = keyof typeof STANDAARD_KANALEN;

/** Soort plaats van een bericht (oude "algemeen"-rijen tellen als Google). */
export function plaatsSoort(p: { post_kind?: string | null; platform?: string | null }): PlaatsSoort {
  if (p.post_kind === "reel") return "reel";
  if (p.post_kind === "story") return "story";
  if (p.platform === "google" || p.platform === "algemeen") return "google";
  return "feed";
}

/**
 * Kanalen die bij een plaats kunnen: een Google-bericht enkel naar Google,
 * een story of reel enkel naar de kanalen die dat formaat kennen, een gewoon
 * bericht overal behalve Google (dat heeft zijn eigen bericht en formaat).
 */
export function kanalenVoorPlaats(plaats: PlaatsSoort): Kanaal[] {
  if (plaats === "feed") return KANALEN.filter((k) => k !== "google");
  return [...STANDAARD_KANALEN[plaats]];
}

/**
 * utm_source-waarden die als social tellen: de bronnen van lib/utm.ts, plus
 * "twitter" voor oude links. Outreach en andere mails tellen niet mee.
 */
export const SOCIAL_BRONNEN: string[] = [...UTM_BRONNEN, "twitter"];

/** Statussen. De laatste vier zijn van vóór migratie 0050 en blijven leesbaar. */
export type SocialStatus =
  | "concept"
  | "goedgekeurd"
  | "gepland"
  | "gepubliceerd"
  | "mislukt"
  | "overgeslagen"
  | "idee"
  | "klaar"
  | "gepost"
  | "gearchiveerd";
export type NieuweStatus = "concept" | "goedgekeurd" | "gepland" | "gepubliceerd" | "mislukt" | "overgeslagen";
export const NIEUWE_STATUSSEN: NieuweStatus[] = ["concept", "goedgekeurd", "gepland", "gepubliceerd", "mislukt", "overgeslagen"];
export function isNieuweStatus(v: unknown): v is NieuweStatus {
  return typeof v === "string" && (NIEUWE_STATUSSEN as string[]).includes(v);
}
/**
 * Zolang migratie 0050 niet gedraaid is, kent de databank enkel de oude
 * waarden. Goedkeuren, plannen en "mislukt" bestaan dan niet: die worden
 * geweigerd in plaats van op "klaar" te belanden. "klaar" betekent NIET
 * goedgekeurd (de oude dagelijkse machine zette er honderden drafts op).
 * Afspraak met de publisher: enkel status = 'goedgekeurd' met een
 * scheduled_for die voorbij is, en enkel als kolom post_type bestaat.
 */
export const OUDE_STATUS: Partial<Record<NieuweStatus, "concept" | "gepost" | "gearchiveerd">> = {
  concept: "concept",
  gepubliceerd: "gepost",
  overgeslagen: "gearchiveerd",
};
/** Een oude waarde gelezen als de nieuwe. */
export function nieuweStatus(s: string | null | undefined): NieuweStatus {
  switch (s) {
    case "idee":
    case "klaar":
      return "concept";
    case "gepost":
      return "gepubliceerd";
    case "gearchiveerd":
      return "overgeslagen";
    default:
      return isNieuweStatus(s) ? s : "concept";
  }
}

// ============================================================================
// Tekstcontrole: wat nooit in een gepubliceerd bericht mag
// ============================================================================

const VERBODEN: Array<[RegExp, string]> = [
  [/landmeter/i, "landmeter (beschermde titel)"],
  [/g[ée]om[èe]tre/i, "géomètre (beschermde titel)"],
  [/land\s?surveyor/i, "land surveyor (beschermde titel)"],
  [/vermessungsingenieur/i, "Vermessungsingenieur (beschermde titel)"],
  [/\bmv3d\b/i, "MV3D"],
  [/convertor/i, "Convertor"],
  [/linked\s?in/i, "LinkedIn"],
  [/vincent|montreuil/i, "een persoonsnaam"],
];
const LINK = /(https?:\/\/|www\.|wa\.me|\b[a-z0-9-]+\.(?:be|com|nl|fr|eu|lu|net|org|io|de)\b)/i;

/** Problemen die een bericht tegenhouden van automatisch publiceren. Leeg = in orde. */
export function tekstProblemen(p: {
  title?: string | null;
  body?: string | null;
  tekst_kort?: string | null;
  hashtags?: string | null;
}): string[] {
  const uit: string[] = [];
  const alles = [p.title, p.body, p.tekst_kort, p.hashtags].filter(Boolean).join("\n");
  if (LINK.test(alles)) uit.push("bevat een link of webadres (links horen in profiel, bio of knop)");
  for (const [re, label] of VERBODEN) if (re.test(alles)) uit.push(`bevat ${label}`);
  const tags = new Set(
    [p.body, p.hashtags]
      .filter(Boolean)
      .join(" ")
      .match(/#[\p{L}\p{N}_]+/gu) ?? [],
  );
  if (tags.size > 5) uit.push(`${tags.size} hashtags (hoogstens 5)`);
  if ((p.tekst_kort ?? "").length > 250) uit.push("korte tekst langer dan 250 tekens");
  return uit;
}

// ============================================================================
// Sjablonen
// ============================================================================

export type Tekst = {
  /** Kop op het beeld en interne titel (± 45 tekens). */
  kop: string;
  /** Bijschrift voor Facebook, Instagram, Threads en Pinterest. Zonder link. */
  body: string;
  /** Hoogstens ± 200 tekens, voor X en Bluesky; de hashtags komen erachter. */
  kort: string;
  /** Hoogstens 5. */
  tags: string[];
};

/** Eén dia van een carrousel (kennis): de kaartmaker kan ze later apart tekenen. */
export type Dia = { kop: string; tekst: string; beeld?: string };

export type RealisatieKeuze = {
  id: string;
  cat: Categorie;
  systemen: Systeem[];
  nl: { titel: string; tekst: string; cat: string };
  fr: { titel: string; tekst: string; cat: string };
  /** Donkere render van het project (kan .webp zijn). */
  beeld: string;
};

export type TemplateCtx = { realisatie?: RealisatieKeuze };

export type Template = {
  id: string;
  type: PostType;
  /** Doelpagina zonder taal, bv. "/kennis/coordinatenstelsels". */
  doel: string;
  /** Bronbeeld voor de social-kaart (pad in /public; .png, .jpg of .webp). */
  kaart: string | ((ctx: TemplateCtx) => string);
  /** Projectbeeld om mee te sturen. */
  beeld?: (ctx: TemplateCtx) => string | undefined;
  /** Kiest de generator vooraf een realisatie voor dit sjabloon? */
  realisatie?: boolean;
  tekst: Record<"nl" | "fr", (ctx: TemplateCtx) => Tekst> & Partial<Record<"en" | "de", (ctx: TemplateCtx) => Tekst>>;
  /** Variant voor het Google Bedrijfsprofiel (NL, zonder hashtags). */
  google?: (ctx: TemplateCtx) => { kop: string; body: string };
  /** Dia's voor een carrousel. */
  dias?: Record<"nl" | "fr", Dia[]>;
};

// ---------- Hulp ----------

const NL_BASIS = ["#machinesturing", "#grondverzet"];
const FR_BASIS = ["#guidage", "#terrassement"];
const nl = (extra: string) => [...NL_BASIS, extra];
const fr = (extra: string) => [...FR_BASIS, extra];

const CTA_NL = "Plannen doorsturen voor een prijs? Dat kan via de link in ons profiel.";
const CTA_FR = "Un prix pour vos plans ? Envoyez-les via le lien de notre profil.";

const eur = (c: TariefCategorie, l: "nl" | "fr" = "nl") => euro(UURTARIEF_CENT[c], l);

const SYSTEEM_TAG: Record<Systeem, string> = {
  Trimble: "#Trimble",
  Topcon: "#Topcon",
  Leica: "#Leica",
  Unicontrol: "#Unicontrol",
  CHCNAV: "#CHCNAV",
  Komatsu: "#Komatsu",
  Caterpillar: "#Caterpillar",
};

const CAT_ZIN: Record<Categorie, { nl: string; fr: string }> = {
  wegenis: {
    nl: "Bij wegenis zit de nauwkeurigheid in de details: verkanting in de bochten, aansluitingen op bestaande wegen, boordstenen en goten op het juiste peil.",
    fr: "En voirie, la précision est dans les détails : dévers dans les courbes, raccords aux voiries existantes, bordures et filets d'eau au bon niveau.",
  },
  grondwerk: {
    nl: "Platformen op verschillende niveaus, overgangstaluds en funderingsputten op eigen diepte: alles zit in één model, per laag te kiezen in de cabine.",
    fr: "Plateformes à plusieurs niveaux, talus de transition, puits de fondation à leur propre profondeur : tout est dans un seul modèle, couche par couche en cabine.",
  },
  bouwput: {
    nl: "Bodem op niveau, taluds op de juiste helling, putten en sleuven elk op hun eigen diepte. De machinist ziet in de cabine meteen hoeveel er nog af moet.",
    fr: "Fond de fouille à niveau, talus à la bonne pente, puits et tranchées chacun à sa profondeur. En cabine, le conducteur voit directement ce qu'il reste à enlever.",
  },
  terrein: {
    nl: "Een goed model van de bestaande toestand is de basis: daarop sluit het ontwerp aan, en daarmee ziet u hoeveel grond er af moet of bij komt.",
    fr: "Un bon modèle de l'existant est la base : le projet s'y raccorde, et il montre combien de terre déblayer ou remblayer.",
  },
};

/** Alle realisaties die de generator kan kiezen. */
export const REALISATIE_IDS: string[] = REALISATIES.map((r) => r.id);

export function realisatieKeuze(id?: string, cat?: Categorie): RealisatieKeuze {
  const pool = cat ? REALISATIES.filter((r) => r.cat === cat) : REALISATIES;
  const r =
    (id ? REALISATIES.find((x) => x.id === id) : undefined) ??
    pool[Math.floor(Math.random() * pool.length)] ??
    REALISATIES[0]!;
  return {
    id: r.id,
    cat: r.cat,
    systemen: r.systemen,
    nl: { titel: r.nl.titel, tekst: r.nl.tekst, cat: CATEGORIEEN[r.cat].nl },
    fr: { titel: r.fr.titel, tekst: r.fr.tekst, cat: CATEGORIEEN[r.cat].fr },
    beeld: r.donker,
  };
}

const UITGRAVING = UITGELICHT.find((u) => u.id === "uitgraving") ?? UITGELICHT[0]!;

// ---------- De sjablonen ----------

export const TEMPLATES: Template[] = [
  // ── TIPS ────────────────────────────────────────────────────────────────
  {
    id: "tip-gekend-punt",
    type: "tip",
    doel: "/kennis/controle-en-toleranties",
    kaart: "/3d/h/parking-hellingen-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Eerst controleren, dan graven",
        body: `Laad een nieuw model nooit in om meteen te beginnen graven.

Controleer eerst op de werf:
1. Wordt het project gevonden en geopend?
2. Ligt het model op de verwachte plaats ten opzichte van de machine?
3. Klopt de hoogte op een gekend punt?
4. Zijn alle lagen aanwezig?

Wij controleren elk model op niveaus en hellingen voor het vertrekt. De laatste controle gebeurt op de werf, met uw machine, uw kalibratie en uw softwareversie.

Twee minuten controle tegenover een halve dag herstelwerk.`,
        kort: "Nieuw model op de machine? Controleer eerst op een gekend punt: ligging, hoogte en lagen. Twee minuten controle tegenover een halve dag herstelwerk.",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Contrôler d'abord, terrasser ensuite",
        body: `Ne chargez jamais un nouveau modèle pour commencer à terrasser tout de suite.

Contrôlez d'abord sur chantier :
1. Le projet est-il trouvé et ouvert ?
2. Le modèle est-il au bon endroit par rapport à la machine ?
3. L'altitude est-elle juste sur un point connu ?
4. Toutes les couches sont-elles présentes ?

Nous contrôlons chaque modèle, niveaux et pentes, avant livraison. Le dernier contrôle se fait sur chantier, avec votre machine, votre calibration et votre version de logiciel.

Deux minutes de contrôle contre une demi-journée de reprise.`,
        kort: "Nouveau modèle dans la machine ? Contrôlez d'abord sur un point connu : position, altitude et couches. Deux minutes contre une demi-journée de reprise.",
        tags: fr("#GNSS"),
      }),
    },
    google: () => ({
      kop: "Eerst controleren, dan graven",
      body: "Een nieuw 3D-model op de machine? Controleer eerst op een gekend punt: ligging, hoogte en alle lagen. Wij controleren elk model vóór levering op niveaus en hellingen; de laatste controle gebeurt op de werf, met uw eigen machine en kalibratie.",
    }),
  },
  {
    id: "tip-breeklijnen",
    type: "tip",
    doel: "/kennis/lijnwerk-en-breeklijnen",
    kaart: "/3d/terrein-lijnwerk.jpg",
    tekst: {
      nl: () => ({
        kop: "Breeklijnen maken het verschil",
        body: `Een 3D-model is meer dan een wolk hoogtepunten.

Zonder correcte breeklijnen trekt het driehoeksnet dwars door boordstenen, taludkanten en grachten. Op het scherm ziet dat er vlot uit, maar op de werf graaft de machine een afgeronde kant waar een scherpe hoek hoort.

Daarom bouwen we elk model op met lijnwerk:
• assen en kantlijnen
• boordstenen en goten
• taludvoet en taludkruin
• grachten en aansluitingen

Dat lijnwerk stuurt het oppervlak en helpt de machinist zich te oriënteren in de cabine.`,
        kort: "Zonder breeklijnen trekt het driehoeksnet dwars door boordstenen en taludkanten. Daarom bouwen we elk model op met lijnwerk: assen, boordstenen, taluds en grachten.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Les lignes de rupture font la différence",
        body: `Un modèle 3D, c'est plus qu'un nuage de points.

Sans lignes de rupture correctes, le réseau de triangles traverse bordures, crêtes de talus et fossés. À l'écran, tout semble lisse ; sur chantier, la machine arrondit un angle qui devait être net.

C'est pourquoi chaque modèle est construit avec ses lignes :
• axes et bords
• bordures et filets d'eau
• pied et crête de talus
• fossés et raccords

Ces lignes guident la surface et aident le conducteur à se repérer en cabine.`,
        kort: "Sans lignes de rupture, le réseau de triangles traverse bordures et crêtes de talus. Chaque modèle est donc construit avec ses lignes : axes, bordures, talus, fossés.",
        tags: fr("#modele3D"),
      }),
    },
  },
  {
    id: "tip-lagen",
    type: "tip",
    doel: "/kennis/wat-is-een-3d-model",
    kaart: "/3d/relief-grondwerk-donker.png",
    tekst: {
      nl: () => ({
        kop: "Eén werf, meerdere lagen",
        body: `Een wegproject of bouwput heeft zelden één ontwerpniveau.

Voor de machine maken we per fase een apart oppervlak:
• uitgravingsniveau of bodem van de bouwput
• bovenkant (onder)fundering
• afgewerkt niveau, bijvoorbeeld onderkant verharding
• taluds, grachten en aansluitingen op het bestaande terrein

Zo kiest de machinist in de cabine gewoon de laag waarop hij werkt. Zonder rekenen, zonder piketten.`,
        kort: "Een werf heeft zelden één ontwerpniveau. Wij maken per fase een apart oppervlak: uitgraving, fundering, afgewerkt niveau. De machinist kiest gewoon de juiste laag.",
        tags: nl("#wegenbouw"),
      }),
      fr: () => ({
        kop: "Un chantier, plusieurs couches",
        body: `Un projet routier ou une fouille a rarement un seul niveau de projet.

Pour la machine, nous créons une surface par phase :
• fond de fouille ou niveau de déblai
• dessus de (sous-)fondation
• niveau fini, par exemple sous revêtement
• talus, fossés et raccords au terrain existant

En cabine, le conducteur choisit simplement la couche sur laquelle il travaille. Sans calcul, sans piquets.`,
        kort: "Un chantier a rarement un seul niveau. Nous créons une surface par phase : déblai, fondation, niveau fini. En cabine, le conducteur choisit la bonne couche.",
        tags: fr("#voirie"),
      }),
    },
  },
  {
    id: "tip-pdf",
    type: "tip",
    doel: "/kennis/van-pdf-naar-model",
    kaart: "/3d/terrein-hoogtelijnen-donker.png",
    tekst: {
      nl: () => ({
        kop: "Enkel een PDF? Dat kan ook",
        body: `Niet elk project komt met CAD-bestanden. Soms is er alleen een PDF, of zelfs een papieren plan.

Ook daaruit bouwen we een 3D-model. Het plan wordt eerst op schaal en op coördinaten gebracht, aan de hand van gekende punten of het rooster op de tekening. Daarna volgen het lijnwerk en de oppervlakken, net als bij een DWG.

Goed om te weten:
• het vraagt meer tijd, en dat ziet u terug in het geschatte aantal uren in de offerte;
• de nauwkeurigheid hangt af van het document: een scan van een papieren plan is minder nauwkeurig dan een digitale PDF.

Heeft de ontwerper een DWG? Vraag die altijd op. Het scheelt tijd en centimeters.`,
        kort: "Enkel een PDF of een papieren plan? Ook daaruit bouwen we een 3D-model: eerst op schaal en op coördinaten, dan lijnwerk en oppervlakken. Een DWG blijft sneller.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Seulement un PDF ? C'est possible",
        body: `Tous les projets n'arrivent pas avec des fichiers DAO. Parfois, il n'y a qu'un PDF, voire un plan papier.

Nous en tirons aussi un modèle 3D. Le plan est d'abord mis à l'échelle et calé en coordonnées, grâce à des points connus ou au quadrillage du dessin. Viennent ensuite les lignes et les surfaces, comme pour un DWG.

Bon à savoir :
• cela demande plus de temps, ce qui se reflète dans le nombre d'heures estimé du devis ;
• la précision dépend du document : un plan papier scanné est moins précis qu'un PDF numérique.

Le bureau d'études a un DWG ? Demandez-le toujours. Vous gagnez du temps et des centimètres.`,
        kort: "Seulement un PDF ou un plan papier ? Nous en tirons aussi un modèle 3D : mise à l'échelle, calage, puis lignes et surfaces. Un DWG reste plus rapide.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Enkel een PDF? Dat kan ook",
      body: "Geen CAD-bestanden, enkel een PDF of een papieren plan? Ook daaruit maken we een 3D-model voor machinesturing: het plan wordt op schaal en op coördinaten gebracht, daarna volgen lijnwerk en oppervlakken. Een DWG van de ontwerper blijft sneller en nauwkeuriger.",
    }),
  },
  {
    id: "tip-volumes",
    type: "tip",
    doel: "/kennis/grondverzet-en-volumes",
    kaart: "/3d/relief-bouwput-donker.png",
    tekst: {
      nl: () => ({
        kop: "Hoeveel grond gaat er af?",
        body: `Een ontwerpmodel stuurt niet alleen de machine. Samen met een opmeting van het bestaande terrein toont het ook waar er afgegraven en waar er aangevuld wordt, en hoeveel.

Handig voor de planning: hoeveel vrachten, waar de grond naartoe kan, of er een tekort is.

Maar een volumeberekening is maar zo goed als de opmeting waarop ze steunt. Een oude of onvolledige opmeting geeft een mooi getal dat op de werf niet klopt. En zettingen, losse grond en verdichting zitten er niet in.`,
        kort: "Ontwerpmodel plus opmeting van het bestaande terrein: zo ziet u uitgraving en aanvulling. Maar een volume is maar zo goed als de opmeting waarop het steunt.",
        tags: nl("#grondwerken"),
      }),
      fr: () => ({
        kop: "Combien de terre à évacuer ?",
        body: `Un modèle de projet ne guide pas seulement la machine. Avec un levé du terrain existant, il montre aussi où l'on déblaie, où l'on remblaie, et combien.

Pratique pour le planning : combien de camions, où mettre les terres, s'il en manque.

Mais un calcul de volumes ne vaut que par le levé sur lequel il repose. Un levé ancien ou incomplet donne un joli chiffre qui ne colle pas au chantier. Et le tassement, le foisonnement et le compactage n'y sont pas compris.`,
        kort: "Modèle de projet plus levé du terrain existant : déblais et remblais chiffrés. Mais un volume ne vaut que par le levé sur lequel il repose.",
        tags: fr("#travauxpublics"),
      }),
    },
  },
  {
    id: "tip-aanleveren",
    type: "tip",
    doel: "/kennis/wat-aanleveren",
    kaart: "/3d/h/plan-hoogtelijnen-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Wat hebben we van u nodig?",
        body: `De vraag die we het vaakst krijgen: wat moet er allemaal mee met de aanvraag?

Kort: alles wat u zelf voor de uitvoering gebruikt.
• inplantingsplan met coördinaten
• lengte- en dwarsprofielen
• peilen: vloerpeilen, putdeksels, boordstenen
• opmeting van het bestaande terrein, als die er is
• details van aansluitingen, opritten en bouwputten

DWG of DXF heeft de voorkeur: daar zitten de echte coördinaten in. Een PDF kan ook, maar vraagt meer tijd.

Vermeld ook welk systeem op de machine staat en in welk stelsel ze werkt.

${CTA_NL}`,
        kort: "Wat doorsturen voor een 3D-model? Inplantingsplan, profielen, peilen en een opmeting als die er is. Liefst DWG of DXF, en vermeld het systeem op de machine.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "De quoi avons-nous besoin ?",
        body: `La question la plus fréquente : que faut-il envoyer ?

En bref : tout ce que vous utilisez vous-même pour l'exécution.
• plan d'implantation avec coordonnées
• profils en long et en travers
• niveaux : seuils, taques, bordures
• levé du terrain existant, s'il existe
• détails des raccords, accès et fouilles

Le DWG ou le DXF est préférable : les vraies coordonnées y sont. Un PDF est possible, mais demande plus de temps.

Précisez aussi le système installé sur la machine et le système de coordonnées utilisé.

${CTA_FR}`,
        kort: "Que faut-il pour un modèle 3D ? Plan d'implantation, profils, niveaux et levé existant. De préférence en DWG ou DXF, avec le système de la machine.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Wat hebben we van u nodig?",
      body: "Voor een 3D-model voor machinesturing hebben we het inplantingsplan met coördinaten nodig, de lengte- en dwarsprofielen, de peilen en, als die er is, een opmeting van het bestaande terrein. Liefst DWG of DXF. Vermeld ook welk systeem op de machine staat; u krijgt eerst een offerte met het geschatte aantal uren.",
    }),
  },

  // ── CARROUSELS (kennis) ─────────────────────────────────────────────────
  {
    id: "carrousel-stelsels-be",
    type: "carrousel",
    doel: "/kennis/coordinatenstelsels",
    kaart: "/3d/trace-luchtfoto.jpg",
    tekst: {
      nl: () => ({
        kop: "Lambert 72 of Lambert 2008?",
        body: `Lambert 72 of Lambert 2008: op het plan lijkt het een detail. Op de werf is het het verschil tussen een model dat meteen klopt en een machine die het model niet terugvindt.

Een verkeerd stelsel geeft zelden een foutmelding. Het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of op de verkeerde hoogte. En een paar centimeter hoogteverschil valt in de cabine niet op.

Daarom vragen we bij elke opdracht na:
• in welk stelsel het plan getekend is;
• welke hoogtereferentie (TAW of DNG);
• in welk stelsel de machine werkt, en of er een lokale werfkalibratie is.

En vóór de start: altijd controleren op een gekend punt, in ligging en hoogte.`,
        kort: "Lambert 72 of 2008? Een verkeerd stelsel geeft zelden een foutmelding: het model ligt gewoon op de verkeerde plaats of hoogte. Wij vragen stelsel en hoogtereferentie altijd na.",
        tags: nl("#Lambert72"),
      }),
      fr: () => ({
        kop: "Lambert 72 ou Lambert 2008 ?",
        body: `Lambert 72 ou Lambert 2008 : sur le plan, cela ressemble à un détail. Sur chantier, c'est la différence entre un modèle juste et une machine qui ne le retrouve pas.

Un mauvais système ne donne presque jamais de message d'erreur. Le modèle se charge, mais il est décalé, en plan ou en altitude. Et quelques centimètres d'écart ne se voient pas en cabine.

Pour chaque mission, nous vérifions :
• le système dans lequel le plan est dessiné ;
• la référence altimétrique (DNG ou TAW) ;
• le système de la machine, et s'il existe une calibration locale.

Et avant de commencer : toujours contrôler sur un point connu, en plan et en altitude.`,
        kort: "Lambert 72 ou 2008 ? Un mauvais système ne donne presque jamais d'erreur : le modèle est simplement décalé. Nous vérifions toujours le système et la référence altimétrique.",
        tags: fr("#Lambert72"),
      }),
    },
    dias: {
      nl: [
        { kop: "Lambert 72 of 2008?", tekst: "Op het plan een detail, op de werf een verschuiving." },
        { kop: "Geen foutmelding", tekst: "Het model laadt gewoon, maar op de verkeerde plaats of hoogte." },
        { kop: "Hoogte: TAW of DNG", tekst: "Ga altijd de hoogtereferentie van het plan na." },
        { kop: "Machine en model", tekst: "Beide moeten in hetzelfde stelsel werken, met of zonder werfkalibratie." },
        { kop: "Controleer op een gekend punt", tekst: "In ligging en hoogte, vóór de eerste schop." },
      ],
      fr: [
        { kop: "Lambert 72 ou 2008 ?", tekst: "Un détail sur le plan, un décalage sur chantier." },
        { kop: "Aucun message d'erreur", tekst: "Le modèle se charge, mais au mauvais endroit ou à la mauvaise altitude." },
        { kop: "Altitudes : DNG ou TAW", tekst: "Vérifiez toujours la référence altimétrique du plan." },
        { kop: "Machine et modèle", tekst: "Les deux doivent utiliser le même système, avec ou sans calibration locale." },
        { kop: "Contrôlez sur un point connu", tekst: "En plan et en altitude, avant le premier coup de godet." },
      ],
    },
    google: () => ({
      kop: "Lambert 72 of Lambert 2008?",
      body: "Een verkeerd coördinatenstelsel geeft zelden een foutmelding: het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of hoogte. Daarom gaan we bij elke opdracht het stelsel van het plan, de hoogtereferentie (TAW of DNG) en het stelsel van de machine na.",
    }),
  },
  {
    id: "carrousel-stelsels-europa",
    type: "carrousel",
    doel: "/kennis/coordinatenstelsels",
    kaart: "/3d/h/trace-luchtfoto-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Werf over de grens?",
        body: `Steeds meer aannemers werken over de grens. Elk land heeft zijn eigen coördinatenstelsel en hoogtereferentie, en de machine moet exact hetzelfde gebruiken als het model.

De stelsels die we het vaakst tegenkomen:
• België: Lambert 72 of 2008, hoogte TAW/DNG
• Nederland: RD New, hoogte NAP
• Frankrijk: Lambert-93 of CC42–CC50, hoogte NGF-IGN69
• Duitsland: ETRS89 / UTM 32 of 33, hoogte DHHN2016
• Luxemburg: LUREF, hoogte NG95

Staat het stelsel niet op het plan? Dan stellen we er één voor op basis van de ligging van de werf, en vragen we uw bevestiging vóór we beginnen.`,
        kort: "Werf over de grens? België: Lambert 72/2008 en TAW. Nederland: RD en NAP. Frankrijk: Lambert-93 en IGN69. Machine en model moeten hetzelfde stelsel gebruiken.",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Un chantier à l'étranger ?",
        body: `De plus en plus d'entreprises travaillent au-delà des frontières. Chaque pays a son système de coordonnées et sa référence altimétrique, et la machine doit utiliser exactement les mêmes que le modèle.

Les systèmes que nous rencontrons le plus souvent :
• Belgique : Lambert 72 ou 2008, altitudes DNG/TAW
• France : Lambert-93 ou CC42–CC50, altitudes NGF-IGN69
• Luxembourg : LUREF, altitudes NG95
• Pays-Bas : RD New, altitudes NAP
• Allemagne : ETRS89 / UTM 32 ou 33, altitudes DHHN2016

Le système ne figure pas sur le plan ? Nous en proposons un selon la position du chantier et demandons votre confirmation avant de commencer.`,
        kort: "Chantier à l'étranger ? Belgique : Lambert 72/2008 et DNG. France : Lambert-93 et IGN69. Luxembourg : LUREF et NG95. Machine et modèle doivent utiliser le même système.",
        tags: fr("#GNSS"),
      }),
    },
    dias: {
      nl: [
        { kop: "Werf over de grens?", tekst: "Elk land zijn stelsel en zijn hoogtereferentie." },
        { kop: "België", tekst: "Lambert 72 of 2008, hoogte TAW/DNG." },
        { kop: "Nederland", tekst: "RD New, hoogte NAP." },
        { kop: "Frankrijk", tekst: "Lambert-93 of CC42–CC50, hoogte NGF-IGN69." },
        { kop: "Duitsland en Luxemburg", tekst: "ETRS89 / UTM 32 of 33 en DHHN2016; LUREF en NG95." },
      ],
      fr: [
        { kop: "Un chantier à l'étranger ?", tekst: "Chaque pays a son système et sa référence altimétrique." },
        { kop: "Belgique", tekst: "Lambert 72 ou 2008, altitudes DNG/TAW." },
        { kop: "France", tekst: "Lambert-93 ou CC42–CC50, altitudes NGF-IGN69." },
        { kop: "Luxembourg", tekst: "LUREF, altitudes NG95." },
        { kop: "Pays-Bas et Allemagne", tekst: "RD New et NAP ; ETRS89 / UTM 32 ou 33 et DHHN2016." },
      ],
    },
  },
  {
    id: "carrousel-merken",
    type: "carrousel",
    doel: "/kennis/bestanden-per-merk",
    kaart: "/3d/terrein-spectrum.jpg",
    tekst: {
      nl: () => ({
        kop: "Eén model, elk merk zijn formaat",
        body: `Op Belgische werven draaien verschillende merken machinesturing: Trimble, Topcon, Leica, Unicontrol, CHCNAV, en de systemen die Komatsu en Caterpillar af fabriek inbouwen.

Elk systeem leest zijn eigen bestanden, en zelfs binnen één merk verschilt het per softwareversie.

Daarom vragen we bij elke opdracht welk systeem en welke versie op de machine staat. U krijgt het model in precies dat formaat.

Huurt u een machine in met een ander systeem? Dan leveren we hetzelfde model ook in dat formaat, zonder meerprijs.`,
        kort: "Trimble, Topcon, Leica, Unicontrol, CHCNAV: elk systeem leest zijn eigen bestanden. U krijgt het model in het formaat van uw machine, voor een tweede systeem zonder meerprijs.",
        tags: nl("#machinecontrol"),
      }),
      fr: () => ({
        kop: "Un modèle, chaque marque son format",
        body: `Sur les chantiers, plusieurs marques de guidage se côtoient : Trimble, Topcon, Leica, Unicontrol, CHCNAV, et les systèmes montés d'usine par Komatsu et Caterpillar.

Chaque système lit ses propres fichiers, et même au sein d'une marque, cela varie selon la version du logiciel.

C'est pourquoi nous demandons pour chaque mission quel système et quelle version équipent la machine. Vous recevez le modèle exactement dans ce format.

Vous louez une machine avec un autre système ? Nous livrons le même modèle dans ce format aussi, sans supplément.`,
        kort: "Trimble, Topcon, Leica, Unicontrol, CHCNAV : chaque système lit ses propres fichiers. Vous recevez le modèle au format de votre machine, et pour un second système sans supplément.",
        tags: fr("#machinecontrol"),
      }),
    },
    dias: {
      nl: [
        { kop: "Eén model, elk merk zijn formaat", tekst: "Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar." },
        { kop: "Eigen bestanden", tekst: "Elk systeem leest zijn eigen formaat, soms per softwareversie." },
        { kop: "Welk systeem, welke versie?", tekst: "Dat vragen we bij elke opdracht na." },
        { kop: "Tweede systeem op de werf?", tekst: "Hetzelfde model, zonder meerprijs." },
      ],
      fr: [
        { kop: "Un modèle, chaque marque son format", tekst: "Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar." },
        { kop: "Des fichiers propres", tekst: "Chaque système lit son format, parfois selon la version du logiciel." },
        { kop: "Quel système, quelle version ?", tekst: "Nous le demandons pour chaque mission." },
        { kop: "Un second système sur chantier ?", tekst: "Le même modèle, sans supplément." },
      ],
    },
    google: () => ({
      kop: "Eén model, elk merk zijn formaat",
      body: "Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu of Caterpillar: elk systeem voor machinesturing leest zijn eigen bestanden. U krijgt het 3D-model in het formaat van uw machine, en voor een tweede systeem op dezelfde werf zonder meerprijs.",
    }),
  },
  {
    id: "carrousel-weergaven",
    type: "carrousel",
    doel: "/realisaties",
    kaart: "/3d/r/p-platform-hoogte-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Eén model, vier weergaven",
        body: `Een groot werkvlak met een raster van funderingsstroken, elk op zijn eigen niveau.

Hetzelfde model, vier manieren om het te bekijken:
• hoogtekleuren: wat ligt hoger, wat lager?
• helling: watert elke strook correct af?
• hoogtelijnen: leesbaar zoals een klassiek plan
• driehoeksnet: het oppervlak waarop de machine effectief stuurt

De hellingskaart is een vaste controle vóór levering: een strook die verkeerd afwatert, valt daar meteen op.`,
        kort: "Eén model, vier weergaven: hoogtekleuren, helling, hoogtelijnen en driehoeksnet. De hellingskaart is een vaste controle vóór levering.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Un modèle, quatre vues",
        body: `Une grande plateforme avec une trame de semelles, chacune à son propre niveau.

Le même modèle, quatre façons de le lire :
• couleurs hypsométriques : qu'est-ce qui est plus haut ou plus bas ?
• pente : chaque semelle s'écoule-t-elle correctement ?
• courbes de niveau : lisible comme un plan classique
• réseau de triangles : la surface sur laquelle la machine se guide

La carte des pentes est un contrôle systématique avant livraison : une semelle mal orientée saute aux yeux.`,
        kort: "Un modèle, quatre vues : couleurs hypsométriques, pente, courbes de niveau et réseau de triangles. La carte des pentes est un contrôle systématique avant livraison.",
        tags: fr("#modele3D"),
      }),
    },
    dias: {
      nl: [
        { kop: "Hoogtekleuren", tekst: "Wat ligt hoger, wat lager?", beeld: "/3d/r/p-platform-hoogte-donker.webp" },
        { kop: "Helling", tekst: "Watert elke strook correct af?", beeld: "/3d/r/p-platform-helling-donker.webp" },
        { kop: "Hoogtelijnen", tekst: "Leesbaar zoals een klassiek plan.", beeld: "/3d/r/p-platform-hoogtelijn-donker.webp" },
        { kop: "Driehoeksnet", tekst: "Het oppervlak waarop de machine stuurt.", beeld: "/3d/r/p-platform-draad-donker.webp" },
      ],
      fr: [
        { kop: "Couleurs hypsométriques", tekst: "Qu'est-ce qui est plus haut ou plus bas ?", beeld: "/3d/r/p-platform-hoogte-donker.webp" },
        { kop: "Pente", tekst: "Chaque semelle s'écoule-t-elle correctement ?", beeld: "/3d/r/p-platform-helling-donker.webp" },
        { kop: "Courbes de niveau", tekst: "Lisible comme un plan classique.", beeld: "/3d/r/p-platform-hoogtelijn-donker.webp" },
        { kop: "Réseau de triangles", tekst: "La surface sur laquelle la machine se guide.", beeld: "/3d/r/p-platform-draad-donker.webp" },
      ],
    },
    google: () => ({
      kop: "Eén model, vier weergaven",
      body: "Hoogtekleuren, helling, hoogtelijnen en driehoeksnet: elk 3D-model voor machinesturing bekijken we in vier weergaven. De hellingskaart is een vaste controle vóór levering, zodat een strook die verkeerd afwatert meteen opvalt.",
    }),
  },

  // ── REALISATIES (wachten op akkoord) ────────────────────────────────────
  {
    id: "realisatie-project",
    type: "realisatie",
    doel: "/realisaties",
    realisatie: true,
    kaart: (c) => c.realisatie?.beeld ?? "/3d/relief-grondwerk-donker.png",
    beeld: (c) => c.realisatie?.beeld,
    tekst: {
      nl: (c) => {
        const r = c.realisatie ?? realisatieKeuze();
        return {
          kop: r.nl.titel,
          body: `${r.nl.titel} (${r.nl.cat.toLowerCase()})

${r.nl.tekst}

${CAT_ZIN[r.cat].nl}

Van plan naar een model dat de machine meteen kan inladen: ontwerpoppervlak, lijnwerk en hoogtelijnen, in het juiste coördinatenstelsel.`,
          kort: `${r.nl.titel}: ${r.nl.tekst} Van plan naar een model dat de machine meteen kan inladen.`,
          tags: nl(SYSTEEM_TAG[r.systemen[0] ?? "Trimble"]),
        };
      },
      fr: (c) => {
        const r = c.realisatie ?? realisatieKeuze();
        return {
          kop: r.fr.titel,
          body: `${r.fr.titel} (${r.fr.cat.toLowerCase()})

${r.fr.tekst}

${CAT_ZIN[r.cat].fr}

Du plan à un modèle que la machine charge directement : surface de projet, lignes et courbes de niveau, dans le bon système de coordonnées.`,
          kort: `${r.fr.titel} : ${r.fr.tekst} Du plan à un modèle que la machine charge directement.`,
          tags: fr(SYSTEEM_TAG[r.systemen[0] ?? "Trimble"]),
        };
      },
    },
    google: (c) => {
      const r = c.realisatie ?? realisatieKeuze();
      return {
        kop: r.nl.titel,
        body: `Recente realisatie: ${r.nl.titel.toLowerCase()}. ${r.nl.tekst} ${CAT_ZIN[r.cat].nl} We leveren het model voor elk systeem dat u opgeeft.`,
      };
    },
  },
  {
    id: "realisatie-uitgraving",
    type: "realisatie",
    doel: "/realisaties",
    kaart: "/3d/r/p-uitgraving-hoogte-donker.webp",
    beeld: () => "/3d/r/p-uitgraving-hoogte-donker.webp",
    tekst: {
      nl: () => ({
        kop: UITGRAVING.nl.titel,
        body: `${UITGRAVING.nl.titel}

${UITGRAVING.nl.tekst}

Bodem op niveau, taluds op de juiste helling: de machinist ziet in de cabine meteen hoeveel er nog af moet. Geen piketten, geen discussie over het peil.`,
        kort: `${UITGRAVING.nl.titel}: bodem op niveau, taluds op de juiste helling. De machinist ziet in de cabine meteen hoeveel er nog af moet.`,
        tags: nl("#Unicontrol"),
      }),
      fr: () => ({
        kop: UITGRAVING.fr.titel,
        body: `${UITGRAVING.fr.titel}

${UITGRAVING.fr.tekst}

Fond à niveau, talus à la bonne pente : en cabine, le conducteur voit directement ce qu'il reste à enlever. Sans piquets, sans discussion sur le niveau.`,
        kort: `${UITGRAVING.fr.titel} : fond à niveau, talus à la bonne pente. En cabine, le conducteur voit directement ce qu'il reste à enlever.`,
        tags: fr("#Unicontrol"),
      }),
    },
  },

  // ── AANBOD ──────────────────────────────────────────────────────────────
  {
    id: "aanbod-vroegtijdig",
    type: "aanbod",
    doel: "/tarieven",
    kaart: "/3d/terrein-hoogtekleuren.jpg",
    tekst: {
      nl: () => ({
        kop: `Vroeg aanvragen: ${eur("vroegtijdig")}/u`,
        body: `Weet u nu al welke werven de komende maanden starten? Vraag het 3D-model dan vroegtijdig aan.

Meer dan 3 weken op voorhand: ${eur("vroegtijdig")}/u in plaats van ${eur("normaal")}/u (excl. btw).

Het model staat klaar in uw klantenportaal wanneer de machine op de werf komt, met elke revisie erbij.

${CTA_NL}`,
        kort: `Werf over meer dan 3 weken? Dan maken we het 3D-model aan ${eur("vroegtijdig")}/u in plaats van ${eur("normaal")}/u (excl. btw). Plannen doorsturen kan via ons profiel.`,
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: `Anticiper : ${eur("vroegtijdig", "fr")}/h`,
        body: `Vous savez déjà quels chantiers démarrent dans les prochains mois ? Demandez le modèle 3D à l'avance.

Plus de 3 semaines à l'avance : ${eur("vroegtijdig", "fr")}/h au lieu de ${eur("normaal", "fr")}/h (HTVA).

Le modèle vous attend dans votre portail client quand la machine arrive sur chantier, avec chaque révision.

${CTA_FR}`,
        kort: `Chantier dans plus de 3 semaines ? Le modèle 3D à ${eur("vroegtijdig", "fr")}/h au lieu de ${eur("normaal", "fr")}/h (HTVA). Envoyez vos plans via notre profil.`,
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: `Vroeg aanvragen: ${eur("vroegtijdig")}/u`,
      body: `Start uw werf over meer dan 3 weken? Dan maken we het 3D-model voor machinesturing aan ${eur("vroegtijdig")}/u in plaats van ${eur("normaal")}/u (excl. btw). U krijgt eerst een offerte met het geschatte aantal uren, en het model staat klaar in uw klantenportaal.`,
    }),
  },
  {
    id: "aanbod-lastminute",
    type: "aanbod",
    doel: "/offerte",
    kaart: "/3d/weg-trace-donker.png",
    tekst: {
      nl: () => ({
        kop: "Planwijziging? Model in 5 werkdagen",
        body: `Het overkomt elke aannemer: een planwijziging, een werf die vroeger start, een model dat ontbreekt.

Daarvoor is er last-minute: levering binnen 5 werkdagen, aan ${eur("last-minute")}/u excl. btw.

U krijgt eerst een offerte met het geschatte aantal uren. Pas na uw akkoord beginnen we eraan.

${CTA_NL}`,
        kort: `Planwijziging en de machine staat al klaar? Last-minute: 3D-model binnen 5 werkdagen aan ${eur("last-minute")}/u excl. btw, met eerst een offerte.`,
        tags: nl("#wegenbouw"),
      }),
      fr: () => ({
        kop: "Plan modifié ? Modèle en 5 jours",
        body: `Cela arrive à toutes les entreprises : un plan modifié, un chantier avancé, un modèle manquant.

Pour cela, il y a l'urgent : livraison sous 5 jours ouvrables, à ${eur("last-minute", "fr")}/h HTVA.

Vous recevez d'abord un devis avec le nombre d'heures estimé. Nous commençons seulement après votre accord.

${CTA_FR}`,
        kort: `Plan modifié et la machine attend ? En urgence : modèle 3D sous 5 jours ouvrables à ${eur("last-minute", "fr")}/h HTVA, avec d'abord un devis.`,
        tags: fr("#voirie"),
      }),
    },
    google: () => ({
      kop: "Planwijziging? Model in 5 werkdagen",
      body: `Een planwijziging of een werf die vroeger start? Met last-minute leveren we het 3D-model voor machinesturing binnen 5 werkdagen, aan ${eur("last-minute")}/u excl. btw. U krijgt eerst een offerte met het geschatte aantal uren.`,
    }),
  },
  {
    id: "aanbod-meersystemen",
    type: "aanbod",
    doel: "/3d-modellen",
    kaart: "/3d/r/p-platform-draad-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Twee merken op één werf?",
        body: `Een eigen graafmachine met Trimble, een ingehuurde dozer met Topcon, een onderaannemer met Unicontrol. Op veel werven draait meer dan één systeem.

Het onderliggende model is identiek, alleen de verpakking verschilt. Daarom leveren we hetzelfde model voor elk systeem dat u opgeeft, zonder meerprijs.

Zo volgen alle machines op de werf exact hetzelfde ontwerp.`,
        kort: "Trimble op de graafmachine, Topcon op de dozer? We leveren hetzelfde model voor elk systeem dat u opgeeft, zonder meerprijs. Zo volgen alle machines hetzelfde ontwerp.",
        tags: nl("#machinecontrol"),
      }),
      fr: () => ({
        kop: "Deux marques sur un chantier ?",
        body: `Une pelle en propre avec Trimble, un bouteur loué avec Topcon, un sous-traitant avec Unicontrol. Sur beaucoup de chantiers, plusieurs systèmes se côtoient.

Le modèle de base est identique, seul l'emballage change. Nous livrons donc le même modèle pour chaque système indiqué, sans supplément.

Ainsi, toutes les machines suivent exactement le même projet.`,
        kort: "Trimble sur la pelle, Topcon sur le bouteur ? Nous livrons le même modèle pour chaque système indiqué, sans supplément. Toutes les machines suivent le même projet.",
        tags: fr("#machinecontrol"),
      }),
    },
    google: () => ({
      kop: "Twee merken op één werf?",
      body: "Draait er meer dan één systeem voor machinesturing op uw werf? We leveren hetzelfde 3D-model voor elk systeem dat u opgeeft, zonder meerprijs. Zo volgen alle machines exact hetzelfde ontwerp.",
    }),
  },
  {
    id: "aanbod-portaal",
    type: "aanbod",
    doel: "/3d-modellen",
    kaart: "/3d/h/relief-bouwput-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Elke revisie op één plek",
        body: `Planwijziging na planwijziging, en welke versie staat nu eigenlijk op de machine?

Bij elk model krijgt u een eigen klantenportaal. Daar downloadt u de bestanden, met elke revisie apart. Revisies na een planwijziging gebeuren aan hetzelfde uurtarief.

Geen zoekwerk in mailboxen, geen verouderde versie op de USB-stick.`,
        kort: "Welke versie staat nu op de machine? In uw klantenportaal staat elk model met elke revisie apart. Geen zoekwerk in mailboxen, geen oude versie op de USB-stick.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Chaque révision au même endroit",
        body: `Modification après modification : quelle version se trouve réellement dans la machine ?

Chaque modèle est accompagné d'un portail client. Vous y téléchargez les fichiers, chaque révision séparément. Les révisions après une modification de plan se font au même tarif horaire.

Plus de recherche dans les e-mails, plus de version périmée sur la clé USB.`,
        kort: "Quelle version est dans la machine ? Votre portail client garde chaque modèle et chaque révision séparément. Fini les recherches dans les e-mails et la clé USB périmée.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Elke revisie op één plek",
      body: "Bij elk 3D-model krijgt u een eigen klantenportaal: daar downloadt u de bestanden, met elke revisie apart. Revisies na een planwijziging gebeuren aan hetzelfde uurtarief.",
    }),
  },

  // ── VRAGEN ──────────────────────────────────────────────────────────────
  {
    id: "vraag-systeem",
    type: "vraag",
    doel: "/3d-modellen",
    kaart: "/3d/weg-kruispunt-donker.png",
    tekst: {
      nl: () => ({
        kop: "Welk systeem zit op uw machine?",
        body: `Een vraag aan de grondwerkers en wegenbouwers: met welk systeem voor machinesturing werkt u?

Trimble? Topcon? Leica? Unicontrol? CHCNAV? Of af fabriek op uw Komatsu of Cat?

En wat loopt er het vaakst mis als u een nieuw model inlaadt: het stelsel, de hoogte, de bestandsnamen?

We lezen graag mee in de reacties.`,
        kort: "Met welk systeem voor machinesturing werkt u? Trimble, Topcon, Leica, Unicontrol, CHCNAV, of af fabriek op uw Komatsu of Cat? Laat het weten in de reacties.",
        tags: nl("#machinecontrol"),
      }),
      fr: () => ({
        kop: "Quel système équipe votre machine ?",
        body: `Une question aux terrassiers et aux routiers : avec quel système de guidage travaillez-vous ?

Trimble ? Topcon ? Leica ? Unicontrol ? CHCNAV ? Ou d'usine sur votre Komatsu ou Cat ?

Et qu'est-ce qui coince le plus souvent quand vous chargez un nouveau modèle : le système de coordonnées, l'altitude, les noms de fichiers ?

Nous lisons vos réponses avec intérêt.`,
        kort: "Avec quel système de guidage travaillez-vous ? Trimble, Topcon, Leica, Unicontrol, CHCNAV, ou d'usine sur votre Komatsu ou Cat ? Dites-le en commentaire.",
        tags: fr("#machinecontrol"),
      }),
    },
  },
  {
    id: "vraag-planning",
    type: "vraag",
    doel: "/tarieven",
    kaart: "/3d/relief-sportterrein-donker.png",
    tekst: {
      nl: () => ({
        kop: "Wanneer vraagt u uw 3D-model aan?",
        body: `Een vraag aan aannemers en werfleiders: wanneer vraagt u het 3D-model voor een werf aan?

Bij de opdracht, weken op voorhand? Of pas als de machine al op de werf staat?

In de praktijk zien we beide. Daarom werken we met drie tarieven: vroegtijdig (${eur("vroegtijdig")}/u), normaal (${eur("normaal")}/u) en last-minute binnen 5 werkdagen (${eur("last-minute")}/u), telkens excl. btw.

Hoe pakt u dat aan?`,
        kort: "Wanneer vraagt u het 3D-model voor een werf aan: weken op voorhand, of als de machine al klaarstaat? We zijn benieuwd hoe u dat aanpakt.",
        tags: nl("#wegenbouw"),
      }),
      fr: () => ({
        kop: "Quand demandez-vous le modèle 3D ?",
        body: `Une question aux entreprises et aux conducteurs de travaux : quand demandez-vous le modèle 3D d'un chantier ?

Dès la commande, des semaines à l'avance ? Ou quand la machine est déjà sur place ?

Nous voyons les deux. C'est pourquoi nous travaillons avec trois tarifs : anticipé (${eur("vroegtijdig", "fr")}/h), normal (${eur("normaal", "fr")}/h) et urgent sous 5 jours ouvrables (${eur("last-minute", "fr")}/h), toujours HTVA.

Et vous, comment faites-vous ?`,
        kort: "Quand demandez-vous le modèle 3D d'un chantier : des semaines à l'avance, ou quand la machine attend déjà ? Nous sommes curieux de votre façon de faire.",
        tags: fr("#voirie"),
      }),
    },
  },
  {
    id: "vraag-fout",
    type: "vraag",
    doel: "/kennis/controle-en-toleranties",
    kaart: "/3d/driehoeksnet-donker.png",
    tekst: {
      nl: () => ({
        kop: "Wat liep er al eens mis?",
        body: `Iedereen die met machinesturing werkt, kent het: een model dat niet wil openen, een werf die tien centimeter te hoog ligt, een laag die ontbreekt.

Wat is uw beste, of slechtste, ervaring met een nieuw model op de machine?

De meest voorkomende oorzaken bundelen we later in een tip.`,
        kort: "Een model dat niet opent, een werf tien centimeter te hoog, een laag die ontbreekt: wat liep er bij u al eens mis met een nieuw model op de machine?",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Qu'est-ce qui a déjà mal tourné ?",
        body: `Tous ceux qui travaillent avec le guidage d'engins le connaissent : un modèle qui refuse de s'ouvrir, un chantier dix centimètres trop haut, une couche qui manque.

Quelle est votre meilleure, ou pire, expérience avec un nouveau modèle dans la machine ?

Nous rassemblerons les causes les plus fréquentes dans un prochain conseil.`,
        kort: "Un modèle qui ne s'ouvre pas, un chantier dix centimètres trop haut, une couche manquante : qu'est-ce qui a déjà mal tourné chez vous avec un nouveau modèle ?",
        tags: fr("#GNSS"),
      }),
    },
  },

  // ── VIDEO (enkel als er een video klaarstaat) ───────────────────────────
  {
    id: "video-model",
    type: "video",
    doel: "/realisaties",
    kaart: "/3d/r/p-platform-draad-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Van plan naar model",
        body: `Zo ziet een 3D-model voor machinesturing eruit: ontwerpoppervlak, lijnwerk en hoogtelijnen, in het juiste coördinatenstelsel en klaar om in te laden.

We maken het model voor Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu en Caterpillar.

${CTA_NL}`,
        kort: "Zo ziet een 3D-model voor machinesturing eruit: ontwerpoppervlak, lijnwerk en hoogtelijnen, in het juiste stelsel en klaar om in te laden.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Du plan au modèle",
        body: `Voici à quoi ressemble un modèle 3D pour le guidage d'engins : surface de projet, lignes et courbes de niveau, dans le bon système de coordonnées et prêt à charger.

Nous livrons le modèle pour Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu et Caterpillar.

${CTA_FR}`,
        kort: "Voici un modèle 3D pour le guidage d'engins : surface de projet, lignes et courbes de niveau, dans le bon système et prêt à charger.",
        tags: fr("#modele3D"),
      }),
    },
  },
];

export function templateOpId(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templatesVanType(type: PostType): Template[] {
  return TEMPLATES.filter((t) => t.type === type);
}

/** Tekst in de gevraagde taal (en/de vallen terug op nl zolang ze ontbreken). */
export function bouwTekst(t: Template, taal: Taal, ctx: TemplateCtx): Tekst {
  const f = t.tekst[taal] ?? t.tekst.nl;
  return f(ctx);
}

export function kaartVan(t: Template, ctx: TemplateCtx): string {
  return typeof t.kaart === "function" ? t.kaart(ctx) : t.kaart;
}

// ============================================================================
// Rotatie over 4 weken (plan, sectie 5)
//   week % 4 = 0  realisatie (wacht op akkoord)
//   week % 4 = 1  carrousel uit de kennisbank
//   week % 4 = 2  tip
//   week % 4 = 3  vraag of aanbod (om de beurt)
// ============================================================================

export function typeVoorWeek(isoWeek: number): PostType {
  switch (isoWeek % 4) {
    case 0:
      return "realisatie";
    case 1:
      return "carrousel";
    case 2:
      return "tip";
    default:
      return Math.floor(isoWeek / 4) % 2 === 0 ? "aanbod" : "vraag";
  }
}

/** De story van de week: om de week NL of FR, afwisselend tip en aanbod. */
export function storyVoorWeek(isoWeek: number): { taal: "nl" | "fr"; type: PostType } {
  return {
    taal: isoWeek % 2 === 0 ? "nl" : "fr",
    type: Math.floor(isoWeek / 2) % 2 === 0 ? "aanbod" : "tip",
  };
}
