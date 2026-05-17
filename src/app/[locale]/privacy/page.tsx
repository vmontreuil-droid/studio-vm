import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Block = {
  title: string;
  paras?: string[];
  list?: string[];
  afterList?: string;
};

type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  localeCode: string;
  blocks: Block[];
  cookiesLinkLabel: string;
};

const MAIL = "info@studio-vm.be";

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Privacy — Studio VM",
    eyebrow: "Privacy",
    title: "Privacyverklaring",
    updated: "Laatst bijgewerkt",
    localeCode: "nl-BE",
    blocks: [
      { title: "Wie zijn we?", paras: [`Studio VM is een eenmanszaak van Vincent Montreuil, gevestigd in West-Vlaanderen, België. Voor vragen kan je terecht op ${MAIL}.`] },
      { title: "Welke gegevens verzamelen we?", paras: ["We proberen zo min mogelijk te verzamelen. Concreet:"], list: ["Contactformulier: naam, e-mail, bericht — gebruikt om je vraag te beantwoorden.", "Tickets in de demo: blijven uitsluitend in je eigen browser (localStorage). Wij zien ze niet.", "Analytics: privacy-vriendelijke tool zonder cookies en zonder persoonlijke identificatoren."] },
      { title: "Hoelang bewaren we ze?", paras: ["Contactberichten bewaren we maximaal 2 jaar. Als we een offerte sturen die niet wordt aanvaard, verwijderen we je gegevens na 6 maanden."] },
      { title: "Met wie delen we je gegevens?", paras: ["Met niemand, tenzij wettelijk verplicht. Geen marketing, geen verkoop.", "Voor hosting werken we met Vercel (EU regio) en Supabase (EU regio). Voor e-mail eventueel Resend. Voor online betalingen (de aanbetaling) gebruiken we Mollie als betaalverwerker — Mollie verwerkt je betaalgegevens; wij bewaren zelf geen kaart- of rekeningnummers. Allemaal partijen met een eigen GDPR-conformiteit."] },
      { title: "Welke rechten heb je?", list: ["Je gegevens inzien", "Ze laten verbeteren", "Ze laten verwijderen (recht om vergeten te worden)", "Een kopie krijgen (data-export)", "Een klacht indienen bij de Gegevensbeschermingsautoriteit"], afterList: `Stuur je vraag naar ${MAIL}. We antwoorden binnen 30 dagen.` },
      { title: "Cookies", paras: ["We gebruiken alleen functionele cookies. Geen tracking-, marketing- of advertentie-cookies."] },
    ],
    cookiesLinkLabel: "Lees meer in onze cookieverklaring →",
  },
  fr: {
    metaTitle: "Confidentialité — Studio VM",
    eyebrow: "Confidentialité",
    title: "Déclaration de confidentialité",
    updated: "Dernière mise à jour",
    localeCode: "fr-BE",
    blocks: [
      { title: "Qui sommes-nous ?", paras: [`Studio VM est une entreprise individuelle de Vincent Montreuil, établie en Flandre-Occidentale, Belgique. Pour toute question : ${MAIL}.`] },
      { title: "Quelles données collectons-nous ?", paras: ["Nous essayons de collecter le minimum. Concrètement :"], list: ["Formulaire de contact : nom, e-mail, message — utilisés pour répondre à votre question.", "Tickets de la démo : restent uniquement dans votre navigateur (localStorage). Nous ne les voyons pas.", "Analytics : outil respectueux de la vie privée, sans cookies ni identifiants personnels."] },
      { title: "Combien de temps les conservons-nous ?", paras: ["Les messages de contact sont conservés au maximum 2 ans. Si un devis envoyé n'est pas accepté, nous supprimons vos données après 6 mois."] },
      { title: "Avec qui partageons-nous vos données ?", paras: ["Avec personne, sauf obligation légale. Pas de marketing, pas de vente.", "Pour l'hébergement nous utilisons Vercel (région EU) et Supabase (région EU). Pour l'e-mail éventuellement Resend. Pour les paiements en ligne (l'acompte) nous utilisons Mollie comme prestataire de paiement — Mollie traite vos données de paiement ; nous ne conservons aucun numéro de carte ou de compte. Tous conformes au RGPD."] },
      { title: "Quels sont vos droits ?", list: ["Consulter vos données", "Les faire corriger", "Les faire supprimer (droit à l'oubli)", "En obtenir une copie (export)", "Déposer une plainte auprès de l'Autorité de protection des données"], afterList: `Envoyez votre demande à ${MAIL}. Nous répondons sous 30 jours.` },
      { title: "Cookies", paras: ["Nous utilisons uniquement des cookies fonctionnels. Pas de cookies de tracking, marketing ou publicité."] },
    ],
    cookiesLinkLabel: "En savoir plus dans notre déclaration cookies →",
  },
  en: {
    metaTitle: "Privacy — Studio VM",
    eyebrow: "Privacy",
    title: "Privacy statement",
    updated: "Last updated",
    localeCode: "en-GB",
    blocks: [
      { title: "Who are we?", paras: [`Studio VM is a sole proprietorship of Vincent Montreuil, based in West Flanders, Belgium. For questions: ${MAIL}.`] },
      { title: "What data do we collect?", paras: ["We try to collect as little as possible. Specifically:"], list: ["Contact form: name, email, message — used to answer your question.", "Demo tickets: stay only in your own browser (localStorage). We don't see them.", "Analytics: privacy-friendly tool without cookies or personal identifiers."] },
      { title: "How long do we keep it?", paras: ["Contact messages are kept for a maximum of 2 years. If a quote we send is not accepted, we delete your data after 6 months."] },
      { title: "Who do we share your data with?", paras: ["With no one, unless legally required. No marketing, no selling.", "For hosting we use Vercel (EU region) and Supabase (EU region). For email possibly Resend. For online payments (the deposit) we use Mollie as payment processor — Mollie processes your payment data; we store no card or account numbers ourselves. All GDPR-compliant."] },
      { title: "What are your rights?", list: ["Access your data", "Have it corrected", "Have it deleted (right to be forgotten)", "Get a copy (data export)", "File a complaint with the Data Protection Authority"], afterList: `Send your request to ${MAIL}. We reply within 30 days.` },
      { title: "Cookies", paras: ["We only use functional cookies. No tracking, marketing or advertising cookies."] },
    ],
    cookiesLinkLabel: "Read more in our cookie statement →",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: copy[locale].metaTitle };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <article>
        <header className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {c.title}
            </h1>
            <p className="mt-4 text-sm text-muted">
              {c.updated}:{" "}
              {new Date().toLocaleDateString(c.localeCode, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-16 text-foreground">
          {c.blocks.map((b) => (
            <section key={b.title}>
              <h2 className="text-xl font-semibold tracking-tight">{b.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-foreground/90">
                {b.paras?.map((p) => <p key={p}>{p}</p>)}
                {b.list && (
                  <ul className="list-disc space-y-2 pl-6">
                    {b.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
                {b.afterList && <p>{b.afterList}</p>}
                {b.title === c.blocks[c.blocks.length - 1].title && (
                  <p>
                    <Link
                      href={localePath(locale, "/cookies")}
                      className="text-accent underline"
                    >
                      {c.cookiesLinkLabel}
                    </Link>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
