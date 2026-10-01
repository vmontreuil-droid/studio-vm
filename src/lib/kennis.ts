// ─────────────────────────────────────────────────────────────────────────
// Kennisbank — 3D-ontwerpmodellen voor GPS-machinesturing.
//
// Vijftalig (nl/fr/en/de/es). De slug blijft Nederlands en is in alle talen gelijk.
// Inhoud is algemeen vakkennis voor aannemers en werfleiders: geen
// bestandsformaat-internals, geen klant- of werfnamen, geen prijzen.
// ─────────────────────────────────────────────────────────────────────────

import type { Locale } from "@/lib/i18n/config";

export type KennisSectie = { kop: string; tekst: string[]; lijst?: string[] };

export type KennisArtikel = {
  slug: string;
  icoon: "Layers" | "Spline" | "Globe2" | "FileStack" | "ClipboardCheck" | "Ruler" | "HelpCircle";
  beeld?: string;
  i18n: Record<Locale, { titel: string; samenvatting: string; secties: KennisSectie[] }>;
};

export const KENNIS: KennisArtikel[] = [
  // ── 1. Wat is een 3D-model ───────────────────────────────────────────────
  {
    slug: "wat-is-een-3d-model",
    icoon: "Layers",
    beeld: "/3d/terrein-hoogtekleuren.jpg",
    i18n: {
      nl: {
        titel: "Wat is een 3D-ontwerpmodel?",
        samenvatting:
          "Een ontwerpmodel vertaalt uw plannen naar een digitaal oppervlak waarop een graafmachine, grader of dozer zich kan richten. Wat het is, hoe de machine het gebruikt en waarom het niet hetzelfde is als het bestaande terrein.",
        secties: [
          {
            kop: "Van plan naar oppervlak",
            tekst: [
              "Een bouwplan bestaat meestal uit een grondplan, een lengteprofiel en een reeks dwarsprofielen. Voor een mens is dat voldoende om het ontwerp te begrijpen, maar een machinesturing heeft iets anders nodig: een doorlopend oppervlak waarop voor elk punt in het werkgebied een ontwerphoogte bekend is.",
              "Dat oppervlak noemen we het ontwerpmodel of ontwerpoppervlak. Het wordt opgebouwd als een TIN (Triangulated Irregular Network): een net van aaneengesloten driehoeken waarvan elke hoek een exacte X-, Y- en Z-coördinaat heeft. Tussen die hoekpunten wordt lineair geïnterpoleerd, zodat de machine overal een hoogte kan aflezen.",
              "Naast het oppervlak hoort bij een goed model ook lijnwerk: assen, kantlijnen, boordstenen, taludvoeten en -kruinen. Dat lijnwerk helpt de machinist zich te oriënteren en bepaalt mee hoe de driehoeken lopen.",
            ],
          },
          {
            kop: "Hoe de machine het model gebruikt",
            tekst: [
              "Een machine met 3D-sturing kent via GNSS-ontvangers (of een total station) haar eigen positie en die van het werktuig, zoals de snijkant van de bak of het blad. De sturing vergelijkt continu de hoogte van dat werktuig met de ontwerphoogte uit het model op diezelfde plaats.",
              "Het verschil verschijnt op het scherm in de cabine als ‘te hoog’ of ‘te laag’, vaak met een getal in centimeters. Bij semi-automatische systemen stuurt de hydrauliek het blad of de bak zelf bij. Zo kan er zonder piketten en zonder voortdurend uitzetten worden gegraven, geëgaliseerd en afgewerkt.",
              "De machine volgt het model letterlijk. Elke fout in het model, hoe klein ook, wordt dus ook letterlijk uitgevoerd. Daarom is de kwaliteit van het model even belangrijk als de kwaliteit van de machine.",
            ],
          },
          {
            kop: "Ontwerp versus bestaand terrein",
            tekst: [
              "Het is belangrijk twee oppervlakken uit elkaar te houden. Het bestaande terrein (de opmeting van de huidige toestand) beschrijft hoe de werf er vandaag uitziet. Het ontwerpoppervlak beschrijft hoe ze er na de werken moet uitzien.",
              "De machine stuurt altijd op het ontwerp. Het bestaande terrein wordt gebruikt om te bepalen waar het ontwerp aansluit op de omgeving, waar taluds eindigen en hoeveel grond er moet worden afgegraven of aangevuld. Zonder betrouwbare opmeting van de bestaande toestand kan een ontwerp correct lijken op papier, maar op de werf vreemd aansluiten.",
            ],
          },
          {
            kop: "Meerdere lagen in één project",
            tekst: [
              "Een wegproject of bouwput heeft zelden één enkel ontwerpniveau. Vaak worden meerdere oppervlakken gemaakt, telkens voor een fase van de uitvoering:",
            ],
            lijst: [
              "uitgravingsniveau of bodem van de bouwput;",
              "bovenkant fundering of onderfundering;",
              "afgewerkt niveau (bijvoorbeeld onderkant verharding);",
              "taluds, grachten en aansluitingen op de bestaande toestand.",
            ],
          },
        ],
      },
      fr: {
        titel: "Qu’est-ce qu’un modèle 3D de conception ?",
        samenvatting:
          "Un modèle de conception traduit vos plans en une surface numérique sur laquelle une pelle, une niveleuse ou un bouteur peut se guider. Ce que c’est, comment la machine l’utilise et pourquoi ce n’est pas la même chose que le terrain existant.",
        secties: [
          {
            kop: "Du plan à la surface",
            tekst: [
              "Un dossier de plans comprend généralement une vue en plan, un profil en long et une série de profils en travers. Pour une personne, c’est suffisant pour comprendre le projet, mais un système de guidage a besoin d’autre chose : une surface continue où, pour chaque point de la zone de travail, une altitude projet est connue.",
              "Cette surface s’appelle le modèle ou la surface de conception. Elle est construite sous forme de TIN (Triangulated Irregular Network) : un réseau de triangles jointifs dont chaque sommet possède des coordonnées X, Y et Z exactes. Entre ces sommets, l’altitude est interpolée linéairement, de sorte que la machine peut lire une valeur partout.",
              "Un bon modèle comprend aussi des lignes : axes, bords, bordures, pieds et crêtes de talus. Ces lignes aident le conducteur à s’orienter et déterminent en partie la façon dont les triangles sont formés.",
            ],
          },
          {
            kop: "Comment la machine utilise le modèle",
            tekst: [
              "Une machine équipée d’un guidage 3D connaît sa propre position et celle de l’outil, comme le bord de coupe du godet ou la lame, grâce à des récepteurs GNSS (ou à une station totale). Le système compare en permanence l’altitude de l’outil à l’altitude projet du modèle au même endroit.",
              "L’écart s’affiche en cabine sous la forme « trop haut » ou « trop bas », souvent avec une valeur en centimètres. Avec un système semi-automatique, l’hydraulique corrige elle-même la lame ou le godet. On peut ainsi terrasser, régler et finir sans piquets et sans implantations répétées.",
              "La machine suit le modèle à la lettre. Toute erreur dans le modèle, même minime, est donc exécutée telle quelle. La qualité du modèle compte autant que celle de la machine.",
            ],
          },
          {
            kop: "Projet ou terrain existant",
            tekst: [
              "Il faut bien distinguer deux surfaces. Le terrain existant (le levé de l’état actuel) décrit le chantier tel qu’il est aujourd’hui. La surface de conception décrit ce qu’il doit être après les travaux.",
              "La machine se guide toujours sur le projet. Le terrain existant sert à déterminer où le projet se raccorde à son environnement, où les talus s’arrêtent et quels volumes de déblai ou de remblai sont nécessaires. Sans levé fiable de l’existant, un projet peut paraître correct sur papier et se raccorder de manière étrange sur le terrain.",
            ],
          },
          {
            kop: "Plusieurs couches dans un même projet",
            tekst: [
              "Un projet routier ou une fouille comporte rarement un seul niveau. On réalise souvent plusieurs surfaces, chacune pour une phase d’exécution :",
            ],
            lijst: [
              "fond de fouille ou niveau de terrassement ;",
              "dessus de fondation ou de sous-fondation ;",
              "niveau fini (par exemple dessous du revêtement) ;",
              "talus, fossés et raccords avec l’existant.",
            ],
          },
        ],
      },
      en: {
        titel: "What is a 3D design model?",
        samenvatting:
          "A design model turns your drawings into a digital surface that an excavator, grader or dozer can work to. What it is, how the machine uses it and why it is not the same as the existing ground.",
        secties: [
          {
            kop: "From drawing to surface",
            tekst: [
              "A set of construction drawings usually consists of a layout plan, a long section and a series of cross sections. That is enough for a person to understand the design, but a machine control system needs something different: a continuous surface on which a design level is known for every point in the working area.",
              "That surface is called the design model or design surface. It is built as a TIN (Triangulated Irregular Network): a mesh of adjoining triangles in which every vertex has exact X, Y and Z coordinates. Levels between vertices are interpolated linearly, so the machine can read a value anywhere.",
              "A good model also includes linework: centrelines, edges, kerbs, toes and tops of slopes. This linework helps the operator find their way and partly determines how the triangles are formed.",
            ],
          },
          {
            kop: "How the machine uses the model",
            tekst: [
              "A machine with 3D control knows its own position and that of its working tool, such as the bucket’s cutting edge or the blade, through GNSS receivers (or a total station). The system continuously compares the level of that tool with the design level in the model at the same location.",
              "The difference is shown on the in-cab display as ‘cut’ or ‘fill’, usually with a value in centimetres. With semi-automatic systems the hydraulics adjust the blade or bucket on their own. Digging, grading and finishing can then be done without pegs or repeated setting out.",
              "The machine follows the model literally. Any error in the model, however small, is therefore built literally as well. The quality of the model matters as much as the quality of the machine.",
            ],
          },
          {
            kop: "Design versus existing ground",
            tekst: [
              "It is important to keep two surfaces apart. The existing ground (the survey of the current situation) describes the site as it is today. The design surface describes what it must look like after the works.",
              "The machine always works to the design. The existing ground is used to determine where the design ties in with its surroundings, where slopes end and how much material must be cut or filled. Without a reliable survey of the existing situation, a design can look right on paper and still tie in oddly on site.",
            ],
          },
          {
            kop: "Several layers in one project",
            tekst: [
              "A road project or excavation rarely has a single design level. Several surfaces are often produced, each for a stage of the works:",
            ],
            lijst: [
              "formation level or bottom of excavation;",
              "top of sub-base or base course;",
              "finished level (for example underside of surfacing);",
              "slopes, ditches and tie-ins with the existing ground.",
            ],
          },
        ],
      },
      de: {
        titel: "Was ist ein 3D-Planungsmodell?",
        samenvatting:
          "Ein Planungsmodell übersetzt Ihre Pläne in eine digitale Oberfläche, an der sich ein Bagger, Grader oder eine Planierraupe orientieren kann. Was es ist, wie die Maschine es nutzt und warum es nicht dasselbe ist wie das bestehende Gelände.",
        secties: [
          {
            kop: "Vom Plan zur Oberfläche",
            tekst: [
              "Ein Planungssatz besteht meist aus einem Lageplan, einem Längsschnitt und einer Reihe von Querprofilen. Für einen Menschen reicht das, um den Entwurf zu verstehen. Eine Maschinensteuerung braucht jedoch etwas anderes: eine durchgehende Oberfläche, auf der für jeden Punkt im Arbeitsbereich eine Sollhöhe bekannt ist.",
              "Diese Oberfläche nennt man Planungsmodell oder Planungsoberfläche. Sie wird als TIN (Triangulated Irregular Network) aufgebaut, also als digitales Geländemodell (DGM) aus aneinandergrenzenden Dreiecken, deren Eckpunkte jeweils exakte X-, Y- und Z-Koordinaten haben. Zwischen diesen Eckpunkten wird linear interpoliert, sodass die Maschine überall eine Höhe ablesen kann.",
              "Zu einem guten Modell gehören neben der Oberfläche auch Linien: Achsen, Kanten, Bordsteine, Böschungsfüße und Böschungsoberkanten. Diese Linien helfen dem Maschinenführer bei der Orientierung und bestimmen mit, wie die Dreiecke verlaufen.",
            ],
          },
          {
            kop: "Wie die Maschine das Modell nutzt",
            tekst: [
              "Eine Maschine mit 3D-Steuerung kennt über GNSS-Empfänger (oder ein Tachymeter) ihre eigene Position und die ihres Arbeitswerkzeugs, etwa der Schneide des Löffels oder des Schilds. Das System vergleicht laufend die Höhe dieses Werkzeugs mit der Sollhöhe aus dem Modell an derselben Stelle.",
              "Die Abweichung erscheint auf dem Display in der Kabine als „zu hoch“ oder „zu tief“, meist mit einem Wert in Zentimetern. Bei halbautomatischen Systemen führt die Hydraulik das Schild oder den Löffel selbst nach. So lässt sich ohne Pflöcke und ohne ständiges Abstecken graben, planieren und feinplanieren.",
              "Die Maschine folgt dem Modell wortwörtlich. Jeder Fehler im Modell, so klein er auch sein mag, wird daher ebenso wortwörtlich ausgeführt. Die Qualität des Modells ist deshalb genauso wichtig wie die Qualität der Maschine.",
            ],
          },
          {
            kop: "Planung oder bestehendes Gelände",
            tekst: [
              "Es ist wichtig, zwei Oberflächen auseinanderzuhalten. Das bestehende Gelände (die Aufnahme des Ist-Zustands) beschreibt die Baustelle, wie sie heute aussieht. Die Planungsoberfläche beschreibt, wie sie nach den Arbeiten aussehen soll.",
              "Die Maschine arbeitet immer nach der Planung. Das bestehende Gelände dient dazu festzulegen, wo die Planung an die Umgebung anschließt, wo Böschungen enden und wie viel Boden abgetragen oder aufgefüllt werden muss. Ohne zuverlässige Aufnahme des Bestands kann ein Entwurf auf dem Papier korrekt wirken und auf der Baustelle dennoch seltsam anschließen.",
            ],
          },
          {
            kop: "Mehrere Schichten in einem Projekt",
            tekst: [
              "Ein Straßenbauprojekt oder eine Baugrube hat selten nur eine einzige Planungshöhe. Häufig werden mehrere Oberflächen erstellt, jeweils für eine Bauphase:",
            ],
            lijst: [
              "Aushubsohle bzw. Sohle der Baugrube;",
              "Oberkante Tragschicht oder Frostschutzschicht;",
              "Fertighöhe (zum Beispiel Unterkante Deckschicht);",
              "Böschungen, Gräben und Anschlüsse an das bestehende Gelände.",
            ],
          },
        ],
      },
      es: {
        titel: "¿Qué es un modelo 3D de diseño?",
        samenvatting:
          "Un modelo de diseño traduce sus planos en una superficie digital que una excavadora, motoniveladora o bulldozer puede seguir. Qué es, cómo lo utiliza la máquina y por qué no es lo mismo que el terreno existente.",
        secties: [
          {
            kop: "Del plano a la superficie",
            tekst: [
              "Un juego de planos de obra suele constar de una planta, un perfil longitudinal y una serie de perfiles transversales. Para una persona es suficiente para entender el proyecto, pero un sistema de control de maquinaria necesita algo distinto: una superficie continua en la que se conozca una cota de proyecto para cada punto de la zona de trabajo.",
              "Esa superficie se denomina modelo de diseño o superficie de diseño. Se construye como un TIN (Triangulated Irregular Network): un modelo digital del terreno formado por triángulos contiguos en el que cada vértice tiene coordenadas X, Y y Z exactas. Entre esos vértices se interpola linealmente, de modo que la máquina puede leer una cota en cualquier punto.",
              "Un buen modelo incluye además líneas: ejes, bordes, bordillos, pies y coronaciones de talud. Estas líneas ayudan al operador a orientarse y determinan en parte cómo se forman los triángulos.",
            ],
          },
          {
            kop: "Cómo utiliza la máquina el modelo",
            tekst: [
              "Una máquina con control 3D conoce su propia posición y la de su herramienta de trabajo, como el filo del cazo o la hoja, mediante receptores GNSS (o una estación total). El sistema compara continuamente la cota de esa herramienta con la cota de proyecto del modelo en el mismo lugar.",
              "La diferencia aparece en la pantalla de la cabina como «alto» o «bajo», normalmente con un valor en centímetros. En los sistemas semiautomáticos, la hidráulica corrige por sí sola la hoja o el cazo. Así se puede excavar, nivelar y refinar sin estacas y sin replanteos continuos.",
              "La máquina sigue el modelo al pie de la letra. Cualquier error en el modelo, por pequeño que sea, se ejecuta también al pie de la letra. Por eso la calidad del modelo es tan importante como la de la máquina.",
            ],
          },
          {
            kop: "Diseño frente a terreno existente",
            tekst: [
              "Es importante distinguir dos superficies. El terreno existente (el levantamiento de la situación actual) describe la obra tal como está hoy. La superficie de diseño describe cómo debe quedar una vez terminados los trabajos.",
              "La máquina trabaja siempre según el diseño. El terreno existente sirve para determinar dónde el diseño enlaza con su entorno, dónde terminan los taludes y cuánto material hay que excavar o rellenar. Sin un levantamiento fiable de la situación existente, un diseño puede parecer correcto sobre el papel y, aun así, enlazar de forma extraña en obra.",
            ],
          },
          {
            kop: "Varias capas en un mismo proyecto",
            tekst: [
              "Un proyecto de carretera o una excavación rara vez tiene una única cota de proyecto. A menudo se elaboran varias superficies, cada una para una fase de la ejecución:",
            ],
            lijst: [
              "cota de excavación o fondo de excavación;",
              "cara superior de la base o subbase;",
              "cota terminada (por ejemplo, cara inferior del pavimento);",
              "taludes, cunetas y enlaces con el terreno existente.",
            ],
          },
        ],
      },
    },
  },

  // ── 2. Lijnwerk en breeklijnen ───────────────────────────────────────────
  {
    slug: "lijnwerk-en-breeklijnen",
    icoon: "Spline",
    beeld: "/3d/terrein-lijnwerk.jpg",
    i18n: {
      nl: {
        titel: "Lijnwerk en breeklijnen",
        samenvatting:
          "Breeklijnen bepalen waar het oppervlak van richting verandert. Zonder correcte breeklijnen snijdt het driehoekennet door boordstenen en taludkanten heen. Waarom lijnwerk zo belangrijk is, voor het model én voor de machinist.",
        secties: [
          {
            kop: "Wat is een breeklijn?",
            tekst: [
              "Een breeklijn is een 3D-lijn langs een plaats waar de helling van het oppervlak abrupt verandert: de rand van een rijweg, de voet of kruin van een talud, de bodem van een gracht, de bovenkant van een boordsteen.",
              "Bij het opbouwen van een TIN worden de driehoeken gevormd tussen de beschikbare punten. Zonder breeklijnen kiest de software zelf welke punten met elkaar verbonden worden, en dat kan dwars over een kant heen gaan. Met een breeklijn worden de driehoekzijden gedwongen om langs die lijn te lopen, zodat de knik in het terrein op de juiste plaats komt.",
            ],
          },
          {
            kop: "Typisch lijnwerk in een ontwerp",
            tekst: [
              "In een weg- of rioleringsproject komen steeds dezelfde soorten lijnen terug. Elk van die lijnen heeft een functie in het model of op het scherm van de machine:",
            ],
            lijst: [
              "as of hartlijn: referentie voor kilometrering, dwarsprofielen en zijdelingse afstand;",
              "kantlijnen van verharding en fundering;",
              "boordstenen en goten, liefst met hun eigen hoogte;",
              "taludvoet en taludkruin;",
              "grachtbodem en -kanten;",
              "aansluitingslijn met het bestaande terrein (daglijn).",
            ],
          },
          {
            kop: "Waarom het lijnwerk de kwaliteit bepaalt",
            tekst: [
              "Een model zonder of met onvolledige breeklijnen kan er van op afstand goed uitzien, maar in detail fouten bevatten: een rijbaan die tussen twee profielen licht doorbuigt, een talud dat te vroeg afvlakt, een gracht die ondieper wordt waar ze dat niet hoort te doen.",
              "Een veelvoorkomende oorzaak is lijnwerk dat enkel in 2D getekend is. Een lijn zonder hoogte, of met hoogte nul, trekt het oppervlak naar beneden of wordt genegeerd. Bij het modelleren wordt daarom elke relevante lijn op de juiste hoogte gebracht, vanuit de profielen, de peilen op het plan of de aansluitende oppervlakken.",
              "Ook lijnen die elkaar kruisen met verschillende hoogtes zijn een aandachtspunt. Twee breeklijnen die op hetzelfde punt een andere hoogte opgeven, leveren een tegenstrijdigheid op die eerst moet worden opgelost.",
            ],
          },
          {
            kop: "Lijnwerk voor de machinist",
            tekst: [
              "Naast de rol in het model heeft lijnwerk een praktische functie in de cabine. De machinist ziet zijn positie ten opzichte van de as, de kant van de verharding of de rand van de bouwput. Veel systemen kunnen ook op een lijn sturen, bijvoorbeeld om een gracht langs een vaste lijn te graven of de zijdelingse positie aan te houden.",
              "Overzichtelijk lijnwerk, logisch verdeeld over lagen met duidelijke namen, maakt het werk in de machine eenvoudiger. Te veel detail (tekstlabels, arceringen, maatlijnen) maakt het scherm onleesbaar en wordt daarom weggelaten.",
            ],
          },
        ],
      },
      fr: {
        titel: "Lignes et lignes de rupture",
        samenvatting:
          "Les lignes de rupture indiquent où la surface change de pente. Sans lignes de rupture correctes, le réseau de triangles traverse les bordures et les arêtes de talus. Pourquoi les lignes sont essentielles, pour le modèle comme pour le conducteur.",
        secties: [
          {
            kop: "Qu’est-ce qu’une ligne de rupture ?",
            tekst: [
              "Une ligne de rupture est une ligne 3D le long d’un endroit où la pente de la surface change brusquement : le bord d’une chaussée, le pied ou la crête d’un talus, le fond d’un fossé, le dessus d’une bordure.",
              "Lors de la construction d’un TIN, les triangles sont formés entre les points disponibles. Sans lignes de rupture, le logiciel choisit lui-même quels points relier, ce qui peut traverser une arête. Avec une ligne de rupture, les côtés des triangles sont contraints de suivre cette ligne, de sorte que la cassure du terrain se trouve au bon endroit.",
            ],
          },
          {
            kop: "Lignes typiques d’un projet",
            tekst: [
              "Dans un projet de voirie ou d’égouttage, on retrouve toujours les mêmes types de lignes. Chacune a un rôle dans le modèle ou sur l’écran de la machine :",
            ],
            lijst: [
              "axe : référence pour le PK, les profils en travers et le déport latéral ;",
              "bords du revêtement et de la fondation ;",
              "bordures et filets d’eau, de préférence avec leur propre altitude ;",
              "pied et crête de talus ;",
              "fond et bords de fossé ;",
              "ligne de raccordement avec le terrain existant (entrée en terre).",
            ],
          },
          {
            kop: "Pourquoi les lignes font la qualité",
            tekst: [
              "Un modèle sans lignes de rupture, ou avec des lignes incomplètes, peut sembler correct de loin mais contenir des erreurs en détail : une chaussée qui fléchit légèrement entre deux profils, un talus qui s’aplatit trop tôt, un fossé qui remonte là où il ne devrait pas.",
              "Une cause fréquente est un dessin réalisé uniquement en 2D. Une ligne sans altitude, ou à altitude zéro, tire la surface vers le bas ou est ignorée. Lors de la modélisation, chaque ligne utile est donc placée à la bonne altitude, à partir des profils, des cotes du plan ou des surfaces adjacentes.",
              "Les lignes qui se croisent avec des altitudes différentes demandent aussi de l’attention. Deux lignes de rupture qui imposent une altitude différente au même point créent une contradiction qu’il faut d’abord résoudre.",
            ],
          },
          {
            kop: "Les lignes pour le conducteur",
            tekst: [
              "En plus de leur rôle dans le modèle, les lignes ont une fonction pratique en cabine. Le conducteur voit sa position par rapport à l’axe, au bord du revêtement ou au bord de la fouille. De nombreux systèmes peuvent aussi se guider sur une ligne, par exemple pour creuser un fossé le long d’un tracé fixe ou tenir un déport latéral.",
              "Des lignes claires, réparties logiquement en calques aux noms explicites, simplifient le travail en machine. Trop de détails (textes, hachures, cotations) rendent l’écran illisible et sont donc retirés.",
            ],
          },
        ],
      },
      en: {
        titel: "Linework and breaklines",
        samenvatting:
          "Breaklines define where the surface changes direction. Without correct breaklines, the triangle mesh cuts straight through kerbs and slope edges. Why linework matters so much, both for the model and for the operator.",
        secties: [
          {
            kop: "What is a breakline?",
            tekst: [
              "A breakline is a 3D line along a place where the slope of the surface changes abruptly: the edge of a carriageway, the toe or top of a slope, the invert of a ditch, the top of a kerb.",
              "When a TIN is built, triangles are formed between the available points. Without breaklines, the software decides on its own which points to connect, and that may run straight across an edge. A breakline forces the triangle edges to follow that line, so the change in grade ends up in exactly the right place.",
            ],
          },
          {
            kop: "Typical linework in a design",
            tekst: [
              "Road and drainage projects keep using the same kinds of lines. Each of them has a role in the model or on the machine display:",
            ],
            lijst: [
              "centreline: reference for chainage, cross sections and offset;",
              "edges of surfacing and sub-base;",
              "kerbs and channels, ideally with their own levels;",
              "toe and top of slope;",
              "ditch invert and ditch edges;",
              "tie-in line with the existing ground (daylight line).",
            ],
          },
          {
            kop: "Why linework determines quality",
            tekst: [
              "A model without breaklines, or with incomplete ones, can look fine from a distance and still contain errors in detail: a carriageway that sags slightly between two sections, a slope that flattens too early, a ditch that rises where it should not.",
              "A common cause is linework drawn in 2D only. A line without a level, or at level zero, pulls the surface down or is ignored. During modelling, every relevant line is therefore brought to the correct level, from the sections, the spot levels on the plan or the adjoining surfaces.",
              "Crossing lines with different levels also need attention. Two breaklines that assign a different level to the same point create a conflict that has to be resolved first.",
            ],
          },
          {
            kop: "Linework for the operator",
            tekst: [
              "Besides its role in the model, linework has a practical function in the cab. The operator sees their position relative to the centreline, the edge of the surfacing or the edge of the excavation. Many systems can also guide to a line, for instance to dig a ditch along a fixed alignment or hold a given offset.",
              "Clear linework, logically split into well-named layers, makes work in the machine easier. Too much detail (text labels, hatching, dimensions) clutters the display and is therefore left out.",
            ],
          },
        ],
      },
      de: {
        titel: "Linien und Bruchkanten",
        samenvatting:
          "Bruchkanten legen fest, wo die Oberfläche ihre Neigung ändert. Ohne korrekte Bruchkanten schneidet das Dreiecksnetz quer durch Bordsteine und Böschungskanten. Warum Linien so wichtig sind, für das Modell ebenso wie für den Maschinenführer.",
        secties: [
          {
            kop: "Was ist eine Bruchkante?",
            tekst: [
              "Eine Bruchkante ist eine 3D-Linie entlang einer Stelle, an der sich die Neigung der Oberfläche abrupt ändert: der Rand einer Fahrbahn, der Fuß oder die Oberkante einer Böschung, die Sohle eines Grabens, die Oberkante eines Bordsteins.",
              "Beim Aufbau eines TIN werden die Dreiecke zwischen den vorhandenen Punkten gebildet. Ohne Bruchkanten entscheidet die Software selbst, welche Punkte miteinander verbunden werden, und das kann quer über eine Kante hinweg geschehen. Eine Bruchkante zwingt die Dreiecksseiten, dieser Linie zu folgen, sodass der Knick im Gelände genau an der richtigen Stelle liegt.",
            ],
          },
          {
            kop: "Typische Linien in einer Planung",
            tekst: [
              "In Straßen- und Kanalbauprojekten kehren immer dieselben Arten von Linien wieder. Jede davon hat eine Funktion im Modell oder auf dem Display der Maschine:",
            ],
            lijst: [
              "Achse: Bezug für Stationierung, Querprofile und seitlichen Abstand;",
              "Kanten von Befestigung und Tragschicht;",
              "Bordsteine und Rinnen, möglichst mit eigener Höhe;",
              "Böschungsfuß und Böschungsoberkante;",
              "Grabensohle und Grabenkanten;",
              "Anschlusslinie an das bestehende Gelände (Durchstoßlinie).",
            ],
          },
          {
            kop: "Warum die Linien die Qualität bestimmen",
            tekst: [
              "Ein Modell ohne oder mit unvollständigen Bruchkanten kann aus der Ferne gut aussehen und im Detail dennoch Fehler enthalten: eine Fahrbahn, die zwischen zwei Profilen leicht durchhängt, eine Böschung, die zu früh flacher wird, ein Graben, der dort ansteigt, wo er es nicht sollte.",
              "Eine häufige Ursache sind Linien, die nur in 2D gezeichnet sind. Eine Linie ohne Höhe oder mit Höhe null zieht die Oberfläche nach unten oder wird ignoriert. Bei der Modellierung wird deshalb jede relevante Linie auf die richtige Höhe gebracht, aus den Profilen, den Höhenkoten im Plan oder den angrenzenden Oberflächen.",
              "Auch sich kreuzende Linien mit unterschiedlichen Höhen verdienen Aufmerksamkeit. Zwei Bruchkanten, die demselben Punkt verschiedene Höhen zuweisen, erzeugen einen Widerspruch, der zuerst gelöst werden muss.",
            ],
          },
          {
            kop: "Linien für den Maschinenführer",
            tekst: [
              "Neben ihrer Rolle im Modell haben Linien eine praktische Funktion in der Kabine. Der Maschinenführer sieht seine Position relativ zur Achse, zum Rand der Befestigung oder zum Rand der Baugrube. Viele Systeme können auch an einer Linie entlang steuern, etwa um einen Graben entlang einer festen Trasse auszuheben oder einen seitlichen Abstand einzuhalten.",
              "Übersichtliche Linien, sinnvoll auf klar benannte Layer verteilt, erleichtern die Arbeit in der Maschine. Zu viele Details (Beschriftungen, Schraffuren, Bemaßungen) machen das Display unlesbar und werden daher weggelassen.",
            ],
          },
        ],
      },
      es: {
        titel: "Líneas y líneas de ruptura",
        samenvatting:
          "Las líneas de ruptura definen dónde cambia la pendiente de la superficie. Sin líneas de ruptura correctas, la red de triángulos atraviesa bordillos y aristas de talud. Por qué las líneas son tan importantes, tanto para el modelo como para el operador.",
        secties: [
          {
            kop: "¿Qué es una línea de ruptura?",
            tekst: [
              "Una línea de ruptura es una línea 3D situada donde la pendiente de la superficie cambia bruscamente: el borde de una calzada, el pie o la coronación de un talud, el fondo de una cuneta, la parte superior de un bordillo.",
              "Al construir un TIN, los triángulos se forman entre los puntos disponibles. Sin líneas de ruptura, el software decide por sí mismo qué puntos unir, y eso puede cruzar una arista. Una línea de ruptura obliga a los lados de los triángulos a seguir esa línea, de modo que el quiebro del terreno queda exactamente en su sitio.",
            ],
          },
          {
            kop: "Líneas típicas en un diseño",
            tekst: [
              "En los proyectos de carreteras y saneamiento se repiten siempre los mismos tipos de líneas. Cada una tiene una función en el modelo o en la pantalla de la máquina:",
            ],
            lijst: [
              "eje: referencia para el PK, los perfiles transversales y el desplazamiento lateral;",
              "bordes del pavimento y de la base;",
              "bordillos y rigolas, a ser posible con su propia cota;",
              "pie y coronación de talud;",
              "fondo y bordes de cuneta;",
              "línea de enlace con el terreno existente (línea de intersección con el terreno).",
            ],
          },
          {
            kop: "Por qué las líneas determinan la calidad",
            tekst: [
              "Un modelo sin líneas de ruptura, o con líneas incompletas, puede parecer correcto de lejos y aun así contener errores en el detalle: una calzada que se hunde ligeramente entre dos perfiles, un talud que se suaviza demasiado pronto, una cuneta que sube donde no debería.",
              "Una causa frecuente son las líneas dibujadas solo en 2D. Una línea sin cota, o con cota cero, arrastra la superficie hacia abajo o se ignora. Por eso, durante el modelado, cada línea relevante se lleva a su cota correcta a partir de los perfiles, las cotas del plano o las superficies colindantes.",
              "Las líneas que se cruzan con cotas distintas también requieren atención. Dos líneas de ruptura que asignan una cota diferente al mismo punto generan una contradicción que debe resolverse primero.",
            ],
          },
          {
            kop: "Líneas para el operador",
            tekst: [
              "Además de su papel en el modelo, las líneas tienen una función práctica en la cabina. El operador ve su posición respecto al eje, al borde del pavimento o al borde de la excavación. Muchos sistemas también pueden guiarse por una línea, por ejemplo para excavar una cuneta a lo largo de un trazado fijo o mantener un desplazamiento lateral.",
              "Unas líneas claras, repartidas con lógica en capas con nombres explícitos, facilitan el trabajo en la máquina. Demasiado detalle (textos, sombreados, cotas de dimensión) vuelve ilegible la pantalla y por eso se elimina.",
            ],
          },
        ],
      },
    },
  },

  // ── 3. Coördinatenstelsels ───────────────────────────────────────────────
  {
    slug: "coordinatenstelsels",
    icoon: "Globe2",
    beeld: "/3d/trace-luchtfoto.jpg",
    i18n: {
      nl: {
        titel: "Coördinatenstelsels en hoogtereferenties",
        samenvatting:
          "Een model is pas bruikbaar als het in hetzelfde stelsel staat als de machine. Welke stelsels en hoogtereferenties per land gangbaar zijn, wat een lokale kalibratie doet en wat er gebeurt bij een verkeerde keuze.",
        secties: [
          {
            kop: "Twee referenties: ligging en hoogte",
            tekst: [
              "Elke coördinaat in een model bestaat uit een ligging (X en Y, of oost en noord) en een hoogte (Z). Voor beide is een referentie nodig. De ligging staat in een coördinatenstelsel met een eigen projectie; de hoogte wordt gemeten ten opzichte van een nationaal hoogtedatum, meestal gekoppeld aan een gemiddeld zeeniveau.",
              "GNSS-ontvangers meten van nature in een wereldwijd stelsel (ETRS89 in Europa) met een ellipsoïdische hoogte. De machinesturing rekent die metingen om naar het nationale stelsel en, via een geoïdemodel, naar de nationale hoogte. Het model moet in exact datzelfde stelsel staan.",
            ],
          },
          {
            kop: "Gangbare stelsels per land",
            tekst: [
              "Hieronder de stelsels die in de praktijk het vaakst op plannen voorkomen. Een project kan altijd in een ander of lokaal stelsel getekend zijn; daarom vragen we dit steeds na.",
            ],
            lijst: [
              "België: Belgian Lambert 72 of Lambert 2008, hoogte TAW/DNG (Oostende).",
              "Nederland: RD New (Amersfoort), hoogte NAP.",
              "Frankrijk: Lambert-93 of een van de conische zones CC42 tot CC50, hoogte NGF-IGN69.",
              "Duitsland: ETRS89 / UTM (zone 32 of 33), hoogte DHHN2016.",
              "Luxemburg: LUREF (Luxembourg TM), hoogte NG95.",
              "Verenigd Koninkrijk: OSGB36 / British National Grid, hoogte ODN (Newlyn).",
              "Zwitserland: CH1903+ / LV95, hoogte LN02.",
              "Andere Europese landen: vaak ETRS89 / UTM in de juiste zone, met EVRF2007 of een nationaal hoogtesysteem.",
            ],
          },
          {
            kop: "Lokale werfkalibratie",
            tekst: [
              "Op veel werven wordt niet rechtstreeks in het nationale stelsel gewerkt, maar met een lokale kalibratie (ook lokalisatie genoemd). Daarbij worden enkele gekende punten op de werf ingemeten en wordt een kleine verschuiving, rotatie en eventueel schaal berekend zodat de GNSS-metingen exact op die punten aansluiten.",
              "Een kalibratie compenseert onnauwkeurigheden in oude plannen of in de omzetting tussen stelsels, maar ze geldt enkel binnen het gebied van de gebruikte punten. Buiten dat gebied kunnen afwijkingen snel oplopen. Het opzetten en beheren van de kalibratie op de machine blijft de verantwoordelijkheid van de aannemer of diens landmeter; wij zorgen dat het model in het afgesproken stelsel staat.",
            ],
          },
          {
            kop: "Wat er misgaat bij een verkeerd stelsel",
            tekst: [
              "Een verkeerd stelsel geeft zelden een foutmelding. Het model wordt gewoon ingelezen, maar ligt op de verkeerde plaats of op de verkeerde hoogte. De gevolgen variëren:",
            ],
            lijst: [
              "Een volledig ander stelsel plaatst het model kilometers verder of zelfs in een ander land; de machine vindt het niet terug.",
              "Twee verwante stelsels (bijvoorbeeld twee versies van een nationaal stelsel) geven een verschuiving van enkele centimeters tot honderden meters.",
              "Een verkeerde hoogtereferentie of ontbrekend geoïdemodel geeft een hoogtefout van centimeters tot meer dan een meter, die op het scherm niet opvalt.",
              "Daarom: controleer voor de start altijd op een gekend punt, zowel in ligging als in hoogte.",
            ],
          },
        ],
      },
      fr: {
        titel: "Systèmes de coordonnées et références altimétriques",
        samenvatting:
          "Un modèle n’est utilisable que s’il est dans le même système que la machine. Les systèmes et références d’altitude courants par pays, le rôle d’une calibration locale et ce qui se passe en cas de mauvais choix.",
        secties: [
          {
            kop: "Deux références : position et altitude",
            tekst: [
              "Chaque coordonnée d’un modèle se compose d’une position (X et Y, ou est et nord) et d’une altitude (Z). Il faut une référence pour chacune. La position s’exprime dans un système de coordonnées avec sa propre projection ; l’altitude est mesurée par rapport à un système altimétrique national, généralement lié à un niveau moyen de la mer.",
              "Les récepteurs GNSS mesurent d’abord dans un système mondial (ETRS89 en Europe) avec une hauteur ellipsoïdale. Le système de guidage convertit ces mesures vers le système national et, via un modèle de géoïde, vers l’altitude nationale. Le modèle doit se trouver exactement dans ce même système.",
            ],
          },
          {
            kop: "Systèmes courants par pays",
            tekst: [
              "Voici les systèmes que l’on rencontre le plus souvent sur les plans. Un projet peut toujours être dessiné dans un autre système ou un système local ; c’est pourquoi nous le vérifions systématiquement.",
            ],
            lijst: [
              "Belgique : Lambert belge 72 ou Lambert 2008, altitude DNG/TAW (Ostende).",
              "Pays-Bas : RD New (Amersfoort), altitude NAP.",
              "France : Lambert-93 ou l’une des zones coniques CC42 à CC50, altitude NGF-IGN69.",
              "Allemagne : ETRS89 / UTM (zone 32 ou 33), altitude DHHN2016.",
              "Luxembourg : LUREF (Luxembourg TM), altitude NG95.",
              "Royaume-Uni : OSGB36 / British National Grid, altitude ODN (Newlyn).",
              "Suisse : CH1903+ / MN95 (LV95), altitude NF02 (LN02).",
              "Autres pays européens : souvent ETRS89 / UTM dans la bonne zone, avec EVRF2007 ou un système altimétrique national.",
            ],
          },
          {
            kop: "Calibration locale du chantier",
            tekst: [
              "Sur de nombreux chantiers, on ne travaille pas directement dans le système national, mais avec une calibration locale (aussi appelée localisation). Quelques points connus sont mesurés sur place, puis une petite translation, une rotation et éventuellement un facteur d’échelle sont calculés pour que les mesures GNSS correspondent exactement à ces points.",
              "Une calibration compense les imprécisions de plans anciens ou de la transformation entre systèmes, mais elle ne vaut qu’à l’intérieur de la zone couverte par les points utilisés. En dehors, les écarts peuvent augmenter rapidement. La mise en place et la gestion de la calibration sur la machine restent de la responsabilité de l’entreprise ou de son géomètre ; nous veillons à ce que le modèle soit dans le système convenu.",
            ],
          },
          {
            kop: "Ce qui se passe avec un mauvais système",
            tekst: [
              "Un mauvais système provoque rarement un message d’erreur. Le modèle est chargé normalement, mais il se trouve au mauvais endroit ou à la mauvaise altitude. Les conséquences varient :",
            ],
            lijst: [
              "Un système complètement différent place le modèle à des kilomètres, voire dans un autre pays ; la machine ne le retrouve pas.",
              "Deux systèmes apparentés (par exemple deux versions d’un système national) donnent un décalage de quelques centimètres à plusieurs centaines de mètres.",
              "Une mauvaise référence altimétrique ou un modèle de géoïde manquant donne une erreur d’altitude de quelques centimètres à plus d’un mètre, invisible à l’écran.",
              "D’où la règle : contrôlez toujours sur un point connu avant de commencer, en position comme en altitude.",
            ],
          },
        ],
      },
      en: {
        titel: "Coordinate reference systems and height datums",
        samenvatting:
          "A model is only usable when it is in the same system as the machine. The coordinate systems and height datums commonly used in each country, what a local site calibration does and what happens when the wrong system is chosen.",
        secties: [
          {
            kop: "Two references: position and height",
            tekst: [
              "Every coordinate in a model consists of a position (X and Y, or easting and northing) and a height (Z). Each needs a reference. The position is expressed in a coordinate reference system with its own projection; the height is measured against a national height datum, usually tied to a mean sea level.",
              "GNSS receivers natively measure in a global frame (ETRS89 in Europe) with an ellipsoidal height. The machine control system converts those measurements to the national grid and, through a geoid model, to the national height datum. The model must be in exactly that same system.",
            ],
          },
          {
            kop: "Common systems by country",
            tekst: [
              "Below are the systems most often found on drawings. A project may always be drawn in another or a local system, which is why we always check.",
            ],
            lijst: [
              "Belgium: Belgian Lambert 72 or Lambert 2008, height TAW/DNG (Ostend).",
              "Netherlands: RD New (Amersfoort), height NAP.",
              "France: Lambert-93 or one of the conic zones CC42 to CC50, height NGF-IGN69.",
              "Germany: ETRS89 / UTM (zone 32 or 33), height DHHN2016.",
              "Luxembourg: LUREF (Luxembourg TM), height NG95.",
              "United Kingdom: OSGB36 / British National Grid, height ODN (Newlyn).",
              "Switzerland: CH1903+ / LV95, height LN02.",
              "Other European countries: often ETRS89 / UTM in the correct zone, with EVRF2007 or a national height system.",
            ],
          },
          {
            kop: "Local site calibration",
            tekst: [
              "On many sites work is not done directly in the national grid but with a local site calibration (also called localisation). A few known control points on site are observed, and a small shift, rotation and possibly scale are computed so that the GNSS measurements fit those points exactly.",
              "A calibration compensates for inaccuracies in older drawings or in transformations between systems, but it is only valid within the area enclosed by the points used. Outside that area, deviations can grow quickly. Setting up and maintaining the calibration on the machine remains the responsibility of the contractor or their surveyor; we make sure the model is in the agreed system.",
            ],
          },
          {
            kop: "What happens with the wrong system",
            tekst: [
              "A wrong system rarely produces an error message. The model loads normally but sits in the wrong place or at the wrong height. The consequences vary:",
            ],
            lijst: [
              "A completely different system places the model kilometres away or even in another country; the machine cannot find it.",
              "Two related systems (for example two versions of a national grid) cause a shift of a few centimetres up to several hundred metres.",
              "A wrong height datum or missing geoid model causes a height error from centimetres to more than a metre, which does not stand out on the display.",
              "Hence the rule: always check on a known point before starting, both in position and in height.",
            ],
          },
        ],
      },
      de: {
        titel: "Koordinatenreferenzsysteme und Höhenbezug",
        samenvatting:
          "Ein Modell ist erst nutzbar, wenn es im selben System liegt wie die Maschine. Welche Koordinatensysteme und Höhenbezüge in den einzelnen Ländern üblich sind, was eine Baustellenkalibrierung bewirkt und was bei einer falschen Wahl passiert.",
        secties: [
          {
            kop: "Zwei Bezüge: Lage und Höhe",
            tekst: [
              "Jede Koordinate in einem Modell besteht aus einer Lage (X und Y, bzw. Rechts- und Hochwert) und einer Höhe (Z). Für beide ist ein Bezug erforderlich. Die Lage wird in einem Koordinatenreferenzsystem mit eigener Projektion angegeben; die Höhe bezieht sich auf ein nationales Höhensystem, das meist an einen mittleren Meeresspiegel gebunden ist.",
              "GNSS-Empfänger messen von Haus aus in einem globalen Bezugssystem (in Europa ETRS89) mit ellipsoidischer Höhe. Die Maschinensteuerung rechnet diese Messungen in das nationale System und über ein Geoidmodell in die nationale Höhe um. Das Modell muss in genau demselben System vorliegen.",
            ],
          },
          {
            kop: "Übliche Systeme nach Land",
            tekst: [
              "Nachfolgend die Systeme, die in der Praxis am häufigsten auf Plänen vorkommen. Ein Projekt kann jederzeit in einem anderen oder lokalen System gezeichnet sein; deshalb fragen wir dies stets nach.",
            ],
            lijst: [
              "Belgien: Belgian Lambert 72 oder Lambert 2008, Höhe TAW/DNG (Ostende).",
              "Niederlande: RD New (Amersfoort), Höhe NAP.",
              "Frankreich: Lambert-93 oder eine der Kegelzonen CC42 bis CC50, Höhe NGF-IGN69.",
              "Deutschland: ETRS89 / UTM (Zone 32 oder 33), Höhe DHHN2016.",
              "Luxemburg: LUREF (Luxembourg TM), Höhe NG95.",
              "Vereinigtes Königreich: OSGB36 / British National Grid, Höhe ODN (Newlyn).",
              "Schweiz: CH1903+ / LV95, Höhe LN02.",
              "Andere europäische Länder: häufig ETRS89 / UTM in der passenden Zone, mit EVRF2007 oder einem nationalen Höhensystem.",
            ],
          },
          {
            kop: "Lokale Baustellenkalibrierung",
            tekst: [
              "Auf vielen Baustellen wird nicht direkt im nationalen System gearbeitet, sondern mit einer lokalen Baustellenkalibrierung (auch Lokalisierung genannt). Dabei werden einige bekannte Punkte auf der Baustelle eingemessen, und es werden eine kleine Verschiebung, eine Drehung und gegebenenfalls ein Maßstab berechnet, damit die GNSS-Messungen exakt zu diesen Punkten passen.",
              "Eine Kalibrierung gleicht Ungenauigkeiten in älteren Plänen oder in der Transformation zwischen Systemen aus, gilt aber nur innerhalb des Bereichs der verwendeten Punkte. Außerhalb davon können Abweichungen schnell anwachsen. Einrichtung und Pflege der Kalibrierung auf der Maschine bleiben in der Verantwortung des Bauunternehmens oder seines Vermessers; wir sorgen dafür, dass das Modell im vereinbarten System vorliegt.",
            ],
          },
          {
            kop: "Was bei einem falschen System passiert",
            tekst: [
              "Ein falsches System führt selten zu einer Fehlermeldung. Das Modell wird ganz normal eingelesen, liegt aber an der falschen Stelle oder auf der falschen Höhe. Die Folgen sind unterschiedlich:",
            ],
            lijst: [
              "Ein völlig anderes System platziert das Modell Kilometer entfernt oder sogar in einem anderen Land; die Maschine findet es nicht.",
              "Zwei verwandte Systeme (zum Beispiel zwei Versionen eines nationalen Systems) führen zu einer Verschiebung von einigen Zentimetern bis zu mehreren hundert Metern.",
              "Ein falscher Höhenbezug oder ein fehlendes Geoidmodell verursacht einen Höhenfehler von einigen Zentimetern bis über einen Meter, der auf dem Display nicht auffällt.",
              "Daher gilt: Prüfen Sie vor dem Start immer an einem bekannten Punkt, sowohl in der Lage als auch in der Höhe.",
            ],
          },
        ],
      },
      es: {
        titel: "Sistemas de referencia de coordenadas y referencias altimétricas",
        samenvatting:
          "Un modelo solo es utilizable si está en el mismo sistema que la máquina. Qué sistemas y referencias altimétricas son habituales en cada país, qué hace una calibración de obra y qué ocurre cuando se elige el sistema equivocado.",
        secties: [
          {
            kop: "Dos referencias: posición y altura",
            tekst: [
              "Cada coordenada de un modelo consta de una posición (X e Y, o este y norte) y una altura (Z). Cada una necesita una referencia. La posición se expresa en un sistema de referencia de coordenadas con su propia proyección; la altura se mide respecto a una referencia altimétrica nacional, normalmente vinculada a un nivel medio del mar.",
              "Los receptores GNSS miden de forma nativa en un marco global (ETRS89 en Europa) con altura elipsoidal. El sistema de control de maquinaria convierte esas mediciones al sistema nacional y, mediante un modelo de geoide, a la altura nacional. El modelo debe estar exactamente en ese mismo sistema.",
            ],
          },
          {
            kop: "Sistemas habituales por país",
            tekst: [
              "A continuación, los sistemas que aparecen con más frecuencia en los planos. Un proyecto siempre puede estar dibujado en otro sistema o en un sistema local; por eso lo comprobamos siempre.",
            ],
            lijst: [
              "Bélgica: Belgian Lambert 72 o Lambert 2008, altura TAW/DNG (Ostende).",
              "Países Bajos: RD New (Amersfoort), altura NAP.",
              "Francia: Lambert-93 o una de las zonas cónicas CC42 a CC50, altura NGF-IGN69.",
              "Alemania: ETRS89 / UTM (huso 32 o 33), altura DHHN2016.",
              "Luxemburgo: LUREF (Luxembourg TM), altura NG95.",
              "Reino Unido: OSGB36 / British National Grid, altura ODN (Newlyn).",
              "Suiza: CH1903+ / LV95, altura LN02.",
              "Otros países europeos: a menudo ETRS89 / UTM en el huso correspondiente, con EVRF2007 o un sistema altimétrico nacional.",
            ],
          },
          {
            kop: "Calibración local de obra",
            tekst: [
              "En muchas obras no se trabaja directamente en el sistema nacional, sino con una calibración de obra local (también llamada localización). Se miden algunos puntos conocidos en la obra y se calculan una pequeña traslación, una rotación y, en su caso, un factor de escala para que las mediciones GNSS coincidan exactamente con esos puntos.",
              "Una calibración compensa imprecisiones de planos antiguos o de la transformación entre sistemas, pero solo es válida dentro de la zona delimitada por los puntos utilizados. Fuera de ella, las desviaciones pueden crecer rápidamente. La configuración y el mantenimiento de la calibración en la máquina siguen siendo responsabilidad del contratista o de su topógrafo; nosotros nos aseguramos de que el modelo esté en el sistema acordado.",
            ],
          },
          {
            kop: "Qué ocurre con un sistema equivocado",
            tekst: [
              "Un sistema equivocado rara vez provoca un mensaje de error. El modelo se carga con normalidad, pero queda en el lugar equivocado o a la altura equivocada. Las consecuencias varían:",
            ],
            lijst: [
              "Un sistema completamente distinto sitúa el modelo a kilómetros de distancia, o incluso en otro país; la máquina no lo encuentra.",
              "Dos sistemas relacionados (por ejemplo, dos versiones de un sistema nacional) producen un desplazamiento de unos centímetros a varios cientos de metros.",
              "Una referencia altimétrica errónea o la falta de un modelo de geoide producen un error de altura de centímetros a más de un metro, que no llama la atención en la pantalla.",
              "De ahí la regla: compruebe siempre en un punto conocido antes de empezar, tanto en posición como en altura.",
            ],
          },
        ],
      },
    },
  },

  // ── 4. Bestanden per merk ────────────────────────────────────────────────
  {
    slug: "bestanden-per-merk",
    icoon: "FileStack",
    i18n: {
      nl: {
        titel: "Bestanden per merk en systeem",
        samenvatting:
          "Elk machinesturingssysteem leest zijn eigen bestanden. Hoe we met de verschillende merken omgaan, welke uitwisselingsformaten breed aanvaard zijn en waarom u het bestand altijd zelf op uw systeem controleert.",
        secties: [
          {
            kop: "Elk systeem zijn eigen formaat",
            tekst: [
              "Op Europese werven komen verschillende merken van machinesturing voor, waaronder Trimble, Topcon, Leica, Unicontrol en CHCNAV, en daarnaast systemen die af fabriek door machinebouwers als Komatsu en Caterpillar worden ingebouwd of ondersteund.",
              "Elk van die systemen gebruikt zijn eigen software en leest zijn eigen projectbestanden. Ook binnen één merk kunnen verschillende generaties of softwareversies andere eisen stellen aan de manier waarop een project moet worden aangeleverd: welke bestanden samen horen, hoe ze genoemd worden en waar ze op het opslagmedium moeten staan.",
              "Daarom vragen we bij elke opdracht welk systeem en welke softwareversie op de machine draaien. Zo wordt het model aangeleverd in de vorm die dat systeem verwacht.",
            ],
          },
          {
            kop: "Uitwisselingsformaten",
            tekst: [
              "Naast de eigen formaten van de fabrikanten bestaan er open uitwisselingsformaten die door de meeste systemen en kantoorsoftware worden gelezen:",
            ],
            lijst: [
              "LandXML: een open standaard die oppervlakken (TIN), lijnwerk, assen en punten met hun coördinaten kan bevatten. Veel machinesturingssoftware kan LandXML rechtstreeks inlezen of omzetten.",
              "DXF: het gangbare CAD-uitwisselingsformaat, vooral nuttig voor lijnwerk en 3D-lijnen, en als achtergrondtekening.",
              "Een TIN-oppervlak in een neutraal formaat, voor wie het model in eigen software verder wil bewerken.",
            ],
          },
          {
            kop: "Meerdere systemen tegelijk",
            tekst: [
              "Werkt u met machines van verschillende merken op dezelfde werf, of huurt u een machine in met een ander systeem? Dan wordt hetzelfde model voor elk systeem apart aangeleverd. Het onderliggende oppervlak en lijnwerk zijn identiek; enkel de verpakking verschilt.",
              "Dat voorkomt dat twee machines op dezelfde werf licht verschillende ontwerpen volgen. Geef bij de aanvraag alle systemen op die het model zullen gebruiken.",
            ],
          },
          {
            kop: "Controle op uw eigen systeem",
            tekst: [
              "Wij leveren een model dat overeenkomt met de aangeleverde plannen, in het afgesproken stelsel en in het formaat dat bij uw systeem hoort. De machinesturing zelf blijft echter uw verantwoordelijkheid: de installatie, de kalibratie van de machine, de werfkalibratie, de softwareversie en de instellingen.",
              "Laad het bestand daarom altijd in op uw eigen systeem en controleer het vóór de start van de werken:",
            ],
            lijst: [
              "wordt het project gevonden en geopend;",
              "ligt het model op de verwachte plaats ten opzichte van de machine;",
              "klopt de hoogte op een gekend punt;",
              "zijn de verwachte oppervlakken en lagen aanwezig.",
            ],
          },
        ],
      },
      fr: {
        titel: "Fichiers par marque et par système",
        samenvatting:
          "Chaque système de guidage lit ses propres fichiers. Comment nous travaillons avec les différentes marques, quels formats d’échange sont largement acceptés et pourquoi vous contrôlez toujours le fichier sur votre propre système.",
        secties: [
          {
            kop: "À chaque système son format",
            tekst: [
              "Sur les chantiers européens, on trouve plusieurs marques de guidage d’engins, dont Trimble, Topcon, Leica, Unicontrol et CHCNAV, ainsi que des systèmes intégrés ou pris en charge d’usine par des constructeurs comme Komatsu et Caterpillar.",
              "Chacun de ces systèmes utilise son propre logiciel et lit ses propres fichiers de projet. Au sein d’une même marque, différentes générations ou versions logicielles peuvent aussi avoir leurs exigences quant à la façon de livrer un projet : quels fichiers vont ensemble, comment ils sont nommés et où ils doivent se trouver sur le support.",
              "C’est pourquoi nous demandons pour chaque commande quel système et quelle version logicielle tournent sur la machine. Le modèle est ainsi livré sous la forme attendue par ce système.",
            ],
          },
          {
            kop: "Formats d’échange",
            tekst: [
              "À côté des formats propres aux fabricants, il existe des formats d’échange ouverts lus par la plupart des systèmes et des logiciels de bureau :",
            ],
            lijst: [
              "LandXML : une norme ouverte qui peut contenir des surfaces (TIN), des lignes, des axes et des points avec leurs coordonnées. De nombreux logiciels de guidage peuvent l’importer directement ou le convertir.",
              "DXF : le format d’échange CAO courant, surtout utile pour les lignes et polylignes 3D, et comme fond de plan.",
              "Une surface TIN dans un format neutre, pour ceux qui souhaitent retravailler le modèle dans leur propre logiciel.",
            ],
          },
          {
            kop: "Plusieurs systèmes à la fois",
            tekst: [
              "Vous travaillez avec des machines de marques différentes sur un même chantier, ou vous louez un engin équipé d’un autre système ? Le même modèle est alors livré séparément pour chaque système. La surface et les lignes sont identiques ; seul le conditionnement diffère.",
              "Cela évite que deux machines sur le même chantier suivent des projets légèrement différents. Indiquez dans votre demande tous les systèmes qui utiliseront le modèle.",
            ],
          },
          {
            kop: "Contrôle sur votre propre système",
            tekst: [
              "Nous livrons un modèle conforme aux plans fournis, dans le système convenu et au format adapté à votre système. Le système de guidage lui-même reste toutefois sous votre responsabilité : installation, calibration de la machine, calibration du chantier, version logicielle et réglages.",
              "Chargez donc toujours le fichier sur votre propre système et contrôlez-le avant le début des travaux :",
            ],
            lijst: [
              "le projet est-il trouvé et ouvert ;",
              "le modèle se trouve-t-il à l’endroit attendu par rapport à la machine ;",
              "l’altitude est-elle correcte sur un point connu ;",
              "les surfaces et calques attendus sont-ils présents.",
            ],
          },
        ],
      },
      en: {
        titel: "Files by brand and system",
        samenvatting:
          "Every machine control system reads its own files. How we handle the different brands, which exchange formats are widely accepted and why you always check the file on your own system.",
        secties: [
          {
            kop: "Each system its own format",
            tekst: [
              "European sites use several machine control brands, including Trimble, Topcon, Leica, Unicontrol and CHCNAV, as well as systems fitted or supported from the factory by manufacturers such as Komatsu and Caterpillar.",
              "Each of these systems uses its own software and reads its own project files. Even within one brand, different generations or software versions can have their own requirements for how a project is delivered: which files belong together, how they are named and where they must be placed on the storage medium.",
              "That is why for every order we ask which system and which software version run on the machine. The model is then delivered in the form that system expects.",
            ],
          },
          {
            kop: "Exchange formats",
            tekst: [
              "Besides the manufacturers’ own formats, there are open exchange formats that most systems and office software can read:",
            ],
            lijst: [
              "LandXML: an open standard that can hold surfaces (TIN), linework, alignments and points with their coordinates. Many machine control packages can import it directly or convert it.",
              "DXF: the common CAD exchange format, mainly useful for linework and 3D polylines, and as a background drawing.",
              "A TIN surface in a neutral format, for those who want to keep working on the model in their own software.",
            ],
          },
          {
            kop: "Several systems at once",
            tekst: [
              "Do you run machines of different brands on the same site, or hire in a machine with another system? Then the same model is delivered separately for each system. The underlying surface and linework are identical; only the packaging differs.",
              "This prevents two machines on the same site from working to slightly different designs. List every system that will use the model when you place your request.",
            ],
          },
          {
            kop: "Checking on your own system",
            tekst: [
              "We deliver a model that matches the drawings supplied, in the agreed coordinate system and in the format that belongs to your system. The machine control system itself, however, remains your responsibility: installation, machine calibration, site calibration, software version and settings.",
              "Always load the file on your own system and check it before work starts:",
            ],
            lijst: [
              "is the project found and does it open;",
              "is the model in the expected place relative to the machine;",
              "is the level correct on a known point;",
              "are the expected surfaces and layers present.",
            ],
          },
        ],
      },
      de: {
        titel: "Dateien nach Marke und System",
        samenvatting:
          "Jedes Maschinensteuerungssystem liest seine eigenen Dateien. Wie wir mit den verschiedenen Marken umgehen, welche Austauschformate breit akzeptiert sind und warum Sie die Datei immer selbst auf Ihrem System prüfen.",
        secties: [
          {
            kop: "Jedes System sein eigenes Format",
            tekst: [
              "Auf europäischen Baustellen sind verschiedene Marken von Maschinensteuerungen im Einsatz, darunter Trimble, Topcon, Leica, Unicontrol und CHCNAV, sowie Systeme, die von Maschinenherstellern wie Komatsu und Caterpillar ab Werk eingebaut oder unterstützt werden.",
              "Jedes dieser Systeme verwendet seine eigene Software und liest seine eigenen Projektdateien. Auch innerhalb einer Marke können verschiedene Generationen oder Softwareversionen eigene Anforderungen daran stellen, wie ein Projekt geliefert werden muss: welche Dateien zusammengehören, wie sie benannt sind und wo sie auf dem Speichermedium liegen müssen.",
              "Deshalb fragen wir bei jedem Auftrag nach, welches System und welche Softwareversion auf der Maschine laufen. So wird das Modell in der Form geliefert, die dieses System erwartet.",
            ],
          },
          {
            kop: "Austauschformate",
            tekst: [
              "Neben den herstellereigenen Formaten gibt es offene Austauschformate, die von den meisten Systemen und von Bürosoftware gelesen werden:",
            ],
            lijst: [
              "LandXML: ein offener Standard, der Oberflächen (TIN), Linien, Achsen und Punkte mit ihren Koordinaten enthalten kann. Viele Maschinensteuerungsprogramme können LandXML direkt einlesen oder umwandeln.",
              "DXF: das gängige CAD-Austauschformat, vor allem nützlich für Linien und 3D-Polylinien sowie als Hintergrundzeichnung.",
              "Eine TIN-Oberfläche in einem neutralen Format, für alle, die das Modell in ihrer eigenen Software weiterbearbeiten möchten.",
            ],
          },
          {
            kop: "Mehrere Systeme gleichzeitig",
            tekst: [
              "Arbeiten Sie auf derselben Baustelle mit Maschinen verschiedener Marken oder mieten Sie eine Maschine mit einem anderen System an? Dann wird dasselbe Modell für jedes System separat geliefert. Oberfläche und Linien sind identisch; nur die Verpackung unterscheidet sich.",
              "So wird verhindert, dass zwei Maschinen auf derselben Baustelle leicht unterschiedlichen Planungen folgen. Geben Sie bei der Anfrage alle Systeme an, die das Modell verwenden werden.",
            ],
          },
          {
            kop: "Prüfung auf Ihrem eigenen System",
            tekst: [
              "Wir liefern ein Modell, das den übermittelten Plänen entspricht, im vereinbarten Koordinatensystem und im passenden Format für Ihr System. Die Maschinensteuerung selbst bleibt jedoch in Ihrer Verantwortung: Installation, Kalibrierung der Maschine, Baustellenkalibrierung, Softwareversion und Einstellungen.",
              "Laden Sie die Datei daher immer auf Ihr eigenes System und prüfen Sie sie vor Beginn der Arbeiten:",
            ],
            lijst: [
              "Wird das Projekt gefunden und lässt es sich öffnen?",
              "Liegt das Modell an der erwarteten Stelle relativ zur Maschine?",
              "Stimmt die Höhe an einem bekannten Punkt?",
              "Sind die erwarteten Oberflächen und Layer vorhanden?",
            ],
          },
        ],
      },
      es: {
        titel: "Archivos por marca y sistema",
        samenvatting:
          "Cada sistema de control de maquinaria lee sus propios archivos. Cómo trabajamos con las distintas marcas, qué formatos de intercambio están ampliamente aceptados y por qué usted siempre debe comprobar el archivo en su propio sistema.",
        secties: [
          {
            kop: "Cada sistema, su propio formato",
            tekst: [
              "En las obras europeas se utilizan diversas marcas de control de maquinaria, entre ellas Trimble, Topcon, Leica, Unicontrol y CHCNAV, además de sistemas instalados o soportados de fábrica por fabricantes como Komatsu y Caterpillar.",
              "Cada uno de estos sistemas utiliza su propio software y lee sus propios archivos de proyecto. Incluso dentro de una misma marca, distintas generaciones o versiones de software pueden tener requisitos propios sobre cómo debe entregarse un proyecto: qué archivos van juntos, cómo se nombran y dónde deben ubicarse en el soporte de almacenamiento.",
              "Por eso, en cada encargo preguntamos qué sistema y qué versión de software funcionan en la máquina. Así el modelo se entrega en la forma que ese sistema espera.",
            ],
          },
          {
            kop: "Formatos de intercambio",
            tekst: [
              "Además de los formatos propios de los fabricantes, existen formatos de intercambio abiertos que la mayoría de los sistemas y del software de oficina pueden leer:",
            ],
            lijst: [
              "LandXML: un estándar abierto que puede contener superficies (TIN), líneas, ejes y puntos con sus coordenadas. Muchos programas de control de maquinaria pueden importarlo directamente o convertirlo.",
              "DXF: el formato de intercambio CAD habitual, útil sobre todo para líneas y polilíneas 3D, y como plano de fondo.",
              "Una superficie TIN en un formato neutro, para quien desee seguir trabajando el modelo en su propio software.",
            ],
          },
          {
            kop: "Varios sistemas a la vez",
            tekst: [
              "¿Trabaja con máquinas de distintas marcas en la misma obra, o alquila una máquina con otro sistema? En ese caso, el mismo modelo se entrega por separado para cada sistema. La superficie y las líneas son idénticas; solo cambia el formato de entrega.",
              "Así se evita que dos máquinas en la misma obra sigan diseños ligeramente distintos. Indique en su solicitud todos los sistemas que vayan a utilizar el modelo.",
            ],
          },
          {
            kop: "Comprobación en su propio sistema",
            tekst: [
              "Entregamos un modelo conforme a los planos facilitados, en el sistema de coordenadas acordado y en el formato correspondiente a su sistema. No obstante, el sistema de control de maquinaria sigue siendo responsabilidad suya: instalación, calibración de la máquina, calibración de obra, versión de software y configuración.",
              "Cargue siempre el archivo en su propio sistema y compruébelo antes de empezar los trabajos:",
            ],
            lijst: [
              "que el proyecto se encuentra y se abre correctamente;",
              "que el modelo está en el lugar esperado respecto a la máquina;",
              "que la cota es correcta en un punto conocido;",
              "que están presentes las superficies y capas previstas.",
            ],
          },
        ],
      },
    },
  },

  // ── 5. Wat aanleveren ────────────────────────────────────────────────────
  {
    slug: "wat-aanleveren",
    icoon: "ClipboardCheck",
    i18n: {
      nl: {
        titel: "Wat moet u aanleveren?",
        samenvatting:
          "Een goed model begint bij volledige plannen. Een overzicht van wat we nodig hebben, in welke vorm, en welke informatie vaak vergeten wordt.",
        secties: [
          {
            kop: "De plannen",
            tekst: [
              "Hoe vollediger het dossier, hoe sneller en nauwkeuriger het model. Stuur bij voorkeur alles wat de aannemer ook voor de uitvoering gebruikt:",
            ],
            lijst: [
              "inplantingsplan of grondplan met coördinaten;",
              "lengteprofielen van wegen, leidingen en grachten;",
              "dwarsprofielen of typedwarsprofielen met opbouw en hellingen;",
              "peilen: vloerpeilen, putdeksels, boordsteenhoogtes, afwerkingsniveaus;",
              "opmeting van het bestaande terrein, als die beschikbaar is;",
              "detailtekeningen van aansluitingen, opritten, kruispunten of bouwputten.",
            ],
          },
          {
            kop: "In welk formaat",
            tekst: [
              "Digitale CAD-bestanden (DWG of DXF) hebben de voorkeur. Daarin zitten de echte coördinaten en vaak al 3D-lijnen of hoogtepunten, wat het modelleren nauwkeuriger en sneller maakt.",
              "PDF is ook bruikbaar. Het plan wordt dan op schaal en op coördinaten gebracht aan de hand van gekende punten of het rooster op de tekening. Dat vraagt meer tijd en de nauwkeurigheid hangt af van de kwaliteit van het document. Een gescande papieren tekening is het minst nauwkeurig.",
              "Bestaat er een opmeting of model in LandXML, of een eerder ontwerp in een ander formaat? Stuur het mee; het kan als controle of als basis dienen.",
              "Stuur bij voorkeur de originele tekeningen zoals de ontwerper ze heeft opgemaakt, met de lagen intact. Bewerkte of afgeslankte versies verliezen soms net de informatie die voor het model nodig is.",
            ],
          },
          {
            kop: "Coördinatenstelsel en hoogtereferentie",
            tekst: [
              "Vermeld in welk coördinatenstelsel en welke hoogtereferentie het project getekend is, en in welk stelsel de machine werkt. Staat dit niet op het plan, dan stellen we op basis van het land en de ligging van de werf een gangbaar stelsel voor en vragen we bevestiging.",
              "Werkt de machine met een lokale werfkalibratie, geef dan ook de gebruikte controlepunten met hun coördinaten door. Zo kan worden nagegaan of het model en de kalibratie op elkaar aansluiten.",
            ],
          },
          {
            kop: "Praktische gegevens",
            tekst: ["Naast de plannen hebben we nog enkele gegevens nodig om de opdracht goed in te plannen:"],
            lijst: [
              "adres of ligging van de werf (gemeente, straat of coördinaten);",
              "merk, type en softwareversie van de machinesturing, per machine;",
              "welke lagen of fasen u als apart oppervlak wilt (bijvoorbeeld uitgraving, fundering, afwerking);",
              "de gewenste leverdatum;",
              "een contactpersoon die vragen over het ontwerp kan beantwoorden.",
            ],
          },
        ],
      },
      fr: {
        titel: "Que devez-vous fournir ?",
        samenvatting:
          "Un bon modèle commence par des plans complets. Un aperçu de ce dont nous avons besoin, sous quelle forme, et des informations souvent oubliées.",
        secties: [
          {
            kop: "Les plans",
            tekst: [
              "Plus le dossier est complet, plus le modèle est rapide et précis. Envoyez de préférence tout ce que l’entreprise utilise elle-même pour l’exécution :",
            ],
            lijst: [
              "plan d’implantation ou vue en plan avec coordonnées ;",
              "profils en long des voiries, conduites et fossés ;",
              "profils en travers ou profils types avec structure et pentes ;",
              "cotes : niveaux de plancher, tampons, hauteurs de bordure, niveaux finis ;",
              "levé du terrain existant, s’il est disponible ;",
              "plans de détail des raccords, accès, carrefours ou fouilles.",
            ],
          },
          {
            kop: "Sous quel format",
            tekst: [
              "Les fichiers CAO numériques (DWG ou DXF) sont préférables. Ils contiennent les coordonnées réelles et souvent déjà des lignes 3D ou des points cotés, ce qui rend la modélisation plus précise et plus rapide.",
              "Un PDF est également utilisable. Le plan est alors mis à l’échelle et calé en coordonnées à l’aide de points connus ou du quadrillage du dessin. Cela demande plus de temps et la précision dépend de la qualité du document. Un plan papier scanné est le moins précis.",
              "Vous disposez d’un levé ou d’un modèle en LandXML, ou d’un projet antérieur dans un autre format ? Joignez-le ; il peut servir de contrôle ou de base.",
              "Envoyez de préférence les plans originaux tels que le concepteur les a établis, avec leurs calques intacts. Les versions retravaillées ou allégées perdent parfois justement l’information nécessaire au modèle.",
            ],
          },
          {
            kop: "Système de coordonnées et altimétrie",
            tekst: [
              "Indiquez dans quel système de coordonnées et quelle référence altimétrique le projet est dessiné, et dans quel système la machine travaille. Si ce n’est pas indiqué sur le plan, nous proposons un système courant selon le pays et la localisation du chantier, et nous demandons confirmation.",
              "Si la machine utilise une calibration locale, transmettez aussi les points de contrôle utilisés avec leurs coordonnées. On peut ainsi vérifier que le modèle et la calibration concordent.",
            ],
          },
          {
            kop: "Données pratiques",
            tekst: ["En plus des plans, quelques informations nous permettent de bien planifier la commande :"],
            lijst: [
              "adresse ou localisation du chantier (commune, rue ou coordonnées) ;",
              "marque, type et version logicielle du système de guidage, par machine ;",
              "les couches ou phases que vous souhaitez en surfaces séparées (par exemple terrassement, fondation, finition) ;",
              "la date de livraison souhaitée ;",
              "une personne de contact capable de répondre aux questions sur le projet.",
            ],
          },
        ],
      },
      en: {
        titel: "What should you supply?",
        samenvatting:
          "A good model starts with complete drawings. An overview of what we need, in which form, and which information is often forgotten.",
        secties: [
          {
            kop: "The drawings",
            tekst: [
              "The more complete the package, the faster and more accurate the model. Ideally send everything the contractor uses for construction:",
            ],
            lijst: [
              "layout or general arrangement plan with coordinates;",
              "long sections of roads, pipes and ditches;",
              "cross sections or typical sections with build-up and crossfalls;",
              "levels: floor levels, manhole covers, kerb heights, finished levels;",
              "survey of the existing ground, if available;",
              "detail drawings of tie-ins, accesses, junctions or excavations.",
            ],
          },
          {
            kop: "In which format",
            tekst: [
              "Digital CAD files (DWG or DXF) are preferred. They contain the real coordinates and often 3D lines or spot levels already, which makes modelling more accurate and faster.",
              "PDF can also be used. The drawing is then scaled and placed on coordinates using known points or the grid on the sheet. This takes more time and the accuracy depends on the quality of the document. A scanned paper drawing is the least accurate.",
              "Do you have a survey or model in LandXML, or an earlier design in another format? Send it along; it can serve as a check or as a starting point.",
              "Ideally send the original drawings as the designer produced them, with their layers intact. Edited or stripped-down versions sometimes lose exactly the information the model needs.",
            ],
          },
          {
            kop: "Coordinate system and height datum",
            tekst: [
              "State which coordinate system and height datum the project is drawn in, and which system the machine works in. If this is not on the drawing, we propose a common system based on the country and location of the site and ask you to confirm.",
              "If the machine uses a local site calibration, also pass on the control points used, with their coordinates. That makes it possible to check that the model and the calibration agree.",
            ],
          },
          {
            kop: "Practical details",
            tekst: ["Besides the drawings, a few details help us plan the job properly:"],
            lijst: [
              "site address or location (town, street or coordinates);",
              "make, type and software version of the machine control system, per machine;",
              "which layers or stages you want as separate surfaces (for example excavation, sub-base, finished level);",
              "the required delivery date;",
              "a contact person who can answer questions about the design.",
            ],
          },
        ],
      },
      de: {
        titel: "Was sollten Sie liefern?",
        samenvatting:
          "Ein gutes Modell beginnt mit vollständigen Plänen. Ein Überblick darüber, was wir benötigen, in welcher Form und welche Angaben häufig vergessen werden.",
        secties: [
          {
            kop: "Die Pläne",
            tekst: [
              "Je vollständiger die Unterlagen, desto schneller und genauer das Modell. Senden Sie am besten alles, was auch das ausführende Unternehmen für die Bauausführung verwendet:",
            ],
            lijst: [
              "Absteckplan oder Lageplan mit Koordinaten;",
              "Längsschnitte von Straßen, Leitungen und Gräben;",
              "Querprofile oder Regelquerschnitte mit Aufbau und Neigungen;",
              "Höhenangaben: Fußbodenhöhen, Schachtdeckel, Bordsteinhöhen, Fertighöhen;",
              "Aufnahme des bestehenden Geländes, sofern vorhanden;",
              "Detailzeichnungen von Anschlüssen, Zufahrten, Kreuzungen oder Baugruben.",
            ],
          },
          {
            kop: "In welchem Format",
            tekst: [
              "Digitale CAD-Dateien (DWG oder DXF) werden bevorzugt. Sie enthalten die echten Koordinaten und oft bereits 3D-Linien oder Höhenpunkte, was die Modellierung genauer und schneller macht.",
              "Auch PDF ist verwendbar. Der Plan wird dann anhand bekannter Punkte oder des Koordinatengitters auf der Zeichnung maßstäblich und lagerichtig eingepasst. Das erfordert mehr Zeit, und die Genauigkeit hängt von der Qualität des Dokuments ab. Eine eingescannte Papierzeichnung ist am ungenauesten.",
              "Gibt es eine Aufnahme oder ein Modell in LandXML oder eine frühere Planung in einem anderen Format? Senden Sie diese mit; sie kann als Kontrolle oder als Grundlage dienen.",
              "Senden Sie möglichst die Originalzeichnungen, wie der Planer sie erstellt hat, mit intakten Layern. Bearbeitete oder reduzierte Fassungen verlieren mitunter gerade die Informationen, die für das Modell nötig sind.",
            ],
          },
          {
            kop: "Koordinatensystem und Höhenbezug",
            tekst: [
              "Geben Sie an, in welchem Koordinatensystem und mit welchem Höhenbezug das Projekt gezeichnet ist und in welchem System die Maschine arbeitet. Steht dies nicht auf dem Plan, schlagen wir anhand des Landes und der Lage der Baustelle ein gängiges System vor und bitten um Bestätigung.",
              "Arbeitet die Maschine mit einer lokalen Baustellenkalibrierung, teilen Sie uns bitte auch die verwendeten Passpunkte mit ihren Koordinaten mit. So lässt sich prüfen, ob Modell und Kalibrierung zueinander passen.",
            ],
          },
          {
            kop: "Praktische Angaben",
            tekst: ["Neben den Plänen benötigen wir noch einige Angaben, um den Auftrag gut einzuplanen:"],
            lijst: [
              "Adresse oder Lage der Baustelle (Gemeinde, Straße oder Koordinaten);",
              "Marke, Typ und Softwareversion der Maschinensteuerung, je Maschine;",
              "welche Schichten oder Phasen Sie als separate Oberfläche wünschen (zum Beispiel Aushub, Tragschicht, Fertighöhe);",
              "der gewünschte Liefertermin;",
              "eine Kontaktperson, die Fragen zur Planung beantworten kann.",
            ],
          },
        ],
      },
      es: {
        titel: "¿Qué debe facilitarnos?",
        samenvatting:
          "Un buen modelo empieza con planos completos. Un resumen de lo que necesitamos, en qué forma y qué información se olvida con frecuencia.",
        secties: [
          {
            kop: "Los planos",
            tekst: [
              "Cuanto más completa sea la documentación, más rápido y preciso será el modelo. Envíe preferiblemente todo lo que el contratista utiliza para la ejecución:",
            ],
            lijst: [
              "plano de replanteo o planta general con coordenadas;",
              "perfiles longitudinales de viales, conducciones y cunetas;",
              "perfiles transversales o secciones tipo con paquete de firme y pendientes;",
              "cotas: cotas de solera, tapas de pozo, alturas de bordillo, cotas terminadas;",
              "levantamiento del terreno existente, si se dispone de él;",
              "planos de detalle de enlaces, accesos, intersecciones o excavaciones.",
            ],
          },
          {
            kop: "En qué formato",
            tekst: [
              "Se prefieren archivos CAD digitales (DWG o DXF). Contienen las coordenadas reales y a menudo ya líneas 3D o puntos acotados, lo que hace el modelado más preciso y rápido.",
              "También se puede utilizar un PDF. En ese caso, el plano se escala y se sitúa en coordenadas a partir de puntos conocidos o de la cuadrícula del dibujo. Esto requiere más tiempo y la precisión depende de la calidad del documento. Un plano en papel escaneado es el menos preciso.",
              "¿Dispone de un levantamiento o un modelo en LandXML, o de un diseño anterior en otro formato? Envíelo también; puede servir de control o de base.",
              "Envíe preferiblemente los planos originales tal como los elaboró el proyectista, con sus capas intactas. Las versiones editadas o simplificadas a veces pierden precisamente la información que necesita el modelo.",
            ],
          },
          {
            kop: "Sistema de coordenadas y referencia altimétrica",
            tekst: [
              "Indique en qué sistema de coordenadas y con qué referencia altimétrica está dibujado el proyecto, y en qué sistema trabaja la máquina. Si no figura en el plano, proponemos un sistema habitual según el país y la ubicación de la obra y le pedimos confirmación.",
              "Si la máquina trabaja con una calibración de obra local, facilítenos también los puntos de control utilizados con sus coordenadas. Así se puede verificar que el modelo y la calibración concuerdan.",
            ],
          },
          {
            kop: "Datos prácticos",
            tekst: ["Además de los planos, necesitamos algunos datos para planificar bien el encargo:"],
            lijst: [
              "dirección o ubicación de la obra (municipio, calle o coordenadas);",
              "marca, tipo y versión de software del sistema de control de maquinaria, por máquina;",
              "qué capas o fases desea como superficies separadas (por ejemplo, excavación, base, cota terminada);",
              "la fecha de entrega deseada;",
              "una persona de contacto que pueda responder a preguntas sobre el diseño.",
            ],
          },
        ],
      },
    },
  },

  // ── 6. Controle en toleranties ───────────────────────────────────────────
  {
    slug: "controle-en-toleranties",
    icoon: "Ruler",
    beeld: "/3d/model-talud-helling.jpg",
    i18n: {
      nl: {
        titel: "Controle en toleranties",
        samenvatting:
          "Een model wordt gecontroleerd voordat het de deur uitgaat, en hoort nog eens gecontroleerd te worden op de werf. Hoe die controle verloopt en welke toleranties in de praktijk gangbaar zijn.",
        secties: [
          {
            kop: "Controle tijdens het modelleren",
            tekst: [
              "Een model wordt niet alleen gebouwd, maar ook nagekeken tegen de bronplannen. Die controle gebeurt op verschillende niveaus:",
            ],
            lijst: [
              "peilen: de hoogtes op het plan (vloerpeilen, boordstenen, putdeksels) worden vergeleken met het model op dezelfde plaats;",
              "hellingen: langs- en dwarshellingen worden nagemeten en vergeleken met de profielen;",
              "aansluitingen: overgangen tussen ontwerpdelen en met het bestaande terrein mogen geen sprongen of onverwachte knikken vertonen;",
              "hoogtelijnen: een hoogtelijnenbeeld maakt onregelmatigheden zichtbaar, zoals een rijweg die tussen twee profielen doorbuigt of een talud dat plots van helling verandert;",
              "volledigheid: zijn alle zones, lagen en lijnen aanwezig die nodig zijn voor de uitvoering.",
            ],
          },
          {
            kop: "Tegenstrijdigheden in plannen",
            tekst: [
              "Plannen bevatten soms tegenstrijdige informatie: een peil op het grondplan dat niet overeenkomt met het lengteprofiel, of een helling die niet past bij de opgegeven hoogtes. Zulke punten worden niet stilzwijgend ingevuld maar gemeld, zodat de ontwerper of de werfleider kan beslissen welke waarde geldt.",
            ],
          },
          {
            kop: "Toleranties in algemene termen",
            tekst: [
              "De nauwkeurigheid die op de werf bereikt wordt, hangt af van meer dan het model alleen: het type positionering (GNSS of total station), de kwaliteit van de correctiegegevens, de kalibratie van de machine en de bodem. Het model zelf moet daarom ruim binnen de toleranties van het werk liggen, zodat het geen merkbare bijdrage levert aan de totale fout.",
              "In de praktijk gelden voor grondwerken meestal toleranties van enkele centimeters, en voor fundering en afwerkingslagen strengere waarden. De exacte toleranties staan in het bestek of de technische voorschriften van het project; die zijn altijd bepalend. Machinesturing met GNSS is doorgaans minder nauwkeurig in hoogte dan in ligging, wat bij fijne afwerking meetelt.",
            ],
          },
          {
            kop: "Controle op de werf vóór de start",
            tekst: [
              "Vóór de eerste schop in de grond gaat, hoort het model op de werf gecontroleerd te worden. Dat is een korte maar essentiële stap:",
            ],
            lijst: [
              "plaats het werktuig op een gekend punt met betrouwbare coördinaten en hoogte (een referentiepunt, een bestaand putdeksel of een ingemeten piket);",
              "vergelijk de getoonde positie en hoogte met de gekende waarden;",
              "controleer op een tweede punt, liefst aan de andere kant van de werf;",
              "bij een afwijking: eerst stelsel, kalibratie en machine-instellingen nakijken, en pas daarna het model.",
            ],
          },
        ],
      },
      fr: {
        titel: "Contrôle et tolérances",
        samenvatting:
          "Un modèle est contrôlé avant d’être livré, et doit l’être à nouveau sur le chantier. Comment se déroule ce contrôle et quelles tolérances sont courantes en pratique.",
        secties: [
          {
            kop: "Contrôle pendant la modélisation",
            tekst: [
              "Un modèle n’est pas seulement construit, il est aussi vérifié par rapport aux plans sources. Ce contrôle se fait à plusieurs niveaux :",
            ],
            lijst: [
              "cotes : les altitudes du plan (niveaux de plancher, bordures, tampons) sont comparées au modèle au même endroit ;",
              "pentes : les pentes longitudinales et transversales sont mesurées et comparées aux profils ;",
              "raccords : les transitions entre parties du projet et avec le terrain existant ne doivent présenter ni marche ni cassure inattendue ;",
              "courbes de niveau : une vue en courbes de niveau révèle les irrégularités, comme une chaussée qui fléchit entre deux profils ou un talus qui change soudain de pente ;",
              "complétude : toutes les zones, couches et lignes nécessaires à l’exécution sont-elles présentes.",
            ],
          },
          {
            kop: "Contradictions dans les plans",
            tekst: [
              "Les plans contiennent parfois des informations contradictoires : une cote en plan qui ne correspond pas au profil en long, ou une pente qui ne cadre pas avec les altitudes indiquées. Ces points ne sont pas complétés en silence mais signalés, afin que le concepteur ou le conducteur de travaux décide quelle valeur s’applique.",
            ],
          },
          {
            kop: "Tolérances en termes généraux",
            tekst: [
              "La précision atteinte sur le chantier dépend de bien plus que du modèle : le type de positionnement (GNSS ou station totale), la qualité des corrections, la calibration de la machine et le sol. Le modèle lui-même doit donc se situer largement à l’intérieur des tolérances de l’ouvrage, afin de ne pas contribuer de manière sensible à l’erreur totale.",
              "En pratique, les terrassements admettent généralement des tolérances de quelques centimètres, et les couches de fondation et de finition des valeurs plus strictes. Les tolérances exactes figurent dans le cahier des charges ou les prescriptions techniques du projet, qui font toujours foi. Le guidage GNSS est en général moins précis en altitude qu’en planimétrie, ce qui compte pour les finitions fines.",
            ],
          },
          {
            kop: "Contrôle sur chantier avant de commencer",
            tekst: [
              "Avant le premier coup de godet, le modèle doit être contrôlé sur le chantier. C’est une étape courte mais essentielle :",
            ],
            lijst: [
              "placez l’outil sur un point connu aux coordonnées et à l’altitude fiables (un repère, un tampon existant ou un piquet levé) ;",
              "comparez la position et l’altitude affichées aux valeurs connues ;",
              "contrôlez sur un second point, de préférence à l’autre extrémité du chantier ;",
              "en cas d’écart : vérifiez d’abord le système, la calibration et les réglages de la machine, et seulement ensuite le modèle.",
            ],
          },
        ],
      },
      en: {
        titel: "Checks and tolerances",
        samenvatting:
          "A model is checked before it is delivered and should be checked again on site. How that check is done and which tolerances are common in practice.",
        secties: [
          {
            kop: "Checks during modelling",
            tekst: [
              "A model is not only built but also checked against the source drawings. That check happens at several levels:",
            ],
            lijst: [
              "levels: the levels on the drawing (floor levels, kerbs, manhole covers) are compared with the model at the same location;",
              "gradients: longitudinal and cross falls are measured and compared with the sections;",
              "tie-ins: transitions between design parts and with the existing ground must show no steps or unexpected kinks;",
              "contours: a contour view reveals irregularities, such as a carriageway sagging between two sections or a slope that suddenly changes gradient;",
              "completeness: are all areas, layers and lines needed for construction present.",
            ],
          },
          {
            kop: "Conflicts in the drawings",
            tekst: [
              "Drawings sometimes contain conflicting information: a level on the layout plan that does not match the long section, or a gradient that does not fit the levels given. Such points are not filled in silently but reported, so the designer or site manager can decide which value applies.",
            ],
          },
          {
            kop: "Tolerances in general terms",
            tekst: [
              "The accuracy achieved on site depends on more than the model alone: the type of positioning (GNSS or total station), the quality of the correction data, machine calibration and ground conditions. The model itself should therefore sit well within the tolerances of the works, so that it does not add noticeably to the total error.",
              "In practice, earthworks usually allow tolerances of a few centimetres, while sub-base and finishing layers have tighter limits. The exact tolerances are set out in the specification or technical requirements of the project, which always take precedence. GNSS machine control is generally less accurate in height than in position, which matters for fine finishing.",
            ],
          },
          {
            kop: "On-site check before starting",
            tekst: [
              "Before the first bucket goes into the ground, the model should be checked on site. It is a short but essential step:",
            ],
            lijst: [
              "place the tool on a known point with reliable coordinates and level (a benchmark, an existing manhole cover or a surveyed peg);",
              "compare the displayed position and level with the known values;",
              "check on a second point, ideally at the other end of the site;",
              "if there is a deviation: first check the coordinate system, calibration and machine settings, and only then the model.",
            ],
          },
        ],
      },
      de: {
        titel: "Kontrolle und Toleranzen",
        samenvatting:
          "Ein Modell wird geprüft, bevor es ausgeliefert wird, und sollte auf der Baustelle erneut geprüft werden. Wie diese Kontrolle abläuft und welche Toleranzen in der Praxis üblich sind.",
        secties: [
          {
            kop: "Kontrolle während der Modellierung",
            tekst: [
              "Ein Modell wird nicht nur aufgebaut, sondern auch mit den Ausgangsplänen abgeglichen. Diese Kontrolle erfolgt auf mehreren Ebenen:",
            ],
            lijst: [
              "Höhen: die Höhenangaben im Plan (Fußbodenhöhen, Bordsteine, Schachtdeckel) werden mit dem Modell an derselben Stelle verglichen;",
              "Neigungen: Längs- und Querneigungen werden nachgemessen und mit den Profilen verglichen;",
              "Anschlüsse: Übergänge zwischen Planungsteilen und zum bestehenden Gelände dürfen keine Sprünge oder unerwarteten Knicke aufweisen;",
              "Höhenlinien: eine Höhenliniendarstellung macht Unregelmäßigkeiten sichtbar, etwa eine Fahrbahn, die zwischen zwei Profilen durchhängt, oder eine Böschung, die plötzlich ihre Neigung ändert;",
              "Vollständigkeit: sind alle für die Ausführung nötigen Bereiche, Schichten und Linien vorhanden.",
            ],
          },
          {
            kop: "Widersprüche in den Plänen",
            tekst: [
              "Pläne enthalten manchmal widersprüchliche Angaben: eine Höhe im Lageplan, die nicht mit dem Längsschnitt übereinstimmt, oder eine Neigung, die nicht zu den angegebenen Höhen passt. Solche Stellen werden nicht stillschweigend ergänzt, sondern gemeldet, damit der Planer oder die Bauleitung entscheiden kann, welcher Wert gilt.",
            ],
          },
          {
            kop: "Toleranzen im Allgemeinen",
            tekst: [
              "Die auf der Baustelle erreichte Genauigkeit hängt von mehr als nur dem Modell ab: von der Art der Positionierung (GNSS oder Tachymeter), der Qualität der Korrekturdaten, der Kalibrierung der Maschine und dem Untergrund. Das Modell selbst sollte daher deutlich innerhalb der Toleranzen der Arbeiten liegen, damit es keinen spürbaren Beitrag zum Gesamtfehler leistet.",
              "In der Praxis gelten für Erdarbeiten meist Toleranzen von wenigen Zentimetern, für Trag- und Deckschichten strengere Werte. Die genauen Toleranzen stehen im Leistungsverzeichnis oder in den technischen Vorschriften des Projekts; diese sind stets maßgebend. GNSS-Maschinensteuerung ist in der Höhe in der Regel weniger genau als in der Lage, was beim Feinplanum ins Gewicht fällt.",
            ],
          },
          {
            kop: "Kontrolle auf der Baustelle vor dem Start",
            tekst: [
              "Bevor der erste Löffel in den Boden geht, sollte das Modell auf der Baustelle geprüft werden. Das ist ein kurzer, aber wesentlicher Schritt:",
            ],
            lijst: [
              "setzen Sie das Werkzeug auf einen bekannten Punkt mit zuverlässigen Koordinaten und Höhe (einen Festpunkt, einen vorhandenen Schachtdeckel oder einen eingemessenen Pflock);",
              "vergleichen Sie die angezeigte Position und Höhe mit den bekannten Werten;",
              "prüfen Sie an einem zweiten Punkt, möglichst am anderen Ende der Baustelle;",
              "bei einer Abweichung: zuerst Koordinatensystem, Kalibrierung und Maschineneinstellungen prüfen, erst danach das Modell.",
            ],
          },
        ],
      },
      es: {
        titel: "Control y tolerancias",
        samenvatting:
          "Un modelo se comprueba antes de entregarse y debe comprobarse de nuevo en obra. Cómo se realiza ese control y qué tolerancias son habituales en la práctica.",
        secties: [
          {
            kop: "Control durante el modelado",
            tekst: [
              "Un modelo no solo se construye, sino que también se verifica frente a los planos de origen. Ese control se realiza a varios niveles:",
            ],
            lijst: [
              "cotas: las cotas del plano (cotas de solera, bordillos, tapas de pozo) se comparan con el modelo en el mismo lugar;",
              "pendientes: las pendientes longitudinales y transversales se miden y se comparan con los perfiles;",
              "enlaces: las transiciones entre partes del diseño y con el terreno existente no deben presentar escalones ni quiebros inesperados;",
              "curvas de nivel: una vista de curvas de nivel revela irregularidades, como una calzada que se hunde entre dos perfiles o un talud que cambia de pendiente de repente;",
              "integridad: ¿están presentes todas las zonas, capas y líneas necesarias para la ejecución?",
            ],
          },
          {
            kop: "Contradicciones en los planos",
            tekst: [
              "Los planos contienen a veces información contradictoria: una cota en planta que no coincide con el perfil longitudinal, o una pendiente que no encaja con las cotas indicadas. Estos puntos no se completan en silencio, sino que se comunican, para que el proyectista o el jefe de obra decida qué valor se aplica.",
            ],
          },
          {
            kop: "Tolerancias en términos generales",
            tekst: [
              "La precisión que se alcanza en obra depende de algo más que del modelo: del tipo de posicionamiento (GNSS o estación total), de la calidad de los datos de corrección, de la calibración de la máquina y del terreno. Por eso el modelo debe situarse holgadamente dentro de las tolerancias de la obra, para no contribuir de forma apreciable al error total.",
              "En la práctica, los movimientos de tierras admiten normalmente tolerancias de unos pocos centímetros, mientras que las capas de base y de acabado tienen límites más estrictos. Las tolerancias exactas figuran en el pliego de condiciones o en las prescripciones técnicas del proyecto, que siempre prevalecen. El control de maquinaria con GNSS suele ser menos preciso en altura que en planimetría, algo que cuenta en los acabados finos.",
            ],
          },
          {
            kop: "Control en obra antes de empezar",
            tekst: [
              "Antes de que el primer cazo toque el suelo, el modelo debe comprobarse en obra. Es un paso breve pero esencial:",
            ],
            lijst: [
              "sitúe la herramienta sobre un punto conocido con coordenadas y cota fiables (una base de replanteo, una tapa de pozo existente o una estaca levantada);",
              "compare la posición y la cota mostradas con los valores conocidos;",
              "compruebe en un segundo punto, preferiblemente en el otro extremo de la obra;",
              "si hay una desviación: revise primero el sistema de coordenadas, la calibración y la configuración de la máquina, y solo después el modelo.",
            ],
          },
        ],
      },
    },
  },

  // ── 7. Veelgestelde vragen ───────────────────────────────────────────────
  {
    slug: "veelgestelde-vragen",
    icoon: "HelpCircle",
    i18n: {
      nl: {
        titel: "Veelgestelde vragen",
        samenvatting:
          "Antwoorden op de vragen die het vaakst terugkomen: levertermijnen, facturatie, meerdere systemen, aanpassingen, levering en verantwoordelijkheid.",
        secties: [
          {
            kop: "Hoe snel kan een model geleverd worden?",
            tekst: [
              "Dat hangt af van de omvang van het project en van wanneer de aanvraag binnenkomt. We werken met drie categorieën: vroeg (meer dan drie weken vóór de gewenste leverdatum), standaard (één tot drie weken) en last-minute (vijf werkdagen of minder).",
              "Hoe vroeger de plannen binnen zijn, hoe meer ruimte er is om vragen over het ontwerp rustig af te stemmen. Last-minute is mogelijk zolang de planning het toelaat, maar wordt in de offerte als zodanig vermeld.",
            ],
          },
          {
            kop: "Hoe wordt er gefactureerd?",
            tekst: [
              "Er wordt per uur gefactureerd. Na ontvangst van de plannen krijgt u een offerte met een inschatting van het aantal uren, zodat u vooraf weet waar u aan toe bent. Blijkt tijdens het werk dat het dossier wezenlijk anders is dan verwacht, dan wordt dat eerst met u besproken.",
            ],
          },
          {
            kop: "Kost een model voor meerdere systemen extra?",
            tekst: [
              "Nee. Het model wordt één keer gebouwd. Levering voor meerdere systemen of merken, bijvoorbeeld voor een eigen machine en een gehuurde machine, gebeurt zonder meerkost. Geef bij de aanvraag wel alle systemen en softwareversies op.",
            ],
          },
          {
            kop: "Wat als het ontwerp wijzigt?",
            tekst: [
              "Ontwerpen veranderen tijdens een project, en dat is normaal. Stuur de gewijzigde plannen door met een korte omschrijving van wat er veranderd is. Aanpassingen worden zoals de rest per uur verrekend. Fouten in het model ten opzichte van de aangeleverde plannen worden uiteraard kosteloos rechtgezet.",
            ],
          },
          {
            kop: "Hoe ontvang ik de bestanden?",
            tekst: [
              "De bestanden staan klaar in uw klantenportaal en kunnen worden gedownload na betaling van de factuur. Daar vindt u ook eerdere versies en de bijhorende documenten terug.",
            ],
          },
          {
            kop: "Wie is verantwoordelijk voor de machinesturing?",
            tekst: [
              "Het model wordt opgebouwd volgens de aangeleverde plannen en in het afgesproken stelsel. De machinesturing zelf blijft de verantwoordelijkheid van de klant: de installatie, de kalibratie van machine en werf, de software en de instellingen.",
              "Controleer het model daarom altijd op uw eigen systeem en op een gekend punt op de werf voordat u begint. Bij twijfel over het ontwerp zelf blijft de ontwerper of het studiebureau het aanspreekpunt.",
            ],
          },
          {
            kop: "Werkt u ook buiten België?",
            tekst: [
              "Ja. Modellen worden gemaakt voor werven in heel Europa, in het coördinatenstelsel en de hoogtereferentie van het betrokken land of in een lokaal stelsel naar keuze. Communicatie kan in het Nederlands, Frans, Engels, Duits of Spaans.",
            ],
          },
        ],
      },
      fr: {
        titel: "Questions fréquentes",
        samenvatting:
          "Réponses aux questions qui reviennent le plus souvent : délais, facturation, plusieurs systèmes, modifications, livraison et responsabilité.",
        secties: [
          {
            kop: "En combien de temps un modèle peut-il être livré ?",
            tekst: [
              "Cela dépend de l’ampleur du projet et du moment où la demande arrive. Nous travaillons avec trois catégories : anticipée (plus de trois semaines avant la date de livraison souhaitée), standard (une à trois semaines) et dernière minute (cinq jours ouvrables ou moins).",
              "Plus les plans arrivent tôt, plus il y a de marge pour clarifier sereinement les questions sur le projet. La dernière minute est possible tant que le planning le permet, mais elle est mentionnée comme telle dans l’offre.",
            ],
          },
          {
            kop: "Comment la facturation fonctionne-t-elle ?",
            tekst: [
              "La facturation se fait à l’heure. Après réception des plans, vous recevez une offre avec une estimation du nombre d’heures, afin de savoir à l’avance à quoi vous attendre. Si le dossier s’avère sensiblement différent de ce qui était prévu, nous en discutons d’abord avec vous.",
            ],
          },
          {
            kop: "Un modèle pour plusieurs systèmes coûte-t-il plus cher ?",
            tekst: [
              "Non. Le modèle est construit une seule fois. La livraison pour plusieurs systèmes ou marques, par exemple pour votre propre machine et une machine de location, se fait sans supplément. Indiquez simplement tous les systèmes et versions logicielles dans votre demande.",
            ],
          },
          {
            kop: "Et si le projet change ?",
            tekst: [
              "Les projets évoluent en cours de route, c’est normal. Envoyez les plans modifiés avec une courte description des changements. Les adaptations sont facturées à l’heure, comme le reste. Les erreurs du modèle par rapport aux plans fournis sont bien entendu corrigées gratuitement.",
            ],
          },
          {
            kop: "Comment recevoir les fichiers ?",
            tekst: [
              "Les fichiers sont mis à disposition dans votre portail client et peuvent être téléchargés après paiement de la facture. Vous y retrouvez aussi les versions précédentes et les documents associés.",
            ],
          },
          {
            kop: "Qui est responsable du système de guidage ?",
            tekst: [
              "Le modèle est réalisé selon les plans fournis et dans le système convenu. Le système de guidage lui-même reste sous la responsabilité du client : installation, calibration de la machine et du chantier, logiciel et réglages.",
              "Contrôlez donc toujours le modèle sur votre propre système et sur un point connu du chantier avant de commencer. Pour toute question sur la conception elle-même, le concepteur ou le bureau d’études reste l’interlocuteur.",
            ],
          },
          {
            kop: "Travaillez-vous aussi en dehors de la Belgique ?",
            tekst: [
              "Oui. Les modèles sont réalisés pour des chantiers dans toute l’Europe, dans le système de coordonnées et la référence altimétrique du pays concerné ou dans un système local de votre choix. Les échanges peuvent se faire en néerlandais, français, anglais, allemand ou espagnol.",
            ],
          },
        ],
      },
      en: {
        titel: "Frequently asked questions",
        samenvatting:
          "Answers to the questions we hear most often: turnaround, billing, multiple systems, revisions, delivery and responsibility.",
        secties: [
          {
            kop: "How quickly can a model be delivered?",
            tekst: [
              "That depends on the size of the project and on when the request comes in. We work with three categories: early (more than three weeks before the required delivery date), standard (one to three weeks) and last-minute (five working days or less).",
              "The earlier the drawings arrive, the more room there is to settle questions about the design calmly. Last-minute work is possible as long as the schedule allows, but it is marked as such in the quote.",
            ],
          },
          {
            kop: "How is the work billed?",
            tekst: [
              "Work is billed per hour. Once the drawings are received, you get a quote with an estimate of the number of hours, so you know in advance what to expect. If the job turns out to be substantially different from what was expected, this is discussed with you first.",
            ],
          },
          {
            kop: "Does a model for several systems cost extra?",
            tekst: [
              "No. The model is built once. Delivery for several systems or brands, for example for your own machine and a hired one, comes at no extra cost. Just list all systems and software versions in your request.",
            ],
          },
          {
            kop: "What if the design changes?",
            tekst: [
              "Designs change during a project, and that is normal. Send the revised drawings with a short description of what has changed. Revisions are billed per hour, like the rest. Errors in the model compared with the drawings supplied are of course corrected free of charge.",
            ],
          },
          {
            kop: "How do I receive the files?",
            tekst: [
              "The files are made available in your client portal and can be downloaded once the invoice has been paid. Earlier versions and related documents are kept there as well.",
            ],
          },
          {
            kop: "Who is responsible for the machine control system?",
            tekst: [
              "The model is built according to the drawings supplied and in the agreed coordinate system. The machine control system itself remains the client’s responsibility: installation, machine and site calibration, software and settings.",
              "Always check the model on your own system and on a known point on site before you start. For questions about the design itself, the designer or engineering consultant remains the point of contact.",
            ],
          },
          {
            kop: "Do you work outside Belgium?",
            tekst: [
              "Yes. Models are produced for sites across Europe, in the coordinate system and height datum of the country concerned or in a local system of your choice. Communication is possible in Dutch, French, English, German or Spanish.",
            ],
          },
        ],
      },
      de: {
        titel: "Häufig gestellte Fragen",
        samenvatting:
          "Antworten auf die Fragen, die am häufigsten gestellt werden: Lieferfristen, Abrechnung, mehrere Systeme, Änderungen, Lieferung und Verantwortung.",
        secties: [
          {
            kop: "Wie schnell kann ein Modell geliefert werden?",
            tekst: [
              "Das hängt vom Umfang des Projekts und vom Zeitpunkt der Anfrage ab. Wir arbeiten mit drei Kategorien: frühzeitig (mehr als drei Wochen vor dem gewünschten Liefertermin), Standard (eine bis drei Wochen) und kurzfristig (fünf Werktage oder weniger).",
              "Je früher die Pläne vorliegen, desto mehr Spielraum besteht, Fragen zur Planung in Ruhe abzustimmen. Kurzfristige Aufträge sind möglich, solange es die Planung zulässt, werden im Angebot jedoch als solche ausgewiesen.",
            ],
          },
          {
            kop: "Wie wird abgerechnet?",
            tekst: [
              "Die Abrechnung erfolgt nach Stunden. Nach Eingang der Pläne erhalten Sie ein Angebot mit einer Schätzung der Stundenzahl, sodass Sie vorab wissen, womit Sie rechnen können. Stellt sich während der Arbeit heraus, dass das Projekt wesentlich anders ist als erwartet, wird dies zuerst mit Ihnen besprochen.",
            ],
          },
          {
            kop: "Kostet ein Modell für mehrere Systeme extra?",
            tekst: [
              "Nein. Das Modell wird einmal aufgebaut. Die Lieferung für mehrere Systeme oder Marken, zum Beispiel für eine eigene und eine gemietete Maschine, erfolgt ohne Aufpreis. Geben Sie bei der Anfrage jedoch alle Systeme und Softwareversionen an.",
            ],
          },
          {
            kop: "Was, wenn sich die Planung ändert?",
            tekst: [
              "Planungen ändern sich im Laufe eines Projekts, das ist normal. Senden Sie die geänderten Pläne mit einer kurzen Beschreibung der Änderungen. Anpassungen werden wie alles andere nach Stunden abgerechnet. Fehler im Modell gegenüber den übermittelten Plänen werden selbstverständlich kostenlos korrigiert.",
            ],
          },
          {
            kop: "Wie erhalte ich die Dateien?",
            tekst: [
              "Die Dateien stehen in Ihrem Kundenportal bereit und können nach Bezahlung der Rechnung heruntergeladen werden. Dort finden Sie auch frühere Versionen und die zugehörigen Dokumente.",
            ],
          },
          {
            kop: "Wer ist für die Maschinensteuerung verantwortlich?",
            tekst: [
              "Das Modell wird nach den übermittelten Plänen und im vereinbarten Koordinatensystem aufgebaut. Die Maschinensteuerung selbst bleibt in der Verantwortung des Kunden: Installation, Kalibrierung von Maschine und Baustelle, Software und Einstellungen.",
              "Prüfen Sie das Modell daher vor Beginn immer auf Ihrem eigenen System und an einem bekannten Punkt auf der Baustelle. Bei Fragen zur Planung selbst bleibt der Planer oder das Ingenieurbüro Ihr Ansprechpartner.",
            ],
          },
          {
            kop: "Arbeiten Sie auch außerhalb Belgiens?",
            tekst: [
              "Ja. Modelle werden für Baustellen in ganz Europa erstellt, im Koordinatensystem und Höhenbezug des jeweiligen Landes oder in einem lokalen System Ihrer Wahl. Die Kommunikation ist auf Deutsch, Niederländisch, Französisch, Englisch oder Spanisch möglich.",
            ],
          },
        ],
      },
      es: {
        titel: "Preguntas frecuentes",
        samenvatting:
          "Respuestas a las preguntas que más se repiten: plazos de entrega, facturación, varios sistemas, modificaciones, entrega y responsabilidad.",
        secties: [
          {
            kop: "¿Con qué rapidez se puede entregar un modelo?",
            tekst: [
              "Depende del tamaño del proyecto y del momento en que llega la solicitud. Trabajamos con tres categorías: anticipada (más de tres semanas antes de la fecha de entrega deseada), estándar (de una a tres semanas) y de última hora (cinco días laborables o menos).",
              "Cuanto antes lleguen los planos, más margen hay para aclarar con calma las dudas sobre el diseño. Los encargos de última hora son posibles siempre que la planificación lo permita, pero se indican como tales en el presupuesto.",
            ],
          },
          {
            kop: "¿Cómo se factura?",
            tekst: [
              "Se factura por horas. Tras recibir los planos, usted recibe un presupuesto con una estimación del número de horas, para que sepa de antemano a qué atenerse. Si durante el trabajo resulta que el encargo es sustancialmente distinto de lo previsto, se comenta primero con usted.",
            ],
          },
          {
            kop: "¿Cuesta más un modelo para varios sistemas?",
            tekst: [
              "No. El modelo se construye una sola vez. La entrega para varios sistemas o marcas, por ejemplo para su propia máquina y una de alquiler, no tiene coste adicional. Basta con indicar todos los sistemas y versiones de software en su solicitud.",
            ],
          },
          {
            kop: "¿Y si cambia el diseño?",
            tekst: [
              "Los diseños cambian durante un proyecto, y es normal. Envíe los planos modificados con una breve descripción de los cambios. Las modificaciones se facturan por horas, como el resto. Los errores del modelo respecto a los planos facilitados se corrigen, por supuesto, sin coste.",
            ],
          },
          {
            kop: "¿Cómo recibo los archivos?",
            tekst: [
              "Los archivos se ponen a su disposición en su portal de cliente y pueden descargarse una vez pagada la factura. Allí encontrará también las versiones anteriores y los documentos correspondientes.",
            ],
          },
          {
            kop: "¿Quién es responsable del sistema de control de maquinaria?",
            tekst: [
              "El modelo se elabora según los planos facilitados y en el sistema de coordenadas acordado. El sistema de control de maquinaria sigue siendo responsabilidad del cliente: instalación, calibración de la máquina y de la obra, software y configuración.",
              "Compruebe siempre el modelo en su propio sistema y en un punto conocido de la obra antes de empezar. Para dudas sobre el propio diseño, el proyectista o la ingeniería consultora sigue siendo el interlocutor.",
            ],
          },
          {
            kop: "¿Trabajan también fuera de Bélgica?",
            tekst: [
              "Sí. Los modelos se elaboran para obras en toda Europa, en el sistema de coordenadas y la referencia altimétrica del país correspondiente o en un sistema local de su elección. La comunicación es posible en español, neerlandés, francés, inglés o alemán.",
            ],
          },
        ],
      },
    },
  },

  // ── 8. Van PDF naar model ────────────────────────────────────────────────
  {
    slug: "van-pdf-naar-model",
    icoon: "FileStack",
    i18n: {
      nl: {
        titel: "Van PDF of papieren plan naar model",
        samenvatting:
          "Niet elk project komt met CAD-bestanden. Ook vanuit een PDF of een papieren plan kan een model worden opgebouwd, maar dat vraagt extra informatie en extra controle. Hoe dat werkt, waar de grenzen liggen en wat u zelf best nakijkt.",
        secties: [
          {
            kop: "Waarom CAD de voorkeur heeft",
            tekst: [
              "Een DWG- of DXF-bestand bevat de tekening zoals de ontwerper ze heeft gemaakt: lijnen met echte coördinaten, vaak in het juiste stelsel en soms al met hoogtes. Een PDF is in wezen een afdruk. Ook als de lijnen er scherp uitzien, is de band met de coördinaten verloren gegaan en zijn hoogtes enkel nog als tekst aanwezig.",
              "Vraag daarom eerst bij de ontwerper of het studiebureau of de digitale bestanden beschikbaar zijn. Dat spaart tijd en levert een nauwkeuriger model op. Lukt dat niet, dan is een PDF nog altijd bruikbaar.",
            ],
          },
          {
            kop: "Schaal en maatvoering",
            tekst: [
              "Een plan op papier of in PDF klopt alleen op de schaal waarop het getekend is. Bij afdrukken, kopiëren of scannen kan die schaal licht verlopen, en niet altijd in beide richtingen evenveel. Een vermelde schaal zoals 1/200 is daarom een vertrekpunt, geen garantie.",
              "Het plan wordt op schaal gebracht met gekende maten: een maatlijn, een coördinatenrooster, de afstand tussen twee punten met gekende coördinaten. Hoe meer van die referenties over het blad verspreid liggen, hoe beter een verloop in de schaal kan worden opgespoord en gecorrigeerd.",
            ],
          },
          {
            kop: "Welke informatie helpt",
            tekst: ["Omdat een PDF minder informatie draagt dan een CAD-bestand, is aanvullende informatie des te belangrijker:"],
            lijst: [
              "peilen en hoogtepunten op het grondplan;",
              "lengte- en dwarsprofielen, met kilometrering of afstanden;",
              "referentiepunten of polygoonpunten met coördinaten en hoogte;",
              "een coördinatenrooster op het plan;",
              "het coördinatenstelsel en de hoogtereferentie waarin het project is getekend.",
            ],
          },
          {
            kop: "Hoe het model wordt opgebouwd",
            tekst: [
              "Eerst wordt het plan gegeorefereerd: op schaal gebracht en op de juiste plaats in het coördinatenstelsel gelegd aan de hand van de referentiepunten of het rooster. Daarna wordt het relevante lijnwerk overgetekend (gedigitaliseerd): assen, kantlijnen, boordstenen, taluds.",
              "Die lijnen krijgen vervolgens hun hoogte uit de peilen en de profielen. Tot slot wordt het resultaat nagemeten tegen de maten en peilen op het plan. Waar een gemeten afstand of hoogte niet overeenkomt met wat er op het plan staat, wordt dat gemeld in plaats van stilzwijgend aangepast.",
            ],
          },
          {
            kop: "Grenzen en wat u zelf controleert",
            tekst: [
              "De nauwkeurigheid van een model uit PDF hangt af van de kwaliteit van het document, de dikte van de lijnen, de schaal en het aantal betrouwbare referenties. Een scan van een gekreukt of meermaals gekopieerd plan is het minst nauwkeurig. Hoogtes zijn meestal betrouwbaarder dan de ligging, omdat ze als getal op het plan staan.",
              "Controleer het model daarom extra zorgvuldig vóór de start: op meerdere gekende punten, zowel in ligging als in hoogte, en liefst verspreid over de hele werf. Bij twijfel over een maat geldt het plan van de ontwerper, niet het model.",
            ],
          },
        ],
      },
      fr: {
        titel: "Du PDF ou du plan papier au modèle",
        samenvatting:
          "Tous les projets ne sont pas fournis en fichiers CAO. Un modèle peut aussi être construit à partir d’un PDF ou d’un plan papier, mais cela demande davantage d’informations et de contrôles. Comment cela fonctionne, où sont les limites et ce que vous avez intérêt à vérifier.",
        secties: [
          {
            kop: "Pourquoi la CAO est préférable",
            tekst: [
              "Un fichier DWG ou DXF contient le dessin tel que le concepteur l’a réalisé : des lignes avec leurs coordonnées réelles, souvent dans le bon système et parfois déjà avec des altitudes. Un PDF est essentiellement une impression. Même si les traits paraissent nets, le lien avec les coordonnées est perdu et les altitudes ne subsistent que sous forme de texte.",
              "Demandez donc d’abord au concepteur ou au bureau d’études si les fichiers numériques sont disponibles. Cela fait gagner du temps et donne un modèle plus précis. À défaut, un PDF reste utilisable.",
            ],
          },
          {
            kop: "Échelle et cotation",
            tekst: [
              "Un plan papier ou PDF n’est juste qu’à l’échelle à laquelle il a été dessiné. À l’impression, à la copie ou au scan, cette échelle peut légèrement dériver, et pas toujours de la même façon dans les deux directions. Une échelle indiquée comme 1/200 est donc un point de départ, pas une garantie.",
              "Le plan est mis à l’échelle à l’aide de dimensions connues : une ligne de cote, un quadrillage de coordonnées, la distance entre deux points aux coordonnées connues. Plus ces références sont réparties sur la feuille, mieux une dérive d’échelle peut être détectée et corrigée.",
            ],
          },
          {
            kop: "Les informations utiles",
            tekst: ["Comme un PDF porte moins d’informations qu’un fichier CAO, les données complémentaires sont d’autant plus importantes :"],
            lijst: [
              "cotes et points cotés sur la vue en plan ;",
              "profils en long et en travers, avec PK ou distances ;",
              "points de référence ou de polygonale avec coordonnées et altitude ;",
              "un quadrillage de coordonnées sur le plan ;",
              "le système de coordonnées et la référence altimétrique du projet.",
            ],
          },
          {
            kop: "Comment le modèle est construit",
            tekst: [
              "Le plan est d’abord géoréférencé : mis à l’échelle et placé au bon endroit dans le système de coordonnées grâce aux points de référence ou au quadrillage. Les lignes utiles sont ensuite redessinées (numérisées) : axes, bords, bordures, talus.",
              "Ces lignes reçoivent ensuite leur altitude à partir des cotes et des profils. Enfin, le résultat est contrôlé par rapport aux dimensions et aux cotes du plan. Lorsqu’une distance ou une altitude mesurée ne correspond pas au plan, l’écart est signalé plutôt que corrigé en silence.",
            ],
          },
          {
            kop: "Limites et contrôles de votre côté",
            tekst: [
              "La précision d’un modèle issu d’un PDF dépend de la qualité du document, de l’épaisseur des traits, de l’échelle et du nombre de références fiables. Le scan d’un plan froissé ou copié plusieurs fois est le moins précis. Les altitudes sont en général plus fiables que la planimétrie, car elles figurent en chiffres sur le plan.",
              "Contrôlez donc le modèle avec un soin particulier avant de commencer : sur plusieurs points connus, en position comme en altitude, de préférence répartis sur tout le chantier. En cas de doute sur une dimension, c’est le plan du concepteur qui fait foi, pas le modèle.",
            ],
          },
        ],
      },
      en: {
        titel: "From PDF or paper drawing to model",
        samenvatting:
          "Not every project comes with CAD files. A model can also be built from a PDF or a paper drawing, but that takes extra information and extra checking. How it works, where the limits are and what you should check yourself.",
        secties: [
          {
            kop: "Why CAD is preferred",
            tekst: [
              "A DWG or DXF file contains the drawing as the designer made it: lines with real coordinates, often in the correct system and sometimes with levels already. A PDF is essentially a print. Even if the lines look sharp, the link with the coordinates is lost and levels only survive as text.",
              "So first ask the designer or engineering consultant whether the digital files are available. That saves time and gives a more accurate model. If that is not possible, a PDF can still be used.",
            ],
          },
          {
            kop: "Scale and dimensions",
            tekst: [
              "A paper or PDF drawing is only correct at the scale it was drawn at. Printing, copying or scanning can make that scale drift slightly, and not always equally in both directions. A stated scale such as 1:200 is therefore a starting point, not a guarantee.",
              "The drawing is scaled using known dimensions: a dimension line, a coordinate grid, the distance between two points with known coordinates. The more of these references are spread across the sheet, the better any scale drift can be detected and corrected.",
            ],
          },
          {
            kop: "What information helps",
            tekst: ["Because a PDF carries less information than a CAD file, supporting information matters all the more:"],
            lijst: [
              "levels and spot heights on the layout plan;",
              "long and cross sections, with chainage or distances;",
              "reference points or control stations with coordinates and height;",
              "a coordinate grid on the drawing;",
              "the coordinate system and height datum the project is drawn in.",
            ],
          },
          {
            kop: "How the model is built",
            tekst: [
              "The drawing is first georeferenced: scaled and placed in the right position in the coordinate system using the reference points or the grid. The relevant linework is then traced (digitised): centrelines, edges, kerbs, slopes.",
              "Those lines are then given their levels from the spot heights and the sections. Finally, the result is checked against the dimensions and levels on the drawing. Where a measured distance or level does not match the drawing, it is reported rather than quietly adjusted.",
            ],
          },
          {
            kop: "Limits and what you should check",
            tekst: [
              "The accuracy of a model built from a PDF depends on the quality of the document, the line thickness, the scale and the number of reliable references. A scan of a creased or repeatedly copied drawing is the least accurate. Levels are usually more reliable than horizontal position, because they appear as numbers on the drawing.",
              "Check the model with extra care before starting: on several known points, both in position and in height, ideally spread across the whole site. When in doubt about a dimension, the designer’s drawing prevails, not the model.",
            ],
          },
        ],
      },
      de: {
        titel: "Vom PDF oder Papierplan zum Modell",
        samenvatting:
          "Nicht jedes Projekt wird mit CAD-Dateien geliefert. Auch aus einem PDF oder einem Papierplan lässt sich ein Modell aufbauen, das erfordert jedoch zusätzliche Informationen und zusätzliche Kontrolle. Wie das funktioniert, wo die Grenzen liegen und was Sie selbst am besten prüfen.",
        secties: [
          {
            kop: "Warum CAD bevorzugt wird",
            tekst: [
              "Eine DWG- oder DXF-Datei enthält die Zeichnung so, wie der Planer sie erstellt hat: Linien mit echten Koordinaten, oft im richtigen System und manchmal bereits mit Höhen. Ein PDF ist im Grunde ein Ausdruck. Auch wenn die Linien scharf aussehen, ist der Bezug zu den Koordinaten verloren, und Höhen sind nur noch als Text vorhanden.",
              "Fragen Sie daher zuerst beim Planer oder Ingenieurbüro nach, ob die digitalen Dateien verfügbar sind. Das spart Zeit und ergibt ein genaueres Modell. Gelingt das nicht, ist ein PDF dennoch verwendbar.",
            ],
          },
          {
            kop: "Maßstab und Bemaßung",
            tekst: [
              "Ein Plan auf Papier oder als PDF stimmt nur in dem Maßstab, in dem er gezeichnet wurde. Beim Drucken, Kopieren oder Scannen kann sich dieser Maßstab leicht verschieben, und nicht immer in beiden Richtungen gleich stark. Ein angegebener Maßstab wie 1:200 ist daher ein Ausgangspunkt, keine Garantie.",
              "Der Plan wird anhand bekannter Maße maßstäblich eingepasst: einer Maßkette, eines Koordinatengitters, des Abstands zwischen zwei Punkten mit bekannten Koordinaten. Je mehr solcher Referenzen über das Blatt verteilt sind, desto besser lässt sich eine Maßstabsabweichung erkennen und korrigieren.",
            ],
          },
          {
            kop: "Welche Informationen helfen",
            tekst: ["Da ein PDF weniger Informationen trägt als eine CAD-Datei, sind ergänzende Angaben umso wichtiger:"],
            lijst: [
              "Höhenangaben und Höhenpunkte im Lageplan;",
              "Längs- und Querprofile, mit Stationierung oder Abständen;",
              "Festpunkte oder Polygonpunkte mit Koordinaten und Höhe;",
              "ein Koordinatengitter auf dem Plan;",
              "das Koordinatensystem und der Höhenbezug, in dem das Projekt gezeichnet ist.",
            ],
          },
          {
            kop: "Wie das Modell aufgebaut wird",
            tekst: [
              "Zuerst wird der Plan georeferenziert: anhand der Festpunkte oder des Gitters maßstäblich eingepasst und an die richtige Stelle im Koordinatensystem gelegt. Danach werden die relevanten Linien nachgezeichnet (digitalisiert): Achsen, Kanten, Bordsteine, Böschungen.",
              "Diese Linien erhalten anschließend ihre Höhe aus den Höhenangaben und den Profilen. Zum Schluss wird das Ergebnis mit den Maßen und Höhen im Plan abgeglichen. Wo ein gemessener Abstand oder eine Höhe nicht mit dem Plan übereinstimmt, wird dies gemeldet, statt stillschweigend angepasst.",
            ],
          },
          {
            kop: "Grenzen und was Sie selbst prüfen",
            tekst: [
              "Die Genauigkeit eines Modells aus einem PDF hängt von der Qualität des Dokuments, der Linienstärke, dem Maßstab und der Anzahl zuverlässiger Referenzen ab. Der Scan eines zerknitterten oder mehrfach kopierten Plans ist am ungenauesten. Höhen sind meist zuverlässiger als die Lage, weil sie als Zahl auf dem Plan stehen.",
              "Prüfen Sie das Modell daher vor dem Start besonders sorgfältig: an mehreren bekannten Punkten, sowohl in der Lage als auch in der Höhe, und möglichst über die gesamte Baustelle verteilt. Im Zweifel über ein Maß gilt der Plan des Planers, nicht das Modell.",
            ],
          },
        ],
      },
      es: {
        titel: "Del PDF o plano en papel al modelo",
        samenvatting:
          "No todos los proyectos llegan con archivos CAD. También se puede construir un modelo a partir de un PDF o de un plano en papel, pero eso requiere información y controles adicionales. Cómo funciona, dónde están los límites y qué conviene que compruebe usted mismo.",
        secties: [
          {
            kop: "Por qué se prefiere el CAD",
            tekst: [
              "Un archivo DWG o DXF contiene el dibujo tal como lo hizo el proyectista: líneas con coordenadas reales, a menudo en el sistema correcto y a veces ya con cotas. Un PDF es, en esencia, una impresión. Aunque las líneas se vean nítidas, se ha perdido el vínculo con las coordenadas y las cotas solo sobreviven como texto.",
              "Por eso, pregunte primero al proyectista o a la ingeniería si los archivos digitales están disponibles. Eso ahorra tiempo y da un modelo más preciso. Si no es posible, un PDF sigue siendo utilizable.",
            ],
          },
          {
            kop: "Escala y acotación",
            tekst: [
              "Un plano en papel o en PDF solo es correcto a la escala a la que se dibujó. Al imprimir, copiar o escanear, esa escala puede desviarse ligeramente, y no siempre por igual en ambas direcciones. Una escala indicada como 1:200 es, por tanto, un punto de partida, no una garantía.",
              "El plano se escala a partir de medidas conocidas: una línea de cota, una cuadrícula de coordenadas, la distancia entre dos puntos de coordenadas conocidas. Cuantas más referencias haya repartidas por la hoja, mejor se puede detectar y corregir una desviación de escala.",
            ],
          },
          {
            kop: "Qué información ayuda",
            tekst: ["Como un PDF contiene menos información que un archivo CAD, los datos complementarios son aún más importantes:"],
            lijst: [
              "cotas y puntos acotados en la planta;",
              "perfiles longitudinales y transversales, con PK o distancias;",
              "puntos de referencia o de poligonal con coordenadas y altura;",
              "una cuadrícula de coordenadas en el plano;",
              "el sistema de coordenadas y la referencia altimétrica en que está dibujado el proyecto.",
            ],
          },
          {
            kop: "Cómo se construye el modelo",
            tekst: [
              "Primero se georreferencia el plano: se escala y se sitúa en el lugar correcto del sistema de coordenadas a partir de los puntos de referencia o de la cuadrícula. Después se calcan (digitalizan) las líneas relevantes: ejes, bordes, bordillos, taludes.",
              "A continuación, esas líneas reciben su cota a partir de los puntos acotados y los perfiles. Por último, el resultado se contrasta con las medidas y cotas del plano. Cuando una distancia o cota medida no coincide con el plano, se comunica en lugar de ajustarse en silencio.",
            ],
          },
          {
            kop: "Límites y qué debe comprobar usted",
            tekst: [
              "La precisión de un modelo hecho a partir de un PDF depende de la calidad del documento, del grosor de las líneas, de la escala y del número de referencias fiables. El escaneado de un plano arrugado o copiado varias veces es el menos preciso. Las cotas suelen ser más fiables que la posición en planta, porque figuran como números en el plano.",
              "Compruebe por ello el modelo con especial cuidado antes de empezar: en varios puntos conocidos, tanto en posición como en altura, y preferiblemente repartidos por toda la obra. En caso de duda sobre una medida, prevalece el plano del proyectista, no el modelo.",
            ],
          },
        ],
      },
    },
  },

  // ── 9. Grondverzet en volumes ────────────────────────────────────────────
  {
    slug: "grondverzet-en-volumes",
    icoon: "Layers",
    i18n: {
      nl: {
        titel: "Grondverzet en volumes",
        samenvatting:
          "Een ontwerpmodel stuurt niet alleen de machine, het helpt ook het grondverzet te begrijpen: waar wordt afgegraven, waar aangevuld en hoeveel. Wat zo’n volumeberekening zegt, en wat ze niet zegt.",
        secties: [
          {
            kop: "Twee oppervlakken vergelijken",
            tekst: [
              "Een volume ontstaat door twee oppervlakken met elkaar te vergelijken: het bestaande terrein, zoals het is opgemeten, en het ontwerpoppervlak. Op elke plaats wordt het hoogteverschil tussen beide bepaald, en over het hele werkgebied opgeteld.",
              "Ligt het bestaande terrein hoger dan het ontwerp, dan moet er grond weg: uitgraving of afgraving. Ligt het lager, dan moet er grond bij: ophoging of aanvulling. Een kaart met beide zones in kleur maakt in één oogopslag duidelijk waar de werken zwaartepunten hebben.",
            ],
          },
          {
            kop: "Grondbalans",
            tekst: [
              "De grondbalans zet het totale uitgravingsvolume tegenover het totale ophogingsvolume. Is er meer uitgraving dan ophoging, dan blijft er grond over die moet worden afgevoerd. Is er meer ophoging, dan moet er materiaal worden aangevoerd.",
              "Daarbij speelt mee dat grond van volume verandert. Losgegraven grond neemt meer plaats in dan in de ongeroerde bodem, en verdichte grond minder. Bovendien is niet alle uitgegraven grond geschikt om opnieuw te gebruiken. Een geometrische balans is dus een vertrekpunt voor de planning van transport en materiaal, niet het eindantwoord.",
            ],
          },
          {
            kop: "Lagen en waarom dikte telt",
            tekst: [
              "Onder een verharding liggen meestal meerdere lagen, zoals een onderfundering en een fundering. Elke laag heeft een ontwerpdikte. Wordt er gerekend tot het afgewerkte niveau in plaats van tot de bodem van de opbouw, dan wordt de uitgraving onderschat.",
              "Daarom worden de lagen best als aparte oppervlakken gemodelleerd. Zo kan het uitgravingsvolume tot het uitgravingsniveau worden bepaald, en per laag het benodigde volume materiaal. Een verschil van enkele centimeters in laagdikte lijkt klein, maar over een grote oppervlakte telt het snel op.",
            ],
          },
          {
            kop: "Indicatief, geen garantie",
            tekst: [
              "Een volume is nooit nauwkeuriger dan de oppervlakken waarop het berekend is. Een opmeting met weinig punten, een verouderde opmeting of een terrein dat sindsdien is veranderd, geeft een volume dat afwijkt van de werkelijkheid. Ook vegetatie, losse stockage of water op het ogenblik van de opmeting beïnvloeden het resultaat.",
              "Volumes uit het model zijn daarom een nevenproduct van het ontwerpwerk en hebben een indicatieve waarde. Ze helpen bij het inschatten en plannen, maar zijn geen gegarandeerde hoeveelheden voor afrekening of meetstaat. Voor contractuele hoeveelheden blijven de opmeting door een landmeter en de afspraken in het bestek bepalend.",
            ],
          },
        ],
      },
      fr: {
        titel: "Terrassements et volumes",
        samenvatting:
          "Un modèle de conception ne guide pas seulement la machine, il aide aussi à comprendre les terrassements : où l’on déblaie, où l’on remblaie et en quelle quantité. Ce que dit un calcul de volumes, et ce qu’il ne dit pas.",
        secties: [
          {
            kop: "Comparer deux surfaces",
            tekst: [
              "Un volume s’obtient en comparant deux surfaces : le terrain existant, tel qu’il a été levé, et la surface de conception. En chaque point, la différence d’altitude entre les deux est déterminée, puis additionnée sur toute la zone de travail.",
              "Si le terrain existant est plus haut que le projet, il faut enlever de la terre : c’est le déblai. S’il est plus bas, il faut en apporter : c’est le remblai. Une carte avec les deux zones en couleur montre d’un coup d’œil où se concentrent les travaux.",
            ],
          },
          {
            kop: "Équilibre des terres",
            tekst: [
              "L’équilibre des terres (ou mouvement des terres) met en regard le volume total de déblai et le volume total de remblai. S’il y a plus de déblai que de remblai, il reste de la terre à évacuer. S’il y a plus de remblai, il faut apporter du matériau.",
              "Il faut aussi tenir compte du fait que la terre change de volume. La terre excavée occupe plus de place qu’en place (foisonnement), et la terre compactée moins. De plus, toute la terre déblayée n’est pas forcément réutilisable. Un équilibre géométrique est donc un point de départ pour planifier transport et matériaux, pas la réponse définitive.",
            ],
          },
          {
            kop: "Les couches et l’importance de l’épaisseur",
            tekst: [
              "Sous un revêtement se trouvent généralement plusieurs couches, comme une sous-fondation et une fondation. Chaque couche a une épaisseur de projet. Si l’on calcule jusqu’au niveau fini plutôt que jusqu’au fond de la structure, le déblai est sous-estimé.",
              "C’est pourquoi il vaut mieux modéliser les couches comme des surfaces séparées. On peut alors déterminer le volume de déblai jusqu’au fond de forme, et le volume de matériau nécessaire par couche. Quelques centimètres d’écart d’épaisseur paraissent peu, mais sur une grande surface cela s’additionne vite.",
            ],
          },
          {
            kop: "Indicatif, pas une garantie",
            tekst: [
              "Un volume n’est jamais plus précis que les surfaces sur lesquelles il est calculé. Un levé avec peu de points, un levé ancien ou un terrain modifié depuis donne un volume qui s’écarte de la réalité. La végétation, des dépôts temporaires ou de l’eau au moment du levé influencent aussi le résultat.",
              "Les volumes issus du modèle sont donc un sous-produit du travail de modélisation et ont une valeur indicative. Ils aident à estimer et à planifier, mais ne constituent pas des quantités garanties pour un décompte ou un métré. Pour les quantités contractuelles, le levé d’un géomètre et les clauses du cahier des charges restent déterminants.",
            ],
          },
        ],
      },
      en: {
        titel: "Earthworks and volumes",
        samenvatting:
          "A design model does more than guide the machine: it also helps you understand the earthworks — where material is cut, where it is filled and how much. What such a volume calculation tells you, and what it does not.",
        secties: [
          {
            kop: "Comparing two surfaces",
            tekst: [
              "A volume is found by comparing two surfaces: the existing ground, as surveyed, and the design surface. At every location the difference in level between the two is determined and then summed over the whole working area.",
              "Where the existing ground is higher than the design, material has to be removed: that is cut. Where it is lower, material has to be added: that is fill. A map showing both zones in colour makes it clear at a glance where the bulk of the work lies.",
            ],
          },
          {
            kop: "Earth balance",
            tekst: [
              "The earth balance sets the total cut volume against the total fill volume. If there is more cut than fill, surplus material has to be taken off site. If there is more fill, material has to be brought in.",
              "Keep in mind that soil changes volume. Excavated soil takes up more space than it did in the ground (bulking), and compacted soil less. On top of that, not all excavated material is suitable for reuse. A geometric balance is therefore a starting point for planning haulage and materials, not the final answer.",
            ],
          },
          {
            kop: "Layers and why thickness matters",
            tekst: [
              "Beneath a pavement there are usually several layers, such as a sub-base and a base course. Each layer has a design thickness. If the calculation runs to finished level rather than to the bottom of the build-up, the cut is underestimated.",
              "That is why layers are best modelled as separate surfaces. The cut volume can then be determined down to formation level, and the volume of material needed for each layer. A few centimetres of difference in layer thickness seems small, but over a large area it adds up quickly.",
            ],
          },
          {
            kop: "Indicative, not a guarantee",
            tekst: [
              "A volume is never more accurate than the surfaces it is calculated from. A survey with few points, an outdated survey or ground that has changed since gives a volume that differs from reality. Vegetation, temporary stockpiles or standing water at the time of the survey also affect the result.",
              "Volumes from the model are therefore a by-product of the modelling work and are indicative. They help with estimating and planning, but they are not guaranteed quantities for payment or a bill of quantities. For contractual quantities, the surveyor’s measurements and the terms of the specification remain decisive.",
            ],
          },
        ],
      },
      de: {
        titel: "Erdbau und Massen",
        samenvatting:
          "Ein Planungsmodell steuert nicht nur die Maschine, es hilft auch, den Erdbau zu verstehen: wo abgetragen, wo aufgefüllt wird und wie viel. Was eine solche Massenberechnung aussagt und was nicht.",
        secties: [
          {
            kop: "Zwei Oberflächen vergleichen",
            tekst: [
              "Ein Volumen entsteht durch den Vergleich zweier Oberflächen: des bestehenden Geländes, wie es aufgenommen wurde, und der Planungsoberfläche. An jeder Stelle wird der Höhenunterschied zwischen beiden bestimmt und über den gesamten Arbeitsbereich aufsummiert.",
              "Liegt das bestehende Gelände höher als die Planung, muss Boden weg: das ist Abtrag. Liegt es tiefer, muss Boden hinzu: das ist Auftrag. Eine Karte mit beiden Zonen in Farbe zeigt auf einen Blick, wo die Schwerpunkte der Arbeiten liegen.",
            ],
          },
          {
            kop: "Massenbilanz",
            tekst: [
              "Die Massenbilanz stellt das gesamte Abtragsvolumen dem gesamten Auftragsvolumen gegenüber. Gibt es mehr Abtrag als Auftrag, bleibt Boden übrig, der abgefahren werden muss. Gibt es mehr Auftrag, muss Material angeliefert werden.",
              "Dabei spielt mit, dass Boden sein Volumen verändert. Gelöster Boden nimmt mehr Raum ein als im gewachsenen Zustand (Auflockerung), verdichteter Boden weniger. Zudem ist nicht jeder Aushub zur Wiederverwendung geeignet. Eine geometrische Bilanz ist daher ein Ausgangspunkt für die Planung von Transport und Material, nicht die endgültige Antwort.",
            ],
          },
          {
            kop: "Schichten und warum die Dicke zählt",
            tekst: [
              "Unter einer Befestigung liegen meist mehrere Schichten, etwa eine Frostschutzschicht und eine Tragschicht. Jede Schicht hat eine planmäßige Dicke. Wird bis zur Fertighöhe statt bis zur Unterkante des Aufbaus gerechnet, wird der Abtrag unterschätzt.",
              "Deshalb werden die Schichten am besten als separate Oberflächen modelliert. So lässt sich das Abtragsvolumen bis zum Planum bestimmen und für jede Schicht die benötigte Materialmenge. Ein Unterschied von wenigen Zentimetern in der Schichtdicke wirkt klein, summiert sich auf einer großen Fläche aber schnell.",
            ],
          },
          {
            kop: "Richtwert, keine Garantie",
            tekst: [
              "Ein Volumen ist nie genauer als die Oberflächen, aus denen es berechnet wurde. Eine Aufnahme mit wenigen Punkten, eine veraltete Aufnahme oder ein seither verändertes Gelände ergibt ein Volumen, das von der Wirklichkeit abweicht. Auch Bewuchs, Zwischenlager oder Wasser zum Zeitpunkt der Aufnahme beeinflussen das Ergebnis.",
              "Volumen aus dem Modell sind daher ein Nebenprodukt der Modellierung und haben Richtwertcharakter. Sie helfen beim Schätzen und Planen, sind aber keine garantierten Mengen für Abrechnung oder Aufmaß. Für vertragliche Mengen bleiben die Aufnahme durch einen Vermesser und die Vereinbarungen im Leistungsverzeichnis maßgebend.",
            ],
          },
        ],
      },
      es: {
        titel: "Movimiento de tierras y volúmenes",
        samenvatting:
          "Un modelo de diseño no solo guía la máquina: también ayuda a entender el movimiento de tierras, es decir, dónde hay desmonte, dónde hay terraplén y cuánto. Qué dice un cálculo de volúmenes y qué no dice.",
        secties: [
          {
            kop: "Comparar dos superficies",
            tekst: [
              "Un volumen se obtiene comparando dos superficies: el terreno existente, tal como se ha levantado, y la superficie de diseño. En cada punto se determina la diferencia de cota entre ambas y se suma sobre toda la zona de trabajo.",
              "Si el terreno existente está más alto que el diseño, hay que retirar material: es el desmonte. Si está más bajo, hay que aportarlo: es el terraplén. Un mapa con ambas zonas en color muestra de un vistazo dónde se concentran los trabajos.",
            ],
          },
          {
            kop: "Compensación de tierras",
            tekst: [
              "La compensación de tierras contrapone el volumen total de desmonte al volumen total de terraplén. Si hay más desmonte que terraplén, sobra material que debe llevarse fuera de la obra. Si hay más terraplén, hay que traer material.",
              "Hay que tener en cuenta además que el suelo cambia de volumen. El material excavado ocupa más espacio que en su estado natural (esponjamiento), y el compactado, menos. Además, no todo el material excavado es apto para reutilizarse. Un balance geométrico es, por tanto, un punto de partida para planificar transporte y materiales, no la respuesta definitiva.",
            ],
          },
          {
            kop: "Las capas y por qué cuenta el espesor",
            tekst: [
              "Bajo un pavimento suele haber varias capas, como una subbase y una base. Cada capa tiene un espesor de proyecto. Si se calcula hasta la cota terminada en lugar de hasta el fondo del paquete de firme, el desmonte se subestima.",
              "Por eso conviene modelar las capas como superficies separadas. Así se puede determinar el volumen de desmonte hasta la explanada y el volumen de material necesario para cada capa. Unos centímetros de diferencia en el espesor parecen poco, pero sobre una superficie grande se acumulan rápidamente.",
            ],
          },
          {
            kop: "Orientativo, no una garantía",
            tekst: [
              "Un volumen nunca es más preciso que las superficies con las que se calcula. Un levantamiento con pocos puntos, un levantamiento antiguo o un terreno que ha cambiado desde entonces dan un volumen que se aparta de la realidad. La vegetación, los acopios temporales o el agua en el momento del levantamiento también influyen en el resultado.",
              "Los volúmenes del modelo son, por tanto, un subproducto del trabajo de modelado y tienen un valor orientativo. Ayudan a estimar y planificar, pero no son cantidades garantizadas para certificaciones ni mediciones. Para las cantidades contractuales, siguen siendo determinantes el levantamiento de un topógrafo y lo establecido en el pliego de condiciones.",
            ],
          },
        ],
      },
    },
  },
];

export function kennisArtikel(slug: string) {
  return KENNIS.find((a) => a.slug === slug) ?? null;
}
