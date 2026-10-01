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
  UserRound,
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

// v2: nieuwe demo-inhoud (3D-modellen). Oude sleutel bevatte nog
// website-voorbeelden die anders uit localStorage zouden terugkomen.
const STORAGE_KEY = "studio-vm-tickets-v2";

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
    intro: "Zo verloopt support in het klantenportaal: vragen over een model of een revisie na een planwijziging, met status en antwoord per ticket. Dit is een demo — ze werkt enkel lokaal in uw browser.",
    reset: "Demo resetten",
    newTicket: "Nieuw ticket",
    listReplies: (n) => `${n} reactie${n === 1 ? "" : "s"}`,
    status: { open: "Open", "in-progress": "In behandeling", resolved: "Opgelost" },
    formTitle: "Nieuw ticket",
    formIntro: "Beschrijf uw vraag of de gewenste wijziging. In het klantenportaal komt een ticket meteen bij Studio VM terecht.",
    category: "Categorie",
    titleLabel: "Titel",
    titlePh: "Bv. Revisie rioleringsplan fase 2",
    descLabel: "Beschrijving",
    descPh: "Over welk project en welke machinesturing gaat het? Wat is er gewijzigd en tegen wanneer hebt u het nodig?",
    submit: "Ticket versturen",
    cancel: "Annuleren",
    back: "Terug",
    openedOn: "Geopend op",
    replyPh: "Reageer op dit ticket…",
    sendReply: "Reactie versturen",
    emptyDetail: "Selecteer links een ticket of open een nieuw ticket.",
    categories: ["Vraag over een model", "Revisie na planwijziging", "Bestand of machinesturing", "Coördinaten & hoogtes", "Facturatie", "Andere"],
    seed: [
      { id: "DEMO-1", title: "Revisie: rioleringsplan fase 2 gewijzigd", description: "Het studiebureau heeft een nieuwe versie van het rioleringsplan gestuurd (rev. C). Kunt u het model aanpassen? Het plan zit in bijlage.", category: "Revisie na planwijziging", status: "in-progress", createdAt: "2026-09-14T08:12:00", replies: [{ author: "studio", body: "Ontvangen — ik verwerk rev. C vandaag. Versie 3 staat morgenvroeg klaar voor Trimble en Topcon. De revisie wordt per uur gefactureerd.", at: "2026-09-14T09:05:00" }] },
      { id: "DEMO-2", title: "Model opent niet op de graafmachine", description: "Bij het openen van het model op onze Unicontrol-machine krijgen we de melding dat het coördinatenstelsel niet gevonden wordt.", category: "Bestand of machinesturing", status: "resolved", createdAt: "2026-09-08T13:40:00", replies: [{ author: "studio", body: "Het model stond in Lambert 2008, uw machine is ingesteld op Lambert 72. Versie 2 in Lambert 72 staat klaar in het portaal — controleer ze eerst op een gekend punt.", at: "2026-09-08T15:10:00" }, { author: "klant", body: "Werkt perfect, dank u!", at: "2026-09-09T07:30:00" }] },
    ],
    localeCode: "nl-BE",
  },
  fr: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "Voici comment fonctionne le support dans le portail client : questions sur un modèle ou révision après une modification de plan, avec statut et réponse par ticket. Ceci est une démo — elle fonctionne uniquement en local dans votre navigateur.",
    reset: "Réinitialiser la démo",
    newTicket: "Nouveau ticket",
    listReplies: (n) => `${n} réponse${n === 1 ? "" : "s"}`,
    status: { open: "Ouvert", "in-progress": "En cours", resolved: "Résolu" },
    formTitle: "Nouveau ticket",
    formIntro: "Décrivez votre question ou la modification souhaitée. Dans le portail client, un ticket arrive directement chez Studio VM.",
    category: "Catégorie",
    titleLabel: "Titre",
    titlePh: "Ex. Révision plan d'égouttage phase 2",
    descLabel: "Description",
    descPh: "De quel projet et de quel système de guidage s'agit-il ? Qu'est-ce qui a changé et pour quand en avez-vous besoin ?",
    submit: "Envoyer le ticket",
    cancel: "Annuler",
    back: "Retour",
    openedOn: "Ouvert le",
    replyPh: "Répondre à ce ticket…",
    sendReply: "Envoyer la réponse",
    emptyDetail: "Sélectionnez un ticket à gauche ou ouvrez un nouveau ticket.",
    categories: ["Question sur un modèle", "Révision après modification de plan", "Fichier ou système de guidage", "Coordonnées & altitudes", "Facturation", "Autre"],
    seed: [
      { id: "DEMO-1", title: "Révision : plan d'égouttage phase 2 modifié", description: "Le bureau d'études a envoyé une nouvelle version du plan d'égouttage (rév. C). Pouvez-vous adapter le modèle ? Le plan est en pièce jointe.", category: "Révision après modification de plan", status: "in-progress", createdAt: "2026-09-14T08:12:00", replies: [{ author: "studio", body: "Bien reçu — je traite la rév. C aujourd'hui. La version 3 sera prête demain matin pour Trimble et Topcon. La révision est facturée à l'heure.", at: "2026-09-14T09:05:00" }] },
      { id: "DEMO-2", title: "Le modèle ne s'ouvre pas sur la pelle", description: "En ouvrant le modèle sur notre machine Unicontrol, nous recevons le message que le système de coordonnées est introuvable.", category: "Fichier ou système de guidage", status: "resolved", createdAt: "2026-09-08T13:40:00", replies: [{ author: "studio", body: "Le modèle était en Lambert 2008, votre machine est réglée sur Lambert 72. La version 2 en Lambert 72 est prête dans le portail — vérifiez-la d'abord sur un point connu.", at: "2026-09-08T15:10:00" }, { author: "klant", body: "Parfait, merci !", at: "2026-09-09T07:30:00" }] },
    ],
    localeCode: "fr-BE",
  },
  en: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "This is how support works in the client portal: questions about a model or a revision after a plan change, with status and reply per ticket. This is a demo — it only runs locally in your browser.",
    reset: "Reset demo",
    newTicket: "New ticket",
    listReplies: (n) => `${n} repl${n === 1 ? "y" : "ies"}`,
    status: { open: "Open", "in-progress": "In progress", resolved: "Resolved" },
    formTitle: "New ticket",
    formIntro: "Describe your question or the change you need. In the client portal, a ticket goes straight to Studio VM.",
    category: "Category",
    titleLabel: "Title",
    titlePh: "E.g. Revision sewer plan phase 2",
    descLabel: "Description",
    descPh: "Which project and which machine control system is it about? What has changed and when do you need it?",
    submit: "Send ticket",
    cancel: "Cancel",
    back: "Back",
    openedOn: "Opened on",
    replyPh: "Reply to this ticket…",
    sendReply: "Send reply",
    emptyDetail: "Select a ticket on the left or open a new ticket.",
    categories: ["Question about a model", "Revision after plan change", "File or machine control", "Coordinates & heights", "Billing", "Other"],
    seed: [
      { id: "DEMO-1", title: "Revision: sewer plan phase 2 changed", description: "The engineering firm sent a new version of the sewer plan (rev. C). Could you update the model? The plan is attached.", category: "Revision after plan change", status: "in-progress", createdAt: "2026-09-14T08:12:00", replies: [{ author: "studio", body: "Received — I will process rev. C today. Version 3 will be ready tomorrow morning for Trimble and Topcon. The revision is billed by the hour.", at: "2026-09-14T09:05:00" }] },
      { id: "DEMO-2", title: "Model won't open on the excavator", description: "When we open the model on our Unicontrol machine, we get a message that the coordinate system cannot be found.", category: "File or machine control", status: "resolved", createdAt: "2026-09-08T13:40:00", replies: [{ author: "studio", body: "The model was in Lambert 2008; your machine is set to Lambert 72. Version 2 in Lambert 72 is ready in the portal — please check it on a known point first.", at: "2026-09-08T15:10:00" }, { author: "klant", body: "Works perfectly, thanks!", at: "2026-09-09T07:30:00" }] },
    ],
    localeCode: "en-GB",
  },
  de: {
    eyebrow: "Support",
    title: "Tickets",
    intro: "So funktioniert der Support im Kundenportal: Fragen zu einem Modell oder eine Revision nach einer Planänderung, mit Status und Antwort pro Ticket. Dies ist eine Demo — sie läuft nur lokal in Ihrem Browser.",
    reset: "Demo zurücksetzen",
    newTicket: "Neues Ticket",
    listReplies: (n) => `${n} Antwort${n === 1 ? "" : "en"}`,
    status: { open: "Offen", "in-progress": "In Bearbeitung", resolved: "Gelöst" },
    formTitle: "Neues Ticket",
    formIntro: "Beschreiben Sie Ihre Frage oder die gewünschte Änderung. Im Kundenportal geht ein Ticket direkt an Studio VM.",
    category: "Kategorie",
    titleLabel: "Titel",
    titlePh: "z. B. Revision Kanalplan Abschnitt 2",
    descLabel: "Beschreibung",
    descPh: "Um welches Projekt und welche Maschinensteuerung geht es? Was hat sich geändert und bis wann benötigen Sie es?",
    submit: "Ticket senden",
    cancel: "Abbrechen",
    back: "Zurück",
    openedOn: "Eröffnet am",
    replyPh: "Auf dieses Ticket antworten…",
    sendReply: "Antwort senden",
    emptyDetail: "Wählen Sie links ein Ticket aus oder eröffnen Sie ein neues Ticket.",
    categories: ["Frage zu einem Modell", "Revision nach Planänderung", "Datei oder Maschinensteuerung", "Koordinaten & Höhen", "Rechnung", "Sonstiges"],
    seed: [
      { id: "DEMO-1", title: "Revision: Kanalplan Abschnitt 2 geändert", description: "Das Ingenieurbüro hat eine neue Version des Kanalplans geschickt (Rev. C). Können Sie das Modell anpassen? Der Plan liegt bei.", category: "Revision nach Planänderung", status: "in-progress", createdAt: "2026-09-14T08:12:00", replies: [{ author: "studio", body: "Erhalten — ich bearbeite Rev. C heute. Version 3 steht morgen früh für Trimble und Topcon bereit. Die Revision wird nach Stunden abgerechnet.", at: "2026-09-14T09:05:00" }] },
      { id: "DEMO-2", title: "Modell öffnet sich nicht auf dem Bagger", description: "Beim Öffnen des Modells auf unserer Unicontrol-Maschine erscheint die Meldung, dass das Koordinatensystem nicht gefunden wird.", category: "Datei oder Maschinensteuerung", status: "resolved", createdAt: "2026-09-08T13:40:00", replies: [{ author: "studio", body: "Das Modell lag in ETRS89 / UTM 32N vor, Ihre Maschine ist auf Gauß-Krüger eingestellt. Version 2 in Gauß-Krüger steht im Portal bereit — bitte zuerst an einem bekannten Punkt prüfen.", at: "2026-09-08T15:10:00" }, { author: "klant", body: "Funktioniert einwandfrei, danke!", at: "2026-09-09T07:30:00" }] },
    ],
    localeCode: "de-DE",
  },
  es: {
    eyebrow: "Soporte",
    title: "Tickets",
    intro: "Así funciona el soporte en el portal de clientes: preguntas sobre un modelo o una revisión tras un cambio de plano, con estado y respuesta por ticket. Esto es una demo — solo funciona localmente en su navegador.",
    reset: "Restablecer demo",
    newTicket: "Nuevo ticket",
    listReplies: (n) => `${n} respuesta${n === 1 ? "" : "s"}`,
    status: { open: "Abierto", "in-progress": "En curso", resolved: "Resuelto" },
    formTitle: "Nuevo ticket",
    formIntro: "Describa su pregunta o el cambio que necesita. En el portal de clientes, un ticket llega directamente a Studio VM.",
    category: "Categoría",
    titleLabel: "Título",
    titlePh: "P. ej. Revisión plano de saneamiento fase 2",
    descLabel: "Descripción",
    descPh: "¿De qué proyecto y de qué sistema de control de máquina se trata? ¿Qué ha cambiado y para cuándo lo necesita?",
    submit: "Enviar ticket",
    cancel: "Cancelar",
    back: "Volver",
    openedOn: "Abierto el",
    replyPh: "Responder a este ticket…",
    sendReply: "Enviar respuesta",
    emptyDetail: "Seleccione un ticket a la izquierda o abra un nuevo ticket.",
    categories: ["Pregunta sobre un modelo", "Revisión tras cambio de plano", "Archivo o control de máquina", "Coordenadas y cotas", "Facturación", "Otro"],
    seed: [
      { id: "DEMO-1", title: "Revisión: plano de saneamiento fase 2 modificado", description: "La ingeniería ha enviado una nueva versión del plano de saneamiento (rev. C). ¿Puede adaptar el modelo? Adjunto el plano.", category: "Revisión tras cambio de plano", status: "in-progress", createdAt: "2026-09-14T08:12:00", replies: [{ author: "studio", body: "Recibido — proceso la rev. C hoy. La versión 3 estará lista mañana por la mañana para Trimble y Topcon. La revisión se factura por horas.", at: "2026-09-14T09:05:00" }] },
      { id: "DEMO-2", title: "El modelo no se abre en la excavadora", description: "Al abrir el modelo en nuestra máquina Unicontrol aparece el mensaje de que no se encuentra el sistema de coordenadas.", category: "Archivo o control de máquina", status: "resolved", createdAt: "2026-09-08T13:40:00", replies: [{ author: "studio", body: "El modelo estaba en ETRS89 / UTM 30N y su máquina está configurada en ED50 / UTM 30N. La versión 2 en ED50 está lista en el portal; compruébela primero en un punto conocido.", at: "2026-09-08T15:10:00" }, { author: "klant", body: "¡Funciona perfectamente, gracias!", at: "2026-09-09T07:30:00" }] },
    ],
    localeCode: "es-ES",
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
        <div className="wrap py-16 2xl:py-20">
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
        <div className="wrap grid gap-8 py-12 lg:grid-cols-[1fr_2fr] xl:gap-12 2xl:py-16">
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
        {isStudio ? "VM" : <UserRound className="h-3.5 w-3.5" strokeWidth={2} />}
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
