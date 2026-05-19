"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Search, Loader2, Check } from "lucide-react";

type Filter = {
  q?: string;
  postcode?: string;
  nace?: string;
  form?: string;
  active?: boolean;
};

type BatchResult = {
  scanned: number;
  withEmails: number;
  emailsTotal: number;
  hasMore: boolean;
  _debug?: unknown;
};

export function EmailBatchFinder({ filter }: { filter: Filter }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "single" | "auto">("idle");
  const [stopRequested, setStopRequested] = useState(false);
  const stopRef = useRef(false);
  const [totals, setTotals] = useState({
    scanned: 0,
    withEmails: 0,
    emailsTotal: 0,
    hasMore: true,
  });
  const [err, setErr] = useState<string | null>(null);
  const [debug, setDebug] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runOne(): Promise<BatchResult | null> {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/admin/email-batch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter, limit: 20 }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          if (j && typeof j === "object" && "error" in j)
            detail = String(j.error);
        } catch {}
        setErr(
          `Server gaf ${res.status} terug${detail ? ` — ${detail}` : ""}`,
        );
        return null;
      }
      const j = (await res.json()) as BatchResult;
      if (j._debug) setDebug(j._debug);
      return j;
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") {
        setErr("Gestopt.");
      } else {
        setErr("Netwerkfout: " + (e instanceof Error ? e.message : ""));
      }
      return null;
    } finally {
      abortRef.current = null;
    }
  }

  async function single() {
    setErr(null);
    setMode("single");
    const r = await runOne();
    if (r) {
      setTotals((t) => ({
        scanned: t.scanned + r.scanned,
        withEmails: t.withEmails + r.withEmails,
        emailsTotal: t.emailsTotal + r.emailsTotal,
        hasMore: r.hasMore,
      }));
    }
    setMode("idle");
    router.refresh();
  }

  async function auto() {
    setErr(null);
    setStopRequested(false);
    stopRef.current = false;
    setMode("auto");
    let safety = 0;
    while (!stopRef.current) {
      const r = await runOne();
      if (!r) break;
      setTotals((t) => ({
        scanned: t.scanned + r.scanned,
        withEmails: t.withEmails + r.withEmails,
        emailsTotal: t.emailsTotal + r.emailsTotal,
        hasMore: r.hasMore,
      }));
      router.refresh(); // verse data per batch → mail-pillen verschijnen live
      if (r.scanned === 0 || !r.hasMore) break;
      if (++safety > 2000) break; // veiligheidsstop (200 000 prospects)
    }
    setMode("idle");
  }

  function stop() {
    stopRef.current = true;
    setStopRequested(true);
    // Lopende fetch ook meteen afkappen.
    abortRef.current?.abort();
  }

  const running = mode !== "idle";

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Batch contact-zoeker
          </p>
          <p className="mt-1 text-sm text-muted">
            Loopt automatisch door alle prospects mét website in deze filter
            (20 per batch, 5 parallel). Gevonden mailadressen verschijnen
            in de kolom hieronder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <>
              <button
                type="button"
                onClick={single}
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
              >
                <Search className="h-4 w-4" strokeWidth={2} />
                Eén batch (20)
              </button>
              <button
                type="button"
                onClick={auto}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Play className="h-4 w-4" strokeWidth={2.5} />
                Auto-zoek alles
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <Square className="h-4 w-4" strokeWidth={2} />
              {stopRequested ? "Stoppen…" : "Stop"}
            </button>
          )}
        </div>
      </div>

      {(running || totals.scanned > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-background p-4 text-sm">
          {running && (
            <Loader2
              className="h-4 w-4 animate-spin text-accent"
              strokeWidth={2.5}
            />
          )}
          {!running && totals.scanned > 0 && (
            <Check
              className="h-4 w-4 text-green-600 dark:text-green-400"
              strokeWidth={2.5}
            />
          )}
          <span>
            <strong>{totals.scanned}</strong> gescand ·{" "}
            <strong className="text-green-700 dark:text-green-400">
              {totals.withEmails}
            </strong>{" "}
            met mail ({totals.emailsTotal} adres
            {totals.emailsTotal === 1 ? "" : "sen"} totaal) ·{" "}
            <span className="text-muted">
              {totals.hasMore ? "nog meer te gaan…" : "alles gescand ✓"}
            </span>
          </span>
        </div>
      )}
      {err && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</p>
      )}
      {debug ? (
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-card-hover p-3 text-[10px] leading-tight">
          {JSON.stringify(debug, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
