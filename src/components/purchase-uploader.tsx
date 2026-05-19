"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Upload, ScanLine, Check, Loader2, FileText } from "lucide-react";
import {
  scanPurchase,
  createPurchaseInvoiceAction,
} from "@/app/actions/accounting";
import { SubmitButton } from "@/components/submit-button";

type Prefill = {
  supplier_name: string;
  number: string;
  invoice_date: string;
  due_date: string;
  net: string;
  vat: string;
  total: string;
  vat_rate: string;
};

const empty: Prefill = {
  supplier_name: "",
  number: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  net: "",
  vat: "",
  total: "",
  vat_rate: "21",
};

const e = (cents: number | null) =>
  cents == null ? "" : (cents / 100).toFixed(2);

export function PurchaseUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, startScan] = useTransition();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocr, setOcr] = useState<"none" | "applied" | "manual">("none");
  const [pf, setPf] = useState<Prefill>(empty);
  const [err, setErr] = useState<string | null>(null);
  const [state, action] = useActionState(createPurchaseInvoiceAction, null);

  function pick(file: File) {
    setErr(null);
    setFileName(file.name);
    const body = new FormData();
    body.set("file", file);
    startScan(async () => {
      const r = await scanPurchase(body);
      if (!r.ok || !r.fileUrl) {
        setErr(r.error ?? "Upload mislukt");
        return;
      }
      setFileUrl(r.fileUrl);
      setOcr(r.ocrApplied ? "applied" : "manual");
      const f = r.fields;
      setPf({
        supplier_name: f?.supplierName ?? "",
        number: f?.number ?? "",
        invoice_date:
          f?.invoiceDate ?? new Date().toISOString().slice(0, 10),
        due_date: f?.dueDate ?? "",
        net: e(f?.net ?? null),
        vat: e(f?.vat ?? null),
        total: e(f?.total ?? null),
        vat_rate: f?.vatRate != null ? String(f.vatRate) : "21",
      });
    });
  }

  if (state?.ok) {
    // Klaar — reset voor de volgende bon.
    if (fileUrl) {
      setFileUrl(null);
      setFileName(null);
      setOcr("none");
      setPf(empty);
    }
  }

  const upd = (k: keyof Prefill) => (v: string) =>
    setPf((p) => ({ ...p, [k]: v }));

  return (
    <div className="rounded-2xl border bg-card p-5">
      {!fileUrl ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(ev) =>
              (ev.key === "Enter" || ev.key === " ") &&
              inputRef.current?.click()
            }
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors hover:border-accent hover:bg-card-hover"
          >
            {scanning ? (
              <>
                <Loader2
                  className="h-7 w-7 animate-spin text-accent"
                  strokeWidth={2}
                />
                <p className="text-sm font-medium">
                  Bezig met inlezen{fileName ? ` — ${fileName}` : ""}…
                </p>
              </>
            ) : (
              <>
                <Upload className="h-7 w-7 text-muted" strokeWidth={2} />
                <p className="text-sm font-medium">
                  Sleep of klik — bon of aankoopfactuur (PDF/JPG/PNG)
                </p>
                <p className="text-xs text-muted">
                  Wordt automatisch uitgelezen; je controleert daarna.
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) pick(f);
            }}
          />
          {err && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {err}
            </p>
          )}
        </>
      ) : (
        <form action={action}>
          <input type="hidden" name="file_url" value={fileUrl} />
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card-hover px-2.5 py-1 text-muted">
              <FileText className="h-3.5 w-3.5" strokeWidth={2} />
              {fileName}
            </span>
            {ocr === "applied" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 font-medium text-green-600 dark:text-green-400">
                <ScanLine className="h-3.5 w-3.5" strokeWidth={2} />
                OCR ingevuld — controleer aub
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400">
                OCR uit — vul handmatig in
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Inp label="Leverancier" name="supplier_name" value={pf.supplier_name} on={upd("supplier_name")} />
            <Inp label="Factuurnummer" name="number" value={pf.number} on={upd("number")} />
            <Inp label="Factuurdatum" name="invoice_date" type="date" value={pf.invoice_date} on={upd("invoice_date")} />
            <Inp label="Vervaldatum" name="due_date" type="date" value={pf.due_date} on={upd("due_date")} />
            <Inp label="Bedrag excl. btw (€)" name="net" value={pf.net} on={upd("net")} placeholder="0.00" />
            <Inp label="Btw (€)" name="vat" value={pf.vat} on={upd("vat")} placeholder="0.00" />
            <Inp label="Totaal incl. (€)" name="total" value={pf.total} on={upd("total")} placeholder="0.00" />
            <Inp label="Btw-tarief (%)" name="vat_rate" value={pf.vat_rate} on={upd("vat_rate")} />
            <Inp label="Categorie" name="category" value="" on={() => {}} placeholder="bv. software, hosting, kantoor" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SubmitButton
              pendingLabel="Bewaren…"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Aankoopfactuur bewaren
            </SubmitButton>
            <button
              type="button"
              onClick={() => {
                setFileUrl(null);
                setFileName(null);
                setOcr("none");
                setPf(empty);
              }}
              className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              Andere bon
            </button>
            {state && !state.ok && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {state.error}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Inp({
  label,
  name,
  value,
  on,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  on: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        onChange={(e2) => on(e2.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
