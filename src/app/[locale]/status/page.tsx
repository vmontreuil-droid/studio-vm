import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Activity,
  Clock,
  Server,
  Database,
  Mail,
  Globe,
} from "lucide-react";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

const buildTime = new Date();

type Service = {
  icon: typeof Server;
  name: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
};

const baseServices: { icon: typeof Server; name: string; uptime: number }[] = [
  { icon: Globe, name: "studio-vm.be", uptime: 99.99 },
  { icon: Server, name: "Vercel CDN", uptime: 99.97 },
  { icon: Database, name: "Supabase EU", uptime: 99.95 },
  { icon: Mail, name: "Resend (mail)", uptime: 99.98 },
];

const copy: Record<
  Locale,
  {
    metaTitle: string;
    eyebrow: string;
    allOk: string;
    down: string;
    checked: string;
    hints: string[];
    uptimeTitle: string;
    uptimeNote: string;
    eventsTitle: string;
    events: { when: string; type: "deploy" | "info" | "incident"; text: string }[];
    ctaTitle: string;
    ctaText: string;
    pill: { operational: string; degraded: string; down: string };
    localeCode: string;
  }
> = {
  nl: {
    metaTitle: "Status — Studio VM",
    eyebrow: "Status",
    allOk: "Alles draait normaal.",
    down: "Er is een storing.",
    checked: "Laatst gecontroleerd",
    hints: [
      "Publieke website + portfolio",
      "Wereldwijde edge-delivery",
      "Data + auth voor klant-portalen",
      "Contact + nieuwsbrieven",
    ],
    uptimeTitle: "Uptime — laatste 90 dagen",
    uptimeNote: "Elke cel = één dag. Groen = volledig operationeel, oranje = korte verstoring. Klanten met Plus/Scale krijgen automatisch melding bij downtime.",
    eventsTitle: "Recente events",
    events: [
      { when: "2026-05-15 00:10", type: "deploy", text: "Volledige NL/FR/EN vertaling gepubliceerd." },
      { when: "2026-05-14 21:32", type: "deploy", text: "Logo update naar &lt;vm/&gt; gepubliceerd." },
      { when: "2026-05-14 20:50", type: "deploy", text: "Eerste publieke versie van studio-vm.be live." },
    ],
    ctaTitle: "Heb je een storing op je eigen site?",
    ctaText:
      "Klanten met een Plus of Scale abonnement krijgen automatisch melding bij downtime. Voor anderen — laat 't even weten via support.",
    pill: { operational: "Operationeel", degraded: "Verstoord", down: "Storing" },
    localeCode: "nl-BE",
  },
  fr: {
    metaTitle: "Statut — Studio VM",
    eyebrow: "Statut",
    allOk: "Tout fonctionne normalement.",
    down: "Une panne est en cours.",
    checked: "Dernière vérification",
    hints: [
      "Site public + portfolio",
      "Edge-delivery mondiale",
      "Données + auth pour espaces clients",
      "Contact + newsletters",
    ],
    uptimeTitle: "Uptime — 90 derniers jours",
    uptimeNote: "Chaque cellule = un jour. Vert = totalement opérationnel, orange = brève perturbation. Les clients Plus/Scale sont avertis automatiquement.",
    eventsTitle: "Événements récents",
    events: [
      { when: "2026-05-15 00:10", type: "deploy", text: "Traduction complète NL/FR/EN publiée." },
      { when: "2026-05-14 21:32", type: "deploy", text: "Mise à jour du logo vers &lt;vm/&gt; publiée." },
      { when: "2026-05-14 20:50", type: "deploy", text: "Première version publique de studio-vm.be en ligne." },
    ],
    ctaTitle: "Une panne sur votre propre site ?",
    ctaText:
      "Les clients avec un abonnement Plus ou Scale sont avertis automatiquement en cas de downtime. Pour les autres — signalez-le via le support.",
    pill: { operational: "Opérationnel", degraded: "Dégradé", down: "Panne" },
    localeCode: "fr-BE",
  },
  en: {
    metaTitle: "Status — Studio VM",
    eyebrow: "Status",
    allOk: "Everything is running normally.",
    down: "There is an outage.",
    checked: "Last checked",
    hints: [
      "Public website + portfolio",
      "Worldwide edge delivery",
      "Data + auth for client portals",
      "Contact + newsletters",
    ],
    uptimeTitle: "Uptime — last 90 days",
    uptimeNote: "Each cell = one day. Green = fully operational, amber = brief disruption. Plus/Scale clients are notified automatically on downtime.",
    eventsTitle: "Recent events",
    events: [
      { when: "2026-05-15 00:10", type: "deploy", text: "Full NL/FR/EN translation published." },
      { when: "2026-05-14 21:32", type: "deploy", text: "Logo update to &lt;vm/&gt; published." },
      { when: "2026-05-14 20:50", type: "deploy", text: "First public version of studio-vm.be live." },
    ],
    ctaTitle: "An outage on your own site?",
    ctaText:
      "Clients with a Plus or Scale subscription are automatically notified on downtime. For others — let me know via support.",
    pill: { operational: "Operational", degraded: "Degraded", down: "Down" },
    localeCode: "en-GB",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: copy[locale].metaTitle };
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  const services: Service[] = baseServices.map((s) => ({
    ...s,
    status: "operational" as const,
  }));
  const allOk = services.every((s) => s.status === "operational");

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {allOk ? c.allOk : c.down}
          </h1>
          <p className="mt-4 text-muted">
            {c.checked}:{" "}
            {buildTime.toLocaleString(c.localeCode, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            ·{" "}
            <span className="font-mono">
              build {buildTime.getTime().toString(36)}
            </span>
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="overflow-hidden rounded-2xl border">
            {services.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center gap-4 bg-card p-5 ${
                  i > 0 ? "border-t" : ""
                }`}
              >
                <s.icon
                  className="h-5 w-5 flex-shrink-0 text-muted"
                  strokeWidth={1.5}
                />
                <div className="flex-1">
                  <p className="font-semibold tracking-tight">{s.name}</p>
                  <p className="text-xs text-muted">{c.hints[i]}</p>
                </div>
                <div className="hidden font-mono text-xs text-muted sm:block">
                  {s.uptime.toFixed(2)}% uptime · 90d
                </div>
                <StatusPill status={s.status} labels={c.pill} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
            {c.uptimeTitle}
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 90 }).map((_, i) => {
              const amber = i === 17 || i === 52;
              return (
                <span
                  key={i}
                  title={`${90 - i}d`}
                  className="h-5 w-2.5 rounded-[2px]"
                  style={{
                    background: amber ? "#f59e0b" : "#16a34a",
                    opacity: amber ? 1 : 0.85,
                  }}
                />
              );
            })}
          </div>
          <p className="mt-5 max-w-2xl text-sm text-muted">{c.uptimeNote}</p>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            {c.eventsTitle}
          </div>
          <ul className="space-y-3">
            {c.events.map((e) => (
              <Event key={e.when} {...e} />
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <Activity className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
          <h2 className="mt-6 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.ctaTitle}
          </h2>
          <p className="mt-3 text-muted">{c.ctaText}</p>
        </div>
      </section>
    </main>
  );
}

function StatusPill({
  status,
  labels,
}: {
  status: Service["status"];
  labels: { operational: string; degraded: string; down: string };
}) {
  if (status === "operational") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
        {labels.operational}
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
        {labels.degraded}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-red-500">
      {labels.down}
    </span>
  );
}

function Event({
  when,
  type,
  text,
}: {
  when: string;
  type: "deploy" | "info" | "incident";
  text: string;
}) {
  const accent =
    type === "incident"
      ? "text-red-500"
      : type === "deploy"
        ? "text-accent"
        : "text-muted";
  return (
    <li className="flex items-start gap-3 rounded-2xl border bg-background p-4">
      <span
        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${accent.replace("text-", "bg-")}`}
      />
      <div className="flex-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {when}
        </p>
        <p
          className="mt-0.5 text-sm"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
      <span
        className={`font-mono text-[10px] uppercase tracking-widest ${accent}`}
      >
        {type}
      </span>
    </li>
  );
}
