"use client";

import { useActionState, useState } from "react";
import { Plus, Check } from "lucide-react";
import { createCreditNoteAction } from "@/app/actions/accounting";
import { SubmitButton } from "@/components/submit-button";

export function CreditNoteForm({
  invoices,
}: {
  invoices: { id: string; number: string; client_email: string }[];
}) {
  const [state, action] = useActionState(createCreditNoteAction, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nieuwe creditnota
      </button>
    );
  }

  return (
    <form action={action} className="rounded-2xl bg-card shadow-sm p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-accent">
        Nieuwe creditnota
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">
            Gekoppelde factuur (optioneel)
          </span>
          <select
            name="invoice_id"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            onChange={(e) => {
              const opt = e.target.selectedOptions[0];
              const email = opt?.dataset.email;
              if (email) {
                const f = e.target.form?.elements.namedItem(
                  "client_email",
                ) as HTMLInputElement | null;
                if (f && !f.value) f.value = email;
              }
            }}
          >
            <option value="">— geen —</option>
            {invoices.map((i) => (
              <option key={i.id} value={i.id} data-email={i.client_email}>
                {i.number} · {i.client_email}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Klant-e-mail</span>
          <input
            name="client_email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">
            Bedrag (€, excl. btw)
          </span>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Btw-tarief (%)</span>
          <input
            name="vat_rate"
            type="number"
            step="any"
            defaultValue={21}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Reden</span>
          <textarea
            name="reason"
            rows={2}
            placeholder="bv. Gedeeltelijke terugbetaling — module geannuleerd"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SubmitButton
          pendingLabel="Aanmaken…"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Creditnota aanmaken
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
        >
          Annuleren
        </button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Aangemaakt
          </span>
        )}
        {state && !state.ok && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
