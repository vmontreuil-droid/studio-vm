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
    none: string;
    newTicket: string;
    subject: string;
    message: string;
    send: string;
    reply: string;
    you: string;
    studio: string;
  }
> = {
  nl: {
    none: "Nog geen tickets. Open er hieronder een.",
    newTicket: "Nieuw ticket",
    subject: "Onderwerp",
    message: "Bericht",
    send: "Versturen",
    reply: "Antwoorden",
    you: "Jij",
    studio: "Studio VM",
  },
  fr: {
    none: "Aucun ticket. Ouvrez-en un ci-dessous.",
    newTicket: "Nouveau ticket",
    subject: "Sujet",
    message: "Message",
    send: "Envoyer",
    reply: "Répondre",
    you: "Vous",
    studio: "Studio VM",
  },
  en: {
    none: "No tickets yet. Open one below.",
    newTicket: "New ticket",
    subject: "Subject",
    message: "Message",
    send: "Send",
    reply: "Reply",
    you: "You",
    studio: "Studio VM",
  },
  de: {
    none: "Noch keine Tickets. Eröffnen Sie unten eines.",
    newTicket: "Neues Ticket",
    subject: "Betreff",
    message: "Nachricht",
    send: "Senden",
    reply: "Antworten",
    you: "Sie",
    studio: "Studio VM",
  },
  es: {
    none: "Todavía no hay tickets. Abra uno a continuación.",
    newTicket: "Nuevo ticket",
    subject: "Asunto",
    message: "Mensaje",
    send: "Enviar",
    reply: "Responder",
    you: "Usted",
    studio: "Studio VM",
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
              <p className="mt-0.5 text-sm text-muted">
                {openCnt} open · {closedCnt} gesloten · {totalMsgs} berichten
              </p>
            )}
          </div>
        </div>
      </div>

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
                  <span>{items.length} msg</span>
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
                        {isStudio ? "VM" : (l.you[0] ?? "J")}
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
                    placeholder={l.message}
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
            className="mb-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder={l.message}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 flex justify-end">
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
