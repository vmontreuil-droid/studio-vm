"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Trash2, Check, Truck } from "lucide-react";
import { saveSupplierAction, deleteSupplier } from "@/app/actions/accounting";
import { SubmitButton } from "@/components/submit-button";

export type Supplier = {
  id: string;
  name: string;
  vat_number: string | null;
  email: string | null;
  iban: string | null;
  notes: string | null;
};

function Editor({
  supplier,
  onDone,
}: {
  supplier?: Supplier;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveSupplierAction, null);
  if (state?.ok) onDone();
  return (
    <form action={action} className="rounded-2xl border bg-card p-5">
      {supplier && <input type="hidden" name="id" value={supplier.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-muted">Naam</span>
          <input
            name="name"
            defaultValue={supplier?.name ?? ""}
            required
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Btw-nummer</span>
          <input
            name="vat_number"
            defaultValue={supplier?.vat_number ?? ""}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ""}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">IBAN</span>
          <input
            name="iban"
            defaultValue={supplier?.iban ?? ""}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Notitie</span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={supplier?.notes ?? ""}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <SubmitButton
          pendingLabel="Bewaren…"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Bewaren
        </SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
        >
          Annuleren
        </button>
        {state && !state.ok && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

export function SupplierManager({ suppliers }: { suppliers: Supplier[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-6 space-y-3">
      {adding ? (
        <Editor onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Nieuwe leverancier
        </button>
      )}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <ul className="divide-y divide-border">
          {suppliers.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Nog geen leveranciers.
            </li>
          )}
          {suppliers.map((sp) =>
            editing === sp.id ? (
              <li key={sp.id} className="p-3">
                <Editor supplier={sp} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li
                key={sp.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <Truck className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {sp.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {[sp.vat_number, sp.email].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(sp.id)}
                    aria-label="Bewerken"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <form action={deleteSupplier}>
                    <input type="hidden" name="id" value={sp.id} />
                    <button
                      type="submit"
                      aria-label="Verwijderen"
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </form>
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
