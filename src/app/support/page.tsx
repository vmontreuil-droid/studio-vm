"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Send,
} from "lucide-react";

type TicketStatus = "open" | "in-progress" | "resolved";

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  createdAt: string;
  replies: { author: "klant" | "studio"; body: string; at: string }[];
};

const STORAGE_KEY = "studio-vm-tickets";

const seed: Ticket[] = [
  {
    id: "DEMO-1",
    title: "Foto's hoofdpagina updaten",
    description:
      "Kunnen jullie de bovenste 3 foto's op de homepage vervangen? Nieuwe versies staan in mijn Drive.",
    category: "Content",
    status: "in-progress",
    createdAt: "2026-05-12T09:14:00",
    replies: [
      {
        author: "studio",
        body:
          "Bedankt — ik heb de foto's binnen, ik werk ze 's middags in. Eind van de dag online.",
        at: "2026-05-12T10:02:00",
      },
    ],
  },
  {
    id: "DEMO-2",
    title: "Nieuw product toevoegen aan webshop",
    description:
      "Ik heb een nieuw seizoensproduct. Foto's en beschrijving stuur ik na.",
    category: "Webshop",
    status: "resolved",
    createdAt: "2026-05-08T14:30:00",
    replies: [
      {
        author: "studio",
        body: "Online sinds vrijdag, voorraad op 12 ingesteld. Laat weten als 't klopt.",
        at: "2026-05-09T11:20:00",
      },
      {
        author: "klant",
        body: "Perfect, dank!",
        at: "2026-05-09T11:45:00",
      },
    ],
  },
];

const categories = [
  "Algemene vraag",
  "Content (foto/tekst)",
  "Bug",
  "Webshop",
  "Domain / DNS",
  "Andere",
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setTickets(stored ? JSON.parse(stored) : seed);
    } catch {
      setTickets(seed);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {}
  }, [tickets, hydrated]);

  const addTicket = (t: Omit<Ticket, "id" | "createdAt" | "replies" | "status">) => {
    const newTicket: Ticket = {
      ...t,
      id: `T-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      createdAt: new Date().toISOString(),
      status: "open",
      replies: [],
    };
    setTickets((ts) => [newTicket, ...ts]);
    setCreating(false);
    setActive(newTicket);
  };

  const addReply = (ticketId: string, body: string) => {
    setTickets((ts) =>
      ts.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              replies: [
                ...t.replies,
                { author: "klant", body, at: new Date().toISOString() },
              ],
            }
          : t,
      ),
    );
    setActive((current) =>
      current && current.id === ticketId
        ? {
            ...current,
            replies: [
              ...current.replies,
              { author: "klant", body, at: new Date().toISOString() },
            ],
          }
        : current,
    );
  };

  const reset = () => {
    setTickets(seed);
    setActive(null);
    setCreating(false);
  };

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
                Support
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Tickets
              </h1>
              <p className="mt-3 max-w-xl text-muted">
                Open een ticket, volg de status, krijg meldingen per e-mail. Demo — werkt
                lokaal in je browser.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-full border px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-foreground"
              >
                Reset demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActive(null);
                  setCreating(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nieuw ticket
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_2fr]">
          <TicketList
            tickets={tickets}
            activeId={active?.id ?? null}
            onSelect={(t) => {
              setCreating(false);
              setActive(t);
            }}
          />
          <div>
            {creating ? (
              <NewTicketForm onCreate={addTicket} onCancel={() => setCreating(false)} />
            ) : active ? (
              <TicketDetail
                ticket={active}
                onBack={() => setActive(null)}
                onReply={(body) => addReply(active.id, body)}
              />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function TicketList({
  tickets,
  activeId,
  onSelect,
}: {
  tickets: Ticket[];
  activeId: string | null;
  onSelect: (t: Ticket) => void;
}) {
  return (
    <ul className="space-y-2">
      {tickets.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => onSelect(t)}
            className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
              activeId === t.id
                ? "border-accent bg-card-hover"
                : "border-border bg-card hover:bg-card-hover"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {t.id} · {t.category}
                </p>
                <h3 className="mt-1 font-semibold tracking-tight">{t.title}</h3>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-muted">{t.description}</p>
            <p className="mt-2 font-mono text-[10px] text-muted">
              {formatDate(t.createdAt)} · {t.replies.length} reactie
              {t.replies.length === 1 ? "" : "s"}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    open: { label: "Open", icon: Circle, className: "text-accent" },
    "in-progress": { label: "In behandeling", icon: Clock, className: "text-yellow-500" },
    resolved: { label: "Opgelost", icon: CheckCircle2, className: "text-green-500" },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 font-mono text-[10px] ${config.className}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {config.label}
    </span>
  );
}

function NewTicketForm({
  onCreate,
  onCancel,
}: {
  onCreate: (t: { title: string; description: string; category: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        onCreate({ title: title.trim(), description: description.trim(), category });
        setTitle("");
        setDescription("");
      }}
      className="space-y-5 rounded-2xl border bg-card p-6"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Nieuw ticket</h2>
        <p className="mt-1 text-sm text-muted">
          Beschrijf wat je nodig hebt. Een echte build mailt dit ook naar Studio VM.
        </p>
      </div>

      <div>
        <label
          htmlFor="cat"
          className="block font-mono text-xs uppercase tracking-widest text-muted"
        >
          Categorie
        </label>
        <select
          id="cat"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="title"
          className="block font-mono text-xs uppercase tracking-widest text-muted"
        >
          Titel
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bv. Nieuw product toevoegen"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="desc"
          className="block font-mono text-xs uppercase tracking-widest text-muted"
        >
          Beschrijving
        </label>
        <textarea
          id="desc"
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Wat heb je nodig? Hoe dringend?"
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          Verstuur ticket
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border px-4 py-2.5 text-sm transition-colors hover:bg-card-hover"
        >
          Annuleer
        </button>
      </div>
    </form>
  );
}

function TicketDetail({
  ticket,
  onBack,
  onReply,
}: {
  ticket: Ticket;
  onBack: () => void;
  onReply: (body: string) => void;
}) {
  const [reply, setReply] = useState("");
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Terug
      </button>
      <div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {ticket.id} · {ticket.category}
          </p>
          <StatusBadge status={ticket.status} />
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{ticket.title}</h2>
        <p className="mt-1 font-mono text-xs text-muted">
          Geopend op {formatDate(ticket.createdAt)}
        </p>
      </div>

      <div className="space-y-4">
        <Bubble author="klant" body={ticket.description} at={ticket.createdAt} />
        {ticket.replies.map((r, i) => (
          <Bubble key={i} author={r.author} body={r.body} at={r.at} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reply.trim()) return;
          onReply(reply.trim());
          setReply("");
        }}
        className="border-t pt-4"
      >
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reageer op dit ticket..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={!reply.trim()}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          Verstuur reactie
        </button>
      </form>
    </div>
  );
}

function Bubble({
  author,
  body,
  at,
}: {
  author: "klant" | "studio";
  body: string;
  at: string;
}) {
  const isStudio = author === "studio";
  return (
    <div className={`flex gap-3 ${isStudio ? "flex-row-reverse text-right" : ""}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold ${
          isStudio
            ? "bg-accent text-white"
            : "border bg-background text-muted"
        }`}
      >
        {isStudio ? "VM" : "JI"}
      </div>
      <div className="flex-1">
        <p
          className={`inline-block max-w-prose rounded-2xl px-4 py-2.5 text-sm ${
            isStudio
              ? "bg-foreground text-background"
              : "bg-background text-foreground"
          }`}
        >
          {body}
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted">{formatDate(at)}</p>
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-12 text-center text-muted">
      <MessageSquare className="h-12 w-12" strokeWidth={1} />
      <p className="mt-4 text-sm">
        Selecteer een ticket links of open een nieuw ticket.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
