"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n/config";

const STORAGE_KEY = "studio-vm-cookie-consent";

const T: Record<Locale, { tekst: string; link: string; ja: string; nee: string; sluit: string }> = {
  nl: { tekst: "We gebruiken enkel functionele cookies en privacy-vriendelijke analytics zonder tracking. Lees meer in onze", link: "cookieverklaring", ja: "Akkoord", nee: "Enkel functioneel", sluit: "Sluiten" },
  fr: { tekst: "Nous utilisons uniquement des cookies fonctionnels et des statistiques respectueuses de la vie privée, sans pistage. Plus d'infos dans notre", link: "politique de cookies", ja: "Accepter", nee: "Fonctionnels uniquement", sluit: "Fermer" },
  en: { tekst: "We only use functional cookies and privacy-friendly analytics without tracking. Read more in our", link: "cookie policy", ja: "Accept", nee: "Functional only", sluit: "Close" },
  de: { tekst: "Wir verwenden nur funktionale Cookies und datenschutzfreundliche Statistiken ohne Tracking. Mehr dazu in unserer", link: "Cookie-Erklärung", ja: "Einverstanden", nee: "Nur funktionale", sluit: "Schließen" },
  es: { tekst: "Solo utilizamos cookies funcionales y estadísticas respetuosas con la privacidad, sin seguimiento. Más información en nuestra", link: "política de cookies", ja: "Aceptar", nee: "Solo funcionales", sluit: "Cerrar" },
};

export function CookieBanner({ locale }: { locale: Locale }) {
  const t = T[locale];
  // Standaard zichtbaar (ook server-side gerenderd, zodat de banner in de
  // HTML staat zonder JS). Bij terugkeer na keuze verbergt de effect 'm.
  const [show, setShow] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setShow(false);
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
      id="cookie-consent"
      data-cookie-consent
      role="dialog"
      aria-label="Cookies"
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
            {t.tekst}{" "}
            <Link href={localePath(locale, "/cookies")} className="text-accent underline">
              {t.link}
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dismiss("accept")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.ja}
            </button>
            <button
              type="button"
              onClick={() => dismiss("reject")}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              {t.nee}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismiss("reject")}
          aria-label={t.sluit}
          className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
