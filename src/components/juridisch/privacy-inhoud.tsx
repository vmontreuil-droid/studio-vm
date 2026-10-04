// Privacyverklaring: de tekst staat enkel hier. Gebruikt door de publieke
// pagina (/privacy) en door het klantenportaal (/portail/dashboard/privacy).
// De verwijzing naar de cookieverklaring volgt `links`, zodat een klant in
// het portaal in het portaal blijft.
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { TocItem } from "@/components/inhoud-toc";
import { identiteitsregel } from "@/lib/bedrijf";
import { juridischeLinks, type JuridischeLinks } from "./links";

export type PrivacyBlok = {
  title: string;
  paras?: string[];
  list?: string[];
  /** Eén of meer alinea's na de lijst. */
  afterList?: string | string[];
  /** Verwijzing naar de cookieverklaring onder dit blok. */
  cookiesLink?: boolean;
};

// Nieuwe secties komen achteraan, zodat de bestaande ankers (#sectie-1 …
// #sectie-6) blijven kloppen.

export type PrivacyTekst = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  blocks: PrivacyBlok[];
  cookiesLinkLabel: string;
};

const MAIL = "info@studio-vm.be";

export const PRIVACY: Record<Locale, PrivacyTekst> = {
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
      { title: "Welke gegevens verzamelen we?", paras: ["We proberen zo min mogelijk te verzamelen. Concreet:"], list: ["Contactformulier: naam, e-mail, bericht — gebruikt om uw vraag te beantwoorden.", "Offerteformulier: naam, bedrijf, e-mail, telefoon, werfadres en de plannen die u oplaadt — gebruikt om een offerte op te maken en het model te bouwen.", "Klantenportaal: uw account, projecten, offertes, facturen en de bestanden die u downloadt.", "Nieuwsbrief: uw e-mailadres, tot u zich afmeldt.", "Bezoekstatistieken: zonder cookies en zonder uw IP-adres te bewaren (onze eigen teller en Vercel Web Analytics). Meer daarover onder Bezoekstatistieken en herkomst van uw aanvraag."] },
      { title: "Hoelang bewaren we ze?", paras: ["Contactberichten bewaren we maximaal 2 jaar. Als we een offerte sturen die niet wordt aanvaard, verwijderen we uw gegevens na 6 maanden.", "Facturen en boekhoudkundige stukken bewaren we zo lang als de wet voorschrijft.", "Bezoekstatistieken bewaren we maximaal 25 maanden. Hoe u ons vond, bewaren we samen met uw aanvraag en volgens dezelfde termijnen."] },
      { title: "Met wie delen we uw gegevens?", paras: ["Met niemand, tenzij wettelijk verplicht. Geen marketing, geen verkoop.", "Voor hosting werken we met Vercel (EU regio) en Supabase (EU regio). Voor e-mail eventueel Resend. Voor online betalingen (betaling van facturen) gebruiken we Mollie als betaalverwerker — Mollie verwerkt uw betaalgegevens; wij bewaren zelf geen kaart- of rekeningnummers. Allemaal partijen met een eigen GDPR-conformiteit."] },
      { title: "Welke rechten hebt u?", list: ["Uw gegevens inzien", "Ze laten verbeteren", "Ze laten verwijderen (recht om vergeten te worden)", "Een kopie krijgen (data-export)", "Een klacht indienen bij de Gegevensbeschermingsautoriteit"], afterList: `Stuur uw vraag naar ${MAIL}. We antwoorden binnen 30 dagen.` },
      { title: "Cookies", paras: ["We gebruiken alleen functionele cookies. Geen tracking-, marketing- of advertentie-cookies."], cookiesLink: true },
      {
        title: "Bezoekstatistieken en herkomst van uw aanvraag",
        paras: ["Om te weten welke pagina's nuttig zijn en via welk kanaal bezoekers ons vinden, houden we eenvoudige bezoekstatistieken bij, zonder cookies. Per bekeken pagina bewaren we:"],
        list: [
          "de pagina, de taal en het tijdstip;",
          "de website die u naar ons doorverwees (bv. google.com of facebook.com), als uw browser die doorgeeft;",
          "de campagnelabels in de link waarmee u binnenkwam (utm-parameters: bv. dat de link uit een bericht op Facebook of uit ons Instagram-profiel kwam, en uit welk bericht);",
          "het land (afgeleid uit uw IP-adres) en of u een gsm of een computer gebruikt;",
          "een dagcode: een code (hash) die we uit IP-adres en browser berekenen en die elke dag verandert, zodat we bezoekers per dag kunnen tellen. Uw IP-adres zelf bewaren we niet.",
        ],
        afterList: [
          "Vraagt u een offerte aan, dan kunnen we bij uw aanvraag noteren hoe u ons vond: uw antwoord op de vraag hoe u Studio VM kent en, als die er zijn, de bezoekstatistieken van dezelfde dag met dezelfde dagcode (bv. de eerste pagina die u bekeek, de verwijzende website en de campagnelabels). Vanaf dan zijn die gegevens niet langer anoniem: ze horen bij uw aanvraag.",
          "Rechtsgrond: ons gerechtvaardigd belang (art. 6.1.f AVG) om te weten welke kanalen werken en onze tijd en middelen daarop af te stemmen. We gebruiken deze gegevens niet voor advertenties, maken er geen profiel mee en delen ze met niemand.",
          "Bewaartermijn: bezoekstatistieken maximaal 25 maanden; de herkomst van een aanvraag zolang we de aanvraag zelf bewaren (zie hierboven).",
          `U kunt zich op elk moment tegen deze verwerking verzetten, of vragen om de herkomst bij uw aanvraag te wissen, via ${MAIL}. Uw andere rechten staan hierboven onder Welke rechten hebt u?`,
        ],
      },
      {
        title: "Studio VM op sociale media",
        paras: [
          "Studio VM heeft, of opent binnenkort, een pagina of profiel op onder meer Facebook, Instagram, LinkedIn, Google (Bedrijfsprofiel), YouTube, TikTok, Pinterest, X, Threads en Bluesky. De profielen die al bestaan, vindt u onderaan onze website. Bezoekt u ons daar, dan verwerkt het platform uw gegevens volgens zijn eigen privacybeleid en is het daarvoor zelf verantwoordelijk. Wij zien enkel wat u er openbaar doet (bv. een reactie of een like), de berichten die u ons stuurt en algemene cijfers over het bereik van onze berichten.",
          "Facebook en Instagram: voor de statistieken die Meta over onze pagina maakt (Page Insights) zijn we samen met Meta Platforms Ireland Ltd. gezamenlijk verwerkingsverantwoordelijke (Hof van Justitie van de EU, zaak C-210/16). Meta legt de afspraken daarover vast in het Page Insights Controller Addendum: Meta neemt de hoofdverantwoordelijkheid op, ook voor het informeren van bezoekers en het afhandelen van hun rechten. Wij krijgen enkel samengevatte, anonieme cijfers (bv. bereik, interacties, leeftijdsgroepen) en kunnen daaruit geen individuele bezoekers herkennen. Uw rechten oefent u het eenvoudigst rechtstreeks uit bij Meta (facebook.com/privacy); u kunt ook bij ons terecht, dan geven we uw vraag door. Rechtsgrond voor ons deel: ons gerechtvaardigd belang om onze diensten via sociale media voor te stellen.",
          `Berichten die u ons via een platform stuurt (bv. Messenger of Instagram Direct), gebruiken we enkel om u te antwoorden. Wilt u gegevens laten wissen die we via een platform van u kregen, mail dan naar ${MAIL}: we wissen ze binnen 30 dagen.`,
          "Deelknoppen: de knoppen om een pagina te delen (WhatsApp, Facebook, X, e-mail, link kopiëren) zijn gewone links. Op onze site wordt niets van die platformen geladen en er gaan geen gegevens naar hen zolang u niet klikt. Pas wanneer u klikt, opent het platform en geldt zijn privacybeleid. Een gedeelde link bevat een campagnelabel (bv. utm_source=whatsapp): zo zien we dat een bezoek via een gedeelde link kwam, niet wie hem deelde. We gebruiken geen Meta-pixel en geen andere trackers van sociale media.",
        ],
      },
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
      { title: "Quelles données collectons-nous ?", paras: ["Nous essayons de collecter le minimum. Concrètement :"], list: ["Formulaire de contact : nom, e-mail, message — utilisés pour répondre à votre question.", "Formulaire de devis : nom, entreprise, e-mail, téléphone, adresse du chantier et les plans que vous téléversez — utilisés pour établir un devis et réaliser le modèle.", "Espace client : votre compte, vos projets, devis, factures et les fichiers que vous téléchargez.", "Newsletter : votre adresse e-mail, jusqu'à votre désinscription.", "Statistiques de visite : sans cookies et sans conserver votre adresse IP (notre propre compteur et Vercel Web Analytics). Plus de détails sous Statistiques de visite et origine de votre demande."] },
      { title: "Combien de temps les conservons-nous ?", paras: ["Les messages de contact sont conservés au maximum 2 ans. Si un devis envoyé n'est pas accepté, nous supprimons vos données après 6 mois.", "Les factures et pièces comptables sont conservées aussi longtemps que la loi l'exige.", "Les statistiques de visite sont conservées au maximum 25 mois. La manière dont vous nous avez trouvés est conservée avec votre demande, selon les mêmes délais."] },
      { title: "Avec qui partageons-nous vos données ?", paras: ["Avec personne, sauf obligation légale. Pas de marketing, pas de vente.", "Pour l'hébergement nous utilisons Vercel (région EU) et Supabase (région EU). Pour l'e-mail éventuellement Resend. Pour les paiements en ligne (le paiement des factures) nous utilisons Mollie comme prestataire de paiement — Mollie traite vos données de paiement ; nous ne conservons aucun numéro de carte ou de compte. Tous conformes au RGPD."] },
      { title: "Quels sont vos droits ?", list: ["Consulter vos données", "Les faire corriger", "Les faire supprimer (droit à l'oubli)", "En obtenir une copie (export)", "Déposer une plainte auprès de l'Autorité de protection des données"], afterList: `Envoyez votre demande à ${MAIL}. Nous répondons sous 30 jours.` },
      { title: "Cookies", paras: ["Nous utilisons uniquement des cookies fonctionnels. Pas de cookies de tracking, marketing ou publicité."], cookiesLink: true },
      {
        title: "Statistiques de visite et origine de votre demande",
        paras: ["Pour savoir quelles pages sont utiles et par quel canal les visiteurs nous trouvent, nous tenons des statistiques de visite simples, sans cookies. Pour chaque page consultée, nous conservons :"],
        list: [
          "la page, la langue et l'heure ;",
          "le site qui vous a dirigé vers nous (par ex. google.com ou facebook.com), si votre navigateur le transmet ;",
          "les étiquettes de campagne du lien par lequel vous êtes arrivé (paramètres utm : par ex. que le lien venait d'une publication sur Facebook ou de notre profil Instagram, et de quelle publication) ;",
          "le pays (déduit de votre adresse IP) et le type d'appareil (smartphone ou ordinateur) ;",
          "un code du jour : un code (hash) calculé à partir de l'adresse IP et du navigateur, qui change chaque jour, afin de compter les visiteurs par jour. Nous ne conservons pas votre adresse IP elle-même.",
        ],
        afterList: [
          "Si vous demandez un devis, nous pouvons noter avec votre demande comment vous nous avez trouvés : votre réponse à la question sur la manière dont vous connaissez Studio VM et, s'il y en a, les statistiques de visite du même jour avec le même code du jour (par ex. la première page consultée, le site référent et les étiquettes de campagne). Ces données ne sont alors plus anonymes : elles font partie de votre demande.",
          "Base légale : notre intérêt légitime (art. 6.1.f RGPD) à savoir quels canaux fonctionnent et à y adapter notre temps et nos moyens. Nous n'utilisons pas ces données à des fins publicitaires, n'en tirons aucun profil et ne les partageons avec personne.",
          "Durée de conservation : 25 mois au maximum pour les statistiques de visite ; l'origine d'une demande est conservée aussi longtemps que la demande elle-même (voir ci-dessus).",
          `Vous pouvez à tout moment vous opposer à ce traitement, ou demander l'effacement de l'origine notée avec votre demande, en écrivant à ${MAIL}. Vos autres droits figurent ci-dessus, sous Quels sont vos droits ?`,
        ],
      },
      {
        title: "Studio VM sur les réseaux sociaux",
        paras: [
          "Studio VM dispose, ou disposera prochainement, d'une page ou d'un profil notamment sur Facebook, Instagram, LinkedIn, Google (fiche d'établissement), YouTube, TikTok, Pinterest, X, Threads et Bluesky. Les profils déjà ouverts figurent en bas de notre site. Lorsque vous nous y rendez visite, la plateforme traite vos données selon sa propre politique de confidentialité et en est elle-même responsable. Nous ne voyons que ce que vous y faites publiquement (par ex. un commentaire ou un j'aime), les messages que vous nous envoyez et des chiffres généraux sur la portée de nos publications.",
          "Facebook et Instagram : pour les statistiques que Meta établit sur notre page (Page Insights), nous sommes responsables conjoints du traitement avec Meta Platforms Ireland Ltd. (Cour de justice de l'UE, affaire C-210/16). Meta en fixe les modalités dans le Page Insights Controller Addendum : Meta assume la responsabilité principale, y compris pour l'information des visiteurs et le traitement de leurs droits. Nous ne recevons que des chiffres agrégés et anonymes (par ex. portée, interactions, tranches d'âge) et ne pouvons pas y reconnaître de visiteurs individuels. Le plus simple est d'exercer vos droits directement auprès de Meta (facebook.com/privacy) ; vous pouvez aussi vous adresser à nous, nous transmettrons votre demande. Base légale pour notre part : notre intérêt légitime à présenter nos services sur les réseaux sociaux.",
          `Les messages que vous nous envoyez via une plateforme (par ex. Messenger ou Instagram Direct) servent uniquement à vous répondre. Pour faire effacer des données que nous avons reçues de vous via une plateforme, écrivez à ${MAIL} : nous les effaçons dans les 30 jours.`,
          "Boutons de partage : les boutons pour partager une page (WhatsApp, Facebook, X, e-mail, copier le lien) sont de simples liens. Rien de ces plateformes n'est chargé sur notre site et aucune donnée ne leur est transmise tant que vous ne cliquez pas. Ce n'est qu'au clic que la plateforme s'ouvre et que sa politique de confidentialité s'applique. Un lien partagé contient une étiquette de campagne (par ex. utm_source=whatsapp) : nous voyons ainsi qu'une visite vient d'un lien partagé, pas qui l'a partagé. Nous n'utilisons ni pixel Meta ni autre traceur de réseaux sociaux.",
        ],
      },
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
      { title: "What data do we collect?", paras: ["We try to collect as little as possible. Specifically:"], list: ["Contact form: name, email, message — used to answer your question.", "Quote form: name, company, email, phone, site address and the plans you upload — used to prepare a quote and build the model.", "Client portal: your account, projects, quotes, invoices and the files you download.", "Newsletter: your email address, until you unsubscribe.", "Visit statistics: without cookies and without storing your IP address (our own counter and Vercel Web Analytics). More under Visit statistics and the origin of your request."] },
      { title: "How long do we keep it?", paras: ["Contact messages are kept for a maximum of 2 years. If a quote we send is not accepted, we delete your data after 6 months.", "Invoices and accounting records are kept for as long as the law requires.", "Visit statistics are kept for a maximum of 25 months. How you found us is kept together with your request, for the same periods."] },
      { title: "Who do we share your data with?", paras: ["With no one, unless legally required. No marketing, no selling.", "For hosting we use Vercel (EU region) and Supabase (EU region). For email possibly Resend. For online payments (invoice payments) we use Mollie as payment processor — Mollie processes your payment data; we store no card or account numbers ourselves. All GDPR-compliant."] },
      { title: "What are your rights?", list: ["Access your data", "Have it corrected", "Have it deleted (right to be forgotten)", "Get a copy (data export)", "File a complaint with the Data Protection Authority"], afterList: `Send your request to ${MAIL}. We reply within 30 days.` },
      { title: "Cookies", paras: ["We only use functional cookies. No tracking, marketing or advertising cookies."], cookiesLink: true },
      {
        title: "Visit statistics and the origin of your request",
        paras: ["To know which pages are useful and through which channel visitors find us, we keep simple visit statistics, without cookies. For each page viewed we store:"],
        list: [
          "the page, the language and the time;",
          "the website that referred you to us (e.g. google.com or facebook.com), if your browser passes it on;",
          "the campaign labels in the link you arrived through (utm parameters: e.g. that the link came from a post on Facebook or from our Instagram profile, and which post);",
          "the country (derived from your IP address) and whether you use a phone or a computer;",
          "a daily code: a code (hash) we compute from IP address and browser that changes every day, so we can count visitors per day. We do not store your IP address itself.",
        ],
        afterList: [
          "If you request a quote, we may record with your request how you found us: your answer to the question how you know Studio VM and, where available, the visit statistics of the same day with the same daily code (e.g. the first page you viewed, the referring website and the campaign labels). From then on this data is no longer anonymous: it is part of your request.",
          "Legal basis: our legitimate interest (Art. 6(1)(f) GDPR) in knowing which channels work and in directing our time and resources accordingly. We do not use this data for advertising, build no profile with it and share it with no one.",
          "Retention: visit statistics for a maximum of 25 months; the origin of a request for as long as we keep the request itself (see above).",
          `You can object to this processing at any time, or ask us to erase the origin recorded with your request, by writing to ${MAIL}. Your other rights are listed above under What are your rights?`,
        ],
      },
      {
        title: "Studio VM on social media",
        paras: [
          "Studio VM has, or will soon open, a page or profile on platforms including Facebook, Instagram, LinkedIn, Google (Business Profile), YouTube, TikTok, Pinterest, X, Threads and Bluesky. The profiles that already exist are linked at the bottom of our website. When you visit us there, the platform processes your data under its own privacy policy and is itself responsible for it. We only see what you do there publicly (e.g. a comment or a like), the messages you send us and general figures on the reach of our posts.",
          "Facebook and Instagram: for the statistics Meta compiles about our page (Page Insights), we are joint controllers with Meta Platforms Ireland Ltd. (Court of Justice of the EU, case C-210/16). Meta sets out the arrangement in its Page Insights Controller Addendum: Meta takes primary responsibility, including for informing visitors and handling their rights. We only receive aggregated, anonymous figures (e.g. reach, interactions, age groups) and cannot identify individual visitors from them. It is easiest to exercise your rights directly with Meta (facebook.com/privacy); you can also contact us and we will pass your request on. Legal basis for our part: our legitimate interest in presenting our services on social media.",
          `Messages you send us through a platform (e.g. Messenger or Instagram Direct) are used only to reply to you. To have data we received from you through a platform deleted, write to ${MAIL}: we delete it within 30 days.`,
          "Share buttons: the buttons to share a page (WhatsApp, Facebook, X, email, copy link) are plain links. Nothing from these platforms is loaded on our site and no data is sent to them until you click. Only when you click does the platform open and its privacy policy apply. A shared link carries a campaign label (e.g. utm_source=whatsapp), so we can see that a visit came from a shared link, not who shared it. We use no Meta pixel and no other social media trackers.",
        ],
      },
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
      { title: "Welche Daten erheben wir?", paras: ["Wir versuchen, so wenig wie möglich zu erheben. Konkret:"], list: ["Kontaktformular: Name, E-Mail, Nachricht — verwendet, um Ihre Anfrage zu beantworten.", "Angebotsformular: Name, Unternehmen, E-Mail, Telefon, Baustellenadresse und die Pläne, die Sie hochladen — verwendet, um ein Angebot zu erstellen und das Modell anzufertigen.", "Kundenportal: Ihr Konto, Ihre Projekte, Angebote, Rechnungen und die Dateien, die Sie herunterladen.", "Newsletter: Ihre E-Mail-Adresse, bis Sie sich abmelden.", "Besuchsstatistik: ohne Cookies und ohne Speicherung Ihrer IP-Adresse (unser eigener Zähler und Vercel Web Analytics). Mehr dazu unter Besuchsstatistik und Herkunft Ihrer Anfrage."] },
      { title: "Wie lange speichern wir sie?", paras: ["Kontaktnachrichten speichern wir höchstens 2 Jahre. Wird ein von uns gesendetes Angebot nicht angenommen, löschen wir Ihre Daten nach 6 Monaten.", "Rechnungen und Buchhaltungsunterlagen bewahren wir so lange auf, wie es das Gesetz vorschreibt.", "Die Besuchsstatistik speichern wir höchstens 25 Monate. Wie Sie uns gefunden haben, speichern wir zusammen mit Ihrer Anfrage und nach denselben Fristen."] },
      { title: "Mit wem teilen wir Ihre Daten?", paras: ["Mit niemandem, sofern keine gesetzliche Pflicht besteht. Kein Marketing, kein Verkauf.", "Für das Hosting nutzen wir Vercel (EU-Region) und Supabase (EU-Region). Für E-Mails gegebenenfalls Resend. Für Online-Zahlungen (Zahlung von Rechnungen) nutzen wir Mollie als Zahlungsdienstleister — Mollie verarbeitet Ihre Zahlungsdaten; wir selbst speichern keine Karten- oder Kontonummern. Alle diese Anbieter sind DSGVO-konform."] },
      { title: "Welche Rechte haben Sie?", list: ["Auskunft über Ihre Daten", "Berichtigung Ihrer Daten", "Löschung Ihrer Daten (Recht auf Vergessenwerden)", "Erhalt einer Kopie (Datenexport)", "Beschwerde bei der Datenschutzbehörde"], afterList: `Senden Sie Ihre Anfrage an ${MAIL}. Wir antworten innerhalb von 30 Tagen.` },
      { title: "Cookies", paras: ["Wir verwenden ausschließlich funktionale Cookies. Keine Tracking-, Marketing- oder Werbe-Cookies."], cookiesLink: true },
      {
        title: "Besuchsstatistik und Herkunft Ihrer Anfrage",
        paras: ["Um zu wissen, welche Seiten nützlich sind und über welchen Kanal Besucher uns finden, führen wir eine einfache Besuchsstatistik, ohne Cookies. Pro aufgerufener Seite speichern wir:"],
        list: [
          "die Seite, die Sprache und den Zeitpunkt;",
          "die Website, die Sie zu uns geführt hat (z. B. google.com oder facebook.com), sofern Ihr Browser sie übermittelt;",
          "die Kampagnenkennzeichen im Link, über den Sie gekommen sind (UTM-Parameter: z. B. dass der Link aus einem Beitrag auf Facebook oder aus unserem Instagram-Profil stammt, und aus welchem Beitrag);",
          "das Land (abgeleitet aus Ihrer IP-Adresse) und ob Sie ein Smartphone oder einen Computer verwenden;",
          "einen Tagescode: einen Code (Hash), den wir aus IP-Adresse und Browser berechnen und der sich täglich ändert, damit wir Besucher pro Tag zählen können. Ihre IP-Adresse selbst speichern wir nicht.",
        ],
        afterList: [
          "Wenn Sie ein Angebot anfordern, können wir zu Ihrer Anfrage notieren, wie Sie uns gefunden haben: Ihre Antwort auf die Frage, woher Sie Studio VM kennen, und, sofern vorhanden, die Besuchsstatistik desselben Tages mit demselben Tagescode (z. B. die erste aufgerufene Seite, die verweisende Website und die Kampagnenkennzeichen). Ab dann sind diese Daten nicht mehr anonym: Sie gehören zu Ihrer Anfrage.",
          "Rechtsgrundlage: unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO), zu wissen, welche Kanäle funktionieren, und unsere Zeit und Mittel danach auszurichten. Wir nutzen diese Daten nicht für Werbung, erstellen damit kein Profil und geben sie an niemanden weiter.",
          "Speicherdauer: Besuchsstatistik höchstens 25 Monate; die Herkunft einer Anfrage so lange, wie wir die Anfrage selbst aufbewahren (siehe oben).",
          `Sie können dieser Verarbeitung jederzeit widersprechen oder die Löschung der zu Ihrer Anfrage notierten Herkunft verlangen, per E-Mail an ${MAIL}. Ihre weiteren Rechte finden Sie oben unter Welche Rechte haben Sie?`,
        ],
      },
      {
        title: "Studio VM in sozialen Medien",
        paras: [
          "Studio VM hat oder eröffnet in Kürze unter anderem eine Seite oder ein Profil auf Facebook, Instagram, LinkedIn, Google (Unternehmensprofil), YouTube, TikTok, Pinterest, X, Threads und Bluesky. Die bereits bestehenden Profile finden Sie unten auf unserer Website. Wenn Sie uns dort besuchen, verarbeitet die Plattform Ihre Daten nach ihrer eigenen Datenschutzerklärung und ist dafür selbst verantwortlich. Wir sehen nur, was Sie dort öffentlich tun (z. B. einen Kommentar oder ein Like), die Nachrichten, die Sie uns senden, und allgemeine Zahlen zur Reichweite unserer Beiträge.",
          "Facebook und Instagram: Für die Statistiken, die Meta über unsere Seite erstellt (Seiten-Insights), sind wir gemeinsam mit Meta Platforms Ireland Ltd. Verantwortliche (Gerichtshof der EU, Rechtssache C-210/16). Meta legt die Vereinbarung dazu im Page Insights Controller Addendum fest: Meta übernimmt die Hauptverantwortung, auch für die Information der Besucher und die Bearbeitung ihrer Rechte. Wir erhalten nur zusammengefasste, anonyme Zahlen (z. B. Reichweite, Interaktionen, Altersgruppen) und können daraus keine einzelnen Besucher erkennen. Ihre Rechte üben Sie am einfachsten direkt bei Meta aus (facebook.com/privacy); Sie können sich auch an uns wenden, wir leiten Ihre Anfrage weiter. Rechtsgrundlage für unseren Teil: unser berechtigtes Interesse, unsere Leistungen in sozialen Medien vorzustellen.",
          `Nachrichten, die Sie uns über eine Plattform senden (z. B. Messenger oder Instagram Direct), verwenden wir nur, um Ihnen zu antworten. Möchten Sie Daten löschen lassen, die wir über eine Plattform von Ihnen erhalten haben, schreiben Sie an ${MAIL}: Wir löschen sie innerhalb von 30 Tagen.`,
          "Teilen-Schaltflächen: Die Schaltflächen zum Teilen einer Seite (WhatsApp, Facebook, X, E-Mail, Link kopieren) sind einfache Links. Auf unserer Website wird nichts von diesen Plattformen geladen, und es werden keine Daten an sie übermittelt, solange Sie nicht klicken. Erst beim Klick öffnet sich die Plattform, und es gilt deren Datenschutzerklärung. Ein geteilter Link enthält ein Kampagnenkennzeichen (z. B. utm_source=whatsapp): So sehen wir, dass ein Besuch über einen geteilten Link kam, nicht aber, wer ihn geteilt hat. Wir verwenden kein Meta-Pixel und keine anderen Tracker sozialer Medien.",
        ],
      },
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
      { title: "¿Qué datos recopilamos?", paras: ["Intentamos recopilar lo mínimo posible. En concreto:"], list: ["Formulario de contacto: nombre, correo electrónico, mensaje — utilizados para responder a su consulta.", "Formulario de presupuesto: nombre, empresa, correo electrónico, teléfono, dirección de la obra y los planos que usted sube — utilizados para elaborar un presupuesto y realizar el modelo.", "Portal de clientes: su cuenta, sus proyectos, presupuestos, facturas y los archivos que descarga.", "Boletín: su dirección de correo electrónico, hasta que se dé de baja.", "Estadísticas de visitas: sin cookies y sin guardar su dirección IP (nuestro propio contador y Vercel Web Analytics). Más información en Estadísticas de visitas y origen de su solicitud."] },
      { title: "¿Durante cuánto tiempo los conservamos?", paras: ["Los mensajes de contacto se conservan durante un máximo de 2 años. Si un presupuesto que enviamos no es aceptado, eliminamos sus datos al cabo de 6 meses.", "Las facturas y los documentos contables se conservan durante el tiempo que exija la ley.", "Las estadísticas de visitas se conservan durante un máximo de 25 meses. Cómo nos encontró se conserva junto con su solicitud, con los mismos plazos."] },
      { title: "¿Con quién compartimos sus datos?", paras: ["Con nadie, salvo obligación legal. Sin marketing, sin venta.", "Para el alojamiento utilizamos Vercel (región UE) y Supabase (región UE). Para el correo electrónico, eventualmente Resend. Para los pagos en línea (el pago de facturas) utilizamos Mollie como proveedor de pagos — Mollie trata sus datos de pago; nosotros no conservamos ningún número de tarjeta ni de cuenta. Todos ellos cumplen el RGPD."] },
      { title: "¿Qué derechos tiene?", list: ["Acceder a sus datos", "Solicitar su rectificación", "Solicitar su supresión (derecho al olvido)", "Obtener una copia (exportación de datos)", "Presentar una reclamación ante la Autoridad de Protección de Datos"], afterList: `Envíe su solicitud a ${MAIL}. Respondemos en un plazo de 30 días.` },
      { title: "Cookies", paras: ["Solo utilizamos cookies funcionales. Ninguna cookie de seguimiento, marketing o publicidad."], cookiesLink: true },
      {
        title: "Estadísticas de visitas y origen de su solicitud",
        paras: ["Para saber qué páginas son útiles y por qué canal nos encuentran los visitantes, llevamos unas estadísticas de visitas sencillas, sin cookies. Por cada página consultada guardamos:"],
        list: [
          "la página, el idioma y la hora;",
          "el sitio web que le remitió a nosotros (p. ej. google.com o facebook.com), si su navegador lo transmite;",
          "las etiquetas de campaña del enlace por el que llegó (parámetros utm: p. ej. que el enlace procedía de una publicación en Facebook o de nuestro perfil de Instagram, y de qué publicación);",
          "el país (deducido de su dirección IP) y si utiliza un móvil o un ordenador;",
          "un código diario: un código (hash) calculado a partir de la dirección IP y el navegador, que cambia cada día, para poder contar los visitantes por día. No guardamos su dirección IP como tal.",
        ],
        afterList: [
          "Si solicita un presupuesto, podemos anotar en su solicitud cómo nos encontró: su respuesta a la pregunta de cómo conoció Studio VM y, si existen, las estadísticas de visitas del mismo día con el mismo código diario (p. ej. la primera página que vio, el sitio web de procedencia y las etiquetas de campaña). A partir de ese momento, esos datos dejan de ser anónimos: forman parte de su solicitud.",
          "Base jurídica: nuestro interés legítimo (art. 6.1.f RGPD) en saber qué canales funcionan y en orientar nuestro tiempo y recursos en consecuencia. No utilizamos estos datos para publicidad, no elaboramos perfiles con ellos y no los compartimos con nadie.",
          "Plazo de conservación: estadísticas de visitas, un máximo de 25 meses; el origen de una solicitud, mientras conservemos la propia solicitud (véase más arriba).",
          `Puede oponerse a este tratamiento en cualquier momento, o pedir que borremos el origen anotado en su solicitud, escribiendo a ${MAIL}. Sus demás derechos figuran más arriba, en ¿Qué derechos tiene?`,
        ],
      },
      {
        title: "Studio VM en las redes sociales",
        paras: [
          "Studio VM tiene, o abrirá próximamente, una página o un perfil, entre otros, en Facebook, Instagram, LinkedIn, Google (Perfil de Empresa), YouTube, TikTok, Pinterest, X, Threads y Bluesky. Los perfiles que ya existen figuran al pie de nuestro sitio web. Cuando nos visita allí, la plataforma trata sus datos según su propia política de privacidad y es responsable de ello. Nosotros solo vemos lo que usted hace allí públicamente (p. ej. un comentario o un me gusta), los mensajes que nos envía y cifras generales sobre el alcance de nuestras publicaciones.",
          "Facebook e Instagram: para las estadísticas que Meta elabora sobre nuestra página (Page Insights), somos corresponsables del tratamiento junto con Meta Platforms Ireland Ltd. (Tribunal de Justicia de la UE, asunto C-210/16). Meta establece el acuerdo en su Page Insights Controller Addendum: Meta asume la responsabilidad principal, también de informar a los visitantes y de atender sus derechos. Solo recibimos cifras agregadas y anónimas (p. ej. alcance, interacciones, franjas de edad) y no podemos reconocer en ellas a visitantes individuales. Lo más sencillo es ejercer sus derechos directamente ante Meta (facebook.com/privacy); también puede dirigirse a nosotros y trasladaremos su solicitud. Base jurídica de nuestra parte: nuestro interés legítimo en presentar nuestros servicios en las redes sociales.",
          `Los mensajes que nos envía a través de una plataforma (p. ej. Messenger o Instagram Direct) solo se utilizan para responderle. Para que borremos datos que recibimos de usted a través de una plataforma, escriba a ${MAIL}: los borramos en un plazo de 30 días.`,
          "Botones para compartir: los botones para compartir una página (WhatsApp, Facebook, X, correo electrónico, copiar enlace) son enlaces normales. En nuestro sitio no se carga nada de esas plataformas y no se les envía ningún dato mientras usted no haga clic. Solo al hacer clic se abre la plataforma y se aplica su política de privacidad. Un enlace compartido lleva una etiqueta de campaña (p. ej. utm_source=whatsapp): así vemos que una visita llegó por un enlace compartido, pero no quién lo compartió. No utilizamos el píxel de Meta ni otros rastreadores de redes sociales.",
        ],
      },
    ],
    cookiesLinkLabel: "Más información en nuestra declaración de cookies →",
  },
};

const sectieId = (i: number) => `sectie-${i + 1}`;

/** Ankers van de secties, voor de inhoudstafel. */
export function privacyToc(locale: Locale): TocItem[] {
  return PRIVACY[locale].blocks.map((b, i) => ({ id: sectieId(i), label: b.title }));
}

/** De secties, als losse blokken in de kolom van de pagina. */
export function PrivacyInhoud({
  locale,
  links,
}: {
  locale: Locale;
  /** Waar de verwijzingen naar de andere juridische pagina's heen gaan (standaard: publieke site). */
  links?: JuridischeLinks;
}) {
  const c = PRIVACY[locale];
  const naar = links ?? juridischeLinks(locale);
  return (
    <>
      {c.blocks.map((b, i) => (
        <section key={b.title} id={sectieId(i)} className="scroll-mt-28">
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
            {b.afterList && (Array.isArray(b.afterList) ? b.afterList : [b.afterList]).map((p) => <p key={p}>{p}</p>)}
            {b.cookiesLink && (
              <p>
                <Link
                  href={naar["/cookies"]}
                  className="text-accent underline"
                >
                  {c.cookiesLinkLabel}
                </Link>
              </p>
            )}
          </div>
        </section>
      ))}
    </>
  );
}
