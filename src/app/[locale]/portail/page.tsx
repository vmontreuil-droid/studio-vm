import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Lock, FileText, Activity, MessageSquare } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  intro: string;
  email: string;
  emailPh: string;
  password: string;
  login: string;
  forgot: string;
  reset: string;
  demoNote: string;
  previewLabel: string;
  welcome: string;
  stats: { orders: string; revenue: string; customers: string };
  invoicePaid: string;
  ticketStatus: string;
  ticketLabel: string;
  featuresEyebrow: string;
  featuresTitle: string;
  features: { title: string; desc: string }[];
  ctaSupport: string;
};

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Klantportaal — Studio VM",
    eyebrow: "Klantportaal",
    title: "Inloggen",
    intro: "Bekijk je projecten, facturen, en open een support-ticket.",
    email: "E-mail",
    emailPh: "jij@bedrijf.be",
    password: "Wachtwoord",
    login: "Inloggen",
    forgot: "Wachtwoord vergeten?",
    reset: "Reset",
    demoNote:
      "Demo-portaal. Login is nog niet actief — klanten van een echte build krijgen toegang via Supabase Auth.",
    previewLabel: "Een voorsmaakje van wat erachter zit",
    welcome: "Welkom terug, Sophie",
    stats: { orders: "Bestellingen", revenue: "Omzet", customers: "Klanten" },
    invoicePaid: "Betaald",
    ticketStatus: "In behandeling",
    ticketLabel: "Ticket #42 — Productfoto's",
    featuresEyebrow: "Wat je krijgt",
    featuresTitle: "Klantportaal — alles in één plek",
    features: [
      { title: "Facturen + voorstellen", desc: "Alle papierwerk op één plek, downloadbaar als PDF." },
      { title: "Live status van je site", desc: "Uptime, performance, laatste deploy — alles in real time." },
      { title: "Support tickets", desc: "Open een ticket, volg de status, krijg meldingen per e-mail." },
    ],
    ctaSupport: "Bekijk support tickets demo",
  },
  fr: {
    metaTitle: "Espace client — Studio VM",
    eyebrow: "Espace client",
    title: "Connexion",
    intro: "Consultez vos projets, factures, et ouvrez un ticket support.",
    email: "E-mail",
    emailPh: "vous@entreprise.be",
    password: "Mot de passe",
    login: "Se connecter",
    forgot: "Mot de passe oublié ?",
    reset: "Réinitialiser",
    demoNote:
      "Espace démo. La connexion n'est pas encore active — les clients d'un vrai projet y accèdent via Supabase Auth.",
    previewLabel: "Un avant-goût de ce qu'il y a derrière",
    welcome: "Bon retour, Sophie",
    stats: { orders: "Commandes", revenue: "CA", customers: "Clients" },
    invoicePaid: "Payée",
    ticketStatus: "En cours",
    ticketLabel: "Ticket #42 — Photos produits",
    featuresEyebrow: "Ce que vous obtenez",
    featuresTitle: "Espace client — tout au même endroit",
    features: [
      { title: "Factures + propositions", desc: "Toute la paperasse au même endroit, téléchargeable en PDF." },
      { title: "Statut en direct de votre site", desc: "Uptime, performance, dernier déploiement — tout en temps réel." },
      { title: "Tickets support", desc: "Ouvrez un ticket, suivez le statut, recevez des notifications par e-mail." },
    ],
    ctaSupport: "Voir la démo tickets support",
  },
  en: {
    metaTitle: "Client portal — Studio VM",
    eyebrow: "Client portal",
    title: "Sign in",
    intro: "View your projects, invoices, and open a support ticket.",
    email: "Email",
    emailPh: "you@company.com",
    password: "Password",
    login: "Sign in",
    forgot: "Forgot password?",
    reset: "Reset",
    demoNote:
      "Demo portal. Login isn't active yet — clients of a real build get access via Supabase Auth.",
    previewLabel: "A taste of what's behind it",
    welcome: "Welcome back, Sophie",
    stats: { orders: "Orders", revenue: "Revenue", customers: "Customers" },
    invoicePaid: "Paid",
    ticketStatus: "In progress",
    ticketLabel: "Ticket #42 — Product photos",
    featuresEyebrow: "What you get",
    featuresTitle: "Client portal — everything in one place",
    features: [
      { title: "Invoices + proposals", desc: "All paperwork in one place, downloadable as PDF." },
      { title: "Live status of your site", desc: "Uptime, performance, last deploy — all in real time." },
      { title: "Support tickets", desc: "Open a ticket, track the status, get email notifications." },
    ],
    ctaSupport: "View support tickets demo",
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

export default async function PortailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const featureIcons = [FileText, Activity, MessageSquare];

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {c.title}
            </h1>
            <p className="mt-4 max-w-md text-muted">{c.intro}</p>

            <form className="mt-8 max-w-md space-y-4 rounded-2xl border bg-card p-6">
              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-xs uppercase tracking-widest text-muted"
                >
                  {c.email}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={c.emailPh}
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block font-mono text-xs uppercase tracking-widest text-muted"
                >
                  {c.password}
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
                {c.login}
              </button>
              <p className="text-center font-mono text-xs text-muted">
                {c.forgot}{" "}
                <span className="text-accent">{c.reset}</span>
              </p>
            </form>

            <div className="mt-6 max-w-md rounded-2xl border border-dashed bg-card/50 p-4 text-xs text-muted">
              {c.demoNote}
            </div>
          </div>

          <div className="hidden flex-col gap-4 lg:flex">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {c.previewLabel}
            </p>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-2 font-mono text-xs text-muted">
                  portail.studio-vm.be
                </span>
              </div>
              <div className="p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {c.welcome}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                  Boutique Sophie
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Stat label={c.stats.orders} value="142" trend="+12%" />
                  <Stat label={c.stats.revenue} value="€8 420" trend="+8%" />
                  <Stat label={c.stats.customers} value="89" trend="+5%" />
                </div>
                <div className="mt-6 space-y-2">
                  <Item label="Factuur 2026-04" value="€149,00" status={c.invoicePaid} />
                  <Item label="Factuur 2026-03" value="€149,00" status={c.invoicePaid} />
                  <Item label={c.ticketLabel} value="—" status={c.ticketStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.featuresEyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {c.featuresTitle}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {c.features.map((item, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border bg-background p-6"
                >
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <Link
              href={localePath(locale, "/support")}
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
            >
              {c.ctaSupport}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
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
