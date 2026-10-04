// Projecten in beeld: echte modellen uit het archief, elk in meerdere
// weergaven, ook op de luchtfoto. Anoniem: een code in plaats van een naam,
// geen klant, geen plaats, geen coördinaten in tekst of beeld.
// Beelden: scripts/archief-beelden.mjs → /public/3d/a/<code>-<weergave>.webp
// (donker, 1600×1000). De koppeling code → bronbestand staat enkel lokaal.

import type { Locale } from "@/lib/i18n/config";
import type { Categorie, Systeem } from "@/lib/realisaties";

export type ArchiefWeergave = "3d" | "luchtfoto3d" | "luchtfoto" | "hoogtelijnen" | "net" | "helling";
type Tekst = { titel: string; tekst: string };

// Open orthofoto's: Digitaal Vlaanderen (Modellicentie Gratis Hergebruik) en
// SPW Wallonie (CC BY 4.0). Beide vragen een bronvermelding bij hergebruik.
export type LuchtfotoBron = "vl" | "wa";
export const LUCHTFOTO_BRON: Record<LuchtfotoBron, string> = { vl: "Digitaal Vlaanderen", wa: "SPW – Wallonie" };
export const LUCHTFOTO_LABEL: Record<Locale, string> = { nl: "Luchtfoto", fr: "Photo aérienne", en: "Aerial photo", de: "Luftbild", es: "Foto aérea" };
/** Toont deze weergave een luchtfoto (en dus een bronvermelding)? */
export const metLuchtfoto = (w: ArchiefWeergave) => w === "luchtfoto" || w === "luchtfoto3d";

export type ArchiefProject = {
  code: string;
  /** Wie de luchtfoto leverde (bronvermelding verplicht bij hergebruik). */
  luchtfoto: LuchtfotoBron;
  cat: Categorie;
  systemen: Systeem[];
  /** Volgorde = volgorde op de pagina en in de carrousel. */
  weergaven: ArchiefWeergave[];
} & Record<Locale, Tekst>;

export const ARCHIEF_WEERGAVE: Record<ArchiefWeergave, Record<Locale, { naam: string; uitleg: string }>> = {
  "3d": {
    nl: { naam: "3D in hoogtekleuren", uitleg: "Het model in 3D: elke kleur is een hoogte." },
    fr: { naam: "3D en couleurs hypsométriques", uitleg: "Le modèle en 3D : chaque couleur est une altitude." },
    en: { naam: "3D in height colours", uitleg: "The model in 3D: every colour is a height." },
    de: { naam: "3D in Höhenfarben", uitleg: "Das Modell in 3D: jede Farbe ist eine Höhe." },
    es: { naam: "3D en colores hipsométricos", uitleg: "El modelo en 3D: cada color es una cota." },
  },
  luchtfoto3d: {
    nl: { naam: "3D op de luchtfoto", uitleg: "Hetzelfde model met de luchtfoto erop: zo ligt het in zijn omgeving." },
    fr: { naam: "3D sur photo aérienne", uitleg: "Le même modèle habillé de la photo aérienne : tel qu'il s'inscrit dans son environnement." },
    en: { naam: "3D on the aerial photo", uitleg: "The same model draped with the aerial photo: how it sits in its surroundings." },
    de: { naam: "3D auf dem Luftbild", uitleg: "Dasselbe Modell mit dem Luftbild darüber: so liegt es in seiner Umgebung." },
    es: { naam: "3D sobre la foto aérea", uitleg: "El mismo modelo con la foto aérea encima: así se sitúa en su entorno." },
  },
  luchtfoto: {
    nl: { naam: "Luchtfoto met model", uitleg: "Van bovenaf op de luchtfoto, met de hoogtelijnen van het ontwerp." },
    fr: { naam: "Photo aérienne et modèle", uitleg: "Vu du ciel sur la photo aérienne, avec les courbes de niveau du projet." },
    en: { naam: "Aerial photo with model", uitleg: "Seen from above on the aerial photo, with the design contours." },
    de: { naam: "Luftbild mit Modell", uitleg: "Von oben auf dem Luftbild, mit den Höhenlinien des Entwurfs." },
    es: { naam: "Foto aérea con modelo", uitleg: "Desde arriba sobre la foto aérea, con las curvas de nivel del proyecto." },
  },
  hoogtelijnen: {
    nl: { naam: "Hoogtelijnen", uitleg: "Hoe dichter de lijnen, hoe steiler het terrein." },
    fr: { naam: "Courbes de niveau", uitleg: "Plus les courbes sont serrées, plus le terrain est raide." },
    en: { naam: "Contours", uitleg: "The closer the lines, the steeper the ground." },
    de: { naam: "Höhenlinien", uitleg: "Je dichter die Linien, desto steiler das Gelände." },
    es: { naam: "Curvas de nivel", uitleg: "Cuanto más juntas las curvas, más pendiente tiene el terreno." },
  },
  net: {
    nl: { naam: "Driehoeksnet", uitleg: "Het oppervlak waarop de machine stuurt, driehoek per driehoek." },
    fr: { naam: "Réseau de triangles", uitleg: "La surface sur laquelle l'engin se guide, triangle par triangle." },
    en: { naam: "Triangle network", uitleg: "The surface the machine guides on, triangle by triangle." },
    de: { naam: "Dreiecksnetz", uitleg: "Die Oberfläche, an der die Maschine steuert, Dreieck für Dreieck." },
    es: { naam: "Red de triángulos", uitleg: "La superficie sobre la que se guía la máquina, triángulo a triángulo." },
  },
  helling: {
    nl: { naam: "Hellingskaart", uitleg: "Vlakke delen, afwatering en taluds in één oogopslag." },
    fr: { naam: "Carte des pentes", uitleg: "Zones planes, écoulement et talus d'un coup d'œil." },
    en: { naam: "Slope map", uitleg: "Flat areas, drainage and batters at a glance." },
    de: { naam: "Neigungskarte", uitleg: "Ebene Flächen, Gefälle und Böschungen auf einen Blick." },
    es: { naam: "Mapa de pendientes", uitleg: "Zonas planas, desagüe y taludes de un vistazo." },
  },
};

const ALLE: ArchiefWeergave[] = ["3d", "luchtfoto3d", "luchtfoto", "hoogtelijnen", "net", "helling"];
const zonder = (...w: ArchiefWeergave[]) => ALLE.filter((x) => !w.includes(x));

export const ARCHIEF: ArchiefProject[] = [
  { code: "a01", luchtfoto: "vl", cat: "bouwput", systemen: ["Trimble", "Caterpillar"], weergaven: ALLE,
    nl: { titel: "Ronde bouwput voor een bezinktank", tekst: "Een cirkelvormige uitgraving met een kegelvormige bodem naar het midden en twee sleuven voor de leidingen. Elke ring ligt op zijn eigen peil." },
    fr: { titel: "Fouille circulaire pour un décanteur", tekst: "Une excavation circulaire au fond conique vers le centre, avec deux tranchées pour les conduites. Chaque anneau est à son propre niveau." },
    en: { titel: "Circular excavation for a settling tank", tekst: "A round excavation with a cone-shaped bottom falling to the centre and two trenches for the pipes. Every ring sits at its own level." },
    de: { titel: "Runde Baugrube für ein Absetzbecken", tekst: "Eine kreisrunde Baugrube mit zur Mitte hin kegelförmiger Sohle und zwei Gräben für die Leitungen. Jeder Ring liegt auf seiner eigenen Höhe." },
    es: { titel: "Excavación circular para un decantador", tekst: "Una excavación redonda con fondo cónico hacia el centro y dos zanjas para las tuberías. Cada anillo está a su propia cota." } },
  { code: "a02", luchtfoto: "vl", cat: "grondwerk", systemen: ["Topcon", "Leica"], weergaven: zonder("helling"),
    nl: { titel: "Funderingen voor drie gebouwen", tekst: "Drie bouwblokken met funderingsstroken en -sleuven, elk op hun eigen diepte. Op de luchtfoto staan de gebouwen er intussen." },
    fr: { titel: "Fondations pour trois bâtiments", tekst: "Trois blocs avec semelles filantes et tranchées, chacun à sa propre profondeur. Sur la photo aérienne, les bâtiments sont désormais construits." },
    en: { titel: "Foundations for three buildings", tekst: "Three blocks with strip footings and trenches, each at its own depth. On the aerial photo the buildings now stand." },
    de: { titel: "Fundamente für drei Gebäude", tekst: "Drei Baukörper mit Streifenfundamenten und Gräben, jeder auf seiner eigenen Tiefe. Auf dem Luftbild stehen die Gebäude inzwischen." },
    es: { titel: "Cimentaciones para tres edificios", tekst: "Tres bloques con zapatas corridas y zanjas, cada uno a su propia profundidad. En la foto aérea los edificios ya están construidos." } },
  { code: "a03", luchtfoto: "vl", cat: "grondwerk", systemen: ["Unicontrol"], weergaven: zonder("net"),
    nl: { titel: "Bouwterrein met platformen en wadi", tekst: "Het afgewerkte maaiveld rond verschillende gebouwen, met een wadi en vloeiende overgangen tussen de niveaus." },
    fr: { titel: "Terrain à bâtir avec plateformes et noue", tekst: "Le niveau fini autour de plusieurs bâtiments, avec une noue et des transitions douces entre les niveaux." },
    en: { titel: "Building site with platforms and swale", tekst: "The finished ground level around several buildings, with a swale and smooth transitions between levels." },
    de: { titel: "Baufeld mit Planien und Versickerungsmulde", tekst: "Das fertige Gelände rund um mehrere Gebäude, mit einer Mulde und fließenden Übergängen zwischen den Ebenen." },
    es: { titel: "Solar con plataformas y cuneta verde", tekst: "La rasante final alrededor de varios edificios, con una cuneta de infiltración y transiciones suaves entre niveles." } },
  { code: "a04", luchtfoto: "wa", cat: "wegenis", systemen: ["Trimble", "Topcon"], weergaven: ALLE,
    nl: { titel: "Rotonde met vier takken", tekst: "Een rotonde met vier aansluitende wegen, de verkanting naar de buitenrand en elke tak op het bestaande peil aangesloten." },
    fr: { titel: "Giratoire à quatre branches", tekst: "Un giratoire avec quatre voiries raccordées, le dévers vers l'extérieur et chaque branche raccordée au niveau existant." },
    en: { titel: "Four-arm roundabout", tekst: "A roundabout with four connecting roads, crossfall towards the outer edge and every arm tied in to the existing level." },
    de: { titel: "Kreisverkehr mit vier Armen", tekst: "Ein Kreisverkehr mit vier Anschlussstraßen, Querneigung nach außen und jedem Arm an die bestehende Höhe angeschlossen." },
    es: { titel: "Glorieta de cuatro ramales", tekst: "Una glorieta con cuatro viales de acceso, peralte hacia el borde exterior y cada ramal enlazado con la cota existente." } },
  { code: "a05", luchtfoto: "vl", cat: "bouwput", systemen: ["Leica", "Komatsu"], weergaven: zonder("net"),
    nl: { titel: "Bufferbekken met poelen", tekst: "Een groot bufferbekken met dijken rondom en verdiepte poelen in de bodem, zoals het er vandaag bij ligt." },
    fr: { titel: "Bassin tampon avec mares", tekst: "Un grand bassin tampon entouré de digues, avec des mares creusées dans le fond, tel qu'il se présente aujourd'hui." },
    en: { titel: "Retention basin with ponds", tekst: "A large retention basin with embankments all round and deepened ponds in the bottom, as it lies today." },
    de: { titel: "Rückhaltebecken mit Tümpeln", tekst: "Ein großes Rückhaltebecken mit umlaufenden Dämmen und vertieften Tümpeln in der Sohle, so wie es heute daliegt." },
    es: { titel: "Balsa de laminación con charcas", tekst: "Una gran balsa de laminación con diques perimetrales y charcas excavadas en el fondo, tal como está hoy." } },
  { code: "a06", luchtfoto: "vl", cat: "bouwput", systemen: ["CHCNAV", "Trimble"], weergaven: ALLE,
    nl: { titel: "Bouwput met funderingsputten", tekst: "Een bouwput met taluds rondom en een bodem met funderingsputten en -balken, elk op zijn eigen peil." },
    fr: { titel: "Fouille avec puits de fondation", tekst: "Une fouille talutée sur tout le pourtour, au fond équipé de puits et de longrines, chacun à son propre niveau." },
    en: { titel: "Excavation with foundation pits", tekst: "An excavation battered all round, with a bottom of foundation pits and ground beams, each at its own level." },
    de: { titel: "Baugrube mit Fundamentgruben", tekst: "Eine umlaufend geböschte Baugrube mit Fundamentgruben und -balken in der Sohle, jede auf ihrer eigenen Höhe." },
    es: { titel: "Excavación con pozos de cimentación", tekst: "Una excavación ataluzada en todo el perímetro, con pozos y vigas de cimentación en el fondo, cada uno a su propia cota." } },
  { code: "a07", luchtfoto: "vl", cat: "bouwput", systemen: ["Topcon"], weergaven: zonder("helling"),
    nl: { titel: "Uitgraving voor een bedrijfsgebouw", tekst: "Een vlakke uitgraving met een raster van funderingsputten en een talud naar het maaiveld." },
    fr: { titel: "Terrassement pour un bâtiment d'entreprise", tekst: "Une excavation plane avec une trame de puits de fondation et un talus vers le terrain naturel." },
    en: { titel: "Excavation for a commercial building", tekst: "A level excavation with a grid of foundation pits and a batter up to ground level." },
    de: { titel: "Aushub für ein Gewerbegebäude", tekst: "Ein ebener Aushub mit einem Raster von Fundamentgruben und einer Böschung bis zum Gelände." },
    es: { titel: "Excavación para un edificio empresarial", tekst: "Una excavación plana con una retícula de pozos de cimentación y un talud hasta el terreno." } },
  { code: "a08", luchtfoto: "wa", cat: "grondwerk", systemen: ["Leica", "Unicontrol"], weergaven: zonder("hoogtelijnen"),
    nl: { titel: "Platformen op twee niveaus", tekst: "Twee grote werkvlakken op verschillende hoogte, verbonden door een talud en een hellende weg." },
    fr: { titel: "Plateformes sur deux niveaux", tekst: "Deux grandes plateformes à des hauteurs différentes, reliées par un talus et une rampe." },
    en: { titel: "Platforms on two levels", tekst: "Two large working platforms at different heights, linked by a batter and a ramp." },
    de: { titel: "Planien auf zwei Ebenen", tekst: "Zwei große Arbeitsflächen auf unterschiedlicher Höhe, verbunden durch eine Böschung und eine Rampe." },
    es: { titel: "Plataformas a dos niveles", tekst: "Dos grandes plataformas a distinta altura, unidas por un talud y una rampa." } },
  { code: "a09", luchtfoto: "wa", cat: "terrein", systemen: ["Trimble", "Komatsu"], weergaven: zonder("net"),
    nl: { titel: "Glooiend terreinontwerp", tekst: "Een groot terrein opnieuw vormgegeven, met zachte hellingen en afgeronde randen die aansluiten op het bestaande land." },
    fr: { titel: "Modelé de terrain vallonné", tekst: "Un grand terrain remodelé, avec des pentes douces et des bords arrondis qui rejoignent le terrain existant." },
    en: { titel: "Rolling landform design", tekst: "A large site reshaped with gentle slopes and rounded edges that tie in to the surrounding land." },
    de: { titel: "Hügelige Geländemodellierung", tekst: "Ein großes Gelände neu geformt, mit sanften Hängen und gerundeten Rändern, die an das bestehende Land anschließen." },
    es: { titel: "Modelado de terreno ondulado", tekst: "Un gran terreno remodelado con pendientes suaves y bordes redondeados que enlazan con el terreno existente." } },
  { code: "a10", luchtfoto: "wa", cat: "wegenis", systemen: ["CHCNAV"], weergaven: zonder("net"),
    nl: { titel: "Kruispunt met nieuwe aftakking", tekst: "Een bestaande weg met een nieuwe aftakking, langs alle kanten aangesloten op het bestaande peil." },
    fr: { titel: "Carrefour avec nouvelle branche", tekst: "Une voirie existante avec une nouvelle branche, raccordée de tous côtés au niveau existant." },
    en: { titel: "Junction with a new branch", tekst: "An existing road with a new branch, tied in on every side to the existing level." },
    de: { titel: "Kreuzung mit neuem Abzweig", tekst: "Eine bestehende Straße mit einem neuen Abzweig, an allen Seiten an die bestehende Höhe angeschlossen." },
    es: { titel: "Cruce con un nuevo ramal", tekst: "Un vial existente con un nuevo ramal, enlazado por todos los lados con la cota existente." } },
  { code: "a11", luchtfoto: "vl", cat: "bouwput", systemen: ["Caterpillar", "Topcon"], weergaven: zonder("helling"),
    nl: { titel: "Waterbekken met taluds", tekst: "Een rechthoekig waterbekken met gelijkmatige taluds rondom en een vlakke bodem." },
    fr: { titel: "Bassin d'eau talué", tekst: "Un bassin rectangulaire avec des talus réguliers sur tout le pourtour et un fond plat." },
    en: { titel: "Water basin with batters", tekst: "A rectangular water basin with even batters all round and a level bottom." },
    de: { titel: "Wasserbecken mit Böschungen", tekst: "Ein rechteckiges Wasserbecken mit gleichmäßigen Böschungen rundum und ebener Sohle." },
    es: { titel: "Balsa de agua con taludes", tekst: "Una balsa rectangular con taludes regulares en todo el perímetro y fondo plano." } },
  { code: "a12", luchtfoto: "vl", cat: "bouwput", systemen: ["Unicontrol", "Leica"], weergaven: zonder("helling"),
    nl: { titel: "Bouwput met lange inrit", tekst: "Een bouwput met funderingsputten, een talud naar het bos en een lange inrit voor de vrachtwagens." },
    fr: { titel: "Fouille avec longue rampe d'accès", tekst: "Une fouille avec puits de fondation, un talus vers le bois et une longue rampe d'accès pour les camions." },
    en: { titel: "Excavation with a long access ramp", tekst: "An excavation with foundation pits, a batter towards the woodland and a long access ramp for the lorries." },
    de: { titel: "Baugrube mit langer Zufahrt", tekst: "Eine Baugrube mit Fundamentgruben, einer Böschung zum Wald hin und einer langen Zufahrtsrampe für die Lkw." },
    es: { titel: "Excavación con rampa de acceso larga", tekst: "Una excavación con pozos de cimentación, un talud hacia el bosque y una larga rampa de acceso para los camiones." } },
  { code: "a13", luchtfoto: "wa", cat: "wegenis", systemen: ["Trimble", "CHCNAV"], weergaven: zonder("hoogtelijnen"),
    nl: { titel: "Wegenis van een verkaveling", tekst: "Een lus van nieuwe wegen met aansluitingen op de straat en een keerpunt aan het eind." },
    fr: { titel: "Voiries d'un lotissement", tekst: "Une boucle de nouvelles voiries avec raccords à la rue et une aire de retournement au bout." },
    en: { titel: "Housing estate roads", tekst: "A loop of new roads with tie-ins to the street and a turning head at the end." },
    de: { titel: "Erschließungsstraßen eines Baugebiets", tekst: "Eine Schleife neuer Straßen mit Anschlüssen an die Straße und einer Wendeanlage am Ende." },
    es: { titel: "Viales de una urbanización", tekst: "Un anillo de viales nuevos con enlaces a la calle y un fondo de saco al final." } },
  { code: "a14", luchtfoto: "wa", cat: "grondwerk", systemen: ["Komatsu", "Topcon"], weergaven: zonder("helling"),
    nl: { titel: "Platform met funderingsputten", tekst: "Een vlak platform met een rij funderingsputten langs de rand en een groep putten in de hoek." },
    fr: { titel: "Plateforme avec puits de fondation", tekst: "Une plateforme plane avec une rangée de puits de fondation le long du bord et un groupe de puits dans l'angle." },
    en: { titel: "Platform with foundation pits", tekst: "A level platform with a row of foundation pits along the edge and a cluster of pits in the corner." },
    de: { titel: "Planum mit Fundamentgruben", tekst: "Ein ebenes Planum mit einer Reihe Fundamentgruben am Rand und einer Gruppe Gruben in der Ecke." },
    es: { titel: "Plataforma con pozos de cimentación", tekst: "Una plataforma plana con una fila de pozos de cimentación a lo largo del borde y un grupo de pozos en la esquina." } },
  { code: "a15", luchtfoto: "vl", cat: "bouwput", systemen: ["Leica", "Trimble"], weergaven: zonder("helling"),
    nl: { titel: "Bouwput op twee niveaus", tekst: "Een bouwput met een hoger en een lager deel, funderingsputten in de bodem en taluds rondom." },
    fr: { titel: "Fouille sur deux niveaux", tekst: "Une fouille avec une partie haute et une partie basse, des puits de fondation dans le fond et des talus sur le pourtour." },
    en: { titel: "Two-level excavation", tekst: "An excavation with an upper and a lower part, foundation pits in the bottom and batters all round." },
    de: { titel: "Baugrube auf zwei Ebenen", tekst: "Eine Baugrube mit einem höheren und einem tieferen Teil, Fundamentgruben in der Sohle und Böschungen rundum." },
    es: { titel: "Excavación a dos niveles", tekst: "Una excavación con una parte alta y otra baja, pozos de cimentación en el fondo y taludes en todo el perímetro." } },
];

export const archiefBeeld = (code: string, w: ArchiefWeergave) => `/3d/a/${code}-${w}.webp`;
export const archiefPad = (code: string) => `/realisaties/${code}`;
export function archiefProject(code: string): ArchiefProject | undefined {
  return ARCHIEF.find((p) => p.code === code);
}
