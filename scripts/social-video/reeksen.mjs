// De modellen waar scripts/social-video.mjs video's van maakt, met hun teksten.
//
// Twee soorten:
//   lagen  — meerdere weergaven van één model die exact op elkaar liggen
//            (hoogtekleuren, helling, hoogtelijnen, driehoeksnet): de camera
//            zoomt traag in en de weergaven vloeien in elkaar over.
//   camera — één render: de camera glijdt van overzicht naar twee details en
//            terug (Ken Burns), telkens met een korte rustpauze.
//
// Regels voor elke tekst hier (ze staan op het beeld én in het bijschrift):
//   - geen klant-, werf- of plaatsnaam, geen persoonsnaam;
//   - nooit "landmeter"/"géomètre" (beschermde titel), nooit MV3D of Convertor;
//   - "machinesturing" (NL) en "guidage d'engins" (FR); we spreken als "we",
//     de lezer is "u" / "vous";
//   - geen link of webadres in de teksten (studio-vm.be staat enkel op het
//     slotbeeld van de video).
// Titels en zinnen van de enkele renders komen uit src/lib/realisaties.ts
// (daar al anoniem gemaakt). Geen luchtfoto's: een dorp is herkenbaar en een
// video wordt zonder akkoord ingepland.

/** Categorie → label (bovenregel op het beeld) en hashtag. */
export const CATEGORIE = {
  wegenis: { nl: "Wegenis", fr: "Voiries", tag: { nl: "#wegenbouw", fr: "#voirie" } },
  grondwerk: { nl: "Grondwerk & platformen", fr: "Terrassements & plateformes", tag: { nl: "#grondwerk", fr: "#plateforme" } },
  bouwput: { nl: "Bouwputten & bekkens", fr: "Fouilles & bassins", tag: { nl: "#bouwput", fr: "#fouille" } },
  terrein: { nl: "Terreinmodellen", fr: "Modèles de terrain", tag: { nl: "#terreinmodel", fr: "#topographie" } },
};

const r = (id) => `/3d/r/${id}-donker.webp`;

/** Eén render, camera van overzicht naar details. */
const enkel = (id, bestand, cat, nl, fr) => ({ id, soort: "camera", cat, weergaven: [{ bestand }], nl, fr });

/**
 * @typedef {{ kop: string, sub: string }} EnkelTekst
 * @typedef {{ kop: string, intro: string, weergaven: Array<{ label: string, sub: string }> }} LagenTekst
 * @typedef {{ id: string, soort: "lagen" | "camera", cat: keyof typeof CATEGORIE,
 *   weergaven: Array<{ bestand: string, lijnen?: boolean }>, nl: EnkelTekst | LagenTekst, fr: EnkelTekst | LagenTekst }} Reeks
 */

/** @type {Reeks[]} */
export const REEKSEN = [
  {
    id: "platform",
    soort: "lagen",
    cat: "grondwerk",
    weergaven: [
      { bestand: r("p-platform-hoogte") },
      { bestand: r("p-platform-helling") },
      { bestand: r("p-platform-hoogtelijn") },
      { bestand: r("p-platform-draad"), lijnen: true },
    ],
    nl: {
      kop: "Eén model, vier weergaven",
      intro: "Eén model, vier weergaven: hoogtekleuren, helling, hoogtelijnen en het driehoeksnet waarop de machine stuurt. De hellingskaart is een vaste controle vóór levering.",
      weergaven: [
        { label: "Hoogtekleuren", sub: "Wat ligt hoger, wat lager?" },
        { label: "Helling", sub: "Watert elke strook correct af?" },
        { label: "Hoogtelijnen", sub: "Leesbaar zoals een klassiek plan." },
        { label: "Driehoeksnet", sub: "Het oppervlak waarop de machine stuurt." },
      ],
    },
    fr: {
      kop: "Un modèle, quatre vues",
      intro: "Un modèle, quatre vues : couleurs hypsométriques, pente, courbes de niveau et le réseau de triangles sur lequel la machine se guide. La carte des pentes est un contrôle systématique avant livraison.",
      weergaven: [
        { label: "Couleurs hypsométriques", sub: "Qu'est-ce qui est plus haut ou plus bas ?" },
        { label: "Pente", sub: "Chaque semelle s'écoule-t-elle correctement ?" },
        { label: "Courbes de niveau", sub: "Lisible comme un plan classique." },
        { label: "Réseau de triangles", sub: "La surface sur laquelle la machine se guide." },
      ],
    },
  },
  {
    id: "uitgraving",
    soort: "lagen",
    cat: "bouwput",
    // Het driehoeksnet van deze reeks is anders in beeld gebracht: niet mee.
    weergaven: [
      { bestand: r("p-uitgraving-hoogte") },
      { bestand: r("p-uitgraving-helling") },
      { bestand: r("p-uitgraving-hoogtelijn") },
    ],
    nl: {
      kop: "Uitgraving met taluds",
      intro: "Een uitgraving met taluds rondom en een vlakke bodem, in drie weergaven: hoogtekleuren, helling en hoogtelijnen.",
      weergaven: [
        { label: "Hoogtekleuren", sub: "Bodem en taluds in één oogopslag." },
        { label: "Helling", sub: "Elk talud op de juiste helling." },
        { label: "Hoogtelijnen", sub: "Leesbaar zoals een klassiek plan." },
      ],
    },
    fr: {
      kop: "Excavation talutée",
      intro: "Une excavation avec talus périphériques et fond plat, en trois vues : couleurs hypsométriques, pente et courbes de niveau.",
      weergaven: [
        { label: "Couleurs hypsométriques", sub: "Fond et talus en un coup d'œil." },
        { label: "Pente", sub: "Chaque talus à la bonne pente." },
        { label: "Courbes de niveau", sub: "Lisible comme un plan classique." },
      ],
    },
  },
  enkel("bouwput", "/3d/relief-bouwput-donker.png", "bouwput",
    { kop: "Bouwput", sub: "Uitgraving met taluds en werkvloer op niveau." },
    { kop: "Fouille", sub: "Excavation avec talus et fond de fouille à niveau." }),
  enkel("kruispunt", "/3d/weg-kruispunt-donker.png", "wegenis",
    { kop: "Weg met kruispunt", sub: "Lang tracé met aansluiting, in hoogtekleuren." },
    { kop: "Route avec carrefour", sub: "Long tracé avec raccord, en couleurs hypsométriques." }),
  enkel("t013", r("t013"), "terrein",
    { kop: "Bestaand terrein", sub: "Opgemeten maaiveld als basis voor het ontwerp." },
    { kop: "Terrain existant", sub: "Terrain naturel levé, base du projet." }),
  enkel("t088", r("t088"), "grondwerk",
    { kop: "Bedrijfsterrein", sub: "Platformen en verhardingen op verschillende niveaus." },
    { kop: "Zone d'activité", sub: "Plateformes et revêtements à plusieurs niveaux." }),
  enkel("t037", r("t037"), "bouwput",
    { kop: "Bouwput met taluds", sub: "Diepe uitgraving met taluds rondom." },
    { kop: "Fouille talutée", sub: "Excavation profonde avec talus périphériques." }),
  enkel("parking", "/3d/h/parking-hellingen-donker.webp", "grondwerk",
    { kop: "Parking met afwatering", sub: "De hellingskaart toont of elk vak correct afwatert." },
    { kop: "Parking avec écoulement", sub: "La carte des pentes montre si chaque place s'écoule bien." }),
  enkel("t033", r("t033"), "grondwerk",
    { kop: "Talud in bocht", sub: "Gebogen talud met constante helling." },
    { kop: "Talus en courbe", sub: "Talus courbe à pente constante." }),
  enkel("grondwerk", "/3d/relief-grondwerk-donker.png", "grondwerk",
    { kop: "Grondwerk", sub: "Platformen in reliëf, met hoogtekleuren." },
    { kop: "Terrassement", sub: "Plateformes en relief, en couleurs hypsométriques." }),
  enkel("t023", r("t023"), "terrein",
    { kop: "Terreinmodel", sub: "Golvend terrein met fijne hoogtelijnen." },
    { kop: "Modèle de terrain", sub: "Terrain ondulé avec courbes fines." }),
  enkel("t017", r("t017"), "bouwput",
    { kop: "Bekken met compartimenten", sub: "Bekken met tussenwanden op niveau." },
    { kop: "Bassin compartimenté", sub: "Bassin avec cloisons à niveau." }),
  enkel("t029", r("t029"), "wegenis",
    { kop: "Aftakking", sub: "Wegaansluiting met vloeiende bochten en verkanting." },
    { kop: "Embranchement", sub: "Raccord routier avec courbes fluides et dévers." }),
  enkel("t095", r("t095"), "grondwerk",
    { kop: "Platformen op niveaus", sub: "Aansluitende vlakken met overgangstaluds." },
    { kop: "Plateformes à niveaux", sub: "Surfaces contiguës avec talus de transition." }),
  enkel("hoogtelijnen", "/3d/terrein-hoogtelijnen-donker.png", "terrein",
    { kop: "Terrein op inplantingsplan", sub: "Hoogtelijnen en lijnwerk over het plan." },
    { kop: "Terrain sur plan d'implantation", sub: "Courbes et filaire sur le plan." }),
  enkel("t077", r("t077"), "bouwput",
    { kop: "Uitgraving met werkvloer", sub: "Werkvloer en randen op de juiste hoogte." },
    { kop: "Fouille avec fond", sub: "Fond et bords à la bonne hauteur." }),
  enkel("t054", r("t054"), "terrein",
    { kop: "Terrein met verdiepingen", sub: "Lokale laagtes en ophogingen in één model." },
    { kop: "Terrain avec cuvettes", sub: "Creux et remblais locaux dans un seul modèle." }),
  enkel("sport", "/3d/relief-sportterrein-donker.png", "bouwput",
    { kop: "Sportterrein", sub: "Vlak speelveld met afwatering naar de randen." },
    { kop: "Terrain de sport", sub: "Aire de jeu plane avec écoulement vers les bords." }),
  enkel("t019", r("t019"), "grondwerk",
    { kop: "Getrapt platform", sub: "Werkvlakken op meerdere niveaus." },
    { kop: "Plateforme en gradins", sub: "Plateformes sur plusieurs niveaux." }),
  enkel("t018", r("t018"), "bouwput",
    { kop: "Wachtbekken", sub: "Bekken met taluds en vlakke bodem." },
    { kop: "Bassin d'orage", sub: "Bassin avec talus et fond plat." }),
  enkel("t081", r("t081"), "terrein",
    { kop: "Hellend terrein", sub: "Groot hoogteverschil, helder in kleur." },
    { kop: "Terrain en pente", sub: "Fort dénivelé, lisible en couleurs." }),
  enkel("t015", r("t015"), "bouwput",
    { kop: "Bouwkuip", sub: "Complexe kuip met verschillende diepten." },
    { kop: "Fouille complexe", sub: "Fouille avec différentes profondeurs." }),
];

/** Slotbeeld van elke video. */
export const SLOT = {
  nl: { tagline: "3D-modellen voor machinesturing" },
  fr: { tagline: "Modèles 3D pour le guidage d'engins" },
  systemen: "Trimble · Topcon · Leica · Unicontrol · CHCNAV",
  domein: "studio-vm.be",
};

const SYSTEMEN_ZIN = {
  nl: "We leveren elk 3D-model voor machinesturing in het juiste coördinatenstelsel en klaar om in te laden, voor Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu en Caterpillar.",
  fr: "Nous livrons chaque modèle 3D pour le guidage d'engins dans le bon système de coordonnées, prêt à charger, pour Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu et Caterpillar.",
};
// Zelfde oproep als CTA_NL / CTA_FR in src/lib/admin/social-templates.ts.
const CTA = {
  nl: "Plannen doorsturen voor een prijs? Dat kan via de link in ons profiel.",
  fr: "Un prix pour vos plans ? Envoyez-les via le lien de notre profil.",
};
const BASIS_TAGS = { nl: ["#machinesturing", "#grondverzet", "#3Dmodel"], fr: ["#guidage", "#terrassement", "#modele3D"] };

/** Teksten op het beeld, per weergave (lagen) of één keer (camera). */
export function beeldTekst(reeks, taal) {
  const t = reeks[taal];
  const cat = CATEGORIE[reeks.cat][taal];
  if (reeks.soort === "lagen") {
    return { kop: t.kop, weergaven: t.weergaven.map((w) => ({ label: w.label, sub: w.sub })), teller: true };
  }
  return { kop: t.kop, weergaven: [{ label: cat, sub: t.sub }], teller: false };
}

/** Bijschrift, korte tekst (X/Bluesky) en hashtags van het bericht. */
export function berichtTekst(reeks, taal) {
  const t = reeks[taal];
  const intro = reeks.soort === "lagen" ? t.intro : `${t.kop}. ${t.sub}`;
  const tags = [...BASIS_TAGS[taal], CATEGORIE[reeks.cat].tag[taal]];
  return {
    titel: t.kop,
    body: `${intro}\n\n${SYSTEMEN_ZIN[taal]}\n\n${CTA[taal]}`,
    kort: intro.length <= 200 ? intro : `${intro.slice(0, 196).replace(/\s+\S*$/, "")}…`,
    hashtags: tags.slice(0, 5).join(" "),
  };
}
