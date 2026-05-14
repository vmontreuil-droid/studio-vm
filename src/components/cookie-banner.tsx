"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "studio-vm-cookie-consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {}
  }, []);

  const dismiss = (choice: "accept" | "reject") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() }),
      );
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-title"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-2xl rounded-2xl border bg-background/95 p-5 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p
            id="cookie-title"
            className="font-mono text-[10px] uppercase tracking-widest text-accent"
          >
            Cookies
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">
            We gebruiken enkel functionele cookies en privacy-vriendelijke analytics
            zonder tracking. Lees meer in onze{" "}
            <Link href="/cookies" className="text-accent underline">
              cookieverklaring
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dismiss("accept")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Akkoord
            </button>
            <button
              type="button"
              onClick={() => dismiss("reject")}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              Enkel functioneel
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismiss("reject")}
          aria-label="Sluiten"
          className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
