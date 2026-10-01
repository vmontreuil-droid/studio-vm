// ─────────────────────────────────────────────────────────────────────────
// Kennisbank — 3D-ontwerpmodellen voor GPS-machinesturing.
//
// Drietalig (nl/fr/en). De slug blijft Nederlands en is in alle talen gelijk.
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
              "Ja. Modellen worden gemaakt voor werven in heel Europa, in het coördinatenstelsel en de hoogtereferentie van het betrokken land of in een lokaal stelsel naar keuze. Communicatie kan in het Nederlands, Frans of Engels.",
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
              "Oui. Les modèles sont réalisés pour des chantiers dans toute l’Europe, dans le système de coordonnées et la référence altimétrique du pays concerné ou dans un système local de votre choix. Les échanges peuvent se faire en néerlandais, en français ou en anglais.",
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
              "Yes. Models are produced for sites across Europe, in the coordinate system and height datum of the country concerned or in a local system of your choice. Communication is possible in Dutch, French or English.",
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
