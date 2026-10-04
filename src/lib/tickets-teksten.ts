// Teksten rond tickets (Support) in de vijf talen van de site — formeel
// (u / vous / Sie / usted), in de ik-vorm van Studio VM. Puur: geen server-
// of databank-afhankelijkheid, dus bruikbaar in server actions, pagina's én
// client components. Elke meertalige tekst is getypeerd als Record<Locale, …>,
// zodat TypeScript alle vijf de talen afdwingt.

import type { Locale } from "@/lib/i18n/config";
import { MINIMUM_UREN, euro } from "@/lib/tarieven";
import { urenTekst, type Taal } from "@/lib/projecten-teksten";
import {
  AUTO_SLUIT_DAGEN,
  BIJLAGE_MAX_AANTAL,
  BIJLAGE_MAX_BYTES,
  HEROPEN_DAGEN,
  type KlantSoort,
  type KlantStatus,
  type TicketFout,
  type TicketSoort,
} from "@/lib/tickets";

const MB = Math.round(BIJLAGE_MAX_BYTES / 1024 / 1024);
const N = BIJLAGE_MAX_AANTAL;
const H = HEROPEN_DAGEN;
const A = AUTO_SLUIT_DAGEN;

// ── Soorten en status ───────────────────────────────────────────────────

export const SOORT_LABEL: Record<TicketSoort, Record<Locale, string>> = {
  vraag: { nl: "Vraag", fr: "Question", en: "Question", de: "Frage", es: "Pregunta" },
  revisie: { nl: "Revisie", fr: "Révision", en: "Revision", de: "Revision", es: "Revisión" },
  machine: {
    nl: "Machineprobleem",
    fr: "Problème machine",
    en: "Machine issue",
    de: "Maschinenproblem",
    es: "Problema en máquina",
  },
  afspraak: { nl: "Afspraak", fr: "Rendez-vous", en: "Appointment", de: "Termin", es: "Cita" },
  intern: { nl: "Intern", fr: "Interne", en: "Internal", de: "Intern", es: "Interno" },
};

/** Eén regel uitleg per soort die de klant kan kiezen. */
export const SOORT_UITLEG: Record<KlantSoort, Record<Locale, string>> = {
  vraag: {
    nl: "Een vraag over een model, een levering of uw project.",
    fr: "Une question sur un modèle, une livraison ou votre projet.",
    en: "A question about a model, a delivery or your project.",
    de: "Eine Frage zu einem Modell, einer Lieferung oder Ihrem Projekt.",
    es: "Una pregunta sobre un modelo, una entrega o su proyecto.",
  },
  revisie: {
    nl: "Het plan is gewijzigd en het model moet aangepast worden. Gefactureerd per uur.",
    fr: "Le plan a changé et le modèle doit être adapté. Facturé à l'heure.",
    en: "The plan has changed and the model needs to be updated. Billed per hour.",
    de: "Der Plan hat sich geändert und das Modell muss angepasst werden. Abrechnung nach Stunden.",
    es: "El plano ha cambiado y hay que adaptar el modelo. Se factura por horas.",
  },
  machine: {
    nl: "Het model gedraagt zich verkeerd op de machine: ligging, hoogte of inladen.",
    fr: "Le modèle se comporte mal sur la machine : position, altitude ou importation.",
    en: "The model behaves wrongly on the machine: position, height or import.",
    de: "Das Modell verhält sich auf der Maschine falsch: Lage, Höhe oder Import.",
    es: "El modelo no funciona bien en la máquina: posición, altura o importación.",
  },
};

export const KLANT_STATUS_LABEL: Record<KlantStatus, Record<Locale, string>> = {
  wacht_op_studio: {
    nl: "Wacht op antwoord",
    fr: "En attente de réponse",
    en: "Awaiting reply",
    de: "Wartet auf Antwort",
    es: "Esperando respuesta",
  },
  antwoord_ontvangen: {
    nl: "Antwoord ontvangen",
    fr: "Réponse reçue",
    en: "Reply received",
    de: "Antwort erhalten",
    es: "Respuesta recibida",
  },
  gesloten: { nl: "Gesloten", fr: "Fermé", en: "Closed", de: "Geschlossen", es: "Cerrado" },
};

// ── Foutmeldingen ───────────────────────────────────────────────────────

export const FOUT_TEKST: Record<TicketFout, Record<Locale, string>> = {
  login: {
    nl: "Uw sessie is verlopen. Meld u opnieuw aan en probeer het nog eens.",
    fr: "Votre session a expiré. Reconnectez-vous et réessayez.",
    en: "Your session has expired. Please sign in again and try once more.",
    de: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an und versuchen Sie es noch einmal.",
    es: "Su sesión ha caducado. Vuelva a iniciar sesión e inténtelo de nuevo.",
  },
  leeg: {
    nl: "Vul alle verplichte velden in.",
    fr: "Veuillez remplir tous les champs obligatoires.",
    en: "Please fill in all required fields.",
    de: "Bitte füllen Sie alle Pflichtfelder aus.",
    es: "Rellene todos los campos obligatorios.",
  },
  te_lang: {
    nl: "Uw tekst is te lang. Kort hem in of voeg de rest als bijlage toe.",
    fr: "Votre texte est trop long. Raccourcissez-le ou ajoutez le reste en pièce jointe.",
    en: "Your text is too long. Please shorten it or add the rest as an attachment.",
    de: "Ihr Text ist zu lang. Bitte kürzen Sie ihn oder fügen Sie den Rest als Anhang bei.",
    es: "Su texto es demasiado largo. Acórtelo o adjunte el resto como archivo.",
  },
  niet_gevonden: {
    nl: "Niet gevonden, of u hebt er geen toegang toe.",
    fr: "Introuvable, ou vous n'y avez pas accès.",
    en: "Not found, or you do not have access to it.",
    de: "Nicht gefunden, oder Sie haben keinen Zugriff darauf.",
    es: "No encontrado, o no tiene acceso.",
  },
  gesloten: {
    nl: "Dit ticket is gesloten.",
    fr: "Ce ticket est fermé.",
    en: "This ticket is closed.",
    de: "Dieses Ticket ist geschlossen.",
    es: "Este ticket está cerrado.",
  },
  te_oud: {
    nl: `Dit ticket is al meer dan ${H} dagen gesloten en kan niet meer heropend worden. Opent u een nieuw ticket?`,
    fr: `Ce ticket est fermé depuis plus de ${H} jours et ne peut plus être rouvert. Veuillez ouvrir un nouveau ticket.`,
    en: `This ticket has been closed for more than ${H} days and can no longer be reopened. Please open a new ticket.`,
    de: `Dieses Ticket ist seit mehr als ${H} Tagen geschlossen und kann nicht mehr geöffnet werden. Bitte eröffnen Sie ein neues Ticket.`,
    es: `Este ticket lleva más de ${H} días cerrado y ya no se puede reabrir. Abra un nuevo ticket.`,
  },
  project: {
    nl: "Kies een geldig project.",
    fr: "Veuillez choisir un projet valide.",
    en: "Please choose a valid project.",
    de: "Bitte wählen Sie ein gültiges Projekt.",
    es: "Elija un proyecto válido.",
  },
  revisie_niet_mogelijk: {
    nl: "Een revisie kan pas aangevraagd worden zodra het project in productie of geleverd is.",
    fr: "Une révision ne peut être demandée qu'une fois le projet en production ou livré.",
    en: "A revision can only be requested once the project is in production or delivered.",
    de: "Eine Revision kann erst angefragt werden, wenn das Projekt in Produktion oder geliefert ist.",
    es: "Solo se puede solicitar una revisión cuando el proyecto está en producción o entregado.",
  },
  akkoord: {
    nl: "Bevestig dat u akkoord gaat met de facturatie van de revisie.",
    fr: "Veuillez confirmer que vous acceptez la facturation de la révision.",
    en: "Please confirm that you agree to the revision being invoiced.",
    de: "Bitte bestätigen Sie, dass Sie mit der Abrechnung der Revision einverstanden sind.",
    es: "Confirme que acepta la facturación de la revisión.",
  },
  te_veel: {
    nl: "U hebt het voorbije uur al veel berichten verstuurd. Probeer het later opnieuw.",
    fr: "Vous avez déjà envoyé beaucoup de messages au cours de la dernière heure. Veuillez réessayer plus tard.",
    en: "You have sent many messages in the past hour. Please try again later.",
    de: "Sie haben in der letzten Stunde bereits viele Nachrichten gesendet. Bitte versuchen Sie es später erneut.",
    es: "Ha enviado muchos mensajes en la última hora. Inténtelo de nuevo más tarde.",
  },
  bijlage_type: {
    nl: "Dit bestandstype wordt niet aanvaard. Zip het eventueel.",
    fr: "Ce type de fichier n'est pas accepté. Vous pouvez le compresser en zip.",
    en: "This file type is not accepted. You may zip it.",
    de: "Dieser Dateityp wird nicht akzeptiert. Sie können ihn als ZIP senden.",
    es: "Este tipo de archivo no se acepta. Puede comprimirlo en zip.",
  },
  bijlage_groot: {
    nl: `Een bestand is groter dan ${MB} MB. Zip het of deel het op.`,
    fr: `Un fichier dépasse ${MB} Mo. Veuillez le compresser ou le diviser.`,
    en: `A file is larger than ${MB} MB. Please zip or split it.`,
    de: `Eine Datei ist größer als ${MB} MB. Bitte komprimieren oder teilen Sie sie.`,
    es: `Un archivo supera los ${MB} MB. Comprímalo o divídalo.`,
  },
  bijlage_aantal: {
    nl: `Maximaal ${N} bestanden per bericht.`,
    fr: `${N} fichiers maximum par message.`,
    en: `A maximum of ${N} files per message.`,
    de: `Maximal ${N} Dateien pro Nachricht.`,
    es: `Máximo ${N} archivos por mensaje.`,
  },
  bijlage_ontbreekt: {
    nl: "Een bijlage is leeg of kon niet opgeladen worden. Kies het bestand opnieuw.",
    fr: "Une pièce jointe est vide ou n'a pas pu être envoyée. Veuillez sélectionner à nouveau le fichier.",
    en: "An attachment is empty or could not be uploaded. Please select the file again.",
    de: "Ein Anhang ist leer oder konnte nicht hochgeladen werden. Bitte wählen Sie die Datei erneut aus.",
    es: "Un archivo adjunto está vacío o no se ha podido subir. Vuelva a seleccionarlo.",
  },
  opslag: {
    nl: "Er ging iets mis bij het opslaan. Probeer het opnieuw.",
    fr: "Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.",
    en: "Something went wrong while saving. Please try again.",
    de: "Beim Speichern ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    es: "Se ha producido un error al guardar. Inténtelo de nuevo.",
  },
  migratie: {
    nl: "Deze functie is nog niet beschikbaar. Probeer het later opnieuw of verstuur uw bericht zonder bijlagen.",
    fr: "Cette fonction n'est pas encore disponible. Réessayez plus tard ou envoyez votre message sans pièces jointes.",
    en: "This feature is not available yet. Please try again later or send your message without attachments.",
    de: "Diese Funktion ist noch nicht verfügbar. Versuchen Sie es später erneut oder senden Sie Ihre Nachricht ohne Anhänge.",
    es: "Esta función aún no está disponible. Inténtelo más tarde o envíe su mensaje sin archivos adjuntos.",
  },
};

// ── Bestandskiezer ──────────────────────────────────────────────────────

export const BESTANDEN_T: Record<
  Locale,
  {
    label: string;
    uitleg: string;
    kies: string;
    sleep: string;
    teGroot: (naam: string) => string;
    type: (naam: string) => string;
    maximum: (n: number) => string;
    verwijderen: (naam: string) => string;
    /** Voortgang, bv. "Opladen… 3,2 MB van 10,0 MB". */
    opladen: (x: string, y: string) => string;
    gekozen: (n: number) => string;
  }
> = {
  nl: {
    label: "Bijlagen (optioneel)",
    uitleg: `Plannen (DWG, DXF, PDF, LandXML), foto's of schermafdrukken — max. ${N} bestanden van ${MB} MB.`,
    kies: "Bestanden kiezen",
    sleep: "Sleep bestanden hierheen, of plak een schermafdruk (Ctrl+V / ⌘V).",
    teGroot: (n) => `${n} is groter dan ${MB} MB. Zip het of deel het op.`,
    type: (n) => `${n}: dit bestandstype wordt niet aanvaard.`,
    maximum: (n) => `Maximaal ${n} bestanden.`,
    verwijderen: (n) => `${n} verwijderen`,
    opladen: (x, y) => `Opladen… ${x} van ${y}`,
    gekozen: (n) => `${n} ${n === 1 ? "bestand" : "bestanden"} gekozen`,
  },
  fr: {
    label: "Pièces jointes (facultatif)",
    uitleg: `Plans (DWG, DXF, PDF, LandXML), photos ou captures d'écran — max. ${N} fichiers de ${MB} Mo.`,
    kies: "Choisir des fichiers",
    sleep: "Glissez vos fichiers ici, ou collez une capture d'écran (Ctrl+V / ⌘V).",
    teGroot: (n) => `${n} dépasse ${MB} Mo. Veuillez le compresser ou le diviser.`,
    type: (n) => `${n} : ce type de fichier n'est pas accepté.`,
    maximum: (n) => `${n} fichiers maximum.`,
    verwijderen: (n) => `Supprimer ${n}`,
    opladen: (x, y) => `Envoi… ${x} sur ${y}`,
    gekozen: (n) => `${n} ${n === 1 ? "fichier sélectionné" : "fichiers sélectionnés"}`,
  },
  en: {
    label: "Attachments (optional)",
    uitleg: `Plans (DWG, DXF, PDF, LandXML), photos or screenshots — max. ${N} files of ${MB} MB.`,
    kies: "Choose files",
    sleep: "Drag files here, or paste a screenshot (Ctrl+V / ⌘V).",
    teGroot: (n) => `${n} is larger than ${MB} MB. Please zip or split it.`,
    type: (n) => `${n}: this file type is not accepted.`,
    maximum: (n) => `A maximum of ${n} files.`,
    verwijderen: (n) => `Remove ${n}`,
    opladen: (x, y) => `Uploading… ${x} of ${y}`,
    gekozen: (n) => `${n} ${n === 1 ? "file" : "files"} selected`,
  },
  de: {
    label: "Anhänge (optional)",
    uitleg: `Pläne (DWG, DXF, PDF, LandXML), Fotos oder Screenshots — max. ${N} Dateien zu je ${MB} MB.`,
    kies: "Dateien auswählen",
    sleep: "Ziehen Sie Dateien hierher oder fügen Sie einen Screenshot ein (Strg+V / ⌘V).",
    teGroot: (n) => `${n} ist größer als ${MB} MB. Bitte komprimieren oder teilen Sie die Datei.`,
    type: (n) => `${n}: Dieser Dateityp wird nicht akzeptiert.`,
    maximum: (n) => `Maximal ${n} Dateien.`,
    verwijderen: (n) => `${n} entfernen`,
    opladen: (x, y) => `Hochladen… ${x} von ${y}`,
    gekozen: (n) => `${n} ${n === 1 ? "Datei" : "Dateien"} ausgewählt`,
  },
  es: {
    label: "Archivos adjuntos (opcional)",
    uitleg: `Planos (DWG, DXF, PDF, LandXML), fotos o capturas de pantalla — máx. ${N} archivos de ${MB} MB.`,
    kies: "Elegir archivos",
    sleep: "Arrastre los archivos aquí o pegue una captura de pantalla (Ctrl+V / ⌘V).",
    teGroot: (n) => `${n} supera los ${MB} MB. Comprímalo o divídalo.`,
    type: (n) => `${n}: este tipo de archivo no se acepta.`,
    maximum: (n) => `Máximo ${n} archivos.`,
    verwijderen: (n) => `Quitar ${n}`,
    opladen: (x, y) => `Subiendo… ${x} de ${y}`,
    gekozen: (n) => `${n} ${n === 1 ? "archivo seleccionado" : "archivos seleccionados"}`,
  },
};

// ── Revisie: tarief en akkoord ──────────────────────────────────────────

const MIN_UUR: Record<Locale, string> = {
  nl: `${MINIMUM_UREN} uur`,
  fr: `${MINIMUM_UREN} h`,
  en: `${MINIMUM_UREN} ${MINIMUM_UREN === 1 ? "hour" : "hours"}`,
  de: `${MINIMUM_UREN} ${MINIMUM_UREN === 1 ? "Stunde" : "Stunden"}`,
  es: `${MINIMUM_UREN} ${MINIMUM_UREN === 1 ? "hora" : "horas"}`,
};

/**
 * "Revisies na een planwijziging worden gefactureerd aan € 50/u excl. btw
 * (categorie Normaal), minimum 1 uur." — tariefTekst = euro(UURTARIEF_CENT[cat], locale),
 * categorieLabel = CATEGORIE_LABEL[cat][locale].
 */
export function revisieTariefZin(locale: Locale, tariefTekst: string, categorieLabel: string): string {
  const m = MIN_UUR[locale] ?? MIN_UUR.nl;
  const L: Record<Locale, string> = {
    nl: `Revisies na een planwijziging worden gefactureerd aan ${tariefTekst}/u excl. btw (categorie ${categorieLabel}), minimum ${m}.`,
    fr: `Les révisions après une modification de plan sont facturées ${tariefTekst}/h HTVA (catégorie ${categorieLabel}), minimum ${m}.`,
    en: `Revisions after a plan change are invoiced at ${tariefTekst}/h excl. VAT (${categorieLabel} category), minimum ${m}.`,
    de: `Revisionen nach einer Planänderung werden mit ${tariefTekst}/Std. exkl. MwSt. berechnet (Kategorie ${categorieLabel}), mindestens ${m}.`,
    es: `Las revisiones tras un cambio de plano se facturan a ${tariefTekst}/h IVA no incluido (categoría ${categorieLabel}), mínimo ${m}.`,
  };
  return L[locale] ?? L.nl;
}

/** Label van het verplichte akkoordvinkje bij een revisie. */
export const REVISIE_AKKOORD: Record<Locale, string> = {
  nl: `Ik ga akkoord dat deze revisie aan het uurtarief van het project gefactureerd wordt (minimum ${MIN_UUR.nl}).`,
  fr: `J'accepte que cette révision soit facturée au tarif horaire du projet (minimum ${MIN_UUR.fr}).`,
  en: `I agree that this revision will be invoiced at the project's hourly rate (minimum ${MIN_UUR.en}).`,
  de: `Ich bin damit einverstanden, dass diese Revision zum Stundensatz des Projekts berechnet wird (mindestens ${MIN_UUR.de}).`,
  es: `Acepto que esta revisión se facture a la tarifa por hora del proyecto (mínimo ${MIN_UUR.es}).`,
};

// ── Afspraak-aanvraag (tekst van het ticket) ────────────────────────────

export const AFSPRAAK_T: Record<
  Locale,
  { type: string; periode: string; voorkeur: string; bericht: string; geenBericht: string }
> = {
  nl: { type: "Type", periode: "Periode", voorkeur: "Tijdsvoorkeur", bericht: "Bericht", geenBericht: "Geen extra bericht." },
  fr: { type: "Type", periode: "Période", voorkeur: "Préférence horaire", bericht: "Message", geenBericht: "Pas de message supplémentaire." },
  en: { type: "Type", periode: "Period", voorkeur: "Preferred time", bericht: "Message", geenBericht: "No additional message." },
  de: { type: "Art", periode: "Zeitraum", voorkeur: "Bevorzugte Zeit", bericht: "Nachricht", geenBericht: "Keine zusätzliche Nachricht." },
  es: { type: "Tipo", periode: "Periodo", voorkeur: "Preferencia horaria", bericht: "Mensaje", geenBericht: "Sin mensaje adicional." },
};

// ── Mails aan de klant ──────────────────────────────────────────────────
// `x` = HTML-veilige tekst (esc), `namen` = HTML-veilige bestandsnamen.
// Onderwerpen (…Onderwerp) zijn platte tekst, niet escapen.

export type TicketMailTeksten = {
  eyebrow: string;
  hallo: string;
  cta: string;
  ctaFactuur: string;
  footnote: string;
  viaPortaal: string;
  ontvangenOnderwerp: (ref: string, onderwerp: string) => string;
  ontvangenL1: (x: string) => string;
  ontvangenL2: string;
  antwoordOnderwerp: (ref: string, onderwerp: string) => string;
  antwoordL1: (x: string) => string;
  bijlagen: (namen: string[]) => string;
  ookGesloten: string;
  geslotenOnderwerp: (ref: string, onderwerp: string) => string;
  geslotenL1: (x: string) => string;
  heropenenL2: string;
  autoGeslotenL1: (x: string) => string;
  revisieFactuurOnderwerp: (nr: string) => string;
  /** `bedrag` = bedrag mét btw-vermelding (bedragMetBtw), bv. "€ 60,50 incl. btw". */
  revisieFactuurL1: (nr: string, x: string, bedrag: string, urenTekst: string) => string;
  revisieFactuurL2: (due: string) => string;
  /** Omschrijving op de revisiefactuur (platte tekst), naar factuurOmschrijving(). */
  revisieOmschrijving: (titel: string, uren: number, tariefCent: number) => string;
};

const per = (t: Taal, uren: number, tariefCent: number) => `${urenTekst(uren, t)} × ${euro(tariefCent, t)}`;

export const TICKET_MAIL: Record<Taal, TicketMailTeksten> = {
  nl: {
    eyebrow: "Support",
    hallo: "Beste,",
    cta: "Open uw ticket",
    ctaFactuur: "Open uw facturen",
    footnote: "U logt in met uw e-mailadres — u krijgt een veilige inloglink, geen wachtwoord nodig.",
    viaPortaal: "Antwoord bij voorkeur via de knop hierboven, in het portaal: dan blijft alles bij dit ticket, samen met uw bijlagen. Een antwoord op deze mail komt ook aan, maar niet in het ticket.",
    ontvangenOnderwerp: (ref, o) => `[${ref}] Goed ontvangen: ${o}`,
    ontvangenL1: (x) => `Bedankt. Ik heb uw ticket <strong>${x}</strong> goed ontvangen.`,
    ontvangenL2: "Ik antwoord op werkdagen binnen 24 uur. U krijgt een mail zodra mijn antwoord klaarstaat.",
    antwoordOnderwerp: (ref, o) => `[${ref}] Antwoord: ${o}`,
    antwoordL1: (x) => `Er staat een antwoord klaar op uw ticket <strong>${x}</strong>:`,
    bijlagen: (n) => `Bijlagen (te downloaden in het portaal): ${n.join(", ")}`,
    ookGesloten: `Met dit antwoord heb ik het ticket afgesloten. Is er toch nog iets? Antwoord binnen ${H} dagen via het portaal, dan gaat het ticket opnieuw open.`,
    geslotenOnderwerp: (ref, o) => `[${ref}] Gesloten: ${o}`,
    geslotenL1: (x) => `Uw ticket <strong>${x}</strong> is afgesloten.`,
    heropenenL2: `Is er toch nog iets? Antwoord binnen ${H} dagen via het portaal, dan gaat het ticket opnieuw open.`,
    autoGeslotenL1: (x) => `Uw ticket <strong>${x}</strong> is automatisch afgesloten, omdat er ${A} dagen geen reactie meer kwam.`,
    revisieFactuurOnderwerp: (nr) => `Uw revisiefactuur ${nr} staat klaar`,
    revisieFactuurL1: (nr, x, b, u) =>
      `Factuur <strong>${nr}</strong> voor de revisie van <strong>${x}</strong> (${u}, ${b}) staat klaar in uw klantenportaal.`,
    revisieFactuurL2: (d) => `Betaalbaar tegen ${d}, online via Mollie of via overschrijving.`,
    revisieOmschrijving: (titel, u, c) => `Revisie — ${titel} · ${per("nl", u, c)}`,
  },
  fr: {
    eyebrow: "Support",
    hallo: "Bonjour,",
    cta: "Ouvrir votre ticket",
    ctaFactuur: "Voir vos factures",
    footnote: "Connectez-vous avec votre adresse e-mail — vous recevez un lien sécurisé, sans mot de passe.",
    viaPortaal: "Répondez de préférence via le bouton ci-dessus, dans votre espace client : tout reste ainsi dans ce ticket, avec vos pièces jointes. Une réponse à cet e-mail me parvient aussi, mais pas dans le ticket.",
    ontvangenOnderwerp: (ref, o) => `[${ref}] Bien reçu : ${o}`,
    ontvangenL1: (x) => `Merci. J'ai bien reçu votre ticket <strong>${x}</strong>.`,
    ontvangenL2: "Je réponds sous 24 heures les jours ouvrables. Vous recevrez un e-mail dès que ma réponse sera disponible.",
    antwoordOnderwerp: (ref, o) => `[${ref}] Réponse : ${o}`,
    antwoordL1: (x) => `Une réponse à votre ticket <strong>${x}</strong> est disponible :`,
    bijlagen: (n) => `Pièces jointes (à télécharger dans votre espace client) : ${n.join(", ")}`,
    ookGesloten: `Avec cette réponse, j'ai clôturé le ticket. Encore une question ? Répondez dans les ${H} jours via votre espace client et le ticket sera rouvert.`,
    geslotenOnderwerp: (ref, o) => `[${ref}] Fermé : ${o}`,
    geslotenL1: (x) => `Votre ticket <strong>${x}</strong> a été fermé.`,
    heropenenL2: `Encore une question ? Répondez dans les ${H} jours via votre espace client et le ticket sera rouvert.`,
    autoGeslotenL1: (x) => `Votre ticket <strong>${x}</strong> a été fermé automatiquement, faute de réaction depuis ${A} jours.`,
    revisieFactuurOnderwerp: (nr) => `Votre facture de révision ${nr} est prête`,
    revisieFactuurL1: (nr, x, b, u) =>
      `La facture <strong>${nr}</strong> pour la révision de <strong>${x}</strong> (${u}, ${b}) est disponible dans votre espace client.`,
    revisieFactuurL2: (d) => `Payable pour le ${d}, en ligne via Mollie ou par virement.`,
    revisieOmschrijving: (titel, u, c) => `Révision — ${titel} · ${per("fr", u, c)}`,
  },
  en: {
    eyebrow: "Support",
    hallo: "Hello,",
    cta: "Open your ticket",
    ctaFactuur: "View your invoices",
    footnote: "Sign in with your email address — you get a secure login link, no password needed.",
    viaPortaal: "Please reply using the button above, in your portal, so everything stays in this ticket together with your attachments. A reply to this email also reaches me, but not in the ticket.",
    ontvangenOnderwerp: (ref, o) => `[${ref}] Received: ${o}`,
    ontvangenL1: (x) => `Thank you. I have received your ticket <strong>${x}</strong>.`,
    ontvangenL2: "I reply within 24 hours on working days. You will receive an email as soon as my reply is ready.",
    antwoordOnderwerp: (ref, o) => `[${ref}] Reply: ${o}`,
    antwoordL1: (x) => `There is a reply to your ticket <strong>${x}</strong>:`,
    bijlagen: (n) => `Attachments (download them in your portal): ${n.join(", ")}`,
    ookGesloten: `With this reply I have closed the ticket. Anything else? Reply within ${H} days via the portal and the ticket will reopen.`,
    geslotenOnderwerp: (ref, o) => `[${ref}] Closed: ${o}`,
    geslotenL1: (x) => `Your ticket <strong>${x}</strong> has been closed.`,
    heropenenL2: `Anything else? Reply within ${H} days via the portal and the ticket will reopen.`,
    autoGeslotenL1: (x) => `Your ticket <strong>${x}</strong> was closed automatically because there was no reply for ${A} days.`,
    revisieFactuurOnderwerp: (nr) => `Your revision invoice ${nr} is ready`,
    revisieFactuurL1: (nr, x, b, u) =>
      `Invoice <strong>${nr}</strong> for the revision of <strong>${x}</strong> (${u}, ${b}) is ready in your client portal.`,
    revisieFactuurL2: (d) => `Payable by ${d}, online via Mollie or by bank transfer.`,
    revisieOmschrijving: (titel, u, c) => `Revision — ${titel} · ${per("en", u, c)}`,
  },
  de: {
    eyebrow: "Support",
    hallo: "Guten Tag,",
    cta: "Ihr Ticket öffnen",
    ctaFactuur: "Ihre Rechnungen ansehen",
    footnote: "Melden Sie sich mit Ihrer E-Mail-Adresse an — Sie erhalten einen sicheren Anmeldelink, kein Passwort nötig.",
    viaPortaal: "Bitte antworten Sie über die Schaltfläche oben, in Ihrem Portal — so bleibt alles mit Ihren Anhängen in diesem Ticket. Eine Antwort auf diese E-Mail erreicht mich auch, aber nicht im Ticket.",
    ontvangenOnderwerp: (ref, o) => `[${ref}] Eingegangen: ${o}`,
    ontvangenL1: (x) => `Vielen Dank. Ihr Ticket <strong>${x}</strong> ist bei mir eingegangen.`,
    ontvangenL2: "Ich antworte an Werktagen innerhalb von 24 Stunden. Sie erhalten eine E-Mail, sobald meine Antwort bereitsteht.",
    antwoordOnderwerp: (ref, o) => `[${ref}] Antwort: ${o}`,
    antwoordL1: (x) => `Auf Ihr Ticket <strong>${x}</strong> liegt eine Antwort vor:`,
    bijlagen: (n) => `Anhänge (im Portal herunterladbar): ${n.join(", ")}`,
    ookGesloten: `Mit dieser Antwort habe ich das Ticket geschlossen. Noch etwas offen? Antworten Sie innerhalb von ${H} Tagen über das Portal, dann wird das Ticket wieder geöffnet.`,
    geslotenOnderwerp: (ref, o) => `[${ref}] Geschlossen: ${o}`,
    geslotenL1: (x) => `Ihr Ticket <strong>${x}</strong> wurde geschlossen.`,
    heropenenL2: `Noch etwas offen? Antworten Sie innerhalb von ${H} Tagen über das Portal, dann wird das Ticket wieder geöffnet.`,
    autoGeslotenL1: (x) => `Ihr Ticket <strong>${x}</strong> wurde automatisch geschlossen, da ${A} Tage lang keine Rückmeldung kam.`,
    revisieFactuurOnderwerp: (nr) => `Ihre Revisionsrechnung ${nr} ist bereit`,
    revisieFactuurL1: (nr, x, b, u) =>
      `Die Rechnung <strong>${nr}</strong> für die Revision von <strong>${x}</strong> (${u}, ${b}) steht in Ihrem Kundenportal bereit.`,
    revisieFactuurL2: (d) => `Zahlbar bis ${d}, online über Mollie oder per Überweisung.`,
    revisieOmschrijving: (titel, u, c) => `Revision — ${titel} · ${per("de", u, c)}`,
  },
  es: {
    eyebrow: "Soporte",
    hallo: "Buenos días:",
    cta: "Abrir su ticket",
    ctaFactuur: "Ver sus facturas",
    footnote: "Acceda con su dirección de correo electrónico — recibirá un enlace seguro, sin necesidad de contraseña.",
    viaPortaal: "Responda preferiblemente con el botón de arriba, en su portal: así todo queda en este ticket, junto con sus archivos adjuntos. Una respuesta a este correo también me llega, pero no en el ticket.",
    ontvangenOnderwerp: (ref, o) => `[${ref}] Recibido: ${o}`,
    ontvangenL1: (x) => `Gracias. He recibido su ticket <strong>${x}</strong>.`,
    ontvangenL2: "Respondo en un plazo de 24 horas en días laborables. Recibirá un correo en cuanto mi respuesta esté lista.",
    antwoordOnderwerp: (ref, o) => `[${ref}] Respuesta: ${o}`,
    antwoordL1: (x) => `Hay una respuesta a su ticket <strong>${x}</strong>:`,
    bijlagen: (n) => `Archivos adjuntos (descárguelos en su portal): ${n.join(", ")}`,
    ookGesloten: `Con esta respuesta he cerrado el ticket. ¿Necesita algo más? Responda en un plazo de ${H} días a través del portal y el ticket se volverá a abrir.`,
    geslotenOnderwerp: (ref, o) => `[${ref}] Cerrado: ${o}`,
    geslotenL1: (x) => `Su ticket <strong>${x}</strong> se ha cerrado.`,
    heropenenL2: `¿Necesita algo más? Responda en un plazo de ${H} días a través del portal y el ticket se volverá a abrir.`,
    autoGeslotenL1: (x) => `Su ticket <strong>${x}</strong> se ha cerrado automáticamente porque no hubo respuesta en ${A} días.`,
    revisieFactuurOnderwerp: (nr) => `Su factura de revisión ${nr} está lista`,
    revisieFactuurL1: (nr, x, b, u) =>
      `La factura <strong>${nr}</strong> para la revisión de <strong>${x}</strong> (${u}, ${b}) está disponible en su portal de cliente.`,
    revisieFactuurL2: (d) => `Pagadera antes del ${d}, en línea con Mollie o por transferencia bancaria.`,
    revisieOmschrijving: (titel, u, c) => `Revisión — ${titel} · ${per("es", u, c)}`,
  },
};

// ── Mails aan Studio VM (enkel Nederlands) ──────────────────────────────

export type StudioGebeurtenis = "nieuw" | "reactie" | "heropend";

export const STUDIO_MAIL = {
  eyebrow: "Support",
  cta: "Open ticket",
  /** Platte tekst: "[#1001] Vraag — Onderwerp (klant@voorbeeld.be)". */
  onderwerp: (ref: string, soortLabel: string, onderwerp: string, email: string) =>
    `[${ref}] ${soortLabel} — ${onderwerp} (${email})`,
  /** Platte tekst (titel van de mail). */
  titel: (g: StudioGebeurtenis, ref: string) =>
    g === "nieuw" ? `Nieuw ticket ${ref}` : g === "heropend" ? `Ticket ${ref} heropend` : `Nieuwe reactie op ${ref}`,
  /** `wie` en `x` HTML-veilig. */
  l1: (g: StudioGebeurtenis, wie: string, x: string) =>
    g === "nieuw"
      ? `<strong>${wie}</strong> opende een ticket: <strong>${x}</strong>`
      : g === "heropend"
        ? `<strong>${wie}</strong> heropende het ticket <strong>${x}</strong> met een nieuwe reactie:`
        : `<strong>${wie}</strong> reageerde op het ticket <strong>${x}</strong>:`,
  soort: (label: string) => `Soort: <strong>${label}</strong>`,
  project: (x: string) => `Project: <strong>${x}</strong>`,
  systeem: (x: string) => `Machinesturing: <strong>${x}</strong>`,
  taal: (x: string) => `Taal van de klant: ${x}`,
  akkoord: "De klant ging akkoord met de facturatie van de revisie aan het uurtarief van het project.",
  bijlagen: (namen: string[]) => `Bijlagen: ${namen.join(", ")}`,
  viaAdmin: "Antwoord via de admin, zodat het in het portaal van de klant staat.",
};
