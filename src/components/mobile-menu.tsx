"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, FileUp } from "lucide-react";
import { navVoor } from "@/lib/nav";
import { LangSwitcher } from "@/components/lang-switcher";
import { Logo } from "@/components/logo";
import { localePath, type Locale } from "@/lib/i18n/config";

const MM: Record<Locale, { open: string; close: string; offerte: string; taal: string }> = {
  nl: { open: "Menu openen", close: "Sluiten", offerte: "Offerte aanvragen", taal: "Taal" },
  fr: { open: "Ouvrir le menu", close: "Fermer", offerte: "Demander un devis", taal: "Langue" },
  en: { open: "Open menu", close: "Close", offerte: "Request a quote", taal: "Language" },
  de: { open: "Menü öffnen", close: "Schließen", offerte: "Angebot anfordern", taal: "Sprache" },
  es: { open: "Abrir menú", close: "Cerrar", offerte: "Solicitar presupuesto", taal: "Idioma" },
};

export function MobileMenu({ locale }: { locale: Locale }) {
  const mm = MM[locale] ?? MM.nl;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = navVoor(locale);
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const g = item.group ?? "Andere";
    (acc[g] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={mm.open}
        className="rounded-full border p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground xl:hidden"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex flex-col bg-background">
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
              aria-label={mm.close}
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

          <div className="shrink-0 border-t px-5 pt-4">
            <Link
              href={localePath(locale, "/offerte")}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
            >
              <FileUp className="h-4 w-4" strokeWidth={2} />
              {mm.offerte}
            </Link>
          </div>
          <div className="flex shrink-0 items-center justify-between px-5 py-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {mm.taal}
            </span>
            <LangSwitcher current={locale} />
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
