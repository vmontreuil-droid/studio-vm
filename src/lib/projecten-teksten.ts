// Klantgerichte teksten rond 3D-projecten (offerte, factuur, mails) in de
// vijf talen van de site. Puur: geen server- of databank-afhankelijkheid,
// dus bruikbaar in server actions én in pagina's.
import { CATEGORIE_LABEL, type Project } from "@/lib/projecten";
import { euro } from "@/lib/tarieven";

export type Taal = "nl" | "fr" | "en" | "de" | "es";
export const TALEN: Taal[] = ["nl", "fr", "en", "de", "es"];
export const TAAL_NAAM: Record<Taal, string> = {
  nl: "Nederlands",
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
};

export function isTaal(x: unknown): x is Taal {
  return typeof x === "string" && (TALEN as string[]).includes(x);
}

const LOCALE: Record<Taal, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB", de: "de-DE", es: "es-ES" };

/** 6.5 → "6,5 u" / "6.5 h" / "6,5 Std." */
export function urenTekst(u: number, t: Taal): string {
  const n = new Intl.NumberFormat(LOCALE[t], { maximumFractionDigits: 2 }).format(u);
  return `${n} ${t === "nl" ? "u" : t === "de" ? "Std." : "h"}`;
}

export function datumTekst(d: string, t: Taal): string {
  const x = new Date(`${d}T12:00:00`);
  if (Number.isNaN(x.getTime())) return d;
  return x.toLocaleDateString(LOCALE[t], { day: "numeric", month: "long", year: "numeric" });
}

/** Offertelijn voor het modelleerwerk. */
export function modelLijn(
  t: Taal,
  uren: number,
  tariefCent: number,
  categorie: Project["categorie"],
): { label: string; desc: string } {
  const cat = CATEGORIE_LABEL[categorie][t];
  const per = `${urenTekst(uren, t)} × ${euro(tariefCent, t)}`;
  const L = {
    nl: { label: `3D-model voor machinesturing — ${per}`, desc: `Uurtarief ${cat.toLowerCase()}, excl. btw · minimum 1 uur` },
    fr: { label: `Modèle 3D pour guidage d'engins — ${per}`, desc: `Tarif horaire ${cat.toLowerCase()}, HTVA · minimum 1 heure` },
    en: { label: `3D model for machine control — ${per}`, desc: `${cat} hourly rate, excl. VAT · 1 hour minimum` },
    de: { label: `3D-Modell für Maschinensteuerung — ${per}`, desc: `Stundensatz ${cat}, exkl. MwSt. · mindestens 1 Stunde` },
    es: { label: `Modelo 3D para control de máquina — ${per}`, desc: `Tarifa por hora ${cat.toLowerCase()}, IVA no incluido · mínimo 1 hora` },
  };
  return L[t];
}

/** €0-lijn: alle gevraagde systemen zijn inbegrepen. */
export function systemenLijn(t: Taal, merken: string[]): { label: string; desc: string } {
  const lijst = merken.join(", ");
  const L = {
    nl: { label: `Formaten voor ${merken.length === 1 ? "uw machinesturing" : "al uw machinesturingen"}`, desc: lijst },
    fr: { label: `Formats pour ${merken.length === 1 ? "votre système de guidage" : "tous vos systèmes de guidage"}`, desc: lijst },
    en: { label: `Formats for ${merken.length === 1 ? "your machine control system" : "all your machine control systems"}`, desc: lijst },
    de: { label: `Formate für ${merken.length === 1 ? "Ihre Maschinensteuerung" : "alle Ihre Maschinensteuerungen"}`, desc: lijst },
    es: { label: `Formatos para ${merken.length === 1 ? "su sistema de control de máquina" : "todos sus sistemas de control de máquina"}`, desc: lijst },
  };
  return L[t];
}

export const KORTING_LABEL: Record<Taal, string> = {
  nl: "Korting",
  fr: "Remise",
  en: "Discount",
  de: "Rabatt",
  es: "Descuento",
};

export type IntroGegevens = {
  titel: string;
  werf: string;
  merken: string[];
  stelsel: Project["stelsel"];
  leverdatum: string | null;
  uren: number;
  tariefCent: number;
  categorie: Project["categorie"];
};

/** Begeleidende tekst van een 3D-offerte, in de taal van de klant (bewerkbaar). */
export function introOfferte(t: Taal, g: IntroGegevens): string {
  const merken = g.merken.length ? g.merken.join(", ") : "—";
  const uren = urenTekst(g.uren, t);
  const tarief = euro(g.tariefCent, t);
  const cat = CATEGORIE_LABEL[g.categorie][t].toLowerCase();
  const st = g.stelsel;
  const lev = g.leverdatum ? datumTekst(g.leverdatum, t) : null;
  const p: string[] = [];
  switch (t) {
    case "fr":
      p.push("Bonjour,");
      p.push(`Merci pour votre demande. Voici mon devis pour le modèle 3D « ${g.titel} »${g.werf ? ` (chantier : ${g.werf})` : ""}.`);
      p.push(`Je modélise le projet en fichiers 3D pour le guidage d'engins, prêts pour : ${merken}. Les systèmes de guidage supplémentaires sont livrés sans frais.`);
      if (st) p.push(`Système de coordonnées : ${st.stelsel} (${st.epsg}), référence altimétrique ${st.hoogte}. Si vous travaillez avec un système local de chantier ou votre propre calibration, merci de me le signaler avant le démarrage.`);
      if (lev) p.push(`Livraison prévue : ${lev}.`);
      p.push(`Le prix est basé sur une estimation de ${uren} de travail à ${tarief}/h (tarif ${cat}), HTVA. Je facture les heures réellement prestées (minimum 1 heure) ; si le travail dépasse nettement l'estimation, vous en êtes informé au préalable. Les révisions suite à une modification des plans sont facturées au même tarif horaire.`);
      p.push("Les fichiers du modèle sont disponibles dans votre espace client et sont débloqués dès que la facture est payée. Vérifiez le modèle avant de commencer sur un point connu, en position et en altitude.");
      p.push("Accepter ou refuser se fait en un clic dans votre espace client. Une question ? Répondez simplement à ce mail.");
      break;
    case "en":
      p.push("Hello,");
      p.push(`Thank you for your request. Here is my quote for the 3D model “${g.titel}”${g.werf ? ` (site: ${g.werf})` : ""}.`);
      p.push(`I model the design as 3D files for machine control, ready for: ${merken}. Additional machine control systems are delivered at no extra cost.`);
      if (st) p.push(`Coordinate system: ${st.stelsel} (${st.epsg}), height reference ${st.hoogte}. If you work with a local site system or your own calibration, please let me know before the start.`);
      if (lev) p.push(`Planned delivery: ${lev}.`);
      p.push(`The price is based on an estimated ${uren} of work at ${tarief}/h (${cat} rate), excl. VAT. I invoice the hours actually worked (1 hour minimum); if the work turns out clearly above the estimate, you will hear from me beforehand. Revisions after plan changes are charged at the same hourly rate.`);
      p.push("The model files are available in your client portal and are released as soon as the invoice is paid. Check the model on a known point before you start, in position and height.");
      p.push("You can accept or decline with one click in your portal. Any questions? Simply reply to this email.");
      break;
    case "de":
      p.push("Guten Tag,");
      p.push(`vielen Dank für Ihre Anfrage. Hier mein Angebot für das 3D-Modell „${g.titel}“${g.werf ? ` (Baustelle: ${g.werf})` : ""}.`);
      p.push(`Ich modelliere die Planung als 3D-Dateien für die Maschinensteuerung, fertig für: ${merken}. Zusätzliche Maschinensteuerungssysteme liefere ich ohne Aufpreis.`);
      if (st) p.push(`Koordinatensystem: ${st.stelsel} (${st.epsg}), Höhenbezug ${st.hoogte}. Arbeiten Sie mit einem lokalen Baustellensystem oder einer eigenen Kalibrierung, teilen Sie mir das bitte vor dem Start mit.`);
      if (lev) p.push(`Geplante Lieferung: ${lev}.`);
      p.push(`Der Preis basiert auf geschätzten ${uren} Arbeit zu ${tarief}/Std. (Tarif ${CATEGORIE_LABEL[g.categorie].de}), exkl. MwSt. Abgerechnet werden die tatsächlich geleisteten Stunden (mindestens 1 Stunde); liegt der Aufwand deutlich über der Schätzung, informiere ich Sie vorab. Revisionen nach Planänderungen werden zum gleichen Stundensatz berechnet.`);
      p.push("Die Modelldateien stehen in Ihrem Kundenportal bereit und werden freigegeben, sobald die Rechnung bezahlt ist. Prüfen Sie das Modell vor Beginn an einem bekannten Punkt, in Lage und Höhe.");
      p.push("Annehmen oder ablehnen können Sie mit einem Klick in Ihrem Portal. Fragen? Antworten Sie einfach auf diese E-Mail.");
      break;
    case "es":
      p.push("Buenos días:");
      p.push(`Gracias por su solicitud. Le envío mi presupuesto para el modelo 3D «${g.titel}»${g.werf ? ` (obra: ${g.werf})` : ""}.`);
      p.push(`Modelo el proyecto en archivos 3D para control de máquina, listos para: ${merken}. Los sistemas de control de máquina adicionales se entregan sin coste extra.`);
      if (st) p.push(`Sistema de coordenadas: ${st.stelsel} (${st.epsg}), referencia de altitud ${st.hoogte}. Si trabaja con un sistema local de obra o con su propia calibración, indíquemelo antes de empezar.`);
      if (lev) p.push(`Entrega prevista: ${lev}.`);
      p.push(`El precio se basa en una estimación de ${uren} de trabajo a ${tarief}/h (tarifa ${cat}), IVA no incluido. Facturo las horas realmente trabajadas (mínimo 1 hora); si el trabajo supera claramente la estimación, se lo comunicaré de antemano. Las revisiones por cambios en los planos se facturan a la misma tarifa por hora.`);
      p.push("Los archivos del modelo están en su portal de cliente y se liberan en cuanto se paga la factura. Compruebe el modelo antes de empezar en un punto conocido, en planimetría y en altura.");
      p.push("Puede aceptar o rechazar con un clic en su portal. ¿Alguna pregunta? Basta con responder a este correo.");
      break;
    default:
      p.push("Beste,");
      p.push(`Bedankt voor uw aanvraag. Hierbij mijn offerte voor het 3D-model “${g.titel}”${g.werf ? ` (werf: ${g.werf})` : ""}.`);
      p.push(`Ik modelleer het ontwerp als 3D-bestanden voor machinesturing, klaar voor: ${merken}. Extra machinesturingssystemen lever ik zonder meerprijs.`);
      if (st) p.push(`Coördinatenstelsel: ${st.stelsel} (${st.epsg}), hoogtereferentie ${st.hoogte}. Werkt u met een lokaal werfstelsel of een eigen kalibratie, laat het me dan weten vóór de start.`);
      if (lev) p.push(`Geplande levering: ${lev}.`);
      p.push(`De prijs is gebaseerd op een geschatte ${uren} werk aan ${tarief}/u (tarief ${cat}), excl. btw. Ik factureer de werkelijk gepresteerde uren (minimum 1 uur); valt het werk duidelijk hoger uit dan geschat, dan hoort u dat vooraf. Revisies na planwijzigingen worden aan hetzelfde uurtarief aangerekend.`);
      p.push("De modelbestanden staan in uw klantenportaal en worden vrijgegeven zodra de factuur betaald is. Controleer het model vóór de start op een gekend punt, in ligging én hoogte.");
      p.push("Aanvaarden of afwijzen kan met één klik in uw portaal. Vragen? Antwoord gewoon op deze mail.");
  }
  return p.join("\n\n");
}

/** Omschrijving op de factuur. */
export function factuurOmschrijving(t: Taal, titel: string, uren: number, tariefCent: number): string {
  const per = `${urenTekst(uren, t)} × ${euro(tariefCent, t)}`;
  const L: Record<Taal, string> = {
    nl: `3D-model — ${titel} · ${per}`,
    fr: `Modèle 3D — ${titel} · ${per}`,
    en: `3D model — ${titel} · ${per}`,
    de: `3D-Modell — ${titel} · ${per}`,
    es: `Modelo 3D — ${titel} · ${per}`,
  };
  return L[t];
}

// Mailteksten. `x` = HTML-veilige titel.
export const MAIL: Record<
  Taal,
  {
    eyebrow: string;
    cta: string;
    footnote: string;
    hallo: (naam: string | null) => string;
    offerteOnderwerp: (titel: string) => string;
    offerteL1: (x: string) => string;
    offerteL2: (bedragIncl: string, geldig: string) => string;
    factuurOnderwerp: (nr: string) => string;
    factuurL1: (nr: string, x: string, bedrag: string) => string;
    factuurL2: (due: string) => string;
    leveringOnderwerp: (titel: string) => string;
    leveringL1: (x: string, versie: number) => string;
    leveringSystemen: (lijst: string) => string;
    leveringBetaald: string;
    leveringOnbetaald: string;
    leveringControle: string;
  }
> = {
  nl: {
    eyebrow: "Uw klantenportaal",
    cta: "Open uw project",
    footnote: "U logt in met uw e-mailadres — u krijgt een veilige inloglink, geen wachtwoord nodig.",
    hallo: (n) => (n ? `Beste ${n},` : "Beste,"),
    offerteOnderwerp: (x) => `Uw offerte voor ${x}`,
    offerteL1: (x) => `De offerte voor het 3D-model <strong>${x}</strong> staat klaar in uw klantenportaal.`,
    offerteL2: (b, g) => `Totaal ${b} incl. btw, geldig tot ${g}. Aanvaarden of afwijzen kan met één klik — daarna start ik met modelleren.`,
    factuurOnderwerp: (nr) => `Uw factuur ${nr} staat klaar`,
    factuurL1: (nr, x, b) => `Factuur <strong>${nr}</strong> voor <strong>${x}</strong> (${b} incl. btw) staat klaar in uw portaal.`,
    factuurL2: (d) => `Betaalbaar tegen ${d}, online via Mollie of via overschrijving. Zodra de factuur betaald is, kunt u de modelbestanden downloaden.`,
    leveringOnderwerp: (x) => `Nieuwe modelbestanden voor ${x}`,
    leveringL1: (x, v) => `De modelbestanden (versie ${v}) voor <strong>${x}</strong> staan klaar in uw klantenportaal.`,
    leveringSystemen: (l) => `Formaten: ${l}.`,
    leveringBetaald: "U kunt ze meteen downloaden.",
    leveringOnbetaald: "U kunt ze downloaden zodra de factuur van het project betaald is — dat kan rechtstreeks in het portaal.",
    leveringControle: "Controleer het model vóór de start op een gekend punt, in ligging én hoogte.",
  },
  fr: {
    eyebrow: "Votre espace client",
    cta: "Ouvrir votre projet",
    footnote: "Connectez-vous avec votre adresse e-mail — vous recevez un lien sécurisé, sans mot de passe.",
    hallo: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
    offerteOnderwerp: (x) => `Votre devis pour ${x}`,
    offerteL1: (x) => `Le devis pour le modèle 3D <strong>${x}</strong> est disponible dans votre espace client.`,
    offerteL2: (b, g) => `Total ${b} TVAC, valable jusqu'au ${g}. Accepter ou refuser se fait en un clic — ensuite je commence la modélisation.`,
    factuurOnderwerp: (nr) => `Votre facture ${nr} est prête`,
    factuurL1: (nr, x, b) => `La facture <strong>${nr}</strong> pour <strong>${x}</strong> (${b} TVAC) est disponible dans votre espace client.`,
    factuurL2: (d) => `Payable pour le ${d}, en ligne via Mollie ou par virement. Dès que la facture est payée, vous pouvez télécharger les fichiers du modèle.`,
    leveringOnderwerp: (x) => `Nouveaux fichiers du modèle pour ${x}`,
    leveringL1: (x, v) => `Les fichiers du modèle (version ${v}) pour <strong>${x}</strong> sont disponibles dans votre espace client.`,
    leveringSystemen: (l) => `Formats : ${l}.`,
    leveringBetaald: "Vous pouvez les télécharger immédiatement.",
    leveringOnbetaald: "Vous pourrez les télécharger dès que la facture du projet est payée — directement depuis l'espace client.",
    leveringControle: "Vérifiez le modèle avant de commencer sur un point connu, en position et en altitude.",
  },
  en: {
    eyebrow: "Your client portal",
    cta: "Open your project",
    footnote: "Sign in with your email address — you get a secure login link, no password needed.",
    hallo: (n) => (n ? `Dear ${n},` : "Hello,"),
    offerteOnderwerp: (x) => `Your quote for ${x}`,
    offerteL1: (x) => `The quote for the 3D model <strong>${x}</strong> is ready in your client portal.`,
    offerteL2: (b, g) => `Total ${b} incl. VAT, valid until ${g}. Accept or decline with one click — then I start modelling.`,
    factuurOnderwerp: (nr) => `Your invoice ${nr} is ready`,
    factuurL1: (nr, x, b) => `Invoice <strong>${nr}</strong> for <strong>${x}</strong> (${b} incl. VAT) is ready in your portal.`,
    factuurL2: (d) => `Payable by ${d}, online via Mollie or by bank transfer. As soon as the invoice is paid, you can download the model files.`,
    leveringOnderwerp: (x) => `New model files for ${x}`,
    leveringL1: (x, v) => `The model files (version ${v}) for <strong>${x}</strong> are ready in your client portal.`,
    leveringSystemen: (l) => `Formats: ${l}.`,
    leveringBetaald: "You can download them right away.",
    leveringOnbetaald: "You can download them as soon as the project invoice is paid — directly in the portal.",
    leveringControle: "Check the model on a known point before you start, in position and height.",
  },
  de: {
    eyebrow: "Ihr Kundenportal",
    cta: "Ihr Projekt öffnen",
    footnote: "Melden Sie sich mit Ihrer E-Mail-Adresse an — Sie erhalten einen sicheren Anmeldelink, kein Passwort nötig.",
    hallo: (n) => (n ? `Guten Tag ${n},` : "Guten Tag,"),
    offerteOnderwerp: (x) => `Ihr Angebot für ${x}`,
    offerteL1: (x) => `Das Angebot für das 3D-Modell <strong>${x}</strong> steht in Ihrem Kundenportal bereit.`,
    offerteL2: (b, g) => `Gesamt ${b} inkl. MwSt., gültig bis ${g}. Annehmen oder ablehnen mit einem Klick — danach beginne ich mit der Modellierung.`,
    factuurOnderwerp: (nr) => `Ihre Rechnung ${nr} ist bereit`,
    factuurL1: (nr, x, b) => `Die Rechnung <strong>${nr}</strong> für <strong>${x}</strong> (${b} inkl. MwSt.) steht in Ihrem Portal bereit.`,
    factuurL2: (d) => `Zahlbar bis ${d}, online über Mollie oder per Überweisung. Sobald die Rechnung bezahlt ist, können Sie die Modelldateien herunterladen.`,
    leveringOnderwerp: (x) => `Neue Modelldateien für ${x}`,
    leveringL1: (x, v) => `Die Modelldateien (Version ${v}) für <strong>${x}</strong> stehen in Ihrem Kundenportal bereit.`,
    leveringSystemen: (l) => `Formate: ${l}.`,
    leveringBetaald: "Sie können sie sofort herunterladen.",
    leveringOnbetaald: "Sie können sie herunterladen, sobald die Projektrechnung bezahlt ist — direkt im Portal.",
    leveringControle: "Prüfen Sie das Modell vor Beginn an einem bekannten Punkt, in Lage und Höhe.",
  },
  es: {
    eyebrow: "Su portal de cliente",
    cta: "Abrir su proyecto",
    footnote: "Acceda con su dirección de correo electrónico — recibirá un enlace seguro, sin necesidad de contraseña.",
    hallo: (n) => (n ? `Estimado/a ${n}:` : "Buenos días:"),
    offerteOnderwerp: (x) => `Su presupuesto para ${x}`,
    offerteL1: (x) => `El presupuesto para el modelo 3D <strong>${x}</strong> está disponible en su portal de cliente.`,
    offerteL2: (b, g) => `Total ${b} IVA incluido, válido hasta el ${g}. Puede aceptarlo o rechazarlo con un clic — después empiezo con el modelado.`,
    factuurOnderwerp: (nr) => `Su factura ${nr} está lista`,
    factuurL1: (nr, x, b) => `La factura <strong>${nr}</strong> para <strong>${x}</strong> (${b} IVA incluido) está disponible en su portal.`,
    factuurL2: (d) => `Pagadera antes del ${d}, en línea con Mollie o por transferencia bancaria. En cuanto se pague la factura, podrá descargar los archivos del modelo.`,
    leveringOnderwerp: (x) => `Nuevos archivos del modelo para ${x}`,
    leveringL1: (x, v) => `Los archivos del modelo (versión ${v}) para <strong>${x}</strong> están disponibles en su portal de cliente.`,
    leveringSystemen: (l) => `Formatos: ${l}.`,
    leveringBetaald: "Puede descargarlos de inmediato.",
    leveringOnbetaald: "Podrá descargarlos en cuanto se pague la factura del proyecto — directamente en el portal.",
    leveringControle: "Compruebe el modelo antes de empezar en un punto conocido, en planimetría y en altura.",
  },
};
