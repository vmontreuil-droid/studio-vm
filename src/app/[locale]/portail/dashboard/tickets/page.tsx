import { notFound } from "next/navigation";
import { MessageSquare, Send, Plus, LifeBuoy } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { openTicket, replyTicket } from "@/app/actions/portal-client";
import {
  dt,
  badge,
  statusLabel,
  PORTAL_T,
  type Ticket,
  type Msg,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    intro: string;
    none: string;
    newTicket: string;
    subject: string;
    message: string;
    bodyPh: string;
    replyPh: string;
    revisionNote: string;
    send: string;
    reply: string;
    you: string;
    studio: string;
    stats: (open: number, closed: number, msgs: number) => string;
    msgN: (n: number) => string;
  }
> = {
  nl: {
    intro:
      "Een vraag over een model, een revisie na een planwijziging of een probleem op de machine? Open hier een ticket — ik antwoord op werkdagen binnen 24 u.",
    none: "Nog geen tickets. Open er hieronder een.",
    newTicket: "Nieuw ticket",
    subject: "Onderwerp (bv. project of werf + korte omschrijving)",
    message: "Bericht",
    bodyPh:
      "Beschrijf uw vraag of de gewenste wijziging. Vermeld het project, de machinesturing en — bij een revisie — welk plan gewijzigd is.",
    replyPh: "Uw reactie…",
    revisionNote:
      "Revisies na een planwijziging worden per uur gefactureerd. U kunt ze ook rechtstreeks op de pagina van het project aanvragen.",
    send: "Versturen",
    reply: "Antwoorden",
    you: "U",
    studio: "Studio VM",
    stats: (o, c, m) =>
      `${o} open · ${c} gesloten · ${m} ${m === 1 ? "bericht" : "berichten"}`,
    msgN: (n) => `${n} ${n === 1 ? "bericht" : "berichten"}`,
  },
  fr: {
    intro:
      "Une question sur un modèle, une révision après une modification de plan ou un problème sur la machine ? Ouvrez un ticket ici — je réponds sous 24 h les jours ouvrables.",
    none: "Aucun ticket pour l'instant. Ouvrez-en un ci-dessous.",
    newTicket: "Nouveau ticket",
    subject: "Sujet (p. ex. projet ou chantier + brève description)",
    message: "Message",
    bodyPh:
      "Décrivez votre question ou la modification souhaitée. Mentionnez le projet, le système de guidage et — pour une révision — le plan modifié.",
    replyPh: "Votre réponse…",
    revisionNote:
      "Les révisions après une modification de plan sont facturées à l'heure. Vous pouvez aussi les demander directement sur la page du projet.",
    send: "Envoyer",
    reply: "Répondre",
    you: "Vous",
    studio: "Studio VM",
    stats: (o, c, m) =>
      `${o} ${o === 1 ? "ouvert" : "ouverts"} · ${c} ${c === 1 ? "fermé" : "fermés"} · ${m} ${m === 1 ? "message" : "messages"}`,
    msgN: (n) => `${n} ${n === 1 ? "message" : "messages"}`,
  },
  en: {
    intro:
      "A question about a model, a revision after a plan change or an issue on the machine? Open a ticket here — I reply within 24 hours on working days.",
    none: "No tickets yet. Open one below.",
    newTicket: "New ticket",
    subject: "Subject (e.g. project or site + short description)",
    message: "Message",
    bodyPh:
      "Describe your question or the change you need. Mention the project, the machine control system and — for a revision — which plan has changed.",
    replyPh: "Your reply…",
    revisionNote:
      "Revisions after a plan change are billed by the hour. You can also request them directly on the project page.",
    send: "Send",
    reply: "Reply",
    you: "You",
    studio: "Studio VM",
    stats: (o, c, m) =>
      `${o} open · ${c} closed · ${m} ${m === 1 ? "message" : "messages"}`,
    msgN: (n) => `${n} ${n === 1 ? "message" : "messages"}`,
  },
  de: {
    intro:
      "Eine Frage zu einem Modell, eine Revision nach einer Planänderung oder ein Problem an der Maschine? Eröffnen Sie hier ein Ticket — ich antworte an Werktagen innerhalb von 24 Std.",
    none: "Noch keine Tickets. Eröffnen Sie unten eines.",
    newTicket: "Neues Ticket",
    subject: "Betreff (z. B. Projekt oder Baustelle + kurze Beschreibung)",
    message: "Nachricht",
    bodyPh:
      "Beschreiben Sie Ihre Frage oder die gewünschte Änderung. Nennen Sie das Projekt, die Maschinensteuerung und — bei einer Revision — den geänderten Plan.",
    replyPh: "Ihre Antwort…",
    revisionNote:
      "Revisionen nach einer Planänderung werden nach Stunden abgerechnet. Sie können sie auch direkt auf der Projektseite anfragen.",
    send: "Senden",
    reply: "Antworten",
    you: "Sie",
    studio: "Studio VM",
    stats: (o, c, m) =>
      `${o} offen · ${c} geschlossen · ${m} ${m === 1 ? "Nachricht" : "Nachrichten"}`,
    msgN: (n) => `${n} ${n === 1 ? "Nachricht" : "Nachrichten"}`,
  },
  es: {
    intro:
      "¿Una pregunta sobre un modelo, una revisión tras un cambio de plano o un problema en la máquina? Abra un ticket aquí — respondo en menos de 24 h en días laborables.",
    none: "Todavía no hay tickets. Abra uno a continuación.",
    newTicket: "Nuevo ticket",
    subject: "Asunto (p. ej., proyecto u obra + breve descripción)",
    message: "Mensaje",
    bodyPh:
      "Describa su pregunta o el cambio que necesita. Indique el proyecto, el sistema de control de máquina y — en caso de revisión — qué plano ha cambiado.",
    replyPh: "Su respuesta…",
    revisionNote:
      "Las revisiones tras un cambio de plano se facturan por horas. También puede solicitarlas directamente en la página del proyecto.",
    send: "Enviar",
    reply: "Responder",
    you: "Usted",
    studio: "Studio VM",
    stats: (o, c, m) =>
      `${o} ${o === 1 ? "abierto" : "abiertos"} · ${c} ${c === 1 ? "cerrado" : "cerrados"} · ${m} ${m === 1 ? "mensaje" : "mensajes"}`,
    msgN: (n) => `${n} ${n === 1 ? "mensaje" : "mensajes"}`,
  },
};

export default async function PortalTickets({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const [ticketsR, msgsR] = await Promise.all([
    sb.from("tickets").select("*").order("updated_at", { ascending: false }),
    sb
      .from("ticket_messages")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);
  const tickets = (ticketsR.data as Ticket[]) ?? [];
  const msgs = (msgsR.data as Msg[]) ?? [];
  const byTicket = new Map<string, Msg[]>();
  for (const m of msgs) {
    const arr = byTicket.get(m.ticket_id);
    if (arr) arr.push(m);
    else byTicket.set(m.ticket_id, [m]);
  }

  // Counters voor UX
  const openCnt = tickets.filter((tk) => tk.status !== "gesloten").length;
  const closedCnt = tickets.length - openCnt;
  const totalMsgs = msgs.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <LifeBuoy className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.tickets}
            </h1>
            {tickets.length > 0 && (
              <p className="mt-0.5 font-mono text-xs text-muted">
                {l.stats(openCnt, closedCnt, totalMsgs)}
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {l.intro}
      </p>

      <div className="mt-8 space-y-5">
        {tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/30 p-8 text-center">
            <MessageSquare
              className="mx-auto h-8 w-8 text-muted"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm text-muted">{l.none}</p>
          </div>
        )}
        {tickets.map((tk) => {
          const items = byTicket.get(tk.id) ?? [];
          const lastMsg = items[items.length - 1];
          const isClosed = tk.status === "gesloten";
          return (
            <div
              key={tk.id}
              className="overflow-hidden rounded-2xl bg-card shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/30 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <MessageSquare
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={2}
                  />
                  <p className="truncate font-semibold tracking-tight">
                    {tk.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  {lastMsg && (
                    <>
                      <span>{dt(lastMsg.created_at, locale)}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{l.msgN(items.length)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 uppercase tracking-widest ${badge(
                      tk.status,
                    )}`}
                  >
                    {statusLabel(tk.status, locale)}
                  </span>
                </div>
              </div>

              {/* Bericht-tijdlijn */}
              <div className="space-y-2.5 px-5 py-4">
                {items.map((m) => {
                  const isStudio = m.sender === "studio";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isStudio ? "flex-row" : "flex-row-reverse"}`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          isStudio
                            ? "bg-accent/15 text-accent"
                            : "bg-foreground/10 text-foreground"
                        }`}
                      >
                        {isStudio ? "VM" : (l.you[0] ?? "U")}
                      </span>
                      <div
                        className={`min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm ${
                          isStudio
                            ? "bg-accent/10"
                            : "border bg-background"
                        }`}
                      >
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {isStudio ? l.studio : l.you} ·{" "}
                          {dt(m.created_at, locale)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                          {m.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply-form (groter, textarea) */}
              {!isClosed && (
                <form
                  action={replyTicket}
                  className="border-t border-border/60 bg-background/20 px-5 py-4"
                >
                  <input type="hidden" name="ticket_id" value={tk.id} />
                  <textarea
                    name="body"
                    required
                    rows={3}
                    placeholder={l.replyPh}
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <div className="mt-2 flex justify-end">
                    <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                      <Send className="h-4 w-4" strokeWidth={2.5} />
                      {l.reply}
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}

        {/* Nieuw ticket */}
        <form
          action={openTicket}
          className="rounded-2xl border border-dashed bg-card/50 p-5"
        >
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {l.newTicket}
          </p>
          <input
            name="subject"
            required
            placeholder={l.subject}
            aria-label={l.subject}
            className="mb-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder={l.bodyPh}
            aria-label={l.message}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-xs text-muted">{l.revisionNote}</p>
            <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
              <Send className="h-4 w-4" strokeWidth={2.5} />
              {l.send}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
