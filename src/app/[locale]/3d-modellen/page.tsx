import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Check, FileUp, Layers, MonitorSmartphone, ShieldCheck, Tag } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KRUIMEL, ogBeeld, paginaMeta } from "@/lib/seo";
import { ID, dienstNodes, graph, kruimels, siteNodes, webPagina } from "@/lib/schema";
import { BEELD_ALT } from "@/lib/realisaties";
import { kennisArtikel } from "@/lib/kennis";

const PAD = "/3d-modellen";

type Onderdeel = {
  titel: string;
  tekst: string;
  punten: string[];
  beeld: string;
  donker?: string;
  /** Kennisartikel dat dit onderdeel verder uitlegt (slug). */
  kennis?: string;
};

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    eyebrow: string;
    titel: string;
    intro: string;
    synoniem: string;
    onderdelen: Onderdeel[];
    merkenEyebrow: string;
    merkenTitel: string;
    merkenIntro: string;
    formatenEyebrow: string;
    formatenTitel: string;
    formatenTekst: string;
    formatenPunten: string[];
    verantwKop: string;
    verantw: string;
    tarievenLink: string;
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: {
    meta: {
      title: "3D-model voor machinebesturing: wat u krijgt | Studio VM",
      description: "Ontwerpoppervlak (TIN), lijnwerk, hoogtelijnen en hellingscontrole voor machinebesturing, in het formaat van al uw systemen en het juiste stelsel.",
    },
    eyebrow: "3D-modellen",
    titel: "Wat zit er in een 3D-model voor machinesturing?",
    intro: "Een goed machinesturingsmodel is meer dan een oppervlak. Het is een volledig, gecontroleerd ontwerp dat uw machinist op het scherm begrijpt en waarop de machine nauwkeurig stuurt.",
    synoniem: "Een 3D-model voor machinebesturing (in Vlaanderen zegt men ook machinesturing) is het besturingsbestand dat uw GPS-gestuurde graafkraan, grader of dozer inleest: het DTM van het ontwerp plus het lijnwerk.",
    onderdelen: [
      {
        titel: "Ontwerpoppervlak",
        tekst: "Het hart van elk model: een driehoeksnet (TIN) van het eindniveau. Daarop vergelijkt de machine continu de positie van de bak of het blad met het ontwerp.",
        punten: ["Eindniveau of per laag (onderfundering, fundering, afwerking)", "Aansluitingen op het bestaande terrein", "Geen gaten of verkeerde driehoeken"],
        beeld: "/3d/relief-grondwerk-licht.png",
        donker: "/3d/relief-grondwerk-donker.png",
      },
      {
        titel: "Lijnwerk en breeklijnen",
        tekst: "Kanten, assen, boordstenen, taludteen en -kruin: de lijnen die het oppervlak vormgeven én die de machinist als referentie op zijn scherm ziet.",
        punten: ["Breeklijnen die het oppervlak correct laten knikken", "Lagen per soort lijn, met herkenbare kleuren", "Assen voor wegenis en leidingen"],
        beeld: "/3d/terrein-lijnwerk.jpg",
        kennis: "lijnwerk-en-breeklijnen",
      },
      {
        titel: "Hoogtelijnen en kleuren",
        tekst: "Om het model in één oogopslag te lezen en te controleren: waar ligt het hoog, waar laag, en loopt het water de goede kant op?",
        punten: ["Hoogtelijnen op een leesbare interval", "Hoogtekleuren voor een snelle controle", "Bruikbaar voor uitzetten op de werf"],
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Hellingen en controle",
        tekst: "Elk talud en elke afwatering wordt nagekeken vóór levering. Een fout in het model wordt anders een fout in de grond.",
        punten: ["Hellingskaart van het hele ontwerp", "Controle van niveaus op gekende punten", "Afwijkingen gemeld vóór levering"],
        beeld: "/3d/model-platform-helling.jpg",
      },
    ],
    merkenEyebrow: "Merken",
    merkenTitel: "Machinebesturing per merk",
    merkenIntro: "Hetzelfde model, geleverd voor elk systeem op uw werf. Ook een gehuurde machine van een ander merk krijgt haar bestand, zonder meerprijs.",
    formatenEyebrow: "Formaten",
    formatenTitel: "Eén model, al uw systemen",
    formatenTekst: "Werkt u met machines van verschillende merken? Kies ze allemaal bij uw aanvraag. U krijgt het model in het formaat van elk systeem, zonder meerprijs.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML en DXF voor andere systemen en voor uw meetploeg", "Altijd in het coördinatenstelsel en de hoogtereferentie van de werf", "Te downloaden in uw klantenportaal, met elke revisie"],
    verantwKop: "Belangrijk",
    verantw: "Wij leveren het 3D-model. De werking, instelling en kalibratie van uw machinesturing en de controle op de werf blijven uw verantwoordelijkheid. Controleer het model vóór de start op een gekend punt.",
    tarievenLink: "Bekijk de tarieven",
    cta: { eyebrow: "Klaar om te starten?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Laad uw plannen op, geef het werfadres en kies uw machinesturingen.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: {
      title: "Modèle 3D pour guidage d'engins : le contenu | Studio VM",
      description: "Surface de projet (TIN), filaire, courbes de niveau et contrôle des pentes, au format de tous vos systèmes de guidage. Découvrez ce que vous recevez.",
    },
    eyebrow: "Modèles 3D",
    titel: "Que contient un modèle 3D pour le guidage d'engins ?",
    intro: "Un bon modèle de guidage est plus qu'une surface. C'est un projet complet et contrôlé, que votre conducteur comprend à l'écran et sur lequel la machine se guide avec précision.",
    synoniem: "Un modèle 3D pour le guidage d'engins (guidage 3D ou GPS) est le fichier que lit votre pelle, pelleteuse, niveleuse ou bulldozer : le MNT du projet et son filaire.",
    onderdelen: [
      {
        titel: "Surface de projet",
        tekst: "Le cœur de chaque modèle : un réseau de triangles (TIN) du niveau fini. La machine y compare en permanence la position du godet ou de la lame au projet.",
        punten: ["Niveau fini ou par couche (sous-fondation, fondation, finition)", "Raccords au terrain existant", "Pas de trous ni de triangles erronés"],
        beeld: "/3d/relief-grondwerk-licht.png",
        donker: "/3d/relief-grondwerk-donker.png",
      },
      {
        titel: "Filaire et lignes de rupture",
        tekst: "Bords, axes, bordures, pied et crête de talus : les lignes qui donnent forme à la surface et que le conducteur voit comme repères à l'écran.",
        punten: ["Lignes de rupture pour une surface correcte", "Couches par type de ligne, couleurs reconnaissables", "Axes pour voiries et conduites"],
        beeld: "/3d/terrein-lijnwerk.jpg",
        kennis: "lijnwerk-en-breeklijnen",
      },
      {
        titel: "Courbes de niveau et couleurs",
        tekst: "Pour lire et contrôler le modèle d'un coup d'œil : où est-ce haut, où est-ce bas, et l'eau s'écoule-t-elle dans le bon sens ?",
        punten: ["Courbes à un intervalle lisible", "Couleurs hypsométriques pour un contrôle rapide", "Utilisable pour l'implantation"],
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Pentes et contrôle",
        tekst: "Chaque talus et chaque écoulement est vérifié avant livraison. Sinon, une erreur dans le modèle devient une erreur dans le sol.",
        punten: ["Carte des pentes de tout le projet", "Contrôle des niveaux sur points connus", "Écarts signalés avant livraison"],
        beeld: "/3d/model-platform-helling.jpg",
      },
    ],
    merkenEyebrow: "Marques",
    merkenTitel: "Guidage d'engins par marque",
    merkenIntro: "Le même modèle, livré pour chaque système de votre chantier. Une machine louée d'une autre marque reçoit aussi son fichier, sans supplément.",
    formatenEyebrow: "Formats",
    formatenTitel: "Un modèle, tous vos systèmes",
    formatenTekst: "Vous travaillez avec des machines de plusieurs marques ? Choisissez-les toutes dans votre demande. Vous recevez le modèle dans le format de chaque système, sans supplément.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML et DXF pour d'autres systèmes et pour votre équipe de mesure", "Toujours dans le système de coordonnées et la référence altimétrique du chantier", "À télécharger dans votre espace client, avec chaque révision"],
    verantwKop: "Important",
    verantw: "Nous livrons le modèle 3D. Le fonctionnement, le réglage et la calibration de votre guidage ainsi que le contrôle sur chantier restent sous votre responsabilité. Vérifiez le modèle sur un point connu avant de commencer.",
    tarievenLink: "Voir les tarifs",
    cta: { eyebrow: "Prêt à démarrer ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Chargez vos plans, indiquez l'adresse du chantier et choisissez vos systèmes de guidage.", knop: "Demander un devis" },
  },
  en: {
    meta: {
      title: "What's in a machine control 3D model | Studio VM",
      description: "Design surface (TIN), linework, contours and slope checks, delivered in the format of all your machine control systems and the right coordinate system.",
    },
    eyebrow: "3D models",
    titel: "What is in a 3D model for machine control?",
    intro: "A good machine control model is more than a surface. It is a complete, checked design that your operator understands on screen and that the machine guides on accurately.",
    synoniem: "Machine control data preparation: the design DTM (TIN) and linework your GPS-guided excavator, grader or dozer loads straight into its control box.",
    onderdelen: [
      {
        titel: "Design surface",
        tekst: "The heart of every model: a triangulated network (TIN) of the finished level. The machine constantly compares the bucket or blade position with this design.",
        punten: ["Finished level or per layer (sub-base, base, surfacing)", "Tie-ins to the existing ground", "No holes or wrong triangles"],
        beeld: "/3d/relief-grondwerk-licht.png",
        donker: "/3d/relief-grondwerk-donker.png",
      },
      {
        titel: "Linework and breaklines",
        tekst: "Edges, centrelines, kerbs, toe and crest of slopes: the lines that shape the surface and that the operator sees as references on screen.",
        punten: ["Breaklines for a correct surface", "Layers per line type, in recognisable colours", "Centrelines for roads and pipes"],
        beeld: "/3d/terrein-lijnwerk.jpg",
        kennis: "lijnwerk-en-breeklijnen",
      },
      {
        titel: "Contours and colours",
        tekst: "To read and check the model at a glance: where is it high, where low, and does the water run the right way?",
        punten: ["Contours at a readable interval", "Height colours for a quick check", "Usable for setting out on site"],
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Slopes and checks",
        tekst: "Every embankment and drainage fall is checked before delivery. Otherwise an error in the model becomes an error in the ground.",
        punten: ["Slope map of the whole design", "Level checks on known points", "Deviations reported before delivery"],
        beeld: "/3d/model-platform-helling.jpg",
      },
    ],
    merkenEyebrow: "Brands",
    merkenTitel: "Machine control by brand",
    merkenIntro: "The same model, delivered for every system on your site. A hired machine of another brand gets its file too, at no extra cost.",
    formatenEyebrow: "Formats",
    formatenTitel: "One model, all your systems",
    formatenTekst: "Running machines from different brands? Pick them all in your request. You get the model in each system's format at no extra cost.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML and DXF for other systems and for your survey crew", "Always in the site's coordinate system and height datum", "Download in your client portal, with every revision"],
    verantwKop: "Important",
    verantw: "We deliver the 3D model. The operation, setup and calibration of your machine control and the checks on site remain your responsibility. Check the model on a known point before you start.",
    tarievenLink: "See the rates",
    cta: { eyebrow: "Ready to start?", titel: "Send your plans, get a tailored quote", sub: "Upload your plans, give the site address and pick your machine control systems.", knop: "Request a quote" },
  },
  de: {
    meta: {
      title: "3D-Modell für Maschinensteuerung: der Inhalt | Studio VM",
      description: "Planungsoberfläche (DGM), Linien, Höhenlinien und Neigungsprüfung, im Format all Ihrer Maschinensteuerungen und im richtigen Koordinatensystem.",
    },
    eyebrow: "3D-Modelle",
    titel: "Was steckt in einem 3D-Modell für Maschinensteuerung?",
    intro: "Ein gutes Modell für die Maschinensteuerung ist mehr als eine Oberfläche. Es ist ein vollständiger, geprüfter Entwurf, den Ihr Maschinenführer auf dem Bildschirm versteht und an dem die Maschine präzise steuert.",
    synoniem: "Datenaufbereitung für die 3D-Maschinensteuerung: das Planungs-DGM (Soll-DGM), Bruchkanten und Linien für Ihre 3D-Baggersteuerung, Raupe oder Grader.",
    onderdelen: [
      {
        titel: "Planungsoberfläche",
        tekst: "Das Herzstück jedes Modells: ein Dreiecksnetz (TIN) der Endhöhe. Daran vergleicht die Maschine ständig die Position von Löffel oder Schild mit dem Entwurf.",
        punten: ["Endhöhe oder je Schicht (Frostschutz, Tragschicht, Deckschicht)", "Anschlüsse an das bestehende Gelände", "Keine Löcher oder fehlerhaften Dreiecke"],
        beeld: "/3d/relief-grondwerk-licht.png",
        donker: "/3d/relief-grondwerk-donker.png",
      },
      {
        titel: "Linien und Bruchkanten",
        tekst: "Kanten, Achsen, Bordsteine, Böschungsfuß und -kopf: die Linien, die die Oberfläche formen und die der Maschinenführer als Referenz auf seinem Bildschirm sieht.",
        punten: ["Bruchkanten für eine korrekte Oberfläche", "Layer je Linienart, in gut erkennbaren Farben", "Achsen für Straßen und Leitungen"],
        beeld: "/3d/terrein-lijnwerk.jpg",
        kennis: "lijnwerk-en-breeklijnen",
      },
      {
        titel: "Höhenlinien und Farben",
        tekst: "Um das Modell auf einen Blick zu lesen und zu prüfen: Wo ist es hoch, wo tief, und fließt das Wasser in die richtige Richtung?",
        punten: ["Höhenlinien in gut lesbarem Abstand", "Höhenfarben für eine schnelle Prüfung", "Verwendbar zum Abstecken auf der Baustelle"],
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Neigungen und Prüfung",
        tekst: "Jede Böschung und jedes Gefälle wird vor der Lieferung geprüft. Sonst wird ein Fehler im Modell zu einem Fehler im Boden.",
        punten: ["Neigungskarte des gesamten Entwurfs", "Höhenkontrolle an bekannten Punkten", "Abweichungen vor der Lieferung gemeldet"],
        beeld: "/3d/model-platform-helling.jpg",
      },
    ],
    merkenEyebrow: "Marken",
    merkenTitel: "Maschinensteuerung nach Marke",
    merkenIntro: "Dasselbe Modell, geliefert für jedes System auf Ihrer Baustelle. Auch eine Mietmaschine einer anderen Marke erhält ihre Datei, ohne Aufpreis.",
    formatenEyebrow: "Formate",
    formatenTitel: "Ein Modell, alle Ihre Systeme",
    formatenTekst: "Arbeiten Sie mit Maschinen verschiedener Marken? Wählen Sie bei Ihrer Anfrage einfach alle aus. Sie erhalten das Modell im Format jedes Systems, ohne Aufpreis.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML und DXF für andere Systeme und für Ihr Vermessungsteam", "Immer im Koordinatensystem und Höhenbezug der Baustelle", "Download in Ihrem Kundenportal, mit jeder Revision"],
    verantwKop: "Wichtig",
    verantw: "Wir liefern das 3D-Modell. Betrieb, Einrichtung und Kalibrierung Ihrer Maschinensteuerung sowie die Kontrolle auf der Baustelle bleiben in Ihrer Verantwortung. Prüfen Sie das Modell vor Beginn an einem bekannten Punkt.",
    tarievenLink: "Preise ansehen",
    cta: { eyebrow: "Bereit loszulegen?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: "Laden Sie Ihre Pläne hoch, nennen Sie die Baustellenadresse und wählen Sie Ihre Maschinensteuerungen.", knop: "Angebot anfordern" },
  },
  es: {
    meta: {
      title: "Modelo 3D para control de maquinaria: contenido | Studio VM",
      description: "Superficie de proyecto (TIN), líneas, curvas de nivel y control de pendientes, en el formato de todos sus sistemas de control de maquinaria.",
    },
    eyebrow: "Modelos 3D",
    titel: "¿Qué contiene un modelo 3D para control de maquinaria?",
    intro: "Un buen modelo para control de maquinaria es más que una superficie. Es un proyecto completo y verificado que su operador entiende en pantalla y sobre el que la máquina se guía con precisión.",
    synoniem: "Un modelo 3D para control de maquinaria es el archivo que carga su excavadora, motoniveladora o bulldozer con guiado GPS: el MDT (modelo digital del terreno) del proyecto y sus líneas.",
    onderdelen: [
      {
        titel: "Superficie de proyecto",
        tekst: "El corazón de cada modelo: una red de triángulos (TIN) de la cota final. La máquina compara continuamente la posición del cazo o de la hoja con el proyecto.",
        punten: ["Cota final o por capa (subbase, base, rodadura)", "Encuentros con el terreno existente", "Sin huecos ni triángulos erróneos"],
        beeld: "/3d/relief-grondwerk-licht.png",
        donker: "/3d/relief-grondwerk-donker.png",
      },
      {
        titel: "Líneas y líneas de ruptura",
        tekst: "Bordes, ejes, bordillos, pie y cabeza de talud: las líneas que dan forma a la superficie y que el operador ve como referencia en su pantalla.",
        punten: ["Líneas de ruptura para una superficie correcta", "Capas por tipo de línea, con colores reconocibles", "Ejes para viales y conducciones"],
        beeld: "/3d/terrein-lijnwerk.jpg",
        kennis: "lijnwerk-en-breeklijnen",
      },
      {
        titel: "Curvas de nivel y colores",
        tekst: "Para leer y comprobar el modelo de un vistazo: ¿dónde está alto, dónde bajo, y corre el agua en la dirección correcta?",
        punten: ["Curvas de nivel con una equidistancia legible", "Colores hipsométricos para un control rápido", "Utilizable para replantear en obra"],
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Pendientes y control",
        tekst: "Cada talud y cada desagüe se comprueba antes de la entrega. De lo contrario, un error en el modelo se convierte en un error en el terreno.",
        punten: ["Mapa de pendientes de todo el proyecto", "Control de cotas en puntos conocidos", "Desviaciones comunicadas antes de la entrega"],
        beeld: "/3d/model-platform-helling.jpg",
      },
    ],
    merkenEyebrow: "Marcas",
    merkenTitel: "Control de maquinaria por marca",
    merkenIntro: "El mismo modelo, entregado para cada sistema de su obra. Una máquina alquilada de otra marca también recibe su archivo, sin coste adicional.",
    formatenEyebrow: "Formatos",
    formatenTitel: "Un modelo, todos sus sistemas",
    formatenTekst: "¿Trabaja con máquinas de distintas marcas? Selecciónelas todas en su solicitud. Recibirá el modelo en el formato de cada sistema, sin coste adicional.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML y DXF para otros sistemas y para su equipo de topografía", "Siempre en el sistema de coordenadas y la referencia altimétrica de la obra", "Descarga en su portal de cliente, con cada revisión"],
    verantwKop: "Importante",
    verantw: "Entregamos el modelo 3D. El funcionamiento, la configuración y la calibración de su sistema de control de maquinaria, así como el control en obra, siguen siendo responsabilidad suya. Compruebe el modelo en un punto conocido antes de empezar.",
    tarievenLink: "Ver las tarifas",
    cta: { eyebrow: "¿Listo para empezar?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: "Suba sus planos, indique la dirección de la obra y elija sus sistemas de control de maquinaria.", knop: "Solicitar presupuesto" },
  },
};

// Index in formatenPunten van het punt over het coördinatenstelsel: daar
// hoort de link naar het kennisartikel over stelsels.
const STELSEL_PUNT = 2;

// ── Machinebesturing per merk ─────────────────────────────────────────────
// Enkel formaatnamen, zoals ze op de machine geladen worden. Voor Komatsu en
// Caterpillar beweren we bewust niets specifiekers dan het onderliggende
// systeem of LandXML + DXF.

type MerkRegel = { systeem?: string; formaat?: string; noot?: string };
type MerkKaart = { merk: string; regels: MerkRegel[] };

const MERK_TEKST: Record<
  Locale,
  { siteworksPunten: string; volledigeWerf: string; onderliggend: string; andere: string }
> = {
  nl: {
    siteworksPunten: "Siteworks: ook punten",
    volledigeWerf: "of een volledige werf",
    onderliggend: "In het formaat van het onderliggende systeem, of LandXML + DXF",
    andere: "Voor elk ander systeem dat LandXML of DXF inleest",
  },
  fr: {
    siteworksPunten: "Siteworks : aussi les points",
    volledigeWerf: "ou un chantier complet",
    onderliggend: "Au format du système sous-jacent, ou LandXML + DXF",
    andere: "Pour tout autre système qui lit LandXML ou DXF",
  },
  en: {
    siteworksPunten: "Siteworks: points as well",
    volledigeWerf: "or a complete site project",
    onderliggend: "In the format of the underlying system, or LandXML + DXF",
    andere: "For any other system that reads LandXML or DXF",
  },
  de: {
    siteworksPunten: "Siteworks: auch Punkte",
    volledigeWerf: "oder ein komplettes Baustellenprojekt",
    onderliggend: "Im Format des zugrunde liegenden Systems oder als LandXML + DXF",
    andere: "Für jedes andere System, das LandXML oder DXF liest",
  },
  es: {
    siteworksPunten: "Siteworks: también puntos",
    volledigeWerf: "o un proyecto de obra completo",
    onderliggend: "En el formato del sistema subyacente, o LandXML + DXF",
    andere: "Para cualquier otro sistema que lea LandXML o DXF",
  },
};

function merkKaarten(l: Locale): MerkKaart[] {
  const w = MERK_TEKST[l];
  return [
    {
      merk: "Trimble",
      regels: [
        { systeem: "GCS900", formaat: ".svd + .svl + .cal" },
        { systeem: "Earthworks", formaat: ".dsz" },
        { systeem: "Access · Siteworks", formaat: ".ttm + DXF", noot: w.siteworksPunten },
      ],
    },
    { merk: "Topcon", regels: [{ systeem: "3D-MC · MC-Max · Pocket-3D", formaat: ".tp3 + LandXML" }] },
    { merk: "Leica", regels: [{ systeem: "iCON site · MC1", formaat: "LandXML + DXF" }] },
    { merk: "Unicontrol", regels: [{ formaat: "LandXML + DXF" }] },
    { merk: "CHCNAV", regels: [{ formaat: "LandXML + DXF", noot: w.volledigeWerf }] },
    { merk: "Komatsu", regels: [{ noot: w.onderliggend }] },
    { merk: "Caterpillar", regels: [{ noot: w.onderliggend }] },
    { merk: "LandXML / DXF", regels: [{ noot: w.andere }] },
  ];
}

/** Titel van een kennisartikel in de paginataal (ankertekst van de link). */
function kennisTitel(slug: string, l: Locale): string {
  return kennisArtikel(slug)?.i18n[l].titel ?? slug;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, { ...T[locale].meta, ogBeeld: ogBeeld(locale, "3d-modellen") });
}

export default async function ModellenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const m = getMessages(locale);

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale, { metDienst: true }),
          dienstNodes(locale),
          kruimels(locale, PAD, [{ naam: KRUIMEL[PAD][locale], pad: PAD }]),
          webPagina(locale, PAD, {
            naam: t.meta.title,
            beschrijving: t.meta.description,
            about: ID.dienst,
            mainEntity: { "@id": ID.dienst },
          }),
        )}
      />
      <section className="border-b">
        <div className="wrap py-16 sm:py-20 2xl:py-24">
          <div className="max-w-3xl 2xl:max-w-4xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted">{t.synoniem}</p>
          </div>
        </div>
      </section>

      {t.onderdelen.map((o, i) => (
        <section key={o.titel} className={`reveal-on-scroll border-b ${i % 2 ? "bg-card" : ""}`}>
          <div className={`wrap grid items-center gap-12 py-20 lg:grid-cols-2 xl:gap-20 2xl:py-24 ${i % 2 ? "2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]" : "2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"}`}>
            <div className={`max-w-2xl ${i % 2 ? "lg:order-2" : ""}`}>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                <Layers className="mr-2 inline h-4 w-4" strokeWidth={1.5} />
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight 2xl:text-4xl">{o.titel}</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">{o.tekst}</p>
              <ul className="mt-6 space-y-2.5">
                {o.punten.map((p) => (
                  <li key={p} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
              {o.kennis && (
                <KennisLink href={localePath(locale, `/kennis/${o.kennis}`)} label={kennisTitel(o.kennis, locale)} />
              )}
            </div>
            <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl border bg-[#0b1220] 2xl:aspect-[16/10] ${i % 2 ? "lg:order-1" : ""}`}>
              <Image src={o.beeld} alt={`${o.titel} — ${BEELD_ALT[locale]}`} fill sizes="(max-width: 1024px) 100vw, 60vw" className={`${o.donker ? "alleen-licht " : ""}object-cover`} />
              {o.donker && <Image src={o.donker} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="alleen-donker object-cover" />}
            </div>
          </div>
        </section>
      ))}

      <section id="merken" className="reveal-on-scroll scroll-mt-24 border-b">
        <div className="wrap py-20 2xl:py-24">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <Tag className="h-4 w-4" strokeWidth={1.5} />
              {t.merkenEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.merkenTitel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.merkenIntro}</p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-6">
            {merkKaarten(locale).map((k) => (
              <li key={k.merk} className="rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold tracking-tight">{k.merk}</h3>
                <ul className="mt-4 space-y-3">
                  {k.regels.map((r) => (
                    <li key={`${r.systeem ?? ""}${r.formaat ?? ""}${r.noot ?? ""}`} className="text-sm leading-relaxed">
                      {r.systeem && <span className="block font-medium">{r.systeem}</span>}
                      {r.formaat && <span className="block font-mono text-accent">{r.formaat}</span>}
                      {r.noot && <span className="block text-muted">{r.noot}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <KennisLink
            href={localePath(locale, "/kennis/bestanden-per-merk")}
            label={kennisTitel("bestanden-per-merk", locale)}
          />
        </div>
      </section>

      <section className="reveal-on-scroll border-b bg-card">
        <div className="wrap grid gap-10 py-20 lg:grid-cols-[1.2fr_1fr] xl:gap-20 2xl:py-24">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <MonitorSmartphone className="h-4 w-4" strokeWidth={1.5} />
              {t.formatenEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.formatenTitel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.formatenTekst}</p>
            <ul className="mt-6 space-y-2.5">
              {t.formatenPunten.map((p, i) => (
                <li key={p} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  <span>
                    {p}
                    {i === STELSEL_PUNT && (
                      <>
                        {" · "}
                        <Link
                          href={localePath(locale, "/kennis/coordinatenstelsels")}
                          className="font-medium text-accent hover:underline"
                        >
                          {kennisTitel("coordinatenstelsels", locale)}
                        </Link>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm">
              <Link
                href={localePath(locale, "/tarieven")}
                className="font-medium underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
              >
                {m.aanbod.prijsregel}
              </Link>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={localePath(locale, "/offerte")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90">
                <FileUp className="h-4 w-4" strokeWidth={2} />
                {t.cta.knop}
              </Link>
              <Link href={localePath(locale, "/tarieven")} className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium hover:bg-card-hover">
                {t.tarievenLink}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link href={localePath(locale, "/realisaties")} className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium hover:bg-card-hover">
                {KRUIMEL["/realisaties"][locale]}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
          <div className="flex gap-4 self-start rounded-3xl border border-accent/30 bg-accent/5 p-8">
            <ShieldCheck className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} />
            <div>
              <h3 className="font-semibold tracking-tight">{t.verantwKop}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.verantw}</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}

function KennisLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
      <BookOpen className="h-4 w-4" strokeWidth={1.5} />
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={2} />
    </Link>
  );
}
