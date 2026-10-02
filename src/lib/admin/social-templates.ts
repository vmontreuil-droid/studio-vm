// Social-post template-bibliotheek voor de AI Content Engine.
//
// Sinds 1/10/2026: Studio VM maakt 3D-ontwerpmodellen voor machinesturing
// (graafmachines, graders, dozers) voor aannemers. De posts gaan over:
//   - tips uit de kennisbank (stelsels, lijnwerk, aanleveren, controle, …)
//   - realisaties (beelden uit public/3d/r/*.webp, zie src/lib/realisaties.ts)
//   - de tariefcategorieën (vroegtijdig / normaal / last-minute)
//   - coördinatenstelsels per land
//
// Elke template is een "bouwsteen" met:
//   - id, platform, post_kind, target_url, taal
//   - optional days[]: wanneer geschikt (ma=1, di=2, ...; geen lijst = alle dagen)
//   - build(ctx): geeft { title, body, hashtags, beeld?, kaart? }
//       beeld = projectbeeld om bij de post te voegen (mag .webp zijn)
//       kaart = PNG/JPG voor de gegenereerde social-kaart (/api/social-image)
//
// De generator (social-generator.ts) kiest elke dag 3 templates die NIET
// recent zijn gebruikt, varieert per platform en zet ze als draft klaar.
// Er wordt nooit automatisch gepost.

import {
  CATEGORIEEN,
  REALISATIES,
  type Categorie,
} from "@/lib/realisaties";
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "@/lib/tarieven";

export type RealisatieKeuze = {
  id: string;
  cat: Categorie;
  nl: { titel: string; tekst: string; cat: string };
  fr: { titel: string; tekst: string; cat: string };
  /** Lichte versie van het projectbeeld, om bij de post te voegen. */
  beeld: string;
  /** PNG/JPG voor de social-kaart (Satori kan geen WebP). */
  kaart: string;
};

export type TemplateCtx = {
  dayName: string; // "maandag", "dinsdag", ...
  dayShort: string; // "ma", "di", ...
  date: string; // "22 mei"
  /** Willekeurige realisatie, optioneel binnen een categorie. */
  realisatie: (cat?: Categorie) => RealisatieKeuze;
};

export type Template = {
  id: string;
  platform: "facebook" | "linkedin";
  post_kind: "persoonlijk" | "page" | "group" | "article" | "story";
  target_url: string;
  taal?: "nl" | "fr";
  days?: number[]; // 1-5 = ma-vr
  category:
    | "showcase"
    | "tip"
    | "question"
    | "service"
    | "positie"
    | "story-case";
  build: (ctx: TemplateCtx) => {
    title: string;
    body: string;
    hashtags: string;
    beeld?: string;
    kaart?: string;
  };
};

// ============================================================================
// Hulp
// ============================================================================

const KAART_PER_CAT: Record<Categorie, string> = {
  wegenis: "/3d/weg-kruispunt-licht.png",
  grondwerk: "/3d/relief-grondwerk-licht.png",
  bouwput: "/3d/relief-bouwput-licht.png",
  terrein: "/3d/terrein-hoogtelijnen-licht.png",
};

const EMOJI_PER_CAT: Record<Categorie, string> = {
  wegenis: "🛣️",
  grondwerk: "🚜",
  bouwput: "🏗️",
  terrein: "🗺️",
};

export function kiesRealisatie(cat?: Categorie): RealisatieKeuze {
  const pool = cat ? REALISATIES.filter((r) => r.cat === cat) : REALISATIES;
  const r = (pool.length ? pool : REALISATIES)[
    Math.floor(Math.random() * (pool.length || REALISATIES.length))
  ]!;
  return {
    id: r.id,
    cat: r.cat,
    nl: { titel: r.nl.titel, tekst: r.nl.tekst, cat: CATEGORIEEN[r.cat].nl },
    fr: { titel: r.fr.titel, tekst: r.fr.tekst, cat: CATEGORIEEN[r.cat].fr },
    beeld: r.licht,
    kaart: /\.(png|jpe?g)$/i.test(r.licht) ? r.licht : KAART_PER_CAT[r.cat],
  };
}

const eur = (c: keyof typeof UURTARIEF_CENT, l: "nl" | "fr" = "nl") =>
  euro(UURTARIEF_CENT[c], l);

const HT_NL = "#machinesturing #3Dmodel #grondwerken #wegenbouw #landmeter";
const HT_FR = "#guidagedengins #modèle3D #terrassement #voirie #géomètre";

// ============================================================================
// STORY-CASES — 1 per werkdag, korter en punchier dan feed-posts.
// Gebruikt voor /api/social-image/[id]?format=story (1080×1920).
// Vrijdag alterneert tussen twee stories (even/oneven week).
// ============================================================================
export const STORY_CASE_TEMPLATES: Template[] = [
  {
    id: "story-wegenis-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/realisaties",
    days: [1],
    category: "story-case",
    build: (ctx) => {
      const r = ctx.realisatie("wegenis");
      return {
        title: `Story · ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.wegenis} Uit de werkplaats: ${r.nl.titel.toLowerCase()}

${r.nl.tekst}

Klaar om in te laden op je machine.

3D-model nodig? → studio-vm.be`,
        hashtags: "",
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "story-bouwput-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/realisaties",
    days: [2],
    category: "story-case",
    build: (ctx) => {
      const r = ctx.realisatie("bouwput");
      return {
        title: `Story · ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.bouwput} ${r.nl.titel}

${r.nl.tekst}

Bodem op niveau, taluds op helling — zonder piketten.

→ studio-vm.be`,
        hashtags: "",
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "story-grondwerk-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/realisaties",
    days: [3],
    category: "story-case",
    build: (ctx) => {
      const r = ctx.realisatie("grondwerk");
      return {
        title: `Story · ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.grondwerk} ${r.nl.titel}

${r.nl.tekst}

Elke laag apart te kiezen in de cabine.

→ studio-vm.be`,
        hashtags: "",
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "story-terrein-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/realisaties",
    days: [4],
    category: "story-case",
    build: (ctx) => {
      const r = ctx.realisatie("terrein");
      return {
        title: `Story · ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.terrein} ${r.nl.titel}

${r.nl.tekst}

Het juiste stelsel, de juiste hoogte.

→ studio-vm.be`,
        hashtags: "",
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "story-tarief-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/tarieven",
    days: [5], // vrijdag even week
    category: "story-case",
    build: () => ({
      title: "Story · Vroeg aanvragen loont",
      body: `📅 Werf binnen meer dan 3 weken?

3D-model aan ${eur("vroegtijdig")}/u in plaats van ${eur("normaal")}/u (excl. btw).

→ studio-vm.be/nl/tarieven`,
      hashtags: "",
      kaart: "/3d/model-platform-hoogte.jpg",
    }),
  },
  {
    id: "story-lastminute-fb",
    platform: "facebook",
    post_kind: "story",
    target_url: "/nl/offerte",
    days: [5], // vrijdag oneven week
    category: "story-case",
    build: () => ({
      title: "Story · Last-minute model",
      body: `⚡ Planwijziging? Machine staat al klaar?

Last-minute: model binnen 5 werkdagen.

→ studio-vm.be/nl/offerte`,
      hashtags: "",
      kaart: "/3d/weg-trace-licht.png",
    }),
  },
];

// ============================================================================
// FEED-TEMPLATES
// ============================================================================
export const TEMPLATES: Template[] = [
  // ---------- Tips uit de kennisbank ----------
  {
    id: "tip-stelsel-be-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/coordinatenstelsels",
    days: [1, 3],
    category: "tip",
    build: () => ({
      title: "Lambert 72 of Lambert 2008? Eén keuze, groot verschil",
      body: `Lambert 72 of Lambert 2008 — op het plan lijkt het een detail. Op de werf is het het verschil tussen een model dat meteen klopt en een machine die het model niet terugvindt.

Een verkeerd stelsel geeft zelden een foutmelding. Het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of op de verkeerde hoogte. En een hoogtefout van enkele centimeters valt op het scherm in de cabine niet op.

Daarom vraag ik bij elke opdracht na:
• in welk stelsel het plan getekend is;
• welke hoogtereferentie (TAW/DNG);
• in welk stelsel de machine werkt, en of er een lokale werfkalibratie is.

En vóór de start: altijd controleren op een gekend punt, in ligging én hoogte.

Meer over stelsels per land: studio-vm.be/nl/kennis`,
      hashtags: `${HT_NL} #Lambert72`,
      kaart: "/3d/trace-luchtfoto.jpg",
    }),
  },
  {
    id: "tip-stelsel-europa-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/coordinatenstelsels",
    days: [4],
    category: "tip",
    build: () => ({
      title: "Werf over de grens? Dit stelsel staat waarschijnlijk op het plan",
      body: `Steeds meer aannemers werken over de grens. Elk land heeft zijn eigen coördinatenstelsel en hoogtereferentie, en de machine moet exact hetzelfde gebruiken als het model.

De stelsels die ik het vaakst tegenkom:
🇧🇪 België — Lambert 72 of 2008, hoogte TAW/DNG
🇳🇱 Nederland — RD New, hoogte NAP
🇫🇷 Frankrijk — Lambert-93 of CC42–CC50, hoogte NGF-IGN69
🇩🇪 Duitsland — ETRS89 / UTM 32 of 33, hoogte DHHN2016
🇱🇺 Luxemburg — LUREF, hoogte NG95
🇬🇧 VK — British National Grid, hoogte ODN

Staat het stelsel niet op het plan? Dan stel ik er één voor op basis van de ligging van de werf, en vraag ik bevestiging vóór ik begin.

Een 3D-model nodig voor een werf in het buitenland? studio-vm.be`,
      hashtags: `${HT_NL} #GNSS`,
      kaart: "/3d/trace-luchtfoto.jpg",
    }),
  },
  {
    id: "tip-lijnwerk-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/lijnwerk-en-breeklijnen",
    days: [2, 5],
    category: "tip",
    build: () => ({
      title: "Waarom breeklijnen het verschil maken",
      body: `Een 3D-model is meer dan een wolk hoogtepunten.

Zonder correcte breeklijnen trekt het driehoeksnet dwars door boordstenen, taludkanten en grachten. Op het scherm ziet het er vlot uit — op de werf graaft de machine een afgeronde kant waar een scherpe hoek hoort.

Daarom bouw ik elk model op met lijnwerk:
✔ assen en kantlijnen
✔ boordstenen en goten
✔ taludvoet en -kruin
✔ grachten en aansluitingen

Dat lijnwerk stuurt het oppervlak én helpt de machinist zich te oriënteren in de cabine.

Voorbeelden: studio-vm.be/nl/realisaties`,
      hashtags: HT_NL,
      kaart: "/3d/terrein-lijnwerk.jpg",
    }),
  },
  {
    id: "tip-aanleveren-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/wat-aanleveren",
    days: [2],
    category: "tip",
    build: () => ({
      title: "Wat heb ik nodig voor een 3D-model?",
      body: `De vraag die ik het vaakst krijg: wat moet ik doorsturen?

Kort: alles wat je zelf voor de uitvoering gebruikt.
• inplantingsplan met coördinaten
• lengte- en dwarsprofielen
• peilen: vloerpeilen, putdeksels, boordstenen
• opmeting van het bestaande terrein, als die er is
• details van aansluitingen, opritten en bouwputten

DWG of DXF heeft de voorkeur: daar zitten de echte coördinaten in. Een PDF kan ook, maar dan breng ik het plan eerst op schaal en op coördinaten — dat vraagt meer tijd.

En niet vergeten: in welk stelsel werkt de machine, en welk systeem staat erop?

Plannen doorsturen voor een prijs: studio-vm.be/nl/offerte`,
      hashtags: HT_NL,
      kaart: "/3d/model-bedrijfsterrein.jpg",
    }),
  },
  {
    id: "tip-controle-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/controle-en-toleranties",
    days: [3],
    category: "tip",
    build: () => ({
      title: "Altijd eerst controleren op een gekend punt",
      body: `Een tip die geld bespaart: laad een nieuw model nooit in om meteen te beginnen graven.

Controleer eerst, op de werf:
1️⃣ wordt het project gevonden en geopend?
2️⃣ ligt het model op de verwachte plaats ten opzichte van de machine?
3️⃣ klopt de hoogte op een gekend punt?
4️⃣ zijn alle verwachte lagen aanwezig?

Ik controleer elk model op niveaus en hellingen voor het vertrekt. Maar de laatste controle gebeurt op de werf — met je eigen machine, je eigen kalibratie, je eigen softwareversie.

Twee minuten controle tegenover een halve dag herstelwerk.`,
      hashtags: HT_NL,
      kaart: "/3d/model-platform-helling.jpg",
    }),
  },
  {
    id: "tip-lagen-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/wat-is-een-3d-model",
    days: [1, 4],
    category: "tip",
    build: () => ({
      title: "Eén werf, meerdere lagen",
      body: `Een wegproject of bouwput heeft zelden één ontwerpniveau.

Voor de machine maak ik per fase een apart oppervlak:
• uitgravingsniveau of bodem van de bouwput
• bovenkant (onder)fundering
• afgewerkt niveau, bv. onderkant verharding
• taluds, grachten en aansluitingen op het bestaande terrein

Zo kiest de machinist in de cabine gewoon de laag waarop hij op dat moment werkt — zonder rekenen, zonder piketten.

Wat is een 3D-ontwerpmodel precies? studio-vm.be/nl/kennis`,
      hashtags: HT_NL,
      kaart: "/3d/driehoeksnet-licht.png",
    }),
  },
  {
    id: "tip-pdf-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/van-pdf-naar-model",
    days: [5],
    category: "tip",
    build: () => ({
      title: "Enkel een PDF? Dan kan het ook",
      body: `Niet elk project komt met CAD-bestanden. Soms is er alleen een PDF, of zelfs een papieren plan.

Ook daaruit bouw ik een 3D-model. Het plan wordt eerst op schaal en op coördinaten gebracht, aan de hand van gekende punten of het rooster op de tekening. Daarna volgen het lijnwerk en de oppervlakken, net als bij een DWG.

Twee dingen om te weten:
• het vraagt meer tijd — dat zie je terug in het geschatte aantal uren in de offerte;
• de nauwkeurigheid hangt af van het document. Een scan van een papieren plan is minder nauwkeurig dan een digitale PDF.

Heb je de originele DWG van de ontwerper? Vraag hem altijd op. Het scheelt tijd én centimeters.`,
      hashtags: HT_NL,
      kaart: "/3d/terrein-hoogtelijnen-licht.png",
    }),
  },
  {
    id: "tip-volumes-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/grondverzet-en-volumes",
    days: [3],
    category: "tip",
    build: () => ({
      title: "Hoeveel grond gaat er af, hoeveel komt er bij?",
      body: `Een ontwerpmodel stuurt niet alleen de machine. Samen met een opmeting van het bestaande terrein toont het ook waar er afgegraven en waar er aangevuld wordt — en hoeveel.

Handig voor de planning: hoeveel vrachten, waar de grond naartoe kan, of er een tekort is.

Maar: een volumeberekening is zo goed als de opmeting waarop ze steunt. Een oude of onvolledige opmeting geeft een mooi getal dat op de werf niet klopt. En zettingen, losse grond en verdichting zitten er niet in.

Meer daarover: studio-vm.be/nl/kennis`,
      hashtags: `${HT_NL} #grondverzet`,
      kaart: "/3d/relief-grondwerk-licht.png",
    }),
  },
  {
    id: "tip-merken-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/kennis/bestanden-per-merk",
    days: [2, 4],
    category: "tip",
    build: () => ({
      title: "Trimble, Topcon, Leica, Unicontrol… één model, elk zijn formaat",
      body: `Op Belgische werven draaien verschillende merken machinesturing: Trimble, Topcon, Leica, Unicontrol, CHCNAV — en de systemen die Komatsu en Caterpillar af fabriek inbouwen.

Elk systeem leest zijn eigen bestanden, en zelfs binnen één merk verschilt het per softwareversie.

Daarom vraag ik bij elke opdracht: welk systeem en welke versie staat op de machine? Het model wordt geleverd in precies dat formaat.

Huur je een machine in met een ander systeem? Dan lever ik hetzelfde model ook in dat formaat — zonder meerprijs. Zo volgen twee machines op dezelfde werf exact hetzelfde ontwerp.`,
      hashtags: `${HT_NL} #Trimble #Topcon #Leica #Unicontrol`,
      kaart: "/3d/driehoeksnet-licht.png",
    }),
  },

  // ---------- Realisaties ----------
  {
    id: "showcase-realisatie-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [1, 3, 5],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie();
      return {
        title: `Realisatie — ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT[r.cat]} ${r.nl.titel} (${r.nl.cat.toLowerCase()})

${r.nl.tekst}

Van plan naar een model dat de machine meteen kan inladen: ontwerpoppervlak, lijnwerk en hoogtelijnen, in het juiste coördinatenstelsel.

Meer voorbeelden: studio-vm.be/nl/realisaties`,
        hashtags: HT_NL,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "showcase-wegenis-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [2],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie("wegenis");
      return {
        title: `Wegenis — ${r.nl.titel}`,
        body: `Uit de werkplaats: ${r.nl.titel.toLowerCase()}.

${r.nl.tekst}

Bij wegenis zit de nauwkeurigheid in de details: verkanting in de bochten, aansluitingen op bestaande wegen, boordstenen en goten op het juiste peil. Elk van die lijnen komt in het model, zodat de grader of graafmachine exact weet waar het ontwerp van richting verandert.

Benieuwd hoe zo'n model eruitziet voor jouw werf? studio-vm.be/nl/realisaties`,
        hashtags: `${HT_NL} #wegenis`,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "showcase-bouwput-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [4],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie("bouwput");
      return {
        title: `Bouwput — ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.bouwput} ${r.nl.titel}

${r.nl.tekst}

Bodem op niveau, taluds op de juiste helling, putten en sleuven elk op hun eigen diepte — de machinist ziet in de cabine meteen hoeveel er nog af moet.

Geen piketten, geen uitzetwerk, geen discussie over het peil.

Meer voorbeelden: studio-vm.be/nl/realisaties`,
        hashtags: HT_NL,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "showcase-grondwerk-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [1, 5],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie("grondwerk");
      return {
        title: `Grondwerk — ${r.nl.titel}`,
        body: `Realisatie: ${r.nl.titel.toLowerCase()}.

${r.nl.tekst}

Platformen op verschillende niveaus, overgangstaluds, funderingsputten op eigen diepte: in een 3D-model zit dat allemaal in één bestand, per laag te kiezen in de cabine.

Het resultaat: minder meetwerk op de werf en een machinist die rechtstreeks op hoogte werkt.

Meer realisaties: studio-vm.be/nl/realisaties`,
        hashtags: HT_NL,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "showcase-terrein-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [2],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie("terrein");
      return {
        title: `Terreinmodel — ${r.nl.titel}`,
        body: `${EMOJI_PER_CAT.terrein} ${r.nl.titel}

${r.nl.tekst}

Een goed model van de bestaande toestand is de basis: daarop sluit het ontwerp aan, en daarmee zie je hoeveel grond er af moet of bij komt.

Meer voorbeelden: studio-vm.be/nl/realisaties`,
        hashtags: HT_NL,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
  },
  {
    id: "showcase-uitgelicht-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/realisaties",
    days: [3],
    category: "showcase",
    build: () => ({
      title: "Eén model, vier weergaven",
      body: `Een groot werkvlak met een raster van funderingsstroken, elk op zijn eigen niveau.

Hetzelfde model, vier manieren om het te bekijken:
• hoogtekleuren — waar ligt wat hoger of lager
• helling — watert elke strook correct af?
• hoogtelijnen — leesbaar zoals op een klassiek plan
• driehoeksnet — het oppervlak waarop de machine effectief stuurt

De hellingskaart is een vaste controle vóór levering: een strook die verkeerd afwatert, valt daar meteen op.

Bekijk de vier weergaven: studio-vm.be/nl/realisaties`,
      hashtags: HT_NL,
      beeld: "/3d/r/p-platform-helling-licht.webp",
      kaart: "/3d/model-platform-helling.jpg",
    }),
  },

  // ---------- Tarieven & werkwijze ----------
  {
    id: "service-tarieven-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/tarieven",
    days: [1],
    category: "service",
    build: () => ({
      title: "Eerlijke uurtarieven, vooraf geschat",
      body: `Hoe reken ik een 3D-model aan? Per uur modelleerwerk, met vooraf een schatting in de offerte.

📅 Vroegtijdig (meer dan 3 weken op voorhand): ${eur("vroegtijdig")}/u
🗓️ Normaal (levering binnen 1 à 3 weken): ${eur("normaal")}/u
⚡ Last-minute (levering binnen 5 werkdagen): ${eur("last-minute")}/u

Alle prijzen excl. btw, minimum ${MINIMUM_UREN} uur.

Altijd inbegrepen: ontwerpoppervlak, lijnwerk en hoogtelijnen, het juiste coördinatenstelsel, controle vóór levering, en levering voor al je machinesturingen — meerdere systemen zonder meerprijs.

Hoe vroeger je aanvraagt, hoe voordeliger. studio-vm.be/nl/tarieven`,
      hashtags: HT_NL,
      kaart: "/3d/model-parking.jpg",
    }),
  },
  {
    id: "service-lastminute-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/offerte",
    days: [2, 4],
    category: "service",
    build: () => ({
      title: "Plan gewijzigd en de machine staat al klaar?",
      body: `Het overkomt elke aannemer: een planwijziging, een werf die vroeger start, een model dat ontbreekt.

Daarvoor is er last-minute: levering binnen 5 werkdagen, aan ${eur("last-minute")}/u excl. btw.

Stuur de plannen door: je krijgt eerst een offerte met het geschatte aantal uren, pas daarna begin ik eraan.

👉 studio-vm.be/nl/offerte`,
      hashtags: HT_NL,
      kaart: "/3d/weg-trace-licht.png",
    }),
  },
  {
    id: "service-vroegtijdig-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/tarieven",
    days: [1],
    category: "service",
    build: () => ({
      title: "Vroeg aanvragen loont",
      body: `Weet je nu al welke werven er de komende maanden starten? Vraag het 3D-model dan vroegtijdig aan.

Meer dan 3 weken op voorhand: ${eur("vroegtijdig")}/u in plaats van ${eur("normaal")}/u (excl. btw).

Het model staat klaar in je klantenportaal wanneer de machine op de werf komt, met elke revisie erbij.

Tarieven: studio-vm.be/nl/tarieven`,
      hashtags: HT_NL,
      kaart: "/3d/model-platform-hoogte.jpg",
    }),
  },
  {
    id: "service-meersystemen-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/3d-modellen",
    days: [5],
    category: "service",
    build: () => ({
      title: "Twee merken op één werf? Geen meerprijs",
      body: `Een eigen graafmachine met Trimble, een ingehuurde dozer met Topcon, een onderaannemer met Unicontrol. Op veel werven draait meer dan één systeem.

Het onderliggende model is identiek — alleen de verpakking verschilt. Daarom lever ik hetzelfde model voor elk systeem dat je opgeeft, zonder meerprijs.

Zo volgen alle machines op de werf exact hetzelfde ontwerp, en is er geen discussie over wie op welk peil gewerkt heeft.

studio-vm.be/nl/3d-modellen`,
      hashtags: `${HT_NL} #Trimble #Topcon #Unicontrol`,
      kaart: "/3d/driehoeksnet-licht.png",
    }),
  },
  {
    id: "service-portaal-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/3d-modellen",
    days: [3],
    category: "service",
    build: () => ({
      title: "Elke revisie op één plek",
      body: `Planwijziging na planwijziging — en welke versie staat nu eigenlijk op de machine?

Bij elk model krijg je een eigen klantenportaal: daar download je de bestanden, met elke revisie apart. Revisies na een planwijziging gebeuren aan hetzelfde uurtarief.

Geen zoekwerk in mailboxen, geen verouderde versie op de USB-stick.

studio-vm.be/nl/3d-modellen`,
      hashtags: HT_NL,
      kaart: "/3d/terrein-hoogtekleuren.jpg",
    }),
  },

  // ---------- Positionering ----------
  {
    id: "positie-landmeter-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/3d-modellen",
    days: [4],
    category: "positie",
    build: () => ({
      title: "Waarom een landmeter je 3D-modellen maakt",
      body: `Een 3D-model voor machinesturing is landmeetkunde: coördinatenstelsels, hoogtereferenties, kalibraties, toleranties.

Als landmeter werk ik dagelijks met die vragen. Daarom kijk ik bij elk model niet alleen of het oppervlak klopt, maar ook of het in het juiste stelsel staat, of de hoogtes aansluiten op de peilen van het plan en of de hellingen afwateren zoals bedoeld.

Wat ik lever: een model dat je machine meteen kan inladen.
Wat bij jou blijft: de werfkalibratie, de instellingen van de machine en de controle op de werf.

Duidelijke afspraken, geen verrassingen. studio-vm.be`,
      hashtags: HT_NL,
      kaart: "/3d/trace-weg.jpg",
    }),
  },
  {
    id: "positie-geen-piketten-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/3d-modellen",
    days: [5],
    category: "positie",
    build: () => ({
      title: "Minder piketten, meer graven",
      body: `Met een goed 3D-model op de machine:
✔ geen piketten die omver gereden worden
✔ geen wachten op uitzetwerk
✔ de machinist ziet in centimeters hoeveel er nog af moet
✔ taluds en hellingen in één beweging juist

Het model is de basis. Klopt het model, dan klopt het werk.

Plannen doorsturen: studio-vm.be/nl/offerte`,
      hashtags: HT_NL,
      kaart: "/3d/model-talud-helling.jpg",
    }),
  },

  // ---------- Vragen aan de doelgroep ----------
  {
    id: "question-systeem-fb",
    platform: "facebook",
    post_kind: "group",
    target_url: "/nl/3d-modellen",
    days: [2],
    category: "question",
    build: () => ({
      title: "Met welk systeem werk jij?",
      body: `Vraag aan de grondwerkers en wegenbouwers hier: met welk machinesturingssysteem werk je?

Trimble? Topcon? Leica? Unicontrol? CHCNAV? Of af fabriek op je Komatsu of Cat?

En wat loopt er het vaakst mis als je een nieuw model inlaadt — het stelsel, de hoogte, de bestandsnamen?

Benieuwd naar jullie ervaringen. 👇`,
      hashtags: "",
      kaart: "/3d/driehoeksnet-licht.png",
    }),
  },
  {
    id: "question-planning-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/offerte",
    days: [1],
    category: "question",
    build: () => ({
      title: "Wanneer vraag jij je 3D-model aan?",
      body: `Een vraag aan aannemers en werfleiders: wanneer vraag je het 3D-model voor een werf aan?

Bij de opdracht, weken op voorhand? Of pas als de machine al op de werf staat?

In de praktijk zie ik beide. Daarom werk ik met drie tarieven: vroegtijdig (${eur("vroegtijdig")}/u), normaal (${eur("normaal")}/u) en last-minute binnen 5 werkdagen (${eur("last-minute")}/u), telkens excl. btw.

Hoe pakken jullie dat aan? Ik lees graag mee in de reacties.`,
      hashtags: HT_NL,
      kaart: "/3d/weg-kruispunt-licht.png",
    }),
  },

  // ---------- Frans (Wallonië / Frankrijk) ----------
  {
    id: "tip-stelsel-fr-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/fr/kennis/coordinatenstelsels",
    taal: "fr",
    days: [2],
    category: "tip",
    build: () => ({
      title: "Lambert 72 ou Lambert 2008 ? Un détail qui coûte cher",
      body: `Lambert 72 ou Lambert 2008 : sur le plan, cela ressemble à un détail. Sur chantier, c'est la différence entre un modèle qui tombe juste et une machine qui ne le retrouve pas.

Un mauvais système ne donne presque jamais de message d'erreur. Le modèle se charge, mais il est décalé — en plan ou en altitude. Et quelques centimètres d'écart ne se voient pas sur l'écran en cabine.

Pour chaque mission, je vérifie :
• le système dans lequel le plan est dessiné ;
• la référence altimétrique (DNG/TAW) ;
• le système de la machine, et s'il y a une calibration locale.

Et avant de commencer : toujours contrôler sur un point connu.

Plus d'infos : studio-vm.be/fr/kennis`,
      hashtags: HT_FR,
      kaart: "/3d/trace-luchtfoto.jpg",
    }),
  },
  {
    id: "service-tarifs-fr-li",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/fr/tarieven",
    taal: "fr",
    days: [4],
    category: "service",
    build: () => ({
      title: "Des tarifs horaires clairs, estimés à l'avance",
      body: `Comment je facture un modèle 3D ? À l'heure de modélisation, avec une estimation dans le devis.

📅 Anticipé (plus de 3 semaines à l'avance) : ${eur("vroegtijdig", "fr")}/h
🗓️ Normal (livraison sous 1 à 3 semaines) : ${eur("normaal", "fr")}/h
⚡ Urgent (livraison sous 5 jours ouvrables) : ${eur("last-minute", "fr")}/h

Hors TVA, minimum ${MINIMUM_UREN} heure. Toujours inclus : surface, lignes et courbes de niveau, le bon système de coordonnées, contrôle avant livraison et livraison pour tous vos systèmes de guidage, sans supplément.

studio-vm.be/fr/tarieven`,
      hashtags: HT_FR,
      kaart: "/3d/model-parking.jpg",
    }),
  },
  {
    id: "showcase-realisation-fr-fb",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/fr/realisaties",
    taal: "fr",
    days: [5],
    category: "showcase",
    build: (ctx) => {
      const r = ctx.realisatie();
      return {
        title: `Réalisation — ${r.fr.titel}`,
        body: `${EMOJI_PER_CAT[r.cat]} ${r.fr.titel} (${r.fr.cat.toLowerCase()})

${r.fr.tekst}

Du plan à un modèle que la machine charge directement : surface de conception, lignes et courbes de niveau, dans le bon système de coordonnées.

Plus d'exemples : studio-vm.be/fr/realisaties`,
        hashtags: HT_FR,
        beeld: r.beeld,
        kaart: r.kaart,
      };
    },
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
  // 3. Nog steeds te weinig (alles recent gebruikt)? Dan alles.
  if (candidates.length < n) candidates = [...TEMPLATES];
  // 4. Mix per platform: probeer 50/50 verdeling tussen FB en LinkedIn
  const fb = candidates.filter((t) => t.platform === "facebook");
  const li = candidates.filter((t) => t.platform === "linkedin");
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const fbShuf = shuffle(fb);
  const liShuf = shuffle(li);
  const out: Template[] = [];
  let fi = 0;
  let li2 = 0;
  for (let i = 0; i < n; i++) {
    // Alterneren — bij voorkeur FB-LI-FB
    const pickFb = i === 0 || i === 2;
    if (pickFb && fi < fbShuf.length) out.push(fbShuf[fi++]);
    else if (li2 < liShuf.length) out.push(liShuf[li2++]);
    else if (fi < fbShuf.length) out.push(fbShuf[fi++]);
  }
  return out;
}

// Hulp — kies de story voor vandaag (één per werkdag).
// Vrijdag alterneert: even weken → tarief, oneven → last-minute.
export function pickStoryCaseForDay(
  dayOfWeek: number, // 1=ma, 5=vr
  weekNumber: number = 0,
): Template | null {
  const candidates = STORY_CASE_TEMPLATES.filter((t) =>
    t.days?.includes(dayOfWeek),
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!;
  return weekNumber % 2 === 0 ? candidates[0]! : candidates[1]!;
}
