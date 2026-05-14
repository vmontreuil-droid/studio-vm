"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LOCALES,
  LOCALE_LABELS,
  type Locale,
  isValidLocale,
} from "@/lib/i18n/config";

export function LangSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

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

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5 font-mono text-[11px]">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === current}
          aria-label={`Schakel naar ${l.toUpperCase()}`}
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
