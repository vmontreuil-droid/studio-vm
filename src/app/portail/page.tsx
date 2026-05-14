import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Lock, FileText, Activity, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Klantportaal — Studio VM",
  description:
    "Login voor klanten van Studio VM. Bekijk je projecten, facturen en open een support ticket.",
};

export default function PortailPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <LoginPanel />
          <Preview />
        </div>
      </section>
      <Features />
    </main>
  );
}

function LoginPanel() {
  return (
    <div className="flex flex-col justify-center">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        Klantportaal
      </p>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        Inloggen
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Bekijk je projecten, facturen, en open een support-ticket.
      </p>

      <form className="mt-8 max-w-md space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <label
            htmlFor="email"
            className="block font-mono text-xs uppercase tracking-widest text-muted"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="jij@bedrijf.be"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block font-mono text-xs uppercase tracking-widest text-muted"
          >
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Lock className="h-4 w-4" strokeWidth={2} />
          Inloggen
        </button>
        <p className="text-center font-mono text-xs text-muted">
          Wachtwoord vergeten?{" "}
          <a href="#" className="text-accent hover:underline">
            Reset
          </a>
        </p>
      </form>

      <div className="mt-6 max-w-md rounded-2xl border border-dashed bg-card/50 p-4 text-xs text-muted">
        <strong className="font-semibold text-foreground">Demo-portaal.</strong> Login is
        nog niet actief — klanten van een echte build krijgen toegang via Supabase Auth.
      </div>
    </div>
  );
}

function Preview() {
  return (
    <div className="hidden flex-col gap-4 lg:flex">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Een voorsmaakje van wat erachter zit
      </p>
      <MockDashboard />
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-xs text-muted">portail.studio-vm.be</span>
      </div>
      <div className="p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Welkom terug, Sophie
        </p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight">Boutique Sophie</h3>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Bestellingen" value="142" trend="+12%" />
          <Stat label="Omzet" value="€8 420" trend="+8%" />
          <Stat label="Klanten" value="89" trend="+5%" />
        </div>

        <div className="mt-6 space-y-2">
          <Item label="Factuur 2026-04" value="€149,00" status="Betaald" />
          <Item label="Factuur 2026-03" value="€149,00" status="Betaald" />
          <Item label="Ticket #42 — Productfoto's" value="—" status="In behandeling" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] text-accent">{trend}</p>
    </div>
  );
}

function Item({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs">
      <span>{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-muted">{value}</span>
        <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[10px] text-muted">
          {status}
        </span>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: FileText,
      title: "Facturen + voorstellen",
      desc: "Alle papierwerk op één plek, downloadbaar als PDF.",
    },
    {
      icon: Activity,
      title: "Live status van je site",
      desc: "Uptime, performance, laatste deploy — alles in real time.",
    },
    {
      icon: MessageSquare,
      title: "Support tickets",
      desc: "Open een ticket, volg de status, krijg meldingen per e-mail.",
    },
  ];
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Wat je krijgt
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Klantportaal — alles in één plek
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-background p-6">
              <item.icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            Bekijk support tickets demo
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
