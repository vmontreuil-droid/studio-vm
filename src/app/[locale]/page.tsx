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
} from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { CtaBanner } from "@/components/cta-banner";
import { HeroCarrousel } from "@/components/hero-carrousel";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

/* ─────────────────────────────────────────────────────────────────────────
 * Studio VM — 3D-modellen voor machinesturing.
 * Alle teksten van deze pagina staan in X (nl/fr/en). Beelden in /public/3d.
 * ───────────────────────────────────────────────────────────────────────── */

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
    stappenEyebrow: string;
    stappenTitel: string;
    stappenIntro: string;
    stappen: Stap[];
    toepEyebrow: string;
    toepTitel: string;
    toepIntro: string;
    toep: Kaart[];
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
    sub: "Ik zet uw 2D-plannen om in nauwkeurige 3D-ontwerpmodellen die uw GPS-gestuurde kraan, grader of dozer meteen inleest — in het formaat van uw machine en in het juiste coördinatenstelsel, overal in Europa.",
    beloftes: [
      "Geleverd in het formaat van uw machine",
      "Juist coördinatenstelsel per land",
      "Gecontroleerd vóór levering",
    ],
    ctaOfferte: "Offerte aanvragen",
    ctaWerkwijze: "Zo werkt het",
    merkenTitel: "Voor alle gangbare machinesturingen",
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
    stappenEyebrow: "Werkwijze",
    stappenTitel: "In vier stappen van plan naar machine",
    stappenIntro: "U stuurt plannen, ik lever een model dat klaar is om in te laden. Geen software te leren, geen licenties te kopen.",
    stappen: [
      { titel: "Plannen opsturen", tekst: "PDF, DWG, DXF of LandXML — samen met het adres van de werf en het merk van uw machinesturing." },
      { titel: "Offerte op maat", tekst: "U krijgt een duidelijke prijs en leverdatum, op basis van uw plannen." },
      { titel: "Modelleren en controleren", tekst: "Ik bouw het 3D-model en controleer niveaus, hellingen en aansluitingen." },
      { titel: "Klaar voor de machine", tekst: "Levering in het formaat van uw machine, in het coördinatenstelsel van de werf." },
    ],
    toepEyebrow: "Toepassingen",
    toepTitel: "Van bouwput tot wegtracé",
    toepIntro: "Elk project waar een machine met GPS-sturing op het juiste niveau moet graven, egaliseren of aanleggen.",
    toep: [
      { titel: "Grondwerk en platformen", tekst: "Bedrijfsterreinen, verkavelingen en funderingsplatformen.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Wegenis en tracés", tekst: "Wegen, fietspaden en opritten met hun profielen.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Bouwputten", tekst: "Uitgravingen met taluds en werkvloeren op niveau.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Parkings en verhardingen", tekst: "Afwatering en hellingen tot op de centimeter.", beeld: "/3d/model-parking.jpg" },
    ],
    stelselEyebrow: "Overal in Europa",
    stelselTitel: "Het juiste stelsel, vanaf het werfadres",
    stelselTekst:
      "Een model in het verkeerde coördinatenstelsel ligt naast de werf. Daarom vraag ik bij elke aanvraag het adres van de werf: daaruit volgt meteen het stelsel en het hoogtereferentiekader van dat land.",
    stelselVoorbeelden: [
      { land: "België", stelsel: "Lambert 72 / 2008 · TAW" },
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
    sub: "Je transforme vos plans 2D en modèles 3D précis que votre pelle, niveleuse ou bouteur à guidage GPS charge directement — dans le format de votre machine et dans le bon système de coordonnées, partout en Europe.",
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
    stappenEyebrow: "Méthode",
    stappenTitel: "Du plan à la machine en quatre étapes",
    stappenIntro: "Vous envoyez les plans, je livre un modèle prêt à charger. Aucun logiciel à apprendre, aucune licence à acheter.",
    stappen: [
      { titel: "Envoyer les plans", tekst: "PDF, DWG, DXF ou LandXML — avec l'adresse du chantier et la marque de votre guidage." },
      { titel: "Devis sur mesure", tekst: "Vous recevez un prix et un délai clairs, sur base de vos plans." },
      { titel: "Modélisation et contrôle", tekst: "Je construis le modèle 3D et vérifie niveaux, pentes et raccords." },
      { titel: "Prêt pour la machine", tekst: "Livraison dans le format de votre machine, dans le système de coordonnées du chantier." },
    ],
    toepEyebrow: "Applications",
    toepTitel: "De la fouille au tracé routier",
    toepIntro: "Tout projet où une machine guidée par GPS doit creuser, régler ou poser au bon niveau.",
    toep: [
      { titel: "Terrassements et plateformes", tekst: "Zones d'activité, lotissements et plateformes de fondation.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Voiries et tracés", tekst: "Routes, pistes cyclables et accès avec leurs profils.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Fouilles", tekst: "Excavations avec talus et fonds de fouille à niveau.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Parkings et revêtements", tekst: "Écoulements et pentes au centimètre.", beeld: "/3d/model-parking.jpg" },
    ],
    stelselEyebrow: "Partout en Europe",
    stelselTitel: "Le bon système, dès l'adresse du chantier",
    stelselTekst:
      "Un modèle dans le mauvais système de coordonnées tombe à côté du chantier. C'est pourquoi je demande l'adresse du chantier : elle détermine aussitôt le système et la référence altimétrique du pays.",
    stelselVoorbeelden: [
      { land: "Belgique", stelsel: "Lambert 72 / 2008 · DNG" },
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
    sub: "I turn your 2D plans into accurate 3D design models that your GPS-guided excavator, grader or dozer loads straight away — in your machine's format and in the right coordinate system, anywhere in Europe.",
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
    stappenEyebrow: "How it works",
    stappenTitel: "From plan to machine in four steps",
    stappenIntro: "You send the plans, I deliver a model that is ready to load. No software to learn, no licences to buy.",
    stappen: [
      { titel: "Send your plans", tekst: "PDF, DWG, DXF or LandXML — with the site address and the brand of your machine control." },
      { titel: "Tailored quote", tekst: "You get a clear price and delivery date, based on your plans." },
      { titel: "Modelling and checks", tekst: "I build the 3D model and check levels, slopes and tie-ins." },
      { titel: "Ready for the machine", tekst: "Delivered in your machine's format, in the site's coordinate system." },
    ],
    toepEyebrow: "Applications",
    toepTitel: "From excavation to road alignment",
    toepIntro: "Any project where a GPS-guided machine has to dig, grade or lay to the right level.",
    toep: [
      { titel: "Earthworks and platforms", tekst: "Industrial sites, housing plots and foundation platforms.", beeld: "/3d/model-bedrijfsterrein.jpg" },
      { titel: "Roads and alignments", tekst: "Roads, cycle paths and driveways with their profiles.", beeld: "/3d/trace-weg.jpg" },
      { titel: "Excavations", tekst: "Pits with embankments and formation levels.", beeld: "/3d/model-platform-hoogte.jpg" },
      { titel: "Car parks and paving", tekst: "Drainage falls and slopes to the centimetre.", beeld: "/3d/model-parking.jpg" },
    ],
    stelselEyebrow: "Anywhere in Europe",
    stelselTitel: "The right system, from the site address",
    stelselTekst:
      "A model in the wrong coordinate system ends up next to the site. That is why I ask for the site address with every request: it immediately tells me the country's coordinate system and height datum.",
    stelselVoorbeelden: [
      { land: "Belgium", stelsel: "Lambert 72 / 2008 · TAW" },
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
};

const MERKEN = ["Trimble", "Topcon", "Leica", "Unicontrol", "CHCNAV", "Komatsu", "Caterpillar"];

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
      <Hero locale={locale} x={x} />
      <Merken x={x} />
      <Levering x={x} />
      <Werkwijze x={x} />
      <Toepassingen x={x} />
      <Stelsels locale={locale} x={x} />
      <CtaBanner
        locale={locale}
        eyebrow={x.ctaEyebrow}
        title={x.ctaTitel}
        sub={x.ctaSub}
        button={x.ctaKnop}
      />
      <Contact t={t} />
    </main>
  );
}

type T = ReturnType<typeof getMessages>;
type Xt = (typeof X)[Locale];

function Hero({ locale, x }: { locale: Locale; x: Xt }) {
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
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:py-32">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
            {x.eyebrow}
          </p>
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {x.titel}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
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

function Merken({ x }: { x: Xt }) {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted">
          {x.merkenTitel}
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {MERKEN.map((m) => (
            <li key={m} className="text-lg font-semibold tracking-tight text-foreground/70">
              {m}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-xs text-muted">{x.merkenNoot}</p>
      </div>
    </section>
  );
}

function Levering({ x }: { x: Xt }) {
  return (
    <section className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <SectieKop eyebrow={x.leverEyebrow} titel={x.leverTitel} intro={x.leverIntro} />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {x.lever.map((k, i) => (
            <article key={k.titel} className="group overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0b1220]">
                <Image
                  src={k.beeld}
                  alt={k.titel}
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
      </div>
    </section>
  );
}

const STAP_ICONEN = [FileUp, Calculator, Layers, Send];

function Werkwijze({ x }: { x: Xt }) {
  return (
    <section id="werkwijze" className="reveal-on-scroll scroll-mt-24 border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <SectieKop eyebrow={x.stappenEyebrow} titel={x.stappenTitel} intro={x.stappenIntro} />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {x.stappen.map((s, i) => {
            const Icoon = STAP_ICONEN[i];
            return (
              <li key={s.titel} className="relative bg-background p-8">
                <div className="flex items-center justify-between">
                  <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <span className="font-mono text-3xl font-semibold text-foreground/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-semibold tracking-tight">{s.titel}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.tekst}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Toepassingen({ x }: { x: Xt }) {
  return (
    <section className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
        <SectieKop eyebrow={x.toepEyebrow} titel={x.toepTitel} intro={x.toepIntro} />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {x.toep.map((k) => (
            <article
              key={k.titel}
              className="group relative isolate aspect-[16/10] overflow-hidden rounded-3xl border bg-[#0b1220]"
            >
              <Image
                src={k.beeld}
                alt={k.titel}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16 text-white">
                <h3 className="text-xl font-semibold tracking-tight">{k.titel}</h3>
                <p className="mt-1 text-sm text-white/80">{k.tekst}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stelsels({ locale, x }: { locale: Locale; x: Xt }) {
  return (
    <section className="reveal-on-scroll border-b bg-card">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <Globe2 className="h-4 w-4" strokeWidth={1.5} />
            {x.stelselEyebrow}
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
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
        <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
          {x.stelselVoorbeelden.map((v) => (
            <li key={v.land} className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="flex items-center gap-3 font-medium">
                <Crosshair className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {v.land}
              </span>
              <span className="text-right font-mono text-xs text-muted">{v.stelsel}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SectieKop({ eyebrow, titel, intro }: { eyebrow: string; titel: string; intro: string }) {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{titel}</h2>
      <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>
    </div>
  );
}

function Contact({ t }: { t: T }) {
  return (
    <section id="contact" className="reveal-on-scroll border-b">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.contact.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.contact.title}
            </h2>
            <p className="mt-6 max-w-xl text-muted">{t.contact.intro}</p>
            <div className="mt-8 space-y-3">
              <a
                href="mailto:info@studio-vm.be"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.5} />
                info@studio-vm.be
              </a>
              <a
                href="tel:+32477995651"
                className="flex items-center gap-3 text-sm transition-colors hover:text-accent"
              >
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.5} />
                +32 477 99 56 51
              </a>
              <p className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />
                {t.contact.location}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <ContactForm t={t.contactForm} />
          </div>
        </div>
      </div>
    </section>
  );
}
