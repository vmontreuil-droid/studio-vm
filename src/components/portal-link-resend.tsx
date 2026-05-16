"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Check } from "lucide-react";
import { resendPortalLink } from "@/app/actions/scan-lead";
import {
  isValidLocale,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const C: Record<
  Locale,
  {
    title: string;
    intro: string;
    ph: string;
    submit: string;
    sending: string;
    done: string;
    errEmail: string;
  }
> = {
  nl: {
    title: "Al een scan gedaan? Haal je portaal terug",
    intro:
      "Geef het e-mailadres in dat je bij de scan gebruikte. Heb je een klantenportaal, dan stuur ik de link er meteen opnieuw heen.",
    ph: "jouw@email.be",
    submit: "Stuur mijn portaallink",
    sending: "Versturen…",
    done: "Als er een scan op dit adres bestaat, is de portaallink onderweg. Kijk ook even in spam.",
    errEmail: "Vul een geldig e-mailadres in.",
  },
  fr: {
    title: "Déjà fait un scan ? Récupérez votre portail",
    intro:
      "Entrez l'adresse e-mail utilisée lors du scan. Si vous avez un portail client, je vous renvoie le lien aussitôt.",
    ph: "votre@email.be",
    submit: "Envoyer mon lien de portail",
    sending: "Envoi…",
    done: "Si un scan existe pour cette adresse, le lien du portail est en route. Vérifiez aussi les spams.",
    errEmail: "Saisissez une adresse e-mail valide.",
  },
  en: {
    title: "Already scanned? Get your portal back",
    intro:
      "Enter the email you used for the scan. If you have a client portal, I'll resend the link right away.",
    ph: "you@email.com",
    submit: "Send my portal link",
    sending: "Sending…",
    done: "If a scan exists for this address, the portal link is on its way. Check spam too.",
    errEmail: "Enter a valid email address.",
  },
};

export function PortalLinkResend({ locale: raw }: { locale: string }) {
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = C[locale];
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [state, setState] = useState<
    { s: "idle" } | { s: "done" } | { s: "error"; msg: string }
  >({ s: "idle" });

  const submit = () => {
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setState({ s: "error", msg: c.errEmail });
      return;
    }
    start(async () => {
      try {
        await resendPortalLink({ email: mail, locale });
        setState({ s: "done" });
      } catch {
        setState({ s: "done" });
      }
    });
  };

  if (state.s === "done") {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center">
        <Check className="mx-auto h-7 w-7 text-accent" strokeWidth={2} />
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {c.done}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <p className="text-lg font-semibold tracking-tight">{c.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{c.intro}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!pending) submit();
        }}
        className="mt-5 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={c.ph}
          className="w-full flex-1 rounded-full border bg-background px-5 py-3 text-sm outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Mail className="h-4 w-4" strokeWidth={2} />
          )}
          {pending ? c.sending : c.submit}
        </button>
      </form>
      {state.s === "error" && (
        <p className="mt-3 text-sm text-red-500">{state.msg}</p>
      )}
    </div>
  );
}
