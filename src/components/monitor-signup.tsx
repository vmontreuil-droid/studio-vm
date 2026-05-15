"use client";

import { useState, useTransition } from "react";
import { BellRing, Check, Loader2, X } from "lucide-react";
import { subscribeMonitor } from "@/app/actions/monitor";
import type { Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    title: string;
    lead: string;
    placeholder: string;
    button: string;
    sending: string;
    done: string;
    doneNote: string;
    err: string;
    privacy: string;
  }
> = {
  nl: {
    title: "Houd deze site in de gaten",
    lead: "Eén keer per week scan ik deze site automatisch opnieuw en mail ik je enkel als er iets verandert: score zakt, certificaat verloopt, nieuwe kritieke punten.",
    placeholder: "jij@bedrijf.be",
    button: "Volg deze site",
    sending: "Bezig…",
    done: "Check je mailbox",
    doneNote: "Bevestig via de link in je mail — dan staat de monitoring aan.",
    err: "Er ging iets mis. Probeer later opnieuw.",
    privacy:
      "Enkel voor deze monitoring. Eén klik om te stoppen, altijd. Geen nieuwsbrief.",
  },
  fr: {
    title: "Gardez ce site à l'œil",
    lead: "Une fois par semaine je rescanne ce site automatiquement et je ne vous écris que si quelque chose change : baisse de score, certificat expirant, nouveaux points critiques.",
    placeholder: "vous@entreprise.be",
    button: "Suivre ce site",
    sending: "En cours…",
    done: "Vérifiez votre boîte mail",
    doneNote: "Confirmez via le lien reçu — le suivi sera alors actif.",
    err: "Une erreur est survenue. Réessayez plus tard.",
    privacy:
      "Uniquement pour ce suivi. Un clic pour arrêter, toujours. Pas de newsletter.",
  },
  en: {
    title: "Keep an eye on this site",
    lead: "Once a week I automatically re-scan this site and only email you if something changes: score drop, expiring certificate, new critical issues.",
    placeholder: "you@company.com",
    button: "Monitor this site",
    sending: "Sending…",
    done: "Check your inbox",
    doneNote: "Confirm via the link in your email — monitoring then turns on.",
    err: "Something went wrong. Try again later.",
    privacy:
      "Only for this monitoring. One click to stop, always. No newsletter.",
  },
};

export function MonitorSignup({
  url,
  locale,
}: {
  url: string;
  locale: Locale;
}) {
  const t = T[locale];
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [pending, start] = useTransition();

  if (state === "done")
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Check className="h-5 w-5 text-accent" strokeWidth={2} />
          {t.done}
        </p>
        <p className="mt-2 text-sm text-muted">{t.doneNote}</p>
      </div>
    );

  return (
    <div className="no-print rounded-2xl border bg-card p-6">
      <p className="flex items-center gap-2 font-semibold">
        <BellRing className="h-5 w-5 text-accent" strokeWidth={2} />
        {t.title}
      </p>
      <p className="mt-2 text-sm text-muted">{t.lead}</p>
      <form
        action={(fd) =>
          start(async () => {
            const r = await subscribeMonitor(fd);
            setState(r.ok ? "done" : "error");
          })
        }
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input type="hidden" name="url" value={url} />
        <input type="hidden" name="locale" value={locale} />
        <input
          name="email"
          type="email"
          required
          placeholder={t.placeholder}
          className="flex-1 rounded-full border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <BellRing className="h-4 w-4" strokeWidth={2} />
          )}
          {pending ? t.sending : t.button}
        </button>
      </form>
      {state === "error" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-500">
          <X className="h-4 w-4" strokeWidth={2} />
          {t.err}
        </p>
      )}
      <p className="mt-3 font-mono text-[11px] text-muted">{t.privacy}</p>
    </div>
  );
}
