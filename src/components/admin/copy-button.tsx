"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({
  text,
  label = "Kopiëren",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // Fallback voor browsers zonder clipboard-permissie
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {}
          document.body.removeChild(ta);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover ${className}`}
    >
      {done ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Gekopieerd
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2} /> {label}
        </>
      )}
    </button>
  );
}
