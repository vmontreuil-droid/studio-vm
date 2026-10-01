import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Check, FileUp, Layers, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Onderdeel = { titel: string; tekst: string; punten: string[]; beeld: string; donker?: string };

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    eyebrow: string;
    titel: string;
    intro: string;
    onderdelen: Onderdeel[];
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
      title: "3D-modellen voor machinesturing — wat ik lever | Studio VM",
      description: "Ontwerpoppervlak, lijnwerk, hoogtelijnen en lagen per fase — geleverd in het formaat van al uw machinesturingen, in het juiste coördinatenstelsel.",
    },
    eyebrow: "3D-modellen",
    titel: "Wat zit er in een model?",
    intro: "Een goed machinesturingsmodel is meer dan een oppervlak. Het is een volledig, gecontroleerd ontwerp dat uw machinist op het scherm begrijpt en waarop de machine nauwkeurig stuurt.",
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
    formatenEyebrow: "Formaten",
    formatenTitel: "Eén model, al uw systemen",
    formatenTekst: "Werkt u met machines van verschillende merken? Kies ze allemaal bij uw aanvraag. U krijgt het model in het formaat van elk systeem, zonder meerprijs.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML en DXF voor andere systemen en uw landmeter", "Altijd in het coördinatenstelsel en de hoogtereferentie van de werf", "Te downloaden in uw klantenportaal, met elke revisie"],
    verantwKop: "Belangrijk",
    verantw: "Ik lever het 3D-model. De werking, instelling en kalibratie van uw machinesturing en de controle op de werf blijven uw verantwoordelijkheid. Controleer het model vóór de start op een gekend punt.",
    tarievenLink: "Bekijk de tarieven",
    cta: { eyebrow: "Klaar om te starten?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Laad uw plannen op, geef het werfadres en kies uw machinesturingen.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: {
      title: "Modèles 3D pour le guidage d'engins — ce que je livre | Studio VM",
      description: "Surface de projet, filaire, courbes de niveau et couches par phase — livrés dans le format de tous vos systèmes de guidage, dans le bon système de coordonnées.",
    },
    eyebrow: "Modèles 3D",
    titel: "Que contient un modèle ?",
    intro: "Un bon modèle de guidage est plus qu'une surface. C'est un projet complet et contrôlé, que votre conducteur comprend à l'écran et sur lequel la machine se guide avec précision.",
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
    formatenEyebrow: "Formats",
    formatenTitel: "Un modèle, tous vos systèmes",
    formatenTekst: "Vous travaillez avec des machines de plusieurs marques ? Choisissez-les toutes dans votre demande. Vous recevez le modèle dans le format de chaque système, sans supplément.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML et DXF pour d'autres systèmes et votre géomètre", "Toujours dans le système de coordonnées et la référence altimétrique du chantier", "À télécharger dans votre espace client, avec chaque révision"],
    verantwKop: "Important",
    verantw: "Je livre le modèle 3D. Le fonctionnement, le réglage et la calibration de votre guidage ainsi que le contrôle sur chantier restent sous votre responsabilité. Vérifiez le modèle sur un point connu avant de commencer.",
    tarievenLink: "Voir les tarifs",
    cta: { eyebrow: "Prêt à démarrer ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Chargez vos plans, indiquez l'adresse du chantier et choisissez vos systèmes de guidage.", knop: "Demander un devis" },
  },
  en: {
    meta: {
      title: "3D models for machine control — what I deliver | Studio VM",
      description: "Design surface, linework, contour lines and layers per phase — delivered in the format of all your machine control systems, in the right coordinate system.",
    },
    eyebrow: "3D models",
    titel: "What is in a model?",
    intro: "A good machine control model is more than a surface. It is a complete, checked design that your operator understands on screen and that the machine guides on accurately.",
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
    formatenEyebrow: "Formats",
    formatenTitel: "One model, all your systems",
    formatenTekst: "Running machines from different brands? Pick them all in your request. You get the model in each system's format at no extra cost.",
    formatenPunten: ["Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar", "LandXML and DXF for other systems and your surveyor", "Always in the site's coordinate system and height datum", "Download in your client portal, with every revision"],
    verantwKop: "Important",
    verantw: "I deliver the 3D model. The operation, setup and calibration of your machine control and the checks on site remain your responsibility. Check the model on a known point before you start.",
    tarievenLink: "See the rates",
    cta: { eyebrow: "Ready to start?", titel: "Send your plans, get a tailored quote", sub: "Upload your plans, give the site address and pick your machine control systems.", knop: "Request a quote" },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { ...T[locale].meta, alternates: { canonical: `https://studio-vm.be/${locale}/3d-modellen` } };
}

export default async function ModellenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.titel}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{t.intro}</p>
          </div>
        </div>
      </section>

      {t.onderdelen.map((o, i) => (
        <section key={o.titel} className={`reveal-on-scroll border-b ${i % 2 ? "bg-card" : ""}`}>
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                <Layers className="mr-2 inline h-4 w-4" strokeWidth={1.5} />
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{o.titel}</h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">{o.tekst}</p>
              <ul className="mt-6 space-y-2.5">
                {o.punten.map((p) => (
                  <li key={p} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl border bg-[#0b1220] ${i % 2 ? "lg:order-1" : ""}`}>
              <Image src={o.beeld} alt={o.titel} fill sizes="(max-width: 1024px) 100vw, 50vw" className={`${o.donker ? "alleen-licht " : ""}object-cover`} />
              {o.donker && <Image src={o.donker} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="alleen-donker object-cover" />}
            </div>
          </div>
        </section>
      ))}

      <section className="reveal-on-scroll border-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <MonitorSmartphone className="h-4 w-4" strokeWidth={1.5} />
              {t.formatenEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.formatenTitel}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t.formatenTekst}</p>
            <ul className="mt-6 space-y-2.5">
              {t.formatenPunten.map((p) => (
                <li key={p} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={localePath(locale, "/offerte")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90">
                <FileUp className="h-4 w-4" strokeWidth={2} />
                {t.cta.knop}
              </Link>
              <Link href={localePath(locale, "/tarieven")} className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium hover:bg-card-hover">
                {t.tarievenLink}
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
