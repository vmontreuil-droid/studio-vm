"use client";

import { useActionState, useRef } from "react";
import { Upload, Check, Loader2 } from "lucide-react";
import { importBankCsvAction } from "@/app/actions/accounting";

export function BankImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    importBankCsvAction,
    null,
  );

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl bg-card shadow-sm p-5"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors hover:border-accent hover:bg-card-hover"
      >
        {pending ? (
          <>
            <Loader2
              className="h-7 w-7 animate-spin text-accent"
              strokeWidth={2}
            />
            <p className="text-sm font-medium">Bezig met importeren…</p>
          </>
        ) : (
          <>
            <Upload className="h-7 w-7 text-muted" strokeWidth={2} />
            <p className="text-sm font-medium">
              CSV-export van je bank (élke Belgische bank)
            </p>
            <p className="text-xs text-muted">
              Datum, bedrag en mededeling worden herkend; facturen met
              gestructureerde mededeling worden automatisch afgepunt.
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={() => formRef.current?.requestSubmit()}
      />
      {state?.ok && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {state.imported} transactie(s) verwerkt · {state.matched} factuur/
          facturen automatisch afgepunt
        </p>
      )}
      {state && !state.ok && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
