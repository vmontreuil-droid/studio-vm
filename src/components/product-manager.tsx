"use client";

import { useActionState, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Package, Wrench } from "lucide-react";
import {
  saveProductAction,
  deleteProduct,
  toggleProduct,
} from "@/app/actions/accounting";
import { SubmitButton } from "@/components/submit-button";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  unit_price_cents: number;
  vat_rate: number;
  kind: "dienst" | "product";
  active: boolean;
  sort: number;
};

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Editor({
  product,
  onDone,
}: {
  product?: Product;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveProductAction, null);
  if (state?.ok) onDone();

  return (
    <form
      action={action}
      className="rounded-2xl bg-card shadow-sm p-5"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Naam</span>
          <input
            name="name"
            defaultValue={product?.name ?? ""}
            required
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Omschrijving</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={product?.description ?? ""}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">
            Eenheidsprijs (€, excl. btw)
          </span>
          <input
            name="unit_price"
            inputMode="decimal"
            defaultValue={
              product ? (product.unit_price_cents / 100).toFixed(2) : ""
            }
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
            defaultValue={product?.vat_rate ?? 21}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Type</span>
          <select
            name="kind"
            defaultValue={product?.kind ?? "dienst"}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="dienst">Dienst</option>
            <option value="product">Product</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Volgorde</span>
          <input
            name="sort"
            type="number"
            defaultValue={product?.sort ?? 0}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product ? product.active : true}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Actief (zichtbaar bij offerte/factuur opstellen)
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

export function ProductManager({ products }: { products: Product[] }) {
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
          Nieuw product / dienst
        </button>
      )}

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {products.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Nog geen producten of diensten.
            </li>
          )}
          {products.map((p) =>
            editing === p.id ? (
              <li key={p.id} className="p-3">
                <Editor product={p} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      p.kind === "product"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {p.kind === "product" ? (
                      <Package className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Wrench className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {p.name}
                      {!p.active && (
                        <span className="ml-2 rounded bg-card-hover px-1.5 py-0.5 text-[10px] uppercase text-muted">
                          inactief
                        </span>
                      )}
                    </span>
                    {p.description && (
                      <span className="block truncate text-xs text-muted">
                        {p.description}
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4">
                  <span className="whitespace-nowrap font-mono text-xs text-muted">
                    {eur(p.unit_price_cents)} · {p.vat_rate}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(p.id)}
                    aria-label="Bewerken"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      aria-label={p.active ? "Deactiveren" : "Activeren"}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
                    >
                      {p.active ? (
                        <X className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Check className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </form>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
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
