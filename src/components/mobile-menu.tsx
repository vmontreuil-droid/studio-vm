"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { allNav } from "@/lib/nav";
import { LangSwitcher } from "@/components/lang-switcher";
import { Logo } from "@/components/logo";
import { localePath, type Locale } from "@/lib/i18n/config";

export function MobileMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const groups = allNav.reduce<Record<string, typeof allNav>>((acc, item) => {
    const g = item.group ?? "Andere";
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-full border p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground md:hidden"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-background md:hidden">
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <Link
              href={localePath(locale, "/")}
              onClick={() => setOpen(false)}
              aria-label="Studio VM"
            >
              <Logo className="text-4xl" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="rounded-full border p-2 text-muted hover:bg-card-hover hover:text-foreground"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-7">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {group}
                </p>
                <ul>
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={localePath(locale, item.href)}
                        onClick={() => setOpen(false)}
                        className="block border-b border-border/60 py-3 text-base transition-colors hover:text-accent"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-between border-t px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Taal
            </span>
            <LangSwitcher current={locale} />
          </div>
        </div>
      )}
    </>
  );
}
