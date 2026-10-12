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
import { ARCHIEF, ARCHIEF_WEERGAVE, LUCHTFOTO_BRON, LUCHTFOTO_LABEL, archiefBeeld, archiefPad, archiefProject, metLuchtfoto } from "@/lib/archief";
import { MINIMUM_UREN, UURTARIEF_CENT, euro, type Categorie as TariefCategorie } from "@/lib/tarieven";
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
  | "linkedin"
  | "google"
  | "youtube"
  | "tiktok"
  | "pinterest"
  | "x"
  | "threads"
  | "bluesky";
export const KANALEN: Kanaal[] = ["facebook", "instagram", "linkedin", "google", "youtube", "tiktok", "pinterest", "x", "threads", "bluesky"];
export function isKanaal(v: unknown): v is Kanaal {
  return typeof v === "string" && (KANALEN as string[]).includes(v);
}

/** Labels, ook voor oude rijen ("algemeen") die leesbaar moeten blijven. */
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
  linkedin: "LinkedIn",
};

/** Welke kanalen een bericht standaard krijgt, per soort plaats. */
export const STANDAARD_KANALEN: Record<"feed" | "google" | "story" | "reel", Kanaal[]> = {
  feed: ["facebook", "instagram", "linkedin", "threads", "bluesky", "x", "pinterest"],
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
  /** Enkel bij archiefprojecten (groepsposts in het Engels en Duits). */
  en?: { titel: string; tekst: string; cat: string };
  de?: { titel: string; tekst: string; cat: string };
  /** Donkere render van het project (kan .webp zijn). */
  beeld: string;
  /** Archiefproject: eigen pagina (zonder taal) en de andere weergaven als dia's. */
  pad?: string;
  dias?: Record<"nl" | "fr", Dia[]> & Partial<Record<"en" | "de", Dia[]>>;
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
  dias?: Record<"nl" | "fr", Dia[]> & Partial<Record<"en" | "de", Dia[]>>;
  /** Hoogstens één keer per zoveel dagen (bv. een sjabloon dat altijd hetzelfde project toont). */
  pauzeDagen?: number;
};

// ---------- Hulp ----------

const NL_BASIS = ["#machinesturing", "#grondverzet"];
const FR_BASIS = ["#guidage", "#terrassement"];
const nl = (extra: string) => [...NL_BASIS, extra];
const fr = (extra: string) => [...FR_BASIS, extra];

const CTA_NL = "Plannen doorsturen voor een prijs? Dat kan via de link in ons profiel.";
const CTA_FR = "Un prix pour vos plans ? Envoyez-les via le lien de notre profil.";

const eur = (c: TariefCategorie, l: Taal = "nl") => euro(UURTARIEF_CENT[c], l);

const SYSTEEM_TAG: Record<Systeem, string> = {
  Trimble: "#Trimble",
  Topcon: "#Topcon",
  Leica: "#Leica",
  Unicontrol: "#Unicontrol",
  CHCNAV: "#CHCNAV",
  Komatsu: "#Komatsu",
  Caterpillar: "#Caterpillar",
};

const CAT_ZIN: Record<Categorie, { nl: string; fr: string; en: string; de: string }> = {
  wegenis: {
    nl: "Bij wegenis zit de nauwkeurigheid in de details: verkanting in de bochten, aansluitingen op bestaande wegen, boordstenen en goten op het juiste peil.",
    fr: "En voirie, la précision est dans les détails : dévers dans les courbes, raccords aux voiries existantes, bordures et filets d'eau au bon niveau.",
    en: "On roads, accuracy is in the details: superelevation on the bends, tie-ins to existing roads, kerbs and channels at the right level.",
    de: "Im Straßenbau steckt die Genauigkeit im Detail: Querneigung in den Kurven, Anschlüsse an bestehende Straßen, Bordsteine und Rinnen auf der richtigen Höhe.",
  },
  grondwerk: {
    nl: "Platformen op verschillende niveaus, overgangstaluds en funderingsputten op eigen diepte: alles zit in één model, per laag te kiezen in de cabine.",
    fr: "Plateformes à plusieurs niveaux, talus de transition, puits de fondation à leur propre profondeur : tout est dans un seul modèle, couche par couche en cabine.",
    en: "Platforms at different levels, transition slopes and foundation pits at their own depth: it is all in one model, layer by layer in the cab.",
    de: "Planien auf verschiedenen Höhen, Übergangsböschungen und Fundamentgruben in eigener Tiefe: alles in einem Modell, Schicht für Schicht in der Kabine wählbar.",
  },
  bouwput: {
    nl: "Bodem op niveau, taluds op de juiste helling, putten en sleuven elk op hun eigen diepte. De machinist ziet in de cabine meteen hoeveel er nog af moet.",
    fr: "Fond de fouille à niveau, talus à la bonne pente, puits et tranchées chacun à sa profondeur. En cabine, le conducteur voit directement ce qu'il reste à enlever.",
    en: "Formation at level, batters at the right gradient, pits and trenches each at their own depth. In the cab, the operator sees straight away how much is still to come out.",
    de: "Sohle auf Höhe, Böschungen in der richtigen Neigung, Gruben und Gräben jeweils in eigener Tiefe. Der Maschinenführer sieht in der Kabine sofort, wie viel noch abzutragen ist.",
  },
  terrein: {
    nl: "Een goed model van de bestaande toestand is de basis: daarop sluit het ontwerp aan, en daarmee ziet u hoeveel grond er af moet of bij komt.",
    fr: "Un bon modèle de l'existant est la base : le projet s'y raccorde, et il montre combien de terre déblayer ou remblayer.",
    en: "A good model of the existing ground is the basis: the design ties into it, and it shows how much material has to come out or go in.",
    de: "Ein gutes Modell des Bestands ist die Grundlage: Der Entwurf schließt daran an, und es zeigt, wie viel Boden ab- oder aufzutragen ist.",
  },
};

/**
 * De realisaties die de generator kan kiezen: enkel de projecten in beeld
 * (lib/archief). Vincent (4/10): "altijd een paar beelden van hetzelfde
 * project, met luchtfoto en al" — dus altijd een carrousel, nooit één losse
 * render. Meer projecten in het archief = minder herhaling.
 */
export const REALISATIE_IDS: string[] = ARCHIEF.map((p) => p.code);

/** Een archiefproject als realisatie: omslag in 3D, de andere weergaven als dia's. */
function archiefKeuze(code: string): RealisatieKeuze | undefined {
  const p = archiefProject(code);
  if (!p) return undefined;
  const dias = (l: "nl" | "fr" | "en" | "de"): Dia[] =>
    p.weergaven.slice(1).map((w) => ({
      kop: ARCHIEF_WEERGAVE[w][l].naam,
      tekst: metLuchtfoto(w)
        ? `${ARCHIEF_WEERGAVE[w][l].uitleg} ${LUCHTFOTO_LABEL[l]} © ${LUCHTFOTO_BRON[p.luchtfoto]}.`
        : ARCHIEF_WEERGAVE[w][l].uitleg,
      beeld: archiefBeeld(p.code, w),
    }));
  return {
    id: p.code,
    cat: p.cat,
    systemen: p.systemen,
    nl: { titel: p.nl.titel, tekst: p.nl.tekst, cat: CATEGORIEEN[p.cat].nl },
    fr: { titel: p.fr.titel, tekst: p.fr.tekst, cat: CATEGORIEEN[p.cat].fr },
    en: { titel: p.en.titel, tekst: p.en.tekst, cat: CATEGORIEEN[p.cat].en },
    de: { titel: p.de.titel, tekst: p.de.tekst, cat: CATEGORIEEN[p.cat].de },
    beeld: archiefBeeld(p.code, p.weergaven[0] ?? "3d"),
    pad: archiefPad(p.code),
    dias: { nl: dias("nl"), fr: dias("fr"), en: dias("en"), de: dias("de") },
  };
}

export function realisatieKeuze(id?: string, cat?: Categorie): RealisatieKeuze {
  const a = id ? archiefKeuze(id) : undefined;
  if (a) return a;
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
        kop: "Lambert 72 en TAW: ligging én hoogte",
        body: `Op een Belgische werf werkt de machine in Lambert 72 voor de ligging en in TAW voor de hoogte. Klinkt eenvoudig, maar net daar gaat het vaak mis.

Een verkeerd stelsel geeft zelden een foutmelding. Het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of op de verkeerde hoogte. En een paar centimeter hoogteverschil valt in de cabine niet op.

Waar we bij elke opdracht op letten:
• is het plan in Lambert 72 getekend, of in lokale coördinaten met een eigen nulpunt;
• staan de hoogtes in TAW, of ten opzichte van een peil +0,00;
• gebruikt de machine het juiste geoïdemodel (hBG18): zonder dat zit GNSS ruim 40 meter naast TAW.

En vóór de start: altijd controleren op een gekend punt, in ligging en hoogte.`,
        kort: "Lambert 72 en TAW: ligging én hoogte. Een verkeerd stelsel geeft zelden een foutmelding: het model ligt gewoon op de verkeerde plaats of hoogte. Wij gaan het bij elke opdracht na.",
        tags: nl("#Lambert72"),
      }),
      fr: () => ({
        kop: "Lambert 72 et DNG : position et altitude",
        body: `Sur un chantier belge, la machine travaille en Lambert 72 pour la position et en DNG (TAW) pour l'altitude. Cela paraît simple, mais c'est souvent là que ça coince.

Un mauvais système ne donne presque jamais de message d'erreur. Le modèle se charge, mais il est décalé, en plan ou en altitude. Et quelques centimètres d'écart ne se voient pas en cabine.

Ce que nous vérifions pour chaque mission :
• le plan est-il dessiné en Lambert 72, ou en coordonnées locales avec un point zéro propre ;
• les altitudes sont-elles en DNG, ou par rapport à un niveau +0,00 ;
• la machine utilise-t-elle le bon modèle de géoïde (hBG18) : sans lui, le GNSS est à plus de 40 mètres du DNG.

Et avant de commencer : toujours contrôler sur un point connu, en plan et en altitude.`,
        kort: "Lambert 72 et DNG : position et altitude. Un mauvais système ne donne presque jamais d'erreur : le modèle est simplement décalé. Nous le vérifions pour chaque mission.",
        tags: fr("#Lambert72"),
      }),
    },
    dias: {
      nl: [
        { kop: "Lambert 72 en TAW", tekst: "Ligging én hoogte: beide moeten kloppen." },
        { kop: "Geen foutmelding", tekst: "Het model laadt gewoon, maar op de verkeerde plaats of hoogte." },
        { kop: "Lokaal getekend?", tekst: "Een eigen nulpunt of peil +0,00 moet eerst naar Lambert 72 en TAW." },
        { kop: "Geoïde hBG18", tekst: "Zonder het juiste geoïdemodel zit GNSS ruim 40 meter naast TAW." },
        { kop: "Controleer op een gekend punt", tekst: "In ligging en hoogte, vóór de eerste schop." },
      ],
      fr: [
        { kop: "Lambert 72 et DNG", tekst: "Position et altitude : les deux doivent être justes." },
        { kop: "Aucun message d'erreur", tekst: "Le modèle se charge, mais au mauvais endroit ou à la mauvaise altitude." },
        { kop: "Dessiné en local ?", tekst: "Un point zéro propre ou un niveau +0,00 doit d'abord passer en Lambert 72 et DNG." },
        { kop: "Géoïde hBG18", tekst: "Sans le bon modèle de géoïde, le GNSS est à plus de 40 mètres du DNG." },
        { kop: "Contrôlez sur un point connu", tekst: "En plan et en altitude, avant le premier coup de godet." },
      ],
    },
    google: () => ({
      kop: "Lambert 72 en TAW: ligging én hoogte",
      body: "Op een Belgische werf werkt de machine in Lambert 72 en TAW. Een verkeerd stelsel geeft zelden een foutmelding: het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of hoogte. Daarom gaan we bij elke opdracht het stelsel van het plan, de hoogtereferentie en het geoïdemodel van de machine na.",
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
• België: Lambert 72, hoogte TAW/DNG
• Nederland: RD New, hoogte NAP
• Frankrijk: Lambert-93 of CC42–CC50, hoogte NGF-IGN69
• Duitsland: ETRS89 / UTM 32 of 33, hoogte DHHN2016
• Luxemburg: LUREF, hoogte NG95

Staat het stelsel niet op het plan? Dan stellen we er één voor op basis van de ligging van de werf, en vragen we uw bevestiging vóór we beginnen.`,
        kort: "Werf over de grens? België: Lambert 72 en TAW. Nederland: RD en NAP. Frankrijk: Lambert-93 en IGN69. Machine en model moeten hetzelfde stelsel gebruiken.",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Un chantier à l'étranger ?",
        body: `De plus en plus d'entreprises travaillent au-delà des frontières. Chaque pays a son système de coordonnées et sa référence altimétrique, et la machine doit utiliser exactement les mêmes que le modèle.

Les systèmes que nous rencontrons le plus souvent :
• Belgique : Lambert 72, altitudes DNG/TAW
• France : Lambert-93 ou CC42–CC50, altitudes NGF-IGN69
• Luxembourg : LUREF, altitudes NG95
• Pays-Bas : RD New, altitudes NAP
• Allemagne : ETRS89 / UTM 32 ou 33, altitudes DHHN2016

Le système ne figure pas sur le plan ? Nous en proposons un selon la position du chantier et demandons votre confirmation avant de commencer.`,
        kort: "Chantier à l'étranger ? Belgique : Lambert 72 et DNG. France : Lambert-93 et IGN69. Luxembourg : LUREF et NG95. Machine et modèle doivent utiliser le même système.",
        tags: fr("#GNSS"),
      }),
    },
    dias: {
      nl: [
        { kop: "Werf over de grens?", tekst: "Elk land zijn stelsel en zijn hoogtereferentie." },
        { kop: "België", tekst: "Lambert 72, hoogte TAW/DNG." },
        { kop: "Nederland", tekst: "RD New, hoogte NAP." },
        { kop: "Frankrijk", tekst: "Lambert-93 of CC42–CC50, hoogte NGF-IGN69." },
        { kop: "Duitsland en Luxemburg", tekst: "ETRS89 / UTM 32 of 33 en DHHN2016; LUREF en NG95." },
      ],
      fr: [
        { kop: "Un chantier à l'étranger ?", tekst: "Chaque pays a son système et sa référence altimétrique." },
        { kop: "Belgique", tekst: "Lambert 72, altitudes DNG/TAW." },
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

Van plan naar een model dat de machine meteen kan inladen: ontwerpoppervlak, lijnwerk en hoogtelijnen, in het juiste coördinatenstelsel.${r.dias ? "\n\nBlader door de beelden: hetzelfde model op de luchtfoto, met hoogtelijnen en als driehoeksnet. Alle beelden staan op onze site." : ""}`,
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

Du plan à un modèle que la machine charge directement : surface de projet, lignes et courbes de niveau, dans le bon système de coordonnées.${r.dias ? "\n\nFaites défiler les images : le même modèle sur photo aérienne, en courbes de niveau et en réseau de triangles. Toutes les images sont sur notre site." : ""}`,
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
    // Toont altijd hetzelfde uitgelichte project: niet vaker dan om de twee maanden.
    pauzeDagen: 60,
    type: "realisatie",
    doel: "/realisaties",
    kaart: "/3d/r/p-uitgraving-hoogte-donker.webp",
    beeld: () => "/3d/r/p-uitgraving-hoogte-donker.webp",
    // Altijd een paar beelden van hetzelfde project (Vincent, 4/10).
    dias: {
      nl: [
        { kop: "Hellingskaart", tekst: "Vlakke bodem, taluds op de juiste helling: in één oogopslag.", beeld: "/3d/r/p-uitgraving-helling-donker.webp" },
        { kop: "Hoogtelijnen", tekst: "Hoe dichter de lijnen, hoe steiler het talud.", beeld: "/3d/r/p-uitgraving-hoogtelijn-donker.webp" },
        { kop: "Driehoeksnet", tekst: "Het oppervlak waarop de machine stuurt, driehoek per driehoek.", beeld: "/3d/r/p-uitgraving-draad-donker.webp" },
      ],
      fr: [
        { kop: "Carte des pentes", tekst: "Fond plat, talus à la bonne pente : d'un coup d'œil.", beeld: "/3d/r/p-uitgraving-helling-donker.webp" },
        { kop: "Courbes de niveau", tekst: "Plus les courbes sont serrées, plus le talus est raide.", beeld: "/3d/r/p-uitgraving-hoogtelijn-donker.webp" },
        { kop: "Réseau de triangles", tekst: "La surface sur laquelle l'engin se guide, triangle par triangle.", beeld: "/3d/r/p-uitgraving-draad-donker.webp" },
      ],
    },
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

  // ── EXTRA TIPS (uit de kennisbank) ──────────────────────────────────────
  {
    id: "tip-tegenstrijdig",
    type: "tip",
    doel: "/kennis/controle-en-toleranties",
    kaart: "/3d/terrein-hoogtelijnen.jpg",
    tekst: {
      nl: () => ({
        kop: "Klopt het peil niet? Wij melden het",
        body: `Plannen spreken elkaar soms tegen. Een peil op het grondplan dat niet overeenkomt met het lengteprofiel. Een helling die niet past bij de opgegeven hoogtes.

Zulke punten vullen we niet stilzwijgend zelf in. We melden ze, met de plaats en de twee waarden, zodat de ontwerper of de werfleider beslist welke waarde geldt.

Liever één vraag vóór de levering dan een discussie op de werf.`,
        kort: "Plannen spreken elkaar soms tegen: een peil dat niet past bij het lengteprofiel. Wij vullen dat niet stil zelf in, maar melden het, zodat de ontwerper beslist.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Un niveau qui ne colle pas ? Nous le signalons",
        body: `Les plans se contredisent parfois. Un niveau sur le plan d'implantation qui ne correspond pas au profil en long. Une pente qui ne colle pas avec les altitudes indiquées.

Nous ne comblons pas ces écarts en silence. Nous les signalons, avec l'endroit et les deux valeurs, pour que le bureau d'études ou le conducteur de travaux décide quelle valeur s'applique.

Mieux vaut une question avant la livraison qu'une discussion sur chantier.`,
        kort: "Les plans se contredisent parfois : un niveau qui ne colle pas avec le profil en long. Nous ne tranchons pas en silence : nous le signalons, et le bureau d'études décide.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Tegenstrijdige peilen? Wij melden ze",
      body: "Plannen spreken elkaar soms tegen, bijvoorbeeld een peil op het grondplan dat niet overeenkomt met het lengteprofiel. Wij vullen zulke punten niet zelf in, maar melden ze met de plaats en de twee waarden. Zo beslist de ontwerper of de werfleider welke waarde geldt, nog vóór de levering van het 3D-model.",
    }),
  },
  {
    id: "tip-werfkalibratie",
    type: "tip",
    doel: "/kennis/coordinatenstelsels",
    kaart: "/3d/trace-luchtfoto.jpg",
    tekst: {
      nl: () => ({
        kop: "Werfkalibratie: enkel binnen de punten",
        body: `Op veel werven werkt de machine met een lokale kalibratie: een paar gekende punten worden ingemeten en de GNSS-metingen worden er exact op afgestemd.

Dat werkt goed, maar enkel binnen het gebied van die punten. Daarbuiten kunnen afwijkingen snel oplopen.

Breidt de werf uit, of werkt de machine een eind buiten de gekalibreerde zone? Laat dan extra punten inmeten en controleer opnieuw op een gekend punt.

Wij leveren het model in het afgesproken stelsel; de kalibratie op de machine beheert de aannemer of zijn meetploeg.`,
        kort: "Een lokale werfkalibratie klopt binnen het gebied van de gemeten punten; daarbuiten kunnen afwijkingen snel oplopen. Werf groter geworden? Extra punten inmeten en opnieuw controleren.",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Calibration de chantier : entre les points",
        body: `Sur beaucoup de chantiers, la machine travaille avec une calibration locale : quelques points connus sont levés et les mesures GNSS y sont ajustées.

Cela fonctionne bien, mais uniquement dans la zone couverte par ces points. En dehors, les écarts peuvent vite augmenter.

Le chantier s'agrandit, ou la machine travaille loin de la zone calibrée ? Faites lever des points supplémentaires et contrôlez à nouveau sur un point connu.

Nous livrons le modèle dans le système convenu ; la calibration de la machine reste du ressort de l'entreprise ou de son équipe de mesure.`,
        kort: "Une calibration locale est juste dans la zone des points levés ; au-delà, les écarts augmentent vite. Le chantier s'agrandit ? Levez des points supplémentaires et recontrôlez.",
        tags: fr("#GNSS"),
      }),
    },
    google: () => ({
      kop: "Werfkalibratie geldt binnen de punten",
      body: "Een lokale werfkalibratie stemt de GNSS-metingen af op enkele gekende punten. Binnen dat gebied klopt alles, daarbuiten kunnen afwijkingen snel oplopen. Werkt de machine buiten de gekalibreerde zone, laat dan extra punten inmeten en controleer opnieuw op een gekend punt.",
    }),
  },
  {
    id: "tip-planwijziging",
    type: "tip",
    doel: "/kennis/veelgestelde-vragen",
    kaart: "/3d/rotondes-donker.png",
    tekst: {
      nl: () => ({
        kop: "Ontwerp gewijzigd? Zo gaat het",
        body: `Ontwerpen veranderen tijdens een project. Dat is normaal.

Stuur de gewijzigde plannen door met een korte omschrijving van wat er veranderd is: welke zone, welke peilen, welke versie. Dan passen we het model gericht aan en staat de nieuwe versie in uw klantenportaal, naast de vorige.

Aanpassingen aan het ontwerp worden per uur verrekend. Een fout in het model ten opzichte van de aangeleverde plannen zetten we uiteraard kosteloos recht.`,
        kort: "Ontwerp gewijzigd? Stuur de nieuwe plannen met een korte omschrijving. U krijgt een nieuwe versie in uw portaal, naast de vorige. Een fout in het model herstellen we kosteloos.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Projet modifié ? Voici comment faire",
        body: `Les projets évoluent en cours de route. C'est normal.

Envoyez les plans modifiés avec une courte description de ce qui a changé : quelle zone, quels niveaux, quelle version. Nous adaptons le modèle de manière ciblée et la nouvelle version vous attend dans votre espace client, à côté de la précédente.

Les modifications du projet sont facturées à l'heure. Une erreur du modèle par rapport aux plans fournis est bien sûr corrigée gratuitement.`,
        kort: "Projet modifié ? Envoyez les nouveaux plans avec une courte description. Nouvelle version dans votre espace client, à côté de l'ancienne. Une erreur du modèle est corrigée gratuitement.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Ontwerp gewijzigd? Nieuwe versie in het portaal",
      body: "Stuur de gewijzigde plannen met een korte omschrijving van wat er veranderd is. We passen het 3D-model gericht aan en zetten de nieuwe versie in uw klantenportaal, naast de vorige. Aanpassingen worden per uur verrekend; een fout in het model ten opzichte van de plannen herstellen we kosteloos.",
    }),
  },
  {
    id: "tip-grondbalans",
    type: "tip",
    doel: "/kennis/grondverzet-en-volumes",
    kaart: "/3d/r/p-uitgraving-hoogtelijn-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Grondbalans: losse grond neemt meer plaats in",
        body: `Een volumeberekening zet het bestaande terrein tegenover het ontwerp: hoeveel grond moet weg, hoeveel moet erbij.

Maar grond verandert van volume. Losgegraven grond neemt meer plaats in dan in de ongeroerde bodem, verdichte grond minder. En niet alle uitgegraven grond is geschikt om opnieuw te gebruiken.

Een geometrische grondbalans is dus een vertrekpunt voor de planning van transport en materiaal, geen eindantwoord. Voor de afrekening blijven een opmeting op het terrein en het bestek bepalend.`,
        kort: "Een grondbalans uit het model is een vertrekpunt, geen eindantwoord: losgegraven grond neemt meer plaats in, verdichte grond minder, en niet alle grond is herbruikbaar.",
        tags: nl("#grondbalans"),
      }),
      fr: () => ({
        kop: "Équilibre des terres : la terre foisonne",
        body: `Un calcul de volumes compare le terrain existant au projet : combien de terre enlever, combien en apporter.

Mais la terre change de volume. Une fois excavée, elle prend plus de place qu'en place ; compactée, elle en prend moins. Et toute la terre excavée n'est pas réutilisable.

Un équilibre géométrique des terres est donc un point de départ pour planifier transport et matériaux, pas une réponse définitive. Pour les décomptes, un levé sur terrain et le cahier des charges restent déterminants.`,
        kort: "L'équilibre des terres issu du modèle est un point de départ : la terre foisonne une fois excavée, se tasse une fois compactée, et n'est pas toujours réutilisable.",
        tags: fr("#volumes"),
      }),
    },
    google: () => ({
      kop: "Grondbalans: een vertrekpunt",
      body: "Een volumeberekening uit het 3D-model vergelijkt bestaand terrein en ontwerp. Houd rekening met het verschil tussen losse en verdichte grond, en met grond die niet herbruikbaar is. De balans helpt bij de planning van transport en materiaal; voor de afrekening blijven een opmeting en het bestek bepalend.",
    }),
  },
  {
    id: "tip-laagdikte",
    type: "tip",
    doel: "/kennis/grondverzet-en-volumes",
    kaart: "/3d/weg-kruispunt-donker.png",
    tekst: {
      nl: () => ({
        kop: "Een paar centimeter laagdikte telt op",
        body: `Onder een verharding liggen meestal meerdere lagen: onderfundering, fundering en verharding, elk met een eigen ontwerpdikte.

Wie het uitgravingsvolume berekent tot het afgewerkte niveau in plaats van tot de bodem van de opbouw, onderschat het grondverzet. Een verschil van enkele centimeters lijkt klein, maar over een grote oppervlakte telt het snel op.

Daarom modelleren we elke laag als een apart oppervlak. Zo volgt de machine in elke fase het juiste niveau, en ziet u het volume per laag.`,
        kort: "Uitgraving berekend tot het afgewerkte niveau? Dan onderschat u het grondverzet. Wij modelleren elke laag apart: het juiste niveau in elke fase, en het volume per laag.",
        tags: nl("#wegenbouw"),
      }),
      fr: () => ({
        kop: "Quelques centimètres d'épaisseur, ça compte",
        body: `Sous un revêtement, il y a généralement plusieurs couches : sous-fondation, fondation et revêtement, chacune avec son épaisseur de projet.

Calculer le déblai jusqu'au niveau fini au lieu du fond de la structure, c'est sous-estimer les terrassements. Quelques centimètres semblent peu, mais sur une grande surface, cela s'additionne vite.

C'est pourquoi nous modélisons chaque couche comme une surface distincte. La machine suit le bon niveau à chaque phase, et vous voyez le volume par couche.`,
        kort: "Déblai calculé jusqu'au niveau fini ? Les terrassements sont sous-estimés. Chaque couche est modélisée à part : le bon niveau à chaque phase, et le volume par couche.",
        tags: fr("#voirie"),
      }),
    },
  },
  {
    id: "tip-open-formaten",
    type: "tip",
    doel: "/kennis/bestanden-per-merk",
    kaart: "/3d/driehoeksnet-donker.png",
    tekst: {
      nl: () => ({
        kop: "LandXML en DXF: de open formaten",
        body: `Naast de eigen formaten van elk merk zijn er twee open formaten die bijna overal gelezen worden.

LandXML: een open standaard voor oppervlakken (driehoeksnet), lijnwerk, assen en punten, met hun coördinaten. Veel machinesturingen lezen het rechtstreeks of zetten het om.

DXF: het gangbare CAD-formaat, vooral voor lijnwerk en 3D-lijnen, en als achtergrondtekening in de cabine.

Werkt u met een systeem dat niet in onze lijst staat? Met LandXML en DXF zit u bijna altijd goed. Geef bij de aanvraag wel het systeem en de softwareversie op.`,
        kort: "LandXML voor oppervlakken, lijnwerk en punten; DXF voor lijnwerk en achtergrond. Met die twee open formaten zit u op bijna elk systeem voor machinesturing goed.",
        tags: nl("#LandXML"),
      }),
      fr: () => ({
        kop: "LandXML et DXF : les formats ouverts",
        body: `À côté des formats propres à chaque marque, deux formats ouverts sont lus presque partout.

LandXML : un standard ouvert pour les surfaces (réseau de triangles), les lignes, les axes et les points, avec leurs coordonnées. Beaucoup de systèmes de guidage le lisent directement ou le convertissent.

DXF : le format CAO courant, surtout pour les lignes et polylignes 3D, et comme fond de plan en cabine.

Votre système n'est pas dans notre liste ? Avec LandXML et DXF, vous êtes presque toujours couvert. Indiquez tout de même le système et la version du logiciel dans votre demande.`,
        kort: "LandXML pour les surfaces, lignes et points ; DXF pour les lignes et le fond de plan. Avec ces deux formats ouverts, presque tous les systèmes de guidage sont couverts.",
        tags: fr("#LandXML"),
      }),
    },
    google: () => ({
      kop: "LandXML en DXF: open formaten",
      body: "Naast de eigen formaten van Trimble, Topcon, Leica en andere merken leveren we ook de open formaten LandXML (oppervlakken, lijnwerk en punten) en DXF (lijnwerk en achtergrond). Daarmee werkt het 3D-model op bijna elk systeem voor machinesturing.",
    }),
  },
  {
    id: "tip-gnss-hoogte",
    type: "tip",
    doel: "/kennis/controle-en-toleranties",
    kaart: "/3d/terrein-hoogtelijnen-donker.png",
    tekst: {
      nl: () => ({
        kop: "GNSS is minder nauwkeurig in de hoogte",
        body: `Een machine met GNSS-sturing bepaalt haar positie doorgaans nauwkeuriger in ligging dan in hoogte. Bij grondwerk valt dat zelden op, maar bij fundering en afwerkingslagen telt het wel.

Daarom:
• moet het model zelf ruim binnen de toleranties van het werk liggen;
• controleert u vóór de start op een gekend punt, ook in hoogte;
• kan voor fijne afwerking een total station of een extra controle nodig zijn.

De toleranties van het bestek blijven altijd bepalend.`,
        kort: "GNSS-machinesturing is doorgaans minder nauwkeurig in hoogte dan in ligging. Bij fundering en afwerking telt dat: controleer vóór de start ook de hoogte op een gekend punt.",
        tags: nl("#GNSS"),
      }),
      fr: () => ({
        kop: "Le GNSS est moins précis en altitude",
        body: `Une machine guidée par GNSS détermine généralement sa position plus précisément en plan qu'en altitude. En terrassement, cela se remarque rarement ; pour la fondation et les couches de finition, cela compte.

C'est pourquoi :
• le modèle lui-même doit rester largement dans les tolérances du chantier ;
• contrôlez avant le démarrage sur un point connu, aussi en altitude ;
• pour une finition fine, une station totale ou un contrôle supplémentaire peut être nécessaire.

Les tolérances du cahier des charges restent toujours déterminantes.`,
        kort: "Le guidage GNSS est généralement moins précis en altitude qu'en plan. Pour la fondation et la finition, cela compte : contrôlez aussi l'altitude sur un point connu.",
        tags: fr("#GNSS"),
      }),
    },
    google: () => ({
      kop: "Hoogte controleren bij GNSS",
      body: "Machinesturing met GNSS is doorgaans minder nauwkeurig in hoogte dan in ligging. Bij fundering en afwerkingslagen telt dat. Controleer vóór de start altijd ook de hoogte op een gekend punt; de toleranties van het bestek blijven bepalend.",
    }),
  },
  {
    id: "aanbod-buitenland",
    type: "aanbod",
    doel: "/3d-modellen",
    kaart: "/3d/weg-trace-donker.png",
    tekst: {
      nl: () => ({
        kop: "Ook voor werven buiten België",
        body: `Een werf in Nederland, Frankrijk, Duitsland of Luxemburg? We maken het 3D-model in het coördinatenstelsel en de hoogtereferentie van dat land, of in een lokaal stelsel naar keuze.

Dezelfde werkwijze als in België: plannen doorsturen, een offerte met het geschatte aantal uren, en het model in het formaat van uw machine.

We communiceren in het Nederlands, Frans, Engels, Duits of Spaans.

${CTA_NL}`,
        kort: "Werf in Nederland, Frankrijk, Duitsland of Luxemburg? Het 3D-model komt in het stelsel en de hoogtereferentie van dat land. Communicatie in vijf talen.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Aussi pour vos chantiers hors de Belgique",
        body: `Un chantier en France, au Luxembourg, aux Pays-Bas ou en Allemagne ? Nous réalisons le modèle 3D dans le système de coordonnées et la référence altimétrique du pays, ou dans un système local de votre choix.

La même méthode qu'en Belgique : vous envoyez les plans, vous recevez une offre avec le nombre d'heures estimé, puis le modèle au format de votre machine.

Nous échangeons en français, néerlandais, anglais, allemand ou espagnol.

${CTA_FR}`,
        kort: "Chantier en France, au Luxembourg, aux Pays-Bas ou en Allemagne ? Le modèle 3D dans le système et la référence altimétrique du pays. Échanges en cinq langues.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "3D-modellen ook voor werven in het buitenland",
      body: "Werf in Nederland, Frankrijk, Duitsland of Luxemburg? We maken het 3D-model voor machinesturing in het coördinatenstelsel en de hoogtereferentie van dat land, of in een lokaal stelsel naar keuze. Communicatie in het Nederlands, Frans, Engels, Duits of Spaans.",
    }),
  },

  // ── UITDAGINGEN (vragen die de lezer bij zichzelf doen nadenken) ─────────
  {
    id: "vraag-test-stelsel",
    type: "vraag",
    doel: "/kennis/coordinatenstelsels",
    kaart: "/3d/h/plan-hoogtelijnen-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Test: staat uw plan in Lambert 72 en TAW?",
        body: `Een kleine test voor uw volgende werf.

Open het plan en zoek het coördinatenstelsel. Staat er Lambert 72? En de hoogtes: in TAW, of ten opzichte van een peil +0,00?

Vindt u het niet terug? Dan bent u niet alleen. Maar uw machine moet het wel weten, en een verkeerd stelsel geeft geen foutmelding: het model ligt gewoon op de verkeerde plaats of hoogte.

Wij vragen het bij elke opdracht na, nog vóór we beginnen.

${CTA_NL}`,
        kort: "Test: open uw plan. Lambert 72? Hoogtes in TAW of ten opzichte van een peil +0,00? Niet terug te vinden? Uw machine moet het wel weten. Wij vragen het bij elke opdracht na.",
        tags: nl("#Lambert72"),
      }),
      fr: () => ({
        kop: "Test : votre plan est-il en Lambert 72 et DNG ?",
        body: `Un petit test pour votre prochain chantier.

Ouvrez le plan et cherchez le système de coordonnées. Lambert 72 ? Et les altitudes : en DNG, ou par rapport à un niveau +0,00 ? En France : Lambert-93 ou une zone CC, et NGF-IGN69 ?

Introuvable ? Vous n'êtes pas le seul. Mais votre machine, elle, doit le savoir, et un mauvais système ne donne pas de message d'erreur : le modèle est simplement au mauvais endroit ou à la mauvaise hauteur.

Nous le vérifions pour chaque mission, avant de commencer.

${CTA_FR}`,
        kort: "Test : ouvrez votre plan. Lambert 72 ? Altitudes en DNG ou par rapport à un niveau +0,00 ? Introuvable ? Votre machine doit pourtant le savoir. Nous le vérifions pour chaque mission.",
        tags: fr("#Lambert93"),
      }),
    },
  },
  {
    id: "vraag-piketten",
    type: "vraag",
    doel: "/3d-modellen",
    kaart: "/3d/relief-sportterrein-donker.png",
    tekst: {
      nl: () => ({
        kop: "Hoeveel uur zette uw ploeg piketten?",
        body: `Een eerlijke vraag: hoeveel uur ging er vorig jaar naar uitzetten, piketten slaan en hoogtes nameten?

Met een 3D-model in de cabine ziet de machinist het ontwerpniveau rechtstreeks op zijn scherm. Minder piketten, minder wachten op de meetploeg, en het ontwerp ligt er zoals het getekend is.

Het model voor een werf is een aantal uren modelleerwerk, aan ${eur("vroegtijdig")} tot ${eur("last-minute")} per uur (excl. btw). Zet dat eens naast de uren die u nu kwijt bent.

${CTA_NL}`,
        kort: "Hoeveel uur ging er vorig jaar naar piketten en hoogtes nameten? Met een 3D-model in de cabine ziet de machinist het ontwerp op zijn scherm. Zet het eens naast elkaar.",
        tags: nl("#uitzetten"),
      }),
      fr: () => ({
        kop: "Combien d'heures de piquetage ?",
        body: `Une question franche : combien d'heures votre équipe a-t-elle passées l'an dernier à implanter, piqueter et revérifier les niveaux ?

Avec un modèle 3D en cabine, le conducteur voit le niveau de projet directement sur son écran. Moins de piquets, moins d'attente de l'équipe de mesure, et le projet est réalisé tel qu'il a été dessiné.

Le modèle d'un chantier, ce sont quelques heures de modélisation, de ${eur("vroegtijdig", "fr")} à ${eur("last-minute", "fr")} de l'heure (HTVA). Comparez avec les heures que vous y passez aujourd'hui.

${CTA_FR}`,
        kort: "Combien d'heures de piquetage et de contrôle des niveaux l'an dernier ? Avec un modèle 3D en cabine, le conducteur voit le projet sur son écran. Comparez.",
        tags: fr("#implantation"),
      }),
    },
    google: () => ({
      kop: "Minder piketten, meer graven",
      body: `Met een 3D-model in de cabine ziet de machinist het ontwerpniveau rechtstreeks op zijn scherm: minder uitzetten, minder wachten op de meetploeg. Het model voor een werf is een aantal uren modelleerwerk, aan ${eur("vroegtijdig")} tot ${eur("last-minute")} per uur (excl. btw). Stuur uw plannen voor een offerte met het geschatte aantal uren.`,
    }),
  },
  {
    id: "vraag-herwerk",
    type: "vraag",
    doel: "/kennis/controle-en-toleranties",
    kaart: "/3d/relief-bouwput-donker.png",
    tekst: {
      nl: () => ({
        kop: "Wat kost een halve dag herwerk?",
        body: `Reken even mee. Een halve dag herwerk door een verkeerd niveau: de machine, de machinist, de vrachtwagens die wachten of extra rijden, het materiaal dat er opnieuw uit moet.

Veel fouten op een werf met machinesturing ontstaan niet in de cabine, maar al in het model: een verkeerd stelsel, een ontbrekende laag, een peil dat niet klopt met het profiel.

Daarom controleren we elk model op peilen, hellingen en aansluitingen vóór het vertrekt. En melden we tegenstrijdigheden in de plannen in plaats van ze zelf in te vullen.

${CTA_NL}`,
        kort: "Een halve dag herwerk door een verkeerd niveau: machine, machinist, vrachtwagens, materiaal. Daarom controleren we elk model op peilen, hellingen en aansluitingen vóór levering.",
        tags: nl("#3Dmodel"),
      }),
      fr: () => ({
        kop: "Combien coûte une demi-journée de reprise ?",
        body: `Faites le calcul. Une demi-journée de reprise à cause d'un mauvais niveau : la machine, le conducteur, les camions qui attendent ou roulent en plus, les matériaux à ressortir.

Beaucoup d'erreurs sur un chantier guidé ne naissent pas en cabine, mais déjà dans le modèle : un mauvais système, une couche manquante, un niveau qui ne colle pas avec le profil.

C'est pourquoi nous contrôlons chaque modèle, niveaux, pentes et raccords, avant livraison. Et nous signalons les contradictions dans les plans au lieu de les combler nous-mêmes.

${CTA_FR}`,
        kort: "Une demi-journée de reprise pour un mauvais niveau : machine, conducteur, camions, matériaux. Nous contrôlons donc chaque modèle, niveaux, pentes et raccords, avant livraison.",
        tags: fr("#modele3D"),
      }),
    },
    google: () => ({
      kop: "Wat kost een halve dag herwerk?",
      body: "Een verkeerd niveau kost al snel een halve dag herwerk: machine, machinist, vrachtwagens en materiaal. Veel fouten ontstaan al in het model. Daarom controleren we elk 3D-model op peilen, hellingen en aansluitingen vóór levering, en melden we tegenstrijdigheden in de plannen.",
    }),
  },
  {
    id: "vraag-machinist",
    type: "vraag",
    doel: "/kennis/lijnwerk-en-breeklijnen",
    kaart: "/3d/terrein-lijnwerk.jpg",
    tekst: {
      nl: () => ({
        kop: "Machinist, wat mist u op uw scherm?",
        body: `Een vraag voor wie elke dag in de cabine zit.

Wat maakt een 3D-model voor u goed of slecht? Lijnwerk van boordstenen en grachten? Hoogtelijnen? Duidelijke namen voor de lagen? Of net minder op het scherm?

Wij bouwen elk model met lijnwerk, aparte lagen per fase en een controle op hellingen. Maar de beste tips komen van de mensen die ermee werken.

Laat het weten in de reacties.`,
        kort: "Machinist, wat maakt een 3D-model voor u goed? Lijnwerk, hoogtelijnen, duidelijke lagen, of net minder op het scherm? Laat het weten.",
        tags: nl("#machinist"),
      }),
      fr: () => ({
        kop: "Conducteur, que manque-t-il à votre écran ?",
        body: `Une question pour ceux qui sont en cabine tous les jours.

Qu'est-ce qui rend un modèle 3D bon ou mauvais pour vous ? Les lignes des bordures et des fossés ? Les courbes de niveau ? Des noms de couches clairs ? Ou justement moins d'informations à l'écran ?

Nous construisons chaque modèle avec ses lignes, des couches séparées par phase et un contrôle des pentes. Mais les meilleurs conseils viennent de ceux qui l'utilisent.

Dites-le en commentaire.`,
        kort: "Conducteur, qu'est-ce qui rend un modèle 3D bon pour vous ? Lignes, courbes de niveau, couches claires, ou moins à l'écran ? Dites-le en commentaire.",
        tags: fr("#conducteurdengins"),
      }),
    },
  },
  {
    id: "vraag-kleine-werf",
    type: "vraag",
    doel: "/tarieven",
    kaart: "/3d/r/p-uitgraving-helling-donker.webp",
    tekst: {
      nl: () => ({
        kop: "Enkel voor grote werven? Niet waar",
        body: `Veel aannemers denken dat een 3D-model enkel loont voor een autosnelweg of een groot industrieterrein.

Maar ook een parking, een oprit met afwatering, een bouwput of een sportveld heeft hellingen en niveaus die moeten kloppen. Juist daar kost een kleine fout snel herwerk.

We rekenen per uur, met een minimum van ${MINIMUM_UREN} uur per opdracht. Een kleine werf is dus ook een kleine factuur.

${CTA_NL}`,
        kort: "Een 3D-model enkel voor grote werven? Ook een parking, oprit, bouwput of sportveld heeft hellingen die moeten kloppen. Per uur gerekend: kleine werf, kleine factuur.",
        tags: nl("#aannemer"),
      }),
      fr: () => ({
        kop: "Seulement pour les grands chantiers ? Faux",
        body: `Beaucoup d'entreprises pensent qu'un modèle 3D ne se justifie que pour une autoroute ou un grand zoning.

Mais un parking, une allée avec écoulement, une fouille ou un terrain de sport ont aussi des pentes et des niveaux qui doivent être justes. C'est justement là qu'une petite erreur coûte vite une reprise.

Nous facturons à l'heure, avec un minimum de ${MINIMUM_UREN} heure par mission. Un petit chantier, c'est donc aussi une petite facture.

${CTA_FR}`,
        kort: "Un modèle 3D seulement pour les grands chantiers ? Un parking, une fouille ou un terrain de sport ont aussi des pentes à respecter. Facturé à l'heure : petit chantier, petite facture.",
        tags: fr("#travauxpublics"),
      }),
    },
    google: () => ({
      kop: "Ook voor kleine werven",
      body: `Een 3D-model voor machinesturing is niet enkel voor grote werven. Ook een parking, een oprit met afwatering, een bouwput of een sportveld heeft hellingen en niveaus die moeten kloppen. We rekenen per uur, met een minimum van ${MINIMUM_UREN} uur per opdracht.`,
    }),
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

// ---------- Engels en Duits (groepsposts) ----------
//
// De contentmachine plant enkel Nederlands en Frans. Voor Engelse en Duitse
// Facebook-groepen staat elk sjabloon hier ook in het Engels (VK-termen:
// groundworks, formation, batter, setting out) en het Duits (Tiefbau,
// Planum, Böschung, Absteckung). Zelfde regels: geen link in de tekst, geen
// persoonsnaam, nooit "surveyor"/"Vermesser" over onszelf, België = Lambert 72
// en TAW.

const EN_BASIS = ["#machinecontrol", "#groundworks"];
const DE_BASIS = ["#Maschinensteuerung", "#Tiefbau"];
const en = (extra: string) => [...EN_BASIS, extra];
const de = (extra: string) => [...DE_BASIS, extra];
const CTA_EN = "Need a price for your drawings? Send them via the link in our profile.";
const CTA_DE = "Ein Preis für Ihre Pläne? Senden Sie sie über den Link in unserem Profil.";

type EnDe = {
  tekst: Partial<Record<"en" | "de", (ctx: TemplateCtx) => Tekst>>;
  dias?: Partial<Record<"en" | "de", Dia[]>>;
};

/** Projecttekst in het Engels of Duits (archiefprojecten hebben ze). */
function projectIn(c: TemplateCtx, l: "en" | "de") {
  const r = c.realisatie ?? realisatieKeuze();
  return { r, p: r[l] ?? { titel: r.nl.titel, tekst: r.nl.tekst, cat: CATEGORIEEN[r.cat][l] } };
}

const EN_DE: Record<string, EnDe> = {
  "tip-gekend-punt": {
    tekst: {
      en: () => ({
        kop: "Check first, then dig",
        body: `Never load a new model and start digging straight away.

Check on site first:
1. Is the project found and does it open?
2. Is the model where you expect it, relative to the machine?
3. Is the level right on a known point?
4. Are all the layers there?

We check every model for levels and gradients before it goes out. The final check happens on site, with your machine, your calibration and your software version.

Two minutes of checking against half a day of rework.`,
        kort: "New model on the machine? Check on a known point first: position, level and layers. Two minutes of checking against half a day of rework.",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "Erst prüfen, dann baggern",
        body: `Laden Sie ein neues Modell nie, um sofort loszubaggern.

Prüfen Sie zuerst auf der Baustelle:
1. Wird das Projekt gefunden und geöffnet?
2. Liegt das Modell an der erwarteten Stelle zur Maschine?
3. Stimmt die Höhe auf einem bekannten Punkt?
4. Sind alle Schichten vorhanden?

Wir prüfen jedes Modell vor der Lieferung auf Höhen und Neigungen. Die letzte Kontrolle erfolgt auf der Baustelle, mit Ihrer Maschine, Ihrer Kalibrierung und Ihrer Softwareversion.

Zwei Minuten Kontrolle gegen einen halben Tag Nacharbeit.`,
        kort: "Neues Modell auf der Maschine? Zuerst auf einem bekannten Punkt prüfen: Lage, Höhe und Schichten. Zwei Minuten Kontrolle gegen einen halben Tag Nacharbeit.",
        tags: de("#GNSS"),
      }),
    },
  },
  "tip-breeklijnen": {
    tekst: {
      en: () => ({
        kop: "Breaklines make the difference",
        body: `A 3D model is more than a cloud of spot levels.

Without proper breaklines, the triangle network cuts straight across kerbs, slope edges and ditches. On screen it looks smooth, but on site the machine rounds off an edge that should be sharp.

That is why we build every model with linework:
• centrelines and edge lines
• kerbs and channels
• toe and top of batter
• ditches and tie-ins

That linework controls the surface and helps the operator find their way in the cab.`,
        kort: "Without breaklines the triangle network cuts across kerbs and slope edges. So we build every model with linework: centrelines, kerbs, batters and ditches.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Bruchkanten machen den Unterschied",
        body: `Ein 3D-Modell ist mehr als eine Wolke aus Höhenpunkten.

Ohne korrekte Bruchkanten läuft das Dreiecksnetz quer durch Bordsteine, Böschungskanten und Gräben. Auf dem Bildschirm sieht das glatt aus, auf der Baustelle rundet die Maschine eine Kante ab, die scharf sein sollte.

Deshalb bauen wir jedes Modell mit Linien auf:
• Achsen und Kantenlinien
• Bordsteine und Rinnen
• Böschungsfuß und Böschungskrone
• Gräben und Anschlüsse

Diese Linien steuern die Oberfläche und helfen dem Maschinenführer, sich in der Kabine zu orientieren.`,
        kort: "Ohne Bruchkanten läuft das Dreiecksnetz quer durch Bordsteine und Böschungskanten. Deshalb hat jedes Modell Linien: Achsen, Bordsteine, Böschungen und Gräben.",
        tags: de("#DGM"),
      }),
    },
  },
  "tip-lagen": {
    tekst: {
      en: () => ({
        kop: "One site, several layers",
        body: `A road scheme or an excavation rarely has just one design level.

For the machine, we build a separate surface for each stage:
• dig level or formation of the excavation
• top of sub-base and base
• finished level, for example underside of surfacing
• batters, ditches and tie-ins to the existing ground

In the cab, the operator simply picks the layer they are working on. No calculations, no pegs.`,
        kort: "A site rarely has one design level. We build a surface per stage: dig level, sub-base, finished level. The operator just picks the right layer.",
        tags: en("#roadworks"),
      }),
      de: () => ({
        kop: "Eine Baustelle, mehrere Schichten",
        body: `Ein Straßenprojekt oder eine Baugrube hat selten nur eine Planungshöhe.

Für die Maschine erstellen wir für jede Phase eine eigene Oberfläche:
• Aushubsohle bzw. Planum der Baugrube
• Oberkante Frostschutz- und Tragschicht
• fertige Höhe, zum Beispiel Unterkante Deckschicht
• Böschungen, Gräben und Anschlüsse an das Gelände

In der Kabine wählt der Maschinenführer einfach die Schicht, an der er arbeitet. Ohne Rechnen, ohne Pflöcke.`,
        kort: "Eine Baustelle hat selten nur eine Planungshöhe. Wir erstellen pro Phase eine Oberfläche: Aushub, Tragschicht, fertige Höhe. Der Maschinenführer wählt die richtige Schicht.",
        tags: de("#Straßenbau"),
      }),
    },
  },
  "tip-pdf": {
    tekst: {
      en: () => ({
        kop: "Only a PDF? That works too",
        body: `Not every job comes with CAD files. Sometimes there is only a PDF, or even a paper drawing.

We build a 3D model from that too. The drawing is first scaled and brought onto coordinates, using known points or the grid on the drawing. Then come the linework and the surfaces, just as with a DWG.

Good to know:
• it takes more time, which you will see in the estimated hours on the quote;
• accuracy depends on the document: a scan of a paper drawing is less accurate than a digital PDF.

Does the designer have a DWG? Always ask for it. It saves time and centimetres.`,
        kort: "Only a PDF or a paper drawing? We build a 3D model from that too: scaled and put onto coordinates, then linework and surfaces. A DWG is still faster.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Nur ein PDF? Das geht auch",
        body: `Nicht jedes Projekt kommt mit CAD-Dateien. Manchmal gibt es nur ein PDF oder sogar einen Papierplan.

Auch daraus erstellen wir ein 3D-Modell. Der Plan wird zuerst maßstäblich und auf Koordinaten gebracht, anhand bekannter Punkte oder des Gitters auf der Zeichnung. Danach folgen Linien und Oberflächen, wie bei einem DWG.

Gut zu wissen:
• es braucht mehr Zeit, das sehen Sie an den geschätzten Stunden im Angebot;
• die Genauigkeit hängt vom Dokument ab: ein gescannter Papierplan ist ungenauer als ein digitales PDF.

Hat der Planer ein DWG? Fragen Sie immer danach. Es spart Zeit und Zentimeter.`,
        kort: "Nur ein PDF oder ein Papierplan? Auch daraus erstellen wir ein 3D-Modell: maßstäblich und auf Koordinaten gebracht, dann Linien und Oberflächen. Ein DWG ist schneller.",
        tags: de("#DGM"),
      }),
    },
  },
  "tip-volumes": {
    tekst: {
      en: () => ({
        kop: "How much has to come out?",
        body: `A design model does more than guide the machine. Together with a survey of the existing ground, it also shows where you cut and where you fill, and how much.

Handy for planning: how many loads, where the spoil can go, whether you will be short.

But a volume calculation is only as good as the survey it is based on. An old or incomplete survey gives a neat figure that does not match the site. And settlement, bulking and compaction are not included.`,
        kort: "Design model plus a survey of the existing ground: that shows your cut and fill. But a volume is only as good as the survey it is based on.",
        tags: en("#earthworks"),
      }),
      de: () => ({
        kop: "Wie viel Boden muss weg?",
        body: `Ein Planungsmodell steuert nicht nur die Maschine. Zusammen mit einer Bestandsaufnahme des Geländes zeigt es auch, wo abgetragen und wo aufgefüllt wird, und wie viel.

Praktisch für die Planung: wie viele Fuhren, wohin mit dem Boden, ob Material fehlt.

Aber eine Mengenberechnung ist nur so gut wie die Aufnahme, auf der sie beruht. Eine alte oder unvollständige Aufnahme ergibt eine schöne Zahl, die auf der Baustelle nicht stimmt. Und Setzungen, Auflockerung und Verdichtung sind nicht enthalten.`,
        kort: "Planungsmodell plus Bestandsaufnahme des Geländes: so sehen Sie Abtrag und Auftrag. Aber eine Menge ist nur so gut wie die Aufnahme, auf der sie beruht.",
        tags: de("#Erdbau"),
      }),
    },
  },
  "tip-aanleveren": {
    tekst: {
      en: () => ({
        kop: "What do we need from you?",
        body: `The question we get most: what should come with the request?

In short: everything you use yourself to build it.
• setting-out plan with coordinates
• long sections and cross-sections
• levels: floor levels, manhole covers, kerbs
• survey of the existing ground, if there is one
• details of tie-ins, accesses and excavations

DWG or DXF is preferred: that is where the real coordinates are. A PDF works too, but takes more time.

Also tell us which system is on the machine and which coordinate system it works in.

${CTA_EN}`,
        kort: "What to send for a 3D model? Setting-out plan, sections, levels and a survey if there is one. Ideally DWG or DXF, and tell us the system on the machine.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Was brauchen wir von Ihnen?",
        body: `Die Frage, die wir am häufigsten hören: Was gehört zur Anfrage?

Kurz gesagt: alles, was Sie selbst für die Ausführung nutzen.
• Absteckplan mit Koordinaten
• Längs- und Querprofile
• Höhen: Fußbodenhöhen, Schachtdeckel, Bordsteine
• Bestandsaufnahme des Geländes, falls vorhanden
• Details zu Anschlüssen, Zufahrten und Baugruben

DWG oder DXF ist am besten: Dort stecken die echten Koordinaten. Ein PDF geht auch, braucht aber mehr Zeit.

Nennen Sie auch das System auf der Maschine und das Koordinatensystem, in dem sie arbeitet.

${CTA_DE}`,
        kort: "Was senden für ein 3D-Modell? Absteckplan, Profile, Höhen und eine Bestandsaufnahme, falls vorhanden. Am besten DWG oder DXF, und nennen Sie das System auf der Maschine.",
        tags: de("#DGM"),
      }),
    },
  },
  "carrousel-stelsels-be": {
    tekst: {
      en: () => ({
        kop: "Lambert 72 and TAW: position and height",
        body: `On a Belgian site, the machine works in Lambert 72 for position and in TAW for height. Sounds simple, but that is exactly where it often goes wrong.

A wrong coordinate system rarely gives an error message. The model loads fine, but sits in the wrong place or at the wrong height. And a few centimetres of height difference do not show in the cab.

What we check on every job:
• is the drawing in Lambert 72, or in local coordinates with its own origin;
• are the levels in TAW, or relative to a +0.00 datum;
• does the machine use the right geoid model (hBG18): without it, GNSS is more than 40 metres off TAW.

And before you start: always check on a known point, in position and height.`,
        kort: "Lambert 72 and TAW: position and height. A wrong system rarely gives an error: the model simply sits in the wrong place or height. We check it on every job.",
        tags: en("#Lambert72"),
      }),
      de: () => ({
        kop: "Lambert 72 und TAW: Lage und Höhe",
        body: `Auf einer belgischen Baustelle arbeitet die Maschine in Lambert 72 für die Lage und in TAW für die Höhe. Klingt einfach, aber genau da läuft es oft schief.

Ein falsches Koordinatensystem gibt fast nie eine Fehlermeldung. Das Modell wird geladen, liegt aber an der falschen Stelle oder auf der falschen Höhe. Und ein paar Zentimeter Höhenunterschied fallen in der Kabine nicht auf.

Was wir bei jedem Auftrag prüfen:
• ist der Plan in Lambert 72 gezeichnet oder in lokalen Koordinaten mit eigenem Nullpunkt;
• stehen die Höhen in TAW oder bezogen auf eine Höhe ±0,00;
• nutzt die Maschine das richtige Geoidmodell (hBG18): ohne es liegt GNSS über 40 Meter neben TAW.

Und vor dem Start: immer auf einem bekannten Punkt prüfen, in Lage und Höhe.`,
        kort: "Lambert 72 und TAW: Lage und Höhe. Ein falsches System gibt fast nie eine Fehlermeldung: Das Modell liegt einfach falsch. Wir prüfen es bei jedem Auftrag.",
        tags: de("#Lambert72"),
      }),
    },
    dias: {
      en: [
        { kop: "Lambert 72 and TAW", tekst: "Position and height: both must be right." },
        { kop: "No error message", tekst: "The model loads fine, but in the wrong place or at the wrong height." },
        { kop: "Drawn locally?", tekst: "Its own origin or a +0.00 datum must first go to Lambert 72 and TAW." },
        { kop: "Geoid hBG18", tekst: "Without the right geoid model, GNSS is more than 40 metres off TAW." },
        { kop: "Check on a known point", tekst: "In position and height, before the first bucket." },
      ],
      de: [
        { kop: "Lambert 72 und TAW", tekst: "Lage und Höhe: Beides muss stimmen." },
        { kop: "Keine Fehlermeldung", tekst: "Das Modell lädt, aber an der falschen Stelle oder Höhe." },
        { kop: "Lokal gezeichnet?", tekst: "Ein eigener Nullpunkt oder ±0,00 muss erst nach Lambert 72 und TAW." },
        { kop: "Geoid hBG18", tekst: "Ohne das richtige Geoidmodell liegt GNSS über 40 Meter neben TAW." },
        { kop: "Auf bekanntem Punkt prüfen", tekst: "In Lage und Höhe, vor dem ersten Löffel." },
      ],
    },
  },
  "carrousel-stelsels-europa": {
    tekst: {
      en: () => ({
        kop: "Working across the border?",
        body: `More and more contractors work across borders. Every country has its own coordinate system and height datum, and the machine must use exactly the same one as the model.

The systems we come across most:
• United Kingdom: OSGB36 / British National Grid, heights ODN
• Belgium: Lambert 72, heights TAW
• Netherlands: RD New, heights NAP
• France: Lambert-93 or CC42–CC50, heights NGF-IGN69
• Germany: ETRS89 / UTM 32 or 33, heights DHHN2016

Is the system not on the drawing? Then we propose one based on where the site is, and ask you to confirm before we start.`,
        kort: "Site across the border? UK: OSGB36 and ODN. Belgium: Lambert 72 and TAW. Netherlands: RD and NAP. France: Lambert-93 and IGN69. Machine and model must use the same system.",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "Baustelle im Ausland?",
        body: `Immer mehr Bauunternehmen arbeiten über die Grenze hinweg. Jedes Land hat sein eigenes Koordinatensystem und Höhenbezugssystem, und die Maschine muss genau dasselbe nutzen wie das Modell.

Die Systeme, die uns am häufigsten begegnen:
• Deutschland: ETRS89 / UTM 32 oder 33, Höhen DHHN2016
• Belgien: Lambert 72, Höhen TAW
• Niederlande: RD New, Höhen NAP
• Frankreich: Lambert-93 oder CC42–CC50, Höhen NGF-IGN69
• Luxemburg: LUREF, Höhen NG95

Steht das System nicht auf dem Plan? Dann schlagen wir eines anhand der Lage der Baustelle vor und bitten vor dem Start um Ihre Bestätigung.`,
        kort: "Baustelle im Ausland? Deutschland: ETRS89/UTM und DHHN2016. Belgien: Lambert 72 und TAW. Niederlande: RD und NAP. Maschine und Modell müssen dasselbe System nutzen.",
        tags: de("#GNSS"),
      }),
    },
    dias: {
      en: [
        { kop: "Working across the border?", tekst: "Every country has its own system and height datum." },
        { kop: "United Kingdom", tekst: "OSGB36 / British National Grid, heights ODN." },
        { kop: "Belgium", tekst: "Lambert 72, heights TAW." },
        { kop: "Netherlands and France", tekst: "RD New and NAP; Lambert-93 or CC42–CC50 and NGF-IGN69." },
        { kop: "Germany", tekst: "ETRS89 / UTM 32 or 33, heights DHHN2016." },
      ],
      de: [
        { kop: "Baustelle im Ausland?", tekst: "Jedes Land hat sein System und seinen Höhenbezug." },
        { kop: "Deutschland", tekst: "ETRS89 / UTM 32 oder 33, Höhen DHHN2016." },
        { kop: "Belgien", tekst: "Lambert 72, Höhen TAW." },
        { kop: "Niederlande", tekst: "RD New, Höhen NAP." },
        { kop: "Frankreich und Luxemburg", tekst: "Lambert-93 oder CC42–CC50 und NGF-IGN69; LUREF und NG95." },
      ],
    },
  },
  "carrousel-merken": {
    tekst: {
      en: () => ({
        kop: "One model, every brand its format",
        body: `Different machine control brands work side by side on site: Trimble, Topcon, Leica, Unicontrol, CHCNAV, and the factory-fitted systems from Komatsu and Caterpillar.

Each system reads its own files, and even within one brand it varies by software version.

That is why we ask on every job which system and which version is on the machine. You get the model in exactly that format.

Hiring in a machine with a different system? We deliver the same model in that format too, at no extra cost.`,
        kort: "Trimble, Topcon, Leica, Unicontrol, CHCNAV: each system reads its own files. You get the model in your machine's format, and for a second system at no extra cost.",
        tags: en("#Trimble"),
      }),
      de: () => ({
        kop: "Ein Modell, jede Marke ihr Format",
        body: `Auf den Baustellen arbeiten verschiedene Marken der Maschinensteuerung nebeneinander: Trimble, Topcon, Leica, Unicontrol, CHCNAV und die ab Werk verbauten Systeme von Komatsu und Caterpillar.

Jedes System liest seine eigenen Dateien, und selbst innerhalb einer Marke unterscheidet es sich je nach Softwareversion.

Deshalb fragen wir bei jedem Auftrag, welches System und welche Version auf der Maschine läuft. Sie erhalten das Modell genau in diesem Format.

Mieten Sie eine Maschine mit einem anderen System? Dann liefern wir dasselbe Modell auch in diesem Format, ohne Aufpreis.`,
        kort: "Trimble, Topcon, Leica, Unicontrol, CHCNAV: Jedes System liest seine eigenen Dateien. Sie erhalten das Modell im Format Ihrer Maschine, für ein zweites System ohne Aufpreis.",
        tags: de("#Trimble"),
      }),
    },
    dias: {
      en: [
        { kop: "One model, every brand its format", tekst: "Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar." },
        { kop: "Their own files", tekst: "Each system reads its own format, sometimes per software version." },
        { kop: "Which system, which version?", tekst: "We ask on every job." },
        { kop: "Second system on site?", tekst: "The same model, at no extra cost." },
      ],
      de: [
        { kop: "Ein Modell, jede Marke ihr Format", tekst: "Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar." },
        { kop: "Eigene Dateien", tekst: "Jedes System liest sein Format, teils je nach Softwareversion." },
        { kop: "Welches System, welche Version?", tekst: "Das fragen wir bei jedem Auftrag." },
        { kop: "Zweites System auf der Baustelle?", tekst: "Dasselbe Modell, ohne Aufpreis." },
      ],
    },
  },
  "carrousel-weergaven": {
    tekst: {
      en: () => ({
        kop: "One model, four views",
        body: `A large platform with a grid of strip footings, each at its own level.

The same model, four ways to look at it:
• height colours: what is higher, what is lower?
• gradient: does every strip drain correctly?
• contours: readable like a classic drawing
• triangle network: the surface the machine actually works to

The gradient map is a standard check before delivery: a strip that drains the wrong way stands out straight away.`,
        kort: "One model, four views: height colours, gradient, contours and triangle network. The gradient map is a standard check before delivery.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Ein Modell, vier Ansichten",
        body: `Eine große Planie mit einem Raster aus Streifenfundamenten, jedes auf seiner eigenen Höhe.

Dasselbe Modell, vier Arten, es zu lesen:
• Höhenfarben: Was liegt höher, was tiefer?
• Neigung: Entwässert jeder Streifen richtig?
• Höhenlinien: lesbar wie ein klassischer Plan
• Dreiecksnetz: die Oberfläche, nach der die Maschine tatsächlich steuert

Die Neigungskarte ist eine feste Kontrolle vor der Lieferung: Ein Streifen, der falsch entwässert, fällt sofort auf.`,
        kort: "Ein Modell, vier Ansichten: Höhenfarben, Neigung, Höhenlinien und Dreiecksnetz. Die Neigungskarte ist eine feste Kontrolle vor der Lieferung.",
        tags: de("#DGM"),
      }),
    },
    dias: {
      en: [
        { kop: "Height colours", tekst: "What is higher, what is lower?", beeld: "/3d/r/p-platform-hoogte-donker.webp" },
        { kop: "Gradient", tekst: "Does every strip drain correctly?", beeld: "/3d/r/p-platform-helling-donker.webp" },
        { kop: "Contours", tekst: "Readable like a classic drawing.", beeld: "/3d/r/p-platform-hoogtelijn-donker.webp" },
        { kop: "Triangle network", tekst: "The surface the machine works to.", beeld: "/3d/r/p-platform-draad-donker.webp" },
      ],
      de: [
        { kop: "Höhenfarben", tekst: "Was liegt höher, was tiefer?", beeld: "/3d/r/p-platform-hoogte-donker.webp" },
        { kop: "Neigung", tekst: "Entwässert jeder Streifen richtig?", beeld: "/3d/r/p-platform-helling-donker.webp" },
        { kop: "Höhenlinien", tekst: "Lesbar wie ein klassischer Plan.", beeld: "/3d/r/p-platform-hoogtelijn-donker.webp" },
        { kop: "Dreiecksnetz", tekst: "Die Oberfläche, nach der die Maschine steuert.", beeld: "/3d/r/p-platform-draad-donker.webp" },
      ],
    },
  },
  "realisatie-project": {
    tekst: {
      en: (c) => {
        const { r, p } = projectIn(c, "en");
        return {
          kop: p.titel,
          body: `${p.titel} (${p.cat.toLowerCase()})

${p.tekst}

${CAT_ZIN[r.cat].en}

From drawing to a model the machine can load straight away: design surface, linework and contours, in the right coordinate system.${r.dias ? "\n\nSwipe through the images: the same model on the aerial photo, as contours and as a triangle network. All images are on our website." : ""}`,
          kort: `${p.titel}: ${p.tekst} From drawing to a model the machine can load straight away.`,
          tags: en(SYSTEEM_TAG[r.systemen[0] ?? "Trimble"]),
        };
      },
      de: (c) => {
        const { r, p } = projectIn(c, "de");
        return {
          kop: p.titel,
          body: `${p.titel} (${p.cat})

${p.tekst}

${CAT_ZIN[r.cat].de}

Vom Plan zu einem Modell, das die Maschine sofort laden kann: Planungsoberfläche, Linien und Höhenlinien, im richtigen Koordinatensystem.${r.dias ? "\n\nBlättern Sie durch die Bilder: dasselbe Modell auf dem Luftbild, als Höhenlinien und als Dreiecksnetz. Alle Bilder stehen auf unserer Website." : ""}`,
          kort: `${p.titel}: ${p.tekst} Vom Plan zu einem Modell, das die Maschine sofort laden kann.`,
          tags: de(SYSTEEM_TAG[r.systemen[0] ?? "Trimble"]),
        };
      },
    },
  },
  "realisatie-uitgraving": {
    dias: {
      en: [
        { kop: "Gradient map", tekst: "Flat formation, batters at the right gradient: at a glance.", beeld: "/3d/r/p-uitgraving-helling-donker.webp" },
        { kop: "Contours", tekst: "The closer the lines, the steeper the batter.", beeld: "/3d/r/p-uitgraving-hoogtelijn-donker.webp" },
        { kop: "Triangle network", tekst: "The surface the machine works to, triangle by triangle.", beeld: "/3d/r/p-uitgraving-draad-donker.webp" },
      ],
      de: [
        { kop: "Neigungskarte", tekst: "Ebene Sohle, Böschungen in der richtigen Neigung: auf einen Blick.", beeld: "/3d/r/p-uitgraving-helling-donker.webp" },
        { kop: "Höhenlinien", tekst: "Je dichter die Linien, desto steiler die Böschung.", beeld: "/3d/r/p-uitgraving-hoogtelijn-donker.webp" },
        { kop: "Dreiecksnetz", tekst: "Die Oberfläche, nach der die Maschine steuert, Dreieck für Dreieck.", beeld: "/3d/r/p-uitgraving-draad-donker.webp" },
      ],
    },
    tekst: {
      en: () => ({
        kop: UITGRAVING.en.titel,
        body: `${UITGRAVING.en.titel}

${UITGRAVING.en.tekst}

Formation at level, batters at the right gradient: in the cab, the operator sees straight away how much is still to come out. No pegs, no arguments about the level.`,
        kort: `${UITGRAVING.en.titel}: formation at level, batters at the right gradient. In the cab, the operator sees straight away how much is still to come out.`,
        tags: en("#Unicontrol"),
      }),
      de: () => ({
        kop: UITGRAVING.de.titel,
        body: `${UITGRAVING.de.titel}

${UITGRAVING.de.tekst}

Sohle auf Höhe, Böschungen in der richtigen Neigung: Der Maschinenführer sieht in der Kabine sofort, wie viel noch abzutragen ist. Keine Pflöcke, keine Diskussion über die Höhe.`,
        kort: `${UITGRAVING.de.titel}: Sohle auf Höhe, Böschungen in der richtigen Neigung. Der Maschinenführer sieht in der Kabine sofort, wie viel noch abzutragen ist.`,
        tags: de("#Unicontrol"),
      }),
    },
  },
  "aanbod-vroegtijdig": {
    tekst: {
      en: () => ({
        kop: `Book early: ${eur("vroegtijdig", "en")}/h`,
        body: `Already know which sites start in the coming months? Then request the 3D model early.

More than 3 weeks ahead: ${eur("vroegtijdig", "en")}/h instead of ${eur("normaal", "en")}/h (excl. VAT).

The model is ready in your client portal when the machine arrives on site, with every revision.

${CTA_EN}`,
        kort: `Site starting in more than 3 weeks? Then we build the 3D model at ${eur("vroegtijdig", "en")}/h instead of ${eur("normaal", "en")}/h (excl. VAT). Send your drawings via our profile.`,
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: `Früh anfragen: ${eur("vroegtijdig", "de")}/Std.`,
        body: `Sie wissen schon, welche Baustellen in den nächsten Monaten starten? Dann fragen Sie das 3D-Modell früh an.

Mehr als 3 Wochen im Voraus: ${eur("vroegtijdig", "de")}/Std. statt ${eur("normaal", "de")}/Std. (zzgl. MwSt.).

Das Modell liegt in Ihrem Kundenportal bereit, wenn die Maschine auf die Baustelle kommt, mit jeder Revision.

${CTA_DE}`,
        kort: `Baustelle in mehr als 3 Wochen? Dann erstellen wir das 3D-Modell für ${eur("vroegtijdig", "de")}/Std. statt ${eur("normaal", "de")}/Std. (zzgl. MwSt.). Pläne über unser Profil senden.`,
        tags: de("#DGM"),
      }),
    },
  },
  "aanbod-lastminute": {
    tekst: {
      en: () => ({
        kop: "Design change? Model in 5 working days",
        body: `It happens to every contractor: a design change, a site that starts early, a model that is missing.

That is what last-minute is for: delivery within 5 working days, at ${eur("last-minute", "en")}/h excl. VAT.

You get a quote with the estimated hours first. We only start once you agree.

${CTA_EN}`,
        kort: `Design change and the machine is already waiting? Last-minute: 3D model within 5 working days at ${eur("last-minute", "en")}/h excl. VAT, with a quote first.`,
        tags: en("#roadworks"),
      }),
      de: () => ({
        kop: "Planänderung? Modell in 5 Arbeitstagen",
        body: `Das kennt jedes Bauunternehmen: eine Planänderung, eine Baustelle, die früher startet, ein Modell, das fehlt.

Dafür gibt es Last-Minute: Lieferung innerhalb von 5 Arbeitstagen, für ${eur("last-minute", "de")}/Std. zzgl. MwSt.

Sie erhalten zuerst ein Angebot mit den geschätzten Stunden. Wir beginnen erst nach Ihrer Zusage.

${CTA_DE}`,
        kort: `Planänderung und die Maschine wartet schon? Last-Minute: 3D-Modell innerhalb von 5 Arbeitstagen für ${eur("last-minute", "de")}/Std. zzgl. MwSt., zuerst mit Angebot.`,
        tags: de("#Straßenbau"),
      }),
    },
  },
  "aanbod-meersystemen": {
    tekst: {
      en: () => ({
        kop: "Two brands on one site?",
        body: `Your own excavator with Trimble, a hired dozer with Topcon, a subcontractor with Unicontrol. On many sites, more than one system is running.

The model underneath is identical, only the packaging differs. So we deliver the same model for every system you name, at no extra cost.

That way, every machine on site follows exactly the same design.`,
        kort: "Trimble on the excavator, Topcon on the dozer? We deliver the same model for every system you name, at no extra cost. Every machine follows the same design.",
        tags: en("#Topcon"),
      }),
      de: () => ({
        kop: "Zwei Marken auf einer Baustelle?",
        body: `Der eigene Bagger mit Trimble, eine gemietete Raupe mit Topcon, ein Nachunternehmer mit Unicontrol. Auf vielen Baustellen läuft mehr als ein System.

Das zugrunde liegende Modell ist identisch, nur die Verpackung unterscheidet sich. Deshalb liefern wir dasselbe Modell für jedes System, das Sie nennen, ohne Aufpreis.

So folgen alle Maschinen auf der Baustelle genau demselben Entwurf.`,
        kort: "Trimble auf dem Bagger, Topcon auf der Raupe? Wir liefern dasselbe Modell für jedes genannte System, ohne Aufpreis. Alle Maschinen folgen demselben Entwurf.",
        tags: de("#Topcon"),
      }),
    },
  },
  "aanbod-portaal": {
    tekst: {
      en: () => ({
        kop: "Every revision in one place",
        body: `Design change after design change, and which version is actually on the machine now?

Every model comes with its own client portal. That is where you download the files, with every revision kept separately. Revisions after a design change are charged at the same hourly rate.

No digging through mailboxes, no outdated version on the USB stick.`,
        kort: "Which version is on the machine now? Your client portal keeps every model with every revision separately. No digging through mailboxes, no old version on the USB stick.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Jede Revision an einem Ort",
        body: `Planänderung auf Planänderung, und welche Version ist jetzt eigentlich auf der Maschine?

Zu jedem Modell gehört ein eigenes Kundenportal. Dort laden Sie die Dateien herunter, jede Revision einzeln. Revisionen nach einer Planänderung kosten denselben Stundensatz.

Kein Suchen in Postfächern, keine veraltete Version auf dem USB-Stick.`,
        kort: "Welche Version ist jetzt auf der Maschine? Ihr Kundenportal hat jedes Modell mit jeder Revision einzeln. Kein Suchen in Postfächern, keine alte Version auf dem USB-Stick.",
        tags: de("#DGM"),
      }),
    },
  },
  "vraag-systeem": {
    tekst: {
      en: () => ({
        kop: "Which system is on your machine?",
        body: `A question for groundworks and road contractors: which machine control system do you use?

Trimble? Topcon? Leica? Unicontrol? CHCNAV? Or factory-fitted on your Komatsu or Cat?

And what goes wrong most often when you load a new model: the coordinate system, the levels, the file names?

We are keen to read your answers in the comments.`,
        kort: "Which machine control system do you use? Trimble, Topcon, Leica, Unicontrol, CHCNAV, or factory-fitted on your Komatsu or Cat? Let us know in the comments.",
        tags: en("#Trimble"),
      }),
      de: () => ({
        kop: "Welches System ist auf Ihrer Maschine?",
        body: `Eine Frage an die Erdbauer und Straßenbauer: Mit welchem System der Maschinensteuerung arbeiten Sie?

Trimble? Topcon? Leica? Unicontrol? CHCNAV? Oder ab Werk auf Ihrem Komatsu oder Cat?

Und was geht am häufigsten schief, wenn Sie ein neues Modell laden: das Koordinatensystem, die Höhen, die Dateinamen?

Wir lesen Ihre Antworten gern in den Kommentaren.`,
        kort: "Mit welchem System der Maschinensteuerung arbeiten Sie? Trimble, Topcon, Leica, Unicontrol, CHCNAV oder ab Werk auf Ihrem Komatsu oder Cat? Schreiben Sie es in die Kommentare.",
        tags: de("#Trimble"),
      }),
    },
  },
  "vraag-planning": {
    tekst: {
      en: () => ({
        kop: "When do you order your 3D model?",
        body: `A question for contractors and site managers: when do you order the 3D model for a site?

When the job is awarded, weeks ahead? Or only when the machine is already on site?

In practice we see both. That is why we work with three rates: early (${eur("vroegtijdig", "en")}/h), standard (${eur("normaal", "en")}/h) and last-minute within 5 working days (${eur("last-minute", "en")}/h), all excl. VAT.

How do you handle it?`,
        kort: "When do you order the 3D model for a site: weeks ahead, or when the machine is already waiting? We are curious how you handle it.",
        tags: en("#roadworks"),
      }),
      de: () => ({
        kop: "Wann bestellen Sie Ihr 3D-Modell?",
        body: `Eine Frage an Bauunternehmen und Bauleiter: Wann bestellen Sie das 3D-Modell für eine Baustelle?

Bei der Auftragsvergabe, Wochen im Voraus? Oder erst, wenn die Maschine schon auf der Baustelle steht?

In der Praxis sehen wir beides. Deshalb arbeiten wir mit drei Tarifen: frühzeitig (${eur("vroegtijdig", "de")}/Std.), normal (${eur("normaal", "de")}/Std.) und Last-Minute innerhalb von 5 Arbeitstagen (${eur("last-minute", "de")}/Std.), jeweils zzgl. MwSt.

Wie machen Sie das?`,
        kort: "Wann bestellen Sie das 3D-Modell für eine Baustelle: Wochen im Voraus oder wenn die Maschine schon wartet? Wir sind gespannt, wie Sie das machen.",
        tags: de("#Straßenbau"),
      }),
    },
  },
  "vraag-fout": {
    tekst: {
      en: () => ({
        kop: "What has gone wrong before?",
        body: `Everyone who works with machine control knows it: a model that will not open, a site ten centimetres too high, a missing layer.

What is your best, or worst, experience with a new model on the machine?

We will bundle the most common causes into a tip later.`,
        kort: "A model that will not open, a site ten centimetres too high, a missing layer: what has gone wrong for you with a new model on the machine?",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "Was ist schon einmal schiefgelaufen?",
        body: `Jeder, der mit Maschinensteuerung arbeitet, kennt es: ein Modell, das sich nicht öffnen lässt, eine Baustelle zehn Zentimeter zu hoch, eine fehlende Schicht.

Was ist Ihre beste, oder schlechteste, Erfahrung mit einem neuen Modell auf der Maschine?

Die häufigsten Ursachen fassen wir später in einem Tipp zusammen.`,
        kort: "Ein Modell, das sich nicht öffnet, eine Baustelle zehn Zentimeter zu hoch, eine fehlende Schicht: Was ist bei Ihnen mit einem neuen Modell schon schiefgelaufen?",
        tags: de("#GNSS"),
      }),
    },
  },
  "tip-tegenstrijdig": {
    tekst: {
      en: () => ({
        kop: "Level does not add up? We flag it",
        body: `Drawings sometimes contradict each other. A level on the general arrangement that does not match the long section. A gradient that does not fit the given levels.

We do not quietly fill in such points ourselves. We flag them, with the location and both values, so the designer or the site manager decides which value applies.

Better one question before delivery than an argument on site.`,
        kort: "Drawings sometimes contradict each other: a level that does not match the long section. We do not quietly pick one, we flag it, so the designer decides.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Höhe passt nicht? Wir melden es",
        body: `Pläne widersprechen sich manchmal. Eine Höhe im Lageplan, die nicht zum Längsprofil passt. Eine Neigung, die nicht zu den angegebenen Höhen passt.

Solche Punkte füllen wir nicht stillschweigend selbst aus. Wir melden sie, mit der Stelle und beiden Werten, damit der Planer oder der Bauleiter entscheidet, welcher Wert gilt.

Lieber eine Frage vor der Lieferung als eine Diskussion auf der Baustelle.`,
        kort: "Pläne widersprechen sich manchmal: eine Höhe, die nicht zum Längsprofil passt. Wir entscheiden das nicht stillschweigend, wir melden es, und der Planer entscheidet.",
        tags: de("#DGM"),
      }),
    },
  },
  "tip-werfkalibratie": {
    tekst: {
      en: () => ({
        kop: "Site calibration: only within the points",
        body: `On many sites the machine works with a local calibration: a few known points are surveyed and the GNSS readings are fitted exactly to them.

That works well, but only within the area covered by those points. Outside it, errors can build up quickly.

Is the site getting bigger, or is the machine working well outside the calibrated area? Have extra points surveyed and check again on a known point.

We deliver the model in the agreed coordinate system; the calibration on the machine is managed by the contractor or their site engineer.`,
        kort: "A local site calibration is right within the area of the surveyed points; outside it, errors can build up quickly. Site got bigger? Add points and check again.",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "Baustellenkalibrierung: nur innerhalb der Punkte",
        body: `Auf vielen Baustellen arbeitet die Maschine mit einer lokalen Kalibrierung: Einige bekannte Punkte werden eingemessen, und die GNSS-Messungen werden genau darauf abgestimmt.

Das funktioniert gut, aber nur innerhalb des Bereichs dieser Punkte. Außerhalb können die Abweichungen schnell wachsen.

Wird die Baustelle größer, oder arbeitet die Maschine weit außerhalb der kalibrierten Zone? Lassen Sie zusätzliche Punkte einmessen und prüfen Sie erneut auf einem bekannten Punkt.

Wir liefern das Modell im vereinbarten Koordinatensystem; die Kalibrierung auf der Maschine verantwortet das Bauunternehmen oder sein Vermessungstrupp.`,
        kort: "Eine lokale Baustellenkalibrierung stimmt im Bereich der gemessenen Punkte; außerhalb wachsen die Abweichungen schnell. Baustelle größer geworden? Punkte ergänzen und neu prüfen.",
        tags: de("#GNSS"),
      }),
    },
  },
  "tip-planwijziging": {
    tekst: {
      en: () => ({
        kop: "Design changed? Here is how it works",
        body: `Designs change during a project. That is normal.

Send the revised drawings with a short description of what has changed: which area, which levels, which revision. We then update the model where needed, and the new version appears in your client portal next to the previous one.

Design changes are charged by the hour. An error in the model against the drawings supplied is, of course, put right free of charge.`,
        kort: "Design changed? Send the new drawings with a short description. You get a new version in your portal, next to the old one. An error in the model is fixed free of charge.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Entwurf geändert? So geht es",
        body: `Entwürfe ändern sich während eines Projekts. Das ist normal.

Senden Sie die geänderten Pläne mit einer kurzen Beschreibung der Änderungen: welcher Bereich, welche Höhen, welcher Planstand. Dann passen wir das Modell gezielt an, und die neue Version liegt in Ihrem Kundenportal neben der vorigen.

Änderungen am Entwurf werden nach Stunden abgerechnet. Einen Fehler im Modell gegenüber den gelieferten Plänen korrigieren wir selbstverständlich kostenlos.`,
        kort: "Entwurf geändert? Neue Pläne mit kurzer Beschreibung senden. Sie erhalten eine neue Version im Portal, neben der alten. Einen Fehler im Modell beheben wir kostenlos.",
        tags: de("#DGM"),
      }),
    },
  },
  "tip-grondbalans": {
    tekst: {
      en: () => ({
        kop: "Cut and fill: loose soil takes more room",
        body: `A volume calculation sets the existing ground against the design: how much has to come out, how much has to go in.

But soil changes volume. Once dug, it takes up more room than in the ground; compacted, it takes up less. And not all excavated material is fit to reuse.

A geometric cut and fill balance is therefore a starting point for planning haulage and materials, not a final answer. For the final account, a survey on site and the specification still decide.`,
        kort: "A cut and fill balance from the model is a starting point, not a final answer: dug soil bulks up, compacted soil shrinks, and not all of it can be reused.",
        tags: en("#earthworks"),
      }),
      de: () => ({
        kop: "Massenbilanz: lockerer Boden braucht mehr Platz",
        body: `Eine Mengenberechnung stellt das Gelände dem Entwurf gegenüber: Wie viel Boden muss weg, wie viel muss dazu?

Aber Boden ändert sein Volumen. Gelöster Boden braucht mehr Platz als im gewachsenen Zustand, verdichteter Boden weniger. Und nicht jeder Aushub ist wieder verwendbar.

Eine geometrische Massenbilanz ist deshalb ein Ausgangspunkt für die Planung von Transport und Material, keine endgültige Antwort. Für die Abrechnung bleiben das Aufmaß vor Ort und das Leistungsverzeichnis maßgeblich.`,
        kort: "Eine Massenbilanz aus dem Modell ist ein Ausgangspunkt, keine endgültige Antwort: gelöster Boden lockert auf, verdichteter Boden setzt sich, und nicht alles ist wiederverwendbar.",
        tags: de("#Erdbau"),
      }),
    },
  },
  "tip-laagdikte": {
    tekst: {
      en: () => ({
        kop: "A few centimetres of layer thickness add up",
        body: `Under a pavement there are usually several layers: sub-base, base and surfacing, each with its own design thickness.

If you calculate the dig volume down to finished level instead of the bottom of the construction, you underestimate the earthworks. A few centimetres seems small, but over a large area it adds up fast.

That is why we model each layer as a separate surface. The machine follows the right level at every stage, and you see the volume per layer.`,
        kort: "Dig volume calculated to finished level? Then you underestimate the earthworks. We model each layer separately: the right level at every stage, and the volume per layer.",
        tags: en("#roadworks"),
      }),
      de: () => ({
        kop: "Ein paar Zentimeter Schichtdicke summieren sich",
        body: `Unter einer Befestigung liegen meist mehrere Schichten: Frostschutzschicht, Tragschicht und Deckschicht, jede mit eigener Planungsdicke.

Wer den Aushub bis zur fertigen Höhe berechnet statt bis zur Unterkante des Aufbaus, unterschätzt den Erdbau. Ein paar Zentimeter wirken klein, aber auf einer großen Fläche summiert sich das schnell.

Deshalb modellieren wir jede Schicht als eigene Oberfläche. So folgt die Maschine in jeder Phase der richtigen Höhe, und Sie sehen die Menge pro Schicht.`,
        kort: "Aushub bis zur fertigen Höhe berechnet? Dann unterschätzen Sie den Erdbau. Wir modellieren jede Schicht einzeln: die richtige Höhe in jeder Phase und die Menge pro Schicht.",
        tags: de("#Straßenbau"),
      }),
    },
  },
  "tip-open-formaten": {
    tekst: {
      en: () => ({
        kop: "LandXML and DXF: the open formats",
        body: `Alongside each brand's own formats, there are two open formats that are read almost everywhere.

LandXML: an open standard for surfaces (triangle network), linework, alignments and points, with their coordinates. Many machine control systems read it directly or convert it.

DXF: the common CAD format, mainly for linework and 3D polylines, and as a background drawing in the cab.

Using a system that is not on our list? With LandXML and DXF you are almost always covered. Do tell us the system and software version in your request.`,
        kort: "LandXML for surfaces, linework and points; DXF for linework and background. With those two open formats, almost every machine control system is covered.",
        tags: en("#LandXML"),
      }),
      de: () => ({
        kop: "LandXML und DXF: die offenen Formate",
        body: `Neben den eigenen Formaten jeder Marke gibt es zwei offene Formate, die fast überall gelesen werden.

LandXML: ein offener Standard für Oberflächen (Dreiecksnetz), Linien, Achsen und Punkte, mit ihren Koordinaten. Viele Maschinensteuerungen lesen ihn direkt oder wandeln ihn um.

DXF: das gängige CAD-Format, vor allem für Linien und 3D-Polylinien, und als Hintergrundplan in der Kabine.

Ihr System steht nicht auf unserer Liste? Mit LandXML und DXF sind Sie fast immer abgedeckt. Nennen Sie in der Anfrage trotzdem System und Softwareversion.`,
        kort: "LandXML für Oberflächen, Linien und Punkte; DXF für Linien und Hintergrund. Mit diesen zwei offenen Formaten ist fast jede Maschinensteuerung abgedeckt.",
        tags: de("#LandXML"),
      }),
    },
  },
  "tip-gnss-hoogte": {
    tekst: {
      en: () => ({
        kop: "GNSS is less accurate in height",
        body: `A machine on GNSS control usually fixes its position more accurately in plan than in height. On bulk earthworks that rarely shows, but on sub-base and finishing layers it does matter.

So:
• the model itself must sit well within the tolerances of the job;
• check on a known point before you start, in height too;
• for fine finishing, a total station or an extra check may be needed.

The tolerances in the specification always decide.`,
        kort: "GNSS machine control is usually less accurate in height than in plan. On sub-base and finishing that counts: check the height on a known point before you start.",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "GNSS ist in der Höhe ungenauer",
        body: `Eine Maschine mit GNSS-Steuerung bestimmt ihre Position meist genauer in der Lage als in der Höhe. Beim Erdbau fällt das selten auf, bei Tragschichten und Deckschichten aber schon.

Deshalb:
• muss das Modell selbst deutlich innerhalb der Toleranzen der Arbeit liegen;
• prüfen Sie vor dem Start auf einem bekannten Punkt, auch in der Höhe;
• für die Feinplanie kann eine Totalstation oder eine zusätzliche Kontrolle nötig sein.

Die Toleranzen des Leistungsverzeichnisses bleiben immer maßgeblich.`,
        kort: "GNSS-Maschinensteuerung ist meist ungenauer in der Höhe als in der Lage. Bei Trag- und Deckschichten zählt das: vor dem Start auch die Höhe auf einem bekannten Punkt prüfen.",
        tags: de("#GNSS"),
      }),
    },
  },
  "aanbod-buitenland": {
    tekst: {
      en: () => ({
        kop: "For sites in other countries too",
        body: `A site in the UK, the Netherlands, France, Germany or Luxembourg? We build the 3D model in that country's coordinate system and height datum, or in a local grid of your choice.

The same way of working everywhere: you send the drawings, you get a quote with the estimated hours, then the model in your machine's format.

We work in English, Dutch, French, German and Spanish.

${CTA_EN}`,
        kort: "Site in the UK, the Netherlands, France, Germany or Luxembourg? The 3D model comes in that country's coordinate system and height datum. We work in five languages.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Auch für Baustellen in anderen Ländern",
        body: `Eine Baustelle in Deutschland, Luxemburg, den Niederlanden oder Frankreich? Wir erstellen das 3D-Modell im Koordinatensystem und Höhenbezug des Landes oder in einem lokalen System Ihrer Wahl.

Überall dieselbe Arbeitsweise: Sie senden die Pläne, erhalten ein Angebot mit den geschätzten Stunden und danach das Modell im Format Ihrer Maschine.

Wir kommunizieren auf Deutsch, Englisch, Niederländisch, Französisch und Spanisch.

${CTA_DE}`,
        kort: "Baustelle in Deutschland, Luxemburg, den Niederlanden oder Frankreich? Das 3D-Modell kommt im Koordinatensystem und Höhenbezug des Landes. Kommunikation in fünf Sprachen.",
        tags: de("#DGM"),
      }),
    },
  },
  "vraag-test-stelsel": {
    tekst: {
      en: () => ({
        kop: "Test: which coordinate system is your drawing in?",
        body: `A quick test for your next site.

Open the drawing and look for the coordinate system. British National Grid (OSGB36)? And the levels: to ODN, or relative to a +0.00 site datum? In Belgium: Lambert 72 and TAW?

Cannot find it? You are not alone. But your machine needs to know, and a wrong system gives no error message: the model simply sits in the wrong place or at the wrong height.

We check it on every job, before we start.

${CTA_EN}`,
        kort: "Test: open your drawing. British National Grid? Levels to ODN or to a +0.00 site datum? Cannot find it? Your machine still needs to know. We check it on every job.",
        tags: en("#GNSS"),
      }),
      de: () => ({
        kop: "Test: In welchem System ist Ihr Plan?",
        body: `Ein kleiner Test für Ihre nächste Baustelle.

Öffnen Sie den Plan und suchen Sie das Koordinatensystem. ETRS89 / UTM? Und die Höhen: in DHHN2016 (NHN) oder bezogen auf eine Höhe ±0,00? In Belgien: Lambert 72 und TAW?

Nicht zu finden? Damit sind Sie nicht allein. Aber Ihre Maschine muss es wissen, und ein falsches System gibt keine Fehlermeldung: Das Modell liegt einfach an der falschen Stelle oder Höhe.

Wir prüfen es bei jedem Auftrag, noch bevor wir beginnen.

${CTA_DE}`,
        kort: "Test: Öffnen Sie Ihren Plan. ETRS89/UTM? Höhen in DHHN2016 oder bezogen auf ±0,00? Nicht zu finden? Ihre Maschine muss es trotzdem wissen. Wir prüfen es bei jedem Auftrag.",
        tags: de("#GNSS"),
      }),
    },
  },
  "vraag-piketten": {
    tekst: {
      en: () => ({
        kop: "How many hours did your crew spend on pegs?",
        body: `An honest question: how many hours went on setting out, knocking in pegs and checking levels last year?

With a 3D model in the cab, the operator sees the design level right on the screen. Fewer pegs, less waiting for the setting-out engineer, and the design is built the way it was drawn.

The model for a site is a few hours of modelling work, at ${eur("vroegtijdig", "en")} to ${eur("last-minute", "en")} per hour (excl. VAT). Set that against the hours you spend now.

${CTA_EN}`,
        kort: "How many hours went on pegs and checking levels last year? With a 3D model in the cab, the operator sees the design on the screen. Compare the two.",
        tags: en("#settingout"),
      }),
      de: () => ({
        kop: "Wie viele Stunden Absteckung waren es?",
        body: `Eine ehrliche Frage: Wie viele Stunden gingen letztes Jahr für Abstecken, Pflöcke setzen und Höhen nachmessen drauf?

Mit einem 3D-Modell in der Kabine sieht der Maschinenführer die Planungshöhe direkt auf dem Bildschirm. Weniger Pflöcke, weniger Warten auf den Vermessungstrupp, und der Entwurf wird so gebaut, wie er gezeichnet ist.

Das Modell für eine Baustelle sind einige Stunden Modellierung, für ${eur("vroegtijdig", "de")} bis ${eur("last-minute", "de")} pro Stunde (zzgl. MwSt.). Stellen Sie das den Stunden gegenüber, die Sie heute dafür aufwenden.

${CTA_DE}`,
        kort: "Wie viele Stunden gingen letztes Jahr für Pflöcke und Höhenkontrolle drauf? Mit einem 3D-Modell in der Kabine sieht der Maschinenführer den Entwurf auf dem Bildschirm. Vergleichen Sie.",
        tags: de("#Absteckung"),
      }),
    },
  },
  "vraag-herwerk": {
    tekst: {
      en: () => ({
        kop: "What does half a day of rework cost?",
        body: `Do the sum. Half a day of rework because of a wrong level: the machine, the operator, the lorries waiting or doing extra runs, the material that has to come out again.

Many errors on a machine-controlled site do not start in the cab, but already in the model: a wrong coordinate system, a missing layer, a level that does not match the long section.

That is why we check every model for levels, gradients and tie-ins before it goes out. And we flag contradictions in the drawings instead of filling them in ourselves.

${CTA_EN}`,
        kort: "Half a day of rework because of a wrong level: machine, operator, lorries, material. So we check every model for levels, gradients and tie-ins before delivery.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Was kostet ein halber Tag Nacharbeit?",
        body: `Rechnen Sie kurz mit. Ein halber Tag Nacharbeit wegen einer falschen Höhe: die Maschine, der Maschinenführer, die Lkw, die warten oder extra fahren, das Material, das wieder raus muss.

Viele Fehler auf einer Baustelle mit Maschinensteuerung entstehen nicht in der Kabine, sondern schon im Modell: ein falsches Koordinatensystem, eine fehlende Schicht, eine Höhe, die nicht zum Längsprofil passt.

Deshalb prüfen wir jedes Modell vor der Lieferung auf Höhen, Neigungen und Anschlüsse. Und wir melden Widersprüche in den Plänen, statt sie selbst auszufüllen.

${CTA_DE}`,
        kort: "Ein halber Tag Nacharbeit wegen einer falschen Höhe: Maschine, Maschinenführer, Lkw, Material. Deshalb prüfen wir jedes Modell vor der Lieferung auf Höhen, Neigungen und Anschlüsse.",
        tags: de("#DGM"),
      }),
    },
  },
  "vraag-machinist": {
    tekst: {
      en: () => ({
        kop: "Operators: what is missing on your screen?",
        body: `A question for everyone who sits in the cab every day.

What makes a 3D model good or bad for you? Linework for kerbs and ditches? Contours? Clear layer names? Or actually less on the screen?

We build every model with linework, separate layers per stage and a gradient check. But the best tips come from the people who use them.

Let us know in the comments.`,
        kort: "Operators, what makes a 3D model good for you? Linework, contours, clear layers, or less on the screen? Let us know.",
        tags: en("#plantoperator"),
      }),
      de: () => ({
        kop: "Maschinenführer: Was fehlt auf Ihrem Bildschirm?",
        body: `Eine Frage an alle, die jeden Tag in der Kabine sitzen.

Was macht ein 3D-Modell für Sie gut oder schlecht? Linien von Bordsteinen und Gräben? Höhenlinien? Klare Schichtnamen? Oder gerade weniger auf dem Bildschirm?

Wir bauen jedes Modell mit Linien, getrennten Schichten pro Phase und einer Neigungskontrolle. Aber die besten Tipps kommen von denen, die damit arbeiten.

Schreiben Sie es in die Kommentare.`,
        kort: "Maschinenführer, was macht ein 3D-Modell für Sie gut? Linien, Höhenlinien, klare Schichten oder weniger auf dem Bildschirm? Schreiben Sie es uns.",
        tags: de("#Baggerfahrer"),
      }),
    },
  },
  "vraag-kleine-werf": {
    tekst: {
      en: () => ({
        kop: "Only for big sites? Not true",
        body: `Many contractors think a 3D model only pays off on a motorway or a large industrial estate.

But a car park, a driveway with drainage, an excavation or a sports pitch also has gradients and levels that have to be right. That is exactly where a small mistake quickly means rework.

We charge by the hour, with a minimum of ${MINIMUM_UREN} hour per job. So a small site is a small invoice too.

${CTA_EN}`,
        kort: "A 3D model only for big sites? A car park, driveway, excavation or sports pitch also has gradients that must be right. Charged by the hour: small site, small invoice.",
        tags: en("#contractor"),
      }),
      de: () => ({
        kop: "Nur für große Baustellen? Falsch",
        body: `Viele Bauunternehmen denken, ein 3D-Modell lohne sich nur für eine Autobahn oder ein großes Gewerbegebiet.

Aber auch ein Parkplatz, eine Zufahrt mit Entwässerung, eine Baugrube oder ein Sportplatz hat Neigungen und Höhen, die stimmen müssen. Gerade dort kostet ein kleiner Fehler schnell Nacharbeit.

Wir rechnen nach Stunden ab, mit mindestens ${MINIMUM_UREN} Stunde pro Auftrag. Eine kleine Baustelle ist also auch eine kleine Rechnung.

${CTA_DE}`,
        kort: "Ein 3D-Modell nur für große Baustellen? Auch ein Parkplatz, eine Zufahrt, Baugrube oder ein Sportplatz hat Neigungen, die stimmen müssen. Nach Stunden: kleine Baustelle, kleine Rechnung.",
        tags: de("#Bauunternehmen"),
      }),
    },
  },
  "video-model": {
    tekst: {
      en: () => ({
        kop: "From drawing to model",
        body: `This is what a 3D model for machine control looks like: design surface, linework and contours, in the right coordinate system and ready to load.

We deliver the model for Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu and Caterpillar.

${CTA_EN}`,
        kort: "This is what a 3D model for machine control looks like: design surface, linework and contours, in the right system and ready to load.",
        tags: en("#3Dmodel"),
      }),
      de: () => ({
        kop: "Vom Plan zum Modell",
        body: `So sieht ein 3D-Modell für die Maschinensteuerung aus: Planungsoberfläche, Linien und Höhenlinien, im richtigen Koordinatensystem und bereit zum Laden.

Wir liefern das Modell für Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu und Caterpillar.

${CTA_DE}`,
        kort: "So sieht ein 3D-Modell für die Maschinensteuerung aus: Planungsoberfläche, Linien und Höhenlinien, im richtigen System und bereit zum Laden.",
        tags: de("#DGM"),
      }),
    },
  },
};

// Engels en Duits bij de sjablonen voegen (de NL/FR-teksten blijven ongemoeid).
for (const t of TEMPLATES) {
  const x = EN_DE[t.id];
  if (!x) continue;
  Object.assign(t.tekst, x.tekst);
  if (x.dias && t.dias) t.dias = { ...t.dias, ...x.dias };
}

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
