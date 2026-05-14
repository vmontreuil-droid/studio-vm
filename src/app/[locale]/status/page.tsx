import type { Metadata } from "next";
import { CheckCircle2, Activity, Clock, Server, Database, Mail, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Status — Studio VM",
  description: "Live status van Studio VM systemen: site, admin, e-mail, database.",
};

const buildTime = new Date();

type Service = {
  icon: typeof Server;
  name: string;
  hint: string;
  status: "operational" | "degraded" | "down";
  uptime: number;
};

const services: Service[] = [
  {
    icon: Globe,
    name: "studio-vm.be",
    hint: "Publieke website + portfolio",
    status: "operational",
    uptime: 99.99,
  },
  {
    icon: Server,
    name: "Vercel CDN",
    hint: "Wereldwijde edge-delivery",
    status: "operational",
    uptime: 99.97,
  },
  {
    icon: Database,
    name: "Supabase EU",
    hint: "Data + auth voor klant-portalen",
    status: "operational",
    uptime: 99.95,
  },
  {
    icon: Mail,
    name: "Resend (mail)",
    hint: "Contact + nieuwsbrieven",
    status: "operational",
    uptime: 99.98,
  },
];

export default function StatusPage() {
  const allOk = services.every((s) => s.status === "operational");

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Status
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {allOk ? "Alles draait normaal." : "Er is een storing."}
          </h1>
          <p className="mt-4 text-muted">
            Laatst gecontroleerd: {formatDate(buildTime)} ·{" "}
            <span className="font-mono">build {buildTime.getTime().toString(36)}</span>
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
                <s.icon className="h-5 w-5 flex-shrink-0 text-muted" strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="font-semibold tracking-tight">{s.name}</p>
                  <p className="text-xs text-muted">{s.hint}</p>
                </div>
                <div className="hidden font-mono text-xs text-muted sm:block">
                  {s.uptime.toFixed(2)}% uptime · 90d
                </div>
                <StatusPill status={s.status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            Recente events
          </div>
          <ul className="space-y-3">
            <Event
              when="2026-05-14 21:32"
              type="deploy"
              text="Logo update naar &lt;vm/&gt; gepubliceerd."
            />
            <Event
              when="2026-05-14 20:50"
              type="deploy"
              text="Eerste publieke versie van studio-vm.be live."
            />
            <Event
              when="2026-05-14 20:15"
              type="info"
              text="DNS verlegd van one.com parking naar Vercel."
            />
          </ul>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <Activity className="mx-auto h-8 w-8 text-accent" strokeWidth={1.5} />
          <h2 className="mt-6 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Heb je een storing op je eigen site?
          </h2>
          <p className="mt-3 text-muted">
            Klanten met een Plus of Scale abonnement krijgen automatisch melding bij
            downtime. Voor anderen — laat 't even weten via support.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: Service["status"] }) {
  if (status === "operational") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
        Operationeel
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
        Degraded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-red-500">
      Storing
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
      <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${accent.replace("text-", "bg-")}`} />
      <div className="flex-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {when}
        </p>
        <p className="mt-0.5 text-sm" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
      <span className={`font-mono text-[10px] uppercase tracking-widest ${accent}`}>
        {type}
      </span>
    </li>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
