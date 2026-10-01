import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, Crosshair } from "lucide-react";
import { Offerte3dFormulier } from "@/components/offerte-3d-formulier";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    eyebrow: string;
    titel: string;
    intro: string;
    naKop: string;
    na: string[];
    plannenKop: string;
    plannen: string[];
    stelselKop: string;
    stelsel: string;
  }
> = {
  nl: {
    eyebrow: "Offerte aanvragen",
    titel: "Stuur uw plannen, ontvang een offerte op maat",
    intro:
      "Vul het formulier in en laad uw plannen op. Met het werfadres en het merk van uw machinesturing weet ik meteen in welk stelsel en formaat het model geleverd moet worden.",
    naKop: "Wat gebeurt er daarna?",
    na: [
      "U krijgt meteen een bevestiging per mail.",
      "Ik bekijk uw plannen en stuur een offerte met prijs en leverdatum.",
      "Na uw akkoord maak ik het model en lever ik het klaar voor de machine.",
    ],
    plannenKop: "Wat stuurt u best mee?",
    plannen: [
      "Inplantingsplan en lengte-/dwarsprofielen",
      "Bij voorkeur DWG of DXF; PDF kan ook",
      "Bestaande opmeting van het terrein, als die er is",
    ],
    stelselKop: "Waarom het werfadres?",
    stelsel:
      "Elk land werkt met een eigen coördinatenstelsel en hoogtereferentie. Uit het adres leid ik het juiste stelsel af, zodat het model op de werf ligt en niet ernaast.",
  },
  fr: {
    eyebrow: "Demander un devis",
    titel: "Envoyez vos plans, recevez un devis sur mesure",
    intro:
      "Remplissez le formulaire et chargez vos plans. Avec l'adresse du chantier et la marque de votre guidage, je sais aussitôt dans quel système et quel format livrer le modèle.",
    naKop: "Et ensuite ?",
    na: [
      "Vous recevez immédiatement une confirmation par mail.",
      "J'examine vos plans et vous envoie un devis avec prix et délai.",
      "Après votre accord, je réalise le modèle et le livre prêt pour la machine.",
    ],
    plannenKop: "Que joindre ?",
    plannen: [
      "Plan d'implantation et profils en long / en travers",
      "De préférence DWG ou DXF ; le PDF est possible aussi",
      "Un levé existant du terrain, s'il y en a un",
    ],
    stelselKop: "Pourquoi l'adresse du chantier ?",
    stelsel:
      "Chaque pays a son propre système de coordonnées et sa référence altimétrique. L'adresse me donne le bon système, pour que le modèle tombe sur le chantier et non à côté.",
  },
  en: {
    eyebrow: "Request a quote",
    titel: "Send your plans, get a tailored quote",
    intro:
      "Fill in the form and upload your plans. With the site address and your machine control brand, I know straight away in which system and format the model must be delivered.",
    naKop: "What happens next?",
    na: [
      "You get an immediate confirmation by email.",
      "I review your plans and send a quote with price and delivery date.",
      "Once you agree, I build the model and deliver it ready for the machine.",
    ],
    plannenKop: "What should you send?",
    plannen: [
      "Site layout plan and long/cross sections",
      "Preferably DWG or DXF; PDF works too",
      "An existing survey of the site, if there is one",
    ],
    stelselKop: "Why the site address?",
    stelsel:
      "Every country has its own coordinate system and height datum. The address tells me the right system, so the model lands on the site and not next to it.",
  },
  de: {
    eyebrow: "Angebot anfordern",
    titel: "Senden Sie Ihre Pläne, erhalten Sie ein individuelles Angebot",
    intro:
      "Füllen Sie das Formular aus und laden Sie Ihre Pläne hoch. Mit der Baustellenadresse und der Marke Ihrer Maschinensteuerung weiß ich sofort, in welchem System und Format das Modell geliefert werden muss.",
    naKop: "Wie geht es weiter?",
    na: [
      "Sie erhalten sofort eine Bestätigung per E-Mail.",
      "Ich prüfe Ihre Pläne und sende Ihnen ein Angebot mit Preis und Liefertermin.",
      "Nach Ihrer Zusage erstelle ich das Modell und liefere es einsatzbereit für die Maschine.",
    ],
    plannenKop: "Was sollten Sie mitsenden?",
    plannen: [
      "Lageplan sowie Längs- und Querprofile",
      "Vorzugsweise DWG oder DXF; PDF ist auch möglich",
      "Eine vorhandene Geländeaufnahme, falls verfügbar",
    ],
    stelselKop: "Warum die Baustellenadresse?",
    stelsel:
      "Jedes Land arbeitet mit einem eigenen Koordinatensystem und Höhenbezug. Aus der Adresse leite ich das richtige System ab, damit das Modell auf der Baustelle liegt und nicht daneben.",
  },
  es: {
    eyebrow: "Solicitar presupuesto",
    titel: "Envíe sus planos y reciba un presupuesto a medida",
    intro:
      "Rellene el formulario y suba sus planos. Con la dirección de la obra y la marca de su sistema de control de maquinaria, sé de inmediato en qué sistema y formato debo entregar el modelo.",
    naKop: "¿Qué pasa después?",
    na: [
      "Recibe de inmediato una confirmación por correo electrónico.",
      "Reviso sus planos y le envío un presupuesto con precio y fecha de entrega.",
      "Tras su aprobación, hago el modelo y lo entrego listo para la máquina.",
    ],
    plannenKop: "¿Qué conviene enviar?",
    plannen: [
      "Plano de implantación y perfiles longitudinales / transversales",
      "Preferiblemente DWG o DXF; también sirve PDF",
      "Un levantamiento topográfico existente del terreno, si lo hay",
    ],
    stelselKop: "¿Por qué la dirección de la obra?",
    stelsel:
      "Cada país trabaja con su propio sistema de coordenadas y su referencia altimétrica. A partir de la dirección deduzco el sistema correcto, para que el modelo quede sobre la obra y no a su lado.",
  },
};

export default async function OffertePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = T[locale];

  return (
    <main className="border-b">
      <div className="wrap py-16 sm:py-20 2xl:py-24">
        <div className="max-w-3xl 2xl:max-w-4xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{t.eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">{t.titel}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{t.intro}</p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.6fr_1fr] xl:gap-12 2xl:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)] 2xl:gap-16">
          <Offerte3dFormulier locale={locale} />

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <InfoBlok icoon={Clock} titel={t.naKop}>
              <ol className="space-y-3">
                {t.na.map((n, i) => (
                  <li key={n} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {n}
                  </li>
                ))}
              </ol>
            </InfoBlok>
            <InfoBlok icoon={FileText} titel={t.plannenKop}>
              <ul className="space-y-2">
                {t.plannen.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                    {p}
                  </li>
                ))}
              </ul>
            </InfoBlok>
            <InfoBlok icoon={Crosshair} titel={t.stelselKop}>
              <p className="text-sm leading-relaxed text-muted">{t.stelsel}</p>
            </InfoBlok>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoBlok({
  icoon: Icoon,
  titel,
  children,
}: {
  icoon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold tracking-tight">
        <Icoon className="h-4 w-4 text-accent" strokeWidth={1.5} />
        {titel}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
