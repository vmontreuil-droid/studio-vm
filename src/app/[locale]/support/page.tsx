"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Send,
} from "lucide-react";
import {
  isValidLocale,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

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

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    reset: string;
    newTicket: string;
    listReplies: (n: number) => string;
    status: { open: string; "in-progress": string; resolved: string };
    formTitle: string;
    formIntro: string;
    category: string;
    titleLabel: string;
    titlePh: string;
    descLabel: string;
    descPh: string;
    submit: string;
    cancel: string;
    back: string;
    openedOn: string;
    replyPh: string;
    sendReply: string;
    emptyDetail: string;
    categories: string[];
    seed: Ticket[];
    localeCode: string;
  }
> = {
  nl: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "Open een ticket, volg de status, krijg meldingen per e-mail. Demo — werkt lokaal in je browser.",
    reset: "Reset demo",
    newTicket: "Nieuw ticket",
    listReplies: (n) => `${n} reactie${n === 1 ? "" : "s"}`,
    status: { open: "Open", "in-progress": "In behandeling", resolved: "Opgelost" },
    formTitle: "Nieuw ticket",
    formIntro: "Beschrijf wat je nodig hebt. Een echte build mailt dit ook naar Studio VM.",
    category: "Categorie",
    titleLabel: "Titel",
    titlePh: "Bv. Nieuw product toevoegen",
    descLabel: "Beschrijving",
    descPh: "Wat heb je nodig? Hoe dringend?",
    submit: "Verstuur ticket",
    cancel: "Annuleer",
    back: "Terug",
    openedOn: "Geopend op",
    replyPh: "Reageer op dit ticket...",
    sendReply: "Verstuur reactie",
    emptyDetail: "Selecteer een ticket links of open een nieuw ticket.",
    categories: ["Algemene vraag", "Content (foto/tekst)", "Bug", "Webshop", "Domain / DNS", "Andere"],
    seed: [
      { id: "DEMO-1", title: "Foto's hoofdpagina updaten", description: "Kunnen jullie de bovenste 3 foto's op de homepage vervangen? Nieuwe versies staan in mijn Drive.", category: "Content", status: "in-progress", createdAt: "2026-05-12T09:14:00", replies: [{ author: "studio", body: "Bedankt — ik heb de foto's binnen, ik werk ze 's middags in. Eind van de dag online.", at: "2026-05-12T10:02:00" }] },
      { id: "DEMO-2", title: "Nieuw product toevoegen aan webshop", description: "Ik heb een nieuw seizoensproduct. Foto's en beschrijving stuur ik na.", category: "Webshop", status: "resolved", createdAt: "2026-05-08T14:30:00", replies: [{ author: "studio", body: "Online sinds vrijdag, voorraad op 12 ingesteld. Laat weten als 't klopt.", at: "2026-05-09T11:20:00" }, { author: "klant", body: "Perfect, dank!", at: "2026-05-09T11:45:00" }] },
    ],
    localeCode: "nl-BE",
  },
  fr: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "Ouvrez un ticket, suivez le statut, recevez des notifications par e-mail. Démo — fonctionne localement dans votre navigateur.",
    reset: "Réinitialiser la démo",
    newTicket: "Nouveau ticket",
    listReplies: (n) => `${n} réponse${n === 1 ? "" : "s"}`,
    status: { open: "Ouvert", "in-progress": "En cours", resolved: "Résolu" },
    formTitle: "Nouveau ticket",
    formIntro: "Décrivez ce dont vous avez besoin. Un vrai projet envoie aussi ceci à Studio VM par e-mail.",
    category: "Catégorie",
    titleLabel: "Titre",
    titlePh: "Ex. Ajouter un nouveau produit",
    descLabel: "Description",
    descPh: "De quoi avez-vous besoin ? Quelle urgence ?",
    submit: "Envoyer le ticket",
    cancel: "Annuler",
    back: "Retour",
    openedOn: "Ouvert le",
    replyPh: "Répondre à ce ticket...",
    sendReply: "Envoyer la réponse",
    emptyDetail: "Sélectionnez un ticket à gauche ou ouvrez un nouveau ticket.",
    categories: ["Question générale", "Contenu (photo/texte)", "Bug", "Boutique", "Domaine / DNS", "Autre"],
    seed: [
      { id: "DEMO-1", title: "Mettre à jour les photos de la page d'accueil", description: "Pouvez-vous remplacer les 3 photos du haut sur la page d'accueil ? Les nouvelles versions sont dans mon Drive.", category: "Contenu", status: "in-progress", createdAt: "2026-05-12T09:14:00", replies: [{ author: "studio", body: "Merci — j'ai les photos, je les intègre cet après-midi. En ligne en fin de journée.", at: "2026-05-12T10:02:00" }] },
      { id: "DEMO-2", title: "Ajouter un nouveau produit à la boutique", description: "J'ai un nouveau produit de saison. J'envoie photos et description ensuite.", category: "Boutique", status: "resolved", createdAt: "2026-05-08T14:30:00", replies: [{ author: "studio", body: "En ligne depuis vendredi, stock réglé à 12. Dites-moi si c'est bon.", at: "2026-05-09T11:20:00" }, { author: "klant", body: "Parfait, merci !", at: "2026-05-09T11:45:00" }] },
    ],
    localeCode: "fr-BE",
  },
  en: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "Open a ticket, track the status, get email notifications. Demo — works locally in your browser.",
    reset: "Reset demo",
    newTicket: "New ticket",
    listReplies: (n) => `${n} repl${n === 1 ? "y" : "ies"}`,
    status: { open: "Open", "in-progress": "In progress", resolved: "Resolved" },
    formTitle: "New ticket",
    formIntro: "Describe what you need. A real build also emails this to Studio VM.",
    category: "Category",
    titleLabel: "Title",
    titlePh: "E.g. Add a new product",
    descLabel: "Description",
    descPh: "What do you need? How urgent?",
    submit: "Send ticket",
    cancel: "Cancel",
    back: "Back",
    openedOn: "Opened on",
    replyPh: "Reply to this ticket...",
    sendReply: "Send reply",
    emptyDetail: "Select a ticket on the left or open a new ticket.",
    categories: ["General question", "Content (photo/text)", "Bug", "Webshop", "Domain / DNS", "Other"],
    seed: [
      { id: "DEMO-1", title: "Update homepage photos", description: "Can you replace the top 3 photos on the homepage? New versions are in my Drive.", category: "Content", status: "in-progress", createdAt: "2026-05-12T09:14:00", replies: [{ author: "studio", body: "Thanks — I have the photos, I'll work them in this afternoon. Online by end of day.", at: "2026-05-12T10:02:00" }] },
      { id: "DEMO-2", title: "Add a new product to the webshop", description: "I have a new seasonal product. I'll send photos and description after.", category: "Webshop", status: "resolved", createdAt: "2026-05-08T14:30:00", replies: [{ author: "studio", body: "Online since Friday, stock set to 12. Let me know if it's right.", at: "2026-05-09T11:20:00" }, { author: "klant", body: "Perfect, thanks!", at: "2026-05-09T11:45:00" }] },
    ],
    localeCode: "en-GB",
  },
};

export default function SupportPage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setTickets(stored ? JSON.parse(stored) : c.seed);
    } catch {
      setTickets(c.seed);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {}
  }, [tickets, hydrated]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(c.localeCode, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const addTicket = (d: {
    title: string;
    description: string;
    category: string;
  }) => {
    const nt: Ticket = {
      ...d,
      id: `T-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      createdAt: new Date().toISOString(),
      status: "open",
      replies: [],
    };
    setTickets((ts) => [nt, ...ts]);
    setCreating(false);
    setActive(nt);
  };

  const addReply = (id: string, body: string) => {
    const r = { author: "klant" as const, body, at: new Date().toISOString() };
    setTickets((ts) =>
      ts.map((t) => (t.id === id ? { ...t, replies: [...t.replies, r] } : t)),
    );
    setActive((cur) =>
      cur && cur.id === id ? { ...cur, replies: [...cur.replies, r] } : cur,
    );
  };

  const reset = () => {
    setTickets(c.seed);
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
                {c.eyebrow}
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {c.title}
              </h1>
              <p className="mt-3 max-w-xl text-muted">{c.intro}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-full border px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-foreground"
              >
                {c.reset}
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
                {c.newTicket}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_2fr]">
          <ul className="space-y-2">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setActive(tk);
                  }}
                  className={`block w-full rounded-2xl border p-4 text-left transition-colors ${
                    active?.id === tk.id
                      ? "border-accent bg-card-hover"
                      : "border-border bg-card hover:bg-card-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {tk.id} · {tk.category}
                      </p>
                      <h3 className="mt-1 font-semibold tracking-tight">
                        {tk.title}
                      </h3>
                    </div>
                    <StatusBadge status={tk.status} labels={c.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted">
                    {tk.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted">
                    {fmt(tk.createdAt)} · {c.listReplies(tk.replies.length)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div>
            {creating ? (
              <NewTicketForm
                c={c}
                onCreate={addTicket}
                onCancel={() => setCreating(false)}
              />
            ) : active ? (
              <TicketDetail
                c={c}
                fmt={fmt}
                ticket={active}
                onBack={() => setActive(null)}
                onReply={(b) => addReply(active.id, b)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 p-12 text-center text-muted">
                <MessageSquare className="h-12 w-12" strokeWidth={1} />
                <p className="mt-4 text-sm">{c.emptyDetail}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

type Copy = (typeof T)[Locale];

function StatusBadge({
  status,
  labels,
}: {
  status: TicketStatus;
  labels: Copy["status"];
}) {
  const cfg = {
    open: { icon: Circle, className: "text-accent" },
    "in-progress": { icon: Clock, className: "text-yellow-500" },
    resolved: { icon: CheckCircle2, className: "text-green-500" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 font-mono text-[10px] ${cfg.className}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {labels[status]}
    </span>
  );
}

function NewTicketForm({
  c,
  onCreate,
  onCancel,
}: {
  c: Copy;
  onCreate: (d: { title: string; description: string; category: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(c.categories[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;
        onCreate({
          title: title.trim(),
          description: description.trim(),
          category,
        });
      }}
      className="space-y-5 rounded-2xl border bg-card p-6"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{c.formTitle}</h2>
        <p className="mt-1 text-sm text-muted">{c.formIntro}</p>
      </div>
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-muted">
          {c.category}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {c.categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-muted">
          {c.titleLabel}
        </label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={c.titlePh}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-muted">
          {c.descLabel}
        </label>
        <textarea
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={c.descPh}
          className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {c.submit}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border px-4 py-2.5 text-sm transition-colors hover:bg-card-hover"
        >
          {c.cancel}
        </button>
      </div>
    </form>
  );
}

function TicketDetail({
  c,
  fmt,
  ticket,
  onBack,
  onReply,
}: {
  c: Copy;
  fmt: (iso: string) => string;
  ticket: Ticket;
  onBack: () => void;
  onReply: (b: string) => void;
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
        {c.back}
      </button>
      <div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {ticket.id} · {ticket.category}
          </p>
          <StatusBadge status={ticket.status} labels={c.status} />
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          {ticket.title}
        </h2>
        <p className="mt-1 font-mono text-xs text-muted">
          {c.openedOn} {fmt(ticket.createdAt)}
        </p>
      </div>
      <div className="space-y-4">
        <Bubble
          author="klant"
          body={ticket.description}
          at={ticket.createdAt}
          fmt={fmt}
        />
        {ticket.replies.map((r, i) => (
          <Bubble key={i} author={r.author} body={r.body} at={r.at} fmt={fmt} />
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
          placeholder={c.replyPh}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={!reply.trim()}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
          {c.sendReply}
        </button>
      </form>
    </div>
  );
}

function Bubble({
  author,
  body,
  at,
  fmt,
}: {
  author: "klant" | "studio";
  body: string;
  at: string;
  fmt: (iso: string) => string;
}) {
  const isStudio = author === "studio";
  return (
    <div className={`flex gap-3 ${isStudio ? "flex-row-reverse text-right" : ""}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold ${
          isStudio ? "bg-accent text-white" : "border bg-background text-muted"
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
        <p className="mt-1 font-mono text-[10px] text-muted">{fmt(at)}</p>
      </div>
    </div>
  );
}
