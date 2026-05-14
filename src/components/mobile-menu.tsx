"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { allNav } from "@/lib/nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
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
        className="rounded-full border p-2 text-muted transition-colors hover:bg-card-hover hover:text-foreground sm:hidden"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[85] flex sm:hidden">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/40 backdrop-blur-sm"
          />
          <aside className="flex w-72 max-w-[85vw] flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                aria-label="Studio VM"
                className="font-mono text-base font-semibold tracking-tight"
              >
                <span className="text-accent">&lt;</span>
                vm
                <span className="text-accent">/&gt;</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="rounded-full p-1.5 text-muted hover:bg-card-hover hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-6">
                  <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-2 py-2 text-sm transition-colors hover:bg-card-hover"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
