import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setTicketStatus } from "@/app/actions/portal-admin";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  client_email: string;
  subject: string;
  status: string;
  updated_at: string;
};
type Msg = {
  ticket_id: string;
  sender: string;
  body: string;
  created_at: string;
};

const STATUSES = ["open", "alle", "in_behandeling", "gesloten"] as const;

export default async function AdminTickets({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as string)
    : "open";

  const db = getSupabaseAdmin();
  const [ticketsR, msgsR] = await Promise.all([
    db
      .from("tickets")
      .select("id, client_email, subject, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000),
    db
      .from("ticket_messages")
      .select("ticket_id, sender, body, created_at")
      .order("created_at", { ascending: true })
      .limit(5000),
  ]);
  const all = (ticketsR.data as Ticket[]) ?? [];
  const msgs = (msgsR.data as Msg[]) ?? [];
  const lastMsg = new Map<string, Msg>();
  for (const m of msgs) lastMsg.set(m.ticket_id, m);

  const open = all.filter((t) => t.status !== "gesloten");
  const tickets =
    status === "alle"
      ? all
      : status === "open"
        ? open
        : all.filter((t) => t.status === status);

  const sBadge = (s: string) =>
    s === "gesloten"
      ? "bg-red-500/15 text-red-500"
      : s === "in_behandeling"
        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
        : "bg-accent/15 text-accent";

  const stats = [
    { k: "Open", v: String(open.length) },
    {
      k: "In behandeling",
      v: String(all.filter((t) => t.status === "in_behandeling").length),
    },
    {
      k: "Gesloten",
      v: String(all.filter((t) => t.status === "gesloten").length),
    },
    { k: "Totaal", v: String(all.length) },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
      <p className="mt-2 text-sm text-muted">
        Supportvragen over alle klanten heen.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {s.k}
            </p>
            <p className="mt-1 text-2xl font-semibold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/tickets${s === "open" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              status === s
                ? "bg-foreground text-background"
                : "hover:bg-card-hover"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {tickets.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Geen tickets in deze weergave.
          </p>
        )}
        {tickets.map((t) => {
          const m = lastMsg.get(t.id);
          return (
            <div
              key={t.id}
              className="rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={`/admin/klanten/${encodeURIComponent(
                    t.client_email,
                  )}?tab=tickets`}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium">{t.subject}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted">
                    {t.client_email} · bijgewerkt{" "}
                    {new Date(t.updated_at).toLocaleString("nl-BE", {
                      timeZone: "Europe/Brussels",
                    })}
                  </p>
                  {m && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      <span className="font-mono text-[10px] uppercase tracking-widest">
                        {m.sender === "studio" ? "Studio" : "Klant"}:
                      </span>{" "}
                      {m.body}
                    </p>
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${sBadge(
                      t.status,
                    )}`}
                  >
                    {t.status}
                  </span>
                  {t.status !== "in_behandeling" &&
                    t.status !== "gesloten" && (
                      <form
                        action={setTicketStatus.bind(
                          null,
                          t.id,
                          "in_behandeling",
                        )}
                      >
                        <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                          Oppakken
                        </button>
                      </form>
                    )}
                  {t.status !== "gesloten" && (
                    <form
                      action={setTicketStatus.bind(null, t.id, "gesloten")}
                    >
                      <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
                        Sluiten
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
