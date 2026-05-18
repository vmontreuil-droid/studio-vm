"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Lock,
  Check,
  AlertCircle,
  Mail,
  ArrowLeft,
  Gauge,
  TrendingUp,
  FileText,
  FolderOpen,
  Globe,
  LifeBuoy,
} from "lucide-react";
import { sendMagicLink, type AuthState } from "@/app/actions/portail";
import { localePath, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    email: string;
    placeholder: string;
    button: string;
    sending: string;
    note: string;
    back: string;
    panelEyebrow: string;
    panelTitle: string;
    features: { t: string; d: string }[];
  }
> = {
  nl: {
    eyebrow: "Klantportaal",
    title: "Inloggen",
    intro:
      "Geen wachtwoord nodig — je krijgt een veilige login-link in je inbox.",
    email: "E-mail",
    placeholder: "jij@bedrijf.be",
    button: "Stuur login-link",
    sending: "Versturen…",
    note: "Enkel klanten met een actief project hebben toegang. Vraag het me als je twijfelt.",
    back: "Terug naar de website",
    panelEyebrow: "Jouw portaal",
    panelTitle: "Alles van jouw project, op één plek.",
    features: [
      { t: "Site-analyse", d: "Score, valkuilen en het volledige rapport." },
      { t: "Projectvoortgang", d: "Zie exact waar je project staat." },
      { t: "Offertes & facturen", d: "Bekijk, aanvaard en betaal op één plek." },
      { t: "Documenten", d: "Contracten, ontwerpen en bestanden bij elkaar." },
      { t: "Je website & domein", d: "Live status, hosting en DNS, beheerd door mij." },
      { t: "Support", d: "Open een ticket en volg de opvolging." },
    ],
  },
  fr: {
    eyebrow: "Espace client",
    title: "Connexion",
    intro:
      "Pas de mot de passe — vous recevez un lien de connexion sécurisé dans votre boîte.",
    email: "E-mail",
    placeholder: "vous@entreprise.be",
    button: "Envoyer le lien",
    sending: "Envoi…",
    note: "Seuls les clients avec un projet actif ont accès. Demandez-moi en cas de doute.",
    back: "Retour au site",
    panelEyebrow: "Votre portail",
    panelTitle: "Tout votre projet, au même endroit.",
    features: [
      { t: "Analyse de site", d: "Score, pièges et le rapport complet." },
      { t: "Avancement", d: "Voyez précisément où en est votre projet." },
      { t: "Devis & factures", d: "Consultez, acceptez et payez au même endroit." },
      { t: "Documents", d: "Contrats, maquettes et fichiers réunis." },
      { t: "Site & domaine", d: "Statut, hébergement et DNS, gérés par moi." },
      { t: "Support", d: "Ouvrez un ticket et suivez le suivi." },
    ],
  },
  en: {
    eyebrow: "Client portal",
    title: "Sign in",
    intro: "No password needed — you get a secure login link in your inbox.",
    email: "Email",
    placeholder: "you@company.com",
    button: "Send login link",
    sending: "Sending…",
    note: "Only clients with an active project have access. Ask me if unsure.",
    back: "Back to the website",
    panelEyebrow: "Your portal",
    panelTitle: "Everything about your project, in one place.",
    features: [
      { t: "Site analysis", d: "Score, pitfalls and the full report." },
      { t: "Project progress", d: "See exactly where your project stands." },
      { t: "Quotes & invoices", d: "Review, accept and pay in one place." },
      { t: "Documents", d: "Contracts, designs and files together." },
      { t: "Site & domain", d: "Live status, hosting and DNS, managed by me." },
      { t: "Support", d: "Open a ticket and follow up." },
    ],
  },
};

const ICONS = [Gauge, TrendingUp, FileText, FolderOpen, Globe, LifeBuoy];
const initial: AuthState = { ok: false, message: "" };

export function PortailLogin({
  locale,
  next,
}: {
  locale: Locale;
  next?: string;
}) {
  const t = T[locale];
  const [state, setState] = useState<AuthState>(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex min-h-dvh">
      {/* Linkerpaneel — wat het portaal kan */}
      <div className="hidden w-1/2 flex-col justify-between border-r bg-card p-12 lg:flex">
        <p className="text-4xl font-extrabold lowercase tracking-tighter sm:text-5xl">
          vm<span className="text-accent">.</span>
          <span className="ml-3 align-middle font-mono text-xs font-normal uppercase tracking-widest text-muted">
            {t.panelEyebrow}
          </span>
        </p>
        <div className="max-w-md">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            {t.panelTitle}
          </h2>
          <ul className="mt-8 space-y-5">
            {t.features.map((f, i) => {
              const Icon = ICONS[i] ?? Gauge;
              return (
                <li key={f.t} className="flex gap-4">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    strokeWidth={1.75}
                  />
                  <div>
                    <p className="font-medium tracking-tight">{f.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{f.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="font-mono text-[11px] text-muted">
          © {new Date().getFullYear()} Studio VM
        </p>
      </div>

      {/* Rechterpaneel — login */}
      <div className="flex w-full flex-col px-6 py-10 lg:w-1/2">
        <Link
          href={localePath(locale, "/")}
          className="inline-flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {t.back}
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 text-muted">{t.intro}</p>

            <form
              action={(fd) =>
                start(async () => setState(await sendMagicLink(fd)))
              }
              className="mt-8 space-y-4 rounded-2xl border bg-card p-6"
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />
              <input type="hidden" name="locale" value={locale} />
              {next ? (
                <input type="hidden" name="next" value={next} />
              ) : null}
              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-xs uppercase tracking-widest text-muted"
                >
                  {t.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t.placeholder}
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <Mail className="h-4 w-4 animate-pulse" strokeWidth={2} />
                ) : (
                  <Lock className="h-4 w-4" strokeWidth={2} />
                )}
                {pending ? t.sending : t.button}
              </button>
              {state.message && (
                <p
                  className={`flex items-center gap-2 text-sm ${
                    state.ok ? "text-accent" : "text-red-500"
                  }`}
                >
                  {state.ok ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  )}
                  {state.message}
                </p>
              )}
            </form>
            <p className="mt-6 text-xs text-muted">{t.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
