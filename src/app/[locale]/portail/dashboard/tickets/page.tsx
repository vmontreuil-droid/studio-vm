import { notFound } from "next/navigation";
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

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.tickets}
      </h1>

      <div className="mt-8 space-y-4">
        {tickets.length === 0 && (
          <p className="text-sm text-muted">{l.none}</p>
        )}
        {tickets.map((tk) => (
          <div key={tk.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold tracking-tight">{tk.subject}</p>
              <span
                className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${badge(
                  tk.status,
                )}`}
              >
                {statusLabel(tk.status, locale)}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {(byTicket.get(tk.id) ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl px-4 py-2.5 text-sm ${
                    m.sender === "studio"
                      ? "bg-accent/10"
                      : "border bg-background"
                  }`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {m.sender === "studio" ? l.studio : l.you} ·{" "}
                    {dt(m.created_at, locale)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
            {tk.status !== "gesloten" && (
              <form
                action={replyTicket}
                className="mt-3 flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="ticket_id" value={tk.id} />
                <input
                  name="body"
                  required
                  placeholder={l.message}
                  className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                />
                <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                  {l.reply}
                </button>
              </form>
            )}
          </div>
        ))}

        <form
          action={openTicket}
          className="rounded-2xl border border-dashed bg-card/50 p-5"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
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
            rows={3}
            placeholder={l.message}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button className="mt-3 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            {l.send}
          </button>
        </form>
      </div>
    </>
  );
}
