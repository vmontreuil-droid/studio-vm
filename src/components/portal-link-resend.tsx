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
    title: "Portaallink kwijt? Vraag ze opnieuw aan",
    intro:
      "Geef het e-mailadres in waarmee u bij Studio VM gekend bent. Hebt u een klantenportaal, dan stuur ik de link meteen opnieuw.",
    ph: "naam@bedrijf.be",
    submit: "Stuur mijn portaallink",
    sending: "Versturen…",
    done: "Als er een klantenportaal bestaat voor dit adres, is de link onderweg. Kijk ook even in uw spammap.",
    errEmail: "Vul een geldig e-mailadres in.",
  },
  fr: {
    title: "Lien du portail perdu ? Demandez-le à nouveau",
    intro:
      "Saisissez l'adresse e-mail sous laquelle vous êtes connu chez Studio VM. Si vous avez un portail client, je vous renvoie le lien aussitôt.",
    ph: "nom@entreprise.be",
    submit: "Envoyer mon lien de portail",
    sending: "Envoi…",
    done: "Si un portail client existe pour cette adresse, le lien est en route. Vérifiez aussi vos courriers indésirables.",
    errEmail: "Saisissez une adresse e-mail valide.",
  },
  en: {
    title: "Lost your portal link? Request it again",
    intro:
      "Enter the email address Studio VM knows you by. If you have a client portal, I will resend the link right away.",
    ph: "name@company.com",
    submit: "Send my portal link",
    sending: "Sending…",
    done: "If a client portal exists for this address, the link is on its way. Please check your spam folder too.",
    errEmail: "Enter a valid email address.",
  },
  de: {
    title: "Portal-Link verloren? Fordern Sie ihn erneut an",
    intro:
      "Geben Sie die E-Mail-Adresse ein, unter der Sie bei Studio VM bekannt sind. Wenn Sie ein Kundenportal haben, sende ich Ihnen den Link sofort erneut zu.",
    ph: "name@firma.de",
    submit: "Portal-Link senden",
    sending: "Wird gesendet…",
    done: "Falls für diese Adresse ein Kundenportal existiert, ist der Link unterwegs. Prüfen Sie bitte auch den Spam-Ordner.",
    errEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  },
  es: {
    title: "¿Ha perdido el enlace al portal? Solicítelo de nuevo",
    intro:
      "Introduzca la dirección de correo electrónico con la que Studio VM le conoce. Si tiene un portal de cliente, le reenviaré el enlace de inmediato.",
    ph: "nombre@empresa.es",
    submit: "Enviar mi enlace al portal",
    sending: "Enviando…",
    done: "Si existe un portal de cliente para esta dirección, el enlace está en camino. Revise también la carpeta de spam.",
    errEmail: "Introduzca una dirección de correo electrónico válida.",
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
