import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { InhoudToc } from "@/components/inhoud-toc";
import { JsonLd } from "@/components/json-ld";
import { KRUIMEL, paginaMeta } from "@/lib/seo";
import { graph, kruimels, siteNodes, webPagina } from "@/lib/schema";
import { identiteitsregel } from "@/lib/bedrijf";
import { PAGINA_BIJGEWERKT, datumLabel } from "@/lib/bijgewerkt";

const PAD = "/privacy";

type Block = {
  title: string;
  paras?: string[];
  list?: string[];
  afterList?: string;
};

type Copy = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  blocks: Block[];
  cookiesLinkLabel: string;
};

const MAIL = "info@studio-vm.be";

const copy: Record<Locale, Copy> = {
  nl: {
    meta: {
      title: "Privacyverklaring | Studio VM",
      description:
        "Welke persoonsgegevens Studio VM verwerkt bij een offerte of project, hoelang ze bewaard worden, met wie ze gedeeld worden en welke rechten u hebt.",
    },
    eyebrow: "Privacy",
    title: "Privacyverklaring",
    updated: "Laatst bijgewerkt",
    blocks: [
      { title: "Wie zijn we?", paras: [identiteitsregel("nl"), `Voor vragen kunt u terecht op ${MAIL}.`] },
      { title: "Welke gegevens verzamelen we?", paras: ["We proberen zo min mogelijk te verzamelen. Concreet:"], list: ["Contactformulier: naam, e-mail, bericht — gebruikt om uw vraag te beantwoorden.", "Offerteformulier: naam, bedrijf, e-mail, telefoon, werfadres en de plannen die u oplaadt — gebruikt om een offerte op te maken en het model te bouwen.", "Klantenportaal: uw account, projecten, offertes, facturen en de bestanden die u downloadt.", "Nieuwsbrief: uw e-mailadres, tot u zich afmeldt.", "Analytics: privacy-vriendelijke tool zonder cookies en zonder persoonlijke identificatoren."] },
      { title: "Hoelang bewaren we ze?", paras: ["Contactberichten bewaren we maximaal 2 jaar. Als we een offerte sturen die niet wordt aanvaard, verwijderen we uw gegevens na 6 maanden.", "Facturen en boekhoudkundige stukken bewaren we zo lang als de wet voorschrijft."] },
      { title: "Met wie delen we uw gegevens?", paras: ["Met niemand, tenzij wettelijk verplicht. Geen marketing, geen verkoop.", "Voor hosting werken we met Vercel (EU regio) en Supabase (EU regio). Voor e-mail eventueel Resend. Voor online betalingen (betaling van facturen) gebruiken we Mollie als betaalverwerker — Mollie verwerkt uw betaalgegevens; wij bewaren zelf geen kaart- of rekeningnummers. Allemaal partijen met een eigen GDPR-conformiteit."] },
      { title: "Welke rechten hebt u?", list: ["Uw gegevens inzien", "Ze laten verbeteren", "Ze laten verwijderen (recht om vergeten te worden)", "Een kopie krijgen (data-export)", "Een klacht indienen bij de Gegevensbeschermingsautoriteit"], afterList: `Stuur uw vraag naar ${MAIL}. We antwoorden binnen 30 dagen.` },
      { title: "Cookies", paras: ["We gebruiken alleen functionele cookies. Geen tracking-, marketing- of advertentie-cookies."] },
    ],
    cookiesLinkLabel: "Lees meer in onze cookieverklaring →",
  },
  fr: {
    meta: {
      title: "Déclaration de confidentialité | Studio VM",
      description:
        "Quelles données personnelles Studio VM traite pour un devis ou un projet, combien de temps elles sont conservées, avec qui elles sont partagées et vos droits.",
    },
    eyebrow: "Confidentialité",
    title: "Déclaration de confidentialité",
    updated: "Dernière mise à jour",
    blocks: [
      { title: "Qui sommes-nous ?", paras: [identiteitsregel("fr"), `Pour toute question, vous pouvez nous écrire à ${MAIL}.`] },
      { title: "Quelles données collectons-nous ?", paras: ["Nous essayons de collecter le minimum. Concrètement :"], list: ["Formulaire de contact : nom, e-mail, message — utilisés pour répondre à votre question.", "Formulaire de devis : nom, entreprise, e-mail, téléphone, adresse du chantier et les plans que vous téléversez — utilisés pour établir un devis et réaliser le modèle.", "Espace client : votre compte, vos projets, devis, factures et les fichiers que vous téléchargez.", "Newsletter : votre adresse e-mail, jusqu'à votre désinscription.", "Analytics : outil respectueux de la vie privée, sans cookies ni identifiants personnels."] },
      { title: "Combien de temps les conservons-nous ?", paras: ["Les messages de contact sont conservés au maximum 2 ans. Si un devis envoyé n'est pas accepté, nous supprimons vos données après 6 mois.", "Les factures et pièces comptables sont conservées aussi longtemps que la loi l'exige."] },
      { title: "Avec qui partageons-nous vos données ?", paras: ["Avec personne, sauf obligation légale. Pas de marketing, pas de vente.", "Pour l'hébergement nous utilisons Vercel (région EU) et Supabase (région EU). Pour l'e-mail éventuellement Resend. Pour les paiements en ligne (le paiement des factures) nous utilisons Mollie comme prestataire de paiement — Mollie traite vos données de paiement ; nous ne conservons aucun numéro de carte ou de compte. Tous conformes au RGPD."] },
      { title: "Quels sont vos droits ?", list: ["Consulter vos données", "Les faire corriger", "Les faire supprimer (droit à l'oubli)", "En obtenir une copie (export)", "Déposer une plainte auprès de l'Autorité de protection des données"], afterList: `Envoyez votre demande à ${MAIL}. Nous répondons sous 30 jours.` },
      { title: "Cookies", paras: ["Nous utilisons uniquement des cookies fonctionnels. Pas de cookies de tracking, marketing ou publicité."] },
    ],
    cookiesLinkLabel: "En savoir plus dans notre déclaration cookies →",
  },
  en: {
    meta: {
      title: "Privacy statement | Studio VM",
      description:
        "Which personal data Studio VM processes for a quote or project, how long it is kept, who it is shared with and which rights you have under the GDPR.",
    },
    eyebrow: "Privacy",
    title: "Privacy statement",
    updated: "Last updated",
    blocks: [
      { title: "Who are we?", paras: [identiteitsregel("en"), `For questions, please email ${MAIL}.`] },
      { title: "What data do we collect?", paras: ["We try to collect as little as possible. Specifically:"], list: ["Contact form: name, email, message — used to answer your question.", "Quote form: name, company, email, phone, site address and the plans you upload — used to prepare a quote and build the model.", "Client portal: your account, projects, quotes, invoices and the files you download.", "Newsletter: your email address, until you unsubscribe.", "Analytics: privacy-friendly tool without cookies or personal identifiers."] },
      { title: "How long do we keep it?", paras: ["Contact messages are kept for a maximum of 2 years. If a quote we send is not accepted, we delete your data after 6 months.", "Invoices and accounting records are kept for as long as the law requires."] },
      { title: "Who do we share your data with?", paras: ["With no one, unless legally required. No marketing, no selling.", "For hosting we use Vercel (EU region) and Supabase (EU region). For email possibly Resend. For online payments (invoice payments) we use Mollie as payment processor — Mollie processes your payment data; we store no card or account numbers ourselves. All GDPR-compliant."] },
      { title: "What are your rights?", list: ["Access your data", "Have it corrected", "Have it deleted (right to be forgotten)", "Get a copy (data export)", "File a complaint with the Data Protection Authority"], afterList: `Send your request to ${MAIL}. We reply within 30 days.` },
      { title: "Cookies", paras: ["We only use functional cookies. No tracking, marketing or advertising cookies."] },
    ],
    cookiesLinkLabel: "Read more in our cookie statement →",
  },
  de: {
    meta: {
      title: "Datenschutzerklärung | Studio VM",
      description:
        "Welche personenbezogenen Daten Studio VM bei Angebot oder Projekt verarbeitet, wie lange sie gespeichert werden und welche Rechte Sie nach der DSGVO haben.",
    },
    eyebrow: "Datenschutz",
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert",
    blocks: [
      { title: "Wer sind wir?", paras: [identiteitsregel("de"), `Bei Fragen wenden Sie sich an ${MAIL}.`] },
      { title: "Welche Daten erheben wir?", paras: ["Wir versuchen, so wenig wie möglich zu erheben. Konkret:"], list: ["Kontaktformular: Name, E-Mail, Nachricht — verwendet, um Ihre Anfrage zu beantworten.", "Angebotsformular: Name, Unternehmen, E-Mail, Telefon, Baustellenadresse und die Pläne, die Sie hochladen — verwendet, um ein Angebot zu erstellen und das Modell anzufertigen.", "Kundenportal: Ihr Konto, Ihre Projekte, Angebote, Rechnungen und die Dateien, die Sie herunterladen.", "Newsletter: Ihre E-Mail-Adresse, bis Sie sich abmelden.", "Analytics: datenschutzfreundliches Tool ohne Cookies und ohne persönliche Kennungen."] },
      { title: "Wie lange speichern wir sie?", paras: ["Kontaktnachrichten speichern wir höchstens 2 Jahre. Wird ein von uns gesendetes Angebot nicht angenommen, löschen wir Ihre Daten nach 6 Monaten.", "Rechnungen und Buchhaltungsunterlagen bewahren wir so lange auf, wie es das Gesetz vorschreibt."] },
      { title: "Mit wem teilen wir Ihre Daten?", paras: ["Mit niemandem, sofern keine gesetzliche Pflicht besteht. Kein Marketing, kein Verkauf.", "Für das Hosting nutzen wir Vercel (EU-Region) und Supabase (EU-Region). Für E-Mails gegebenenfalls Resend. Für Online-Zahlungen (Zahlung von Rechnungen) nutzen wir Mollie als Zahlungsdienstleister — Mollie verarbeitet Ihre Zahlungsdaten; wir selbst speichern keine Karten- oder Kontonummern. Alle diese Anbieter sind DSGVO-konform."] },
      { title: "Welche Rechte haben Sie?", list: ["Auskunft über Ihre Daten", "Berichtigung Ihrer Daten", "Löschung Ihrer Daten (Recht auf Vergessenwerden)", "Erhalt einer Kopie (Datenexport)", "Beschwerde bei der Datenschutzbehörde"], afterList: `Senden Sie Ihre Anfrage an ${MAIL}. Wir antworten innerhalb von 30 Tagen.` },
      { title: "Cookies", paras: ["Wir verwenden ausschließlich funktionale Cookies. Keine Tracking-, Marketing- oder Werbe-Cookies."] },
    ],
    cookiesLinkLabel: "Mehr dazu in unserer Cookie-Erklärung →",
  },
  es: {
    meta: {
      title: "Declaración de privacidad | Studio VM",
      description:
        "Qué datos personales trata Studio VM en un presupuesto o proyecto, cuánto tiempo se conservan, con quién se comparten y qué derechos tiene usted.",
    },
    eyebrow: "Privacidad",
    title: "Declaración de privacidad",
    updated: "Última actualización",
    blocks: [
      { title: "¿Quiénes somos?", paras: [identiteitsregel("es"), `Para cualquier consulta, escriba a ${MAIL}.`] },
      { title: "¿Qué datos recopilamos?", paras: ["Intentamos recopilar lo mínimo posible. En concreto:"], list: ["Formulario de contacto: nombre, correo electrónico, mensaje — utilizados para responder a su consulta.", "Formulario de presupuesto: nombre, empresa, correo electrónico, teléfono, dirección de la obra y los planos que usted sube — utilizados para elaborar un presupuesto y realizar el modelo.", "Portal de clientes: su cuenta, sus proyectos, presupuestos, facturas y los archivos que descarga.", "Boletín: su dirección de correo electrónico, hasta que se dé de baja.", "Analítica: herramienta respetuosa con la privacidad, sin cookies ni identificadores personales."] },
      { title: "¿Durante cuánto tiempo los conservamos?", paras: ["Los mensajes de contacto se conservan durante un máximo de 2 años. Si un presupuesto que enviamos no es aceptado, eliminamos sus datos al cabo de 6 meses.", "Las facturas y los documentos contables se conservan durante el tiempo que exija la ley."] },
      { title: "¿Con quién compartimos sus datos?", paras: ["Con nadie, salvo obligación legal. Sin marketing, sin venta.", "Para el alojamiento utilizamos Vercel (región UE) y Supabase (región UE). Para el correo electrónico, eventualmente Resend. Para los pagos en línea (el pago de facturas) utilizamos Mollie como proveedor de pagos — Mollie trata sus datos de pago; nosotros no conservamos ningún número de tarjeta ni de cuenta. Todos ellos cumplen el RGPD."] },
      { title: "¿Qué derechos tiene?", list: ["Acceder a sus datos", "Solicitar su rectificación", "Solicitar su supresión (derecho al olvido)", "Obtener una copia (exportación de datos)", "Presentar una reclamación ante la Autoridad de Protección de Datos"], afterList: `Envíe su solicitud a ${MAIL}. Respondemos en un plazo de 30 días.` },
      { title: "Cookies", paras: ["Solo utilizamos cookies funcionales. Ninguna cookie de seguimiento, marketing o publicidad."] },
    ],
    cookiesLinkLabel: "Más información en nuestra declaración de cookies →",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return paginaMeta(locale, PAD, copy[locale].meta);
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
      <JsonLd
        data={graph(
          siteNodes(locale),
          kruimels(locale, PAD, [{ naam: KRUIMEL[PAD][locale], pad: PAD }]),
          webPagina(locale, PAD, { naam: c.meta.title, beschrijving: c.meta.description }),
        )}
      />
      <article>
        <header className="border-b">
          <div className="wrap py-16 sm:py-20">
            <div className="mx-auto max-w-3xl lg:max-w-[72rem]">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                {c.eyebrow}
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">
                {c.title}
              </h1>
              <p className="mt-4 text-sm text-muted">
                {c.updated}: {datumLabel(locale, PAGINA_BIJGEWERKT[PAD])}
              </p>
            </div>
          </div>
        </header>
        <div className="wrap py-16">
          <div className="mx-auto grid max-w-3xl gap-12 lg:max-w-[72rem] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-20">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
              <InhoudToc
                kop={c.eyebrow}
                items={c.blocks.map((b, i) => ({ id: `sectie-${i + 1}`, label: b.title }))}
              />
            </aside>
            <div className="max-w-3xl space-y-8 text-foreground">
              {c.blocks.map((b, i) => (
                <section key={b.title} id={`sectie-${i + 1}`} className="scroll-mt-28">
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
          </div>
        </div>
      </article>
    </main>
  );
}
