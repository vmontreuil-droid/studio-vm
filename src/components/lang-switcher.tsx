"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_NAMES,
  type Locale,
  isValidLocale,
} from "@/lib/i18n/config";

export function LangSwitcher({ current, compact = false }: { current: Locale; compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Uitklapmenu sluiten bij klik buiten of Escape.
  useEffect(() => {
    if (!open) return;
    const klik = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", toets);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", toets);
    };
  }, [open]);

  const change = (target: Locale) => {
    document.cookie = `locale=${target}; path=/; max-age=${365 * 86400}; SameSite=Lax`;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && isValidLocale(segments[0])) {
      segments[0] = target;
    } else {
      segments.unshift(target);
    }
    const next = `/${segments.join("/")}`;
    router.push(next);
    router.refresh();
  };

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Language: ${LOCALE_NAMES[current]}`}
          title={LOCALE_NAMES[current]}
          className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1.5 font-mono text-[11px] leading-none transition-colors hover:border-accent"
        >
          {LOCALE_LABELS[current]}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 top-full z-50 mt-2 min-w-40 overflow-hidden rounded-xl border bg-background p-1 shadow-lg">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={l === current}
                lang={l}
                onClick={() => {
                  setOpen(false);
                  if (l !== current) change(l);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-card-hover ${l === current ? "font-medium" : "text-muted hover:text-foreground"}`}
              >
                <span className="w-6 font-mono text-[11px] text-accent">{LOCALE_LABELS[l]}</span>
                <span className="flex-1">{LOCALE_NAMES[l]}</span>
                {l === current && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5 font-mono text-[11px]"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === current}
          aria-label={LOCALE_NAMES[l]}
          title={LOCALE_NAMES[l]}
          lang={l}
          className={`rounded-full px-2 py-1 leading-none transition-colors ${
            l === current
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
