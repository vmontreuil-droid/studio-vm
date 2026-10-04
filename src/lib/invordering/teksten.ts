// Teksten van het deurwaardersdossier: de begeleidende brief, het
// bewijsdossier en de mail, in de taal van de deurwaarder (nl/fr/de). De
// factuurkopie volgt de taal van de klant (zoals ze verstuurd werd); de
// herinneringen staan erin met hun oorspronkelijke tekst.

import type { Locale } from "@/lib/i18n/config";

export type BriefTaal = "nl" | "fr" | "de";

export function briefTaal(t: string | null | undefined): BriefTaal {
  return t === "fr" || t === "de" ? t : "nl";
}

const INTL: Record<Locale, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB", de: "de-BE", es: "es-ES" };

export function datum(iso: string | null | undefined, taal: Locale): string {
  const s = String(iso ?? "");
  if (!s) return "—";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(INTL[taal], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" });
}

export function tijd(iso: string | null | undefined, taal: Locale): string {
  const s = String(iso ?? "");
  const d = new Date(s);
  if (!s || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(INTL[taal], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Brussels",
  });
}

const ENTITEIT: Record<string, string> = {
  euro: "€", mdash: "—", ndash: "–", rarr: "→", larr: "←", middot: "·", minus: "−", hellip: "…", bull: "•",
  laquo: "«", raquo: "»", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", copy: "©", deg: "°", times: "×",
  aacute: "á", agrave: "à", acirc: "â", auml: "ä", eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  iacute: "í", icirc: "î", iuml: "ï", oacute: "ó", ocirc: "ô", ouml: "ö", uacute: "ú", ugrave: "ù",
  ucirc: "û", uuml: "ü", ccedil: "ç", ntilde: "ñ", szlig: "ß", Eacute: "É", Agrave: "À",
};

/** Platte tekst uit een mail (HTML), voor het bewijsdossier. */
export function htmlNaarTekst(html: string | null | undefined): string {
  return String(html ?? "")
    .replace(/<(script|style|head|title)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|table|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (heel, n: string) => ENTITEIT[n] ?? heel)
    .replace(/&amp;/g, "&")
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function euro(cent: number, taal: Locale): string {
  return new Intl.NumberFormat(INTL[taal], { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format((cent ?? 0) / 100);
}

// ── Brief, bewijsdossier en mail (taal van de deurwaarder) ──────────────

type Vordering = { nummer: string; vervaldag: string; dagen: number; pct: string };

export type DossierTeksten = {
  plaatsDatum: (d: string) => string;
  aan: string;
  betreft: (nr: string, klant: string) => string;
  referentie: (nr: string) => string;
  aanhef: string;
  inleiding: (klant: string, arr: string | null) => string;
  zakelijk: string;
  particulier: string;
  overzicht: (d: string) => string;
  hoofdsom: (v: Vordering) => string;
  interest: (v: Vordering) => string;
  forfait: string;
  totaal: string;
  interestLoopt: string;
  verloopKop: string;
  geenBetaling: string;
  bijlagenKop: string;
  bijlageFactuur: (nr: string) => string;
  bijlageBewijs: string;
  betaling: (iban: string, ogm: string) => string;
  contact: (mail: string, tel: string) => string;
  groet: string;
  identiteit: (houder: string, btw: string) => string;
  // Tijdlijn
  offerteAanvaard: (nr: string) => string;
  offerteVia: (ip: string | null, browser: string | null) => string;
  opgeleverd: (bestand: string) => string;
  factuurUitgereikt: (nr: string) => string;
  factuurVerstuurd: (aan: string) => string;
  herinnering: (n: number) => string;
  herinneringLaatste: string;
  gedownload: (bestand: string) => string;
  // Bewijsdossier
  bewijsTitel: (nr: string) => string;
  partijen: string;
  schuldeiser: string;
  schuldenaar: string;
  btwNr: string;
  adres: string;
  email: string;
  telefoon: string;
  offerteKop: string;
  offerteNr: string;
  onderwerp: string;
  bedrag: string;
  aanvaardOp: string;
  ipAdres: string;
  browser: string;
  projectKop: string;
  gewerkteUren: string;
  leveringen: string;
  factuurKop: string;
  uitgereiktOp: string;
  vervaldag: string;
  mededeling: string;
  herinneringenKop: string;
  herinneringenUitleg: string;
  verstuurdOp: string;
  verstuurdAan: string;
  resendId: string;
  geenTekst: string;
  voorwaardenKop: string;
  voorwaardenUitleg: string;
  tijdlijnKop: string;
  // Mail aan de deurwaarder
  mailOnderwerp: (nr: string, klant: string) => string;
  mailTitel: string;
  mailRegels: (klant: string, nr: string, totaal: string) => string[];
  mailBijlagen: string;
  mailVoet: string;
  mailKnop: string;
};

export const DOSSIER: Record<BriefTaal, DossierTeksten> = {
  nl: {
    plaatsDatum: (d) => `Anzegem, ${d}`,
    aan: "Aan",
    betreft: (nr, klant) => `Betreft: invordering factuur ${nr} — ${klant}`,
    referentie: (nr) => `Onze referentie: ${nr}`,
    aanhef: "Geachte meester,",
    inleiding: (klant, arr) =>
      `Hierbij vertrouwen wij u de invordering toe van een onbetaalde factuur van ${klant}.${arr ? ` De schuldenaar is gevestigd in het gerechtelijk arrondissement ${arr}.` : ""}`,
    zakelijk:
      "Het gaat om een onbetwiste geldschuld tussen ondernemingen. Wij verzoeken u de procedure tot invordering van onbetwiste geldschulden op te starten (art. 1394/20 e.v. Gerechtelijk Wetboek) en, zo nodig, de verdere gerechtelijke invordering.",
    particulier:
      "De schuldenaar is een particulier. Wij verzoeken u een minnelijke invordering, met inachtneming van de regels voor consumenten (boek XIX Wetboek van economisch recht). Wij vorderen enkel de hoofdsom.",
    overzicht: (d) => `Overzicht van de vordering (berekend op ${d})`,
    hoofdsom: (v) => `Hoofdsom factuur ${v.nummer} (vervallen op ${v.vervaldag})`,
    interest: (v) => `Verwijlinterest, wet van 2 augustus 2002 (${v.dagen} dagen, ${v.pct} per jaar)`,
    forfait: "Forfaitaire schadevergoeding (art. 6, wet van 2 augustus 2002)",
    totaal: "Totaal",
    interestLoopt: "De verwijlinterest loopt verder tot de volledige betaling.",
    verloopKop: "Verloop",
    geenBetaling: "Tot vandaag ontvingen wij geen betaling en geen betwisting van de factuur.",
    bijlagenKop: "Bijlagen",
    bijlageFactuur: (nr) => `Factuur ${nr}`,
    bijlageBewijs: "Bewijsdossier: offerte en aanvaarding, oplevering, factuur, herinneringen (volledige tekst) en voorwaarden",
    betaling: (iban, ogm) =>
      `Betaalt de schuldenaar ons rechtstreeks (rekening ${iban}, mededeling ${ogm}), dan verwittigen wij u meteen. Ontvangt u een betaling of een betwisting, dan horen wij het graag.`,
    contact: (mail, tel) => `Voor vragen bereikt u ons op ${mail} of ${tel}.`,
    groet: "Met vriendelijke groeten,",
    identiteit: (houder, btw) => `Studio VM is de handelsnaam van ${houder}, ondernemingsnummer ${btw}.`,
    offerteAanvaard: (nr) => `Offerte ${nr} aanvaard via het klantenportaal`,
    offerteVia: (ip, browser) => [ip ? `IP-adres ${ip}` : "", browser ? `browser: ${browser}` : ""].filter(Boolean).join(" · "),
    opgeleverd: (b) => `3D-model opgeleverd in het klantenportaal: ${b}`,
    factuurUitgereikt: (nr) => `Factuur ${nr} uitgereikt`,
    factuurVerstuurd: (aan) => `Factuur per e-mail verstuurd naar ${aan}`,
    herinnering: (n) => `Betalingsherinnering ${n} per e-mail verstuurd`,
    herinneringLaatste: "Laatste herinnering (ingebrekestelling) per e-mail verstuurd",
    gedownload: (b) => `Bestand gedownload door de klant: ${b}`,
    bewijsTitel: (nr) => `Bewijsdossier factuur ${nr}`,
    partijen: "Partijen",
    schuldeiser: "Schuldeiser",
    schuldenaar: "Schuldenaar",
    btwNr: "Btw-nummer",
    adres: "Adres",
    email: "E-mail",
    telefoon: "Telefoon",
    offerteKop: "Offerte en aanvaarding",
    offerteNr: "Offerte",
    onderwerp: "Onderwerp",
    bedrag: "Bedrag",
    aanvaardOp: "Aanvaard op",
    ipAdres: "IP-adres",
    browser: "Browser",
    projectKop: "Opdracht en oplevering",
    gewerkteUren: "Gewerkte uren",
    leveringen: "Opgeleverde bestanden",
    factuurKop: "Factuur",
    uitgereiktOp: "Uitgereikt op",
    vervaldag: "Vervaldag",
    mededeling: "Gestructureerde mededeling",
    herinneringenKop: "Herinneringen",
    herinneringenUitleg: "Hieronder de herinneringen zoals de klant ze per e-mail ontving, in de taal van de klant.",
    verstuurdOp: "Verstuurd op",
    verstuurdAan: "Verstuurd aan",
    resendId: "Verzendkenmerk",
    geenTekst: "(tekst niet bewaard: verstuurd vóór het bijhouden van de bewijslog)",
    voorwaardenKop: "Voorwaarden op de factuur",
    voorwaardenUitleg: "Deze voorwaarden staan op de factuur zelf, in de taal van de klant.",
    tijdlijnKop: "Tijdlijn",
    mailOnderwerp: (nr, klant) => `Invordering factuur ${nr} — ${klant}`,
    mailTitel: "Nieuw invorderingsdossier",
    mailRegels: (klant, nr, totaal) => [
      `Geachte meester,`,
      `In bijlage vindt u het dossier voor de invordering van factuur <b>${nr}</b> ten laste van <b>${klant}</b>, voor een totaal van <b>${totaal}</b>.`,
      "De begeleidende brief zet de vordering en het verloop op een rij.",
    ],
    mailBijlagen: "Bijlagen: begeleidende brief, factuur en bewijsdossier (pdf).",
    mailVoet: "Antwoorden op deze mail komt rechtstreeks bij Studio VM terecht.",
    mailKnop: "Factuur online bekijken",
  },
  fr: {
    plaatsDatum: (d) => `Anzegem, le ${d}`,
    aan: "À l'attention de",
    betreft: (nr, klant) => `Objet : recouvrement de la facture ${nr} — ${klant}`,
    referentie: (nr) => `Notre référence : ${nr}`,
    aanhef: "Maître,",
    inleiding: (klant, arr) =>
      `Par la présente, nous vous confions le recouvrement d'une facture impayée de ${klant}.${arr ? ` Le débiteur est établi dans l'arrondissement judiciaire de ${arr}.` : ""}`,
    zakelijk:
      "Il s'agit d'une dette d'argent non contestée entre entreprises. Nous vous prions d'entamer la procédure de recouvrement de dettes d'argent non contestées (art. 1394/20 et suivants du Code judiciaire) et, si nécessaire, le recouvrement judiciaire.",
    particulier:
      "Le débiteur est un particulier. Nous vous prions de procéder à un recouvrement amiable, dans le respect des règles applicables aux consommateurs (livre XIX du Code de droit économique). Nous ne réclamons que le principal.",
    overzicht: (d) => `Décompte de la créance (calculé le ${d})`,
    hoofdsom: (v) => `Principal, facture ${v.nummer} (échue le ${v.vervaldag})`,
    interest: (v) => `Intérêts de retard, loi du 2 août 2002 (${v.dagen} jours, ${v.pct} par an)`,
    forfait: "Indemnité forfaitaire (art. 6, loi du 2 août 2002)",
    totaal: "Total",
    interestLoopt: "Les intérêts de retard continuent à courir jusqu'au paiement complet.",
    verloopKop: "Déroulement",
    geenBetaling: "À ce jour, nous n'avons reçu ni paiement ni contestation de la facture.",
    bijlagenKop: "Annexes",
    bijlageFactuur: (nr) => `Facture ${nr}`,
    bijlageBewijs: "Dossier de preuves : offre et acceptation, livraison, facture, rappels (texte intégral) et conditions",
    betaling: (iban, ogm) =>
      `Si le débiteur nous paie directement (compte ${iban}, communication ${ogm}), nous vous en avertirons immédiatement. Merci de nous informer de tout paiement ou de toute contestation que vous recevriez.`,
    contact: (mail, tel) => `Pour toute question : ${mail} ou ${tel}.`,
    groet: "Veuillez agréer, Maître, l'expression de nos salutations distinguées.",
    identiteit: (houder, btw) => `Studio VM est le nom commercial de ${houder}, numéro d'entreprise ${btw}.`,
    offerteAanvaard: (nr) => `Offre ${nr} acceptée via l'espace client`,
    offerteVia: (ip, browser) => [ip ? `adresse IP ${ip}` : "", browser ? `navigateur : ${browser}` : ""].filter(Boolean).join(" · "),
    opgeleverd: (b) => `Modèle 3D livré dans l'espace client : ${b}`,
    factuurUitgereikt: (nr) => `Facture ${nr} émise`,
    factuurVerstuurd: (aan) => `Facture envoyée par e-mail à ${aan}`,
    herinnering: (n) => `Rappel de paiement ${n} envoyé par e-mail`,
    herinneringLaatste: "Dernier rappel (mise en demeure) envoyé par e-mail",
    gedownload: (b) => `Fichier téléchargé par le client : ${b}`,
    bewijsTitel: (nr) => `Dossier de preuves, facture ${nr}`,
    partijen: "Parties",
    schuldeiser: "Créancier",
    schuldenaar: "Débiteur",
    btwNr: "Numéro de TVA",
    adres: "Adresse",
    email: "E-mail",
    telefoon: "Téléphone",
    offerteKop: "Offre et acceptation",
    offerteNr: "Offre",
    onderwerp: "Objet",
    bedrag: "Montant",
    aanvaardOp: "Acceptée le",
    ipAdres: "Adresse IP",
    browser: "Navigateur",
    projectKop: "Mission et livraison",
    gewerkteUren: "Heures prestées",
    leveringen: "Fichiers livrés",
    factuurKop: "Facture",
    uitgereiktOp: "Émise le",
    vervaldag: "Échéance",
    mededeling: "Communication structurée",
    herinneringenKop: "Rappels",
    herinneringenUitleg: "Ci-dessous les rappels tels que le client les a reçus par e-mail, dans la langue du client.",
    verstuurdOp: "Envoyé le",
    verstuurdAan: "Envoyé à",
    resendId: "Référence d'envoi",
    geenTekst: "(texte non conservé : envoyé avant la tenue du registre de preuves)",
    voorwaardenKop: "Conditions figurant sur la facture",
    voorwaardenUitleg: "Ces conditions figurent sur la facture elle-même, dans la langue du client.",
    tijdlijnKop: "Chronologie",
    mailOnderwerp: (nr, klant) => `Recouvrement facture ${nr} — ${klant}`,
    mailTitel: "Nouveau dossier de recouvrement",
    mailRegels: (klant, nr, totaal) => [
      "Maître,",
      `Vous trouverez en annexe le dossier de recouvrement de la facture <b>${nr}</b> à charge de <b>${klant}</b>, pour un total de <b>${totaal}</b>.`,
      "La lettre d'accompagnement reprend le décompte et le déroulement.",
    ],
    mailBijlagen: "Annexes : lettre d'accompagnement, facture et dossier de preuves (pdf).",
    mailVoet: "Une réponse à cet e-mail parvient directement à Studio VM.",
    mailKnop: "Voir la facture en ligne",
  },
  de: {
    plaatsDatum: (d) => `Anzegem, den ${d}`,
    aan: "An",
    betreft: (nr, klant) => `Betreff: Beitreibung der Rechnung ${nr} — ${klant}`,
    referentie: (nr) => `Unser Zeichen: ${nr}`,
    aanhef: "Sehr geehrte Damen und Herren,",
    inleiding: (klant, arr) =>
      `hiermit beauftragen wir Sie mit der Beitreibung einer unbezahlten Rechnung von ${klant}.${arr ? ` Der Schuldner hat seinen Sitz im Gerichtsbezirk ${arr}.` : ""}`,
    zakelijk:
      "Es handelt sich um eine unbestrittene Geldforderung zwischen Unternehmen. Wir bitten Sie, das Verfahren zur Beitreibung unbestrittener Geldforderungen (Art. 1394/20 ff. Gerichtsgesetzbuch) und, falls nötig, die weitere gerichtliche Beitreibung einzuleiten.",
    particulier:
      "Der Schuldner ist eine Privatperson. Wir bitten Sie um eine gütliche Beitreibung unter Beachtung der Regeln für Verbraucher (Buch XIX des Wirtschaftsgesetzbuches). Wir fordern nur die Hauptsumme.",
    overzicht: (d) => `Forderungsaufstellung (berechnet am ${d})`,
    hoofdsom: (v) => `Hauptsumme Rechnung ${v.nummer} (fällig am ${v.vervaldag})`,
    interest: (v) => `Verzugszinsen, Gesetz vom 2. August 2002 (${v.dagen} Tage, ${v.pct} pro Jahr)`,
    forfait: "Pauschalentschädigung (Art. 6, Gesetz vom 2. August 2002)",
    totaal: "Gesamt",
    interestLoopt: "Die Verzugszinsen laufen bis zur vollständigen Zahlung weiter.",
    verloopKop: "Verlauf",
    geenBetaling: "Bis heute haben wir weder eine Zahlung noch einen Widerspruch gegen die Rechnung erhalten.",
    bijlagenKop: "Anlagen",
    bijlageFactuur: (nr) => `Rechnung ${nr}`,
    bijlageBewijs: "Beweisakte: Angebot und Annahme, Lieferung, Rechnung, Mahnungen (vollständiger Text) und Bedingungen",
    betaling: (iban, ogm) =>
      `Zahlt der Schuldner direkt an uns (Konto ${iban}, Mitteilung ${ogm}), informieren wir Sie umgehend. Bitte teilen Sie uns mit, wenn bei Ihnen eine Zahlung oder ein Widerspruch eingeht.`,
    contact: (mail, tel) => `Für Rückfragen erreichen Sie uns unter ${mail} oder ${tel}.`,
    groet: "Mit freundlichen Grüßen",
    identiteit: (houder, btw) => `Studio VM ist der Handelsname von ${houder}, Unternehmensnummer ${btw}.`,
    offerteAanvaard: (nr) => `Angebot ${nr} über das Kundenportal angenommen`,
    offerteVia: (ip, browser) => [ip ? `IP-Adresse ${ip}` : "", browser ? `Browser: ${browser}` : ""].filter(Boolean).join(" · "),
    opgeleverd: (b) => `3D-Modell im Kundenportal geliefert: ${b}`,
    factuurUitgereikt: (nr) => `Rechnung ${nr} ausgestellt`,
    factuurVerstuurd: (aan) => `Rechnung per E-Mail gesendet an ${aan}`,
    herinnering: (n) => `Zahlungserinnerung ${n} per E-Mail gesendet`,
    herinneringLaatste: "Letzte Mahnung (Inverzugsetzung) per E-Mail gesendet",
    gedownload: (b) => `Datei vom Kunden heruntergeladen: ${b}`,
    bewijsTitel: (nr) => `Beweisakte Rechnung ${nr}`,
    partijen: "Parteien",
    schuldeiser: "Gläubiger",
    schuldenaar: "Schuldner",
    btwNr: "MwSt.-Nummer",
    adres: "Adresse",
    email: "E-Mail",
    telefoon: "Telefon",
    offerteKop: "Angebot und Annahme",
    offerteNr: "Angebot",
    onderwerp: "Gegenstand",
    bedrag: "Betrag",
    aanvaardOp: "Angenommen am",
    ipAdres: "IP-Adresse",
    browser: "Browser",
    projectKop: "Auftrag und Lieferung",
    gewerkteUren: "Geleistete Stunden",
    leveringen: "Gelieferte Dateien",
    factuurKop: "Rechnung",
    uitgereiktOp: "Ausgestellt am",
    vervaldag: "Fällig am",
    mededeling: "Strukturierte Mitteilung",
    herinneringenKop: "Mahnungen",
    herinneringenUitleg: "Nachfolgend die Mahnungen, wie der Kunde sie per E-Mail erhalten hat, in der Sprache des Kunden.",
    verstuurdOp: "Gesendet am",
    verstuurdAan: "Gesendet an",
    resendId: "Versandkennung",
    geenTekst: "(Text nicht gespeichert: vor Einführung des Beweisprotokolls gesendet)",
    voorwaardenKop: "Bedingungen auf der Rechnung",
    voorwaardenUitleg: "Diese Bedingungen stehen auf der Rechnung selbst, in der Sprache des Kunden.",
    tijdlijnKop: "Zeitlicher Ablauf",
    mailOnderwerp: (nr, klant) => `Beitreibung Rechnung ${nr} — ${klant}`,
    mailTitel: "Neue Beitreibungsakte",
    mailRegels: (klant, nr, totaal) => [
      "Sehr geehrte Damen und Herren,",
      `anbei erhalten Sie die Akte zur Beitreibung der Rechnung <b>${nr}</b> zulasten von <b>${klant}</b>, über insgesamt <b>${totaal}</b>.`,
      "Das Begleitschreiben enthält die Forderungsaufstellung und den Verlauf.",
    ],
    mailBijlagen: "Anlagen: Begleitschreiben, Rechnung und Beweisakte (PDF).",
    mailVoet: "Antworten auf diese E-Mail gehen direkt an Studio VM.",
    mailKnop: "Rechnung online ansehen",
  },
};

/** Naam van het gerechtelijk arrondissement in de taal van de brief. */
export const ARR_NAAM: Record<BriefTaal, Record<string, string>> = {
  nl: {
    antwerpen: "Antwerpen", limburg: "Limburg", "oost-vlaanderen": "Oost-Vlaanderen", "west-vlaanderen": "West-Vlaanderen",
    leuven: "Leuven", brussel: "Brussel", "waals-brabant": "Waals-Brabant", henegouwen: "Henegouwen", luik: "Luik",
    luxemburg: "Luxemburg", namen: "Namen", eupen: "Eupen",
  },
  fr: {
    antwerpen: "Anvers", limburg: "Limbourg", "oost-vlaanderen": "Flandre orientale", "west-vlaanderen": "Flandre occidentale",
    leuven: "Louvain", brussel: "Bruxelles", "waals-brabant": "Brabant wallon", henegouwen: "Hainaut", luik: "Liège",
    luxemburg: "Luxembourg", namen: "Namur", eupen: "Eupen",
  },
  de: {
    antwerpen: "Antwerpen", limburg: "Limburg", "oost-vlaanderen": "Ostflandern", "west-vlaanderen": "Westflandern",
    leuven: "Löwen", brussel: "Brüssel", "waals-brabant": "Wallonisch-Brabant", henegouwen: "Hennegau", luik: "Lüttich",
    luxemburg: "Luxemburg", namen: "Namur", eupen: "Eupen",
  },
};

// ── Factuurkopie (taal van de klant) ────────────────────────────────────

export const FACTUUR_L: Record<
  Locale,
  { titel: string; van: string; voor: string; uitgereikt: string; excl: string; incl: string; betaling: string; voor_: string; begunstigde: string; mededeling: string; kopie: string }
> = {
  nl: { titel: "Factuur", van: "Van", voor: "Voor", uitgereikt: "Uitgereikt op", excl: "Subtotaal (excl. btw)", incl: "Totaal incl. btw", betaling: "Betaling", voor_: "Te betalen vóór", begunstigde: "Begunstigde", mededeling: "Gestructureerde mededeling", kopie: "Kopie van de factuur" },
  fr: { titel: "Facture", van: "De", voor: "Pour", uitgereikt: "Émise le", excl: "Sous-total (hors TVA)", incl: "Total TTC", betaling: "Paiement", voor_: "À payer avant le", begunstigde: "Bénéficiaire", mededeling: "Communication structurée", kopie: "Copie de la facture" },
  en: { titel: "Invoice", van: "From", voor: "To", uitgereikt: "Issued on", excl: "Subtotal (excl. VAT)", incl: "Total incl. VAT", betaling: "Payment", voor_: "Due by", begunstigde: "Beneficiary", mededeling: "Structured reference", kopie: "Copy of the invoice" },
  de: { titel: "Rechnung", van: "Von", voor: "An", uitgereikt: "Ausgestellt am", excl: "Zwischensumme (exkl. MwSt.)", incl: "Gesamt inkl. MwSt.", betaling: "Zahlung", voor_: "Zahlbar bis", begunstigde: "Empfänger", mededeling: "Strukturierte Mitteilung", kopie: "Kopie der Rechnung" },
  es: { titel: "Factura", van: "De", voor: "Para", uitgereikt: "Emitida el", excl: "Subtotal (IVA no incluido)", incl: "Total IVA incluido", betaling: "Pago", voor_: "A pagar antes del", begunstigde: "Beneficiario", mededeling: "Comunicación estructurada", kopie: "Copia de la factura" },
};
