"use client";

import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { Send, Check, AlertCircle } from "lucide-react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";

const initial: NewsletterState = { ok: false, message: "" };

type Tekst = { kop: string; uitleg: string; email: string; knop: string; ok: string; fout: string };
const T: Record<string, Tekst> = {
  nl: { kop: "Nieuwsbrief", uitleg: "Af en toe een korte mail met praktische tips over 3D-modellen en machinesturing.", email: "u@bedrijf.be", knop: "Inschrijven", ok: "Bedankt — u bent ingeschreven.", fout: "Dat e-mailadres lijkt niet te kloppen." },
  fr: { kop: "Newsletter", uitleg: "De temps en temps, un court e-mail avec des conseils pratiques sur les modèles 3D et le guidage d'engins.", email: "vous@entreprise.fr", knop: "S'inscrire", ok: "Merci — vous êtes inscrit.", fout: "Cette adresse e-mail ne semble pas correcte." },
  en: { kop: "Newsletter", uitleg: "Now and then a short email with practical tips on 3D models and machine control.", email: "you@company.com", knop: "Subscribe", ok: "Thanks — you're subscribed.", fout: "That email address doesn't look right." },
  de: { kop: "Newsletter", uitleg: "Ab und zu eine kurze E-Mail mit praktischen Tipps zu 3D-Modellen und Maschinensteuerung.", email: "sie@firma.de", knop: "Anmelden", ok: "Danke — Sie sind angemeldet.", fout: "Diese E-Mail-Adresse scheint nicht korrekt zu sein." },
  es: { kop: "Boletín", uitleg: "De vez en cuando, un breve correo con consejos prácticos sobre modelos 3D y control de maquinaria.", email: "usted@empresa.es", knop: "Suscribirse", ok: "Gracias — se ha suscrito.", fout: "Esa dirección de correo no parece correcta." },
};

export function NewsletterForm({
  locale = "nl",
  source = "footer",
}: {
  locale?: string;
  source?: string;
}) {
  const t = T[locale] ?? T.en;
  const [state, setState] = useState<NewsletterState>(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await subscribe(formData);
          setState(result);
          if (result.ok) track("newsletter_signup");
        });
      }}
      className="space-y-2"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {t.kop}
      </p>
      <p className="text-sm text-muted">
        {t.uitleg}
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="source" value={source} />
        <input
          type="email"
          name="email"
          required
          placeholder={t.email}
          autoComplete="email"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={t.knop}
          className="inline-flex items-center justify-center rounded-full bg-foreground px-3 text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      {state.message && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            state.ok ? "text-accent" : "text-red-500"
          }`}
        >
          {state.ok ? (
            <Check className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
          )}
          {state.ok ? t.ok : t.fout}
        </p>
      )}
    </form>
  );
}
