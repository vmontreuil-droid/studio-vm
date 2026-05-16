"use client";

import { useState, useTransition } from "react";
import { Lock, Check, AlertCircle, Mail } from "lucide-react";
import { sendMagicLink, type AuthState } from "@/app/actions/portail";
import type { Locale } from "@/lib/i18n/config";

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
  },
  en: {
    eyebrow: "Client portal",
    title: "Sign in",
    intro:
      "No password needed — you get a secure login link in your inbox.",
    email: "Email",
    placeholder: "you@company.com",
    button: "Send login link",
    sending: "Sending…",
    note: "Only clients with an active project have access. Ask me if unsure.",
  },
};

const initial: AuthState = { ok: false, message: "" };

export function PortailLogin({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [state, setState] = useState<AuthState>(initial);
  const [pending, start] = useTransition();

  return (
    <section className="border-b">
      <div className="mx-auto flex max-w-md flex-col px-6 py-24 sm:py-32">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
          {t.eyebrow}
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {t.title}
        </h1>
        <p className="mt-4 text-muted">{t.intro}</p>

        <form
          action={(fd) => start(async () => setState(await sendMagicLink(fd)))}
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
    </section>
  );
}
