import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  Mail,
  Video,
  Phone,
  Users,
  ExternalLink,
  Sparkles,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import { getCompanySettings } from "@/lib/admin/settings";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { requestAppointment } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    intro: string;
    sub: string;
    chooseSlot: string;
    chooseSlotDesc: string;
    openCal: string;
    requestTitle: string;
    requestDesc: string;
    kind: string;
    kindCall: string;
    kindVideo: string;
    kindInPerson: string;
    when: string;
    whenThisWeek: string;
    whenNextWeek: string;
    whenFlexible: string;
    slot: string;
    slotMorning: string;
    slotNoon: string;
    slotEvening: string;
    slotAny: string;
    message: string;
    messagePh: string;
    send: string;
    sending: string;
    mailOnly: string;
    sla: string;
    confirm: string;
    sentTitle: string;
    sentBody: string;
    errorTitle: string;
    errorBody: string;
  }
> = {
  nl: {
    intro: "Een gesprek inplannen",
    sub: "Een project bespreken per telefoon, videogesprek of ter plaatse op de werf? Kies zelf een moment of vraag het hieronder aan — ik antwoord binnen 24 u.",
    chooseSlot: "Direct een moment kiezen",
    chooseSlotDesc: "Open mijn agenda en boek meteen een tijdstip dat u past.",
    openCal: "Open de agenda",
    requestTitle: "Of vraag het hier aan",
    requestDesc: "Geef uw voorkeuren door en ik kom terug met 2 à 3 concrete voorstellen.",
    kind: "Soort gesprek",
    kindCall: "Telefoon",
    kindVideo: "Videogesprek",
    kindInPerson: "Op de werf",
    when: "Wanneer",
    whenThisWeek: "Deze week",
    whenNextWeek: "Volgende week",
    whenFlexible: "Flexibel",
    slot: "Tijd van de dag",
    slotMorning: "Ochtend",
    slotNoon: "Middag",
    slotEvening: "Avond",
    slotAny: "Doorlopend",
    message: "Bericht (optioneel)",
    messagePh: "Waarover wilt u het hebben? Bv. welk project of welke werf, welke plannen, welke machinesturing of welke vraag.",
    send: "Aanvraag versturen",
    sending: "Bezig met versturen…",
    mailOnly: "Liever rechtstreeks mailen?",
    sla: "Ik antwoord op werkdagen binnen 24 u.",
    confirm: "Uw aanvraag komt als ticket bij 'Support' terecht; daar ziet u ook mijn antwoord.",
    sentTitle: "Aanvraag verstuurd ✓",
    sentBody:
      "Ik heb uw voorkeuren ontvangen en kom binnen 24 u terug met 2 à 3 concrete voorstellen. U vindt de aanvraag ook bij 'Support'.",
    errorTitle: "Er ging iets mis",
    errorBody:
      "De aanvraag kon niet bewaard worden. Mail mij rechtstreeks, dan plan ik het gesprek manueel in.",
  },
  fr: {
    intro: "Planifier un échange",
    sub: "Discuter d'un projet par téléphone, en visio ou sur le chantier ? Choisissez vous-même un créneau ou faites une demande ci-dessous — je réponds sous 24 h.",
    chooseSlot: "Choisir un créneau directement",
    chooseSlotDesc: "Ouvrez mon agenda et réservez un moment qui vous convient.",
    openCal: "Ouvrir l'agenda",
    requestTitle: "Ou faites une demande ici",
    requestDesc: "Indiquez vos préférences et je reviens vers vous avec 2 ou 3 propositions concrètes.",
    kind: "Type d'échange",
    kindCall: "Téléphone",
    kindVideo: "Visio",
    kindInPerson: "Sur chantier",
    when: "Quand",
    whenThisWeek: "Cette semaine",
    whenNextWeek: "Semaine prochaine",
    whenFlexible: "Flexible",
    slot: "Moment de la journée",
    slotMorning: "Matin",
    slotNoon: "Midi",
    slotEvening: "Soir",
    slotAny: "Toute la journée",
    message: "Message (facultatif)",
    messagePh: "De quoi souhaitez-vous parler ? Par ex. quel projet ou chantier, quels plans, quel système de guidage ou quelle question.",
    send: "Envoyer la demande",
    sending: "Envoi en cours…",
    mailOnly: "Vous préférez écrire directement ?",
    sla: "Je réponds sous 24 h les jours ouvrables.",
    confirm: "Votre demande arrive sous forme de ticket dans « Support » ; vous y verrez aussi ma réponse.",
    sentTitle: "Demande envoyée ✓",
    sentBody:
      "J'ai bien reçu vos préférences et je reviens vers vous sous 24 h avec 2 ou 3 propositions concrètes. Vous retrouvez la demande dans « Support ».",
    errorTitle: "Un problème est survenu",
    errorBody:
      "La demande n'a pas pu être enregistrée. Écrivez-moi directement et je planifierai l'échange manuellement.",
  },
  en: {
    intro: "Schedule a conversation",
    sub: "Discuss a project by phone, video call or on site? Pick a time yourself or send a request below — I reply within 24 hours.",
    chooseSlot: "Pick a slot directly",
    chooseSlotDesc: "Open my calendar and book a time that suits you.",
    openCal: "Open the calendar",
    requestTitle: "Or request one here",
    requestDesc: "Share your preferences and I will come back with 2–3 concrete proposals.",
    kind: "Type of meeting",
    kindCall: "Phone",
    kindVideo: "Video call",
    kindInPerson: "On site",
    when: "When",
    whenThisWeek: "This week",
    whenNextWeek: "Next week",
    whenFlexible: "Flexible",
    slot: "Time of day",
    slotMorning: "Morning",
    slotNoon: "Midday",
    slotEvening: "Evening",
    slotAny: "Any time",
    message: "Message (optional)",
    messagePh: "What would you like to discuss? E.g. which project or site, which plans, which machine control system or which question.",
    send: "Send request",
    sending: "Sending…",
    mailOnly: "Prefer to email directly?",
    sla: "I reply within 24 hours on working days.",
    confirm: "Your request arrives as a ticket under 'Support', where you will also see my reply.",
    sentTitle: "Request sent ✓",
    sentBody:
      "I have received your preferences and will come back within 24 hours with 2–3 concrete proposals. You will also find the request under 'Support'.",
    errorTitle: "Something went wrong",
    errorBody:
      "The request could not be saved. Email me directly and I will schedule the meeting manually.",
  },
  de: {
    intro: "Ein Gespräch vereinbaren",
    sub: "Ein Projekt telefonisch, per Video oder vor Ort auf der Baustelle besprechen? Wählen Sie selbst einen Termin oder fragen Sie unten an — ich antworte innerhalb von 24 Std.",
    chooseSlot: "Direkt einen Termin wählen",
    chooseSlotDesc: "Öffnen Sie meinen Kalender und buchen Sie sofort einen passenden Zeitpunkt.",
    openCal: "Kalender öffnen",
    requestTitle: "Oder hier anfragen",
    requestDesc: "Teilen Sie mir Ihre Wünsche mit, und ich melde mich mit 2–3 konkreten Vorschlägen.",
    kind: "Art des Gesprächs",
    kindCall: "Telefon",
    kindVideo: "Videoanruf",
    kindInPerson: "Vor Ort",
    when: "Wann",
    whenThisWeek: "Diese Woche",
    whenNextWeek: "Nächste Woche",
    whenFlexible: "Flexibel",
    slot: "Tageszeit",
    slotMorning: "Vormittag",
    slotNoon: "Mittag",
    slotEvening: "Abend",
    slotAny: "Ganztägig",
    message: "Nachricht (optional)",
    messagePh: "Worüber möchten Sie sprechen? Z. B. welches Projekt oder welche Baustelle, welche Pläne, welche Maschinensteuerung oder welche Frage.",
    send: "Anfrage senden",
    sending: "Wird gesendet…",
    mailOnly: "Lieber direkt eine E-Mail schreiben?",
    sla: "Ich antworte an Werktagen innerhalb von 24 Std.",
    confirm: "Ihre Anfrage erscheint als Ticket unter „Support“; dort sehen Sie auch meine Antwort.",
    sentTitle: "Anfrage gesendet ✓",
    sentBody:
      "Ich habe Ihre Wünsche erhalten und melde mich innerhalb von 24 Std. mit 2–3 konkreten Vorschlägen. Sie finden die Anfrage auch unter „Support“.",
    errorTitle: "Etwas ist schiefgelaufen",
    errorBody:
      "Die Anfrage konnte nicht gespeichert werden. Schreiben Sie mir bitte direkt eine E-Mail, dann plane ich das Gespräch manuell ein.",
  },
  es: {
    intro: "Programar una conversación",
    sub: "¿Desea hablar de un proyecto por teléfono, por videollamada o en la obra? Elija usted mismo una franja o solicítela a continuación — respondo en menos de 24 h.",
    chooseSlot: "Elegir una franja directamente",
    chooseSlotDesc: "Abra mi agenda y reserve directamente un horario que le convenga.",
    openCal: "Abrir la agenda",
    requestTitle: "O solicítela aquí",
    requestDesc: "Indique sus preferencias y le responderé con 2-3 propuestas concretas.",
    kind: "Tipo de reunión",
    kindCall: "Teléfono",
    kindVideo: "Videollamada",
    kindInPerson: "En la obra",
    when: "Cuándo",
    whenThisWeek: "Esta semana",
    whenNextWeek: "La próxima semana",
    whenFlexible: "Flexible",
    slot: "Momento del día",
    slotMorning: "Mañana",
    slotNoon: "Mediodía",
    slotEvening: "Tarde",
    slotAny: "Cualquier hora",
    message: "Mensaje (opcional)",
    messagePh: "¿De qué le gustaría hablar? P. ej., qué proyecto u obra, qué planos, qué sistema de control de máquina o qué pregunta.",
    send: "Enviar solicitud",
    sending: "Enviando…",
    mailOnly: "¿Prefiere escribir directamente?",
    sla: "Respondo en menos de 24 h en días laborables.",
    confirm: "Su solicitud llega como ticket en «Soporte»; allí verá también mi respuesta.",
    sentTitle: "Solicitud enviada ✓",
    sentBody:
      "He recibido sus preferencias y le responderé en menos de 24 h con 2-3 propuestas concretas. También encontrará la solicitud en «Soporte».",
    errorTitle: "Algo ha salido mal",
    errorBody:
      "No se ha podido guardar la solicitud. Escríbame directamente y programaré la conversación manualmente.",
  },
};

export default async function PortalAppointment({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const t = PORTAL_T[locale];
  const l = L[locale];
  const justSent = sp.sent === "1";
  const hadError = sp.error === "1";

  // Echte e-mail uit company_settings; vroeger stond hier hardcoded
  // hallo@studio-vm.be (kwam niet aan). Cal.com-link komt uit outreach-
  // config (zelfde veld als voor outreach-mails).
  const [settings, outreach] = await Promise.all([
    getCompanySettings().catch(() => null),
    getOutreachConfig().catch(() => null),
  ]);
  const studioMail = settings?.email || "info@studio-vm.be";
  const calLink = outreach?.calLink || null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <CalendarClock className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.appointment}
            </h1>
            <p className="mt-0.5 text-sm text-muted">{l.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
          <Clock3 className="h-3 w-3" strokeWidth={2.5} />
          {l.sla}
        </div>
      </div>

      {/* Succes-banner na verzending */}
      {justSent && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-600/40 bg-green-500/10 p-4">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
            strokeWidth={2.5}
          />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">
              {l.sentTitle}
            </p>
            <p className="mt-0.5 text-sm text-green-800/90 dark:text-green-100/90">
              {l.sentBody}
            </p>
          </div>
        </div>
      )}

      {/* Error-banner */}
      {hadError && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-600/40 bg-red-500/10 p-4">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            strokeWidth={2.5}
          />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-300">
              {l.errorTitle}
            </p>
            <p className="mt-0.5 text-sm text-red-700/90 dark:text-red-100/90">
              {l.errorBody}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {/* Cal.com kolom (1/2 op lg) */}
        {calLink ? (
          <div className="lg:col-span-2">
            <div className="h-full rounded-2xl bg-gradient-to-br from-accent/15 via-card to-card p-6 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {l.chooseSlot}
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                {l.chooseSlot}
              </h2>
              <p className="mt-2 text-sm text-muted">{l.chooseSlotDesc}</p>
              <Link
                href={calLink}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {l.openCal}
                <ExternalLink className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <p className="mt-6 flex items-center gap-2 text-xs text-muted">
                <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                {l.mailOnly}{" "}
                <a
                  href={`mailto:${studioMail}`}
                  className="text-accent hover:underline"
                >
                  {studioMail}
                </a>
              </p>
            </div>
          </div>
        ) : null}

        {/* Aanvraag-form kolom (3/5 of full als geen Cal.com) */}
        <div className={calLink ? "lg:col-span-3" : "lg:col-span-5"}>
          <form
            action={requestAppointment}
            className="rounded-2xl bg-card p-6 shadow-sm sm:p-8"
          >
            <input type="hidden" name="locale" value={locale} />
            <h2 className="text-xl font-semibold tracking-tight">
              {calLink ? l.requestTitle : l.intro}
            </h2>
            <p className="mt-1 text-sm text-muted">{l.requestDesc}</p>

            {/* Soort gesprek */}
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {l.kind}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <KindRadio
                  name="kind"
                  value={l.kindVideo}
                  icon={Video}
                  label={l.kindVideo}
                  defaultChecked
                />
                <KindRadio
                  name="kind"
                  value={l.kindCall}
                  icon={Phone}
                  label={l.kindCall}
                />
                <KindRadio
                  name="kind"
                  value={l.kindInPerson}
                  icon={Users}
                  label={l.kindInPerson}
                />
              </div>
            </div>

            {/* Wanneer */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {l.when}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <PillRadio
                    name="when"
                    value={l.whenThisWeek}
                    defaultChecked
                  />
                  <PillRadio name="when" value={l.whenNextWeek} />
                  <PillRadio name="when" value={l.whenFlexible} />
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {l.slot}
                </p>
                <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                  <PillRadio name="slot" value={l.slotMorning} />
                  <PillRadio name="slot" value={l.slotNoon} />
                  <PillRadio name="slot" value={l.slotEvening} />
                  <PillRadio name="slot" value={l.slotAny} defaultChecked />
                </div>
              </div>
            </div>

            {/* Bericht */}
            <div className="mt-5">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {l.message}
                </span>
                <textarea
                  name="message"
                  rows={4}
                  placeholder={l.messagePh}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">{l.confirm}</p>
              <SubmitButton
                pendingLabel={l.sending}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {l.send}
              </SubmitButton>
            </div>

            {!calLink && (
              <p className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted">
                <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                {l.mailOnly}{" "}
                <a
                  href={`mailto:${studioMail}`}
                  className="text-accent hover:underline"
                >
                  {studioMail}
                </a>
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

// Grote knop-radio met icoon (Type-gesprek)
function KindRadio({
  name,
  value,
  icon: Icon,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  icon: typeof Video;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="block cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-border bg-background px-3 py-3 text-xs transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-semibold peer-checked:text-accent">
        <Icon className="h-4 w-4" strokeWidth={2} />
        {label}
      </span>
    </label>
  );
}

// Kleine pill-radio (Wanneer + Tijd)
function PillRadio({
  name,
  value,
  defaultChecked,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="block cursor-pointer text-center">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="block rounded-full border bg-background px-3 py-1.5 text-xs transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:font-semibold peer-checked:text-accent">
        {value}
      </span>
    </label>
  );
}
