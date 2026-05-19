"use client";

import { useActionState } from "react";
import { Search, Mail, Copy, AlertCircle } from "lucide-react";
import { findEmailsAction } from "@/app/actions/email-finder";
import { SubmitButton } from "@/components/submit-button";

export function EmailFinderForm() {
  const [state, action] = useActionState(findEmailsAction, null);

  return (
    <div className="mt-6 space-y-4">
      <form action={action} className="rounded-2xl bg-card p-5 shadow-sm">
        <label className="block text-xs font-medium text-muted">
          Website (één per keer)
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            name="url"
            required
            placeholder="bv. carpentiernv.be"
            className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <SubmitButton
            pendingLabel="Zoeken…"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
            Zoek contactadres
          </SubmitButton>
        </div>
      </form>

      {state && !state.ok && (
        <div className="rounded-2xl bg-card p-4 text-sm text-red-600 shadow-sm dark:text-red-400">
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            {state.error}
          </span>
        </div>
      )}

      {state?.ok && (
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {state.site} — {state.pagesTried} pagina&apos;s bekeken
          </p>
          {state.emails && state.emails.length > 0 ? (
            <ul className="mt-3 divide-y divide-border">
              {state.emails.map((e) => (
                <li
                  key={e.address}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 text-accent" strokeWidth={2} />
                    <span className="truncate font-medium">{e.address}</span>
                    <span className="font-mono text-[10px] text-muted">
                      gevonden op {e.source}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <a
                      href={`mailto:${e.address}`}
                      className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-card-hover"
                    >
                      Mail
                    </a>
                    <CopyBtn value={e.address} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Geen publiek e-mailadres gevonden op de homepage of de gangbare
              contactpagina&apos;s. Soms staat het enkel achter een formulier.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CopyBtn({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      aria-label="Kopieer"
      className="rounded-full border p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
    >
      <Copy className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
