"use client";

import { useState, useTransition } from "react";
import { Send, Check, AlertCircle } from "lucide-react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";

const initial: NewsletterState = { ok: false, message: "" };

export function NewsletterForm() {
  const [state, setState] = useState<NewsletterState>(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await subscribe(formData);
          setState(result);
        });
      }}
      className="space-y-2"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Newsletter
      </p>
      <p className="text-sm text-muted">
        Eens per maand een korte mail over wat ik bouwde en leerde.
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
        <input
          type="email"
          name="email"
          required
          placeholder="jij@bedrijf.be"
          autoComplete="email"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Inschrijven"
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
          {state.message}
        </p>
      )}
    </form>
  );
}
