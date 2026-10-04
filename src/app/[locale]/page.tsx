import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  FileUp,
  Calculator,
  Layers,
  Send,
  Globe2,
  Crosshair,
  DraftingCompass,
  LocateFixed,
} from "lucide-react";
import { Graafkraan } from "@/components/icons/graafkraan";
import { archiefBeeld, archiefPad, type ArchiefWeergave } from "@/lib/archief";
import { ContactForm } from "@/components/contact-form";
import { CtaBanner } from "@/components/cta-banner";
import { HeroCarrousel } from "@/components/hero-carrousel";
import { JsonLd } from "@/components/json-ld";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { paginaMeta } from "@/lib/seo";
import { ID, dienstNodes, graph, siteNodes, webPagina } from "@/lib/schema";
import { BEDRIJF, FUNCTIE, LAND, PROVINCIE } from "@/lib/bedrijf";
import { BEELD_ALT } from "@/lib/realisaties";
import { LANDEN, stelselVoor, type Land } from "@/lib/stelsel";

/* ─────────────────────────────────────────────────────────────────────────
 * Studio VM — 3D-modellen voor machinesturing.
 * Alle teksten van deze pagina staan in X (nl/fr/en/de/es). Beelden in /public/3d.
 * ───────────────────────────────────────────────────────────────────────── */

// Enkel de vijf talen bestaan; al het andere (/wp-login.php, …) krijgt de 404.
export const dynamicParams = false;

type Kaart = { titel: string; tekst: string; beeld: string };
type Stap = { titel: string; tekst: string };

const X: Record<
  Locale,
  {
    eyebrow: string;
    titel: string;
    sub: string;
    beloftes: string[];
    ctaOfferte: string;
    ctaWerkwijze: string;
    merkenTitel: string;
    merkenNoot: string;
    leverEyebrow: string;
    leverTitel: string;
    leverIntro: string;
    lever: Kaart[];
    leverLink: string;
    stappenEyebrow: string;
    stappenTitel: string;
    stappenIntro: string;
    stappen: Stap[];
    tarievenLink: string;
    toepEyebrow: string;
    toepTitel: string;
    toepIntro: string;
    toep: Kaart[];
    toepLink: string;
    stelselEyebrow: string;
    stelselTitel: string;
    stelselTekst: string;
    stelselVoorbeelden: { land: string; stelsel: string }[];
    stelselLink: string;
    ctaEyebrow: string;
    ctaTitel: string;
    ctaSub: string;
    ctaKnop: string;
  }
> = {
  nl: {
    eyebrow: "3D-modellen voor machinesturing",
    titel: "Van plan tot machine.",
    sub: "Wij zetten uw 2D-plannen om in nauwkeurige 3D-ontwerpmodellen die uw GPS-gestuurde graafkraan, grader of dozer meteen inleest — in het formaat van uw machine en in het juiste coördinatenstelsel, overal in Europa.",
    beloftes: [
      "Geleverd in het formaat van uw machine",
      "Juist coördinatenstelsel per land",
      "Gecontroleerd vóór levering",
    ],
    ctaOfferte: "Offerte aanvragen",
    ctaWerkwijze: "Zo werkt het",
    merkenTitel: "Voor alle gangbare merken van machinebesturing",
    merkenNoot: "en andere systemen die LandXML of DXF lezen",
    leverEyebrow: "Wat u krijgt",
    leverTitel: "Een model dat uw machine begrijpt",
    leverIntro:
      "Geen losse lijnen, maar een volledig uitgewerkt ontwerp: het oppervlak waarop de bak stuurt, het lijnwerk voor de machinist en een controle op elke helling.",
    lever: [
      {
        titel: "Ontwerpoppervlak",
        tekst: "Het 3D-terreinmodel (TIN) van het eindniveau: daarop stuurt uw machine de bak of het blad.",
        beeld: "/3d/terrein-hoogtekleuren.jpg",
      },
      {
        titel: "Lijnwerk en breeklijnen",
        tekst: "Kanten, assen, boordstenen en taludlijnen als referentie op het scherm in de cabine.",
        beeld: "/3d/terrein-lijnwerk.jpg",
      },
      {
        titel: "Hoogtelijnen",
        tekst: "Om het model in één oogopslag te controleren, en om mee uit te zetten op de werf.",
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Hellingscontrole",
        tekst: "Elk talud en elke afwatering nagekeken op de juiste helling, vóór er één kuub grond verzet wordt.",
        beeld: "/3d/model-talud-helling.jpg",
      },
    ],
    leverLink: "Bekijk wat er in een model zit",
    stappenEyebrow: "Werkwijze",
    stappenTitel: "In vier stappen van plan naar machine",
    stappenIntro: "U stuurt plannen, wij leveren een model dat klaar is om in te laden. Geen software te leren, geen licenties te kopen.",
    stappen: [
      { titel: "Plannen opsturen", tekst: "PDF, DWG, DXF of LandXML — samen met het adres van de werf en het merk van uw machinesturing." },
      { titel: "Offerte op maat", tekst: "U krijgt een duidelijke prijs en leverdatum, op basis van uw plannen." },
      { titel: "Modelleren en controleren", tekst: "We bouwen het 3D-model en controleren niveaus, hellingen en aansluitingen." },
      { titel: "Klaar voor de machine", tekst: "Levering in het formaat van uw machine, in het coördinatenstelsel van de werf." },
    ],
    tarievenLink: "Bekijk de tarieven",
    toepEyebrow: "Toepassingen",
    toepTitel: "Van bouwput tot wegtracé",
    toepIntro: "Elk project waar een machine met GPS-sturing op het juiste niveau moet graven, egaliseren of aanleggen, ook riolering, sleuven en sportvelden.",
    toep: [
      { titel: "Grondwerk en platformen", tekst: "Bedrijfsterreinen, verkavelingen en funderingsplatformen.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Wegenis en tracés", tekst: "Wegen, fietspaden en opritten met hun profielen.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Bouwputten", tekst: "Uitgravingen met taluds en werkvloeren op niveau.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Kruispunten en verhardingen", tekst: "Rotondes, kruispunten en parkings, met verkanting en afwatering tot op de centimeter.", beeld: "/3d/model-parking.jpg" },
    ],
    toepLink: "Bekijk realisaties",
    stelselEyebrow: "Overal in Europa",
    stelselTitel: "Het juiste stelsel, vanaf het werfadres",
    stelselTekst:
      "Een model in het verkeerde coördinatenstelsel ligt naast de werf. Daarom vragen we bij elke aanvraag het adres van de werf: daaruit volgt meteen het stelsel en het hoogtereferentiekader van dat land.",
    stelselVoorbeelden: [
      { land: "België", stelsel: "Lambert 72 · TAW" },
      { land: "Nederland", stelsel: "RD New · NAP" },
      { land: "Frankrijk", stelsel: "Lambert-93 / CC-zones · NGF" },
      { land: "Duitsland", stelsel: "ETRS89 / UTM · DHHN2016" },
      { land: "Luxemburg", stelsel: "LUREF · NG95" },
    ],
    stelselLink: "Meer over coördinatenstelsels",
    ctaEyebrow: "Klaar om te starten?",
    ctaTitel: "Stuur uw plannen, ontvang een offerte op maat",
    ctaSub: "Laad uw plannen op, geef het werfadres en het merk van uw machinesturing. U krijgt een duidelijke prijs en leverdatum.",
    ctaKnop: "Offerte aanvragen",
  },
  fr: {
    eyebrow: "Modèles 3D pour le guidage d'engins",
    titel: "Du plan à la machine.",
    sub: "Nous transformons vos plans 2D en modèles 3D précis que votre pelleteuse, niveleuse ou bulldozer à guidage GPS charge directement — dans le format de votre machine et dans le bon système de coordonnées, partout en Europe.",
    beloftes: [
      "Livré dans le format de votre machine",
      "Le bon système de coordonnées par pays",
      "Contrôlé avant livraison",
    ],
    ctaOfferte: "Demander un devis",
    ctaWerkwijze: "Comment ça marche",
    merkenTitel: "Pour tous les systèmes de guidage courants",
    merkenNoot: "et tout système lisant LandXML ou DXF",
    leverEyebrow: "Ce que vous recevez",
    leverTitel: "Un modèle que votre machine comprend",
    leverIntro:
      "Pas de lignes isolées, mais un projet complet : la surface sur laquelle le godet est guidé, le filaire pour le conducteur et un contrôle de chaque pente.",
    lever: [
      {
        titel: "Surface de projet",
        tekst: "Le modèle 3D du terrain fini (TIN) : c'est sur lui que la machine guide le godet ou la lame.",
        beeld: "/3d/terrein-hoogtekleuren.jpg",
      },
      {
        titel: "Filaire et lignes de rupture",
        tekst: "Bords, axes, bordures et lignes de talus comme repères sur l'écran en cabine.",
        beeld: "/3d/terrein-lijnwerk.jpg",
      },
      {
        titel: "Courbes de niveau",
        tekst: "Pour contrôler le modèle d'un coup d'œil, et pour l'implantation sur chantier.",
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Contrôle des pentes",
        tekst: "Chaque talus et chaque écoulement vérifiés avant de déplacer le moindre mètre cube.",
        beeld: "/3d/model-talud-helling.jpg",
      },
    ],
    leverLink: "Voir ce que contient un modèle",
    stappenEyebrow: "Méthode",
    stappenTitel: "Du plan à la machine en quatre étapes",
    stappenIntro: "Vous envoyez les plans, nous livrons un modèle prêt à charger. Aucun logiciel à apprendre, aucune licence à acheter.",
    stappen: [
      { titel: "Envoyer les plans", tekst: "PDF, DWG, DXF ou LandXML — avec l'adresse du chantier et la marque de votre guidage." },
      { titel: "Devis sur mesure", tekst: "Vous recevez un prix et un délai clairs, sur base de vos plans." },
      { titel: "Modélisation et contrôle", tekst: "Nous construisons le modèle 3D et vérifions niveaux, pentes et raccords." },
      { titel: "Prêt pour la machine", tekst: "Livraison dans le format de votre machine, dans le système de coordonnées du chantier." },
    ],
    tarievenLink: "Voir les tarifs",
    toepEyebrow: "Applications",
    toepTitel: "De la fouille au tracé routier",
    toepIntro: "Tout projet où une machine guidée par GPS doit creuser, régler ou poser au bon niveau, y compris égouttage, tranchées et terrains de sport.",
    toep: [
      { titel: "Terrassements et plateformes", tekst: "Zones d'activité, lotissements et plateformes de fondation.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Voiries et tracés", tekst: "Routes, pistes cyclables et accès avec leurs profils.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Fouilles", tekst: "Excavations avec talus et fonds de fouille à niveau.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Carrefours et revêtements", tekst: "Giratoires, carrefours et parkings, avec dévers et écoulements au centimètre.", beeld: "/3d/model-parking.jpg" },
    ],
    toepLink: "Voir les réalisations",
    stelselEyebrow: "Partout en Europe",
    stelselTitel: "Le bon système, dès l'adresse du chantier",
    stelselTekst:
      "Un modèle dans le mauvais système de coordonnées tombe à côté du chantier. C'est pourquoi nous demandons l'adresse du chantier : elle détermine aussitôt le système et la référence altimétrique du pays.",
    stelselVoorbeelden: [
      { land: "Belgique", stelsel: "Lambert 72 · DNG" },
      { land: "Pays-Bas", stelsel: "RD New · NAP" },
      { land: "France", stelsel: "Lambert-93 / zones CC · NGF" },
      { land: "Allemagne", stelsel: "ETRS89 / UTM · DHHN2016" },
      { land: "Luxembourg", stelsel: "LUREF · NG95" },
    ],
    stelselLink: "En savoir plus sur les systèmes de coordonnées",
    ctaEyebrow: "Prêt à démarrer ?",
    ctaTitel: "Envoyez vos plans, recevez un devis sur mesure",
    ctaSub: "Chargez vos plans, indiquez l'adresse du chantier et la marque de votre guidage. Vous recevez un prix et un délai clairs.",
    ctaKnop: "Demander un devis",
  },
  en: {
    eyebrow: "3D models for machine control",
    titel: "From plan to machine.",
    sub: "We turn your 2D plans into accurate 3D design models that your GPS-guided excavator, grader or dozer loads straight away — in your machine's format and in the right coordinate system, anywhere in Europe.",
    beloftes: [
      "Delivered in your machine's format",
      "The right coordinate system per country",
      "Checked before delivery",
    ],
    ctaOfferte: "Request a quote",
    ctaWerkwijze: "How it works",
    merkenTitel: "For all common machine control systems",
    merkenNoot: "and any system that reads LandXML or DXF",
    leverEyebrow: "What you get",
    leverTitel: "A model your machine understands",
    leverIntro:
      "Not loose lines, but a complete design: the surface the bucket is guided on, linework for the operator and a check on every slope.",
    lever: [
      {
        titel: "Design surface",
        tekst: "The 3D model of the finished level (TIN): the surface your machine guides the bucket or blade on.",
        beeld: "/3d/terrein-hoogtekleuren.jpg",
      },
      {
        titel: "Linework and breaklines",
        tekst: "Edges, centrelines, kerbs and slope lines as a reference on the screen in the cab.",
        beeld: "/3d/terrein-lijnwerk.jpg",
      },
      {
        titel: "Contour lines",
        tekst: "To check the model at a glance, and for setting out on site.",
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Slope check",
        tekst: "Every embankment and drainage fall checked before a single cubic metre is moved.",
        beeld: "/3d/model-talud-helling.jpg",
      },
    ],
    leverLink: "See what's in a model",
    stappenEyebrow: "How it works",
    stappenTitel: "From plan to machine in four steps",
    stappenIntro: "You send the plans, we deliver a model that is ready to load. No software to learn, no licences to buy.",
    stappen: [
      { titel: "Send your plans", tekst: "PDF, DWG, DXF or LandXML — with the site address and the brand of your machine control." },
      { titel: "Tailored quote", tekst: "You get a clear price and delivery date, based on your plans." },
      { titel: "Modelling and checks", tekst: "We build the 3D model and check levels, slopes and tie-ins." },
      { titel: "Ready for the machine", tekst: "Delivered in your machine's format, in the site's coordinate system." },
    ],
    tarievenLink: "See the rates",
    toepEyebrow: "Applications",
    toepTitel: "From excavation to road alignment",
    toepIntro: "Any project where a GPS-guided machine has to dig, grade or lay to the right level, including sewers, trenches and sports fields.",
    toep: [
      { titel: "Earthworks and platforms", tekst: "Industrial sites, housing plots and foundation platforms.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Roads and alignments", tekst: "Roads, cycle paths and driveways with their profiles.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Excavations", tekst: "Pits with embankments and formation levels.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Junctions and paving", tekst: "Roundabouts, junctions and car parks, with crossfall and drainage to the centimetre.", beeld: "/3d/model-parking.jpg" },
    ],
    toepLink: "See projects",
    stelselEyebrow: "Anywhere in Europe",
    stelselTitel: "The right system, from the site address",
    stelselTekst:
      "A model in the wrong coordinate system ends up next to the site. That is why we ask for the site address with every request: it immediately tells us the country's coordinate system and height datum.",
    stelselVoorbeelden: [
      { land: "Belgium", stelsel: "Lambert 72 · TAW" },
      { land: "Netherlands", stelsel: "RD New · NAP" },
      { land: "France", stelsel: "Lambert-93 / CC zones · NGF" },
      { land: "Germany", stelsel: "ETRS89 / UTM · DHHN2016" },
      { land: "Luxembourg", stelsel: "LUREF · NG95" },
    ],
    stelselLink: "More about coordinate systems",
    ctaEyebrow: "Ready to start?",
    ctaTitel: "Send your plans, get a tailored quote",
    ctaSub: "Upload your plans, give the site address and your machine control brand. You get a clear price and delivery date.",
    ctaKnop: "Request a quote",
  },
  de: {
    eyebrow: "3D-Modelle für Maschinensteuerung",
    titel: "Vom Plan zur Maschine.",
    sub: "Wir verwandeln Ihre 2D-Pläne in präzise 3D-Modelle, die Ihr GPS-gesteuerter Bagger, Grader oder Dozer sofort einliest — im Format Ihrer Maschine und im richtigen Koordinatensystem, überall in Europa.",
    beloftes: [
      "Geliefert im Format Ihrer Maschine",
      "Das richtige Koordinatensystem je Land",
      "Vor der Lieferung geprüft",
    ],
    ctaOfferte: "Angebot anfordern",
    ctaWerkwijze: "So funktioniert es",
    merkenTitel: "Für alle gängigen Maschinensteuerungen",
    merkenNoot: "und alle Systeme, die LandXML oder DXF lesen",
    leverEyebrow: "Was Sie erhalten",
    leverTitel: "Ein Modell, das Ihre Maschine versteht",
    leverIntro:
      "Keine losen Linien, sondern ein vollständig ausgearbeiteter Entwurf: die Oberfläche, an der der Löffel geführt wird, die Linien für den Maschinenführer und eine Prüfung jeder Neigung.",
    lever: [
      {
        titel: "Planungsoberfläche",
        tekst: "Das 3D-Geländemodell (TIN) der Endhöhe: Daran führt Ihre Maschine den Löffel oder das Schild.",
        beeld: "/3d/terrein-hoogtekleuren.jpg",
      },
      {
        titel: "Linien und Bruchkanten",
        tekst: "Kanten, Achsen, Bordsteine und Böschungslinien als Referenz auf dem Bildschirm in der Kabine.",
        beeld: "/3d/terrein-lijnwerk.jpg",
      },
      {
        titel: "Höhenlinien",
        tekst: "Um das Modell auf einen Blick zu prüfen und um auf der Baustelle abzustecken.",
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Neigungsprüfung",
        tekst: "Jede Böschung und jedes Gefälle auf die richtige Neigung geprüft, bevor auch nur ein Kubikmeter Erde bewegt wird.",
        beeld: "/3d/model-talud-helling.jpg",
      },
    ],
    leverLink: "Sehen, was in einem Modell steckt",
    stappenEyebrow: "Ablauf",
    stappenTitel: "In vier Schritten vom Plan zur Maschine",
    stappenIntro: "Sie senden die Pläne, wir liefern ein Modell, das sofort geladen werden kann. Keine Software zu lernen, keine Lizenzen zu kaufen.",
    stappen: [
      { titel: "Pläne senden", tekst: "PDF, DWG, DXF oder LandXML — zusammen mit der Baustellenadresse und der Marke Ihrer Maschinensteuerung." },
      { titel: "Individuelles Angebot", tekst: "Sie erhalten einen klaren Preis und einen Liefertermin auf Grundlage Ihrer Pläne." },
      { titel: "Modellieren und prüfen", tekst: "Wir erstellen das 3D-Modell und prüfen Höhen, Neigungen und Anschlüsse." },
      { titel: "Bereit für die Maschine", tekst: "Lieferung im Format Ihrer Maschine, im Koordinatensystem der Baustelle." },
    ],
    tarievenLink: "Preise ansehen",
    toepEyebrow: "Anwendungen",
    toepTitel: "Von der Baugrube bis zur Straßentrasse",
    toepIntro: "Jedes Projekt, bei dem eine GPS-gesteuerte Maschine auf der richtigen Höhe graben, planieren oder einbauen muss, auch Kanalbau, Gräben und Sportplätze.",
    toep: [
      { titel: "Erdbau und Planien", tekst: "Gewerbegebiete, Baugebiete und Gründungsplanien.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Straßenbau und Trassen", tekst: "Straßen, Radwege und Zufahrten mit ihren Profilen.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Baugruben", tekst: "Aushub mit Böschungen und Sohlen auf Höhe.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Kreuzungen und Befestigungen", tekst: "Kreisverkehre, Kreuzungen und Parkplätze, mit Querneigung und Entwässerung auf den Zentimeter genau.", beeld: "/3d/model-parking.jpg" },
    ],
    toepLink: "Referenzen ansehen",
    stelselEyebrow: "Überall in Europa",
    stelselTitel: "Das richtige System, ab der Baustellenadresse",
    stelselTekst:
      "Ein Modell im falschen Koordinatensystem liegt neben der Baustelle. Deshalb fragen wir bei jeder Anfrage nach der Baustellenadresse: Daraus ergeben sich sofort das Koordinatensystem und der Höhenbezug des Landes.",
    stelselVoorbeelden: [
      { land: "Belgien", stelsel: "Lambert 72 · TAW" },
      { land: "Niederlande", stelsel: "RD New · NAP" },
      { land: "Frankreich", stelsel: "Lambert-93 / CC-Zonen · NGF" },
      { land: "Deutschland", stelsel: "ETRS89 / UTM · DHHN2016" },
      { land: "Luxemburg", stelsel: "LUREF · NG95" },
    ],
    stelselLink: "Mehr über Koordinatensysteme",
    ctaEyebrow: "Bereit loszulegen?",
    ctaTitel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot",
    ctaSub: "Laden Sie Ihre Pläne hoch, nennen Sie die Baustellenadresse und die Marke Ihrer Maschinensteuerung. Sie erhalten einen klaren Preis und Liefertermin.",
    ctaKnop: "Angebot anfordern",
  },
  es: {
    eyebrow: "Modelos 3D para control de maquinaria",
    titel: "Del plano a la máquina.",
    sub: "Convertimos sus planos 2D en modelos 3D precisos que su excavadora, motoniveladora o bulldozer con guiado GPS carga de inmediato — en el formato de su máquina y en el sistema de coordenadas correcto, en toda Europa.",
    beloftes: [
      "Entregado en el formato de su máquina",
      "El sistema de coordenadas correcto para cada país",
      "Verificado antes de la entrega",
    ],
    ctaOfferte: "Solicitar presupuesto",
    ctaWerkwijze: "Cómo funciona",
    merkenTitel: "Para todos los sistemas de control de maquinaria habituales",
    merkenNoot: "y cualquier sistema que lea LandXML o DXF",
    leverEyebrow: "Lo que recibe",
    leverTitel: "Un modelo que su máquina entiende",
    leverIntro:
      "No líneas sueltas, sino un proyecto completo: la superficie sobre la que se guía el cazo, las líneas de referencia para el operador y una comprobación de cada pendiente.",
    lever: [
      {
        titel: "Superficie de proyecto",
        tekst: "El modelo 3D del terreno terminado (TIN): sobre él su máquina guía el cazo o la hoja.",
        beeld: "/3d/terrein-hoogtekleuren.jpg",
      },
      {
        titel: "Líneas y líneas de ruptura",
        tekst: "Bordes, ejes, bordillos y líneas de talud como referencia en la pantalla de la cabina.",
        beeld: "/3d/terrein-lijnwerk.jpg",
      },
      {
        titel: "Curvas de nivel",
        tekst: "Para comprobar el modelo de un vistazo y para replantear en obra.",
        beeld: "/3d/terrein-hoogtelijnen.jpg",
      },
      {
        titel: "Control de pendientes",
        tekst: "Cada talud y cada desagüe comprobados con la pendiente correcta antes de mover un solo metro cúbico.",
        beeld: "/3d/model-talud-helling.jpg",
      },
    ],
    leverLink: "Vea qué contiene un modelo",
    stappenEyebrow: "Método",
    stappenTitel: "Del plano a la máquina en cuatro pasos",
    stappenIntro: "Usted envía los planos y nosotros entregamos un modelo listo para cargar. Sin software que aprender ni licencias que comprar.",
    stappen: [
      { titel: "Enviar los planos", tekst: "PDF, DWG, DXF o LandXML — junto con la dirección de la obra y la marca de su sistema de control de maquinaria." },
      { titel: "Presupuesto a medida", tekst: "Recibe un precio y una fecha de entrega claros, basados en sus planos." },
      { titel: "Modelado y control", tekst: "Construimos el modelo 3D y comprobamos cotas, pendientes y encuentros." },
      { titel: "Listo para la máquina", tekst: "Entrega en el formato de su máquina, en el sistema de coordenadas de la obra." },
    ],
    tarievenLink: "Ver las tarifas",
    toepEyebrow: "Aplicaciones",
    toepTitel: "De la excavación al trazado de carreteras",
    toepIntro: "Cualquier proyecto en el que una máquina guiada por GPS deba excavar, nivelar o colocar a la cota correcta, también saneamiento, zanjas y campos deportivos.",
    toep: [
      { titel: "Movimiento de tierras y plataformas", tekst: "Polígonos industriales, urbanizaciones y plataformas de cimentación.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Viales y trazados", tekst: "Carreteras, carriles bici y accesos con sus perfiles.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Excavaciones", tekst: "Vaciados con taludes y fondos de excavación a cota.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Cruces y pavimentos", tekst: "Glorietas, cruces y aparcamientos, con peralte y desagüe al centímetro.", beeld: "/3d/model-parking.jpg" },
    ],
    toepLink: "Ver proyectos",
    stelselEyebrow: "En toda Europa",
    stelselTitel: "El sistema correcto, a partir de la dirección de la obra",
    stelselTekst:
      "Un modelo en el sistema de coordenadas equivocado queda fuera de la obra. Por eso pedimos la dirección de la obra en cada solicitud: de ella se deducen de inmediato el sistema de coordenadas y la referencia altimétrica del país.",
    stelselVoorbeelden: [
      { land: "Bélgica", stelsel: "Lambert 72 · TAW" },
      { land: "Países Bajos", stelsel: "RD New · NAP" },
      { land: "Francia", stelsel: "Lambert-93 / zonas CC · NGF" },
      { land: "Alemania", stelsel: "ETRS89 / UTM · DHHN2016" },
      { land: "Luxemburgo", stelsel: "LUREF · NG95" },
    ],
    stelselLink: "Más sobre sistemas de coordenadas",
    ctaEyebrow: "¿Listo para empezar?",
    ctaTitel: "Envíe sus planos y reciba un presupuesto a medida",
    ctaSub: "Suba sus planos, indique la dirección de la obra y la marca de su sistema de control de maquinaria. Recibirá un precio y una fecha de entrega claros.",
    ctaKnop: "Solicitar presupuesto",
  },
};

const MERKEN = ["Trimble", "Topcon", "Leica", "Unicontrol", "CHCNAV", "Komatsu", "Caterpillar"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const m = getMessages(locale);
  return paginaMeta(locale, "", { title: m.meta.title, description: m.meta.description });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = getMessages(locale);
  const x = X[locale];

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale, { metDienst: true }),
          dienstNodes(locale),
          webPagina(locale, "", {
            naam: t.meta.title,
            beschrijving: t.meta.description,
            about: ID.org,
            mainEntity: { "@id": ID.dienst },
            metKruimels: false,
          }),
        )}
      />
      <Hero locale={locale} x={x} t={t} />
      <Merken locale={locale} x={x} />
      <Levering locale={locale} x={x} />
      <VoorWie locale={locale} />
      <Werkwijze locale={locale} x={x} />
      <Toepassingen locale={locale} x={x} />
      <Stelsels locale={locale} x={x} />
      <CtaBanner
        locale={locale}
        eyebrow={x.ctaEyebrow}
        title={x.ctaTitel}
        sub={x.ctaSub}
        button={x.ctaKnop}
      />
      <Contact locale={locale} t={t} />
    </main>
  );
}

type T = ReturnType<typeof getMessages>;
type Xt = (typeof X)[Locale];

function Hero({ locale, x, t }: { locale: Locale; x: Xt; t: T }) {
  return (
    <section className="relative isolate overflow-hidden border-b">
      <div aria-hidden className="hero-backdrop">
        <div className="hero-grid" />
        <div className="hero-blob hero-blob-a" />
        <div className="hero-blob hero-blob-b" />
        <div className="hero-blob hero-blob-c" />
        <div className="hero-sweep" />
        <div className="hero-sweep hero-sweep-rev" />
      </div>
      <div className="wrap relative z-10 grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:py-32 xl:gap-16 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] 2xl:gap-24 2xl:py-36">
        <div>
          {/* De eyebrow hoort bij de h1: zo staat het zoekwoord in de kop,
              zonder dat er visueel iets verandert. */}
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl 2xl:text-8xl">
            <span className="mb-6 block font-mono text-xs font-normal uppercase tracking-widest text-accent">
              {x.eyebrow}
            </span>{" "}
            {x.titel}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl 2xl:max-w-2xl">
            {x.sub}
          </p>
          <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {x.beloftes.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm">
            <Link
              href={localePath(locale, "/tarieven")}
              className="font-medium text-foreground underline decoration-accent/60 underline-offset-4 transition-colors hover:text-accent"
            >
              {t.aanbod.prijsregel}
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted">
            <Link href={localePath(locale, "/over")} className="hover:text-accent">
              {BEDRIJF.naam}
            </Link>{" "}
            · {FUNCTIE[locale]} · {BEDRIJF.gemeente} ({PROVINCIE[locale]}), {LAND[locale]}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/offerte")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <FileUp className="h-4 w-4" strokeWidth={2} />
              {x.ctaOfferte}
            </Link>
            <a
              href="#werkwijze"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
            >
              {x.ctaWerkwijze}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
        <HeroCarrousel locale={locale} />
      </div>
    </section>
  );
}

function Merken({ locale, x }: { locale: Locale; x: Xt }) {
  const merkenPagina = localePath(locale, "/3d-modellen#merken");
  return (
    <section className="border-b bg-card">
      <div className="wrap py-10">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted">
          {x.merkenTitel}
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 xl:gap-x-16">
          {MERKEN.map((m) => (
            <li key={m} className="text-lg font-semibold tracking-tight text-foreground/70 xl:text-xl">
              <Link href={merkenPagina} className="transition-colors hover:text-accent">
                {m}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted">{x.merkenNoot}</p>
      </div>
    </section>
  );
}

function Levering({ locale, x }: { locale: Locale; x: Xt }) {
  return (
    <section className="reveal-on-scroll border-b">
      <div className="wrap py-24 sm:py-28">
        <SectieKop eyebrow={x.leverEyebrow} titel={x.leverTitel} intro={x.leverIntro} />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-8">
          {x.lever.map((k, i) => (
            <article key={k.titel} className="group overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0b1220]">
                <Image
                  src={k.beeld}
                  alt={`${k.titel} — ${BEELD_ALT[locale]}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-semibold tracking-tight">{k.titel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{k.tekst}</p>
              </div>
            </article>
          ))}
        </div>
        <VerderLink href={localePath(locale, "/3d-modellen")} label={x.leverLink} />
      </div>
    </section>
  );
}

// ── Voor wie: dezelfde drie doelgroepen als de outreach (aannemers, ontwerpers,
// landmeters), zodat wie op een mail klikt hier zijn aanbod terugvindt. ──────

const VOOR_WIE: Record<
  Locale,
  { eyebrow: string; titel: string; intro: string; groepen: { titel: string; tekst: string }[]; cta: string }
> = {
  nl: {
    eyebrow: "Voor wie",
    titel: "Voor wie de werf voorbereidt",
    intro: "Of u nu de machine bestuurt, het ontwerp tekent of de werf uitzet: u krijgt een model dat meteen werkt.",
    groepen: [
      { titel: "Aannemers", tekst: "Uw plannen als model voor uw graafmachine, grader of dozer. Voor elk systeem, ook last-minute." },
      { titel: "Studiebureaus en architecten", tekst: "Uw ontwerp als 3D-model voor de machine van de aannemer, met een controle van het ontwerp vóór de werf start." },
      { titel: "Landmeters", tekst: "Onderaanneming wanneer het druk is: wij maken het model, u levert het onder uw eigen naam." },
    ],
    cta: "Vraag een offerte aan",
  },
  fr: {
    eyebrow: "Pour qui",
    titel: "Pour ceux qui préparent le chantier",
    intro: "Que vous pilotiez la machine, dessiniez le projet ou implantiez le chantier : vous recevez un modèle qui fonctionne tout de suite.",
    groepen: [
      { titel: "Entrepreneurs", tekst: "Vos plans en modèle pour votre pelle, niveleuse ou bouteur. Pour chaque système, même en urgence." },
      { titel: "Bureaux d'études et architectes", tekst: "Votre projet en modèle 3D pour la machine de l'entrepreneur, avec un contrôle du projet avant le début du chantier." },
      { titel: "Géomètres", tekst: "Sous-traitance quand le travail s'accumule : nous réalisons le modèle, vous le livrez sous votre propre nom." },
    ],
    cta: "Demander un devis",
  },
  en: {
    eyebrow: "Who it's for",
    titel: "For everyone who prepares the site",
    intro: "Whether you run the machine, draw the design or set out the site: you get a model that works straight away.",
    groepen: [
      { titel: "Contractors", tekst: "Your drawings as a model for your excavator, grader or dozer. For every system, even last-minute." },
      { titel: "Engineers and architects", tekst: "Your design as a 3D model for the contractor's machine, with a check of the design before the works start." },
      { titel: "Surveyors", tekst: "Subcontracting when work piles up: we build the model, you deliver it under your own name." },
    ],
    cta: "Request a quote",
  },
  de: {
    eyebrow: "Für wen",
    titel: "Für alle, die die Baustelle vorbereiten",
    intro: "Ob Sie die Maschine fahren, die Planung zeichnen oder die Baustelle abstecken: Sie erhalten ein Modell, das sofort funktioniert.",
    groepen: [
      { titel: "Bauunternehmen", tekst: "Ihre Pläne als Modell für Ihren Bagger, Grader oder Dozer. Für jedes System, auch kurzfristig." },
      { titel: "Planungsbüros und Architekten", tekst: "Ihre Planung als 3D-Modell für die Maschine des Bauunternehmens, mit einer Prüfung der Planung vor Baubeginn." },
      { titel: "Vermessungsbüros", tekst: "Unterauftrag, wenn es eng wird: Wir erstellen das Modell, Sie liefern es unter Ihrem eigenen Namen." },
    ],
    cta: "Angebot anfordern",
  },
  es: {
    eyebrow: "Para quién",
    titel: "Para quien prepara la obra",
    intro: "Tanto si maneja la máquina como si dibuja el proyecto o replantea la obra: recibe un modelo que funciona a la primera.",
    groepen: [
      { titel: "Contratistas", tekst: "Sus planos como modelo para su excavadora, motoniveladora o bulldozer. Para cualquier sistema, incluso con urgencia." },
      { titel: "Ingenierías y arquitectos", tekst: "Su proyecto como modelo 3D para la máquina del contratista, con una revisión del proyecto antes de empezar la obra." },
      { titel: "Topógrafos", tekst: "Subcontratación cuando se acumula el trabajo: nosotros hacemos el modelo, usted lo entrega con su propio nombre." },
    ],
    cta: "Solicitar presupuesto",
  },
};

const VOOR_WIE_ICONEN = [Graafkraan, DraftingCompass, LocateFixed];

function VoorWie({ locale }: { locale: Locale }) {
  const v = VOOR_WIE[locale];
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="wrap py-24 sm:py-28">
        <SectieKop eyebrow={v.eyebrow} titel={v.titel} intro={v.intro} />
        <ul className="mt-14 grid gap-6 md:grid-cols-3 2xl:gap-8">
          {v.groepen.map((g, i) => {
            const Icoon = VOOR_WIE_ICONEN[i]!;
            return (
              <li key={g.titel}>
                <Link
                  href={localePath(locale, "/offerte")}
                  className="group flex h-full flex-col rounded-2xl border bg-background p-8 transition-colors hover:border-accent 2xl:p-10"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border bg-card text-accent">
                    <Icoon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <span className="mt-6 text-lg font-semibold tracking-tight">{g.titel}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{g.tekst}</span>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {v.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

const STAP_ICONEN = [FileUp, Calculator, Layers, Send];

function Werkwijze({ locale, x }: { locale: Locale; x: Xt }) {
  return (
    <section id="werkwijze" className="reveal-on-scroll scroll-mt-24 border-b">
      <div className="wrap py-24 sm:py-28">
        <SectieKop eyebrow={x.stappenEyebrow} titel={x.stappenTitel} intro={x.stappenIntro} />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {x.stappen.map((s, i) => {
            const Icoon = STAP_ICONEN[i];
            return (
              <li key={s.titel} className="relative bg-background p-8 2xl:p-10">
                <div className="flex items-center justify-between">
                  <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <span className="font-mono text-3xl font-semibold text-foreground/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-semibold tracking-tight">{s.titel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.tekst}</p>
                {/* Stap 2 (offerte op maat): de prijzen staan op /tarieven. */}
                {i === 1 && (
                  <Link
                    href={localePath(locale, "/tarieven")}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                  >
                    {x.tarievenLink}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// Toepassingen tonen echte projecten uit het archief (lib/archief), elk met een
// link naar de projectpagina. Volgorde = volgorde van x.toep.
const TOEP_PROJECT: { code: string; weergave: ArchiefWeergave }[] = [
  { code: "a08", weergave: "3d" }, // platformen op twee niveaus
  { code: "a13", weergave: "luchtfoto3d" }, // wegenis van een verkaveling
  { code: "a06", weergave: "3d" }, // bouwput met funderingsputten
  { code: "a04", weergave: "luchtfoto3d" }, // rotonde
];

function Toepassingen({ locale, x }: { locale: Locale; x: Xt }) {
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="wrap py-24 sm:py-28">
        <SectieKop eyebrow={x.toepEyebrow} titel={x.toepTitel} intro={x.toepIntro} />
        <div className="mt-14 grid gap-6 md:grid-cols-2 2xl:grid-cols-4 2xl:gap-8">
          {x.toep.map((k, i) => {
            const p = TOEP_PROJECT[i];
            return (
              <Link
                key={k.titel}
                href={p ? localePath(locale, archiefPad(p.code)) : localePath(locale, "/realisaties")}
                className="group relative isolate block aspect-[16/10] overflow-hidden rounded-3xl border bg-[#0c0a09] 2xl:aspect-[4/5]"
              >
                <Image
                  src={p ? archiefBeeld(p.code, p.weergave) : k.beeld}
                  alt={`${k.titel} — ${BEELD_ALT[locale]}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 25vw"
                  className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16 text-white">
                  <h3 className="text-xl font-semibold tracking-tight">{k.titel}</h3>
                  <p className="mt-1 text-sm text-white/80">{k.tekst}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <VerderLink href={localePath(locale, "/realisaties")} label={x.toepLink} />
      </div>
    </section>
  );
}

function VerderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
    >
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={2} />
    </Link>
  );
}

// Een greep uit de landen die het offerteformulier kent; het stelsel komt uit
// dezelfde functie als het voorstel bij een aanvraag, dus altijd gelijk.
const STELSEL_LANDEN: Land[] = ["BE", "NL", "LU", "FR", "DE", "AT", "CH", "GB", "IE", "ES", "PT", "IT", "PL", "DK", "SE", "NO"];

const MEER_LANDEN: Record<Locale, (n: number) => string> = {
  nl: (n) => `${n} Europese landen ondersteund — bij elke aanvraag stelt het formulier het stelsel van de werf voor.`,
  fr: (n) => `${n} pays européens pris en charge — à chaque demande, le formulaire propose le système du chantier.`,
  en: (n) => `${n} European countries supported — every request proposes the coordinate system of the site.`,
  de: (n) => `${n} europäische Länder unterstützt — bei jeder Anfrage schlägt das Formular das System der Baustelle vor.`,
  es: (n) => `${n} países europeos admitidos — en cada solicitud el formulario propone el sistema de la obra.`,
};


function Stelsels({ locale, x }: { locale: Locale; x: Xt }) {
  const landNaam = new Intl.DisplayNames([locale === "en" ? "en-GB" : locale], { type: "region" });
  return (
    <section className="reveal-on-scroll border-b">
      <div className="wrap grid gap-12 py-24 sm:py-28 lg:grid-cols-2 lg:items-center xl:gap-20">
        <div>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <Globe2 className="h-4 w-4" strokeWidth={1.5} />
            {x.stelselEyebrow}
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
            {x.stelselTitel}
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed text-muted">{x.stelselTekst}</p>
          <Link
            href={localePath(locale, "/kennis/coordinatenstelsels")}
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            {x.stelselLink}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STELSEL_LANDEN.map((land) => {
              const v = stelselVoor(land, null, null);
              return (
                <li key={land} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
                  <span className="mt-0.5 grid h-7 w-9 shrink-0 place-items-center rounded-md border bg-card font-mono text-[11px] font-semibold text-accent" aria-hidden>
                    {land}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{landNaam.of(land) ?? land}</span>
                      <span className="shrink-0 font-mono text-[10px] text-muted">{v.epsg}</span>
                    </span>
                    <span className="block font-mono text-[11px] leading-relaxed text-muted">
                      {v.stelsel} · {v.hoogte}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Crosshair className="h-4 w-4 text-accent" strokeWidth={1.5} />
            {MEER_LANDEN[locale](LANDEN.length)}
          </p>
        </div>
      </div>
    </section>
  );
}

function SectieKop({ eyebrow, titel, intro }: { eyebrow: string; titel: string; intro: string }) {
  return (
    <div className="max-w-3xl xl:grid xl:max-w-none xl:grid-cols-2 xl:items-end xl:gap-16 2xl:gap-24">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">{titel}</h2>
      </div>
      <p className="mt-5 text-lg leading-relaxed text-muted xl:mt-0 xl:max-w-2xl">{intro}</p>
    </div>
  );
}

function Contact({ locale, t }: { locale: Locale; t: T }) {
  return (
    <section id="contact" className="reveal-on-scroll border-b">
      <div className="wrap py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] xl:gap-20 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:gap-28">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.contact.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl 2xl:text-5xl">
              {t.contact.title}
            </h2>
            <p className="mt-6 max-w-xl text-muted">{t.contact.intro}</p>
            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${BEDRIJF.email}`}
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {BEDRIJF.email}
              </a>
              <a
                href={`tel:${BEDRIJF.telefoonE164}`}
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {BEDRIJF.telefoon}
              </a>
              <p className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                <span>
                  {BEDRIJF.naam} · {BEDRIJF.straat}, {BEDRIJF.postcode} {BEDRIJF.gemeente}, {LAND[locale]}
                </span>
              </p>
            </div>
            <VerderLink href={localePath(locale, "/over")} label={t.nav.over} />
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <ContactForm t={t.contactForm} />
          </div>
        </div>
      </div>
    </section>
  );
}
