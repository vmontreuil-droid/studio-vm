import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquare, Crosshair, Clock, ShieldCheck, Globe2 } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { JsonLd } from "@/components/json-ld";
import { getMessages } from "@/lib/i18n";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { KRUIMEL, paginaMeta } from "@/lib/seo";
import { ID, graph, kruimels, siteNodes, webPagina } from "@/lib/schema";
import { BEDRIJF, FUNCTIE } from "@/lib/bedrijf";

// /over gaat over Studio VM, niet over een persoon: geen naam, geen foto.
// De wettelijke identiteit (naam van de eenmanszaak) staat in de footer, de
// voorwaarden en de privacyverklaring.

const PAD = "/over";

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    titel: string;
    lead: string;
    ervaring: string;
    verhaal: string[];
    waardenKop: string;
    waarden: { titel: string; tekst: string }[];
    werkgebiedKop: string;
    werkgebied: string;
    cta: { eyebrow: string; titel: string; sub: string; knop: string };
  }
> = {
  nl: {
    meta: {
      title: "Over Studio VM: 3D-modellen voor machinesturing uit België",
      description: "Studio VM (Anzegem, België) maakt 3D-modellen voor GPS-gestuurde machines, voor aannemers in heel Europa. Rechtstreeks contact, gecontroleerd werk.",
    },
    titel: "Over Studio VM: één aanspreekpunt, van plan tot model",
    lead: "Studio VM maakt vanuit Anzegem (West-Vlaanderen, België) 3D-modellen voor machinesturing, voor aannemers in heel Europa.",
    ervaring: "Achter Studio VM staat een topograaf met meer dan twintig jaar ervaring in 3D-machinesturing.",
    verhaal: [
      "Een GPS-gestuurde machine is maar zo goed als het model dat erin zit. Een verkeerd niveau, een vergeten breeklijn of een model in het verkeerde coördinatenstelsel — en de kraan graaft netjes op de verkeerde plek. Daar draait ons werk om: modellen die kloppen, gecontroleerd vóór ze de deur uitgaan.",
      "U stuurt uw plannen, wij bouwen het model en leveren het in het formaat van uw machinesturing. Werkt u met meerdere merken? Dan krijgt u het model voor elk systeem. Geen software om te leren, geen licenties om te kopen.",
      "Studio VM is bewust klein. U spreekt rechtstreeks met wie het model maakt — geen tussenpersonen, geen doorschakelen. Dat maakt het sneller, duidelijker en betaalbaarder.",
    ],
    waardenKop: "Hoe we werken",
    waarden: [
      { titel: "Rechtstreeks contact", tekst: "U praat met wie het model maakt. Vragen over een niveau of een detail zijn meteen opgelost." },
      { titel: "Nauwkeurig en gecontroleerd", tekst: "Niveaus, hellingen en aansluitingen worden nagekeken vóór levering." },
      { titel: "Duidelijke termijnen", tekst: "Vroegtijdig, normaal of last-minute: u weet vooraf wanneer u levering krijgt en wat het kost." },
      { titel: "Eerlijke verdeling van taken", tekst: "Wij leveren het model; u blijft baas over uw machine, uw kalibratie en de controle op de werf." },
    ],
    werkgebiedKop: "Werkgebied: heel Europa",
    werkgebied: "Modellen worden digitaal aangeleverd, dus de afstand speelt geen rol. We werken in het nationale coördinatenstelsel en de hoogtereferentie van elk land — van Lambert 72 tot UTM.",
    cta: { eyebrow: "Samenwerken?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: `Of bel gewoon even: ${BEDRIJF.telefoon}.`, knop: "Offerte aanvragen" },
  },
  fr: {
    meta: {
      title: "À propos de Studio VM : modèles 3D de guidage d'engins",
      description: "Studio VM (Anzegem, Belgique) réalise des modèles 3D pour engins guidés par GPS, partout en Europe. Contact direct, travail contrôlé, délais clairs.",
    },
    titel: "À propos de Studio VM : un seul interlocuteur, du plan au modèle",
    lead: "Depuis Anzegem (Flandre-Occidentale, Belgique), Studio VM réalise des modèles 3D pour le guidage d'engins, pour des entrepreneurs dans toute l'Europe.",
    ervaring: "Derrière Studio VM se trouve un topographe qui compte plus de vingt ans d'expérience dans le guidage d'engins 3D.",
    verhaal: [
      "Une machine guidée par GPS ne vaut que par le modèle qu'elle contient. Un mauvais niveau, une ligne de rupture oubliée ou un modèle dans le mauvais système de coordonnées — et la pelle creuse proprement au mauvais endroit. C'est le cœur de notre travail : des modèles justes, contrôlés avant de partir.",
      "Vous envoyez vos plans, nous construisons le modèle et le livrons dans le format de votre guidage. Vous travaillez avec plusieurs marques ? Vous recevez le modèle pour chaque système. Aucun logiciel à apprendre, aucune licence à acheter.",
      "Studio VM reste volontairement petit. Vous parlez directement à celui qui réalise le modèle — sans intermédiaires. C'est plus rapide, plus clair et plus abordable.",
    ],
    waardenKop: "Notre façon de travailler",
    waarden: [
      { titel: "Contact direct", tekst: "Vous parlez à celui qui réalise le modèle. Une question sur un niveau ou un détail se règle aussitôt." },
      { titel: "Précis et contrôlé", tekst: "Niveaux, pentes et raccords sont vérifiés avant livraison." },
      { titel: "Délais clairs", tekst: "Anticipé, normal ou urgent : vous savez à l'avance quand vous êtes livré et ce que ça coûte." },
      { titel: "Rôles bien définis", tekst: "Nous livrons le modèle ; vous restez maître de votre machine, de votre calibration et du contrôle sur chantier." },
    ],
    werkgebiedKop: "Zone d'activité : toute l'Europe",
    werkgebied: "Les modèles sont livrés numériquement, la distance ne compte pas. Nous travaillons dans le système de coordonnées national et la référence altimétrique de chaque pays — de Lambert 72 à UTM.",
    cta: { eyebrow: "Travailler ensemble ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: `Ou appelez simplement : ${BEDRIJF.telefoon}.`, knop: "Demander un devis" },
  },
  en: {
    meta: {
      title: "About Studio VM: machine control 3D models from Belgium",
      description: "Studio VM (Anzegem, Belgium) creates 3D models for GPS-guided machines for contractors across Europe. Direct contact, checked work, clear lead times.",
    },
    titel: "About Studio VM: one point of contact, from plan to model",
    lead: "From Anzegem (West Flanders, Belgium), Studio VM creates 3D models for machine control for contractors across Europe.",
    ervaring: "Behind Studio VM is a topographer with more than twenty years of experience in 3D machine control.",
    verhaal: [
      "A GPS-guided machine is only as good as the model inside it. A wrong level, a missing breakline or a model in the wrong coordinate system — and the excavator digs neatly in the wrong place. That is what our work is about: models that are right, checked before they leave.",
      "You send your plans, we build the model and deliver it in your machine control's format. Running several brands? You get the model for every system. No software to learn, no licences to buy.",
      "Studio VM is deliberately small. You talk directly to the person who builds the model — no middlemen. That makes it faster, clearer and more affordable.",
    ],
    waardenKop: "How we work",
    waarden: [
      { titel: "Direct contact", tekst: "You talk to the person who builds the model. A question about a level or a detail is solved straight away." },
      { titel: "Precise and checked", tekst: "Levels, slopes and tie-ins are checked before delivery." },
      { titel: "Clear lead times", tekst: "Early, standard or last-minute: you know up front when you get the model and what it costs." },
      { titel: "Clear roles", tekst: "We deliver the model; you stay in charge of your machine, your calibration and the checks on site." },
    ],
    werkgebiedKop: "Working area: all of Europe",
    werkgebied: "Models are delivered digitally, so distance doesn't matter. We work in each country's national coordinate system and height datum — from Lambert 72 to UTM.",
    cta: { eyebrow: "Work together?", titel: "Send your plans, get a tailored quote", sub: `Or just call: ${BEDRIJF.telefoon}.`, knop: "Request a quote" },
  },
  de: {
    meta: {
      title: "Über Studio VM: 3D-Modelle für Maschinensteuerung aus Belgien",
      description: "Studio VM (Anzegem, Belgien) erstellt 3D-Modelle für GPS-gesteuerte Maschinen, europaweit. Direkter Kontakt, geprüfte Arbeit, klare Fristen.",
    },
    titel: "Über Studio VM: ein Ansprechpartner, vom Plan bis zum Modell",
    lead: "Von Anzegem (Westflandern, Belgien) aus erstellt Studio VM 3D-Modelle für Maschinensteuerung, für Bauunternehmen in ganz Europa.",
    ervaring: "Hinter Studio VM steht ein Topograf mit mehr als zwanzig Jahren Erfahrung in der 3D-Maschinensteuerung.",
    verhaal: [
      "Eine GPS-gesteuerte Maschine ist nur so gut wie das Modell, das in ihr steckt. Eine falsche Höhe, eine vergessene Bruchkante oder ein Modell im falschen Koordinatensystem — und der Bagger gräbt sauber an der falschen Stelle. Darum dreht sich unsere Arbeit: Modelle, die stimmen, geprüft, bevor sie das Haus verlassen.",
      "Sie senden Ihre Pläne, wir erstellen das Modell und liefern es im Format Ihrer Maschinensteuerung. Sie arbeiten mit mehreren Marken? Dann erhalten Sie das Modell für jedes System. Keine Software zu lernen, keine Lizenzen zu kaufen.",
      "Studio VM ist bewusst klein. Sie sprechen direkt mit demjenigen, der das Modell erstellt — ohne Zwischenstellen, ohne Weiterverbinden. Das macht es schneller, klarer und günstiger.",
    ],
    waardenKop: "Wie wir arbeiten",
    waarden: [
      { titel: "Direkter Kontakt", tekst: "Sie sprechen mit demjenigen, der das Modell erstellt. Fragen zu einer Höhe oder einem Detail sind sofort geklärt." },
      { titel: "Präzise und geprüft", tekst: "Höhen, Neigungen und Anschlüsse werden vor der Lieferung geprüft." },
      { titel: "Klare Fristen", tekst: "Frühzeitig, normal oder kurzfristig: Sie wissen vorab, wann Sie das Modell erhalten und was es kostet." },
      { titel: "Klare Aufgabenteilung", tekst: "Wir liefern das Modell; Sie behalten die Hoheit über Ihre Maschine, Ihre Kalibrierung und die Kontrolle auf der Baustelle." },
    ],
    werkgebiedKop: "Einsatzgebiet: ganz Europa",
    werkgebied: "Modelle werden digital geliefert, die Entfernung spielt also keine Rolle. Wir arbeiten im nationalen Koordinatensystem und Höhenbezug jedes Landes — von Lambert 72 bis UTM.",
    cta: { eyebrow: "Zusammenarbeiten?", titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot", sub: `Oder rufen Sie einfach an: ${BEDRIJF.telefoon}.`, knop: "Angebot anfordern" },
  },
  es: {
    meta: {
      title: "Sobre Studio VM: modelos 3D para maquinaria desde Bélgica",
      description: "Studio VM (Anzegem, Bélgica) crea modelos 3D para máquinas guiadas por GPS en toda Europa. Contacto directo, trabajo comprobado y plazos claros.",
    },
    titel: "Sobre Studio VM: un único interlocutor, del plano al modelo",
    lead: "Desde Anzegem (Flandes Occidental, Bélgica), Studio VM crea modelos 3D para control de maquinaria, para contratistas de toda Europa.",
    ervaring: "Detrás de Studio VM hay un topógrafo con más de veinte años de experiencia en control de maquinaria 3D.",
    verhaal: [
      "Una máquina guiada por GPS es tan buena como el modelo que lleva dentro. Una cota equivocada, una línea de ruptura olvidada o un modelo en el sistema de coordenadas incorrecto — y la excavadora excava con precisión en el lugar equivocado. De eso trata nuestro trabajo: modelos correctos, verificados antes de salir.",
      "Usted envía sus planos, nosotros construimos el modelo y lo entregamos en el formato de su sistema de control de maquinaria. ¿Trabaja con varias marcas? Recibe el modelo para cada sistema. Sin software que aprender ni licencias que comprar.",
      "Studio VM es pequeño a propósito. Usted habla directamente con quien hace el modelo — sin intermediarios ni transferencias. Eso lo hace más rápido, más claro y más asequible.",
    ],
    waardenKop: "Cómo trabajamos",
    waarden: [
      { titel: "Contacto directo", tekst: "Habla con quien hace el modelo. Una duda sobre una cota o un detalle se resuelve al instante." },
      { titel: "Preciso y verificado", tekst: "Cotas, pendientes y encuentros se comprueban antes de la entrega." },
      { titel: "Plazos claros", tekst: "Anticipado, normal o urgente: sabe de antemano cuándo recibe el modelo y cuánto cuesta." },
      { titel: "Funciones bien definidas", tekst: "Nosotros entregamos el modelo; usted sigue al mando de su máquina, su calibración y el control en obra." },
    ],
    werkgebiedKop: "Ámbito de trabajo: toda Europa",
    werkgebied: "Los modelos se entregan en formato digital, así que la distancia no importa. Trabajamos en el sistema de coordenadas nacional y la referencia altimétrica de cada país — de Lambert 72 a UTM.",
    cta: { eyebrow: "¿Trabajamos juntos?", titel: "Envíe sus planos y reciba un presupuesto a medida", sub: `O simplemente llame: ${BEDRIJF.telefoon}.`, knop: "Solicitar presupuesto" },
  },
};

const ICONEN = [MessageSquare, Crosshair, Clock, ShieldCheck];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, T[locale].meta);
}

export default async function OverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];
  const label = getMessages(locale).nav.over;
  const verder = [
    { href: localePath(locale, "/realisaties"), label: KRUIMEL["/realisaties"][locale] },
    { href: localePath(locale, "/kennis"), label: KRUIMEL["/kennis"][locale] },
  ];

  return (
    <main>
      <JsonLd
        data={graph(
          siteNodes(locale),
          kruimels(locale, PAD, [{ naam: label, pad: PAD }]),
          webPagina(locale, PAD, {
            type: "AboutPage",
            naam: t.meta.title,
            beschrijving: t.meta.description,
            about: ID.org,
            mainEntity: { "@id": ID.org },
          }),
        )}
      />
      <section className="border-b">
        <div className="wrap grid gap-8 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24 2xl:py-28">
          <div className="max-w-3xl lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{FUNCTIE[locale]}</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
            <p className="mt-6 text-xl leading-relaxed 2xl:text-2xl">{t.lead}</p>
            <p className="mt-4 text-lg leading-relaxed text-muted">{t.ervaring}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {verder.map((v) => (
                <li key={v.href}>
                  <Link href={v.href} className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
                    {v.label}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-muted lg:pt-10">
            {t.verhaal.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b bg-card">
        <div className="wrap py-20 2xl:py-24">
          <h2 className="text-3xl font-semibold tracking-tight 2xl:text-4xl">{t.waardenKop}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-8">
            {t.waarden.map((w, i) => {
              const Icoon = ICONEN[i];
              return (
                <div key={w.titel} className="rounded-2xl border bg-background p-6 2xl:p-8">
                  <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 font-semibold tracking-tight">{w.titel}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.tekst}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex gap-4 rounded-2xl border bg-background p-6 2xl:mt-8 2xl:p-8">
            <Globe2 className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} />
            <div className="max-w-4xl">
              <h3 className="font-semibold tracking-tight">{t.werkgebiedKop}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.werkgebied}</p>
            </div>
          </div>
        </div>
      </section>
      <CtaBanner locale={locale} eyebrow={t.cta.eyebrow} title={t.cta.titel} sub={t.cta.sub} button={t.cta.knop} />
    </main>
  );
}
