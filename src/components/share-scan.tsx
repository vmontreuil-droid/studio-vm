"use client";

import { useState } from "react";
import { Share2, Copy, Check, Mail } from "lucide-react";

// Klant kan zijn scan-analyse delen — enkel vanuit zijn portaal.
// De link is de publieke token-rapportpagina (geen login nodig
// voor wie de link krijgt).
export function ShareScan({
  url,
  label,
  copied: copiedLabel,
  mail: mailLabel,
  subject,
}: {
  url: string;
  label: string;
  copied: string;
  mail: string;
  subject: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* niets — knop blijft werken via de andere opties */
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: subject, url });
        return;
      } catch {
        /* gebruiker annuleerde — val terug op kopiëren */
      }
    }
    copy();
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Share2 className="h-4 w-4" strokeWidth={2} />
        {label}
      </button>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
      >
        {done ? (
          <Check className="h-4 w-4 text-green-600" strokeWidth={2} />
        ) : (
          <Copy className="h-4 w-4" strokeWidth={2} />
        )}
        {done ? copiedLabel : "Link"}
      </button>
      <a
        href={`mailto:?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(url)}`}
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
      >
        <Mail className="h-4 w-4" strokeWidth={2} />
        {mailLabel}
      </a>
    </div>
  );
}
