"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Mini-knopje dat tekst naar clipboard kopieert en kort feedback toont.
// Wordt overal in /admin/social hergebruikt: UTM-link, post-body, hashtags.
export function CopyButton({
  text,
  label = "Kopieer",
  variant = "ghost",
}: {
  text: string;
  label?: string;
  variant?: "ghost" | "solid";
}) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // Browser kan blokkeren — fallback via prompt
      window.prompt("Kopieer met Ctrl+C:", text);
    }
  };

  const base =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors";
  const cls =
    variant === "solid"
      ? `${base} bg-accent text-white hover:opacity-90`
      : `${base} bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground`;

  return (
    <button type="button" onClick={copy} className={cls} title={text}>
      {done ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.5} />
          ok
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={2.5} />
          {label}
        </>
      )}
    </button>
  );
}
