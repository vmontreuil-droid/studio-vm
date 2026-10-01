import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageSquare, Crosshair, Clock, ShieldCheck, Globe2 } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    meta: { title: string; description: string };
    eyebrow: string;
    titel: string;
    lead: string;
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
      title: "Over Vincent — 3D-modellen voor machinesturing | Studio VM",
      description: "Vincent Montreuil maakt 3D-modellen voor GPS-gestuurde machines, voor aannemers in heel Europa. Persoonlijk contact, nauwkeurig werk.",
    },
    eyebrow: "Over",
    titel: "Eén aanspreekpunt, van plan tot model",
    lead: "Ik ben Vincent Montreuil. Vanuit Anzegem (West-Vlaanderen) maak ik 3D-modellen voor machinesturing, voor aannemers in heel Europa.",
    verhaal: [
      "Een GPS-gestuurde machine is maar zo goed als het model dat erin zit. Een verkeerd niveau, een vergeten breeklijn of een model in het verkeerde coördinatenstelsel — en de kraan graaft netjes op de verkeerde plek. Daar draait mijn werk om: modellen die kloppen, gecontroleerd vóór ze de deur uitgaan.",
      "U stuurt uw plannen, ik bouw het model en lever het in het formaat van uw machinesturing. Werkt u met meerdere merken? Dan krijgt u het model voor elk systeem. Geen software om te leren, geen licenties om te kopen.",
      "Studio VM is bewust klein. U spreekt rechtstreeks met wie het model maakt — geen tussenpersonen, geen doorschakelen. Dat maakt het sneller, duidelijker en betaalbaarder.",
    ],
    waardenKop: "Hoe ik werk",
    waarden: [
      { titel: "Rechtstreeks contact", tekst: "U praat met wie het model maakt. Vragen over een niveau of een detail zijn meteen opgelost." },
      { titel: "Nauwkeurig en gecontroleerd", tekst: "Niveaus, hellingen en aansluitingen worden nagekeken vóór levering." },
      { titel: "Duidelijke termijnen", tekst: "Vroegtijdig, normaal of last-minute: u weet vooraf wanneer u levering krijgt en wat het kost." },
      { titel: "Eerlijke verdeling van taken", tekst: "Ik lever het model; u blijft baas over uw machine, uw kalibratie en de controle op de werf." },
    ],
    werkgebiedKop: "Werkgebied: heel Europa",
    werkgebied: "Modellen worden digitaal aangeleverd, dus de afstand speelt geen rol. Ik werk in het nationale coördinatenstelsel en de hoogtereferentie van elk land — van Lambert 72 tot UTM.",
    cta: { eyebrow: "Samenwerken?", titel: "Stuur uw plannen, ontvang een offerte op maat", sub: "Of bel gewoon even: +32 477 99 56 51.", knop: "Offerte aanvragen" },
  },
  fr: {
    meta: {
      title: "À propos de Vincent — modèles 3D pour le guidage d'engins | Studio VM",
      description: "Vincent Montreuil réalise des modèles 3D pour engins guidés par GPS, pour des entrepreneurs dans toute l'Europe. Contact personnel, travail précis.",
    },
    eyebrow: "À propos",
    titel: "Un seul interlocuteur, du plan au modèle",
    lead: "Je suis Vincent Montreuil. Depuis Anzegem (Flandre-Occidentale), je réalise des modèles 3D pour le guidage d'engins, pour des entrepreneurs dans toute l'Europe.",
    verhaal: [
      "Une machine guidée par GPS ne vaut que par le modèle qu'elle contient. Un mauvais niveau, une ligne de rupture oubliée ou un modèle dans le mauvais système de coordonnées — et la pelle creuse proprement au mauvais endroit. C'est le cœur de mon travail : des modèles justes, contrôlés avant de partir.",
      "Vous envoyez vos plans, je construis le modèle et le livre dans le format de votre guidage. Vous travaillez avec plusieurs marques ? Vous recevez le modèle pour chaque système. Aucun logiciel à apprendre, aucune licence à acheter.",
      "Studio VM reste volontairement petit. Vous parlez directement à celui qui réalise le modèle — sans intermédiaires. C'est plus rapide, plus clair et plus abordable.",
    ],
    waardenKop: "Ma façon de travailler",
    waarden: [
      { titel: "Contact direct", tekst: "Vous parlez à celui qui réalise le modèle. Une question sur un niveau ou un détail se règle aussitôt." },
      { titel: "Précis et contrôlé", tekst: "Niveaux, pentes et raccords sont vérifiés avant livraison." },
      { titel: "Délais clairs", tekst: "Anticipé, normal ou urgent : vous savez à l'avance quand vous êtes livré et ce que ça coûte." },
      { titel: "Rôles bien définis", tekst: "Je livre le modèle ; vous restez maître de votre machine, de votre calibration et du contrôle sur chantier." },
    ],
    werkgebiedKop: "Zone d'activité : toute l'Europe",
    werkgebied: "Les modèles sont livrés numériquement, la distance ne compte pas. Je travaille dans le système de coordonnées national et la référence altimétrique de chaque pays — de Lambert 72 à UTM.",
    cta: { eyebrow: "Travailler ensemble ?", titel: "Envoyez vos plans, recevez un devis sur mesure", sub: "Ou appelez simplement : +32 477 99 56 51.", knop: "Demander un devis" },
  },
  en: {
    meta: {
      title: "About Vincent — 3D models for machine control | Studio VM",
      description: "Vincent Montreuil creates 3D models for GPS-guided machines, for contractors across Europe. Personal contact, precise work.",
    },
    eyebrow: "About",
    titel: "One point of contact, from plan to model",
    lead: "I'm Vincent Montreuil. From Anzegem (West Flanders, Belgium) I create 3D models for machine control, for contractors across Europe.",
    verhaal: [
      "A GPS-guided machine is only as good as the model inside it. A wrong level, a missing breakline or a model in the wrong coordinate system — and the excavator digs neatly in the wrong place. That is what my work is about: models that are right, checked before they leave.",
      "You send your plans, I build the model and deliver it in your machine control's format. Running several brands? You get the model for every system. No software to learn, no licences to buy.",
      "Studio VM is deliberately small. You talk directly to the person who builds the model — no middlemen. That makes it faster, clearer and more affordable.",
    ],
    waardenKop: "How I work",
    waarden: [
      { titel: "Direct contact", tekst: "You talk to the person who builds the model. A question about a level or a detail is solved straight away." },
      { titel: "Precise and checked", tekst: "Levels, slopes and tie-ins are checked before delivery." },
      { titel: "Clear lead times", tekst: "Early, standard or last-minute: you know up front when you get the model and what it costs." },
      { titel: "Clear roles", tekst: "I deliver the model; you stay in charge of your machine, your calibration and the checks on site." },
    ],
    werkgebiedKop: "Working area: all of Europe",
    werkgebied: "Models are delivered digitally, so distance doesn't matter. I work in each country's national coordinate system and height datum — from Lambert 72 to UTM.",
    cta: { eyebrow: "Work together?", titel: "Send your plans, get a tailored quote", sub: "Or just call: +32 477 99 56 51.", knop: "Request a quote" },
  },
};

const ICONEN = [MessageSquare, Crosshair, Clock, ShieldCheck];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { ...T[locale].meta, alternates: { canonical: `https://studio-vm.be/${locale}/over` } };
}

export default async function OverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.titel}</h1>
          <p className="mt-6 text-xl leading-relaxed">{t.lead}</p>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted">
            {t.verhaal.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">{t.waardenKop}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.waarden.map((w, i) => {
              const Icoon = ICONEN[i];
              return (
                <div key={w.titel} className="rounded-2xl border bg-background p-6">
                  <Icoon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 font-semibold tracking-tight">{w.titel}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.tekst}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex gap-4 rounded-2xl border bg-background p-6">
            <Globe2 className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} />
            <div>
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
