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
} from "lucide-react";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import { getCompanySettings } from "@/lib/admin/settings";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { requestAppointment } from "@/app/actions/portal-client";

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
    mailOnly: string;
    sla: string;
    confirm: string;
  }
> = {
  nl: {
    intro: "Een gesprek inplannen",
    sub: "Liever bellen, videobellen of langskomen? Twee manieren: kies zelf een slot via Cal.com of vraag het hieronder aan — ik antwoord binnen 24u.",
    chooseSlot: "Direct een slot kiezen",
    chooseSlotDesc: "Open mijn agenda en boek meteen een tijdstip dat voor jou werkt.",
    openCal: "Open mijn agenda",
    requestTitle: "Of vraag het hier aan",
    requestDesc: "Geef je voorkeuren door en ik kom met 2-3 concrete voorstellen terug.",
    kind: "Soort gesprek",
    kindCall: "Telefoon",
    kindVideo: "Videocall",
    kindInPerson: "Langskomen",
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
    messagePh: "Waar wil je het over hebben? Welk topic, welke vraag, welk besluit?",
    send: "Aanvraag versturen",
    mailOnly: "Liever direct mailen?",
    sla: "Ik antwoord binnen 24u op werkdagen.",
    confirm: "Na bevestiging zie je de afspraak terug bij 'Berichten'.",
  },
  fr: {
    intro: "Planifier un échange",
    sub: "Appel, visio ou en personne ? Deux manières : choisissez un créneau via Cal.com, ou demandez-le ci-dessous — je réponds sous 24h.",
    chooseSlot: "Choisir un créneau directement",
    chooseSlotDesc: "Ouvrez mon agenda et réservez un moment qui vous convient.",
    openCal: "Ouvrir mon agenda",
    requestTitle: "Ou demandez-le ici",
    requestDesc: "Indiquez vos préférences et je reviens avec 2-3 propositions concrètes.",
    kind: "Type d'échange",
    kindCall: "Téléphone",
    kindVideo: "Visio",
    kindInPerson: "En personne",
    when: "Quand",
    whenThisWeek: "Cette semaine",
    whenNextWeek: "Semaine prochaine",
    whenFlexible: "Flexible",
    slot: "Moment de la journée",
    slotMorning: "Matin",
    slotNoon: "Midi",
    slotEvening: "Soir",
    slotAny: "Toute la journée",
    message: "Message (optionnel)",
    messagePh: "De quoi voulez-vous parler ? Quel sujet, quelle question, quelle décision ?",
    send: "Envoyer la demande",
    mailOnly: "Vous préférez écrire ?",
    sla: "Je réponds sous 24h les jours ouvrés.",
    confirm: "Après confirmation vous retrouvez le rendez-vous dans 'Messages'.",
  },
  en: {
    intro: "Schedule a conversation",
    sub: "Call, video or in-person? Two ways: pick a slot via Cal.com or request one below — I reply within 24h.",
    chooseSlot: "Pick a slot directly",
    chooseSlotDesc: "Open my calendar and book a time that works for you.",
    openCal: "Open my calendar",
    requestTitle: "Or request one here",
    requestDesc: "Share your preferences and I'll come back with 2-3 concrete proposals.",
    kind: "Type of meeting",
    kindCall: "Phone",
    kindVideo: "Video call",
    kindInPerson: "In person",
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
    messagePh: "What would you like to talk about? Which topic, question, decision?",
    send: "Send request",
    mailOnly: "Rather email directly?",
    sla: "I reply within 24h on weekdays.",
    confirm: "After confirmation you'll find the appointment under 'Messages'.",
  },
};

export default async function PortalAppointment({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = PORTAL_T[locale];
  const l = L[locale];

  // Echte e-mail uit company_settings; vroeger stond hier hardcoded
  // hallo@studio-vm.be (kwam niet aan). Cal.com-link komt uit outreach-
  // config (zelfde veld als voor outreach-mails).
  const [settings, outreach] = await Promise.all([
    getCompanySettings().catch(() => null),
    getOutreachConfig().catch(() => null),
  ]);
  const studioMail = settings?.email || "vmontreuil@outlook.be";
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
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {l.send}
              </button>
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
